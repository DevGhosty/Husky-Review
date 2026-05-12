# Actionable UWB Resume Review Proposal

This document is a Markdown reference version of the annotated proposal PDF for **Husky-Review**, whose product concept is **Actionable UWB Resume Review**. It is preserved as proposal and review material, not as a claim that every described feature is already implemented.

## Final Proposal Summary

Actionable UWB Resume Review is a web application designed to help University of Washington Bothell students strengthen their resumes for specific job postings. The project focuses on a recurring issue in the recruiting cycle: generic AI resume tools can recommend clubs, courses, certifications, or activities that do not exist at UWB or are no longer active.

To validate demand before building, the team surveyed 14 members of the UWB CSS Discord. This was a deliberate early-adopter sample of job-seeking computer science students, not a claim about the entire student body. In that sample, 11 of 14 students reported receiving recommendations from generic AI resume tools that were not actionable because they pointed to nonexistent or inactive opportunities.

The proposed solution grounds every recommendation in a curated database of real, verified UWB activities, including:

- Clubs
- Courses
- Fellowships
- Events
- Research roles

Each database entry is intended to include an active status field and a last-verified date so stale entries can be flagged and updated over time.

## Verification Plan

Database entries will be verified during population by cross-referencing each activity against official UWB sources, such as:

- Registrar listings
- DSA club directory
- Relevant department pages

Verification ownership is split across both members during Week 1:

- **Member A:** clubs and research roles
- **Member B:** courses, fellowships, and events

If more than 10% of entries cannot be verified against a live official source, those entries will be withheld from the database instead of included with uncertain status. A re-verification pass is scheduled for Week 3 to catch activities that closed or changed between initial population and deployment.

## Product Workflow

Students upload a resume and paste a job description. The system identifies skill and keyword gaps, then returns only current, verified UWB opportunities ranked by relevance and urgency.

The AI pipeline works in stages:

1. An LLM parses the resume and job posting into a structured gap analysis.
2. Those gaps are converted into embeddings.
3. The embeddings are compared against pre-embedded UWB activity descriptions using cosine similarity retrieval.
4. The LLM ranks the retrieved matches.
5. Recommendations are classified as:
   - **In-Time Activities:** actionable before the application deadline.
   - **Next-Time Activities:** longer-term investments.
6. The system produces a week-by-week action roadmap.

## Planned Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Storage and sessions:** Supabase
- **Language analysis and embeddings:** Anthropic Claude API
- **Deployment:** Vercel
- **Project website:** GitHub Pages

Resume data is planned to be automatically deleted after one hour for privacy.

## Security Plan

Security measures listed in the proposal include:

- Server-side API key storage through environment variables.
- Input length limits.
- Resume upload file-type validation.
- Supabase row-level security policies restricting session access.
- Rate limiting on the inference endpoint.
- Repository README documentation for any password-protected route credentials, if such routes are added.

## Labor Division

Labor is divided as follows:

- **Member A:** AI pipeline, embedding logic, and backend API.
- **Member B:** React frontend and GitHub Pages project website.
- **Shared:** security implementation.

Security responsibilities are further split:

- **Member A:** backend security, including API key storage, rate limiting, and row-level security configuration.
- **Member B:** frontend security, including input validation, file-type enforcement, and credential documentation.

If either member falls behind at a weekly check-in, the other member will absorb one defined task from the delayed member's list:

- Member A will take over the GitHub Pages site if Member B is blocked on frontend work past May 21.
- Member B will take over integration testing if Member A's pipeline slips past May 14.

This is intended to prevent a single point of failure from stalling the project.

## Milestones and Risk Responses

### Week 1: May 10

Week 1 front-loads database population:

- Add 50+ verified UWB activities to Supabase.
- Include active status and last-verified date for each entry.
- Verify entries against live official UWB sources.
- Split verification by category between both members.
- Complete environment setup.
- Build a basic upload flow returning raw gap text.

Risk response: if population falls short of 50 verified entries, the team will reduce the Week 2 test set scope rather than delay the pipeline.

### Week 2: May 17

Week 2 delivers:

- Full embedding pipeline.
- In-Time vs Next-Time classification.
- Validation against a manually labeled 10-resume test set.

The 10 resumes were sourced from volunteers in the UWB CSS Discord and anonymized. Each resume was independently labeled by both team members before submission to establish a gold standard.

Agreement is defined as both members assigning the same In-Time vs Next-Time classification to a given activity recommendation. The target is 80% agreement between the model output and the gold standard.

Risk response: if accuracy falls short, the retrieval prompt will be revised before Week 3 begins.

### Week 3: May 24

Week 3 focuses on:

- Frontend roadmap view.
- GitHub Pages project site.
- Re-verification of the full database.
- Usability testing with five UWB students outside the original Discord sample.

Usability participants complete two tasks:

- Run a full resume analysis.
- Locate a specific recommended activity.

Success is defined as 80%+ task completion measured by direct observation.

### Week 4: May 31

Week 4 covers:

- Deployment hardening.
- Security review checklist.
- Structured feedback survey.

The survey is administered to at least 10 UWB students recruited from outside the CSS Discord group. It uses three fixed questions:

- Overall recommendation quality on a 1-5 scale.
- Whether every suggested activity was real and currently active, yes or no.
- Whether the roadmap felt personally actionable on a 1-5 scale.

The target mean is 4/5 across the two scaled items. Recruitment begins in Week 3 through UWB course Discords and the CSS club mailing list to avoid a last-week scramble.

If fewer than 10 responses are collected by May 30, the proposal notes a fallback threshold of seven respondents, with transparent reporting of the actual sample size.

## Claude Review Summary

Claude's response graded the proposal **5 / 5** and described it as an exceptional student proposal with the previous weaknesses resolved cleanly.

### Strengths

Claude highlighted three major strengths:

- Every milestone has a complete risk loop, including Week 4 recruitment and fallback planning.
- The test set methodology is strong for a class project because resumes are volunteered, anonymized, independently labeled, and operationally evaluated.
- The instructor collaborator requirement is confirmed as already satisfied in the proposal, and the repository/deployment claims are described as independently verifiable.

### Minor Weaknesses

Claude also noted three minor weaknesses:

- The proposal does not address API cost exposure for Claude API usage, including spending limits or alerts.
- The Week 3 usability test uses direct observation but does not specify who observes or how observer consistency is handled.
- Long-term database maintenance after May 31 is outside scope but not explicitly acknowledged.

## Documentation Notes

The README should use this proposal as planning context while avoiding unsupported claims that the full application is already implemented. Any future live deployment URL, credentials for protected demo routes, or production setup instructions should be added only when they exist in the repository or deployed environment.
