-- Stores live course-section data scraped from the UW Time Schedule.
-- Each row is one section (one SLN) for a given campus + quarter.
-- Unique on (campus, quarter, sln) so upserts are idempotent.

CREATE TABLE course_sections (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campus           TEXT        NOT NULL,   -- 'B' = Bothell, 'T' = Tacoma, '' = Seattle
  quarter          TEXT        NOT NULL,   -- 'SPR2026', 'WIN2026', 'AUT2025', …
  department       TEXT        NOT NULL,   -- 'CSS', 'CSSE', etc.
  course_number    TEXT        NOT NULL,   -- '342', '430', etc.
  course_title     TEXT,
  sln              TEXT        NOT NULL,   -- 5-digit Schedule Line Number
  section          TEXT,                   -- 'A', 'B', 'AA', etc.
  credits          TEXT,
  meeting_days     TEXT,                   -- 'MW', 'TTh', 'MWF', 'ARR', …
  meeting_time     TEXT,                   -- e.g. '9:00 AM–10:20 AM'
  building         TEXT,
  room             TEXT,
  instructor       TEXT,
  enrollment_open  INTEGER,                -- seats currently open (NULL if not shown)
  enrollment_limit INTEGER,               -- total seat limit
  status           TEXT,                   -- 'Open', 'Closed', 'Restr', …
  source_url       TEXT,
  scraped_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campus, quarter, sln)
);

CREATE INDEX course_sections_quarter_idx     ON course_sections (quarter);
CREATE INDEX course_sections_dept_idx        ON course_sections (department);
CREATE INDEX course_sections_course_num_idx  ON course_sections (department, course_number);
CREATE INDEX course_sections_instructor_idx  ON course_sections (instructor);

ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;

-- Authenticated @uw.edu users may read catalog data; anon is intentionally excluded.
CREATE POLICY "course_sections_select_authenticated"
  ON course_sections FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "course_sections_write_service_role"
  ON course_sections FOR ALL
  USING (auth.role() = 'service_role');

GRANT SELECT ON public.course_sections TO authenticated;
