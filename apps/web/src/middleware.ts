import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_PROD_ORIGINS = new Set([
  "https://codeorbit.app",
  "https://www.codeorbit.app",
  "https://getcodeorbit.vercel.app",
]);

const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return true; // Direct same-origin or curl/mobile requests without Origin header

  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    if (
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:") ||
      origin.startsWith("http://192.168.")
    ) {
      return true;
    }
  }

  if (ALLOWED_PROD_ORIGINS.has(origin)) {
    return true;
  }

  // Allow Vercel preview deployments (e.g. https://codeorbit-git-*.vercel.app)
  if (/^https:\/\/codeorbit(-[a-z0-9-]+)?\.vercel\.app$/.test(origin)) {
    return true;
  }

  return false;
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const isApi = request.nextUrl.pathname.startsWith("/api");

  // Handle CORS preflight for API requests
  if (isApi && request.method === "OPTIONS") {
    if (!isAllowedOrigin(origin)) {
      return new NextResponse(null, { status: 403 });
    }

    const response = new NextResponse(null, { status: 204 });
    if (origin && isAllowedOrigin(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Authorization, Content-Type, Accept, X-Requested-With, x-codeorbit-viewer-uid, x-codeorbit-viewer-email, x-codeorbit-viewer-name"
      );
      response.headers.set("Access-Control-Max-Age", "86400");
    }
    return response;
  }

  // Normal request flow
  const response = NextResponse.next();

  // Attach CORS headers to API responses if allowed
  if (isApi && origin && isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Global security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=()"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
