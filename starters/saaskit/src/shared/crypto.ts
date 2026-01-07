import crypto from "node:crypto";

export function sha256Hex(input: string | Buffer | Uint8Array): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function scryptHashPassword(
  password: string
): Promise<{ algo: "scrypt"; saltB64: string; hashB64: string }> {
  const salt = crypto.randomBytes(16);
  const N = 16384,
    r = 8,
    p = 1;
  const keylen = 64;
  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, { N, r, p }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
  return {
    algo: "scrypt",
    saltB64: salt.toString("base64"),
    hashB64: hash.toString("base64"),
  };
}

export async function scryptVerifyPassword(
  password: string,
  saltB64: string,
  hashB64: string
): Promise<boolean> {
  const salt = Buffer.from(saltB64, "base64");
  const keylen = Buffer.from(hashB64, "base64").length;
  const N = 16384,
    r = 8,
    p = 1;
  const computed = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, { N, r, p }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
  const expected = Buffer.from(hashB64, "base64");
  return crypto.timingSafeEqual(computed, expected);
}
