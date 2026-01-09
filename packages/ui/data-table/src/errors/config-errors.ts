// ─── CONFIGURATION ERRORS ────────────────────────────────────────────────────
// Errors related to DataTable configuration and props.

import { DataTableError, DataTableErrorCode } from "./base";

/**
 * Error thrown when configuration is invalid
 */
export class InvalidConfigError extends DataTableError {
  /** The configuration key that is invalid */
  public readonly configKey?: string;

  constructor(message: string, configKey?: string) {
    super(
      message,
      DataTableErrorCode.INVALID_CONFIG,
      { context: { configKey } }
    );

    this.name = "InvalidConfigError";
    this.configKey = configKey;
  }
}

/**
 * Error thrown when a required prop is missing
 */
export class MissingRequiredPropError extends DataTableError {
  /** The name of the missing prop */
  public readonly propName: string;

  constructor(propName: string, componentName: string = "DataTable") {
    super(
      `${componentName} requires the "${propName}" prop.`,
      DataTableErrorCode.MISSING_REQUIRED_PROP,
      { context: { propName, componentName } }
    );

    this.name = "MissingRequiredPropError";
    this.propName = propName;
  }
}

/**
 * Error thrown when options are incompatible with each other
 */
export class IncompatibleOptionsError extends DataTableError {
  /** The conflicting options */
  public readonly options: string[];

  constructor(options: string[], reason: string) {
    super(
      `Incompatible options: ${options.join(" and ")}. ${reason}`,
      DataTableErrorCode.INCOMPATIBLE_OPTIONS,
      { context: { options, reason } }
    );

    this.name = "IncompatibleOptionsError";
    this.options = options;
  }
}
