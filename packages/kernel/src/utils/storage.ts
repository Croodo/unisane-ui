import {
  S3Client,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getEnv } from "../env";
import { Readable } from "node:stream";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err as Error;
      const isRetryable =
        err instanceof S3ServiceException &&
        (err.$retryable || err.name === "ServiceUnavailable");
      if (!isRetryable || attempt === maxRetries - 1) throw err;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw lastError;
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const env = getEnv();
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_REGION) {
    throw new Error(
      "Storage not configured: set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
    );
  }

  s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    ...(env.STORAGE_ENDPOINT ? { endpoint: env.STORAGE_ENDPOINT } : {}),
    ...(env.STORAGE_FORCE_PATH_STYLE ? { forcePathStyle: true } : {}),
  });

  return s3Client;
}

function getBucket(): string {
  const env = getEnv();
  if (!env.STORAGE_BUCKET) {
    throw new Error("Storage not configured: set STORAGE_BUCKET");
  }
  return env.STORAGE_BUCKET;
}

export type SignedUrl = { url: string; key: string; expiresAt: number };

export async function getSignedDownloadUrl(
  key: string,
  expiresInSec = 600
): Promise<SignedUrl> {
  const client = getS3Client();
  const bucket = getBucket();

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const url = await getSignedUrl(client, command, { expiresIn: expiresInSec });
  const expiresAt = Date.now() + expiresInSec * 1000;

  return { url, key, expiresAt };
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (body == null) return Buffer.from([]);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof body === "string") return Buffer.from(body);
  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  // AWS SDK may return a web ReadableStream in some runtimes.
  const maybeStream = body as { getReader?: () => unknown };
  if (typeof maybeStream?.getReader === "function") {
    const reader = maybeStream.getReader() as {
      read: () => Promise<{ done: boolean; value?: Uint8Array }>;
    };
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c)));
  }
  throw new Error("Unsupported S3 body type");
}

/**
 * Fetch an object from S3 and return its contents as a Buffer.
 */
export async function getObjectBuffer(key: string): Promise<Buffer> {
  const client = getS3Client();
  const bucket = getBucket();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const res = await withRetry(() => client.send(command));
  return streamToBuffer(res.Body);
}

export async function getSignedUploadUrl(
  key: string,
  expiresInSec = 600,
  contentType?: string
): Promise<SignedUrl> {
  const client = getS3Client();
  const bucket = getBucket();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ...(contentType ? { ContentType: contentType } : {}),
  });
  const url = await getSignedUrl(client, command, { expiresIn: expiresInSec });
  const expiresAt = Date.now() + expiresInSec * 1000;

  return { url, key, expiresAt };
}

/**
 * Upload a JSON object to S3.
 */
export async function putJsonObject(
  key: string,
  value: unknown,
  opts?: { contentType?: string }
): Promise<void> {
  const client = getS3Client();
  const bucket = getBucket();
  const contentType = opts?.contentType ?? "application/json";
  const body = JSON.stringify(value);
  await withRetry(() =>
    client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    )
  );
}

/**
 * Upload a Buffer to S3.
 */
export async function putObjectBuffer(
  key: string,
  body: Buffer,
  opts?: { contentType?: string }
): Promise<void> {
  const client = getS3Client();
  const bucket = getBucket();
  await withRetry(() =>
    client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ...(opts?.contentType ? { ContentType: opts.contentType } : {}),
      })
    )
  );
}

/**
 * Fetch a JSON object from S3 and parse it.
 */
export async function getJsonObject<T = unknown>(key: string): Promise<T> {
  const buf = await getObjectBuffer(key);
  const text = buf.toString("utf8");
  return JSON.parse(text) as T;
}

export async function deleteS3Object(key: string): Promise<void> {
  const client = getS3Client();
  const bucket = getBucket();

  await withRetry(() =>
    client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  );
}

export async function headS3Object(
  key: string
): Promise<{ contentLength: number; contentType: string } | null> {
  const client = getS3Client();
  const bucket = getBucket();

  try {
    const result = await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key })
    );
    return {
      contentLength: result.ContentLength ?? 0,
      contentType: result.ContentType ?? "application/octet-stream",
    };
  } catch (err: unknown) {
    const e = err as { name?: string };
    if (e.name === "NotFound" || e.name === "NoSuchKey") {
      return null;
    }
    throw err;
  }
}

export function exportObjectKey(
  tenantId: string,
  resource: string,
  ts: number,
  format: "json" | "csv" | "xlsx"
): string {
  const safeRes = resource.replace(/[^a-zA-Z0-9_\-]/g, "_");
  return `exports/${tenantId}/${safeRes}-${ts}.${format}`;
}
