"use client";

import { PageHeader } from "@/src/context/usePageHeader";
import { MyProfileCard } from "../settings/MyProfileCard";

/**
 * AccountClient — Personal user account settings
 *
 * This page is for user-specific settings (profile, preferences)
 * NOT workspace-specific settings.
 *
 * Accessed from user menu in sidebar footer.
 */
export function AccountClient() {
  return (
    <>
      <PageHeader
        title="Account"
        subtitle="Manage your personal profile and preferences."
      />
      <div className="space-y-6">
        <MyProfileCard />
      </div>
    </>
  );
}

export default AccountClient;
