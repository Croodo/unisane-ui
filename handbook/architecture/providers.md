# Provider Interfaces Guide

> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)

This guide covers all provider interfaces in the Unisane platform: AI, storage, email, SMS, payments, and notifications.

---

## Table of Contents

1. [Overview](#overview)
2. [Provider Architecture](#provider-architecture)
3. [AI Providers](#ai-providers)
4. [Storage Providers](#storage-providers)
5. [Email Providers](#email-providers)
6. [SMS Providers](#sms-providers)
7. [Payment Providers](#payment-providers)
8. [Push Notification Providers](#push-notification-providers)
9. [Creating Custom Providers](#creating-custom-providers)
10. [Provider Configuration](#provider-configuration)
11. [Fallback Strategies](#fallback-strategies)
12. [Testing Providers](#testing-providers)

---

## Overview

Providers are abstraction layers that allow the platform to work with multiple external services interchangeably. Each provider type defines a common interface that concrete implementations must follow.

```
┌─────────────────────────────────────────────────────────────┐
│                    PROVIDER SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │ AI Provider │   │   Storage   │   │    Email    │       │
│  │  Interface  │   │  Interface  │   │  Interface  │       │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘       │
│         │                 │                 │               │
│    ┌────┴────┐       ┌────┴────┐       ┌────┴────┐         │
│    │ OpenAI  │       │   S3    │       │ Resend  │         │
│    │ Claude  │       │   R2    │       │   SES   │         │
│    │ Gemini  │       │  Local  │       │  SMTP   │         │
│    └─────────┘       └─────────┘       └─────────┘         │
│                                                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │SMS Provider│   │  Payment    │   │    Push     │       │
│  │  Interface │   │  Interface  │   │  Interface  │       │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘       │
│         │                 │                 │               │
│    ┌────┴────┐       ┌────┴────┐       ┌────┴────┐         │
│    │ Twilio  │       │ Stripe  │       │   FCM   │         │
│    │ Vonage  │       │Razorpay │       │   APNs  │         │
│    │  AWS    │       │ Paddle  │       │  Expo   │         │
│    └─────────┘       └─────────┘       └─────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Provider Architecture

### Base Provider Interface

```typescript
// packages/kernel/src/providers/base.ts

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  priority?: number;  // For fallback ordering
  options?: Record<string, unknown>;
}

export interface Provider<T extends ProviderConfig = ProviderConfig> {
  readonly name: string;
  readonly config: T;

  /** Initialize the provider (connect, validate credentials, etc.) */
  initialize(): Promise<void>;

  /** Check if the provider is healthy */
  healthCheck(): Promise<{ healthy: boolean; latency?: number }>;

  /** Cleanup resources */
  dispose(): Promise<void>;
}

export interface ProviderFactory<T extends Provider> {
  create(config: ProviderConfig): T;
}
```

### Provider Registry

```typescript
// packages/kernel/src/providers/registry.ts

export class ProviderRegistry<T extends Provider> {
  private providers: Map<string, T> = new Map();
  private primaryProvider: T | null = null;

  register(provider: T): void {
    this.providers.set(provider.name, provider);
    if (!this.primaryProvider || provider.config.priority === 1) {
      this.primaryProvider = provider;
    }
  }

  get(name: string): T | undefined {
    return this.providers.get(name);
  }

  getPrimary(): T {
    if (!this.primaryProvider) {
      throw new Error("No provider registered");
    }
    return this.primaryProvider;
  }

  getAll(): T[] {
    return Array.from(this.providers.values());
  }

  async healthCheckAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    for (const [name, provider] of this.providers) {
      const { healthy } = await provider.healthCheck();
      results.set(name, healthy);
    }
    return results;
  }
}
```

---

## AI Providers

### AI Provider Interface

```typescript
// packages/ai/src/providers/types.ts

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: AITool[];
}

export interface AICompletionResult {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: "stop" | "length" | "tool_calls";
  toolCalls?: AIToolCall[];
}

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AIProvider extends Provider {
  /** Generate a completion */
  complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResult>;

  /** Stream a completion */
  stream(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): AsyncGenerator<string>;

  /** Generate embeddings */
  embed(texts: string[]): Promise<number[][]>;

  /** List available models */
  listModels(): Promise<string[]>;
}
```

### OpenAI Provider

```typescript
// packages/ai/src/providers/openai.ts

import OpenAI from "openai";
import type { AIProvider, AIMessage, AICompletionOptions } from "./types";

export interface OpenAIConfig extends ProviderConfig {
  apiKey: string;
  organization?: string;
  baseUrl?: string;
  defaultModel?: string;
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private client: OpenAI;

  constructor(readonly config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      baseURL: config.baseUrl,
    });
  }

  async initialize(): Promise<void> {
    // Validate credentials by listing models
    await this.client.models.list();
  }

  async healthCheck() {
    const start = Date.now();
    try {
      await this.client.models.list();
      return { healthy: true, latency: Date.now() - start };
    } catch {
      return { healthy: false };
    }
  }

  async complete(messages: AIMessage[], options?: AICompletionOptions) {
    const response = await this.client.chat.completions.create({
      model: options?.model ?? this.config.defaultModel ?? "gpt-4o",
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      tools: options?.tools?.map((t) => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content ?? "",
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
      finishReason: choice.finish_reason as "stop" | "length" | "tool_calls",
      toolCalls: choice.message.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
    };
  }

  async *stream(messages: AIMessage[], options?: AICompletionOptions) {
    const stream = await this.client.chat.completions.create({
      model: options?.model ?? this.config.defaultModel ?? "gpt-4o",
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }

  async embed(texts: string[]) {
    const response = await this.client.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
    });
    return response.data.map((d) => d.embedding);
  }

  async listModels() {
    const response = await this.client.models.list();
    return response.data.map((m) => m.id);
  }

  async dispose() {
    // OpenAI client doesn't need cleanup
  }
}
```

### Anthropic Provider

```typescript
// packages/ai/src/providers/anthropic.ts

import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AIMessage, AICompletionOptions } from "./types";

export interface AnthropicConfig extends ProviderConfig {
  apiKey: string;
  defaultModel?: string;
}

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private client: Anthropic;

  constructor(readonly config: AnthropicConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  async initialize() {
    // Validate by making a minimal request
  }

  async healthCheck() {
    const start = Date.now();
    try {
      await this.client.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      });
      return { healthy: true, latency: Date.now() - start };
    } catch {
      return { healthy: false };
    }
  }

  async complete(messages: AIMessage[], options?: AICompletionOptions) {
    // Extract system message
    const systemMessage = messages.find((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    const response = await this.client.messages.create({
      model: options?.model ?? this.config.defaultModel ?? "claude-3-5-sonnet-20241022",
      max_tokens: options?.maxTokens ?? 4096,
      system: systemMessage?.content,
      messages: chatMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      tools: options?.tools?.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters as Anthropic.Tool.InputSchema,
      })),
    });

    const textContent = response.content.find((c) => c.type === "text");
    const toolUseContent = response.content.filter((c) => c.type === "tool_use");

    return {
      content: textContent?.type === "text" ? textContent.text : "",
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      finishReason: response.stop_reason === "tool_use" ? "tool_calls" : "stop",
      toolCalls: toolUseContent.map((tc) => ({
        id: tc.type === "tool_use" ? tc.id : "",
        name: tc.type === "tool_use" ? tc.name : "",
        arguments: tc.type === "tool_use" ? (tc.input as Record<string, unknown>) : {},
      })),
    };
  }

  async *stream(messages: AIMessage[], options?: AICompletionOptions) {
    const systemMessage = messages.find((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    const stream = this.client.messages.stream({
      model: options?.model ?? this.config.defaultModel ?? "claude-3-5-sonnet-20241022",
      max_tokens: options?.maxTokens ?? 4096,
      system: systemMessage?.content,
      messages: chatMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  }

  async embed(_texts: string[]) {
    throw new Error("Anthropic does not support embeddings");
  }

  async listModels() {
    return [
      "claude-3-5-sonnet-20241022",
      "claude-3-opus-20240229",
      "claude-3-haiku-20240307",
    ];
  }

  async dispose() {}
}
```

### AI Provider Usage

```typescript
// packages/ai/src/index.ts

import { ProviderRegistry } from "@unisane/kernel";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";

// Create registry
const aiProviders = new ProviderRegistry<AIProvider>();

// Register providers based on config
if (process.env.OPENAI_API_KEY) {
  aiProviders.register(
    new OpenAIProvider({
      name: "openai",
      enabled: true,
      priority: 1,
      apiKey: process.env.OPENAI_API_KEY,
    })
  );
}

if (process.env.ANTHROPIC_API_KEY) {
  aiProviders.register(
    new AnthropicProvider({
      name: "anthropic",
      enabled: true,
      priority: 2,
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  );
}

// Export for use
export const ai = aiProviders.getPrimary();

// Or get specific provider
export function getAIProvider(name: "openai" | "anthropic") {
  return aiProviders.get(name);
}
```

---

## Storage Providers

### Storage Provider Interface

```typescript
// packages/storage/src/providers/types.ts

export interface StorageObject {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag?: string;
  metadata?: Record<string, string>;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: "private" | "public-read";
  cacheControl?: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number; // seconds
  contentType?: string;
}

export interface StorageProvider extends Provider {
  /** Upload a file */
  upload(
    key: string,
    data: Buffer | ReadableStream,
    options?: UploadOptions
  ): Promise<StorageObject>;

  /** Download a file */
  download(key: string): Promise<Buffer>;

  /** Get a readable stream */
  getStream(key: string): Promise<ReadableStream>;

  /** Delete a file */
  delete(key: string): Promise<void>;

  /** Delete multiple files */
  deleteMany(keys: string[]): Promise<void>;

  /** Check if file exists */
  exists(key: string): Promise<boolean>;

  /** Get file metadata */
  getMetadata(key: string): Promise<StorageObject>;

  /** List files with prefix */
  list(prefix?: string, options?: { limit?: number; cursor?: string }): Promise<{
    objects: StorageObject[];
    nextCursor?: string;
  }>;

  /** Get presigned URL for upload */
  getUploadUrl(key: string, options?: PresignedUrlOptions): Promise<string>;

  /** Get presigned URL for download */
  getDownloadUrl(key: string, options?: PresignedUrlOptions): Promise<string>;

  /** Get public URL (if public) */
  getPublicUrl(key: string): string;
}
```

### S3 Provider

```typescript
// packages/storage/src/providers/s3.ts

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageProvider, StorageObject, UploadOptions } from "./types";

export interface S3Config extends ProviderConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string; // For S3-compatible services
  forcePathStyle?: boolean;
  publicUrlBase?: string;
}

export class S3Provider implements StorageProvider {
  readonly name = "s3";
  private client: S3Client;

  constructor(readonly config: S3Config) {
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
    });
  }

  async initialize() {
    // Test connection by listing bucket
    await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.config.bucket,
        MaxKeys: 1,
      })
    );
  }

  async healthCheck() {
    const start = Date.now();
    try {
      await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.config.bucket,
          MaxKeys: 1,
        })
      );
      return { healthy: true, latency: Date.now() - start };
    } catch {
      return { healthy: false };
    }
  }

  async upload(key: string, data: Buffer | ReadableStream, options?: UploadOptions) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: data,
        ContentType: options?.contentType,
        Metadata: options?.metadata,
        ACL: options?.acl,
        CacheControl: options?.cacheControl,
      })
    );

    return this.getMetadata(key);
  }

  async download(key: string) {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })
    );

    const chunks: Uint8Array[] = [];
    const stream = response.Body as ReadableStream;
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  }

  async getStream(key: string) {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })
    );
    return response.Body as ReadableStream;
  }

  async delete(key: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })
    );
  }

  async deleteMany(keys: string[]) {
    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.config.bucket,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
        },
      })
    );
  }

  async exists(key: string) {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<StorageObject> {
    const response = await this.client.send(
      new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })
    );

    return {
      key,
      size: response.ContentLength ?? 0,
      contentType: response.ContentType ?? "application/octet-stream",
      lastModified: response.LastModified ?? new Date(),
      etag: response.ETag,
      metadata: response.Metadata,
    };
  }

  async list(prefix?: string, options?: { limit?: number; cursor?: string }) {
    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
        MaxKeys: options?.limit ?? 1000,
        ContinuationToken: options?.cursor,
      })
    );

    return {
      objects: (response.Contents ?? []).map((obj) => ({
        key: obj.Key!,
        size: obj.Size ?? 0,
        contentType: "application/octet-stream",
        lastModified: obj.LastModified ?? new Date(),
        etag: obj.ETag,
      })),
      nextCursor: response.NextContinuationToken,
    };
  }

  async getUploadUrl(key: string, options?: { expiresIn?: number; contentType?: string }) {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ContentType: options?.contentType,
    });
    return getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn ?? 3600,
    });
  }

  async getDownloadUrl(key: string, options?: { expiresIn?: number }) {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn ?? 3600,
    });
  }

  getPublicUrl(key: string) {
    if (this.config.publicUrlBase) {
      return `${this.config.publicUrlBase}/${key}`;
    }
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  async dispose() {
    this.client.destroy();
  }
}
```

### Cloudflare R2 Provider

```typescript
// packages/storage/src/providers/r2.ts

import { S3Provider, type S3Config } from "./s3";

export interface R2Config extends Omit<S3Config, "region" | "endpoint"> {
  accountId: string;
  publicUrlBase?: string;
}

export class R2Provider extends S3Provider {
  readonly name = "r2";

  constructor(config: R2Config) {
    super({
      ...config,
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
    });
  }
}
```

---

## Email Providers

### Email Provider Interface

```typescript
// packages/notify/src/providers/email/types.ts

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  from?: EmailAddress;
  to: EmailAddress | EmailAddress[];
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  replyTo?: EmailAddress;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  tags?: string[];
}

export interface SendEmailResult {
  id: string;
  accepted: string[];
  rejected: string[];
}

export interface EmailProvider extends Provider {
  /** Send a single email */
  send(options: SendEmailOptions): Promise<SendEmailResult>;

  /** Send batch emails */
  sendBatch(emails: SendEmailOptions[]): Promise<SendEmailResult[]>;

  /** Send templated email */
  sendTemplate(options: {
    to: EmailAddress | EmailAddress[];
    templateId: string;
    variables: Record<string, unknown>;
  }): Promise<SendEmailResult>;
}
```

### Resend Provider

```typescript
// packages/notify/src/providers/email/resend.ts

import { Resend } from "resend";
import type { EmailProvider, SendEmailOptions, SendEmailResult } from "./types";

export interface ResendConfig extends ProviderConfig {
  apiKey: string;
  defaultFrom?: string;
}

export class ResendProvider implements EmailProvider {
  readonly name = "resend";
  private client: Resend;

  constructor(readonly config: ResendConfig) {
    this.client = new Resend(config.apiKey);
  }

  async initialize() {
    // Verify API key
    await this.client.domains.list();
  }

  async healthCheck() {
    const start = Date.now();
    try {
      await this.client.domains.list();
      return { healthy: true, latency: Date.now() - start };
    } catch {
      return { healthy: false };
    }
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

    const { data, error } = await this.client.emails.send({
      from: options.from?.email ?? this.config.defaultFrom!,
      to: toAddresses.map((a) => (a.name ? `${a.name} <${a.email}>` : a.email)),
      cc: options.cc
        ? (Array.isArray(options.cc) ? options.cc : [options.cc]).map((a) => a.email)
        : undefined,
      bcc: options.bcc
        ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]).map((a) => a.email)
        : undefined,
      reply_to: options.replyTo?.email,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
      headers: options.headers,
      tags: options.tags?.map((t) => ({ name: t, value: t })),
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data!.id,
      accepted: toAddresses.map((a) => a.email),
      rejected: [],
    };
  }

  async sendBatch(emails: SendEmailOptions[]): Promise<SendEmailResult[]> {
    // Resend supports batch sending
    const results: SendEmailResult[] = [];
    for (const email of emails) {
      results.push(await this.send(email));
    }
    return results;
  }

  async sendTemplate(options: {
    to: { email: string; name?: string } | { email: string; name?: string }[];
    templateId: string;
    variables: Record<string, unknown>;
  }): Promise<SendEmailResult> {
    // Resend uses React email templates, handled at service level
    throw new Error("Use React email templates with send() instead");
  }

  async dispose() {}
}
```

### AWS SES Provider

```typescript
// packages/notify/src/providers/email/ses.ts

import { SESClient, SendEmailCommand, SendRawEmailCommand } from "@aws-sdk/client-ses";
import type { EmailProvider, SendEmailOptions, SendEmailResult } from "./types";

export interface SESConfig extends ProviderConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  defaultFrom?: string;
}

export class SESProvider implements EmailProvider {
  readonly name = "ses";
  private client: SESClient;

  constructor(readonly config: SESConfig) {
    this.client = new SESClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async initialize() {
    // Verify credentials
  }

  async healthCheck() {
    return { healthy: true };
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

    const command = new SendEmailCommand({
      Source: options.from?.email ?? this.config.defaultFrom,
      Destination: {
        ToAddresses: toAddresses.map((a) => a.email),
        CcAddresses: options.cc
          ? (Array.isArray(options.cc) ? options.cc : [options.cc]).map((a) => a.email)
          : undefined,
        BccAddresses: options.bcc
          ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]).map((a) => a.email)
          : undefined,
      },
      Message: {
        Subject: { Data: options.subject },
        Body: {
          Text: options.text ? { Data: options.text } : undefined,
          Html: options.html ? { Data: options.html } : undefined,
        },
      },
    });

    const result = await this.client.send(command);

    return {
      id: result.MessageId ?? "",
      accepted: toAddresses.map((a) => a.email),
      rejected: [],
    };
  }

  async sendBatch(emails: SendEmailOptions[]): Promise<SendEmailResult[]> {
    return Promise.all(emails.map((e) => this.send(e)));
  }

  async sendTemplate(options: {
    to: { email: string; name?: string } | { email: string; name?: string }[];
    templateId: string;
    variables: Record<string, unknown>;
  }): Promise<SendEmailResult> {
    // SES supports templates via SendTemplatedEmailCommand
    throw new Error("Not implemented");
  }

  async dispose() {
    this.client.destroy();
  }
}
```

---

## SMS Providers

### SMS Provider Interface

```typescript
// packages/notify/src/providers/sms/types.ts

export interface SendSMSOptions {
  to: string; // E.164 format: +1234567890
  body: string;
  from?: string;
}

export interface SendSMSResult {
  id: string;
  status: "queued" | "sent" | "delivered" | "failed";
}

export interface SMSProvider extends Provider {
  send(options: SendSMSOptions): Promise<SendSMSResult>;
  sendBatch(messages: SendSMSOptions[]): Promise<SendSMSResult[]>;
}
```

### Twilio Provider

```typescript
// packages/notify/src/providers/sms/twilio.ts

import twilio from "twilio";
import type { SMSProvider, SendSMSOptions, SendSMSResult } from "./types";

export interface TwilioConfig extends ProviderConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export class TwilioProvider implements SMSProvider {
  readonly name = "twilio";
  private client: twilio.Twilio;

  constructor(readonly config: TwilioConfig) {
    this.client = twilio(config.accountSid, config.authToken);
  }

  async initialize() {
    await this.client.api.accounts(this.config.accountSid).fetch();
  }

  async healthCheck() {
    const start = Date.now();
    try {
      await this.client.api.accounts(this.config.accountSid).fetch();
      return { healthy: true, latency: Date.now() - start };
    } catch {
      return { healthy: false };
    }
  }

  async send(options: SendSMSOptions): Promise<SendSMSResult> {
    const message = await this.client.messages.create({
      to: options.to,
      from: options.from ?? this.config.fromNumber,
      body: options.body,
    });

    return {
      id: message.sid,
      status: message.status === "queued" ? "queued" : "sent",
    };
  }

  async sendBatch(messages: SendSMSOptions[]): Promise<SendSMSResult[]> {
    return Promise.all(messages.map((m) => this.send(m)));
  }

  async dispose() {}
}
```

---

## Payment Providers

### Payment Provider Interface

```typescript
// packages/billing/src/providers/types.ts

export interface CreateCheckoutOptions {
  tenantId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CreatePortalOptions {
  tenantId: string;
  returnUrl: string;
}

export interface Subscription {
  id: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  priceId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface PaymentProvider extends Provider {
  /** Create checkout session for new subscription */
  createCheckout(options: CreateCheckoutOptions): Promise<{ url: string }>;

  /** Create billing portal session */
  createPortal(options: CreatePortalOptions): Promise<{ url: string }>;

  /** Get subscription details */
  getSubscription(subscriptionId: string): Promise<Subscription | null>;

  /** Cancel subscription */
  cancelSubscription(subscriptionId: string, immediate?: boolean): Promise<void>;

  /** Handle webhook */
  handleWebhook(payload: string, signature: string): Promise<WebhookEvent>;
}

export interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
}
```

### Stripe Provider

```typescript
// packages/billing/src/providers/stripe.ts

import Stripe from "stripe";
import type { PaymentProvider, CreateCheckoutOptions, Subscription } from "./types";

export interface StripeConfig extends ProviderConfig {
  secretKey: string;
  webhookSecret: string;
}

export class StripeProvider implements PaymentProvider {
  readonly name = "stripe";
  private client: Stripe;

  constructor(readonly config: StripeConfig) {
    this.client = new Stripe(config.secretKey);
  }

  async initialize() {
    await this.client.balance.retrieve();
  }

  async healthCheck() {
    const start = Date.now();
    try {
      await this.client.balance.retrieve();
      return { healthy: true, latency: Date.now() - start };
    } catch {
      return { healthy: false };
    }
  }

  async createCheckout(options: CreateCheckoutOptions) {
    const session = await this.client.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: options.priceId, quantity: 1 }],
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: {
        tenantId: options.tenantId,
        ...options.metadata,
      },
    });

    return { url: session.url! };
  }

  async createPortal(options: { tenantId: string; returnUrl: string }) {
    // Get customer ID from tenant
    const customerId = await this.getCustomerId(options.tenantId);

    const session = await this.client.billingPortal.sessions.create({
      customer: customerId,
      return_url: options.returnUrl,
    });

    return { url: session.url };
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const sub = await this.client.subscriptions.retrieve(subscriptionId);
      return {
        id: sub.id,
        status: sub.status as Subscription["status"],
        priceId: sub.items.data[0].price.id,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      };
    } catch {
      return null;
    }
  }

  async cancelSubscription(subscriptionId: string, immediate = false) {
    if (immediate) {
      await this.client.subscriptions.cancel(subscriptionId);
    } else {
      await this.client.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
  }

  async handleWebhook(payload: string, signature: string) {
    const event = this.client.webhooks.constructEvent(
      payload,
      signature,
      this.config.webhookSecret
    );

    return {
      type: event.type,
      data: event.data.object as Record<string, unknown>,
    };
  }

  private async getCustomerId(tenantId: string): Promise<string> {
    // Look up or create customer
    // Implementation depends on your data model
    throw new Error("Implement customer lookup");
  }

  async dispose() {}
}
```

---

## Push Notification Providers

### Push Provider Interface

```typescript
// packages/notify/src/providers/push/types.ts

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  badge?: number;
  sound?: string;
}

export interface PushTarget {
  token?: string;
  topic?: string;
  condition?: string;
}

export interface PushResult {
  successCount: number;
  failureCount: number;
  failures?: { token: string; error: string }[];
}

export interface PushProvider extends Provider {
  send(target: PushTarget, notification: PushNotification): Promise<PushResult>;
  sendToMany(tokens: string[], notification: PushNotification): Promise<PushResult>;
  subscribeToTopic(tokens: string[], topic: string): Promise<void>;
  unsubscribeFromTopic(tokens: string[], topic: string): Promise<void>;
}
```

### Firebase Cloud Messaging Provider

```typescript
// packages/notify/src/providers/push/fcm.ts

import admin from "firebase-admin";
import type { PushProvider, PushNotification, PushTarget, PushResult } from "./types";

export interface FCMConfig extends ProviderConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export class FCMProvider implements PushProvider {
  readonly name = "fcm";
  private messaging: admin.messaging.Messaging;

  constructor(readonly config: FCMConfig) {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      }),
    });
    this.messaging = app.messaging();
  }

  async initialize() {
    // FCM doesn't have a simple health check
  }

  async healthCheck() {
    return { healthy: true };
  }

  async send(target: PushTarget, notification: PushNotification): Promise<PushResult> {
    const message: admin.messaging.Message = {
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: notification.data,
      ...(target.token && { token: target.token }),
      ...(target.topic && { topic: target.topic }),
      ...(target.condition && { condition: target.condition }),
    };

    try {
      await this.messaging.send(message);
      return { successCount: 1, failureCount: 0 };
    } catch (error) {
      return {
        successCount: 0,
        failureCount: 1,
        failures: [{ token: target.token ?? "", error: String(error) }],
      };
    }
  }

  async sendToMany(tokens: string[], notification: PushNotification): Promise<PushResult> {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: notification.data,
    };

    const response = await this.messaging.sendEachForMulticast(message);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      failures: response.responses
        .map((r, i) => (r.success ? null : { token: tokens[i], error: r.error?.message ?? "" }))
        .filter(Boolean) as { token: string; error: string }[],
    };
  }

  async subscribeToTopic(tokens: string[], topic: string) {
    await this.messaging.subscribeToTopic(tokens, topic);
  }

  async unsubscribeFromTopic(tokens: string[], topic: string) {
    await this.messaging.unsubscribeFromTopic(tokens, topic);
  }

  async dispose() {
    await admin.app().delete();
  }
}
```

---

## Creating Custom Providers

### Step-by-Step Guide

1. **Define interface** (if new provider type)
2. **Implement provider class**
3. **Register in provider registry**
4. **Add configuration**

### Example: Custom Webhook Provider

```typescript
// packages/webhooks/src/providers/custom.ts

import type { Provider, ProviderConfig } from "@unisane/kernel";

export interface WebhookDelivery {
  id: string;
  url: string;
  payload: unknown;
  status: "pending" | "success" | "failed";
  attempts: number;
  lastAttempt?: Date;
}

export interface WebhookProvider extends Provider {
  deliver(url: string, payload: unknown, options?: { retries?: number }): Promise<WebhookDelivery>;
  getDelivery(id: string): Promise<WebhookDelivery | null>;
}

export class HTTPWebhookProvider implements WebhookProvider {
  readonly name = "http";

  constructor(readonly config: ProviderConfig) {}

  async initialize() {}

  async healthCheck() {
    return { healthy: true };
  }

  async deliver(url: string, payload: unknown, options?: { retries?: number }) {
    const maxRetries = options?.retries ?? 3;
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < maxRetries) {
      attempts++;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          return {
            id: crypto.randomUUID(),
            url,
            payload,
            status: "success" as const,
            attempts,
            lastAttempt: new Date(),
          };
        }
        lastError = new Error(`HTTP ${response.status}`);
      } catch (err) {
        lastError = err as Error;
      }

      // Exponential backoff
      await new Promise((r) => setTimeout(r, Math.pow(2, attempts) * 1000));
    }

    return {
      id: crypto.randomUUID(),
      url,
      payload,
      status: "failed" as const,
      attempts,
      lastAttempt: new Date(),
    };
  }

  async getDelivery(_id: string) {
    // Would need persistence to implement
    return null;
  }

  async dispose() {}
}
```

---

## Provider Configuration

### Environment-Based Configuration

```typescript
// packages/kernel/src/providers/config.ts

import { z } from "zod";

const providerConfigSchema = z.object({
  ai: z.object({
    primary: z.enum(["openai", "anthropic"]).default("openai"),
    openai: z.object({
      apiKey: z.string().optional(),
      model: z.string().default("gpt-4o"),
    }).optional(),
    anthropic: z.object({
      apiKey: z.string().optional(),
      model: z.string().default("claude-3-5-sonnet-20241022"),
    }).optional(),
  }),

  storage: z.object({
    primary: z.enum(["s3", "r2", "local"]).default("s3"),
    s3: z.object({
      bucket: z.string(),
      region: z.string(),
      accessKeyId: z.string(),
      secretAccessKey: z.string(),
    }).optional(),
    r2: z.object({
      accountId: z.string(),
      bucket: z.string(),
      accessKeyId: z.string(),
      secretAccessKey: z.string(),
    }).optional(),
  }),

  email: z.object({
    primary: z.enum(["resend", "ses", "smtp"]).default("resend"),
    from: z.string(),
    resend: z.object({ apiKey: z.string() }).optional(),
    ses: z.object({
      region: z.string(),
      accessKeyId: z.string(),
      secretAccessKey: z.string(),
    }).optional(),
  }),

  payments: z.object({
    primary: z.enum(["stripe", "razorpay"]).default("stripe"),
    stripe: z.object({
      secretKey: z.string(),
      webhookSecret: z.string(),
    }).optional(),
  }),
});

export type ProviderConfig = z.infer<typeof providerConfigSchema>;
```

---

## Fallback Strategies

### Automatic Fallback

```typescript
// packages/kernel/src/providers/fallback.ts

export class FallbackProvider<T extends Provider> {
  constructor(
    private providers: T[],
    private options: { timeout?: number; retries?: number } = {}
  ) {}

  async execute<R>(operation: (provider: T) => Promise<R>): Promise<R> {
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      try {
        const { healthy } = await provider.healthCheck();
        if (!healthy) continue;

        return await operation(provider);
      } catch (err) {
        lastError = err as Error;
        // Log and try next provider
        console.error(`Provider ${provider.name} failed:`, err);
      }
    }

    throw lastError ?? new Error("All providers failed");
  }
}

// Usage
const emailFallback = new FallbackProvider([
  resendProvider,
  sesProvider,
]);

await emailFallback.execute((provider) =>
  provider.send({ to: { email: "user@example.com" }, subject: "Hello", text: "World" })
);
```

---

## Testing Providers

### Mock Providers

```typescript
// packages/ai/src/providers/__mocks__/openai.ts

import type { AIProvider, AICompletionResult } from "../types";

export class MockAIProvider implements AIProvider {
  readonly name = "mock";
  readonly config = { name: "mock", enabled: true };

  private responses: AICompletionResult[] = [];

  setResponse(response: AICompletionResult) {
    this.responses.push(response);
  }

  async initialize() {}
  async healthCheck() {
    return { healthy: true };
  }

  async complete() {
    return (
      this.responses.shift() ?? {
        content: "Mock response",
        model: "mock",
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: "stop" as const,
      }
    );
  }

  async *stream() {
    yield "Mock ";
    yield "streaming ";
    yield "response";
  }

  async embed(texts: string[]) {
    return texts.map(() => new Array(1536).fill(0));
  }

  async listModels() {
    return ["mock-model"];
  }

  async dispose() {}
}
```

### Provider Tests

```typescript
// packages/ai/src/providers/__tests__/openai.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import { OpenAIProvider } from "../openai";

describe("OpenAIProvider", () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider({
      name: "openai",
      enabled: true,
      apiKey: process.env.OPENAI_API_KEY!,
    });
  });

  it("completes a message", async () => {
    const result = await provider.complete([
      { role: "user", content: "Say hello" },
    ]);

    expect(result.content).toBeTruthy();
    expect(result.usage.totalTokens).toBeGreaterThan(0);
  });

  it("streams a response", async () => {
    const chunks: string[] = [];

    for await (const chunk of provider.stream([
      { role: "user", content: "Count to 3" },
    ])) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.join("")).toContain("1");
  });
});
```

---

**Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)
**See Also:** [advanced-features.md](./advanced-features.md), [kernel.md](./kernel.md)
