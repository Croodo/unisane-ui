import { notFound } from "next/navigation";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Workspace layout already validates slug and gates auth
  if (!slug) notFound();
  return <SettingsClient />;
}
