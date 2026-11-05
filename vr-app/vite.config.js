import fs from "node:fs";
import { defineConfig } from "vite";

// npm run quest (tools/serve_quest.sh) passes a self-signed certificate so the
// dev server runs over HTTPS on the LAN. Plain npm run dev stays HTTP on
// localhost, which browsers already treat as secure.
const cert = process.env.QUEST_CERT;
const key = process.env.QUEST_KEY;

export default defineConfig({
  server: cert && key
    ? { https: { cert: fs.readFileSync(cert), key: fs.readFileSync(key) } }
    : {}
});
