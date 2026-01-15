"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@unisane/ui/components/button";
import { Select } from "@unisane/ui/components/select";
import { toast } from "@unisane/ui/components/toast";
import { TextField } from "@unisane/ui/components/text-field";
import { Typography } from "@unisane/ui/components/typography";
import { Card } from "@unisane/ui/components/card";
import { Combobox } from "@unisane/ui/components/combobox";
import { SUPPORTED_LOCALES, Username, PhoneE164 } from "@unisane/kernel/client";
import { normalizeError } from "@/src/sdk/errors";
import { hooks } from "@/src/sdk/hooks";
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
    () => Username.tryCreate(usernameVal || "")?.toString() ?? "",
    [usernameVal]
  );
  const uname = useDebouncedValue(usernameNormalized, 300);

  const phoneNormRaw = useMemo(() => {
    return phoneVal ? (PhoneE164.tryCreate(phoneVal)?.toString() ?? "") : "";
  }, [phoneVal]);
  const phoneNorm = useDebouncedValue(phoneNormRaw, 300);

  const emailVerified = server?.emailVerified ?? null;
  const phoneVerified = server?.phoneVerified ?? null;

  // Only check availability if username changed from server value
  const serverUsername = server?.username ?? "";
  const usernameChanged = uname !== serverUsername && uname.length >= 2;

  const uQ = hooks.users.usernameAvailable(
    { value: uname },
    { enabled: usernameChanged }
  );

  // Only check phone availability if it changed from server value
  const serverPhone = server?.phone ?? "";
  const phoneChanged = phoneNorm !== serverPhone && !!phoneNorm;

  const pQ = hooks.users.phoneAvailable(
    { value: phoneNorm },
    { enabled: phoneChanged }
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
      const phone = PhoneE164.tryCreate(phoneVal);
      if (!phone) {
        toast.error("Invalid phone", {
          description: "Phone number must be in E.164 format (e.g., +14155550123)",
        });
        return;
      }
      body.phone = phone.toString();
    } else {
      body.phone = null;
    }
    await mePatch.mutateAsync({ body });
  };

  const sendPhoneCode = async () => {
    if (!phoneVal) {
      toast.error("Add a phone first");
      return;
    }
    const phone = PhoneE164.tryCreate(phoneVal);
    if (!phone) {
      toast.error("Invalid phone format");
      return;
    }
    try {
      await phoneStart.mutateAsync({ body: { phone: phone.toString() } });
    } catch {}
  };

  const saveDisabled = mePatch.isPending;

  return (
    <Card variant="outlined" className="overflow-visible">
      <Card.Header>
        <Card.Title>Profile</Card.Title>
        <Card.Description>
          Manage your personal information and preferences
        </Card.Description>
      </Card.Header>
      <Card.Content className="p-0 divide-y divide-outline-variant/50 overflow-visible">
        {/* Email */}
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start">
          <div className="space-y-1">
            <Typography variant="titleSmall">Email</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant">
              Your primary email address
            </Typography>
          </div>
          <div className="space-y-2">
            <TextField label="Email" value={emailVal} disabled />
            {emailVal && (
              <div className="flex items-center gap-1.5">
                {emailVerified === true ? (
                  <>
                    <Icon
                      symbol="verified"
                      size="sm"
                      className="text-primary"
                    />
                    <Typography variant="labelSmall" className="text-primary">
                      Verified
                    </Typography>
                  </>
                ) : emailVerified === false ? (
                  <>
                    <Icon symbol="warning" size="sm" className="text-warning" />
                    <Typography variant="labelSmall" className="text-warning">
                      Not verified
                    </Typography>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Display Name */}
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start">
          <div className="space-y-1">
            <Typography variant="titleSmall">Display name</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant">
              How others see you in the app
            </Typography>
          </div>
          <TextField
            label="Display name"
            value={displayNameVal}
            onChange={(e) =>
              setPf((p) => ({ ...p, displayName: e.target.value }))
            }
          />
        </div>

        {/* Username */}
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start">
          <div className="space-y-1">
            <Typography variant="titleSmall">Username</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant">
              Nickname or short name used in the app
            </Typography>
          </div>
          <div className="space-y-2">
            <TextField
              label="Username"
              value={usernameVal}
              onChange={(e) =>
                setPf((p) => ({ ...p, username: e.target.value }))
              }
            />
            {uname.length >= 2 && (
              <div className="flex items-center gap-1.5">
                {uQ.isFetching ? (
                  <>
                    <Icon
                      symbol="progress_activity"
                      size="sm"
                      className="animate-spin text-on-surface-variant"
                    />
                    <Typography
                      variant="labelSmall"
                      className="text-on-surface-variant"
                    >
                      Checking…
                    </Typography>
                  </>
                ) : uQ.data?.available === false ? (
                  <>
                    <Icon symbol="error" size="sm" className="text-error" />
                    <Typography variant="labelSmall" className="text-error">
                      Not available
                    </Typography>
                  </>
                ) : uQ.data?.available === true ? (
                  <>
                    <Icon
                      symbol="check_circle"
                      size="sm"
                      className="text-primary"
                    />
                    <Typography variant="labelSmall" className="text-primary">
                      Available
                    </Typography>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* First Name */}
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start">
          <div className="space-y-1">
            <Typography variant="titleSmall">First name</Typography>
          </div>
          <TextField
            label="First name"
            value={firstNameVal}
            onChange={(e) =>
              setPf((p) => ({ ...p, firstName: e.target.value }))
            }
          />
        </div>

        {/* Last Name */}
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start">
          <div className="space-y-1">
            <Typography variant="titleSmall">Last name</Typography>
          </div>
          <TextField
            label="Last name"
            value={lastNameVal}
            onChange={(e) => setPf((p) => ({ ...p, lastName: e.target.value }))}
          />
        </div>

        {/* Phone */}
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start">
          <div className="space-y-1">
            <Typography variant="titleSmall">Phone</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant">
              E.164 format (e.g., +1234567890)
            </Typography>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <TextField
                  label="Phone number"
                  value={phoneVal}
                  onChange={(e) =>
                    setPf((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
              <Button
                variant="outlined"
                onClick={sendPhoneCode}
                className="shrink-0"
              >
                Send code
              </Button>
            </div>
            {phoneVal && (
              <div className="flex items-center gap-3 flex-wrap">
                {pQ.isFetching ? (
                  <Typography
                    variant="labelSmall"
                    className="text-on-surface-variant"
                  >
                    Checking…
                  </Typography>
                ) : pQ.data?.available === false ? (
                  <div className="flex items-center gap-1.5">
                    <Icon symbol="error" size="sm" className="text-error" />
                    <Typography variant="labelSmall" className="text-error">
                      Already in use
                    </Typography>
                  </div>
                ) : pQ.data?.available === true ? (
                  <div className="flex items-center gap-1.5">
                    <Icon
                      symbol="check_circle"
                      size="sm"
                      className="text-primary"
                    />
                    <Typography variant="labelSmall" className="text-primary">
                      Available
                    </Typography>
                  </div>
                ) : null}
                {phoneVerified === true ? (
                  <div className="flex items-center gap-1.5">
                    <Icon
                      symbol="verified"
                      size="sm"
                      className="text-primary"
                    />
                    <Typography variant="labelSmall" className="text-primary">
                      Verified
                    </Typography>
                  </div>
                ) : phoneVerified === false ? (
                  <div className="flex items-center gap-1.5">
                    <Icon symbol="warning" size="sm" className="text-warning" />
                    <Typography variant="labelSmall" className="text-warning">
                      Not verified
                    </Typography>
                  </div>
                ) : null}
              </div>
            )}
            {phoneVal && (
              <div className="flex items-center gap-3">
                <div className="w-40">
                  <TextField
                    label="Verification code"
                    placeholder="Enter code"
                    onKeyDown={async (e) => {
                      if (e.key !== "Enter") return;
                      const el = e.currentTarget as HTMLInputElement;
                      const code = (el.value || "").trim();
                      if (!code) return;
                      const phone = phoneVal
                        ? PhoneE164.tryCreate(phoneVal)?.toString() ?? ""
                        : "";
                      if (!phone) return;
                      try {
                        await phoneVerify.mutateAsync({
                          body: { phone, code },
                        });
                        el.value = "";
                      } catch {}
                    }}
                  />
                </div>
                <Typography
                  variant="labelSmall"
                  className="text-on-surface-variant"
                >
                  Press Enter to verify
                </Typography>
              </div>
            )}
          </div>
        </div>

        {/* Locale */}
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start">
          <div className="space-y-1">
            <Typography variant="titleSmall">Locale</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant">
              Your preferred language
            </Typography>
          </div>
          <Select
            label="Locale"
            value={localeVal}
            onChange={(val: string) => setPf((p) => ({ ...p, locale: val }))}
            options={SUPPORTED_LOCALES.map((l: string) => ({
              value: l,
              label: l,
            }))}
          />
        </div>

        {/* Timezone */}
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start">
          <div className="space-y-1">
            <Typography variant="titleSmall">Timezone</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant">
              Used for date and time display
            </Typography>
          </div>
          <Combobox
            value={timezoneVal}
            onChange={(val) => setPf((p) => ({ ...p, timezone: val }))}
            placeholder="Search timezones…"
            options={(typeof Intl !== "undefined" &&
            (Intl as { supportedValuesOf?: (key: string) => string[] })
              .supportedValuesOf
              ? (
                  Intl as { supportedValuesOf: (key: string) => string[] }
                ).supportedValuesOf("timeZone")
              : [timezoneVal]
            ).map((tz: string) => ({
              value: tz,
              label: tz,
            }))}
          />
        </div>
      </Card.Content>

      <div className="flex justify-end px-5 py-4 border-t border-outline-variant/50">
        <Button disabled={saveDisabled} onClick={saveProfile}>
          Save changes
        </Button>
      </div>
    </Card>
  );
}

export default MyProfileCard;
