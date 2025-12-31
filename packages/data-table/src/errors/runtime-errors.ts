// ─── RUNTIME ERRORS ──────────────────────────────────────────────────────────
// Errors that occur during runtime operations.

import { DataTableError, DataTableErrorCode } from "./base";

/**
 * Error thrown during rendering
 */
export class RenderError extends DataTableError {
  /** The component that failed to render */
  public readonly componentName?: string;

  constructor(message: string, componentName?: string, cause?: Error) {
    super(
      message,
      DataTableErrorCode.RENDER_ERROR,
      { context: { componentName }, cause }
    );

    this.name = "RenderError";
    this.componentName = componentName;
  }
}

/**
 * Error thrown when virtualization fails
 */
export class VirtualizationError extends DataTableError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      DataTableErrorCode.VIRTUALIZATION_ERROR,
      { context: details }
    );

    this.name = "VirtualizationError";
  }
}

/**
 * Error thrown when cell editing fails
 */
export class EditError extends DataTableError {
  /** The row ID being edited */
  public readonly rowId?: string;
  /** The column key being edited */
  public readonly columnKey?: string;

  constructor(
    message: string,
    options?: {
      rowId?: string;
      columnKey?: string;
      cause?: Error;
    }
  ) {
    super(
      message,
      DataTableErrorCode.EDIT_FAILED,
      {
        context: {
          rowId: options?.rowId,
          columnKey: options?.columnKey,
        },
        cause: options?.cause,
      }
    );

    this.name = "EditError";
    this.rowId = options?.rowId;
    this.columnKey = options?.columnKey;
  }
}
