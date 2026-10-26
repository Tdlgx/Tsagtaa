-- Үйлчлүүлэгчийн урамшууллын оноо, мөн Цагтаагийн багт платформыг удирдахад хэрэгтэй
-- хэрэгслүүд: газрыг түр хаах, үйлдлийн түүх, ижил төстэй бүртгэл илрүүлэх.

-- Нэг газрыг хоёр бүртгүүлснийг илрүүлэхийн тулд төстэй нэрээр хайх.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX businesses_name_trgm_idx ON businesses USING gin (lower(name) gin_trgm_ops);

-- Түр хаагдсан: зөвшөөрөгдсөн газрыг сайтаас түр авсан (гомдол, төлбөр төлөөгүй, …).
-- "Татгалзсан"-аас ялгаатай нь өмнө нь идэвхтэй байсан бөгөөд буцаж нээгдэж болно.
ALTER TABLE businesses DROP CONSTRAINT businesses_status_valid;
ALTER TABLE businesses ADD CONSTRAINT businesses_status_valid
  CHECK (status IN ('pending', 'active', 'rejected', 'suspended'));

/* Оноо ------------------------------------------------------------------------ */

-- 1 оноо = захиалгаас 1 ₮ хямдрал. Үлдэгдэл нь ledger-ийн нийлбэрийн cache бөгөөд
-- доорх trigger хадгалдаг. CHECK нь хоёр захиалга зэрэг оноо зарцуулсан ч хэтрүүлэн
-- зарцуулахыг боломжгүй болгоно (хоёр дахь UPDATE эхнийхийн мөрийн lock-ийг хүлээж,
-- дараа нь багассан үлдэгдлийг хараад амжилтгүй болно).
ALTER TABLE accounts
  ADD COLUMN points_balance integer NOT NULL DEFAULT 0,
  ADD CONSTRAINT accounts_points_not_negative CHECK (points_balance >= 0);

ALTER TABLE bookings
  -- Нэвтэрсэн үйлчлүүлэгч захиалахад бөглөгдөнө; зөвхөн ийм захиалга оноо өгнө.
  ADD COLUMN customer_account_id uuid REFERENCES accounts (id) ON DELETE SET NULL,
  -- Энэ захиалгад зарцуулсан оноо (үнээс хасах ₮).
  ADD COLUMN points_used integer NOT NULL DEFAULT 0,
  -- Захиалах үед амласан, үйлчлүүлсний дараа олгох оноо. Тэр үед тогтоогдох тул
  -- дараа нь оноо олгох хувь өөрчлөгдсөн ч амлалт өөрчлөгдөхгүй.
  ADD COLUMN points_earn integer NOT NULL DEFAULT 0,
  -- Газар тэмдэглэнэ: үйлчлүүлэгч ирсэн үү?
  ADD COLUMN attendance text,
  ADD COLUMN attendance_at timestamptz,
  ADD CONSTRAINT bookings_points_used_valid CHECK (points_used BETWEEN 0 AND price),
  ADD CONSTRAINT bookings_points_earn_valid CHECK (points_earn >= 0),
  ADD CONSTRAINT bookings_attendance_valid
    CHECK (attendance IS NULL OR (attendance IN ('attended', 'no_show') AND status = 'confirmed')),
  ADD CONSTRAINT bookings_attendance_at_matches CHECK ((attendance IS NULL) = (attendance_at IS NULL));

CREATE INDEX bookings_customer_idx ON bookings (customer_account_id, starts_at DESC)
  WHERE customer_account_id IS NOT NULL;

-- Үлдэгдлийн өөрчлөлт бүр, зөвхөн нэмэгдэнэ. Үлдэгдлийг хэзээ ч шууд бичихгүй.
CREATE TABLE points_ledger (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id uuid        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  delta      integer     NOT NULL,
  -- earn: үйлчлүүлсний дараа. redeem: захиалгад зарцуулсан. refund: тэр захиалга
  -- цуцлагдсан эсвэл ирээгүй. adjust: Цагтаагийн баг шалтгаантайгаар.
  kind       text        NOT NULL,
  -- Онооны түүхтэй захиалгыг устгаж болохгүй (RESTRICT): устгавал үлдэгдэл ба
  -- ledger хоорондоо зөрнө.
  booking_id uuid        REFERENCES bookings (id) ON DELETE RESTRICT,
  -- Хэн засварласан. RESTRICT: засвар хийсэн түүхтэй админыг устгахгүй, эрхийг нь
  -- бууруулна. Ингэснээр түүх хэн хийснийг харуулсаар байна.
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
-- Захиалга хэдэн удаа (эсвэл хэчнээн зэрэг) ажилласан ч нэг л удаа оноо олгож,
-- нэг л удаа зарцуулж, нэг л удаа буцаана.
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

-- Түүхийг дахин бичихгүй: алдааг "adjust" бичлэгээр засна. Цорын ганц үл хамаарах
-- тохиолдол нь бүртгэл устгах бөгөөд бичлэгүүд нь хамт устана (тэр устгал foreign
-- key-ээс, trigger-ийн нэг түвшин доороос ирдэг).
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

-- Мөн үлдэгдэл зөвхөн ledger-ээр л өөрчлөгдөнө.
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

-- Цагтаагийн баг /admin/points дээр тогтоодог дүрмүүд. Яг нэг мөр.
CREATE TABLE loyalty_settings (
  id                 boolean     PRIMARY KEY DEFAULT true CHECK (id),
  enabled            boolean     NOT NULL DEFAULT true,
  -- Төлсөн 100 ₮ тутамд олгох оноо.
  earn_percent       integer     NOT NULL DEFAULT 5 CHECK (earn_percent BETWEEN 0 AND 30),
  -- Хамгийн бага зарцуулалт, ингэснээр оноог 10-аар нь бутаргаж үрэхгүй.
  min_redeem         integer     NOT NULL DEFAULT 1000 CHECK (min_redeem BETWEEN 0 AND 1000000),
  -- Нэг захиалгын үнийн хамгийн ихдээ энэ хувийг оноогоор төлж болно.
  max_redeem_percent integer     NOT NULL DEFAULT 50 CHECK (max_redeem_percent BETWEEN 0 AND 100),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  updated_by         uuid        REFERENCES accounts (id) ON DELETE SET NULL
);
INSERT INTO loyalty_settings DEFAULT VALUES;

/* Үйлдлийн түүх ------------------------------------------------------------------------- */

-- Цагтаагийн багийн хийсэн үйлдэл, өөрчлөлттэй нэг transaction-д бичигдэнэ.
CREATE TABLE admin_audit (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id   uuid        REFERENCES accounts (id) ON DELETE SET NULL,
  action     text        NOT NULL,
  -- Тухайн үеийн уншигдахуйц нэр (газрын нэр, утас …) ба заасан id.
  target     text        NOT NULL,
  target_id  text,
  detail     text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_created_idx ON admin_audit (created_at DESC);
CREATE INDEX admin_audit_target_idx ON admin_audit (target_id, created_at DESC);
