import Link from "next/link";
import { ArrowRight, Construction } from "lucide-react";
import { StoreHeader } from "@/components/store-header";

export default function PcBuilderPage() { return <main><StoreHeader /><section className="empty-state shell"><Construction size={32} /><p className="eyebrow">Blueprint in progress</p><h1>PC Builder is<br /><em>being considered.</em></h1><p>Kami sedang membangun cara yang benar untuk merakit PC—berdasarkan tujuan, kompatibilitas nyata, dan pilihan yang mudah dijelaskan.</p><Link className="button button--solid" href="/katalog">Sementara, lihat katalog <ArrowRight size={17} /></Link></section></main>; }
