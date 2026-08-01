const fs = require("fs");
const path = require("path");

const envFile = path.resolve(__dirname, "..", ".env");
const outDir = path.resolve(__dirname, "..", "src", "environments");
const outFile = path.join(outDir, "environment.ts");

const env = {};

if (fs.existsSync(envFile)) {
  const raw = fs.readFileSync(envFile, "utf8");
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.substring(0, idx).trim();
    let val = line.substring(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
} else {
  console.log(".env not found, using system environment variables");
}

const get = (key, fallback = "") => {
  const val = process.env[key] || env[key] || fallback;
  return val.replace(/\/$/, ""); // remove barra final
};

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const content = `
export const environment = {
  production: false,
  apiUrl: '${get("API_URL")}',
  apiKey: '${get("API_KEY")}',
  postsApiUrl: '${get("POSTS_API_URL")}',
  postsApiKey: '${get("POSTS_API_KEY")}',
  adminUser: '${get("ADMIN_USER")}',
  adminPass: '${get("ADMIN_PASS")}',
};
`;

fs.writeFileSync(outFile, content, { encoding: "utf8" });
console.log("Wrote", outFile);
