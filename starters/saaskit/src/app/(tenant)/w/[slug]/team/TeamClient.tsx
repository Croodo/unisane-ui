"use client";

import { useMemo, useState } from "react";
import { Button } from "@unisane/ui/components/button";
import { Badge } from "@unisane/ui/components/badge";
import { useSession } from "@/src/hooks/use-session";
import { toast } from "@unisane/ui/components/toast";
import { normalizeError } from "@/src/sdk/errors";
import { hooks } from "@/src/sdk/hooks";
import { DataTable } from "@unisane/data-table";
import type { Column } from "@unisane/data-table";
import { Icon } from "@unisane/ui/primitives/icon";
import { EmptyState } from "@/src/components/feedback";
import { PageLayout } from "@/src/context/usePageLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@unisane/ui/components/dropdown-menu";
import { ConfirmDialog } from "@unisane/ui/components/confirm-dialog";
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
  const tenantId = me?.scopeId ?? undefined;
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
              <div className="h-8 w-8 rounded-full bg-surface-container flex items-center justify-center text-sm font-medium">
                {initial}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{displayName}</span>
                  {isCurrentUser && (
                    <Badge variant="outlined" className="text-xs">
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
                      <span className="text-xs text-on-surface-variant">
                        {userEmail}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
              {memberIsAdmin && (
                <Badge variant="tonal" className="ml-auto">
                  <Icon symbol="verified_user" size="xs" className="mr-1" />
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
                <Badge key={r.roleId} variant="outlined" className="text-xs">
                  {r.roleId}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-on-surface-variant text-sm">Member</span>
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
                <Button variant="text" size="sm" className="h-8 w-8 p-0">
                  <Icon symbol="more_vert" size="sm" />
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
                    <Icon symbol="shield" size="sm" className="mr-2" />
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
                    <Icon symbol="verified_user" size="sm" className="mr-2" />
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
                  className="text-error"
                >
                  <Icon symbol="person_remove" size="sm" className="mr-2" />
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
      <PageLayout subtitle="Manage workspace members and their roles." />

      {items.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <EmptyState
            icon="group"
            title="No team members yet"
            description="You're the only member of this workspace. Invite functionality coming soon."
            action={{
              label: "Invite Members",
              disabled: true,
            }}
          />
        </div>
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
      <ConfirmDialog
        open={removeAdminDialog.open}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setRemoveAdminDialog({ open: false, userId: "", userName: "" });
          }
        }}
        title="Remove Admin Privileges"
        description={`Are you sure you want to remove admin privileges from ${removeAdminDialog.userName}? They will no longer be able to manage workspace settings and members.`}
        variant="danger"
        confirmLabel="Remove Admin"
        cancelLabel="Cancel"
        onConfirm={handleRemoveAdmin}
        loading={removeRole.isPending}
      />

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDialog
        open={removeMemberDialog.open}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setRemoveMemberDialog({ open: false, userId: "", userName: "" });
          }
        }}
        title="Remove Member"
        description={`Are you sure you want to remove ${removeMemberDialog.userName} from this workspace? They will lose access to all workspace resources.`}
        variant="danger"
        confirmLabel="Remove Member"
        cancelLabel="Cancel"
        onConfirm={handleRemoveMember}
        loading={removeMember.isPending}
      />
    </>
  );
}

export default TeamClient;
