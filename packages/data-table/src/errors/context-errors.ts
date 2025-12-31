// ─── CONTEXT ERRORS ──────────────────────────────────────────────────────────
// Errors related to React context usage.

import { DataTableError, DataTableErrorCode } from "./base";

/**
 * Error thrown when a context is used outside of its provider
 */
export class ContextNotFoundError extends DataTableError {
  /** The name of the context hook that was called */
  public readonly hookName: string;
  /** The name of the required provider */
  public readonly providerName: string;

  constructor(hookName: string, providerName: string) {
    super(
      `${hookName} must be used within a ${providerName}.`,
      DataTableErrorCode.CONTEXT_NOT_FOUND,
      { context: { hookName, providerName } }
    );

    this.name = "ContextNotFoundError";
    this.hookName = hookName;
    this.providerName = providerName;
  }
}

/**
 * Error thrown when a required provider is missing
 */
export class ProviderMissingError extends DataTableError {
  /** The name of the missing provider */
  public readonly providerName: string;

  constructor(providerName: string, componentName?: string) {
    const message = componentName
      ? `${componentName} requires ${providerName} to be present in the component tree.`
      : `${providerName} is required but was not found.`;

    super(
      message,
      DataTableErrorCode.PROVIDER_MISSING,
      { context: { providerName, componentName } }
    );

    this.name = "ProviderMissingError";
    this.providerName = providerName;
  }
}
