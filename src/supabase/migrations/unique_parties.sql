-- migration: deduplication_parties
-- Adds a composite unique index on (name, phone) for non-deleted records.
-- This prevents the "Satish Gore" clone multiplier problem.

CREATE UNIQUE INDEX IF NOT EXISTS idx_parties_name_phone 
ON parties (name, phone) 
WHERE deleted_at IS NULL;
