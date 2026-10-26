import { ArrowRight, CalendarPlus, Heart, Trash2, X } from "lucide-react";
import type { JSX } from "react";

import { BoardSection, Spec } from "@/app/(internal)/design-system/_components/artboard";
import { Badge } from "@/components/ui/badge";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BookingStatusBadge } from "@/features/booking/components/booking-status-badge";

type Variant = NonNullable<ButtonProps["variant"]>;

const VARIANTS: readonly { variant: Variant; label: string }[] = [
  { variant: "primary", label: "Primary" },
  { variant: "secondary", label: "Secondary" },
  { variant: "outline", label: "Outline" },
  { variant: "ghost", label: "Ghost" },
  { variant: "destructive", label: "Destructive" },
];

const STATES = [
  { label: "Default", props: {} },
  { label: "Hover", props: { "data-force": "hover" } },
  { label: "Active", props: { "data-force": "hover active" } },
  { label: "Focus", props: { "data-force": "focus" } },
  { label: "Disabled", props: { disabled: true } },
  { label: "Loading", props: { loading: true } },
] as const;

const DISTRICTS = [
  "Баянгол",
  "Баянзүрх",
  "Сонгинохайрхан",
  "Сүхбаатар",
  "Хан-Уул",
  "Чингэлтэй",
] as const;

/** Design system: товчны хувилбар бүрийг төлөв бүрээр (хүснэгт хэлбэрээр) харуулна. */
export function ButtonBoard(): JSX.Element {
  return (
    <>
      <BoardSection title="Хувилбар × төлөв">
        <div className="overflow-x-auto">
          <table className="w-full min-w-3xl border-separate border-spacing-y-3 text-left">
            <thead>
              <tr>
                <th scope="col" className="w-28">
                  <span className="sr-only">Хувилбар</span>
                </th>
                {STATES.map((state) => (
                  <th
                    key={state.label}
                    scope="col"
                    className="pb-1 text-xs font-medium text-muted-foreground"
                  >
                    {state.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VARIANTS.map(({ variant, label }) => (
                <tr key={variant}>
                  <th scope="row" className="pr-4 font-mono text-xs font-normal text-foreground">
                    {label}
                  </th>
                  {STATES.map((state) => (
                    <td key={state.label} className="pr-3">
                      <Button variant={variant} {...state.props}>
                        Цаг захиалах
                      </Button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Spec>
          Hover үед өнгө нь шууд солигдохгүй, доорх давхарга 150ms-д бүдгэрч гарна. Дарахад 2%
          агшина. Loading үед текст тунгалаг болж, товчны өргөн өөрчлөгдөхгүй.
        </Spec>
      </BoardSection>

      <BoardSection title="Хэмжээ · sm 36 / md 44 / lg 52">
        <div className="flex flex-wrap items-end gap-4">
          <Button size="sm">Жижиг</Button>
          <Button size="md">Дунд</Button>
          <Button size="lg">Том</Button>
          <Button size="icon-sm" variant="outline" aria-label="Хаах">
            <X />
          </Button>
          <Button size="icon" variant="outline" aria-label="Хадгалах">
            <Heart />
          </Button>
          <Button size="icon-lg" variant="secondary" aria-label="Цаг нэмэх">
            <CalendarPlus />
          </Button>
        </div>
        <Spec>
          Гар утсан дээр md (44px) нь хамгийн бага хэмжээ. Энэ нь хуруугаар дарахад хангалттай том
          талбай.
        </Spec>
      </BoardSection>

      <BoardSection title="Icon-той · оптик тэнцвэр">
        <div className="flex flex-wrap items-center gap-4">
          <Button>
            <CalendarPlus data-icon="start" />
            Цаг нэмэх
          </Button>
          <Button variant="outline">
            Дараах
            <ArrowRight data-icon="end" />
          </Button>
          <Button variant="destructive">
            <Trash2 data-icon="start" />
            Цуцлах
          </Button>
        </div>
        <Spec>
          Icon-той талын дотор зай 4px бага (20 → 16px). Icon-ы ирмэг текстийн ирмэгээс «хөнгөн» тул
          тэнцүү зай нүдэнд илүү өргөн харагддаг. Үүнийг нөхөж байгаа нь энэ.
        </Spec>
      </BoardSection>
    </>
  );
}

/** Design system: Input, Select, Textarea-ийн бүх төлөв (hover, focus, алдаа, идэвхгүй). */
export function FormBoard(): JSX.Element {
  return (
    <>
      <BoardSection title="Input · төлөвүүд">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Field>
            <Label htmlFor="ds-name">Нэр</Label>
            <Input id="ds-name" placeholder="Таны нэр" aria-describedby="ds-name-hint" />
            <FieldHint id="ds-name-hint">Үйлчилгээний газар таныг ингэж дуудна.</FieldHint>
          </Field>
          <Field>
            <Label htmlFor="ds-name-hover">Нэр · hover</Label>
            <Input id="ds-name-hover" placeholder="Таны нэр" data-force="hover" />
          </Field>
          <Field>
            <Label htmlFor="ds-name-focus">Нэр · focus</Label>
            <Input id="ds-name-focus" defaultValue="Батбаяр" data-force="focus" />
          </Field>
          <Field>
            <Label htmlFor="ds-phone">Утасны дугаар</Label>
            <Input
              id="ds-phone"
              type="tel"
              inputMode="numeric"
              defaultValue="9911 22"
              aria-invalid
              aria-describedby="ds-phone-error"
            />
            <FieldError id="ds-phone-error">Утасны дугаар 8 оронтой байх ёстой.</FieldError>
          </Field>
          <Field>
            <Label htmlFor="ds-disabled">Хаяг · идэвхгүй</Label>
            <Input id="ds-disabled" defaultValue="Сүхбаатар дүүрэг, 1-р хороо" disabled />
          </Field>
          <Field>
            <Label htmlFor="ds-district">Дүүрэг</Label>
            <Select id="ds-district" defaultValue="Сүхбаатар">
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </BoardSection>

      <BoardSection title="Textarea">
        <Field className="max-w-xl">
          <Label htmlFor="ds-note">Нэмэлт хүсэлт</Label>
          <Textarea
            id="ds-note"
            placeholder="Жишээ нь: Үсээ богиносгож, хажуу талыг нь шулуун засуулмаар байна."
            aria-describedby="ds-note-hint"
          />
          <FieldHint id="ds-note-hint">Заавал биш. Ажилтан захиалгатай хамт харна.</FieldHint>
        </Field>
        <Spec>
          Бүх талбарын текст 16px. iPhone дээр 16px-ээс жижиг талбарт дарахад хуудас автоматаар
          томордог. Энэ хэмжээ тэр асуудлаас сэргийлнэ.
        </Spec>
      </BoardSection>
    </>
  );
}

/** Design system: картын хувилбарууд (стандарт, дарагддаг, хөвөгч, дотор байрлах). */
export function CardBoard(): JSX.Element {
  return (
    <>
      <BoardSection title="Карт">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Стандарт</CardTitle>
              <CardDescription>Hairline хүрээ + маш зөөлөн сүүдэр.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ихэнх картанд ашиглана. Хүнд сүүдэргүй тул олон карт зэрэгцэхэд тайван харагдана.
              </p>
            </CardContent>
          </Card>
          <Card variant="interactive" data-force="hover">
            <CardHeader>
              <CardTitle>Интерактив · hover</CardTitle>
              <CardDescription>2px дээшилж, сүүдэр нь гүнзгийрнэ.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Дарж болох картанд л хэрэглэнэ. Дарагддаггүй картыг хөдөлгөвөл хэрэглэгч төөрнө.
              </p>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Өргөгдсөн</CardTitle>
              <CardDescription>Popover, хөвөгч panel.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button size="sm" variant="outline">
                Болих
              </Button>
              <Button size="sm">Хадгалах</Button>
            </CardFooter>
          </Card>
        </div>
      </BoardSection>

      <BoardSection title="Badge · захиалгын төлөв">
        <div className="flex flex-wrap gap-3">
          <BookingStatusBadge status="pending" />
          <BookingStatusBadge status="confirmed" />
          <BookingStatusBadge status="completed" />
          <BookingStatusBadge status="cancelled" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge tone="primary">Шинэ</Badge>
          <Badge tone="sun">Онцлох</Badge>
          <Badge tone="outline">Үсчин</Badge>
          <Badge tone="neutral">Энгийн</Badge>
        </div>
        <Spec>
          Өнгө нь утгыг давхар илэрхийлнэ: өнгө ялгадаггүй хэрэглэгч ч текстээр нь ойлгоно.
        </Spec>
      </BoardSection>
    </>
  );
}
