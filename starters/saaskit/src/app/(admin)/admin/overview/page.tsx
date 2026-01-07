import { requireAdmin } from "@/src/app/_server/requireAuth";
import OverviewClient from "./OverviewClient";

export default async function OverviewPage() {
  await requireAdmin();

  return <OverviewClient />;
}
