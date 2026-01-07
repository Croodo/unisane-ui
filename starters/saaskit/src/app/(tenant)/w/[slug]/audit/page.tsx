import { notFound } from "next/navigation";
import AuditClient from "./AuditClient";

export default async function AuditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) notFound();
  return <AuditClient />;
}

