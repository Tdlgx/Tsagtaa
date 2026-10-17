-- Loyalty points for customers, and the tools the Цагтаа team needs to run
-- the platform: suspending a place, an audit trail, fuzzy duplicate checks.

-- Similar-name search for spotting the same place registered twice.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX businesses_name_trgm_idx ON businesses USING gin (lower(name) gin_trgm_ops);

-- Suspended: an approved place taken off the site for now (complaints,
-- unpaid fees, …). Unlike "rejected", it was live and can come back.
ALTER TABLE businesses DROP CONSTRAINT businesses_status_valid;
ALTER TABLE businesses ADD CONSTRAINT businesses_status_valid
  CHECK (status IN ('pending', 'active', 'rejected', 'suspended'));

/* Points ------------------------------------------------------------------------ */

-- 1 point = 1 ₮ off a booking. The balance is a cache of the ledger's sum,
-- kept by the trigger below; the CHECK makes overspending impossible even
-- when two bookings spend points at the same moment (the second UPDATE waits
-- for the first one's row lock, then sees the lower balance and fails).
ALTER TABLE accounts
  ADD COLUMN points_balance integer NOT NULL DEFAULT 0,
  ADD CONSTRAINT accounts_points_not_negative CHECK (points_balance >= 0);

ALTER TABLE bookings
  -- Set when a signed-in customer books; only those bookings earn points.
  ADD COLUMN customer_account_id uuid REFERENCES accounts (id) ON DELETE SET NULL,
  -- Points spent on this booking (₮ off the price).
  ADD COLUMN points_used integer NOT NULL DEFAULT 0,
  -- Points promised at booking time, credited after the visit. Fixed then,
  -- so a later change of the earn rate does not change a promise.
  ADD COLUMN points_earn integer NOT NULL DEFAULT 0,
  -- Marked by the place: did the customer come?
  ADD COLUMN attendance text,
  ADD COLUMN attendance_at timestamptz,
  ADD CONSTRAINT bookings_points_used_valid CHECK (points_used BETWEEN 0 AND price),
  ADD CONSTRAINT bookings_points_earn_valid CHECK (points_earn >= 0),
  ADD CONSTRAINT bookings_attendance_valid
    CHECK (attendance IS NULL OR (attendance IN ('attended', 'no_show') AND status = 'confirmed')),
  ADD CONSTRAINT bookings_attendance_at_matches CHECK ((attendance IS NULL) = (attendance_at IS NULL));

CREATE INDEX bookings_customer_idx ON bookings (customer_account_id, starts_at DESC)
  WHERE customer_account_id IS NOT NULL;

-- Every change to a balance, append-only. The balance is never written directly.
CREATE TABLE points_ledger (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id uuid        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  delta      integer     NOT NULL,
  -- earn: after a visit. redeem: spent on a booking. refund: that booking was
  -- cancelled or missed. adjust: by the Цагтаа team, with a reason.
  kind       text        NOT NULL,
  -- A booking with points history cannot be deleted (RESTRICT): it would
  -- leave the balance and the ledger disagreeing.
  booking_id uuid        REFERENCES bookings (id) ON DELETE RESTRICT,
  -- Who adjusted. RESTRICT: an admin with adjustments on record is demoted,
  -- not deleted, so the history keeps saying who did it.
  actor_id   uuid        REFERENCES accounts (id) ON DELETE RESTRICT,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT points_ledger_delta_nonzero CHECK (delta <> 0),
  CONSTRAINT points_ledger_kind_valid CHECK (kind IN ('earn', 'redeem', 'refund', 'adjust')),
  CONSTRAINT points_ledger_sign CHECK (
    (kind IN ('earn', 'refund') AND delta > 0) OR (kind = 'redeem' AND delta < 0) OR kind = 'adjust'
  ),
  CONSTRAINT points_ledger_booking_kinds
    CHECK ((kind = 'adjust') = (booking_id IS NULL)),
  CONSTRAINT points_ledger_adjust_reason
    CHECK (kind <> 'adjust' OR (actor_id IS NOT NULL AND length(note) >= 3))
);
-- A booking earns once, spends once and is refunded once, however many
-- times (or how concurrently) the code that does it runs.
CREATE UNIQUE INDEX points_ledger_booking_once ON points_ledger (booking_id, kind)
  WHERE booking_id IS NOT NULL;
CREATE INDEX points_ledger_account_idx ON points_ledger (account_id, created_at DESC);
CREATE INDEX points_ledger_created_idx ON points_ledger (created_at DESC);

CREATE FUNCTION points_ledger_apply() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE accounts SET points_balance = points_balance + NEW.delta WHERE id = NEW.account_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER points_ledger_apply AFTER INSERT ON points_ledger
  FOR EACH ROW EXECUTE FUNCTION points_ledger_apply();

-- History is not rewritten: a mistake is fixed with an "adjust" entry. The
-- one exception is deleting an account, whose entries go with it (that
-- delete arrives from the foreign key, one trigger level down).
CREATE FUNCTION points_ledger_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'points_ledger is append-only' USING ERRCODE = 'restrict_violation';
END;
$$;
CREATE TRIGGER points_ledger_append_only BEFORE UPDATE OR DELETE ON points_ledger
  FOR EACH ROW EXECUTE FUNCTION points_ledger_append_only();

-- And the balance only moves through the ledger.
CREATE FUNCTION accounts_balance_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.points_balance IS DISTINCT FROM OLD.points_balance AND pg_trigger_depth() < 2 THEN
    RAISE EXCEPTION 'points_balance changes only through points_ledger'
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER accounts_balance_guard BEFORE UPDATE OF points_balance ON accounts
  FOR EACH ROW EXECUTE FUNCTION accounts_balance_guard();

-- The rules, set by the Цагтаа team in /admin/points. Exactly one row.
CREATE TABLE loyalty_settings (
  id                 boolean     PRIMARY KEY DEFAULT true CHECK (id),
  enabled            boolean     NOT NULL DEFAULT true,
  -- Points per 100 ₮ paid.
  earn_percent       integer     NOT NULL DEFAULT 5 CHECK (earn_percent BETWEEN 0 AND 30),
  -- Smallest spend, so points are not frittered away 10 at a time.
  min_redeem         integer     NOT NULL DEFAULT 1000 CHECK (min_redeem BETWEEN 0 AND 1000000),
  -- At most this share of one booking can be paid in points.
  max_redeem_percent integer     NOT NULL DEFAULT 50 CHECK (max_redeem_percent BETWEEN 0 AND 100),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  updated_by         uuid        REFERENCES accounts (id) ON DELETE SET NULL
);
INSERT INTO loyalty_settings DEFAULT VALUES;

/* Audit ------------------------------------------------------------------------- */

-- What the Цагтаа team did, written in the same transaction as the change.
CREATE TABLE admin_audit (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id   uuid        REFERENCES accounts (id) ON DELETE SET NULL,
  action     text        NOT NULL,
  -- Readable label at the time (place name, phone …), and the id it points at.
  target     text        NOT NULL,
  target_id  text,
  detail     text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_created_idx ON admin_audit (created_at DESC);
CREATE INDEX admin_audit_target_idx ON admin_audit (target_id, created_at DESC);
