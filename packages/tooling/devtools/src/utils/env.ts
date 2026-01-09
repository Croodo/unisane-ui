import * as fs from 'node:fs';
import * as path from 'node:path';

let loaded = false;

/**
 * Best-effort loader for local development/devtools.
 * Reads .env.local from the workspace root and populates process.env
 * for keys that are not already set (e.g., MONGODB_URI, REDIS_URL).
 */
export function loadEnvLocal(): void {
  if (loaded) return;
  if (process.env.MONGODB_URI) {
    loaded = true;
    return;
  }

  try {
    const p = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(p)) {
      loaded = true;
      return;
    }
    const text = fs.readFileSync(p, 'utf8');
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const idx = line.indexOf('=');
      const k = line.slice(0, idx).trim();
      let v = line.slice(idx + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (process.env[k] === undefined) {
        process.env[k] = v;
      }
    }
  } catch {
    // ignore; devtools should remain best-effort
  } finally {
    loaded = true;
  }
}
