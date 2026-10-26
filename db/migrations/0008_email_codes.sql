-- Имэйлээр илгээх нэг удаагийн кодууд: нууц үггүй нэвтрэх, мөн хаягийг бүртгэлд
-- холбохоос өмнө тэр хүнийх мөн эсэхийг батлах зорилготой.
-- Кодын зөвхөн hash-ийг хадгална. Код нэг л удаа, 10 минут хүчинтэй бөгөөд
-- 5 удаа буруу оруулбал хүчингүй болно.

CREATE TABLE email_codes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL,
  -- 'login': энэ имэйлтэй бүртгэлээр нэвтрэх.
  -- 'set_email': энэ имэйлийг `account_id` бүртгэлд холбох.
  purpose     text        NOT NULL,
  account_id  uuid        REFERENCES accounts (id) ON DELETE CASCADE,
  -- "<id>:<code>"-ийн SHA-256 (hex).
  code_hash   text        NOT NULL,
  attempts    integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,

  CONSTRAINT email_codes_purpose_valid CHECK (purpose IN ('login', 'set_email')),
  CONSTRAINT email_codes_account_matches_purpose
    CHECK ((purpose = 'set_email') = (account_id IS NOT NULL))
);

-- "Энэ хаягийн хамгийн сүүлийн код" болон сүүлд хэдэн код илгээснийг хурдан олоход.
CREATE INDEX email_codes_email_idx ON email_codes (email, purpose, created_at DESC);

-- Өмнө нь имэйлийг тухайн хүнийх мөн эсэхийг шалгалгүй холбодог байсан тул хэн ч
-- бусдын хаягийг өөртөө бүртгүүлж болох байлаа. Одооноос хаяг руу илгээсэн кодыг
-- буцааж оруулсны дараа л хадгална. Өмнөх хаягуудыг устгаж байна; хэрэглэгч
-- профайл хуудаснаас дахин нэмж, баталгаажуулна.
UPDATE accounts SET email = NULL WHERE email IS NOT NULL;
