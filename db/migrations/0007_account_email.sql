-- Утаснаас гадна имэйлээр нэвтрэх боломж. Заавал биш: бүртгэлийн гол түлхүүр нь утас
-- хэвээр. Хоосон зайг тайрч, жижиг үсгээр хадгална. Тиймээс "Bold@Gmail.com" ба
-- "bold@gmail.com" нэг хаяг болж, энгийн UNIQUE index хангалттай.
-- Одоогоор баталгаажаагүй: имэйлээр нууц үг сэргээхээс өмнө баталгаажуулалт заавал хэрэгтэй.

ALTER TABLE accounts
  ADD COLUMN email text,
  ADD CONSTRAINT accounts_email_format CHECK (
    email IS NULL OR (
      email = lower(btrim(email))
      AND length(email) <= 120
      AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  );

CREATE UNIQUE INDEX accounts_email_key ON accounts (email);
