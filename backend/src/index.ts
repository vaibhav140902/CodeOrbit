import "dotenv/config";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
];

const parsePort = (value: string | undefined): number => {
  const port = Number(value ?? "8080");

  return Number.isInteger(port) && port > 0 ? port : 8080;
};

const parseAllowedOrigins = (value: string | undefined): string[] => {
  if (!value) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const port = parsePort(process.env.PORT);
const allowedOrigins = parseAllowedOrigins(
  process.env.FRONTEND_ORIGINS ?? process.env.FRONTEND_ORIGIN,
);

const setCorsHeaders = (
  request: IncomingMessage,
  response: ServerResponse,
): boolean => {
  const requestOrigin = request.headers.origin;

  if (!requestOrigin) {
    return true;
  }

  if (!allowedOrigins.includes(requestOrigin)) {
    return false;
  }

  response.setHeader("Access-Control-Allow-Origin", requestOrigin);
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  response.setHeader("Vary", "Origin");

  return true;
};

const sendJson = (
  response: ServerResponse,
  statusCode: number,
  body: Record<string, unknown>,
) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

export const requestListener = (
  request: IncomingMessage,
  response: ServerResponse,
) => {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const corsAllowed = setCorsHeaders(request, response);

  if (!corsAllowed) {
    sendJson(response, 403, { error: "Origin is not allowed by CORS." });
    return;
  }

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (requestUrl.pathname === "/" && request.method === "GET") {
    sendJson(response, 200, {
      message: "CodeOrbit backend is running.",
      allowedOrigins,
    });
    return;
  }

  if (requestUrl.pathname === "/healthz" && request.method === "GET") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  sendJson(response, 404, { error: "Route not found." });
};

export const createAppServer = (): Server => createServer(requestListener);

if (require.main === module) {
  createAppServer().listen(port, () => {
    console.log(`CodeOrbit backend listening on http://localhost:${port}`);
  });
}
