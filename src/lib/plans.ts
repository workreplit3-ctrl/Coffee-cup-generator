// Tariffs / pricing plans.
//
// Per the brief:
//   • The "Сеть / Типография" tier was removed.
//   • The "Кофейня" tier is capped at 100 generations.
//
// `limit` is the number of design generations allowed per month.
export type PlanId = "free" | "cafe";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  priceNote: string;
  limit: number;
  highlight?: boolean;
  tagline: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Проба",
    price: "0 ₽",
    priceNote: "навсегда",
    limit: 5,
    tagline: "Попробовать и оценить редактор",
    features: [
      "5 генераций дизайна",
      "Live-превью стакана в 3D-ракурсе",
      "Скачивание PNG (стандартное качество)",
      "Базовые паттерны и палитры",
    ],
  },
  {
    id: "cafe",
    name: "Кофейня",
    price: "990 ₽",
    priceNote: "в месяц",
    limit: 100,
    highlight: true,
    tagline: "Для кофейни и небольшого бренда",
    features: [
      "100 генераций в месяц",
      "Live-превью стакана в 3D-ракурсе",
      "Свой логотип на стакане (PNG/SVG)",
      "Скачивание в высоком разрешении (до 4K, 300 DPI)",
      "PDF-развёртка для типографии (dieline + вылеты)",
      "Все паттерны, палитры и шрифты",
      "История генераций",
      "Готово к печати (без водяного знака)",
    ],
  },
];

export const PLAN_MAP: Record<PlanId, Plan> = Object.fromEntries(
  PLANS.map((p) => [p.id, p])
) as Record<PlanId, Plan>;

export function planLimit(id: string): number {
  return PLAN_MAP[(id as PlanId)]?.limit ?? PLAN_MAP.free.limit;
}
