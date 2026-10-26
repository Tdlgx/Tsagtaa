-- Газар эрхэлдэг хүмүүс (эзэмшигч, менежер) болон Цагтаагийн багийн нэвтрэлт.
-- Үйлчлүүлэгчид бүртгэлгүйгээр захиалсаар байна.

CREATE TABLE accounts (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone             text        NOT NULL,
  name              text        NOT NULL,
  -- "scrypt$N$r$p$salt$hash" (base64). Нууц үгийг өөрийг нь хэзээ ч хадгалахгүй.
  password_hash     text        NOT NULL,
  -- Цагтаагийн баг: бүртгэлүүдийг шалгаж, бүх газрыг харна.
  is_platform_admin boolean     NOT NULL DEFAULT false,
  -- Brute-force хамгаалалт: 5 удаа буруу нууц үг оруулбал бүртгэл 15 минут түгжигдэнэ.
  failed_logins     integer     NOT NULL DEFAULT 0,
  locked_until      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT accounts_phone_key UNIQUE (phone),
  CONSTRAINT accounts_phone_format CHECK (phone ~ '^[6-9][0-9]{7}$'),
  CONSTRAINT accounts_name_length CHECK (length(name) BETWEEN 2 AND 80)
);

-- Хэн аль газрыг удирддаг вэ. Удирдлагын самбар зөвхөн эзэмшигч (дарга), менежерүүдэд.
CREATE TABLE memberships (
  account_id  uuid        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  business_id uuid        NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  role        text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, business_id),
  CONSTRAINT memberships_role_valid CHECK (role IN ('owner', 'manager'))
);
CREATE INDEX memberships_business_idx ON memberships (business_id);
-- Нэг газар яг нэг эзэмшигчтэй.
CREATE UNIQUE INDEX memberships_one_owner ON memberships (business_id) WHERE role = 'owner';

-- Нэвтэрсэн browser-ууд. Cookie-д санамсаргүй token байх ба DB-д зөвхөн түүний SHA-256
-- хадгалагдана. Тиймээс хүснэгт алдагдсан ч түүгээр нэвтрэх боломжгүй.
CREATE TABLE sessions (
  token_hash text        PRIMARY KEY,
  account_id uuid        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_account_idx ON sessions (account_id);

-- Бүртгэлийг хэн, хэзээ, яагаад зөвшөөрсөн эсвэл татгалзсан.
ALTER TABLE businesses
  ADD COLUMN reviewed_at timestamptz,
  ADD COLUMN reviewed_by uuid REFERENCES accounts (id) ON DELETE SET NULL,
  ADD COLUMN review_note text;
