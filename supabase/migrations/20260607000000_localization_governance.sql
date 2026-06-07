CREATE TABLE IF NOT EXISTS localization_locales (
  tenant_id VARCHAR(64) NOT NULL,
  id VARCHAR(64) NOT NULL,
  locale_code VARCHAR(35) NOT NULL,
  source_locale VARCHAR(35) NOT NULL,
  policy_id VARCHAR(64) NOT NULL DEFAULT 'default',
  active_version_id VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, locale_code)
);
CREATE INDEX IF NOT EXISTS idx_localization_locales_tenant
  ON localization_locales (tenant_id, locale_code);

CREATE TABLE IF NOT EXISTS localization_catalog_versions (
  tenant_id VARCHAR(64) NOT NULL,
  id VARCHAR(64) NOT NULL,
  locale_id VARCHAR(64) NOT NULL,
  locale_code VARCHAR(35) NOT NULL,
  version_number INT NOT NULL,
  source_catalog_version INT NOT NULL,
  source_content_hash CHAR(64) NOT NULL,
  content_hash CHAR(64) NOT NULL,
  state VARCHAR(32) NOT NULL,
  messages JSONB NOT NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by VARCHAR(128) NOT NULL,
  approved_by VARCHAR(128),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, locale_id, version_number),
  FOREIGN KEY (tenant_id, locale_id)
    REFERENCES localization_locales (tenant_id, id)
);
CREATE INDEX IF NOT EXISTS idx_localization_versions_tenant
  ON localization_catalog_versions (tenant_id, locale_id, version_number);

CREATE TABLE IF NOT EXISTS localization_validation_reports (
  tenant_id VARCHAR(64) NOT NULL,
  id VARCHAR(64) NOT NULL,
  catalog_version_id VARCHAR(64) NOT NULL,
  validator_version VARCHAR(32) NOT NULL,
  content_hash CHAR(64) NOT NULL,
  source_content_hash CHAR(64) NOT NULL,
  passed BOOLEAN NOT NULL,
  coverage NUMERIC(6, 3) NOT NULL,
  checks JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, catalog_version_id),
  FOREIGN KEY (tenant_id, catalog_version_id)
    REFERENCES localization_catalog_versions (tenant_id, id)
);
CREATE INDEX IF NOT EXISTS idx_localization_validations_tenant
  ON localization_validation_reports (tenant_id, catalog_version_id);

CREATE TABLE IF NOT EXISTS localization_review_assignments (
  tenant_id VARCHAR(64) NOT NULL,
  id VARCHAR(64) NOT NULL,
  locale_id VARCHAR(64) NOT NULL,
  reviewer_id VARCHAR(64) NOT NULL,
  reviewer_role VARCHAR(32) NOT NULL,
  assigned_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, locale_id, reviewer_role, reviewer_id),
  FOREIGN KEY (tenant_id, locale_id)
    REFERENCES localization_locales (tenant_id, id)
);
CREATE INDEX IF NOT EXISTS idx_localization_assignments_tenant
  ON localization_review_assignments (tenant_id, locale_id, reviewer_role);

CREATE TABLE IF NOT EXISTS localization_review_decisions (
  tenant_id VARCHAR(64) NOT NULL,
  id VARCHAR(64) NOT NULL,
  catalog_version_id VARCHAR(64) NOT NULL,
  content_hash CHAR(64) NOT NULL,
  reviewer_id VARCHAR(64) NOT NULL,
  reviewer_role VARCHAR(32) NOT NULL,
  decision VARCHAR(32) NOT NULL,
  comment VARCHAR(1000) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, catalog_version_id, reviewer_role, reviewer_id),
  FOREIGN KEY (tenant_id, catalog_version_id)
    REFERENCES localization_catalog_versions (tenant_id, id)
);
CREATE INDEX IF NOT EXISTS idx_localization_reviews_tenant
  ON localization_review_decisions (tenant_id, catalog_version_id);

CREATE TABLE IF NOT EXISTS localization_activation_history (
  tenant_id VARCHAR(64) NOT NULL,
  id VARCHAR(64) NOT NULL,
  locale_id VARCHAR(64) NOT NULL,
  catalog_version_id VARCHAR(64) NOT NULL,
  previous_catalog_version_id VARCHAR(64),
  action VARCHAR(32) NOT NULL,
  actor_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, locale_id)
    REFERENCES localization_locales (tenant_id, id),
  FOREIGN KEY (tenant_id, catalog_version_id)
    REFERENCES localization_catalog_versions (tenant_id, id)
);
CREATE INDEX IF NOT EXISTS idx_localization_activations_tenant
  ON localization_activation_history (tenant_id, locale_id, created_at);
