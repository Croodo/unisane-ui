"use client";

import { useMemo, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useSession } from "@/src/hooks/useSession";
import { toast } from "sonner";
import { normalizeError } from "@/src/sdk/errors";
import { hooks } from "@/src/sdk/hooks";
import { DataTable } from "@unisane/data-table";
import type { Column } from "@unisane/data-table";
import {
  UserPlus,
  ShieldCheck,
  ShieldOff,
  Users,
  MoreVertical,
} from "lucide-react";
import { EmptyState } from "@/src/components/feedback";
import { PageHeader } from "@/src/context/usePageHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import type { MembershipsListItem } from "@/src/sdk/types";

/**
 * Format user ID for display - shows abbreviated ID
 */
function formatUserId(userId: string): string {
  if (userId.length <= 12) return userId;
  return `${userId.slice(0, 6)}…${userId.slice(-4)}`;
}

/**
 * Check if member has admin role
 */
function isAdmin(member: MembershipsListItem): boolean {
  return (member.roles ?? []).some((r: { roleId: string }) => r.roleId === "admin");
}

export function TeamClient() {
  const { me } = useSession();
  const tenantId = me?.tenantId ?? undefined;
  const currentUserId = me?.userId;

  // State for remove admin confirmation dialog
  const [removeAdminDialog, setRemoveAdminDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  }>({ open: false, userId: "", userName: "" });

  // State for remove member confirmation dialog
  const [removeMemberDialog, setRemoveMemberDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  }>({ open: false, userId: "", userName: "" });

  // Use regular list hook instead of infinite
  const membershipsQuery = hooks.memberships.list(
    tenantId ? { params: { tenantId }, query: { limit: 100 } } : undefined,
    { enabled: Boolean(tenantId) }
  );

  if (membershipsQuery.isError) {
    const ne = normalizeError(membershipsQuery.error);
    toast.error("Failed to load members", {
      description: ne.rawMessage ?? ne.message,
    });
  }

  // Data is directly an array from list hook
  const items = useMemo<MembershipsListItem[]>(() => {
    return Array.isArray(membershipsQuery.data)
      ? (membershipsQuery.data as MembershipsListItem[])
      : [];
  }, [membershipsQuery.data]);

  const addRole = hooks.memberships.addRole({
    onSuccess: () => {
      void membershipsQuery.refetch();
      toast.success("Member promoted to admin");
    },
    onError: (e: unknown) =>
      toast.error("Failed to update role", {
        description: normalizeError(e).message,
      }),
  });

  const removeRole = hooks.memberships.removeRole({
    onSuccess: () => {
      void membershipsQuery.refetch();
      toast.success("Admin role removed");
      setRemoveAdminDialog({ open: false, userId: "", userName: "" });
    },
    onError: (e: unknown) =>
      toast.error("Failed to update role", {
        description: normalizeError(e).message,
      }),
  });

  const removeMember = hooks.memberships.remove({
    onSuccess: () => {
      void membershipsQuery.refetch();
      toast.success("Member removed from workspace");
      setRemoveMemberDialog({ open: false, userId: "", userName: "" });
    },
    onError: (e: unknown) =>
      toast.error("Failed to remove member", {
        description: normalizeError(e).message,
      }),
  });

  const handleRemoveAdmin = async () => {
    if (!tenantId || !removeAdminDialog.userId) return;
    await removeRole.mutateAsync({
      params: { tenantId, userId: removeAdminDialog.userId },
      body: { roleId: "admin" },
    });
  };

  const handleRemoveMember = async () => {
    if (!tenantId || !removeMemberDialog.userId) return;
    await removeMember.mutateAsync({
      params: { tenantId, userId: removeMemberDialog.userId },
      body: undefined,
    });
  };

  const columns = useMemo<Column<MembershipsListItem>[]>(
    () => [
      {
        key: "member",
        header: "Member",
        render: (row) => {
          const memberIsAdmin = isAdmin(row);
          const isCurrentUser = row.userId === currentUserId;
          // Use backend-populated fields: userName, userEmail
          const displayName =
            ((row as Record<string, unknown>).userName as string) ||
            ((row as Record<string, unknown>).userEmail as string) ||
            `User ${formatUserId(row.userId)}`;
          const initial = displayName.charAt(0).toUpperCase();
          return (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                {initial}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{displayName}</span>
                  {isCurrentUser && (
                    <Badge variant="outline" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
                {(() => {
                  const userEmail = (row as Record<string, unknown>)
                    .userEmail as string | undefined;
                  const userName = (row as Record<string, unknown>).userName as
                    | string
                    | undefined;
                  if (userEmail && userName && userEmail !== userName) {
                    return (
                      <span className="text-xs text-muted-foreground">
                        {userEmail}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
              {memberIsAdmin && (
                <Badge variant="secondary" className="ml-auto">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        key: "roles",
        header: "Roles",
        width: 200,
        render: (row) =>
          (row.roles ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {row.roles.map((r: { roleId: string }) => (
                <Badge key={r.roleId} variant="outline" className="text-xs">
                  {r.roleId}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">Member</span>
          ),
      },
      {
        key: "joined",
        header: "Joined",
        width: 140,
        render: (row) =>
          row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "—",
      },
      {
        key: "actions",
        header: "",
        align: "end",
        width: 120,
        render: (row) => {
          const memberIsAdmin = isAdmin(row);
          const isCurrentUser = row.userId === currentUserId;
          const displayName =
            ((row as Record<string, unknown>).userName as string) ||
            ((row as Record<string, unknown>).userEmail as string) ||
            `User ${formatUserId(row.userId)}`;

          // Don't show actions for self
          if (isCurrentUser) return null;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {memberIsAdmin ? (
                  <DropdownMenuItem
                    onClick={() => {
                      setRemoveAdminDialog({
                        open: true,
                        userId: row.userId,
                        userName: displayName,
                      });
                    }}
                    disabled={removeRole.isPending}
                  >
                    <ShieldOff className="h-4 w-4 mr-2" />
                    Remove Admin
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={async () => {
                      if (!tenantId) return;
                      await addRole.mutateAsync({
                        params: { tenantId, userId: row.userId },
                        body: { roleId: "admin" },
                      });
                    }}
                    disabled={addRole.isPending}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Make Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    setRemoveMemberDialog({
                      open: true,
                      userId: row.userId,
                      userName: displayName,
                    });
                  }}
                  disabled={removeMember.isPending}
                  className="text-destructive"
                >
                  <UserPlus className="h-4 w-4 mr-2 rotate-45" />
                  Remove from Workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [addRole, removeRole, removeMember, tenantId, currentUserId]
  );

  const isLoading = membershipsQuery.isLoading && !membershipsQuery.data;

  return (
    <>
      <PageHeader
        title="Team"
        subtitle="Manage workspace members and their roles."
      />

      {items.length === 0 && !isLoading ? (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description="You're the only member of this workspace. Invite functionality coming soon."
          action={{
            label: "Invite Members",
            disabled: true,
          }}
        />
      ) : (
        <DataTable<MembershipsListItem>
          data={items}
          columns={columns}
          title="Members"
          loading={isLoading}
          tableId="tenant-team"
        />
      )}

      {/* Remove Admin Confirmation Dialog */}
      <AlertDialog
        open={removeAdminDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveAdminDialog({ open: false, userId: "", userName: "" });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Privileges</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin privileges from{" "}
              <span className="font-medium">{removeAdminDialog.userName}</span>?
              They will no longer be able to manage workspace settings and
              members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeRole.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAdmin}
              disabled={removeRole.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeRole.isPending ? "Removing…" : "Remove Admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog
        open={removeMemberDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveMemberDialog({ open: false, userId: "", userName: "" });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium">{removeMemberDialog.userName}</span>{" "}
              from this workspace? They will lose access to all workspace
              resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMember.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={removeMember.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMember.isPending ? "Removing…" : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default TeamClient;
