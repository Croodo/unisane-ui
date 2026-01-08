import { z, type ZodTypeAny } from "zod";
import { ERR } from "@unisane/gateway";

/**
 * Safely parse input with a Zod schema and throw a validation error if it fails.
 * Converts Zod errors to FieldError format expected by ERR.validation().
 *
 * @param schema - Zod schema to validate against
 * @param input - Input data to validate
 * @param errorMessage - Optional error message (defaults to "Invalid input")
 * @returns Parsed data if validation succeeds
 * @throws AppError with VALIDATION_FAILED code if validation fails
 *
 * @example
 * ```typescript
 * const parsed = safeParseOrThrow(ZCreateUserInput, args.input, "Invalid user data");
 * ```
 */
export function safeParseOrThrow<S extends ZodTypeAny>(
  schema: S,
  input: unknown,
  errorMessage = "Invalid input"
): z.output<S> {
  const validation = schema.safeParse(input);
  if (!validation.success) {
    const fieldErrors = validation.error.errors.map((err) => ({
      field: err.path.join(".") || "root",
      message: err.message,
    }));
    throw ERR.validation(errorMessage, fieldErrors);
  }
  return validation.data;
}
