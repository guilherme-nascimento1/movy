-- ============================================================
-- Movy v4 — CRM Inteligente + v5.1 Meta Conversions
-- Rodar no SQL Editor do Supabase (produção)
-- ============================================================

-- 4.1 Lead Scoring
ALTER TABLE "Lead"
  ADD COLUMN IF NOT EXISTS "score"          INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "scoreUpdatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "scoreBreakdown" JSONB;

CREATE INDEX IF NOT EXISTS "Lead_tenantId_score_idx" ON "Lead"("tenantId", "score");

-- 4.2 SLA por Etapa
ALTER TABLE "Lead"
  ADD COLUMN IF NOT EXISTS "assignedTo"     TEXT,
  ADD COLUMN IF NOT EXISTS "stageEnteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "stageSlaHours"  INTEGER NOT NULL DEFAULT 24;

-- 4.4 UTM Tracking
ALTER TABLE "Lead"
  ADD COLUMN IF NOT EXISTS "utmSource"   TEXT,
  ADD COLUMN IF NOT EXISTS "utmMedium"   TEXT,
  ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT,
  ADD COLUMN IF NOT EXISTS "utmContent"  TEXT;

-- 4.5 Aula Experimental
ALTER TABLE "Lead"
  ADD COLUMN IF NOT EXISTS "trialClassAt"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "trialClassAttended" BOOLEAN NOT NULL DEFAULT false;

-- 4.3 LeadEvent
CREATE TABLE IF NOT EXISTS "LeadEvent" (
  "id"        TEXT        NOT NULL,
  "leadId"    TEXT        NOT NULL,
  "tenantId"  TEXT        NOT NULL,
  "type"      TEXT        NOT NULL,
  "payload"   JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "LeadEvent_leadId_idx"   ON "LeadEvent"("leadId");
CREATE INDEX IF NOT EXISTS "LeadEvent_tenantId_idx" ON "LeadEvent"("tenantId");

-- 4.6 NPS
CREATE TABLE IF NOT EXISTS "NpsResponse" (
  "id"        TEXT        NOT NULL,
  "tenantId"  TEXT        NOT NULL,
  "studentId" TEXT,
  "leadId"    TEXT,
  "score"     INTEGER     NOT NULL,
  "comment"   TEXT,
  "type"      TEXT        NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NpsResponse_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NpsResponse_tenantId_idx"      ON "NpsResponse"("tenantId");
CREATE INDEX IF NOT EXISTS "NpsResponse_tenantId_type_idx" ON "NpsResponse"("tenantId", "type");

-- 4.8 Reativação
ALTER TABLE "Student"
  ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;

-- TenantSettings v4 — leadSlaConfig + welcomeJourney
ALTER TABLE "TenantSettings"
  ADD COLUMN IF NOT EXISTS "leadSlaConfig"  JSONB NOT NULL DEFAULT '{"NEW":24,"CONTACTED":72,"DEMO":48,"NEGOTIATION":96}',
  ADD COLUMN IF NOT EXISTS "welcomeJourney" JSONB NOT NULL DEFAULT '{"d1":true,"d7":true,"d30":true,"d60":true,"d90":true}';
