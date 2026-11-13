import { notFound } from "next/navigation";
import PlanView from "@/components/PlanView";
import { isRole } from "@/lib/plan";

export default async function RolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (!isRole(role)) notFound();
  return <PlanView role={role} />;
}
