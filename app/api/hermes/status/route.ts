import { NextResponse } from "next/server";
import net from "net";
import { getHermesConfig } from "@/lib/hermes-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function checkTcpLatency(
  host: string,
  port: number,
  timeout = 3000
): Promise<{ online: boolean; latencyMs: number; error?: string }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      const latencyMs = Date.now() - start;
      socket.destroy();
      resolve({ online: true, latencyMs });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ online: false, latencyMs: -1, error: "Connection timed out" });
    });

    socket.on("error", (err) => {
      socket.destroy();
      resolve({ online: false, latencyMs: -1, error: err.message });
    });

    socket.connect(port, host);
  });
}

export async function GET() {
  const config = getHermesConfig();
  const vpsPortNum = parseInt(config.vpsPort, 10) || 4422;

  let pingResult: { online: boolean; latencyMs: number; error?: string } = {
    online: false,
    latencyMs: -1,
    error: undefined,
  };

  if (config.vpsHost) {
    pingResult = await checkTcpLatency(config.vpsHost, vpsPortNum, 3500);
  }

  return NextResponse.json(
    {
      online: pingResult.online,
      latencyMs: pingResult.latencyMs,
      vpsHost: config.vpsHost,
      vpsPort: vpsPortNum,
      vpsUser: config.vpsUser,
      vpsInstance: config.vpsInstance,
      model: config.model,
      mode: config.mode,
      target: config.target,
      error: pingResult.error,
      timestamp: Date.now(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
