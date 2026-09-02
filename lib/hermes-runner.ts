import { execFile, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execFileAsync = promisify(execFile);

export interface HermesCallParams {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  modelOverride?: string;
  timeoutMs?: number;
}

export interface HermesCallResponse {
  success: boolean;
  content: string;
  source: "cli" | "api" | "fallback";
  modelUsed?: string;
  error?: string;
}

/**
 * Execute prompt on remote VPS Hermes Agent via SSH with stdin piping (safe for multi-line prompts)
 */
function execSshHermes(
  vpsUser: string,
  vpsHost: string,
  vpsPort: string,
  prompt: string,
  timeoutMs = 60000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "ssh",
      [
        "-p",
        vpsPort,
        "-o",
        "StrictHostKeyChecking=no",
        "-o",
        "ConnectTimeout=8",
        `${vpsUser}@${vpsHost}`,
        'hermes -z "$(cat)"',
      ],
      {
        timeout: timeoutMs,
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      if (code === 0 && stdout.trim().length > 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Hermes VPS exited with code ${code}: ${stderr.trim() || stdout.trim()}`));
      }
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

/**
 * Execute prompt via Local or VPS Hermes CLI Agent
 */
async function callHermesCli(
  combinedPrompt: string,
  cliPathOverride?: string,
  timeoutMs = 60000
): Promise<string> {
  const vpsHost = process.env.HERMES_VPS_HOST;

  // 1. If HERMES_VPS_HOST is configured, prioritize VPS Remote Hermes Agent
  if (vpsHost && (!process.env.HERMES_TARGET || process.env.HERMES_TARGET === "vps")) {
    const vpsPort = process.env.HERMES_VPS_PORT || "4422";
    const vpsUser = process.env.HERMES_VPS_USER || "root";
    try {
      const output = await execSshHermes(vpsUser, vpsHost, vpsPort, combinedPrompt, timeoutMs);
      if (output && output.trim().length > 0) {
        return output.trim();
      }
    } catch (vpsErr: any) {
      console.warn(`[Hermes Runner] VPS SSH execution failed (${vpsErr?.message}), checking local binary fallback...`);
    }
  }

  // 2. Local CLI binary fallback
  const possiblePaths = [
    cliPathOverride,
    process.env.HERMES_CLI_PATH,
    "/usr/local/bin/hermes",
    "hermes",
  ].filter(Boolean) as string[];

  let selectedCli: string | null = null;
  for (const path of possiblePaths) {
    if (path === "hermes" || fs.existsSync(path)) {
      selectedCli = path;
      break;
    }
  }

  if (!selectedCli) {
    throw new Error("Hermes CLI binary not found on VPS or local system.");
  }

  const env = {
    ...process.env,
    PATH: `${process.env.HOME || ""}/.local/bin:${process.env.HOME || ""}/.hermes/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ""}`,
  };

  const { stdout, stderr } = await execFileAsync(
    selectedCli,
    ["-z", combinedPrompt],
    {
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      env,
    }
  );

  if (!stdout && stderr) {
    throw new Error(`Hermes Local CLI stderr: ${stderr}`);
  }

  return (stdout || "").trim();
}

/**
 * Execute prompt via HTTP API (Router / VPS / OpenRouter)
 */
async function callHermesApi(
  params: HermesCallParams,
  timeoutMs = 45000
): Promise<{ content: string; model: string }> {
  const baseUrl =
    process.env.HERMES_BASE_URL ||
    process.env.NARA_ROUTER_BASE_URL ||
    "https://router.bynara.id/v1";

  const apiKey =
    process.env.HERMES_API_KEY ||
    process.env.NARA_ROUTER_API_KEY ||
    "";

  const primaryModel =
    params.modelOverride ||
    process.env.HERMES_MODEL ||
    process.env.NARA_ROUTER_MODEL ||
    "mistral-medium-3-5";

  const candidateModels = Array.from(
    new Set([
      primaryModel,
      "mistral-medium-3-5",
      "qwen3.8-flash-free",
      "qwen3.7-flash",
      "agnes-2.0-flash",
      "stepfun-3.7-flash",
      "glm-5.3-flash-free",
    ])
  );

  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt });
  }
  messages.push({ role: "user", content: params.userPrompt });

  const deadline = Date.now() + timeoutMs;
  let lastError: any = null;

  for (const model of candidateModels) {
    const remaining = deadline - Date.now();
    if (remaining < 3000) {
      console.warn(`[Hermes API] Deadline total terlampaui, berhenti mencoba model lain.`);
      break;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), remaining);

      const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://smart-hr.local",
          "X-Title": "Smart HR Hermes Screener",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: params.temperature ?? 0.2,
          max_tokens: params.maxTokens ?? 3000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Hermes API] Model ${model} failed with ${response.status}: ${errText.substring(0, 100)}`);
        continue;
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || "";
      if (rawContent) {
        return { content: rawContent, model };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Hermes API] Network error for model ${model}:`, err.message);
    }
  }

  throw new Error(`All Hermes API models failed. Last error: ${lastError?.message || "Unknown error"}`);
}

/**
 * Universal Hermes Runner:
 * Automatically uses Local/VPS Hermes CLI (if enabled) and gracefully falls back to API.
 */
export async function runHermesAgent(params: HermesCallParams): Promise<HermesCallResponse> {
  const mode = (process.env.HERMES_MODE || "cli").toLowerCase();
  const startTime = Date.now();

  // Mode 1: Try CLI first if mode is 'cli'
  if (mode === "cli") {
    try {
      const vpsHost = process.env.HERMES_VPS_HOST || "103.30.146.87";
      console.log(`\n\x1b[1m\x1b[35m[HERMES ROUTE: CLI / VPS]\x1b[0m 🖥️  Mengeksekusi melalui \x1b[32mHermes Agent Framework CLI (VPS: ${vpsHost})\x1b[0m...`);
      
      const combinedPrompt = params.systemPrompt
        ? `${params.systemPrompt}\n\n${params.userPrompt}`
        : params.userPrompt;

      const output = await callHermesCli(combinedPrompt, undefined, params.timeoutMs ?? 60000);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      if (output && output.trim().length > 0) {
        console.log(`\x1b[1m\x1b[32m[HERMES ROUTE: CLI / VPS]\x1b[0m ✅ SUKSES dieksekusi oleh \x1b[32mHermes Agent CLI\x1b[0m (Durasi: ${elapsed}s | Source: \x1b[33m"cli"\x1b[0m)\n`);
        return {
          success: true,
          content: output,
          source: "cli",
          modelUsed: `Hermes Agent CLI (VPS ${vpsHost})`,
        };
      }
    } catch (cliErr: any) {
      console.warn(`\x1b[1m\x1b[33m[HERMES ROUTE: FAILOVER]\x1b[0m ⚠️  Hermes CLI VPS gagal/timeout (${cliErr?.message || cliErr}) -> Beralih ke \x1b[36mFallback Direct API Router\x1b[0m...`);
    }
  }

  // Mode 2: Call Direct API Router (either by config or as CLI fallback)
  try {
    const isFallback = mode === "cli";
    const routeLabel = isFallback ? "FALLBACK DIRECT API" : "DIRECT API ROUTER";
    console.log(`\x1b[1m\x1b[36m[HERMES ROUTE: ${routeLabel}]\x1b[0m 🌐 Mengeksekusi via \x1b[36mNara Router API Direct\x1b[0m...`);
    
    const { content, model } = await callHermesApi(params, params.timeoutMs ?? 45000);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\x1b[1m\x1b[32m[HERMES ROUTE: ${routeLabel}]\x1b[0m ✅ SUKSES via \x1b[36mNara Router (${model})\x1b[0m (Durasi: ${elapsed}s | Source: \x1b[33m"${isFallback ? "fallback" : "api"}"\x1b[0m)\n`);

    return {
      success: true,
      content,
      source: isFallback ? "fallback" : "api",
      modelUsed: `Nara Router / ${model}`,
    };
  } catch (apiErr: any) {
    console.error(`\x1b[1m\x1b[31m[HERMES ROUTE: ERROR]\x1b[0m ❌ Seluruh pemanggilan gagal:`, apiErr?.message);
    return {
      success: false,
      content: "",
      source: "fallback",
      error: apiErr?.message || "Failed to execute prompt with Hermes Agent",
    };
  }
}
