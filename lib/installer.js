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

function filterByCategory(skills, categories) {
  if (!categories || categories.length === 0) return skills;
  const cats = new Set(categories.map((c) => c.toLowerCase()));
  return skills.filter((s) => cats.has(s.category.toLowerCase()));
}

function listSkills(targetDir) {
  const claudeDir = path.join(targetDir, ".claude", "commands");
  const cursorDir = path.join(targetDir, ".cursor", "rules");

  return SKILLS.map((skill) => {
    const installedClaude = fs.existsSync(path.join(claudeDir, skill.command));
    const installedCursor = fs.existsSync(path.join(cursorDir, skill.file));
    return {
      slug: skill.slug,
      name: skill.name,
      category: skill.category,
      installedClaude,
      installedCursor,
    };
  });
}

function removeSkills(slugs, targetDir, dryRun) {
  if (dryRun === undefined) dryRun = false;
  const claudeDir = path.join(targetDir, ".claude", "commands");
  const cursorDir = path.join(targetDir, ".cursor", "rules");
  const removed = [];

  for (const slug of slugs) {
    const skill = SKILLS.find((s) => s.slug === slug);
    if (!skill) continue;

    const claudePath = path.join(claudeDir, skill.command);
    if (fs.existsSync(claudePath)) {
      if (!dryRun) fs.unlinkSync(claudePath);
      removed.push(`.claude/commands/${skill.command}`);
    }

    const cursorPath = path.join(cursorDir, skill.file);
    if (fs.existsSync(cursorPath)) {
      if (!dryRun) fs.unlinkSync(cursorPath);
      removed.push(`.cursor/rules/${skill.file}`);
    }
  }

  return removed;
}

function readConfig(targetDir) {
  const configPath = path.join(targetDir, ".skillvaultrc");
  if (!fs.existsSync(configPath)) return null;

  let data;
  try {
    data = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch {
    throw new Error(".skillvaultrc contains invalid JSON");
  }

  if (data.skills) {
    if (!Array.isArray(data.skills)) {
      throw new Error(".skillvaultrc: 'skills' must be an array");
    }
    const validSlugs = new Set(SKILLS.map((s) => s.slug));
    for (const slug of data.skills) {
      if (!validSlugs.has(slug)) {
        throw new Error(`.skillvaultrc: unknown skill slug '${slug}'`);
      }
    }
  }

  if (data.platform) {
    const valid = ["claude", "cursor", "both"];
    if (!valid.includes(data.platform)) {
      throw new Error(`.skillvaultrc: platform must be one of: ${valid.join(", ")}`);
    }
  }

  return data;
}

function writeConfig(config, targetDir) {
  const configPath = path.join(targetDir, ".skillvaultrc");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  return configPath;
}

function installClaude(selectedSkills, includeGuardrails, targetDir, dryRun) {
  if (dryRun === undefined) dryRun = false;
  const commandsDir = path.join(targetDir, ".claude", "commands");
  if (!dryRun) fs.mkdirSync(commandsDir, { recursive: true });

  const copied = [];

  for (const skill of selectedSkills) {
    const src = commandSourcePath(skill);
    const dest = path.join(commandsDir, skill.command);
    if (!dryRun) fs.copyFileSync(src, dest);
    copied.push(`.claude/commands/${skill.command}`);
  }

  if (includeGuardrails) {
    const src = path.join(PKG_ROOT, "Claude.md");
    const dest = path.join(targetDir, "CLAUDE.md");
    if (fs.existsSync(dest)) {
      const existing = fs.readFileSync(dest, "utf8");
      const guardrails = fs.readFileSync(src, "utf8");
      if (!existing.includes("# Security Skills for Claude")) {
        if (!dryRun) fs.appendFileSync(dest, "\n\n" + guardrails);
        copied.push("CLAUDE.md (appended guardrails)");
      } else {
        copied.push("CLAUDE.md (guardrails already present)");
      }
    } else {
      if (!dryRun) fs.copyFileSync(src, dest);
      copied.push("CLAUDE.md");
    }
  }

  return copied;
}

function installCursor(selectedSkills, includeGuardrails, targetDir, dryRun) {
  if (dryRun === undefined) dryRun = false;
  const rulesDir = path.join(targetDir, ".cursor", "rules");
  if (!dryRun) fs.mkdirSync(rulesDir, { recursive: true });

  const copied = [];

  for (const skill of selectedSkills) {
    const src = skillSourcePath(skill);
    const dest = path.join(rulesDir, skill.file);
    if (!dryRun) fs.copyFileSync(src, dest);
    copied.push(`.cursor/rules/${skill.file}`);
  }

  if (includeGuardrails) {
    const src = path.join(PKG_ROOT, "Cursor.md");
    const dest = path.join(rulesDir, "security-guardrails.md");
    if (!dryRun) fs.copyFileSync(src, dest);
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
  filterByCategory,
  listSkills,
  removeSkills,
  readConfig,
  writeConfig,
  installClaude,
  installCursor,
};
