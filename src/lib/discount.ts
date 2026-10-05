/** Sale helpers — mirrors backend core/discounts.py + web lib/discount.ts. */

export interface Discountable {
  price: number;
  discount_percent?: number | string | null;
  discount_starts_at?: string | null;
  discount_ends_at?: string | null;
  effective_price?: number | string | null;
  is_on_sale?: boolean | null;
}

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export function isOnSale(p: Discountable): boolean {
  if (typeof p.is_on_sale === "boolean") return p.is_on_sale;
  const pct = toNum(p.discount_percent);
  if (pct === null || pct <= 0) return false;
  const now = Date.now();
  if (p.discount_starts_at) {
    const s = new Date(p.discount_starts_at).getTime();
    if (Number.isFinite(s) && now < s) return false;
  }
  if (p.discount_ends_at) {
    const e = new Date(p.discount_ends_at).getTime();
    if (Number.isFinite(e) && now > e) return false;
  }
  return true;
}

export function getDiscountPct(p: Pick<Discountable, "discount_percent">): number {
  const pct = toNum(p.discount_percent);
  if (pct === null || pct <= 0) return 0;
  return Math.round(pct * 100) / 100;
}

export function getEffectivePrice(p: Discountable): number {
  const eff = toNum(p.effective_price);
  if (eff !== null) return eff;
  const base = Number(p.price) || 0;
  if (!isOnSale(p)) return base;
  const pct = getDiscountPct(p);
  return Math.round(base * (1 - pct / 100) * 100) / 100;
}
