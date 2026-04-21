import app from "./app";
import { logger } from "./lib/logger";
import https from "https";

async function registerClerkProxyUrl() {
  if (process.env.NODE_ENV !== "production") return;
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return;

  const proxyUrl = "https://mobilemoneymanager.africa/api/__clerk";
  const body = JSON.stringify({ proxy_url: proxyUrl });

  return new Promise<void>((resolve) => {
    const req = https.request(
      { hostname: "api.clerk.com", path: "/v1/instance", method: "PATCH",
        headers: { "Authorization": `Bearer ${secretKey}`, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
      (res) => {
        logger.info({ status: res.statusCode }, "[Clerk] proxy URL registration");
        resolve();
      }
    );
    req.on("error", (err) => { logger.warn({ err }, "[Clerk] proxy URL registration failed"); resolve(); });
    req.write(body);
    req.end();
  });
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  registerClerkProxyUrl();
});
