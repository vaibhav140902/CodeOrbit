import path from "node:path";
import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://apis.google.com/ https://checkout.razorpay.com https://cdn.razorpay.com https://*.razorpay.com https://razorpay.com${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://*.razorpay.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com data: https://*.razorpay.com",
  "connect-src 'self' https://asia-south2-leetcode-clone-3ac0a.cloudfunctions.net https://*.supabase.co https://generativelanguage.googleapis.com https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://api.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com https://razorpay.com ws://localhost:* http://localhost:* http://127.0.0.1:*",
  "frame-src 'self' https://*.firebaseapp.com https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/ https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com https://razorpay.com https://accounts.google.com",
  "worker-src 'self' blob:",
  "child-src 'self' blob: https://*.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.razorpay.com",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@codeorbit/ui", "@codeorbit/schema"],
  serverExternalPackages: ["pdf-parse", "mammoth", "pdf-lib"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
