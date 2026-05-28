import { randomUUID } from 'node:crypto';
import { requireAuth } from '../auth0-verify.js';
import {
  MAX_JOB_DESCRIPTION_CHARS,
  MAX_POSTING_URL_CHARS,
  MIN_JOB_DESCRIPTION_CHARS,
  normalizeJobPostingUrl,
  resolveJobDescription,
} from '../job-posting.js';
import { getSupabaseAdmin, sendError, sendInternalError, setApiHeaders, type ResumeRow } from '../supabase-admin.js';
import { buildReviewAnalysis, extractResumeText, type ActivityRow } from '../review-analysis.js';
import { checkAppKeyQuota, consumeAppKeyQuota, deterministicQuotaStatus, getAppGeminiKey, userKeyQuotaStatus } from '../review-quota.js';

function validateAnalyzeBody(body: any) {
  const resumeId = typeof body?.resumeId === 'string' ? body.resumeId.trim() : '';
  const jobDescription = typeof body?.jobDescription === 'string' ? body.jobDescription.trim() : '';
  const jobPostingUrl = typeof body?.jobPostingUrl === 'string' ? body.jobPostingUrl.trim() : '';
  const deadline = typeof body?.deadline === 'string' ? body.deadline.trim() : '';
  const userApiKey = typeof body?.userApiKey === 'string' ? body.userApiKey.trim() : '';

  if (!resumeId) {
    const error = new Error('Resume ID required');
    (error as any).statusCode = 400;
    throw error;
  }

  if (jobDescription.length < MIN_JOB_DESCRIPTION_CHARS && !jobPostingUrl) {
    const error = new Error('Paste a job description or provide a posting URL');
    (error as any).statusCode = 400;
    throw error;
  }

  if (jobDescription.length > MAX_JOB_DESCRIPTION_CHARS) {
    const error = new Error('Job description is too long');
    (error as any).statusCode = 400;
    throw error;
  }

  if (jobPostingUrl.length > MAX_POSTING_URL_CHARS) {
    const error = new Error('Job posting URL is too long');
    (error as any).statusCode = 400;
    throw error;
  }

  if (jobPostingUrl) {
    normalizeJobPostingUrl(jobPostingUrl);
  }

  if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    const error = new Error('Deadline must use YYYY-MM-DD format');
    (error as any).statusCode = 400;
    throw error;
  }

  if (userApiKey && !/^sk-ant-[a-zA-Z0-9_-]{20,}$/.test(userApiKey)) {
    const error = new Error('Enter a valid Anthropic API key or leave the field blank');
    (error as any).statusCode = 400;
    throw error;
  }

  return { resumeId, jobDescription, jobPostingUrl, deadline, userApiKey };
}

function toRecommendationRows(reviewId: string, selectedIds: string[], recommendations: any[]) {
  return recommendations.map((recommendation) => ({
    id: recommendation.id,
    review_id: reviewId,
    activity_id: /^[0-9a-f-]{36}$/i.test(recommendation.id) ? recommendation.id : null,
    name: recommendation.name,
    recommendation_group: recommendation.group,
    activity_type: recommendation.type,
    why_it_helps: recommendation.whyItHelps,
    tags: recommendation.tags || [],
    active: recommendation.active !== false,
    last_verified: recommendation.lastVerified || null,
    confidence: recommendation.confidence || 0,
    source_label: recommendation.sourceLabel || 'UWB catalog source',
    roadmap_week: recommendation.roadmapWeek || 1,
    roadmap_action: recommendation.roadmapAction || '',
    selected: selectedIds.includes(recommendation.id),
  }));
}

function toRoadmapRows(reviewId: string, roadmapWeeks: any[]) {
  const seenIds = new Set<string>();

  return roadmapWeeks.flatMap((week) =>
    (week.actions || []).map((action: any, actionIndex: number) => {
      const rawId = typeof action.id === 'string' && action.id.trim()
        ? action.id.trim()
        : `week-${week.week}-action-${actionIndex + 1}`;
      let id = rawId.slice(0, 120);
      if (seenIds.has(id)) {
        id = `${id.slice(0, 80)}-${randomUUID()}`;
      }
      seenIds.add(id);

      return {
        id,
        review_id: reviewId,
        week: week.week,
        text: action.text,
        detail: action.detail,
      };
    }),
  );
}

export default async function handler(req: any, res: any) {
  setApiHeaders(res, 'POST', req.headers?.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const auth = await requireAuth(req.headers.authorization);
    const input = validateAnalyzeBody(req.body);
    const supabase = getSupabaseAdmin();
    const appKey = getAppGeminiKey();
    const usingUserKey = Boolean(input.userApiKey);
    let quota = usingUserKey ? userKeyQuotaStatus() : appKey ? null : deterministicQuotaStatus();

    if (!usingUserKey && appKey) {
      quota = await checkAppKeyQuota(supabase, auth.userId);
    }

    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('id, auth0_user_id, filename, storage_path, content_type, size_bytes, metadata, created_at, updated_at')
      .eq('id', input.resumeId)
      .eq('auth0_user_id', auth.userId)
      .maybeSingle();

    if (resumeError) {
      return sendInternalError(res, 'Failed to fetch resume for analysis', resumeError);
    }

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const resumeRow = resume as ResumeRow;
    const { data: fileData, error: downloadError } = await supabase.storage.from('resumes').download(resumeRow.storage_path);
    if (downloadError || !fileData) {
      return sendInternalError(res, 'Failed to download resume for analysis', downloadError);
    }

    const resumeBuffer = Buffer.from(await fileData.arrayBuffer());
    const resumeText = extractResumeText(resumeBuffer, resumeRow.content_type, resumeRow.filename);
    const resolvedPosting = await resolveJobDescription({
      jobDescription: input.jobDescription,
      jobPostingUrl: input.jobPostingUrl,
    });

    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, name, category, description, skills, source_url, active, last_verified, time_commitment, duration, registration_info')
      .eq('active', true)
      .not('last_verified', 'is', null)
      .limit(80);

    if (activitiesError) {
      return sendInternalError(res, 'Failed to fetch verified UWB activities', activitiesError);
    }

    const reviewId = randomUUID();
    const analysis = await buildReviewAnalysis({
      reviewId,
      resumeId: resumeRow.id,
      fileName: resumeRow.filename,
      resumeText,
      jobDescription: resolvedPosting.jobDescription,
      jobPostingUrl: resolvedPosting.jobPostingUrl,
      deadline: input.deadline,
      activities: (activities || []) as ActivityRow[],
      anthropicApiKey: input.userApiKey || appKey || undefined,
      apiKeySource: input.userApiKey ? 'user-key' : appKey ? 'app-key' : undefined,
    });

    if (!usingUserKey && appKey && analysis.aiProvider === 'app-key') {
      quota = await consumeAppKeyQuota(supabase, auth.userId);
    }

    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        id: reviewId,
        auth0_user_id: auth.userId,
        resume_id: resumeRow.id,
        title: analysis.title,
        role: analysis.role,
        job_description: resolvedPosting.jobDescription,
        job_posting_url: resolvedPosting.jobPostingUrl || null,
        deadline: input.deadline || null,
        match_score: analysis.matchScore.score,
        analysis,
        selected_recommendation_ids: analysis.selectedIds,
        ai_provider: analysis.aiProvider,
      })
      .select('created_at, updated_at')
      .single();

    if (reviewError) {
      return sendInternalError(res, 'Failed to save review', reviewError);
    }

    const recommendationRows = toRecommendationRows(reviewId, analysis.selectedIds, analysis.recommendations);
    if (recommendationRows.length) {
      const { error } = await supabase.from('review_recommendations').insert(recommendationRows);
      if (error) {
        return sendInternalError(res, 'Failed to save review recommendations', error);
      }
    }

    const roadmapRows = toRoadmapRows(reviewId, analysis.roadmapWeeks);
    if (roadmapRows.length) {
      const { error } = await supabase.from('review_roadmap_actions').insert(roadmapRows);
      if (error) {
        return sendInternalError(res, 'Failed to save review roadmap actions', error);
      }
    }

    return res.status(201).json({
      ...analysis,
      quota: analysis.aiProvider === 'user-key'
        ? userKeyQuotaStatus()
        : analysis.aiProvider === 'app-key'
          ? quota
          : deterministicQuotaStatus(),
      createdAt: review?.created_at || analysis.createdAt,
      updatedAt: review?.updated_at || analysis.updatedAt,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
