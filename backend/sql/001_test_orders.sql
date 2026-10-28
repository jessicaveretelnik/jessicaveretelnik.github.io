-- Test-only order event ledger. Apply only to an isolated test PostgreSQL database.
-- Do not run fulfillment, shipping or customer notifications from these records.
BEGIN;
CREATE TABLE IF NOT EXISTS stripe_test_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  session_id TEXT,
  payment_status TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_id_not_blank CHECK (length(event_id) > 0)
);
CREATE TABLE IF NOT EXISTS stripe_test_orders (
  session_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE REFERENCES stripe_test_events(event_id),
  payment_status TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'test_received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT only_test_sessions CHECK (session_id LIKE 'cs_test_%'),
  CONSTRAINT never_fulfill CHECK (status IN ('test_received','test_reviewed'))
);
COMMIT;
