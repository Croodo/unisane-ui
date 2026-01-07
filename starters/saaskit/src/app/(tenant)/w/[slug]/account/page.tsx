import { notFound } from "next/navigation";
import { AccountClient } from "./AccountClient";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) notFound();
  return <AccountClient />;
}
