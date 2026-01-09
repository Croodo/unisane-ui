"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@unisane/ui/components/button";
import { Input } from "@unisane/ui/primitives/input";
import { Label } from "@unisane/ui/primitives/label";
import { Badge } from "@unisane/ui/components/badge";
import { toast } from "@unisane/ui/components/toast";
import { useSession } from "@/src/hooks/useSession";
import { hooks } from "@/src/sdk/hooks";
import type { ApikeysListItem, ApikeysCreateResponse } from "@/src/sdk/types";
import { useApiError } from "@/src/hooks/useApiError";
import { DataTable } from "@unisane/data-table";
import type { Column } from "@unisane/data-table";
import { PageHeader } from "@/src/context/usePageHeader";
import { Card } from "@unisane/ui/components/card";
import { Alert } from "@unisane/ui/components/alert";
import { Dialog } from "@unisane/ui/components/dialog";
import { ConfirmDialog } from "@unisane/ui/components/confirm-dialog";
import { Icon } from "@unisane/ui/primitives/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@unisane/ui/components/dropdown-menu";

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
            <span className="text-xs text-on-surface-variant font-mono">
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
              {row.scopes.map((s: string) => (
                <Badge key={s} variant="tonal">
                  {s}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-on-surface-variant">No scopes</span>
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
        align: "end",
        width: 80,
        render: (row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="text" size="sm" className="h-8 w-8 p-0">
                <Icon symbol="more_vert" size="sm" />
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
                className="text-error focus:text-error"
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
            <Icon symbol="add" size="sm" />
            Create Key
          </Button>
        }
      />

      <div className="space-y-6">
        {dataset.length === 0 && !isLoading && (
          <Card>
            <Card.Content className="py-10 text-center">
              <Icon symbol="key" size="lg" className="mx-auto text-on-surface-variant mb-4" />
              <h3 className="text-lg font-medium mb-2">No API keys yet</h3>
              <p className="text-sm text-on-surface-variant mb-4">
                Create an API key to access your workspace programmatically.
              </p>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Icon symbol="add" size="sm" />
                Create your first key
              </Button>
            </Card.Content>
          </Card>
        )}

        {(dataset.length > 0 || isLoading) && (
          <DataTable<ApikeysListItem>
            data={dataset}
            columns={columns}
            title="API Keys"
            loading={isLoading}
            tableId="tenant-apikeys"
          />
        )}
      </div>

      {/* Create Key Dialog */}
      <Dialog
        open={createOpen && !newToken}
        onClose={() => setCreateOpen(false)}
        title="Create API Key"
      >
        <p className="text-on-surface-variant mb-4">
          Create a new API key for programmatic access to your workspace.
        </p>
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
            <p className="text-xs text-on-surface-variant">
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
            <p className="text-xs text-on-surface-variant">
              Comma-separated list of permissions (e.g., read, write, admin).
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="text"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!tenantId || create.isPending}>
              {create.isPending ? "Creating…" : "Create Key"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Token Display Dialog */}
      <Dialog
        open={Boolean(newToken)}
        onClose={handleCloseTokenDialog}
        title="API Key Created"
        icon={<Icon symbol="check_circle" size="md" className="text-primary" />}
        className="sm:max-w-lg"
        actions={
          <>
            <Button
              onClick={handleCopyToken}
              variant={newToken?.copied ? "outlined" : "filled"}
            >
              {newToken?.copied ? "Copied!" : "Copy Token"}
            </Button>
            <Button variant="text" onClick={handleCloseTokenDialog}>
              Done
            </Button>
          </>
        }
      >
        <p className="text-on-surface-variant mb-4">
          {newToken?.name
            ? `Your key "${newToken.name}" has been created.`
            : "Your API key has been created."}
        </p>

        <Alert variant="warning" title="Save this token now">
          This is the only time you&apos;ll see this token. Copy it now and
          store it securely.
        </Alert>

        <div className="space-y-2 mt-4">
          <Label>API Token</Label>
          <div className="flex gap-2">
            <code className="flex-1 p-3 bg-surface-container rounded-md text-sm font-mono break-all select-all">
              {newToken?.token}
            </code>
            <Button
              type="button"
              variant="outlined"
              size="sm"
              className="shrink-0 h-10 w-10 p-0"
              onClick={handleCopyToken}
            >
              {newToken?.copied ? (
                <Icon symbol="check" size="sm" className="text-primary" />
              ) : (
                <Icon symbol="content_copy" size="sm" />
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Close Token Confirmation Dialog */}
      <ConfirmDialog
        open={closeTokenDialog}
        onOpenChange={setCloseTokenDialog}
        title="Close Without Copying?"
        description="You haven't copied the token yet. Are you sure you want to close? You won't be able to see this token again."
        variant="warning"
        confirmLabel="Close Anyway"
        cancelLabel="Go Back"
        onConfirm={handleConfirmCloseToken}
      />

      {/* Revoke Key Confirmation Dialog */}
      <ConfirmDialog
        open={revokeDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeDialog({ open: false, keyId: "", keyName: "" });
          }
        }}
        title="Revoke API Key"
        description={`Are you sure you want to revoke "${revokeDialog.keyName}"? This action cannot be undone and any applications using this key will stop working immediately.`}
        variant="danger"
        confirmLabel={revoke.isPending ? "Revoking…" : "Revoke Key"}
        cancelLabel="Cancel"
        onConfirm={handleRevokeKey}
        loading={revoke.isPending}
        disabled={revoke.isPending}
      />
    </>
  );
}

export default ApiKeysClient;
