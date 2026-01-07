"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { toast } from "sonner";
import { SUPPORTED_LOCALES } from "@/src/shared/constants/i18n";
import { normalizePhoneE164, normalizeUsername } from "@/src/shared/normalize";
import { normalizeError } from "@/src/sdk/errors";
import { hooks } from "@/src/sdk/hooks";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import { CircleCheck, LoaderCircle, OctagonX } from "lucide-react";

function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

export function MyProfileCard() {
  const meProfile = hooks.me.profile.get();
  const [pf, setPf] = useState<{
    displayName?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    locale?: string;
    timezone?: string;
  }>({});

  const server = meProfile.data ?? null;

  const emailVal = server?.email ?? "";

  const displayNameVal = (pf.displayName ?? server?.displayName ?? "").trim();
  const usernameVal = (pf.username ?? server?.username ?? "").trim();
  const firstNameVal = pf.firstName ?? server?.firstName ?? "";
  const lastNameVal = pf.lastName ?? server?.lastName ?? "";
  const phoneVal = pf.phone ?? server?.phone ?? "";
  const localeVal =
    pf.locale ?? server?.locale ?? (SUPPORTED_LOCALES[0] as string);
  const timezoneVal =
    pf.timezone ??
    server?.timezone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const usernameNormalized = useMemo(
    () => normalizeUsername(usernameVal || ""),
    [usernameVal]
  );
  const uname = useDebouncedValue(usernameNormalized, 300);

  const phoneNormRaw = useMemo(() => {
    try {
      return phoneVal ? normalizePhoneE164(phoneVal) : "";
    } catch {
      return "";
    }
  }, [phoneVal]);
  const phoneNorm = useDebouncedValue(phoneNormRaw, 300);

  const emailVerified = server?.emailVerified ?? null;
  const phoneVerified = server?.phoneVerified ?? null;

  const uQ = hooks.users.usernameAvailable(
    { value: uname },
    { enabled: uname.length >= 2 }
  );
  const pQ = hooks.users.phoneAvailable(
    { value: phoneNorm },
    { enabled: !!phoneNorm }
  );

  const mePatch = hooks.me.profile.patch({
    onSuccess: () => toast.success("Profile updated"),
    onError: (e: unknown) =>
      toast.error("Failed to update profile", {
        description: normalizeError(e).message,
      }),
  });
  const phoneStart = hooks.auth.phoneStart({
    onSuccess: () => toast.success("Verification code sent"),
    onError: (e: unknown) =>
      toast.error("Failed to start phone verify", {
        description: normalizeError(e).message,
      }),
  });
  const phoneVerify = hooks.auth.phoneVerify({
    onSuccess: () => toast.success("Phone verified"),
    onError: (e: unknown) =>
      toast.error("Verification failed", {
        description: normalizeError(e).message,
      }),
  });

  const saveProfile = async () => {
    const body: Record<string, unknown> = {
      displayName: displayNameVal || null,
      username: uname || null,
      firstName: firstNameVal || null,
      lastName: lastNameVal || null,
      locale: localeVal || null,
      timezone: timezoneVal || null,
    };
    if (phoneVal) {
      try {
        body.phone = normalizePhoneE164(phoneVal);
      } catch (e) {
        toast.error("Invalid phone", {
          description: String((e as Error)?.message ?? ""),
        });
        return;
      }
    } else {
      body.phone = null;
    }
    await mePatch.mutateAsync({ body });
  };

  const sendPhoneCode = async () => {
    try {
      if (!phoneVal) {
        toast.error("Add a phone first");
        return;
      }
      const phone = normalizePhoneE164(phoneVal);
      await phoneStart.mutateAsync({ body: { phone } });
    } catch {}
  };

  const saveDisabled = mePatch.isPending;

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Profile</h3>
        </div>

        <div className="overflow-hidden rounded-lg border bg-background">
          <div className="grid gap-2 border-b px-4 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
            <Label className="text-sm font-medium text-muted-foreground">
              Email
            </Label>
            <div className="sm:flex sm:justify-end">
              <div className="space-y-1 w-full max-w-xs">
                <Input value={emailVal} disabled className="bg-muted/40" />
                {emailVal ? (
                  <div className="text-xs text-muted-foreground">
                    {emailVerified === true
                      ? "Email verified"
                      : emailVerified === false
                        ? "Email not verified"
                        : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-2 border-b px-4 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
            <Label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="displayName"
            >
              Display name
            </Label>
            <div className="sm:flex sm:justify-end">
              <div className="w-full max-w-xs">
                <Input
                  id="displayName"
                  value={displayNameVal}
                  onChange={(e) =>
                    setPf((p) => ({ ...p, displayName: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2 border-b px-4 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
            <div className="space-y-1">
              <Label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="username"
              >
                Username
              </Label>
              <p className="text-xs text-muted-foreground">
                Nickname or short name used in the app.
              </p>
            </div>
            <div className="sm:flex sm:justify-end">
              <div className="space-y-1 w-full max-w-xs">
                <Input
                  id="username"
                  value={usernameVal}
                  onChange={(e) =>
                    setPf((p) => ({ ...p, username: e.target.value }))
                  }
                />
                {uname.length >= 2 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    {uQ.isFetching ? (
                      <>
                        <LoaderCircle className="h-3 w-3 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground">Checking…</span>
                      </>
                    ) : uQ.data?.available === false ? (
                      <>
                        <OctagonX className="h-3 w-3 text-destructive" />
                        <span className="text-destructive">Not available</span>
                      </>
                    ) : uQ.data?.available === true ? (
                      <>
                        <CircleCheck className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Available
                        </span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-2 border-b px-4 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
            <Label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="firstName"
            >
              First name
            </Label>
            <div className="sm:flex sm:justify-end">
              <div className="w-full max-w-xs">
                <Input
                  id="firstName"
                  value={firstNameVal}
                  onChange={(e) =>
                    setPf((p) => ({ ...p, firstName: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2 border-b px-4 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
            <Label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="lastName"
            >
              Last name
            </Label>
            <div className="sm:flex sm:justify-end">
              <div className="w-full max-w-xs">
                <Input
                  id="lastName"
                  value={lastNameVal}
                  onChange={(e) =>
                    setPf((p) => ({ ...p, lastName: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2 border-b px-4 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start">
            <Label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="phone"
            >
              Phone (+E.164)
            </Label>
            <div className="sm:flex sm:justify-end">
              <div className="space-y-2 w-full max-w-xs">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    id="phone"
                    value={phoneVal}
                    onChange={(e) =>
                      setPf((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="sm:max-w-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={sendPhoneCode}
                  >
                    Send code
                  </Button>
                </div>
                {phoneVal && (
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    <div>
                      {pQ.isFetching
                        ? "Checking…"
                        : pQ.data?.available === false
                          ? "Already in use"
                          : pQ.data?.available === true
                            ? "Available"
                            : null}
                    </div>
                    <div>
                      {phoneVerified === true
                        ? "Phone verified"
                        : phoneVerified === false
                          ? "Phone not verified"
                          : null}
                    </div>
                  </div>
                )}
                {phoneVal && (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter code"
                      className="max-w-40"
                      onKeyDown={async (e) => {
                        if (e.key !== "Enter") return;
                        const el = e.currentTarget as HTMLInputElement;
                        const code = (el.value || "").trim();
                        if (!code) return;
                        try {
                          const phone = phoneVal
                            ? normalizePhoneE164(phoneVal)
                            : "";
                          await phoneVerify.mutateAsync({
                            body: { phone, code },
                          });
                          el.value = "";
                        } catch {}
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      Press Enter to verify
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-2 border-b px-4 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
            <Label className="text-sm font-medium text-muted-foreground">
              Locale
            </Label>
            <div className="sm:flex sm:justify-end">
              <div className="w-full max-w-xs">
                <Select
                  value={localeVal}
                  onValueChange={(val) => setPf((p) => ({ ...p, locale: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LOCALES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid gap-2 px-4 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
            <Label className="text-sm font-medium text-muted-foreground">
              Timezone
            </Label>
            <div className="sm:flex sm:justify-end">
              <div className="w-full max-w-xs">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span className="truncate text-left">
                        {timezoneVal || "Select timezone"}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        Change
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search timezones…" />
                      <CommandList>
                        <CommandEmpty>No timezone found.</CommandEmpty>
                        <CommandGroup>
                          {(typeof Intl !== "undefined" &&
                          (Intl as any).supportedValuesOf
                            ? (Intl as any).supportedValuesOf("timeZone")
                            : [timezoneVal]
                          ).map((tz: string) => (
                            <CommandItem
                              key={tz}
                              value={tz}
                              onSelect={(val) =>
                                setPf((p) => ({ ...p, timezone: val }))
                              }
                            >
                              {tz}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t bg-muted/40 px-4 py-3">
            <Button type="button" disabled={saveDisabled} onClick={saveProfile}>
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyProfileCard;
