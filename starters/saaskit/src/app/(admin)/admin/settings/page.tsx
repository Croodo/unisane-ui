import AdminSettingsClient from "./settingsClient";

export const runtime = "nodejs";

export default async function AdminSettingsPage() {
  return <AdminSettingsClient />;
}
