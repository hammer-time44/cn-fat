// Runs on every Vercel build: gives sw.js a fresh VERSION so visitors always get the new deploy.
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "public", "sw.js");
const id = (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 8) || Date.now().toString(36);
const src = fs.readFileSync(file, "utf8");
const out = src.replace(/const VERSION = "[^"]*";/, 'const VERSION = "' + id + '";');
fs.writeFileSync(file, out);
console.log("sw.js VERSION ->", id);
