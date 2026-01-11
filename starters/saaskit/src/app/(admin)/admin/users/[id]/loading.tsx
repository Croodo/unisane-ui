import { Card } from "@unisane/ui/components/card";

export default function AdminUserDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-24 animate-pulse bg-surface-container" />
        ))}
      </div>
      <Card className="h-64 animate-pulse bg-surface-container" />
    </div>
  );
}
