import { kvGet, kvSet } from "./store";

/**
 * The orderable catalogue.
 *
 * Dish names are the ones the mess actually serves (verified from their own
 * posts and the reel filmed on site). The PRICES BELOW ARE PLACEHOLDERS — no
 * price list has ever been published for this mess, so the restaurant must set
 * real ones in /admin before taking a single live order. Everything the admin
 * edits is stored as an override on top of these defaults.
 */

export type CatalogItem = {
  id: string;
  name: string;
  ta: string;
  desc: string;
  category: string;
  price: number; // whole rupees
  veg?: boolean;
  kaaram?: number;
  img?: string;
};

export const DEFAULT_ITEMS: CatalogItem[] = [
  {
    id: "mutton-meals",
    name: "Mutton Meals",
    ta: "மட்டன் சாப்பாடு",
    desc: "Rice, kuzhambu, rasam, poriyal and mutton on the leaf",
    category: "Meals",
    price: 220,
    kaaram: 2,
    img: "/images/mutton-meals.jpg",
  },
  {
    id: "fish-meals",
    name: "Fish Meals",
    ta: "மீன் சாப்பாடு",
    desc: "The same leaf, with a fish fry",
    category: "Meals",
    price: 200,
    kaaram: 2,
    img: "/images/meals-leaf.jpg",
  },
  {
    id: "mutton-fry",
    name: "Mutton Fry",
    ta: "மட்டன் வறுவல்",
    desc: "Fried down slowly with pepper and curry leaf",
    category: "Varuval & Chukka",
    price: 260,
    kaaram: 3,
    img: "/images/mutton-fry.jpg",
  },
  {
    id: "meen-varuval",
    name: "Meen Varuval",
    ta: "மீன் வறுவல்",
    desc: "A whole fish, masala-rubbed and fried through",
    category: "Varuval & Chukka",
    price: 240,
    kaaram: 3,
    img: "/images/meen-varuval.jpg",
  },
  {
    id: "chicken-chukka",
    name: "Chicken Chukka",
    ta: "சிக்கன் சுக்கா",
    desc: "Dry-roasted in chilli masala, finished with curry leaf",
    category: "Varuval & Chukka",
    price: 230,
    kaaram: 3,
    img: "/images/chicken-chukka.jpg",
  },
  {
    id: "crab-roast",
    name: "Crab Roast",
    ta: "நண்டு வறுவல்",
    desc: "Roasted in a thick masala",
    category: "Varuval & Chukka",
    price: 320,
    kaaram: 3,
    img: "/images/chukka-plate.jpg",
  },
  {
    id: "prawn-gravy",
    name: "Prawn Gravy",
    ta: "இறால் குழம்பு",
    desc: "Eral kuzhambu, sharp with tamarind",
    category: "Kuzhambu",
    price: 240,
    kaaram: 3,
    img: "/images/kuzhambu.jpg",
  },
  {
    id: "dalcha",
    name: "Dalcha",
    ta: "தால்ச்சா",
    desc: "Lentil and bottle-gourd",
    category: "Kuzhambu",
    price: 90,
    kaaram: 1,
    img: "/images/kuzhambu.jpg",
  },
  {
    id: "prawn-thokku-biryani",
    name: "Prawn Thokku Biryani",
    ta: "இறால் தொக்கு பிரியாணி",
    desc: "Cooked down with prawn thokku, dalcha alongside",
    category: "Biryani",
    price: 260,
    kaaram: 2,
    img: "/images/prawn-biryani.jpg",
  },
  {
    id: "biryani",
    name: "Biryani",
    ta: "பிரியாணி",
    desc: "The day's biryani",
    category: "Biryani",
    price: 220,
    kaaram: 2,
    img: "/images/prawn-biryani.jpg",
  },
  {
    id: "urulai-fry",
    name: "Urulai Fry",
    ta: "உருளை வறுவல்",
    desc: "Potato, turmeric-yellow, fried in the pan",
    category: "Sides",
    price: 80,
    veg: true,
    img: "/images/urulai-fry.jpg",
  },
  {
    id: "extra-rice",
    name: "Extra Rice",
    ta: "கூடுதல் சாதம்",
    desc: "A second helping",
    category: "Sides",
    price: 40,
    veg: true,
    img: "/images/rice-serve.jpg",
  },
];

export const CATEGORY_ORDER = [
  "Meals",
  "Varuval & Chukka",
  "Biryani",
  "Kuzhambu",
  "Sides",
];

export type Settings = {
  acceptingOrders: boolean;
  deliveryFee: number;
  freeDeliveryAbove: number; // 0 = never free
  packagingFee: number;
  minOrder: number;
  /** Set true once real prices have been entered in /admin. */
  pricesConfirmed: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  acceptingOrders: true,
  deliveryFee: 45,
  freeDeliveryAbove: 0,
  packagingFee: 10,
  minOrder: 150,
  pricesConfirmed: false,
};

/** Admin-editable layer stored in KV. */
export type CatalogOverrides = {
  price: Record<string, number>;
  unavailable: string[];
  settings: Settings;
};

const KEY = "vm:catalog";

const EMPTY: CatalogOverrides = {
  price: {},
  unavailable: [],
  settings: DEFAULT_SETTINGS,
};

export async function getOverrides(): Promise<CatalogOverrides> {
  const stored = await kvGet<Partial<CatalogOverrides>>(KEY);
  return {
    price: stored?.price ?? {},
    unavailable: stored?.unavailable ?? [],
    settings: { ...DEFAULT_SETTINGS, ...(stored?.settings ?? {}) },
  };
}

export async function saveOverrides(next: CatalogOverrides): Promise<void> {
  await kvSet(KEY, next);
}

export type ResolvedItem = CatalogItem & { available: boolean };

/** Defaults with the admin's prices and availability applied. */
export async function getCatalog(): Promise<{
  items: ResolvedItem[];
  settings: Settings;
}> {
  const o = await getOverrides();
  const items = DEFAULT_ITEMS.map((item) => ({
    ...item,
    price: o.price[item.id] ?? item.price,
    available: !o.unavailable.includes(item.id),
  }));
  return { items, settings: o.settings };
}

export { EMPTY as EMPTY_OVERRIDES };
