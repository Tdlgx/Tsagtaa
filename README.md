# Цагтаа — онлайн цаг захиалгын систем

**Цагтаа** (кодын нэр: `tsagtaa`) нь Монголын жижиг бизнесүүдэд — үсчин, гоо сайхны салон,
барбершоп, маникюр, массажны газруудад — зориулсан онлайн цаг захиалгын вэб аппликейшн юм.
Төгсөлтийн дипломын ажлын хүрээнд хөгжүүлж байна.

> **Төлөв:** 1-р алхам — төслийн суурь ба хөгжүүлэлтийн орчин бэлэн.

## Системийн хэрэглэгчид

| Хэрэглэгч                  | Үндсэн боломж                                                     |
| -------------------------- | ----------------------------------------------------------------- |
| Үйлчлүүлэгч                | Бизнес хайх, үйлчилгээ, ажилтан, цаг сонгож захиалах (утас + OTP) |
| Бизнес эзэмшигч ба ажилтан | Үйлчилгээ, ажилтан, ажлын цаг, захиалгаа удирдах                  |
| Админ                      | Системийг бүхэлд нь хянах                                         |

## Ашигласан технологи

| Технологи                                     | Зориулалт                                     |
| --------------------------------------------- | --------------------------------------------- |
| [Next.js 16](https://nextjs.org) (App Router) | Full-stack React framework, Server Components |
| React 19, TypeScript (strict)                 | UI ба төрлийн аюулгүй байдал                  |
| Tailwind CSS v4                               | Стиль (тохиргоо нь CSS дотор `@theme`-ээр)    |
| shadcn/ui (Radix)                             | Хүртээмжтэй (accessible) UI компонентууд      |
| Zod 4                                         | Environment variable болон оролтын шалгалт    |
| PostgreSQL 18 (Docker Compose)                | Өгөгдлийн сан                                 |
| ESLint 9 (flat config) + Prettier             | Кодын чанар ба нэгэн хэвийн формат            |
| next-themes, sonner                           | Light/dark горим, toast мэдэгдэл              |
| Unbounded + Onest (next/font, cyrillic-ext)   | Гарчиг ба үндсэн текст, Монгол Ө/Ү бүрэн      |

## Шаардлагатай програмууд

- **Node.js 22 буюу түүнээс дээш** (LTS) — `node -v`
- **npm 10+** — `npm -v`
- **Git** — `git --version`
- **Docker Desktop** (WSL 2-той) — `docker --version`, `docker compose version`

## Локал дээр ажиллуулах

Бүх командыг Windows PowerShell дээр, төслийн үндсэн хавтсанд ажиллуулна.

```powershell
# 1. Репозиторийг татах
git clone <repository-url> tsagtaa
cd tsagtaa

# 2. Багцуудыг суулгах
npm install

# 3. Environment файл үүсгэх, дараа нь .env доторх POSTGRES_PASSWORD
#    болон DATABASE_URL доторх нууц үгийг өөрийн болгож солих
Copy-Item .env.example .env

# 4. PostgreSQL контейнерийг асаах (healthy болтол хүлээнэ)
npm run db:up

# 5. Хүснэгтүүдийг үүсгэх (db/migrations доторх SQL-ийг нэг удаа ажиллуулна)
npm run db:migrate

# 6. Хөгжүүлэлтийн серверийг асаах
npm run dev
```

Дараа нь шалгах:

- <http://localhost:3000> — нүүр хуудас
- <http://localhost:3000/api/health> — `{ "status": "ok", ... }` буцаана

## Script-үүд

| Команд                 | Тайлбар                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run dev`          | Хөгжүүлэлтийн сервер (http://localhost:3000)                        |
| `npm run build`        | Production build үүсгэнэ                                            |
| `npm run start`        | Build хийсэн аппыг production горимоор ажиллуулна                   |
| `npm run lint`         | ESLint-ээр кодыг шалгана                                            |
| `npm run lint:fix`     | ESLint-ийн автоматаар засаж болох алдааг засна                      |
| `npm run format`       | Prettier-ээр бүх файлыг форматлана                                  |
| `npm run format:check` | Формат зөрсөн файл байгаа эсэхийг шалгана (CI-д)                    |
| `npm run typecheck`    | Route-ийн төрлийг үүсгээд (`next typegen`) TypeScript-ээр шалгана   |
| `npm run db:up`        | PostgreSQL контейнерийг асааж, healthy болтол хүлээнэ               |
| `npm run db:down`      | Контейнерийг зогсооно (өгөгдөл volume-д хадгалагдана)               |
| `npm run db:logs`      | Өгөгдлийн сангийн логийг харна (`Ctrl+C`-ээр гарна)                 |
| `npm run db:migrate`   | `db/migrations/*.sql`-ээс хэрэгжээгүйг нь дарааллаар нь хэрэгжүүлнэ |
| `npm run admin:create` | Цагтаагийн админ үүсгэнэ (доорхыг харна уу)                         |

## Удирдлага ба эрх

- `/login`: утас + нууц үгээр нэвтэрнэ. Нууц үг scrypt-ээр хэшлэгдэнэ; cookie-д санамсаргүй
  токен, өгөгдлийн санд зөвхөн түүний SHA-256 хадгалагдана. 5 удаа буруу оруулбал 15 минут түгжинэ.
- `/dashboard/<slug>` (`(business)`): тухайн газрын **эзэмшигч** болон **менежерүүд** л харна.
  Менежер нэмэх, хасахыг зөвхөн эзэмшигч хийнэ. Бизнес бүртгүүлсэн хүн эзэмшигч болно.
- `/signup`: үйлчлүүлэгчийн бүртгэл (оноо цуглуулахад). Нэвтэрсний дараа үйлчлүүлэгч `/profile`,
  эзэмшигч/менежер `/dashboard`, админ `/admin` руу орно.
- `/admin` (`(admin)`): зөвхөн Цагтаагийн баг.
  - `/admin/review`: шинэ бүртгэлүүд, автомат шалгалтын оноотой (давхардал `pg_trgm`-ээр, үнэ төрлийнхөө
    дундажтай харьцуулах, цагийн хуваарь …). `/admin/places/<slug>`: дэлгэрэнгүй, зөвшөөрөх/татгалзах/түр хаах.
  - `/admin/accounts`: хайх, түгжээ тайлах, нууц үг шинэчлэх, админ эрх, оноо залруулах.
  - `/admin/bookings`: код, утас, газраар хайж цуцлах. `/admin/points`: онооны дүрэм, зарцуулалт.
  - `/admin/activity`: багийн үйлдэл бүр өөрчлөлттэйгээ нэг транзакцид бичигдэнэ.
- Эрхгүй хүнд хуудас «олдсонгүй» гэж харагдана. Шалгалт бүр сервер талд
  ([src/lib/auth/session.ts](src/lib/auth/session.ts)) хийгдэнэ.

Анхны админыг үүсгэх (нууц үг командын мөрөнд биш, орчны хувьсагчаар):

```powershell
$env:ADMIN_PASSWORD="урт-нууц-үг"; npm run admin:create -- 99112233 "Таны нэр"
```

## Оноо

1 оноо = 1₮ хөнгөлөлт ([db/migrations/0004_points_and_admin.sql](db/migrations/0004_points_and_admin.sql)):

- **Олгох**: нэвтэрсэн үедээ хийсэн захиалга төлсөн дүнгийн 5%-ийг (админ тохируулна) амлана. Газар
  «Ирсэн» гэж тэмдэглэхэд, эсвэл айлчлал дууссанаас 24 цагийн дараа автоматаар орно. «Ирээгүй» бол олгохгүй.
- **Зарцуулах**: 1,000 онооноос, захиалгын 50% хүртэл. Захиалга хадгалах ба оноо хасах нь нэг транзакц.
  Цуцлах, «ирээгүй» бол оноо буцаана.
- **Өгөгдлийн сангийн баталгаа**: `points_ledger` зөвхөн нэмэгдэнэ (засах, устгахыг trigger хориглоно);
  `accounts.points_balance`-ийг зөвхөн ledger-ийн trigger өөрчилнө; `CHECK (points_balance >= 0)` нь
  зэрэг зарцуулалтад ч сөрөг үлдэгдэл гаргахгүй; нэг захиалга нэг л удаа олгох/хасах/буцаах (`UNIQUE (booking_id, kind)`).

## Давхар захиалгаас хамгаалах

Нэг ажилтны нэг цагийг хоёр хүн зэрэг авахыг өгөгдлийн сан өөрөө хориглодог
([db/migrations/0001_bookings.sql](db/migrations/0001_bookings.sql)):

- **`bookings_no_overlap`** (`EXCLUDE USING gist`): нэг газрын нэг ажилтанд
  баталгаажсан хоёр захиалгын цаг огт давхцаж болохгүй. `UNIQUE (staff_id, starts_at)`
  хангалтгүй: 10:00-ийн 45 минутын захиалга, 10:30-ийн захиалга хоёулаа орчихно.
  Цуцалсан захиалга тооцогдохгүй тул цаг шууд чөлөөлөгдөнө.
- **`request_id` UNIQUE**: давхар товшилт, сүлжээний дахин оролдлого нэг л захиалга үүсгэнэ.
- «Сул эсэхийг шалгаад дараа нь оруулах» код байхгүй: шалгалт, оруулалтын хооронд
  өөр хүн цагийг авч болно. Оруулалт constraint-д тээглэвэл (`23P01`) «Аль ч ажилтан»
  сонголтод дараагийн сул ажилтныг savepoint-оор оролдоно, үгүй бол хэрэглэгчид
  «цаг авагдсан» гэж хэлнэ ([booking-db.ts](src/features/booking/booking-db.ts)).

## Дизайн систем «Хөх цаг»

`npm run dev` ажиллуулаад <http://localhost:3000/design-system> хуудсыг нээнэ. Production
горимд энэ хуудас 404 буцаадаг.

- **Token-ууд:** `src/app/globals.css`. Өнгө, фонтын хэмжээ, radius, сүүдэр, хөдөлгөөн бүгд
  энд тодорхойлогдоно. Tailwind-ийн default палитрыг санаатай устгасан тул `text-gray-500`
  мэт утга ажиллахгүй.
- **Суурь компонентууд:** `src/components/ui/`. Button, Card, Input, Select, Textarea, Field,
  Badge, Skeleton, Toaster.
- **Аппын компонентууд:** `src/features/*/components/`. TimeSlot, BookingStepper,
  ServiceCard, BusinessCard.
- **Layout:** `src/components/layout/`. Header, гар утасны доод навигаци, footer, горим солигч.
- Текст ба дэвсгэрийн бүх хослол light, dark хоёр горимд WCAG AA (≥ 4.5:1) хангана.

## Хавтасны бүтэц

```text
src/
├── app/                    # Next.js App Router: хуудас, layout, API
│   ├── (public)/           # Нэвтрээгүй хүнд харагдах хуудсууд (нүүр хуудас г.м.)
│   ├── (auth)/             # Нэвтрэх, бүртгүүлэх хуудсууд
│   ├── (customer)/         # Үйлчлүүлэгчийн хуудсууд (миний захиалгууд г.м.)
│   ├── (business)/         # Бизнесийн dashboard
│   ├── (admin)/            # Админ хэсэг
│   ├── api/health/         # Системийн эрүүл мэндийн шалгалт
│   ├── layout.tsx          # Root layout: <html lang="mn">, фонт, metadata
│   ├── not-found.tsx       # 404 хуудас
│   ├── error.tsx           # Алдааны хуудас
│   └── global-error.tsx    # Root layout-ийн алдааны нөөц хуудас
├── components/
│   ├── ui/                 # shadcn/ui компонентууд (Button, Card, Input)
│   ├── layout/             # Header, footer, container
│   └── shared/             # Олон газар ашиглагдах компонентууд
├── features/               # Домэйн модулиуд: auth, booking, business, services, staff
├── lib/                    # Туслах кодууд: env, огноо, мөнгө, тогтмол утгууд
└── types/                  # Нийтлэг TypeScript төрлүүд
```

Хаалттай нэртэй хавтас (жишээ нь `(public)`) нь **route group** юм: кодыг бүлэглэж, тус
бүрдээ өөр layout өгөх боломж олгодог боловч URL-д нөлөөлдөггүй
(`src/app/(public)/page.tsx` → `/`).

## Environment variables

| Нэр                    | Хаана ашиглагдах | Тайлбар                               |
| ---------------------- | ---------------- | ------------------------------------- |
| `POSTGRES_USER`        | Docker           | PostgreSQL хэрэглэгчийн нэр           |
| `POSTGRES_PASSWORD`    | Docker           | PostgreSQL нууц үг                    |
| `POSTGRES_DB`          | Docker           | Өгөгдлийн сангийн нэр                 |
| `POSTGRES_PORT`        | Docker           | Компьютер дээрх порт (анхдагч `5432`) |
| `DATABASE_URL`         | Зөвхөн сервер    | PostgreSQL холболтын URL (нууц)       |
| `NEXT_PUBLIC_APP_URL`  | Сервер + браузер | Аппын үндсэн хаяг                     |
| `NEXT_PUBLIC_APP_NAME` | Сервер + браузер | Аппын нэр                             |

Бүх утгыг аппыг асаах үед `src/lib/env-schema.ts` дахь Zod схемээр шалгадаг. Утга дутуу эсвэл
буруу бол апп асахгүй бөгөөд аль хувьсагч ямар алдаатайг монголоор жагсааж харуулна.
`NEXT_PUBLIC_` угтвартай хувьсагч браузерт ил харагддаг тул тэнд нууц мэдээлэл хэзээ ч бүү хадгал.

## Кодын дүрэм

- Файлын нэр `kebab-case` (`booking-form.tsx`), компонентын нэр `PascalCase`.
- Анхдагчаар Server Component; `"use client"` зөвхөн state, event, browser API хэрэгтэй үед.
- `any` хэрэглэхгүй, функц бүр буцаах төрлөө тодорхой заана (ESLint шалгана).
- Хэрэглэгчид харагдах текст монголоор, код дахь нэр болон тайлбар англиар.
- Огноо, цагийг үргэлж `src/lib/date.ts`-ээр (`Asia/Ulaanbaatar` бүсээр) харуулна.

## Commit мессеж

[Conventional Commits](https://www.conventionalcommits.org) хэлбэрийг мөрдөнө:

```text
feat: add booking time slot picker
fix: show booking time in Ulaanbaatar time zone
chore: upgrade Next.js to 16.4
docs: describe local setup in README
refactor: extract date helpers into lib/date
```
