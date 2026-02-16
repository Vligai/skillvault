#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const PKG_ROOT = path.join(__dirname, "..");
const CWD = process.cwd();

const SKILLS = [
  { name: "Code Security Reviewer", slug: "review", category: "developer", file: "code-security-reviewer.md", command: "review.md" },
  { name: "Secret Scanner", slug: "scan-secrets", category: "developer", file: "secret-scanner.md", command: "scan-secrets.md" },
  { name: "Dependency Auditor", slug: "audit-deps", category: "developer", file: "dependency-auditor.md", command: "audit-deps.md" },
  { name: "Input Validation Generator", slug: "gen-validation", category: "developer", file: "input-validation-generator.md", command: "gen-validation.md" },
  { name: "CI/CD Security Hardener", slug: "harden-cicd", category: "developer", file: "cicd-security-hardener.md", command: "harden-cicd.md" },
  { name: "Threat Model Generator", slug: "threat-model", category: "security", file: "threat-model-generator.md", command: "threat-model.md" },
  { name: "Incident Response Playbook Builder", slug: "ir-playbook", category: "security", file: "incident-response-playbook-builder.md", command: "ir-playbook.md" },
  { name: "Hardening Checklist Generator", slug: "harden-checklist", category: "security", file: "hardening-checklist-generator.md", command: "harden-checklist.md" },
  { name: "IAM Policy Analyzer", slug: "analyze-iam", category: "cloud", file: "iam-policy-analyzer.md", command: "analyze-iam.md" },
  { name: "Phishing Email Analyzer", slug: "check-phishing", category: "user", file: "phishing-email-analyzer.md", command: "check-phishing.md" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function banner() {
  console.log("");
  console.log("  SkillVault — Security skills for AI agents");
  console.log("  ───────────────────────────────────────────");
  console.log("");
}

function detectPlatforms() {
  const hasClaude = fs.existsSync(path.join(CWD, ".claude"));
  const hasCursor = fs.existsSync(path.join(CWD, ".cursor"));
  return { hasClaude, hasCursor };
}

function skillSourcePath(skill) {
  return path.join(PKG_ROOT, "skills", "claude", skill.category, skill.file);
}

function commandSourcePath(skill) {
  return path.join(PKG_ROOT, ".claude", "commands", skill.command);
}

// ── File operations ─────────────────────────────────────────────────────────

function installClaude(selectedSkills, includeGuardrails) {
  const commandsDir = path.join(CWD, ".claude", "commands");
  fs.mkdirSync(commandsDir, { recursive: true });

  const copied = [];

  for (const skill of selectedSkills) {
    const src = commandSourcePath(skill);
    const dest = path.join(commandsDir, skill.command);
    fs.copyFileSync(src, dest);
    copied.push(`.claude/commands/${skill.command}`);
  }

  if (includeGuardrails) {
    const src = path.join(PKG_ROOT, "Claude.md");
    const dest = path.join(CWD, "CLAUDE.md");
    if (fs.existsSync(dest)) {
      const existing = fs.readFileSync(dest, "utf8");
      const guardrails = fs.readFileSync(src, "utf8");
      if (!existing.includes("# Security Skills for Claude")) {
        fs.appendFileSync(dest, "\n\n" + guardrails);
        copied.push("CLAUDE.md (appended guardrails)");
      } else {
        copied.push("CLAUDE.md (guardrails already present)");
      }
    } else {
      fs.copyFileSync(src, dest);
      copied.push("CLAUDE.md");
    }
  }

  return copied;
}

function installCursor(selectedSkills, includeGuardrails) {
  const rulesDir = path.join(CWD, ".cursor", "rules");
  fs.mkdirSync(rulesDir, { recursive: true });

  const copied = [];

  for (const skill of selectedSkills) {
    const src = skillSourcePath(skill);
    const dest = path.join(rulesDir, skill.file);
    fs.copyFileSync(src, dest);
    copied.push(`.cursor/rules/${skill.file}`);
  }

  if (includeGuardrails) {
    const src = path.join(PKG_ROOT, "Cursor.md");
    const dest = path.join(rulesDir, "security-guardrails.md");
    fs.copyFileSync(src, dest);
    copied.push(".cursor/rules/security-guardrails.md");
  }

  return copied;
}

// ── Interactive UI ──────────────────────────────────────────────────────────

function createRL() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

async function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function askPlatform(rl) {
  console.log("  No .claude/ or .cursor/ directory detected.\n");
  console.log("  Which platform are you using?\n");
  console.log("    1) Claude Code");
  console.log("    2) Cursor");
  console.log("    3) Both");
  console.log("");

  while (true) {
    const answer = await ask(rl, "  Enter choice [1/2/3]: ");
    const n = answer.trim();
    if (n === "1") return { claude: true, cursor: false };
    if (n === "2") return { claude: false, cursor: true };
    if (n === "3") return { claude: true, cursor: true };
    console.log("  Please enter 1, 2, or 3.");
  }
}

async function askSkills(rl) {
  const selected = new Array(SKILLS.length).fill(true);

  console.log("  Select skills to install (enter number to toggle, a=all, n=none, press Enter to confirm):\n");

  function printSkills() {
    for (let i = 0; i < SKILLS.length; i++) {
      const check = selected[i] ? "[x]" : "[ ]";
      const num = String(i + 1).padStart(2, " ");
      console.log(`    ${num}) ${check} ${SKILLS[i].name}`);
    }
    console.log("");
  }

  printSkills();

  while (true) {
    const answer = await ask(rl, "  Toggle # (or a/n/Enter): ");
    const input = answer.trim().toLowerCase();

    if (input === "") {
      const result = SKILLS.filter((_, i) => selected[i]);
      if (result.length === 0) {
        console.log("  No skills selected. Select at least one or press Ctrl+C to exit.\n");
        continue;
      }
      return result;
    }

    if (input === "a") {
      selected.fill(true);
      printSkills();
      continue;
    }

    if (input === "n") {
      selected.fill(false);
      printSkills();
      continue;
    }

    const num = parseInt(input, 10);
    if (num >= 1 && num <= SKILLS.length) {
      selected[num - 1] = !selected[num - 1];
      printSkills();
    } else {
      console.log(`  Enter a number 1-${SKILLS.length}, a, n, or Enter.`);
    }
  }
}

async function askGuardrails(rl) {
  const answer = await ask(rl, "  Include security guardrails (CLAUDE.md / Cursor.md)? [Y/n]: ");
  return answer.trim().toLowerCase() !== "n";
}

// ── Summary ─────────────────────────────────────────────────────────────────

function printSummary(files) {
  console.log("");
  console.log("  Installed:\n");
  for (const f of files) {
    console.log(`    + ${f}`);
  }
  console.log("");
  console.log("  Done! Your AI agent now has security superpowers.");
  console.log("");
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    banner();
    console.log("  Usage: skillvault init [options]\n");
    console.log("  Options:");
    console.log("    --all       Install all skills (skip interactive selection)");
    console.log("    --claude    Target Claude Code only");
    console.log("    --cursor    Target Cursor only");
    console.log("    --no-guardrails  Skip guardrail files");
    console.log("");
    process.exit(0);
  }

  if (command !== "init") {
    console.error(`  Unknown command: ${command}. Run 'skillvault help' for usage.`);
    process.exit(1);
  }

  const flagAll = args.includes("--all");
  const flagClaude = args.includes("--claude");
  const flagCursor = args.includes("--cursor");
  const flagNoGuardrails = args.includes("--no-guardrails");

  banner();

  let platforms;
  let selectedSkills;
  let includeGuardrails;

  if (flagClaude || flagCursor) {
    platforms = { claude: flagClaude, cursor: flagCursor };
  } else {
    const detected = detectPlatforms();
    if (detected.hasClaude || detected.hasCursor) {
      platforms = { claude: detected.hasClaude, cursor: detected.hasCursor };
      const names = [detected.hasClaude && "Claude Code", detected.hasCursor && "Cursor"].filter(Boolean).join(" + ");
      console.log(`  Detected platform: ${names}\n`);
    } else {
      platforms = null; // will ask interactively
    }
  }

  if (flagAll) {
    selectedSkills = SKILLS;
    includeGuardrails = !flagNoGuardrails;
    if (!platforms) {
      platforms = { claude: true, cursor: false };
      console.log("  No platform detected — defaulting to Claude Code with --all.\n");
    }
  } else {
    const rl = createRL();
    try {
      if (!platforms) {
        platforms = await askPlatform(rl);
        console.log("");
      }
      selectedSkills = await askSkills(rl);
      includeGuardrails = flagNoGuardrails ? false : await askGuardrails(rl);
    } finally {
      rl.close();
    }
  }

  const allCopied = [];

  if (platforms.claude) {
    const files = installClaude(selectedSkills, includeGuardrails);
    allCopied.push(...files);
  }

  if (platforms.cursor) {
    const files = installCursor(selectedSkills, includeGuardrails);
    allCopied.push(...files);
  }

  printSummary(allCopied);
}

main().catch((err) => {
  console.error("  Error:", err.message);
  process.exit(1);
});
