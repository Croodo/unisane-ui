import { KIT_ID, KIT_CHANNEL, KIT_VERSION } from "@/src/shared/kitVersion";

export default async function AdminHealthPage() {
  const [ready, health] = await Promise.all([
    fetch('/api/ready', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
    fetch('/api/health', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
  ]);
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Health</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border p-4 text-sm">
          <div className="font-medium mb-2">Kit</div>
          <div>ID: {KIT_ID}</div>
          <div>Channel: {KIT_CHANNEL}</div>
          <div>Version: {KIT_VERSION}</div>
        </div>
        <div className="rounded border p-4 text-sm">
          <div className="font-medium mb-2">Endpoints</div>
          <div>/api/ready: {ready?.ok ? 'OK' : 'Fail'}</div>
          <div>/api/health: {health?.ok ? 'OK' : 'Fail'}</div>
        </div>
      </div>
    </section>
  );
}
