import { CalendarX, Search } from "lucide-react";
import type { JSX } from "react";

import { BoardSection, Spec } from "@/app/(internal)/design-system/_components/artboard";
import { ToastDemo } from "@/app/(internal)/design-system/_components/toast-demo";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStepper } from "@/features/booking/components/booking-stepper";
import {
  TimeSlot,
  TimeSlotGroup,
  timeSlotVariants,
  type TimeSlotStatus,
} from "@/features/booking/components/time-slot";
import { BusinessCard } from "@/features/business/components/business-card";
import { ServiceCard } from "@/features/services/components/service-card";

type Slot = { time: string; status: TimeSlotStatus };

const MORNING: readonly Slot[] = [
  { time: "09:00", status: "past" },
  { time: "09:30", status: "past" },
  { time: "10:00", status: "booked" },
  { time: "10:30", status: "available" },
  { time: "11:00", status: "available" },
  { time: "11:30", status: "booked" },
];

const AFTERNOON: readonly Slot[] = [
  { time: "13:00", status: "available" },
  { time: "13:30", status: "available" },
  { time: "14:00", status: "booked" },
  { time: "14:30", status: "available" },
  { time: "15:00", status: "available" },
  { time: "15:30", status: "available" },
];

const LEGEND = [
  { label: "Сул", state: "available" },
  { label: "Сонгогдсон", state: "selected" },
  { label: "Дүүрсэн", state: "booked" },
  { label: "Өнгөрсөн", state: "past" },
] as const;

/** Design system: цагийн товчны төлөвүүд (сул, сонгосон, дүүрсэн, өнгөрсөн) болон тор. */
export function TimeSlotBoard(): JSX.Element {
  return (
    <>
      <BoardSection title="Төлөвүүд">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {LEGEND.map(({ label, state }) => (
            <li key={state} className="flex flex-col gap-2">
              <span className={timeSlotVariants({ state })}>10:30</span>
              <Spec>{label}</Spec>
            </li>
          ))}
        </ul>
        <Spec>
          Дүүрсэн цаг зураастай, дундуураа зурлагатай. Өнгөрсөн цаг бүдэг саарал дэвсгэртэй. Хоёулаа
          дарагдахгүй. Өнгө ялгадаггүй хүн ч хэлбэрээр нь ялгана.
        </Spec>
      </BoardSection>

      <BoardSection title="Сонголт · сум товчоор шилжинэ">
        <div className="flex max-w-2xl flex-col gap-6 rounded-lg border border-border bg-surface p-5">
          <TimeSlotGroup legend="Өглөө">
            {MORNING.map(({ time, status }) => (
              <TimeSlot key={time} name="ds-slot" time={time} status={status} />
            ))}
          </TimeSlotGroup>
          <TimeSlotGroup legend="Үдээс хойш">
            {AFTERNOON.map(({ time, status }) => (
              <TimeSlot
                key={time}
                name="ds-slot"
                time={time}
                status={status}
                defaultChecked={time === "13:30"}
              />
            ))}
          </TimeSlotGroup>
        </div>
        <Spec>
          Цаг бүр нь жинхэнэ radio товч: Tab-аар бүлэг рүү орж, сум товчоор шилжинэ. 360px дэлгэцэнд
          мөрөнд 4 цаг, тус бүр ≥ 72 × 44px.
        </Spec>
      </BoardSection>

      <BoardSection title="Stepper · захиалгын 4 алхам">
        <div className="flex flex-col gap-8 rounded-lg border border-border bg-surface p-5">
          {[0, 1, 2, 3].map((step) => (
            <BookingStepper key={step} currentStep={step} />
          ))}
        </div>
        <Spec>
          Гар утсанд зөвхөн дугуйнууд болон «Алхам 2/4 · Ажилтан» мөр харагдана. «Баталгаажуулах»
          гэх урт үг 360px-д багтахгүй тул нэрс 640px-ээс дээш гарна.
        </Spec>
      </BoardSection>
    </>
  );
}

/** Design system: үйлчилгээний карт болон бизнесийн картын жишээнүүд. */
export function CatalogBoard(): JSX.Element {
  return (
    <>
      <BoardSection title="ServiceCard · бүх карт нь нэг том товч">
        <fieldset className="grid max-w-2xl gap-3">
          <legend className="sr-only">Үйлчилгээ сонгох</legend>
          <ServiceCard
            name="ds-service"
            value="men-cut"
            title="Эрэгтэй үс засалт"
            description="Угаалга, засалт, загварчлал. Сахал засалт тусдаа."
            durationMinutes={45}
            price={25000}
          />
          <ServiceCard
            name="ds-service"
            value="women-cut"
            title="Эмэгтэй үс засалт, хатаалт"
            description="Үсний хэлбэрт тохирсон засалт ба мэргэжлийн хатаалт."
            durationMinutes={60}
            price={35000}
            defaultChecked
          />
          <ServiceCard
            name="ds-service"
            value="color"
            title="Үс будалт"
            durationMinutes={120}
            price={85000}
          />
        </fieldset>
      </BoardSection>

      <BoardSection title="BusinessCard · зураггүй үед placeholder">
        <div id="business-cards" className="grid scroll-mt-24 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <BusinessCard
            name="Өнгө салон"
            category="hair"
            location="Сүхбаатар дүүрэг, 1-р хороо"
            rating={4.9}
            reviewCount={128}
            href="#business-cards"
          />
          <BusinessCard
            name="Хан барбершоп"
            category="barber"
            location="Хан-Уул дүүрэг, 15-р хороо"
            rating={4.7}
            reviewCount={86}
          />
          <BusinessCard
            name="Лотус спа"
            category="massage"
            location="Баянзүрх дүүрэг, 26-р хороо"
          />
        </div>
        <Spec>
          Зургийн харьцаа 4:3 тогтмол тул зураг ачаалагдах үед хуудас «үсрэхгүй». Зураг байхгүй бол
          ангиллын icon ба өлзий хээтэй брэндийн placeholder гарна.
        </Spec>
      </BoardSection>
    </>
  );
}

/** Design system: skeleton, toast, хоосон төлөв зэрэг хариу үзүүлэх элементүүд. */
export function FeedbackBoard(): JSX.Element {
  return (
    <>
      <BoardSection title="Skeleton · shimmer">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3"
            >
              <Skeleton className="aspect-4/3 w-full rounded-md" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
        <Spec>
          Ачаалж буй контентын хэлбэрийг давтана. Ингэснээр хэрэглэгч юу гарч ирэхийг урьдчилж
          харна.
        </Spec>
      </BoardSection>

      <BoardSection title="Хоосон төлөв">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface">
            <EmptyState
              icon={CalendarX}
              title="Одоогоор захиалга алга"
              description="Та хараахан цаг захиалаагүй байна. Ойролцоох салоноо олоод анхны цагаа товлоорой."
              action={<Button>Салон хайх</Button>}
            />
          </div>
          <div className="rounded-lg border border-border bg-surface">
            <EmptyState
              icon={Search}
              title="Илэрц олдсонгүй"
              description="«Өнгө» гэсэн хайлтаар бизнес олдсонгүй. Үгээ шалгах эсвэл өөр ангилал сонгоно уу."
              action={<Button variant="outline">Шүүлтүүр арилгах</Button>}
            />
          </div>
        </div>
      </BoardSection>

      <BoardSection title="Toast">
        <ToastDemo />
        <Spec>
          Дэлгэцийн дээд хэсэгт гарна, учир нь гар утсанд доод хэсгийг навигаци эзэлдэг. Дэлгэц
          уншигч мэдэгдлийг автоматаар уншина.
        </Spec>
      </BoardSection>
    </>
  );
}
