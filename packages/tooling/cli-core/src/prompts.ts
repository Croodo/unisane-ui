/**
 * @module @unisane/cli-core/prompts
 *
 * User prompts and confirmations for CLI tools.
 * Follows the prompts library API pattern (object parameters).
 */

import prompts from 'prompts';
import { CancelledError } from './errors.js';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

export interface Choice<T = string> {
  title: string;
  value: T;
  description?: string;
  disabled?: boolean;
}

export interface ConfirmOptions {
  message: string;
  initial?: boolean;
}

export interface TextOptions {
  message: string;
  initial?: string;
  validate?: (value: string) => boolean | string | true;
}

export interface PasswordOptions {
  message: string;
}

export interface SelectOptions<T = string> {
  message: string;
  choices: Choice<T>[];
  initial?: number;
}

export interface MultiselectOptions<T = string> {
  message: string;
  choices: Choice<T>[];
  min?: number;
  max?: number;
}

export interface AutocompleteOptions<T = string> {
  message: string;
  choices: Choice<T>[];
  limit?: number;
}

export interface NumberOptions {
  message: string;
  initial?: number;
  min?: number;
  max?: number;
}

// ════════════════════════════════════════════════════════════════════════════
// Prompt Functions
// ════════════════════════════════════════════════════════════════════════════

/**
 * Ask for confirmation
 */
export async function confirm(options: ConfirmOptions): Promise<boolean> {
  const response = await prompts(
    {
      type: 'confirm',
      name: 'value',
      message: options.message,
      initial: options.initial ?? false,
    },
    { onCancel: () => { throw new CancelledError(); } }
  );

  return response.value ?? false;
}

/**
 * Ask for text input
 */
export async function text(options: TextOptions): Promise<string | undefined> {
  const response = await prompts(
    {
      type: 'text',
      name: 'value',
      message: options.message,
      initial: options.initial,
      validate: options.validate,
    },
    { onCancel: () => { throw new CancelledError(); } }
  );

  return response.value;
}

/**
 * Ask for password input
 */
export async function password(options: PasswordOptions): Promise<string | undefined> {
  const response = await prompts(
    {
      type: 'password',
      name: 'value',
      message: options.message,
    },
    { onCancel: () => { throw new CancelledError(); } }
  );

  return response.value;
}

/**
 * Single select from list
 */
export async function select<T = string>(options: SelectOptions<T>): Promise<T | undefined> {
  const response = await prompts(
    {
      type: 'select',
      name: 'value',
      message: options.message,
      choices: options.choices.map((c) => ({
        title: c.title,
        value: c.value,
        description: c.description,
        disabled: c.disabled,
      })),
      initial: options.initial ?? 0,
    },
    { onCancel: () => { throw new CancelledError(); } }
  );

  return response.value;
}

/**
 * Multi-select from list
 */
export async function multiselect<T = string>(options: MultiselectOptions<T>): Promise<T[] | undefined> {
  const response = await prompts(
    {
      type: 'multiselect',
      name: 'value',
      message: options.message,
      choices: options.choices.map((c) => ({
        title: c.title,
        value: c.value,
        description: c.description,
        disabled: c.disabled,
      })),
      min: options.min,
      max: options.max,
    },
    { onCancel: () => { throw new CancelledError(); } }
  );

  return response.value;
}

/**
 * Autocomplete text input
 */
export async function autocomplete<T = string>(options: AutocompleteOptions<T>): Promise<T | undefined> {
  const response = await prompts(
    {
      type: 'autocomplete',
      name: 'value',
      message: options.message,
      choices: options.choices.map((c) => ({
        title: c.title,
        value: c.value,
        description: c.description,
      })),
      limit: options.limit ?? 10,
    },
    { onCancel: () => { throw new CancelledError(); } }
  );

  return response.value;
}

/**
 * Ask for number input
 */
export async function number(options: NumberOptions): Promise<number | undefined> {
  const response = await prompts(
    {
      type: 'number',
      name: 'value',
      message: options.message,
      initial: options.initial,
      min: options.min,
      max: options.max,
    },
    { onCancel: () => { throw new CancelledError(); } }
  );

  return response.value;
}

// ════════════════════════════════════════════════════════════════════════════
// Prompt Object (for convenience)
// ════════════════════════════════════════════════════════════════════════════

export const prompt = {
  confirm,
  text,
  password,
  select,
  multiselect,
  autocomplete,
  number,
};
