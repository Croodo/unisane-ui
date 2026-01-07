"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { toast } from "sonner";
import { useSession } from "@/src/hooks/useSession";
import { hooks } from "@/src/sdk/hooks";
import type { ApikeysListItem, ApikeysCreateResponse } from "@/src/sdk/types";
import { useApiError } from "@/src/hooks/useApiError";
import { DataTable } from "@/src/components/datatable/DataTable";
import type { Column } from "@/src/components/datatable/types";
import { PageHeader } from "@/src/context/usePageHeader";
import { Card, CardContent } from "@/src/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
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
import {
  Copy,
  Check,
  AlertTriangle,
  KeyRound,
  Plus,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

/**
 * Formats key ID for display: shows first 8 chars with ellipsis
 */
function formatKeyId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function ApiKeysClient() {
  const { me } = useSession();
  const tenantId = me?.tenantId ?? undefined;
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newToken, setNewToken] = useState<{
    token: string;
    name: string | null;
    copied: boolean;
  } | null>(null);

  // State for confirmation dialogs
  const [revokeDialog, setRevokeDialog] = useState<{
    open: boolean;
    keyId: string;
    keyName: string;
  }>({ open: false, keyId: "", keyName: "" });

  const [closeTokenDialog, setCloseTokenDialog] = useState(false);

  const handleError = useApiError();

  const create = hooks.apikeys.create({
    onSuccess: (res: ApikeysCreateResponse) => {
      const token = res?.token as string | undefined;
      const keyName = res?.name as string | null | undefined;
      if (token) {
        setNewToken({ token, name: keyName ?? null, copied: false });
      } else {
        toast.success("API key created");
        setCreateOpen(false);
      }
      setName("");
      setScopes("");
    },
    onError: (e: unknown) => {
      handleError(e, { messagePrefix: "Failed to create API key" });
    },
  });

  const revoke = hooks.apikeys.revoke({
    onSuccess: () => {
      toast.success("API key revoked");
      setRevokeDialog({ open: false, keyId: "", keyName: "" });
    },
    onError: (e: unknown) =>
      handleError(e, { messagePrefix: "Failed to revoke API key" }),
  });

  const query = hooks.apikeys.list(
    tenantId ? { params: { tenantId } } : undefined,
    {
      enabled: Boolean(tenantId),
      placeholderData: [],
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    } as unknown as {
      enabled: boolean;
      placeholderData: ApikeysListItem[];
      refetchOnWindowFocus: boolean;
      staleTime: number;
    }
  );

  const dataset = useMemo(
    () => (query.data ?? []) as ApikeysListItem[],
    [query.data]
  );

  const handleCopyToken = useCallback(async () => {
    if (!newToken) return;
    try {
      await navigator.clipboard.writeText(newToken.token);
      setNewToken((prev) => (prev ? { ...prev, copied: true } : null));
      toast.success("Token copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, [newToken]);

  const handleCloseTokenDialog = useCallback(() => {
    if (newToken && !newToken.copied) {
      // Show confirmation dialog
      setCloseTokenDialog(true);
      return;
    }
    setNewToken(null);
    setCreateOpen(false);
  }, [newToken]);

  const handleConfirmCloseToken = useCallback(() => {
    setCloseTokenDialog(false);
    setNewToken(null);
    setCreateOpen(false);
  }, []);

  const handleRevokeKey = useCallback(async () => {
    if (!tenantId || !revokeDialog.keyId) return;
    revoke.mutate({ params: { tenantId, keyId: revokeDialog.keyId } });
  }, [tenantId, revokeDialog.keyId, revoke]);

  const columns = useMemo<Column<ApikeysListItem>[]>(
    () => [
      {
        key: "name",
        header: "Name",
        width: 200,
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.name || "Unnamed key"}</span>
            <span className="text-xs text-muted-foreground font-mono">
              {formatKeyId(row.id)}
            </span>
          </div>
        ),
      },
      {
        key: "scopes",
        header: "Scopes",
        render: (row) =>
          (row.scopes ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {row.scopes.map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">No scopes</span>
          ),
      },
      {
        key: "createdAt",
        header: "Created",
        width: 180,
        render: (row) =>
          row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—",
      },
      {
        key: "actions",
        header: "",
        align: "right",
        width: 80,
        render: (row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setRevokeDialog({
                    open: true,
                    keyId: row.id,
                    keyName: row.name || "Unnamed key",
                  });
                }}
                disabled={!tenantId || revoke.isPending}
                className="text-destructive focus:text-destructive"
              >
                Revoke Key
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [revoke, tenantId]
  );

  const isLoading = query.isLoading && !query.data;

  return (
    <>
      <PageHeader
        title="API Keys"
        subtitle="Create and manage API keys for programmatic access to your workspace."
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Create Key
          </Button>
        }
      />

      <div className="space-y-6">
        {dataset.length === 0 && !isLoading && (
          <Card>
            <CardContent className="py-10 text-center">
              <KeyRound className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No API keys yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create an API key to access your workspace programmatically.
              </p>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create your first key
              </Button>
            </CardContent>
          </Card>
        )}

        {(dataset.length > 0 || isLoading) && (
          <DataTable<ApikeysListItem>
            data={dataset}
            columns={columns}
            title="API Keys"
            isLoading={isLoading}
            onRefresh={() => query.refetch?.()}
            tableId="tenant-apikeys"
          />
        )}
      </div>

      {/* Create Key Dialog */}
      <Dialog open={createOpen && !newToken} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for programmatic access to your workspace.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!tenantId) return;
              const scopesArr = scopes
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              if (scopesArr.length === 0) {
                toast.error("At least one scope is required");
                return;
              }
              create.mutate({
                params: { tenantId },
                body: {
                  scopes: scopesArr,
                  ...(name ? { name } : {}),
                },
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Production server"
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to identify this key.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scopes">Scopes</Label>
              <Input
                id="scopes"
                value={scopes}
                onChange={(e) => setScopes(e.target.value)}
                placeholder="read, write"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of permissions (e.g., read, write, admin).
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!tenantId || create.isPending}>
                {create.isPending ? "Creating…" : "Create Key"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Token Display Dialog */}
      <Dialog open={Boolean(newToken)} onOpenChange={handleCloseTokenDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              {newToken?.name
                ? `Your key "${newToken.name}" has been created.`
                : "Your API key has been created."}
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive" className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">
              Save this token now
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              This is the only time you&apos;ll see this token. Copy it now and
              store it securely.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>API Token</Label>
            <div className="flex gap-2">
              <code className="flex-1 p-3 bg-muted rounded-md text-sm font-mono break-all select-all">
                {newToken?.token}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={handleCopyToken}
              >
                {newToken?.copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleCopyToken}
              variant={newToken?.copied ? "outline" : "default"}
            >
              {newToken?.copied ? "Copied!" : "Copy Token"}
            </Button>
            <Button variant="outline" onClick={handleCloseTokenDialog}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Token Confirmation Dialog */}
      <AlertDialog open={closeTokenDialog} onOpenChange={setCloseTokenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Without Copying?</AlertDialogTitle>
            <AlertDialogDescription>
              You haven&apos;t copied the token yet. Are you sure you want to
              close? You won&apos;t be able to see this token again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCloseToken}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Close Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Key Confirmation Dialog */}
      <AlertDialog
        open={revokeDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeDialog({ open: false, keyId: "", keyName: "" });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke{" "}
              <span className="font-medium">{revokeDialog.keyName}</span>? This
              action cannot be undone and any applications using this key will
              stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoke.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeKey}
              disabled={revoke.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoke.isPending ? "Revoking…" : "Revoke Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ApiKeysClient;
