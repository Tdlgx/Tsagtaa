-- Газар ямар харагддаг, хаана байрладаг: лого, зураг, газрын зураг дээрх цэг.

-- Газрын зураг дээрх цэг. Хоёулаа байна эсвэл хоёулаа байхгүй. Улаанбаатар болон түүний
-- орчмын хүрээнд байх ёстой, буруу тивд тавьсан цэгийг хадгалахгүй, татгалзана.
ALTER TABLE businesses
  ADD COLUMN latitude  double precision,
  ADD COLUMN longitude double precision,
  ADD CONSTRAINT businesses_location_pair CHECK ((latitude IS NULL) = (longitude IS NULL)),
  ADD CONSTRAINT businesses_location_area CHECK (
    latitude IS NULL OR (latitude BETWEEN 47.6 AND 48.2 AND longitude BETWEEN 106.4 AND 107.6)
  );

-- Зургийг browser дээр жижигрүүлж (лого 256 px, зураг 1600 px хүртэл) энд хадгална.
-- Тус бүр хэдэн зуун KB, /api/business-images/<id>-ээр урт хугацааны cache-тэй
-- үйлчилнэ, учир нь нэг id-тай зураг хэзээ ч өөрчлөгддөггүй.
CREATE TABLE business_images (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid        NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  kind         text        NOT NULL,
  -- Зургуудын дараалал; лого үргэлж 0.
  position     smallint    NOT NULL DEFAULT 0,
  content_type text        NOT NULL,
  bytes        bytea       NOT NULL,
  width        integer     NOT NULL,
  height       integer     NOT NULL,
  uploaded_by  uuid        REFERENCES accounts (id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_images_kind_valid CHECK (kind IN ('logo', 'photo')),
  -- Зөвхөн бидний өөрсдөө үүсгэдэг форматууд; SVG хэзээ ч болохгүй (script агуулж болно).
  CONSTRAINT business_images_type_valid CHECK (content_type IN ('image/webp', 'image/jpeg')),
  CONSTRAINT business_images_size CHECK (octet_length(bytes) BETWEEN 100 AND 800000),
  CONSTRAINT business_images_dimensions CHECK (width BETWEEN 16 AND 4096 AND height BETWEEN 16 AND 4096)
);
-- Нэг газар нэг лого: шинийг оруулахад transaction дотор хуучныг солино.
CREATE UNIQUE INDEX business_images_one_logo ON business_images (business_id) WHERE kind = 'logo';
CREATE INDEX business_images_business_idx ON business_images (business_id, kind, position);
