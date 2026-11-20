export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: "Hardware" | "Accessories" | "Peripherals";
  price: number;
  oldPrice?: number;
  stock: number;
  image: string;
  imageAlt: string;
  description: string;
  specs: string[];
  label?: string;
};

// Keep these IDs in sync with supabase/seed.sql so the browser cart and the
// database-backed checkout resolve to the same product rows.
export const products: Product[] = [
  {
    id: "8f14e45f-ceea-467f-a8a1-0f1c9a1b2c01",
    slug: "orbit-rx-7800-xt",
    name: "Orbit RX 7800 XT",
    brand: "Sapphire",
    category: "Hardware",
    price: 8299000,
    oldPrice: 8599000,
    stock: 7,
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Computer graphics card detail",
    description: "Ruang untuk frame rate tinggi, dirancang untuk setup 1440p yang bersih dan senyap.",
    specs: ["16GB GDDR6", "Dual fan", "PCIe 4.0"],
    label: "Performance pick",
  },
  {
    id: "8f14e45f-ceea-467f-a8a1-0f1c9a1b2c02",
    slug: "nova-27-qhd",
    name: "Nova 27 QHD",
    brand: "ViewSonic",
    category: "Peripherals",
    price: 3499000,
    stock: 12,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Minimal desktop monitor setup",
    description: "Panel QHD yang tajam dengan tampilan jernih untuk bermain, bekerja, dan berkarya.",
    specs: ["27 inch IPS", "165Hz", "QHD 2560×1440"],
    label: "Desk essential",
  },
  {
    id: "8f14e45f-ceea-467f-a8a1-0f1c9a1b2c03",
    slug: "core-x-7700",
    name: "Core X 7700",
    brand: "AMD",
    category: "Hardware",
    price: 4899000,
    stock: 5,
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Computer circuit board closeup",
    description: "Prosesor efisien untuk workstation kreatif dan rig gaming yang responsif.",
    specs: ["8 Core", "5.3GHz Boost", "AM5"],
  },
  {
    id: "8f14e45f-ceea-467f-a8a1-0f1c9a1b2c04",
    slug: "arc-75-mechanical",
    name: "Arc 75 Mechanical",
    brand: "Keychron",
    category: "Accessories",
    price: 1499000,
    stock: 18,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Mechanical keyboard on desk",
    description: "Keyboard mekanikal ringkas dengan rasa tekan yang mantap dan profil profesional.",
    specs: ["75% layout", "Hot-swappable", "Wireless"],
  },
];

export const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
