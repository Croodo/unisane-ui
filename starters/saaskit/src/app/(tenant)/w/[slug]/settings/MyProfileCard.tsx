"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@unisane/ui/primitives/input";
import { Label } from "@unisane/ui/primitives/label";
import { Button } from "@unisane/ui/components/button";
import { Select } from "@unisane/ui/components/select";
import { toast } from "@unisane/ui/components/toast";
import { SUPPORTED_LOCALES } from "@/src/shared/constants/i18n";
import { normalizePhoneE164, normalizeUsername } from "@/src/shared/normalize";
import { normalizeError } from "@/src/sdk/errors";
import { hooks } from "@/src/sdk/hooks";
import { Popover } from "@unisane/ui/components/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@unisane/ui/components/command";
import { Icon } from "@unisane/ui/primitives/icon";

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
            <Label className="text-sm font-medium text-on-surface-variant">
              Email
            </Label>
            <div className="sm:flex sm:justify-end">
              <div className="space-y-1 w-full max-w-xs">
                <Input value={emailVal} disabled className="bg-surface-container/40" />
                {emailVal ? (
                  <div className="text-xs text-on-surface-variant">
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
              className="text-sm font-medium text-on-surface-variant"
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
                className="text-sm font-medium text-on-surface-variant"
                htmlFor="username"
              >
                Username
              </Label>
              <p className="text-xs text-on-surface-variant">
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
                        <Icon symbol="progress_activity" size="xs" className="animate-spin text-on-surface-variant" />
                        <span className="text-on-surface-variant">Checking…</span>
                      </>
                    ) : uQ.data?.available === false ? (
                      <>
                        <Icon symbol="error" size="xs" className="text-error" />
                        <span className="text-error">Not available</span>
                      </>
                    ) : uQ.data?.available === true ? (
                      <>
                        <Icon symbol="check_circle" size="xs" className="text-primary" />
                        <span className="text-primary">
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
              className="text-sm font-medium text-on-surface-variant"
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
              className="text-sm font-medium text-on-surface-variant"
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
              className="text-sm font-medium text-on-surface-variant"
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
                    variant="outlined"
                    size="sm"
                    onClick={sendPhoneCode}
                  >
                    Send code
                  </Button>
                </div>
                {phoneVal && (
                  <div className="space-y-0.5 text-xs text-on-surface-variant">
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
                    <span className="text-xs text-on-surface-variant">
                      Press Enter to verify
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-2 border-b px-4 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
            <Label className="text-sm font-medium text-on-surface-variant">
              Locale
            </Label>
            <div className="sm:flex sm:justify-end">
              <div className="w-full max-w-xs">
                <Select
                  value={localeVal}
                  onChange={(val: string) => setPf((p) => ({ ...p, locale: val }))}
                  options={SUPPORTED_LOCALES.map((l: string) => ({
                    value: l,
                    label: l,
                  }))}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2 px-4 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
            <Label className="text-sm font-medium text-on-surface-variant">
              Timezone
            </Label>
            <div className="sm:flex sm:justify-end">
              <div className="w-full max-w-xs">
                <Popover
                  trigger={
                    <Button
                      variant="outlined"
                      className="w-full justify-between"
                    >
                      <span className="truncate text-left">
                        {timezoneVal || "Select timezone"}
                      </span>
                      <span className="ml-2 text-xs text-on-surface-variant">
                        Change
                      </span>
                    </Button>
                  }
                  content={
                    <Command>
                      <CommandInput placeholder="Search timezones…" />
                      <CommandList>
                        <CommandEmpty>No timezone found.</CommandEmpty>
                        <CommandGroup>
                          {(typeof Intl !== "undefined" &&
                          (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf
                            ? (Intl as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf("timeZone")
                            : [timezoneVal]
                          ).map((tz: string) => (
                            <CommandItem
                              key={tz}
                              value={tz}
                              onSelect={(val: string) =>
                                setPf((p) => ({ ...p, timezone: val }))
                              }
                            >
                              {tz}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  }
                  align="start"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t bg-surface-container/40 px-4 py-3">
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
