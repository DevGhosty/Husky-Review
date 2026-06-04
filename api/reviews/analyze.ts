import { randomUUID } from 'node:crypto';
import { isValidGeminiApiKey, normalizeGeminiApiKey } from '../gemini-api.js';
import { requireAuth } from '../auth0-verify.js';
import {
  MAX_JOB_DESCRIPTION_CHARS,
  MAX_POSTING_URL_CHARS,
  MIN_JOB_DESCRIPTION_CHARS,
  normalizeJobPostingUrl,
  resolveJobDescription,
} from '../job-posting.js';
import { getSupabaseAdmin, sendError, sendInternalError, setApiHeaders, type ResumeRow } from '../supabase-admin.js';
import { filterActivitiesByInterests, parseActivityInterests } from '../catalog-filters.js';
import {
  buildReviewAnalysis,
  extractResumeText,
  isUsableExtractedResumeText,
  type ActivityRow,
} from '../review-analysis.js';
import { checkAppKeyQuota, consumeAppKeyQuota, deterministicQuotaStatus, getAppGeminiKey, userKeyQuotaStatus } from '../review-quota.js';
import {
  dedupeCatalogActivities,
  reconcileActivityCampus,
} from '../catalog-campus.js';
import { campusNameToCampus, getCompletedProfileCampus, type ProfileCompletionRow } from '../profile-completion.js';

type Campus = ActivityRow['campus'];

interface ProfileRow extends ProfileCompletionRow {
  include_other_campuses: boolean | null;
  activity_interests: string[] | null;
  prioritize_in_time: boolean | null;
  include_long_term: boolean | null;
}

function campusToCourseCode(campus: Campus) {
  if (campus === 'bothell') return 'B';
  if (campus === 'tacoma') return 'T';
  return '';
}

function campusToOrgName(campus: Campus) {
  if (campus === 'bothell') return 'Bothell';
  if (campus === 'tacoma') return 'Tacoma';
  return 'Seattle';
}

function requireCompleteProfile(profile: ProfileRow | null): {
  campus: Campus;
  includeOtherCampuses: boolean;
  activityInterests: ReturnType<typeof parseActivityInterests>;
  prioritizeInTime: boolean;
  includeLongTerm: boolean;
} {
  const campus = getCompletedProfileCampus(profile);

  if (!campus) {
    const error = new Error('Complete your profile with name, major, and campus before running a review.');
    (error as any).statusCode = 409;
    throw error;
  }

  return {
    campus,
    includeOtherCampuses: Boolean(profile?.include_other_campuses),
    activityInterests: parseActivityInterests(profile?.activity_interests),
    prioritizeInTime: profile?.prioritize_in_time !== false,
    includeLongTerm: profile?.include_long_term !== false,
  };
}

function validateAnalyzeBody(body: any) {
  const resumeId = typeof body?.resumeId === 'string' ? body.resumeId.trim() : '';
  const jobDescription = typeof body?.jobDescription === 'string' ? body.jobDescription.trim() : '';
  const jobPostingUrl = typeof body?.jobPostingUrl === 'string' ? body.jobPostingUrl.trim() : '';
  const deadline = typeof body?.deadline === 'string' ? body.deadline.trim() : '';
  const userApiKey = normalizeGeminiApiKey(body?.userApiKey);

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

  if (userApiKey && !isValidGeminiApiKey(userApiKey)) {
    const error = new Error(
      'Enter a valid Gemini API key from Google AI Studio (aistudio.google.com/apikey), or leave the field blank.',
    );
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
    campus: recommendation.campus || null,
    last_verified: recommendation.lastVerified || null,
    confidence: recommendation.confidence || 0,
    source_label: recommendation.sourceLabel || 'UW catalog source',
    roadmap_week: recommendation.roadmapWeek || 1,
    roadmap_action: recommendation.roadmapAction || '',
    timing_note: recommendation.timingNote || null,
    selected: selectedIds.includes(recommendation.id),
  }));
}

function normalizeActivityRows(rows: any[]): ActivityRow[] {
  return rows
    .map((activity) => {
      const campus = reconcileActivityCampus(campusNameToCampus(activity.campus), activity.source_url);
      if (!campus) return null;
      return {
        id: String(activity.id),
        name: activity.name,
        category: activity.category,
        campus,
        description: activity.description,
        skills: activity.skills,
        source_url: activity.source_url,
        active: activity.active !== false,
        last_verified: activity.last_verified,
        time_commitment: activity.time_commitment,
        duration: activity.duration,
        registration_info: activity.registration_info,
      };
    })
    .filter((activity): activity is ActivityRow =>
      Boolean(activity && activity.name && activity.source_url && activity.last_verified),
    );
}

function normalizeCampusOrgRows(rows: any[]): ActivityRow[] {
  return rows
    .map((org) => {
      const campus = campusNameToCampus(org.campus);
      if (!campus) return null;
      const verifiedAt = typeof org.scraped_at === 'string' ? org.scraped_at.slice(0, 10) : new Date().toISOString().slice(0, 10);
      return {
        id: `org:${org.id}`,
        name: org.name,
        category: 'club',
        campus,
        description: org.description,
        skills: Array.isArray(org.categories) ? org.categories : [],
        source_url: org.website || org.source_url,
        active: true,
        last_verified: verifiedAt,
        time_commitment: null,
        duration: 'ongoing',
        registration_info: org.email ? `Contact ${org.email}` : 'Check the organization source for joining details',
      };
    })
    .filter(Boolean) as ActivityRow[];
}

function normalizeCourseRows(rows: any[]): ActivityRow[] {
  return rows
    .map((course) => {
      const campus = campusNameToCampus(course.campus);
      if (!campus) return null;
      const courseCode = `${course.department || ''} ${course.course_number || ''}`.trim();
      const name = `${courseCode}${course.course_title ? `: ${course.course_title}` : ''}`.trim();
      const verifiedAt = typeof course.scraped_at === 'string' ? course.scraped_at.slice(0, 10) : new Date().toISOString().slice(0, 10);
      return {
        id: `course:${course.id}`,
        name,
        category: 'course',
        campus,
        description: [
          course.section ? `Section ${course.section}` : '',
          course.credits ? `${course.credits} credits` : '',
          course.instructor ? `Instructor: ${course.instructor}` : '',
          course.status ? `Status: ${course.status}` : '',
        ].filter(Boolean).join('. '),
        skills: [course.department, course.course_title].filter(Boolean),
        source_url: course.source_url || 'https://www.washington.edu/students/timeschd/',
        active: course.status ? !/^closed$/i.test(course.status) : true,
        last_verified: verifiedAt,
        time_commitment: [course.meeting_days, course.meeting_time].filter(Boolean).join(' ') || null,
        duration: course.quarter || null,
        registration_info: course.sln ? `SLN ${course.sln}` : null,
      };
    })
    .filter(Boolean) as ActivityRow[];
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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, major, campus, include_other_campuses, profile_completed_at, activity_interests, prioritize_in_time, include_long_term')
      .eq('auth0_user_id', auth.userId)
      .maybeSingle<ProfileRow>();

    if (profileError) {
      return sendInternalError(res, 'Failed to fetch profile for analysis', profileError);
    }

    const profileScope = requireCompleteProfile(profile);
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
    const resumeText = await extractResumeText(resumeBuffer, resumeRow.content_type, resumeRow.filename);
    if (!isUsableExtractedResumeText(resumeText, resumeRow.filename)) {
      const looksLikeFilenameOnly =
        resumeText.trim().toLowerCase() === resumeRow.filename.trim().toLowerCase();
      return res.status(422).json({
        message: looksLikeFilenameOnly
          ? 'We could not parse text from this PDF on the server. Try re-uploading as a .docx, or export the PDF again with selectable text (Print to PDF from Word/Google Docs).'
          : 'We could not read enough text from this resume file. Export a text-based PDF (not a scan-only image), or upload a .docx with selectable text.',
      });
    }
    const resolvedPosting = await resolveJobDescription({
      jobDescription: input.jobDescription,
      jobPostingUrl: input.jobPostingUrl,
    });

    const catalogLimits = profileScope.includeOtherCampuses
      ? { activities: 200, orgs: 150, courses: 80 }
      : { activities: 100, orgs: 80, courses: 60 };

    let activitiesQuery = supabase
      .from('activities')
      .select('id, name, category, campus, description, skills, source_url, active, last_verified, time_commitment, duration, registration_info')
      .eq('active', true)
      .not('last_verified', 'is', null)
      .limit(catalogLimits.activities);
    let orgsQuery = supabase
      .from('campus_orgs')
      .select('id, campus, name, description, categories, website, email, source_url, scraped_at')
      .limit(catalogLimits.orgs);
    let coursesQuery = supabase
      .from('course_sections')
      .select('id, campus, quarter, department, course_number, course_title, sln, section, credits, meeting_days, meeting_time, instructor, status, source_url, scraped_at')
      .limit(catalogLimits.courses);

    if (!profileScope.includeOtherCampuses) {
      activitiesQuery = activitiesQuery.eq('campus', profileScope.campus);
      orgsQuery = orgsQuery.eq('campus', campusToOrgName(profileScope.campus));
      coursesQuery = coursesQuery.eq('campus', campusToCourseCode(profileScope.campus));
    }

    const [
      { data: activities, error: activitiesError },
      { data: campusOrgs, error: campusOrgsError },
      { data: courseSections, error: courseSectionsError },
    ] = await Promise.all([activitiesQuery, orgsQuery, coursesQuery]);

    if (activitiesError) {
      return sendInternalError(res, 'Failed to fetch verified UW activities', activitiesError);
    }
    if (campusOrgsError) {
      return sendInternalError(res, 'Failed to fetch verified UW campus organizations', campusOrgsError);
    }
    if (courseSectionsError) {
      return sendInternalError(res, 'Failed to fetch verified UW course sections', courseSectionsError);
    }

    const catalogActivities = filterActivitiesByInterests(
      dedupeCatalogActivities([
        ...normalizeActivityRows(activities || []),
        ...normalizeCampusOrgRows(campusOrgs || []),
        ...normalizeCourseRows(courseSections || []),
      ]),
      profileScope.activityInterests,
    );

    const reviewId = randomUUID();
    const analysis = await buildReviewAnalysis({
      reviewId,
      resumeId: resumeRow.id,
      fileName: resumeRow.filename,
      resumeText,
      jobDescription: resolvedPosting.jobDescription,
      jobPostingUrl: resolvedPosting.jobPostingUrl,
      deadline: input.deadline,
      activities: catalogActivities,
      profileCampus: profileScope.campus,
      includeOtherCampuses: profileScope.includeOtherCampuses,
      activityInterests: profileScope.activityInterests,
      prioritizeInTime: profileScope.prioritizeInTime,
      includeLongTerm: profileScope.includeLongTerm,
      geminiApiKey: input.userApiKey || undefined,
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
      fallbackReason: 'fallbackReason' in analysis ? analysis.fallbackReason : null,
      geminiErrorMessage:
        'geminiErrorMessage' in analysis && typeof analysis.geminiErrorMessage === 'string'
          ? analysis.geminiErrorMessage
          : null,
      geminiKeySource:
        'geminiKeySource' in analysis &&
        (analysis.geminiKeySource === 'user' || analysis.geminiKeySource === 'app' || analysis.geminiKeySource === 'none')
          ? analysis.geminiKeySource
          : usingUserKey
            ? 'user'
            : appKey
              ? 'app'
              : 'none',
      createdAt: review?.created_at || analysis.createdAt,
      updatedAt: review?.updated_at || analysis.updatedAt,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
