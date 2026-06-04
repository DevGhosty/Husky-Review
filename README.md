# Husky-Review

**Actionable UW Resume Review** helps University of Washington students improve resumes for specific job postings. Instead of generic advice, it recommends real UW opportunities students can act on: verified clubs, courses, fellowships, events, and research roles.

The app includes Auth0-protected workspace routes, Supabase-backed resume and review persistence, scraped and curated UW catalog data, and a server-side analysis endpoint. First-time users complete a profile (name, major, campus) before running reviews. Recommendations default to the home campus with an opt-in cross-campus setting. When `GEMINI_API_KEY` is configured, `/api/reviews/analyze` uses Gemini with a 2-review weekly app-key limit per user. Students can paste their own Gemini key for additional reviews; that key is request-only and is not stored. Without a server key, analysis falls back to deterministic catalog matching.

## Problem

Generic AI resume tools often suggest activities that are not available to UW students, no longer active, or disconnected from the local campus context. In the project proposal, 11 of 14 surveyed UWB CSS Discord members reported receiving recommendations from generic AI resume tools for clubs, courses, or certifications that did not exist at UWB or were no longer active.

Husky-Review addresses that gap by grounding recommendations in a curated database of verified UW activities. Each activity is intended to include an active status and a last-verified date so stale entries can be flagged, updated, or withheld.

## Intended Workflow

1. A student uploads a resume.
2. On first sign-in, the student completes a profile with name, major, and campus.
3. The student pastes a job description.
4. The system analyzes the resume and job posting for skill and keyword gaps.
5. The system retrieves relevant verified UW activities from the database, scoped to the student's campus unless cross-campus recommendations are enabled.
6. The student receives ranked recommendations grouped into:
   - **In-Time Activities**: actionable before the application deadline.
   - **Next-Time Activities**: longer-term opportunities for future applications.
7. The result is presented as a week-by-week action roadmap.

## Repository Branches

- **`development`** — active integration branch; deploy previews from here.
- **`main`** — release branch for production; merge from `development` when ready.

Open [PR #60](https://github.com/DevGhosty/Husky-Review/pull/60) merges the latest `development` work into `main` (requires an approving review from another collaborator because of branch protection).

## Features

- Resume upload and server-side text extraction.
- Structured gap analysis for missing skills, keywords, and experience signals.
- Verified UW activity database with source, active status, and last-verified date.
- Catalog-backed retrieval against verified activity descriptions and skills.
- Optional Gemini-assisted ranking and classification of recommendations.
- Per-user weekly app-key review quota, with bring-your-own-key support for extra reviews.
- Token-conscious AI context packing: trimmed resume/posting text plus only the top verified catalog candidates.
- In-Time vs Next-Time activity grouping.
- Week-by-week roadmap for improving a resume before or after a deadline.
- Privacy-conscious account handling with scheduled cleanup for uploaded resume files.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Vercel serverless API routes
- **Database and sessions:** Supabase
- **AI analysis:** Google Gemini API with deterministic local fallback
- **Deployment target:** Vercel
- **Project site target:** GitHub Pages

## Security and Privacy Goals

- Store the app API key only on the server through environment variables; user-supplied Gemini keys are request-only and not persisted.
- Validate resume file type before upload processing.
- Enforce input length limits for resumes and job descriptions.
- Apply rate limiting to inference endpoints.
- Use Supabase row-level security policies for session access.
- Remove unused resume uploads through scheduled cleanup; resumes tied to saved reviews stay until you delete them.
- Document any protected-route credentials in this README only if such routes are added.

## Local Setup

Install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
```

Create a local environment file from the example once one is added:

```bash
cp .env.example .env
```

Expected environment variables may include:

```bash
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

Do not commit real API keys or production credentials.

Run Supabase migrations before enabling review analysis in a deployed environment. The profile campus columns and `profile_completed_at` marker are required because the API rejects analysis requests from incomplete profiles.

For production checks, see [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md).

## Proposal Milestones

The proposal organizes the project into four milestones:

- **Week 1:** Populate 50+ verified UW activities, set up the environment, and build a basic upload flow that returns raw gap text.
- **Week 2:** Implement the full embedding pipeline and In-Time vs Next-Time classification, validated against a manually labeled 10-resume test set.
- **Week 3:** Build the frontend roadmap view and GitHub Pages project site, then re-verify the activity database and run usability testing with five UW students.
- **Week 4:** Harden deployment, complete a security review checklist, and collect structured feedback from at least 10 UW students.

For the full proposal and review notes, see [docs/proposal.md](docs/proposal.md).

## Evaluation Targets

- 50+ verified UW activities in the database.
- Fewer than 10% unverifiable entries included; unverifiable entries should be withheld.
- 80% agreement between model output and the manually labeled gold standard for In-Time vs Next-Time classification.
- 80%+ task completion during usability testing.
- Mean feedback score of 4/5 across scaled survey items for recommendation quality and roadmap actionability.
