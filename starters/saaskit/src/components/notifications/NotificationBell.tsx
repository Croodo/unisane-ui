"use client";

import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { cn } from "@/src/lib/utils";
import { hooks } from "@/src/sdk/hooks";
import type { NotifyListInappItem } from "@/src/sdk/types";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

const CATEGORY_COLORS: Record<string, string> = {
  billing: "bg-blue-500",
  alerts: "bg-red-500",
  product_updates: "bg-purple-500",
  system: "bg-gray-500",
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
  const categoryColor = CATEGORY_COLORS[notification.category] || "bg-gray-500";

  return (
    <div
      className={cn(
        "flex gap-3 p-3 border-b last:border-b-0 transition-colors",
        isUnread ? "bg-muted/50" : "bg-background"
      )}
    >
      <div
        className={cn("w-2 h-2 rounded-full mt-2 shrink-0", categoryColor)}
      />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", isUnread && "font-medium")}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.body}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        {isUnread && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead();
            }}
            title="Mark as read"
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleMarkAllSeen}
              >
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
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
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <Bell className="h-8 w-8" />
              <p className="text-sm">No notifications</p>
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
      </PopoverContent>
    </Popover>
  );
}
