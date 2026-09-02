import { execFile } from "child_process";
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
 * Execute prompt via Local Hermes CLI Agent
 */
async function callHermesCli(
  combinedPrompt: string,
  cliPathOverride?: string,
  timeoutMs = 60000
): Promise<string> {
  const possiblePaths = [
    cliPathOverride,
    process.env.HERMES_CLI_PATH,
    "/Users/bramastyokusumo/.local/bin/hermes",
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
    const vpsHost = process.env.HERMES_VPS_HOST;
    if (vpsHost) {
      const vpsPort = process.env.HERMES_VPS_PORT || "4422";
      const vpsUser = process.env.HERMES_VPS_USER || "root";
      const { stdout, stderr } = await execFileAsync(
        "ssh",
        [
          "-p",
          vpsPort,
          "-o",
          "StrictHostKeyChecking=no",
          "-o",
          "ConnectTimeout=5",
          `${vpsUser}@${vpsHost}`,
          "hermes",
          "-z",
          combinedPrompt,
        ],
        {
          timeout: timeoutMs,
          maxBuffer: 10 * 1024 * 1024,
        }
      );
      if (!stdout && stderr) {
        throw new Error(`Hermes VPS stderr: ${stderr}`);
      }
      return (stdout || "").trim();
    }

    throw new Error("Hermes CLI binary not found on local system or VPS.");
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
    throw new Error(`Hermes CLI stderr: ${stderr}`);
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
 * Automatically uses Local Hermes CLI (if enabled) and gracefully falls back to API.
 */
export async function runHermesAgent(params: HermesCallParams): Promise<HermesCallResponse> {
  const mode = (process.env.HERMES_MODE || "cli").toLowerCase();
  const startTime = Date.now();

  // Mode 1: Try CLI first if mode is 'cli'
  if (mode === "cli") {
    try {
      console.log(`\x1b[36m[Hermes Agent]\x1b[0m 🚀 Mengirim prompt ke Hermes Agent Lokal (CLI)...`);
      const combinedPrompt = params.systemPrompt
        ? `${params.systemPrompt}\n\n${params.userPrompt}`
        : params.userPrompt;

      const output = await callHermesCli(combinedPrompt, undefined, params.timeoutMs ?? 60000);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      if (output && output.trim().length > 0) {
        console.log(`\x1b[32m[Hermes Agent]\x1b[0m ✅ Berhasil diproses oleh Hermes Agent Lokal! (Durasi: ${elapsed}s)`);
        return {
          success: true,
          content: output,
          source: "cli",
          modelUsed: "Hermes Agent Local (CLI)",
        };
      }
    } catch (cliErr: any) {
      console.warn("\x1b[33m[Hermes Agent]\x1b[0m ⚠️ Hermes CLI gagal/timeout, beralih ke fallback API:", cliErr?.message || cliErr);
    }
  }

  // Mode 2: Call API (either by config or as CLI fallback)
  try {
    console.log(`\x1b[36m[Hermes Agent]\x1b[0m 🌐 Memproses via Hermes API Router...`);
    const { content, model } = await callHermesApi(params, params.timeoutMs ?? 45000);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\x1b[32m[Hermes Agent]\x1b[0m ✅ Berhasil diproses via API (${model}) (Durasi: ${elapsed}s)`);

    return {
      success: true,
      content,
      source: mode === "cli" ? "fallback" : "api",
      modelUsed: `Hermes / ${model}`,
    };
  } catch (apiErr: any) {
    console.error("\x1b[31m[Hermes Agent]\x1b[0m ❌ Seluruh pemanggilan Hermes gagal:", apiErr?.message);
    return {
      success: false,
      content: "",
      source: "fallback",
      error: apiErr?.message || "Failed to execute prompt with Hermes Agent",
    };
  }
}
