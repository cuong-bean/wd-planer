import { notFound } from "next/navigation";
import SectionView from "@/components/SectionView";
import { SECTIONS, isRole, isSection } from "@/lib/plan";

export const dynamicParams = false;

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ section: s.id }));
}

export default async function SectionPage({ params }: { params: Promise<{ role: string; section: string }> }) {
  const { role, section } = await params;
  if (!isRole(role) || !isSection(section)) notFound();
  return <SectionView role={role} section={section} />;
}
