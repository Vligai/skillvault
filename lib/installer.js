"use strict";

const fs = require("fs");
const path = require("path");

const PKG_ROOT = path.join(__dirname, "..");

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

function skillSourcePath(skill) {
  return path.join(PKG_ROOT, "skills", "claude", skill.category, skill.file);
}

function commandSourcePath(skill) {
  return path.join(PKG_ROOT, ".claude", "commands", skill.command);
}

function detectPlatforms(targetDir) {
  const hasClaude = fs.existsSync(path.join(targetDir, ".claude"));
  const hasCursor = fs.existsSync(path.join(targetDir, ".cursor"));
  return { hasClaude, hasCursor };
}

function installClaude(selectedSkills, includeGuardrails, targetDir) {
  const commandsDir = path.join(targetDir, ".claude", "commands");
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
    const dest = path.join(targetDir, "CLAUDE.md");
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

function installCursor(selectedSkills, includeGuardrails, targetDir) {
  const rulesDir = path.join(targetDir, ".cursor", "rules");
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

module.exports = {
  SKILLS,
  PKG_ROOT,
  skillSourcePath,
  commandSourcePath,
  detectPlatforms,
  installClaude,
  installCursor,
};
