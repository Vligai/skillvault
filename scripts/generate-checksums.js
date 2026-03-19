#!/usr/bin/env node
"use strict";

/**
 * Generates checksums.json — run this before publishing a new package version.
 * Usage: node scripts/generate-checksums.js
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PKG_ROOT = path.join(__dirname, "..");

const TARGETS = [
  "docs/guardrails.md",
  "Claude.md",
];

// Collect all skill and command files dynamically
function collectFiles(dir, base) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(base, entry.name);
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, rel));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(rel);
    }
  }
  return results;
}

TARGETS.push(...collectFiles(path.join(PKG_ROOT, "skills"), "skills"));
TARGETS.push(...collectFiles(path.join(PKG_ROOT, ".claude", "commands"), path.join(".claude", "commands")));

const checksums = {};
for (const rel of TARGETS) {
  const fullPath = path.join(PKG_ROOT, rel);
  const content = fs.readFileSync(fullPath);
  checksums[rel.replace(/\\/g, "/")] = crypto.createHash("sha256").update(content).digest("hex");
}

const outPath = path.join(PKG_ROOT, "checksums.json");
fs.writeFileSync(outPath, JSON.stringify(checksums, null, 2) + "\n");
console.log(`Written ${Object.keys(checksums).length} checksums to checksums.json`);
