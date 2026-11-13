import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import { isRole } from "@/lib/plan";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ role: "co-dau" }, { role: "chu-re" }];
}

export default async function RoleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (!isRole(role)) notFound();
  return <Shell role={role}>{children}</Shell>;
}
