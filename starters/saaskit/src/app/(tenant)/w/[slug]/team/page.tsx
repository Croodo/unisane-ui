import { notFound } from "next/navigation";
import { TeamClient } from "./TeamClient";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) notFound();
  return <TeamClient />;
}
