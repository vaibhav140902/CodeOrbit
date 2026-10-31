import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const webDir = path.join(process.cwd(), "apps", "web");
const nextBin = path.join(process.cwd(), "node_modules", ".bin", "next");

console.log("Launching CodeOrbit Next.js 15 App on Port 3001...");
const child = spawn(nextBin, ["dev", "-p", "3001"], {
  cwd: webDir,
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    PORT: "3001",
    NEXT_TELEMETRY_DISABLED: "1",
  },
});

child.stdout.on("data", (data) => {
  process.stdout.write(data);
});

child.stderr.on("data", (data) => {
  process.stderr.write(data);
});

child.on("close", (code) => {
  console.log(`Next.js process exited with code ${code}`);
});

child.on("error", (err) => {
  console.error("Failed to spawn Next.js:", err);
  process.exit(1);
});
