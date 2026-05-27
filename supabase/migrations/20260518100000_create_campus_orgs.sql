CREATE TABLE campus_orgs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campus      TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  description TEXT,
  categories  TEXT[]      NOT NULL DEFAULT '{}',
  website     TEXT,
  email       TEXT,
  external_id TEXT,
  source_url  TEXT        NOT NULL,
  scraped_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campus, name)
);

CREATE INDEX campus_orgs_campus_idx ON campus_orgs (campus);

ALTER TABLE campus_orgs ENABLE ROW LEVEL SECURITY;

-- Authenticated @uw.edu users may read catalog data; anon is intentionally excluded.
CREATE POLICY "campus_orgs_select_authenticated"
  ON campus_orgs FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "campus_orgs_write_service_role"
  ON campus_orgs FOR ALL
  USING (auth.role() = 'service_role');

GRANT SELECT ON public.campus_orgs TO authenticated;
