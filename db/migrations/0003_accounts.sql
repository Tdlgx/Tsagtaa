-- Sign-in for the people who run places (owners, managers) and for the
-- Цагтаа team. Customers still book without an account.

CREATE TABLE accounts (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone             text        NOT NULL,
  name              text        NOT NULL,
  -- "scrypt$N$r$p$salt$hash" (base64). Never the password itself.
  password_hash     text        NOT NULL,
  -- The Цагтаа team: reviews registrations and sees every place.
  is_platform_admin boolean     NOT NULL DEFAULT false,
  -- Brute-force brake: 5 wrong passwords lock the account for 15 minutes.
  failed_logins     integer     NOT NULL DEFAULT 0,
  locked_until      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT accounts_phone_key UNIQUE (phone),
  CONSTRAINT accounts_phone_format CHECK (phone ~ '^[6-9][0-9]{7}$'),
  CONSTRAINT accounts_name_length CHECK (length(name) BETWEEN 2 AND 80)
);

-- Who runs which place. The dashboard is only for the owner (дарга) and managers.
CREATE TABLE memberships (
  account_id  uuid        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  business_id uuid        NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  role        text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, business_id),
  CONSTRAINT memberships_role_valid CHECK (role IN ('owner', 'manager'))
);
CREATE INDEX memberships_business_idx ON memberships (business_id);
-- Exactly one owner per place.
CREATE UNIQUE INDEX memberships_one_owner ON memberships (business_id) WHERE role = 'owner';

-- Signed-in browsers. The cookie holds a random token; only its SHA-256
-- is stored, so a leaked table cannot be used to sign in.
CREATE TABLE sessions (
  token_hash text        PRIMARY KEY,
  account_id uuid        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_account_idx ON sessions (account_id);

-- Who approved or turned down a registration, when, and why.
ALTER TABLE businesses
  ADD COLUMN reviewed_at timestamptz,
  ADD COLUMN reviewed_by uuid REFERENCES accounts (id) ON DELETE SET NULL,
  ADD COLUMN review_note text;
