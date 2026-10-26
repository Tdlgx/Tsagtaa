-- Өөрсдөө бүртгүүлсэн бизнесүүд, тэдний цагийн хуваарь, үйлчилгээ, ажилтан.
-- Бүртгэлийг нэг transaction-оор бичнэ: бүгд хадгалагдана, эсвэл юу ч хадгалагдахгүй.
-- Шинэ бизнес шалгагдтал 'pending' төлөвт хүлээнэ.

CREATE TABLE businesses (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Бүртгэлийн маягт бүрт нэг: давхар дарах эсвэл дахин оролдлого нэг л удаа хадгалагдана.
  request_id      uuid        NOT NULL,
  -- Нийтийн хаяг: /book/<slug>.
  slug            text        NOT NULL,
  name            text        NOT NULL,
  category        text        NOT NULL,
  district        text        NOT NULL,
  address         text        NOT NULL,
  phone           text        NOT NULL,
  email           text,
  -- Компанид 7 оронтой тоо, хувь хүнд 2 үсэг + 8 оронтой тоо.
  register_number text,
  description     text        NOT NULL DEFAULT '',
  -- Захиалгын тор: цаг 15, 30 эсвэл 60 минут тутамд эхэлж болно.
  slot_minutes    integer     NOT NULL,
  status          text        NOT NULL DEFAULT 'pending',
  -- Эзэмшигч мэдээлэл үнэн гэдгийг баталж, бодлогыг зөвшөөрсөн цаг.
  owner_consented_at timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT businesses_request_id_key UNIQUE (request_id),
  -- Хоёр эзэмшигч нэг хаягийг зэрэг авах гэвэл яг нэг нь л авна.
  CONSTRAINT businesses_slug_key UNIQUE (slug),
  CONSTRAINT businesses_slug_format
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 3 AND 60),
  CONSTRAINT businesses_category_valid CHECK (category IN (
    'hair', 'barber', 'nails', 'massage', 'beauty',
    'clinic', 'dental', 'auto-repair', 'car-wash', 'vet'
  )),
  CONSTRAINT businesses_district_valid CHECK (district IN (
    'sukhbaatar', 'chingeltei', 'bayangol', 'bayanzurkh', 'khan-uul', 'songinokhairkhan'
  )),
  CONSTRAINT businesses_phone_format CHECK (phone ~ '^[6-9][0-9]{7}$'),
  CONSTRAINT businesses_register_number_format
    CHECK (register_number IS NULL OR register_number ~ '^([0-9]{7}|[А-ЯЁӨҮ]{2}[0-9]{8})$'),
  CONSTRAINT businesses_slot_minutes_valid CHECK (slot_minutes IN (15, 30, 60)),
  CONSTRAINT businesses_status_valid CHECK (status IN ('pending', 'active', 'rejected'))
);

-- Нэг регистрийн дугаар зөвхөн нэг идэвхтэй бүртгэлд хамаарна; татгалзсан бүртгэл
-- дахин оролдоход саад болохгүй.
CREATE UNIQUE INDEX businesses_register_number_key
  ON businesses (register_number)
  WHERE register_number IS NOT NULL AND status <> 'rejected';

-- Гарагууд ISO стандартаар: 1 = Даваа … 7 = Ням. Байхгүй өдөр нь амралтын өдөр.
CREATE TABLE business_hours (
  business_id uuid     NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  weekday     smallint NOT NULL,
  opens       time     NOT NULL,
  closes      time     NOT NULL,
  PRIMARY KEY (business_id, weekday),
  CONSTRAINT business_hours_weekday_valid CHECK (weekday BETWEEN 1 AND 7),
  CONSTRAINT business_hours_closes_after_opens CHECK (closes > opens)
);

CREATE TABLE services (
  id           uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid     NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  position     smallint NOT NULL,
  name         text     NOT NULL,
  duration_min integer  NOT NULL,
  price        integer  NOT NULL,
  CONSTRAINT services_position_key UNIQUE (business_id, position),
  CONSTRAINT services_name_length CHECK (length(name) BETWEEN 2 AND 80),
  CONSTRAINT services_duration_valid CHECK (duration_min BETWEEN 5 AND 480 AND duration_min % 5 = 0),
  CONSTRAINT services_price_valid CHECK (price BETWEEN 0 AND 10000000)
);
-- "Үс засалт" ба "үс засалт" нь нэг үйлчилгээ.
CREATE UNIQUE INDEX services_name_key ON services (business_id, lower(name));

CREATE TABLE staff (
  id          uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid     NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  position    smallint NOT NULL,
  name        text     NOT NULL,
  CONSTRAINT staff_position_key UNIQUE (business_id, position),
  CONSTRAINT staff_name_length CHECK (length(name) BETWEEN 2 AND 60)
);
CREATE UNIQUE INDEX staff_name_key ON staff (business_id, lower(name));
