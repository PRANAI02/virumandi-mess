// ============================================================
// SITE CONTENT — one file drives the whole site.
//
// Sources: the mess's own Instagram (@virumandimess), the Tamil
// reel filmed on site, and their Google listing. Nothing here is
// invented — where a detail wasn't verifiable it is left out or
// marked TODO.
// ============================================================

export const INFO = {
  name: "Virumandi Mess",
  nameTa: "விருமாண்டி மெஸ்",
  city: "Bengaluru",
  handle: "virumandimess",
  tagline: "Tamil Nadu meals, served on a banana leaf",
  address:
    "3rd Floor, 412/1, 5th Main Road, HRBR Layout 2nd Block, Kalyan Nagar, Bengaluru, Karnataka 560043",
  addressShort: "HRBR Layout · Kammanahalli",
  landmark: "3rd floor, next to Polar Bear",
  hours: "Tue–Sun · Lunch & Dinner",
  hoursNote: "Closed Mondays",
  instagram: "https://www.instagram.com/virumandimess/",
  instagramDM: "https://ig.me/m/virumandimess",
  reviewReelUrl: "https://www.instagram.com/preethi_rtf/reel/DcAqqvJIPTJ/",

  // TODO — the mess has no phone number on its Google listing yet and no
  // WhatsApp in its Instagram bio. Fill these in and the WhatsApp button
  // and contact links switch on automatically.
  whatsappRaw: "", // digits only, e.g. "919876543210"
  whatsappDisplay: "",
  phone: "",

  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Virumandi+Mess+HRBR+Layout+Bengaluru",
  mapEmbed:
    "https://maps.google.com/maps?q=Virumandi%20Mess%2C%20412%2F1%2C%205th%20Main%20Rd%2C%20HRBR%20Layout%202nd%20Block%2C%20Kalyan%20Nagar%2C%20Bengaluru%20560043&t=&z=16&ie=UTF8&iwloc=&output=embed",
};

// Straight from the Google listing.
export const HOURS: { day: string; times: string[] }[] = [
  { day: "Monday", times: ["Closed"] },
  { day: "Tuesday", times: ["12 – 3:30 PM", "7 – 7:30 PM"] },
  { day: "Wednesday", times: ["12 – 3:30 PM", "7 – 10:30 PM"] },
  { day: "Thursday", times: ["12 – 3:30 PM", "7 – 10:30 PM"] },
  { day: "Friday", times: ["12 – 3:30 PM", "7 – 10:30 PM"] },
  { day: "Saturday", times: ["12 – 3:30 PM", "7 – 10:30 PM"] },
  { day: "Sunday", times: ["12 – 3:30 PM", "7 – 10:30 PM"] },
];

export type Dish = {
  key: string;
  ta: string;
  name: string;
  note: string;
  img: string;
  kaaram: number; // 1–3
};

export const SIGNATURES: Dish[] = [
  {
    key: "Meals",
    ta: "மட்டன் சாப்பாடு",
    name: "Mutton Meals",
    note: "Rice, kuzhambu, rasam, poriyal and mutton on the leaf.",
    img: "/images/mutton-meals.jpg",
    kaaram: 2,
  },
  {
    key: "From the fryer",
    ta: "மீன் வறுவல்",
    name: "Meen Varuval",
    note: "A whole fish, masala-rubbed and fried through.",
    img: "/images/meen-varuval.jpg",
    kaaram: 3,
  },
  {
    key: "From the fryer",
    ta: "மட்டன் வறுவல்",
    name: "Mutton Fry",
    note: "Fried down slowly with pepper and curry leaf.",
    img: "/images/mutton-fry.jpg",
    kaaram: 3,
  },
  {
    key: "Dry roast",
    ta: "சிக்கன் சுக்கா",
    name: "Chicken Chukka",
    note: "Dry-roasted in chilli masala, finished with curry leaf.",
    img: "/images/chicken-chukka.jpg",
    kaaram: 3,
  },
  {
    key: "Rice",
    ta: "இறால் தொக்கு பிரியாணி",
    name: "Prawn Thokku Biryani",
    note: "Cooked down with prawn thokku. Dalcha alongside.",
    img: "/images/prawn-biryani.jpg",
    kaaram: 2,
  },
  {
    key: "With the meals",
    ta: "பொரியல் & குழம்பு",
    name: "Poriyal & Kuzhambu",
    note: "Potato fry, the day's poriyal, rasam and kuzhambu.",
    img: "/images/urulai-fry.jpg",
    kaaram: 1,
  },
];

// What lands on the leaf, in the order it arrives.
export const LEAF: { n: string; ta: string; name: string; note: string }[] = [
  {
    n: "01",
    ta: "வாழை இலை",
    name: "The leaf",
    note: "Laid out and wiped down in front of you.",
  },
  {
    n: "02",
    ta: "சாதம்",
    name: "Rice",
    note: "Straight from the pot, onto the middle of the leaf.",
  },
  {
    n: "03",
    ta: "குழம்பு",
    name: "Kuzhambu",
    note: "Kara kuzhambu, dalcha and the day's curry.",
  },
  {
    n: "04",
    ta: "ரசம்",
    name: "Rasam",
    note: "Thin and peppery. It comes last, over the rice.",
  },
  {
    n: "05",
    ta: "பொரியல்",
    name: "Poriyal & urulai",
    note: "A vegetable poriyal and a turmeric-yellow potato fry.",
  },
  {
    n: "06",
    ta: "வறுவல்",
    name: "Your fry",
    note: "Mutton, chicken, fish, prawn or crab. You choose.",
  },
  {
    n: "07",
    ta: "தயிர்",
    name: "Curd & appalam",
    note: "Curd rice to finish, with onion and lemon at the edge.",
  },
];

export type MenuItem = { name: string; ta?: string; desc?: string; kaaram?: number; veg?: boolean };
export type MenuCategory = { title: string; ta: string; kicker: string; items: MenuItem[] };

export const MENU: MenuCategory[] = [
  {
    title: "Meals",
    ta: "சாப்பாடு",
    kicker: "On a banana leaf",
    items: [
      { name: "Mutton Meals", ta: "மட்டன் சாப்பாடு", desc: "With rice, kuzhambu, rasam and poriyal", kaaram: 2 },
      { name: "Fish Meals", ta: "மீன் சாப்பாடு", desc: "The same leaf, with a fish fry", kaaram: 2 },
    ],
  },
  {
    title: "Varuval & Chukka",
    ta: "வறுவல்",
    kicker: "Ordered to the side",
    items: [
      { name: "Mutton Fry", ta: "மட்டன் வறுவல்", desc: "Pepper and curry leaf", kaaram: 3 },
      { name: "Fish Fry", ta: "மீன் வறுவல்", desc: "Whole fish, masala-rubbed", kaaram: 3 },
      { name: "Chicken Chukka", ta: "சிக்கன் சுக்கா", desc: "Dry-roasted and tempered", kaaram: 3 },
      { name: "Crab Roast", ta: "நண்டு வறுவல்", desc: "Roasted in a thick masala", kaaram: 3 },
    ],
  },
  {
    title: "Kuzhambu",
    ta: "குழம்பு",
    kicker: "With rice or on the leaf",
    items: [
      { name: "Prawn Gravy", ta: "இறால் குழம்பு", desc: "Sharp with tamarind", kaaram: 3 },
      { name: "Dalcha", ta: "தால்ச்சா", desc: "Lentil and bottle-gourd", kaaram: 1 },
      { name: "Rasam", ta: "ரசம்", desc: "Peppery and thin", kaaram: 2, veg: true },
    ],
  },
  {
    title: "Biryani",
    ta: "பிரியாணி",
    kicker: "With dalcha",
    items: [
      { name: "Prawn Thokku Biryani", ta: "இறால் தொக்கு பிரியாணி", desc: "Cooked down with prawn thokku", kaaram: 2 },
      { name: "Biryani", ta: "பிரியாணி", desc: "Ask for the day's biryani", kaaram: 2 },
    ],
  },
  {
    title: "On the leaf",
    ta: "இலையில்",
    kicker: "Comes with a meals plate",
    items: [
      { name: "Rice", ta: "சாதம்", desc: "Served onto the leaf", veg: true },
      { name: "Poriyal", ta: "பொரியல்", desc: "The day's vegetable side", veg: true },
      { name: "Urulai Fry", ta: "உருளை வறுவல்", desc: "Turmeric-yellow, fried in the pan", veg: true },
      { name: "Curd", ta: "தயிர்", desc: "To finish, with rice", veg: true },
      { name: "Appalam", ta: "அப்பளம்", desc: "One to a leaf", veg: true },
      { name: "Onion & Lemon", ta: "வெங்காயம் & எலுமிச்சை", desc: "At the edge of the leaf", veg: true },
    ],
  },
];

export const CHANNELS = [
  {
    name: "Instagram",
    desc: "The day's plates",
    href: INFO.instagram,
    cta: `Follow @${INFO.handle}`,
  },
  {
    name: "Direct message",
    desc: "Large tables and questions",
    href: INFO.instagramDM,
    cta: "Message us",
  },
  {
    name: "Google Maps",
    desc: "3rd floor, next to Polar Bear",
    href: INFO.mapsUrl,
    cta: "Get directions",
  },
];
