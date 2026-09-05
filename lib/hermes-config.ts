import fs from "fs";
import path from "path";

export interface HermesConfig {
  mode: string;
  target: string;
  cliPath: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  vpsHost: string;
  vpsPort: string;
  vpsUser: string;
  vpsInstance: string;
}

let cachedEnv: Record<string, string> | null = null;
let lastReadTime = 0;

/**
 * Returns dynamic Hermes configuration by reading .env.local in real-time
 * (with a 2-second throttle cache) and falling back to process.env.
 * This ensures that changing HERMES_MODEL or HERMES_VPS_HOST takes effect
 * immediately without having to restart the development server.
 */
export function getHermesConfig(): HermesConfig {
  const now = Date.now();
  if (!cachedEnv || now - lastReadTime > 2000) {
    const envMap: Record<string, string> = {};
    try {
      const envPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const lines = content.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
            envMap[key] = val;
          }
        }
      }
      cachedEnv = envMap;
      lastReadTime = now;
    } catch (err) {
      console.warn("[Hermes Config] Unable to read .env.local dynamically, using process.env:", err);
    }
  }

  const getVal = (key: string, fallback = ""): string => {
    return (cachedEnv && cachedEnv[key]) || process.env[key] || fallback;
  };

  return {
    mode: getVal("HERMES_MODE", "cli"),
    target: getVal("HERMES_TARGET", "vps"),
    cliPath: getVal("HERMES_CLI_PATH", "/Users/bramastyokusumo/.local/bin/hermes"),
    baseUrl: getVal("HERMES_BASE_URL", "https://router.bynara.id/v1"),
    apiKey: getVal("HERMES_API_KEY", ""),
    model: getVal("HERMES_MODEL", "agnes-2.5-flash"),
    vpsHost: getVal("HERMES_VPS_HOST", "103.30.146.87"),
    vpsPort: getVal("HERMES_VPS_PORT", "4422"),
    vpsUser: getVal("HERMES_VPS_USER", "root"),
    vpsInstance: getVal("HERMES_VPS_INSTANCE", "bramastyo-kusumo-hermes-ee0a46"),
  };
}
