import { notFound } from "next/navigation";
import WebhooksClient from "./WebhooksClient";

export default async function WebhooksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) notFound();
  return <WebhooksClient />;
}

