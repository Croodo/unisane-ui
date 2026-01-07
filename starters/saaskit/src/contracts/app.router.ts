import { initContract } from "@ts-rest/core";
import { authContract } from "./auth.contract";
import { usersContract } from "./users.contract";
import { tenantsContract } from "./tenants.contract";
import { meContract } from "./me.contract";
import { settingsContract } from "./settings.contract";
import { creditsContract } from "./credits.contract";
import { usageContract } from "./usage.contract";
import { notifyContract } from "./notify.contract";
import { webhooksContract } from "./webhooks.contract";
import { billingContract } from "./billing.contract";
import { membershipsContract } from "./memberships.contract";
import { apikeysContract } from "./apikeys.contract";
import { flagsContract } from "./flags.contract";
import { importExportContract } from "./import-export.contract";
import { auditContract } from "./audit.contract";
import { aiContract } from "./ai.contract";
import { jobsContract } from "./jobs.contract";
import { entitlementsContract } from "./entitlements.contract";
import { pdfContract } from "./pdf.contract";
import { outboxContract } from "./outbox.contract";
import { analyticsContract } from "./analytics.contract";
import { storageContract } from "./storage.contract";

const c = initContract();

export const appRouter = c.router({
  auth: authContract,
  users: usersContract,
  tenants: tenantsContract,
  me: meContract,
  settings: settingsContract,
  credits: creditsContract,
  usage: usageContract,
  notify: notifyContract,
  webhooks: webhooksContract,
  billing: billingContract,
  memberships: membershipsContract,
  apikeys: apikeysContract,
  flags: flagsContract,
  importExport: importExportContract,
  audit: auditContract,
  ai: aiContract,
  jobs: jobsContract,
  entitlements: entitlementsContract,
  pdf: pdfContract,
  outbox: outboxContract,
  analytics: analyticsContract,
  storage: storageContract,
});
