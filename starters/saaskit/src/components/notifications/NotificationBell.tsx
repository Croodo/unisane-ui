"use client";

import { Button } from "@unisane/ui/components/button";
import { Icon } from "@unisane/ui/primitives/icon";
import { Text } from "@unisane/ui/primitives/text";
import { Popover } from "@unisane/ui/components/popover";
import { ScrollArea } from "@unisane/ui/components/scroll-area";
import { cn } from "@unisane/ui/lib/utils";
import { hooks } from "@/src/sdk/hooks";
import type { NotifyListInappItem } from "@/src/sdk/types";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

const CATEGORY_COLORS: Record<string, string> = {
  billing: "bg-primary",
  alerts: "bg-error",
  product_updates: "bg-tertiary",
  system: "bg-on-surface-variant",
};

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: NotifyListInappItem;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const isUnread = !notification.readAt;
  const categoryColor = CATEGORY_COLORS[notification.category] || "bg-on-surface-variant";

  return (
    <div
      className={cn(
        "flex gap-3 p-3 border-b border-outline-variant last:border-b-0 transition-colors",
        isUnread ? "bg-surface-container-low" : "bg-surface"
      )}
    >
      <div
        className={cn("w-2 h-2 rounded-full mt-2 shrink-0", categoryColor)}
      />
      <div className="flex-1 min-w-0">
        <Text variant="bodyMedium" className={cn(isUnread && "font-medium")}>
          {notification.title}
        </Text>
        <Text variant="bodySmall" color="onSurfaceVariant" className="line-clamp-2 mt-0.5">
          {notification.body}
        </Text>
        <Text variant="labelSmall" color="onSurfaceVariant" className="mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </Text>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        {isUnread && (
          <Button
            variant="text"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead();
            }}
            title="Mark as read"
          >
            <Icon symbol="check" size="xs" />
          </Button>
        )}
        <Button
          variant="text"
          size="sm"
          className="h-6 w-6 p-0 text-on-surface-variant hover:text-error"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete"
        >
          <Icon symbol="delete" size="xs" />
        </Button>
      </div>
    </div>
  );
}

type NotificationBellProps = {
  tenantId?: string | undefined;
};

/**
 * NotificationBell component using SSOT generated hooks.
 * Pattern: hooks.namespace.endpoint({ params, query }, options)
 * Types imported from src/sdk/types (codegen generated)
 */
export function NotificationBell({ tenantId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const enabled = Boolean(tenantId);

  // SSOT: Use generated hooks directly from contract
  const listQuery = hooks.notify.listInapp(
    tenantId ? { params: { tenantId }, query: { limit: 20 } } : undefined,
    { enabled, refetchOnWindowFocus: false }
  );

  const unreadQuery = hooks.notify.unreadCount(
    tenantId ? { params: { tenantId } } : undefined,
    { enabled, refetchOnWindowFocus: false }
  );

  // SSOT: Mutations from generated hooks
  const markReadMutation = hooks.notify.markInappRead();
  const markAllSeenMutation = hooks.notify.markInappAllSeen();
  const deleteMutation = hooks.notify.deleteInapp();
  const deleteAllMutation = hooks.notify.deleteAllInapp();

  // Extract data - types from sdk/types (SSOT)
  const notifications = ((listQuery.data as { items?: NotifyListInappItem[] })
    ?.items ?? []) as NotifyListInappItem[];
  const unreadCount =
    (unreadQuery.data as { count?: number } | undefined)?.count ?? 0;
  const isLoading = listQuery.isLoading || unreadQuery.isLoading;

  const handleMarkRead = async (id: string) => {
    if (!tenantId) return;
    try {
      await markReadMutation.mutateAsync({
        params: { tenantId },
        body: { id },
      });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!tenantId) return;
    try {
      await deleteMutation.mutateAsync({
        params: { tenantId, id },
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleMarkAllSeen = async () => {
    if (!tenantId) return;
    try {
      await markAllSeenMutation.mutateAsync({
        params: { tenantId },
      });
    } catch (err) {
      console.error("Failed to mark all as seen:", err);
    }
  };

  const handleDeleteAll = async () => {
    if (!tenantId) return;
    try {
      await deleteAllMutation.mutateAsync({
        params: { tenantId },
      });
    } catch (err) {
      console.error("Failed to delete all:", err);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="text" size="sm" className="relative p-2">
          <Icon symbol="notifications" size="sm" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-error text-on-error text-label-small flex items-center justify-center font-medium">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      }
      align="end"
      content={
        <div className="w-80 p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <Text variant="titleSmall">Notifications</Text>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="text"
                  size="sm"
                  className="h-7 text-label-small"
                  onClick={handleMarkAllSeen}
                >
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="text"
                  size="sm"
                  className="h-7 text-label-small text-on-surface-variant"
                  onClick={handleDeleteAll}
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Text variant="bodyMedium" color="onSurfaceVariant">Loading...</Text>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-on-surface-variant">
                <Icon symbol="notifications_off" size="lg" />
                <Text variant="bodyMedium">No notifications</Text>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={() => handleMarkRead(notification.id)}
                  onDelete={() => handleDelete(notification.id)}
                />
              ))
            )}
          </ScrollArea>
        </div>
      }
    />
  );
}
