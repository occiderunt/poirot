import { useCallback, useEffect, useMemo, useState } from "react";

// ---- types -----------------------------------------------------------------

export type IconKey =
  | "shelf"
  | "fridge"
  | "snowflake"
  | "jar"
  | "basket"
  | "crate"
  | "bottle"
  | "cheese";

export type CategoryId =
  | "produce"
  | "dairy"
  | "meat"
  | "bakery"
  | "pantry"
  | "spices"
  | "frozen"
  | "drinks"
  | "other";

export interface Shelf {
  id: string;
  name: string;
  icon: IconKey;
  color: string;
}

export interface Item {
  id: string;
  name: string;
  qty: number;
  unit: string;
  shelfId: string;
  category: CategoryId;
  /** YYYY-MM-DD, local. Empty string when unknown. */
  expiry: string;
  notes: string;
  lowAt: number;
  addedAt: number;
}

export interface Pantry {
  version: 1;
  shelves: Shelf[];
  items: Item[];
}

// ---- constants -------------------------------------------------------------

export const SHELF_COLORS = [
  "#B4552D", // terracotta
  "#6C7A54", // olive
  "#B0842A", // mustard
  "#7C5A8E", // plum
  "#3F6E6A", // teal
  "#8C4A3C", // chestnut
];

export const ICON_KEYS: IconKey[] = [
  "shelf",
  "fridge",
  "snowflake",
  "jar",
  "basket",
  "crate",
  "bottle",
  "cheese",
];

export const UNITS = [
  "pcs",
  "g",
  "kg",
  "ml",
  "l",
  "pack",
  "jar",
  "can",
  "bottle",
  "bunch",
  "loaf",
  "box",
];

export const CATEGORIES: { id: CategoryId; label: string; color: string }[] = [
  { id: "produce", label: "Produce", color: "#6C7A54" },
  { id: "dairy", label: "Dairy", color: "#C9973B" },
  { id: "meat", label: "Meat & fish", color: "#A3483F" },
  { id: "bakery", label: "Bakery", color: "#9A6B3F" },
  { id: "pantry", label: "Pantry", color: "#8A7250" },
  { id: "spices", label: "Spices", color: "#B4552D" },
  { id: "frozen", label: "Frozen", color: "#4E7E8C" },
  { id: "drinks", label: "Drinks", color: "#7C5A8E" },
  { id: "other", label: "Other", color: "#7A6A58" },
];

export const categoryOf = (id: CategoryId) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

// ---- helpers ---------------------------------------------------------------

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function isoDate(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

/** Whole days from today until an ISO date. Negative = past. */
export function daysUntil(iso: string): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export type ExpiryState = "none" | "ok" | "soon" | "expired";

export function expiryState(iso: string): ExpiryState {
  if (!iso) return "none";
  const days = daysUntil(iso);
  if (days < 0) return "expired";
  if (days <= 3) return "soon";
  return "ok";
}

export function expiryLabel(iso: string): string {
  if (!iso) return "";
  const days = daysUntil(iso);
  if (days < -1) return `${Math.abs(days)} days past`;
  if (days === -1) return "Yesterday";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 3) return `${days} days left`;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export const isLow = (item: Item) => item.qty <= Math.max(0, item.lowAt);

const UNIT_PLURALS: Record<string, string> = {
  pack: "packs",
  jar: "jars",
  can: "cans",
  bottle: "bottles",
  bunch: "bunches",
  loaf: "loaves",
  box: "boxes",
};

/** How a unit should read next to an amount. */
export function unitLabel(unit: string, qty: number): string {
  if (unit === "pcs") return "";
  const base = unit === "l" ? "L" : unit;
  if (qty === 1) return base;
  return UNIT_PLURALS[unit] ?? base;
}

export function formatQty(qty: number, unit: string): string {
  const n = Number.isInteger(qty) ? `${qty}` : `${Math.round(qty * 100) / 100}`;
  const label = unitLabel(unit, qty);
  return label ? `${n} ${label}` : n;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

// ---- seed ------------------------------------------------------------------

function seedShelf(name: string, icon: IconKey, color: string, i: number): Shelf {
  return { id: `shelf-${i}`, name, icon, color };
}

function makePantry(): Pantry {
  const shelves: Shelf[] = [
    seedShelf("Left Pantry", "shelf", "#B4552D", 1),
    seedShelf("Right Pantry", "basket", "#B0842A", 2),
    seedShelf("Fridge", "fridge", "#3F6E6A", 3),
    seedShelf("Freezer", "snowflake", "#7C5A8E", 4),
    seedShelf("Spice Rack", "jar", "#6C7A54", 5),
  ];

  const item = (
    name: string,
    qty: number,
    unit: string,
    shelf: number,
    category: CategoryId,
    expiry: string,
    notes = "",
    lowAt = 1,
  ): Item => ({
    id: uid(),
    name,
    qty,
    unit,
    shelfId: `shelf-${shelf}`,
    category,
    expiry,
    notes,
    lowAt,
    addedAt: Date.now(),
  });

  const items: Item[] = [
    item("Plain flour", 1, "kg", 1, "pantry", addDays(210)),
    item("Basmati rice", 2, "kg", 1, "pantry", addDays(400)),
    item("Tinned tomatoes", 6, "can", 1, "pantry", addDays(520), "", 2),
    item("Olive oil", 750, "ml", 1, "pantry", addDays(300), "The good one, for finishing", 0),
    item("Spaghetti", 2, "pack", 1, "pantry", addDays(500)),
    item("Chickpeas", 3, "can", 2, "pantry", addDays(600), "", 1),
    item("Coffee beans", 250, "g", 2, "drinks", addDays(20), "Dark roast", 50),
    item("Dark chocolate", 2, "pcs", 2, "pantry", addDays(120)),
    item("Whole milk", 1, "l", 3, "dairy", addDays(2), "", 1),
    item("Eggs", 6, "pcs", 3, "dairy", addDays(9), "Free range", 2),
    item("Salted butter", 250, "g", 3, "dairy", addDays(18), "", 50),
    item("Mature cheddar", 200, "g", 3, "dairy", addDays(12), "", 50),
    item("Baby spinach", 1, "pack", 3, "produce", addDays(1), "", 1),
    item("Chicken thighs", 600, "g", 4, "meat", addDays(60), "Two portions", 0),
    item("Garden peas", 1, "kg", 4, "frozen", addDays(180), "", 100),
    item("Vanilla ice cream", 1, "pcs", 4, "frozen", addDays(90), "", 0),
    item("Smoked paprika", 1, "jar", 5, "spices", addDays(300), "Sweet, not hot"),
    item("Cumin seeds", 1, "jar", 5, "spices", addDays(300)),
    item("Black peppercorns", 1, "jar", 5, "spices", addDays(700), "", 0),
  ];

  return { version: 1, shelves, items };
}

// ---- persistence -----------------------------------------------------------

const KEY = "poirot.pantry.v1";

function load(): Pantry {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return makePantry();
    const parsed = JSON.parse(raw) as Pantry;
    if (!parsed || !Array.isArray(parsed.shelves) || !Array.isArray(parsed.items)) {
      return makePantry();
    }
    return parsed;
  } catch {
    return makePantry();
  }
}

function save(pantry: Pantry) {
  try {
    localStorage.setItem(KEY, JSON.stringify(pantry));
  } catch {
    // Storage full or unavailable; the session still works in memory.
  }
}

export function parseImport(raw: string): Pantry {
  const parsed = JSON.parse(raw) as Pantry;
  if (!parsed || !Array.isArray(parsed.shelves) || !Array.isArray(parsed.items)) {
    throw new Error("That does not look like a Poirot backup.");
  }
  const shelves: Shelf[] = parsed.shelves.map((s) => ({
    id: String(s.id),
    name: String(s.name || "Shelf"),
    icon: ICON_KEYS.includes(s.icon) ? s.icon : "shelf",
    color: /^#[0-9a-f]{6}$/i.test(String(s.color)) ? String(s.color) : SHELF_COLORS[0],
  }));
  const known = new Set(shelves.map((s) => s.id));
  const items: Item[] = parsed.items
    .filter((i) => i && i.name)
    .map((i) => ({
      id: String(i.id || uid()),
      name: String(i.name),
      qty: Number.isFinite(Number(i.qty)) ? Number(i.qty) : 1,
      unit: typeof i.unit === "string" && i.unit ? i.unit : "pcs",
      shelfId: known.has(String(i.shelfId)) ? String(i.shelfId) : shelves[0]?.id ?? "",
      category: CATEGORIES.some((c) => c.id === i.category) ? i.category : "other",
      expiry: typeof i.expiry === "string" ? i.expiry : "",
      notes: typeof i.notes === "string" ? i.notes : "",
      lowAt: Number.isFinite(Number(i.lowAt)) ? Number(i.lowAt) : 1,
      addedAt: Number.isFinite(Number(i.addedAt)) ? Number(i.addedAt) : Date.now(),
    }))
    .filter((i) => known.has(i.shelfId));
  if (!shelves.length) throw new Error("A backup needs at least one shelf.");
  return { version: 1, shelves, items };
}

// ---- hook ------------------------------------------------------------------

export interface PantryApi {
  pantry: Pantry;
  /** Items sorted for display: by category order, then name. */
  itemsInShelf: (shelfId: string) => Item[];
  shelfById: (id: string) => Shelf | undefined;
  addItem: (draft: Omit<Item, "id" | "addedAt">) => void;
  updateItem: (id: string, patch: Partial<Omit<Item, "id">>) => void;
  removeItem: (id: string) => void;
  moveItem: (id: string, shelfId: string) => void;
  useOne: (id: string) => void;
  addShelf: (draft: Omit<Shelf, "id">) => string;
  updateShelf: (id: string, patch: Partial<Omit<Shelf, "id">>) => void;
  removeShelf: (id: string) => void;
  moveShelf: (id: string, dir: -1 | 1) => void;
  replacePantry: (next: Pantry) => void;
  clearAll: () => void;
}

export function usePantry(): PantryApi {
  const [pantry, setPantry] = useState<Pantry>(() => load());

  useEffect(() => {
    save(pantry);
  }, [pantry]);

  const shelfById = useCallback(
    (id: string) => pantry.shelves.find((s) => s.id === id),
    [pantry.shelves],
  );

  const itemsInShelf = useCallback(
    (shelfId: string) =>
      pantry.items
        .filter((i) => i.shelfId === shelfId)
        .sort((a, b) => {
          const ca = CATEGORIES.findIndex((c) => c.id === a.category);
          const cb = CATEGORIES.findIndex((c) => c.id === b.category);
          if (ca !== cb) return ca - cb;
          return a.name.localeCompare(b.name);
        }),
    [pantry.items],
  );

  const addItem = useCallback((draft: Omit<Item, "id" | "addedAt">) => {
    setPantry((p) => ({
      ...p,
      items: [...p.items, { ...draft, id: uid(), addedAt: Date.now() }],
    }));
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<Omit<Item, "id">>) => {
    setPantry((p) => ({
      ...p,
      items: p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setPantry((p) => ({ ...p, items: p.items.filter((i) => i.id !== id) }));
  }, []);

  const moveItem = useCallback((id: string, shelfId: string) => {
    setPantry((p) => ({
      ...p,
      items: p.items.map((i) => (i.id === id ? { ...i, shelfId } : i)),
    }));
  }, []);

  const useOne = useCallback((id: string) => {
    setPantry((p) => ({
      ...p,
      items: p.items.map((i) =>
        i.id === id ? { ...i, qty: Math.max(0, Math.round((i.qty - 1) * 100) / 100) } : i,
      ),
    }));
  }, []);

  const addShelf = useCallback((draft: Omit<Shelf, "id">) => {
    const id = uid();
    setPantry((p) => ({ ...p, shelves: [...p.shelves, { ...draft, id }] }));
    return id;
  }, []);

  const updateShelf = useCallback((id: string, patch: Partial<Omit<Shelf, "id">>) => {
    setPantry((p) => ({
      ...p,
      shelves: p.shelves.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const removeShelf = useCallback((id: string) => {
    setPantry((p) => ({
      ...p,
      shelves: p.shelves.filter((s) => s.id !== id),
      items: p.items.filter((i) => i.shelfId !== id),
    }));
  }, []);

  const moveShelf = useCallback((id: string, dir: -1 | 1) => {
    setPantry((p) => {
      const idx = p.shelves.findIndex((s) => s.id === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= p.shelves.length) return p;
      const shelves = [...p.shelves];
      [shelves[idx], shelves[next]] = [shelves[next], shelves[idx]];
      return { ...p, shelves };
    });
  }, []);

  const replacePantry = useCallback((next: Pantry) => setPantry(next), []);

  const clearAll = useCallback(() => {
    setPantry((p) => ({ ...p, items: [] }));
  }, []);

  return useMemo(
    () => ({
      pantry,
      itemsInShelf,
      shelfById,
      addItem,
      updateItem,
      removeItem,
      moveItem,
      useOne,
      addShelf,
      updateShelf,
      removeShelf,
      moveShelf,
      replacePantry,
      clearAll,
    }),
    [
      pantry,
      itemsInShelf,
      shelfById,
      addItem,
      updateItem,
      removeItem,
      moveItem,
      useOne,
      addShelf,
      updateShelf,
      removeShelf,
      moveShelf,
      replacePantry,
      clearAll,
    ],
  );
}
