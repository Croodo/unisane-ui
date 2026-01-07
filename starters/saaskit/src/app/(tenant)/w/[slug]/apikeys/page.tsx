import { notFound } from "next/navigation";
import { ApiKeysClient } from "./ApiKeysClient";

export default async function ApiKeysPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Workspace layout already 404s on unknown slug and gates auth
  if (!slug) notFound();
  return <ApiKeysClient />;
}
