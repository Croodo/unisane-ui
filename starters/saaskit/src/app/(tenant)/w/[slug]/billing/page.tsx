import { BillingClient } from "./BillingClient";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // gated in layout
  return <BillingClient slug={slug} />;
}
