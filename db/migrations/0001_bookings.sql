-- Захиалгууд. Давхар захиалгыг аппын код биш, өгөгдлийн сан өөрөө хориглоно:
-- "цаг сул эсэхийг шалгаад дараа нь insert хийх" арга нь SERIALIZABLE-ээс доош
-- бүх isolation level-д уралддаг (хоёр хүсэлт хоёулаа сул гэж хараад хоёулаа insert хийнэ).
-- Доорх constraint-уудыг PostgreSQL атомаар шалгадаг тул нэг хүн, нэг цагт зэрэг
-- орж ирсэн хоёр insert-ээс яг нэг нь л амжилттай болно.

-- Нэг GiST index дотор энгийн текстийг `=`-ээр, цагийн мужтай хамт харьцуулах боломж олгоно.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE bookings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Захиалгын маягт бүрт browser нэг удаа үүсгэнэ. Давхар дарах эсвэл сүлжээний
  -- дахин оролдлого ижил id илгээх тул хоёр дахь insert юу ч хийхгүй.
  request_id    uuid        NOT NULL,
  -- Ресепшинд харуулах богино код: "TS-7K2Q9".
  code          text        NOT NULL,
  business_slug text        NOT NULL,
  staff_id      text        NOT NULL,
  service_name  text        NOT NULL,
  duration_min  integer     NOT NULL,
  price         integer     NOT NULL,
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  customer_name text        NOT NULL,
  phone         text        NOT NULL,
  note          text        NOT NULL DEFAULT '',
  status        text        NOT NULL DEFAULT 'confirmed',
  -- Үйлчлүүлэгч өөрийн мэдээллийг ашиглахыг зөвшөөрсөн цаг (Хувь хүний мэдээлэл хамгаалах тухай хууль).
  consented_at  timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  cancelled_at  timestamptz,

  CONSTRAINT bookings_request_id_key UNIQUE (request_id),
  CONSTRAINT bookings_code_key UNIQUE (code),
  CONSTRAINT bookings_duration_positive CHECK (duration_min > 0),
  CONSTRAINT bookings_price_not_negative CHECK (price >= 0),
  CONSTRAINT bookings_ends_after_start CHECK (ends_at > starts_at),
  CONSTRAINT bookings_phone_format CHECK (phone ~ '^[6-9][0-9]{7}$'),
  CONSTRAINT bookings_status_valid CHECK (status IN ('confirmed', 'cancelled')),
  CONSTRAINT bookings_cancelled_at_matches_status
    CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL)),

  -- Нэг хүний хоёр баталгаажсан захиалга цагийн хувьд давхцаж болохгүй.
  -- Энгийн UNIQUE (staff_id, starts_at) хангалтгүй: зөвхөн яг ижил эхлэх цагийг
  -- барина. Тэгвэл 10:00-ийн 45 минутын захиалга, 10:30-ийн захиалга хоёулаа орчихно.
  -- `&&` ямар ч давхцлыг барина. Муж нь хагас нээлттэй '[)' тул 10:00–10:45 ба
  -- 10:45–11:30 зэрэгцэн байж болно. Цуцлагдсан захиалгыг тооцохгүй тул цаг нь шууд чөлөөлөгдөнө.
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    business_slug WITH =,
    staff_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status = 'confirmed')
);

-- Хэрэглэгчийн бүртгэлтэй болсон үед "Миний захиалгууд"-ыг утасны дугаараар хайхад.
CREATE INDEX bookings_phone_idx ON bookings (phone, starts_at DESC);
