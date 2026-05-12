# Husky-Review

**Actionable UWB Resume Review** is a web application concept for helping University of Washington Bothell students improve their resumes for specific job postings. Instead of giving generic resume advice, the project is designed to recommend real UWB opportunities that students can act on, including verified clubs, courses, fellowships, events, and research roles.

The repository currently contains a mocked React frontend prototype plus the project proposal documentation. Backend analysis, Supabase storage, and AI integration are planned future work.

## Problem

Generic AI resume tools often suggest activities that are not available to UWB students, no longer active, or disconnected from the local campus context. In the project proposal, 11 of 14 surveyed UWB CSS Discord members reported receiving recommendations from generic AI resume tools for clubs, courses, or certifications that did not exist at UWB or were no longer active.

Husky-Review addresses that gap by grounding recommendations in a curated database of verified UWB activities. Each activity is intended to include an active status and a last-verified date so stale entries can be flagged, updated, or withheld.

## Intended Workflow

1. A student uploads a resume.
2. The student pastes a job description.
3. The system analyzes the resume and job posting for skill and keyword gaps.
4. The system retrieves relevant verified UWB activities from the database.
5. The student receives ranked recommendations grouped into:
   - **In-Time Activities**: actionable before the application deadline.
   - **Next-Time Activities**: longer-term opportunities for future applications.
6. The result is presented as a week-by-week action roadmap.

## Planned Features

- Resume and job description parsing.
- Structured gap analysis for missing skills, keywords, and experience signals.
- Verified UWB activity database with source, active status, and last-verified date.
- Embedding-based retrieval against pre-embedded activity descriptions.
- LLM-assisted ranking and classification of recommendations.
- In-Time vs Next-Time activity grouping.
- Week-by-week roadmap for improving a resume before or after a deadline.
- Privacy-conscious session handling with resume data deleted after one hour.

## Planned Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database and sessions:** Supabase
- **AI analysis and embeddings:** Anthropic Claude API
- **Deployment target:** Vercel
- **Project site target:** GitHub Pages

## Security and Privacy Goals

- Store API keys only on the server through environment variables.
- Validate resume file type before upload processing.
- Enforce input length limits for resumes and job descriptions.
- Apply rate limiting to inference endpoints.
- Use Supabase row-level security policies for session access.
- Automatically delete uploaded resume/session data after one hour.
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
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Do not commit real API keys or production credentials.

## Proposal Milestones

The proposal organizes the project into four milestones:

- **Week 1:** Populate 50+ verified UWB activities, set up the environment, and build a basic upload flow that returns raw gap text.
- **Week 2:** Implement the full embedding pipeline and In-Time vs Next-Time classification, validated against a manually labeled 10-resume test set.
- **Week 3:** Build the frontend roadmap view and GitHub Pages project site, then re-verify the activity database and run usability testing with five UWB students.
- **Week 4:** Harden deployment, complete a security review checklist, and collect structured feedback from at least 10 UWB students.

For the full proposal and review notes, see [docs/proposal.md](docs/proposal.md).

## Evaluation Targets

- 50+ verified UWB activities in the database.
- Fewer than 10% unverifiable entries included; unverifiable entries should be withheld.
- 80% agreement between model output and the manually labeled gold standard for In-Time vs Next-Time classification.
- 80%+ task completion during usability testing.
- Mean feedback score of 4/5 across scaled survey items for recommendation quality and roadmap actionability.
