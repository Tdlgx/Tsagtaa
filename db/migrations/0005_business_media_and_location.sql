-- What a place looks like and where it is: a logo, photos, and a map pin.

-- A pin on the map. Both or neither; inside Ulaanbaatar and a margin around
-- it, so a pin dropped on the wrong continent is refused, not stored.
ALTER TABLE businesses
  ADD COLUMN latitude  double precision,
  ADD COLUMN longitude double precision,
  ADD CONSTRAINT businesses_location_pair CHECK ((latitude IS NULL) = (longitude IS NULL)),
  ADD CONSTRAINT businesses_location_area CHECK (
    latitude IS NULL OR (latitude BETWEEN 47.6 AND 48.2 AND longitude BETWEEN 106.4 AND 107.6)
  );

-- Images are resized in the browser (logo 256 px, photos up to 1600 px)
-- and kept here: a few hundred KB each, served by /api/business-images/<id>
-- with a long cache, since an image never changes under the same id.
CREATE TABLE business_images (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid        NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  kind         text        NOT NULL,
  -- Order of the photos; the logo is always 0.
  position     smallint    NOT NULL DEFAULT 0,
  content_type text        NOT NULL,
  bytes        bytea       NOT NULL,
  width        integer     NOT NULL,
  height       integer     NOT NULL,
  uploaded_by  uuid        REFERENCES accounts (id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_images_kind_valid CHECK (kind IN ('logo', 'photo')),
  -- Only formats we produce ourselves; never SVG (it can carry scripts).
  CONSTRAINT business_images_type_valid CHECK (content_type IN ('image/webp', 'image/jpeg')),
  CONSTRAINT business_images_size CHECK (octet_length(bytes) BETWEEN 100 AND 800000),
  CONSTRAINT business_images_dimensions CHECK (width BETWEEN 16 AND 4096 AND height BETWEEN 16 AND 4096)
);
-- One logo per place: uploading a new one replaces it in a transaction.
CREATE UNIQUE INDEX business_images_one_logo ON business_images (business_id) WHERE kind = 'logo';
CREATE INDEX business_images_business_idx ON business_images (business_id, kind, position);
