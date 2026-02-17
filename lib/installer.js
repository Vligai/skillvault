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

// ── Platform Registry ────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    key: "claude", name: "Claude Code", flag: "claude",
    detect: [{ type: "dir", path: ".claude" }],
    type: "claude-commands",
  },
  {
    key: "cursor", name: "Cursor", flag: "cursor",
    detect: [{ type: "dir", path: ".cursor" }],
    type: "rules-dir", skillsDir: ".cursor/rules",
    guardrailsSource: "Cursor.md", guardrailsTarget: ".cursor/rules/security-guardrails.md",
  },
  {
    key: "windsurf", name: "Windsurf", flag: "windsurf",
    detect: [{ type: "dir", path: ".windsurf" }],
    type: "rules-dir", skillsDir: ".windsurf/rules",
    guardrailsSource: "Windsurf.md", guardrailsTarget: ".windsurf/rules/security-guardrails.md",
  },
  {
    key: "copilot", name: "GitHub Copilot", flag: "copilot",
    detect: [{ type: "file", path: ".github/copilot-instructions.md" }],
    type: "rules-dir", skillsDir: ".github/copilot/skills",
    guardrailsSource: "Copilot.md",
    guardrailsAppendTarget: ".github/copilot-instructions.md",
    guardrailsAppendMarker: "# Security Skills for GitHub Copilot",
  },
  {
    key: "cline", name: "Cline", flag: "cline",
    detect: [{ type: "dir", path: ".cline" }],
    type: "rules-dir", skillsDir: ".cline/rules",
    guardrailsSource: "Cline.md", guardrailsTarget: ".cline/rules/security-guardrails.md",
  },
  {
    key: "roo", name: "Roo Code", flag: "roo",
    detect: [{ type: "dir", path: ".roo" }],
    type: "rules-dir", skillsDir: ".roo/rules",
    guardrailsSource: "Roo.md", guardrailsTarget: ".roo/rules/security-guardrails.md",
  },
  {
    key: "continue", name: "Continue", flag: "continue",
    detect: [{ type: "dir", path: ".continue" }],
    type: "rules-dir", skillsDir: ".continue/rules",
    guardrailsSource: "Continue.md", guardrailsTarget: ".continue/rules/security-guardrails.md",
  },
  {
    key: "codex", name: "Codex CLI", flag: "codex",
    detect: [{ type: "file", path: "AGENTS.md" }],
    type: "rules-dir", skillsDir: "codex-skills",
    guardrailsSource: "Codex.md",
    guardrailsAppendTarget: "AGENTS.md",
    guardrailsAppendMarker: "# Security Skills for Codex CLI",
  },
  {
    key: "amazonq", name: "Amazon Q Developer", flag: "amazonq",
    detect: [{ type: "dir", path: ".q" }],
    type: "rules-dir", skillsDir: ".q/rules",
    guardrailsSource: "AmazonQ.md", guardrailsTarget: ".q/rules/security-guardrails.md",
  },
  {
    key: "cody", name: "Sourcegraph Cody", flag: "cody",
    detect: [{ type: "dir", path: ".cody" }],
    type: "rules-dir", skillsDir: ".cody/rules",
    guardrailsSource: "Cody.md", guardrailsTarget: ".cody/rules/security-guardrails.md",
  },
  {
    key: "jetbrains", name: "JetBrains AI", flag: "jetbrains",
    detect: [{ type: "dir", path: ".junie" }],
    type: "rules-dir", skillsDir: ".junie/guidelines",
    guardrailsSource: "JetBrains.md", guardrailsTarget: ".junie/guidelines/security-guardrails.md",
  },
  {
    key: "tabnine", name: "Tabnine", flag: "tabnine",
    detect: [{ type: "dir", path: ".tabnine" }],
    type: "rules-dir", skillsDir: ".tabnine/rules",
    guardrailsSource: "Tabnine.md", guardrailsTarget: ".tabnine/rules/security-guardrails.md",
  },
  {
    key: "aider", name: "Aider", flag: "aider",
    detect: [{ type: "file", path: ".aider.conf.yml" }],
    type: "rules-dir", skillsDir: ".aider/rules",
    guardrailsSource: "Aider.md", guardrailsTarget: ".aider/rules/security-guardrails.md",
  },
  {
    key: "augment", name: "Augment Code", flag: "augment",
    detect: [{ type: "file", path: "augment-guidelines.md" }],
    type: "rules-dir", skillsDir: "augment-skills",
    guardrailsSource: "Augment.md",
    guardrailsAppendTarget: "augment-guidelines.md",
    guardrailsAppendMarker: "# Security Skills for Augment Code",
  },
];

function skillSourcePath(skill) {
  return path.join(PKG_ROOT, "skills", "claude", skill.category, skill.file);
}

function commandSourcePath(skill) {
  return path.join(PKG_ROOT, ".claude", "commands", skill.command);
}

function detectPlatforms(targetDir) {
  const result = {};
  for (const platform of PLATFORMS) {
    const detected = platform.detect.some((d) => {
      const fullPath = path.join(targetDir, d.path);
      if (d.type === "dir") return fs.existsSync(fullPath);
      if (d.type === "file") return fs.existsSync(fullPath);
      return false;
    });
    result[platform.key] = detected;
  }
  return result;
}

function filterByCategory(skills, categories) {
  if (!categories || categories.length === 0) return skills;
  const cats = new Set(categories.map((c) => c.toLowerCase()));
  return skills.filter((s) => cats.has(s.category.toLowerCase()));
}

function listSkills(targetDir) {
  const claudeDir = path.join(targetDir, ".claude", "commands");

  return SKILLS.map((skill) => {
    const result = {
      slug: skill.slug,
      name: skill.name,
      category: skill.category,
      installedClaude: fs.existsSync(path.join(claudeDir, skill.command)),
    };

    for (const platform of PLATFORMS) {
      if (platform.type === "claude-commands") continue;
      const dir = path.join(targetDir, platform.skillsDir);
      result["installed_" + platform.key] = fs.existsSync(path.join(dir, skill.file));
    }

    // Keep backward-compatible aliases
    result.installedCursor = result.installed_cursor;

    return result;
  });
}

function removeSkills(slugs, targetDir, dryRun) {
  if (dryRun === undefined) dryRun = false;
  const removed = [];

  for (const slug of slugs) {
    const skill = SKILLS.find((s) => s.slug === slug);
    if (!skill) continue;

    // Claude commands
    const claudePath = path.join(targetDir, ".claude", "commands", skill.command);
    if (fs.existsSync(claudePath)) {
      if (!dryRun) fs.unlinkSync(claudePath);
      removed.push(`.claude/commands/${skill.command}`);
    }

    // All rules-dir platforms
    for (const platform of PLATFORMS) {
      if (platform.type === "claude-commands") continue;
      const filePath = path.join(targetDir, platform.skillsDir, skill.file);
      if (fs.existsSync(filePath)) {
        if (!dryRun) fs.unlinkSync(filePath);
        removed.push(`${platform.skillsDir}/${skill.file}`);
      }
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
    const validKeys = new Set(PLATFORMS.map((p) => p.key));
    validKeys.add("both"); // legacy alias for claude+cursor
    if (Array.isArray(data.platform)) {
      for (const p of data.platform) {
        if (!validKeys.has(p)) {
          throw new Error(`.skillvaultrc: unknown platform '${p}'`);
        }
      }
    } else if (!validKeys.has(data.platform)) {
      throw new Error(`.skillvaultrc: platform must be one of: ${[...validKeys].join(", ")}`);
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

function installRulesDir(platform, selectedSkills, includeGuardrails, targetDir, dryRun) {
  if (dryRun === undefined) dryRun = false;
  const rulesDir = path.join(targetDir, platform.skillsDir);
  if (!dryRun) fs.mkdirSync(rulesDir, { recursive: true });

  const copied = [];

  for (const skill of selectedSkills) {
    const src = skillSourcePath(skill);
    const dest = path.join(rulesDir, skill.file);
    if (!dryRun) fs.copyFileSync(src, dest);
    copied.push(`${platform.skillsDir}/${skill.file}`);
  }

  if (includeGuardrails) {
    const src = path.join(PKG_ROOT, platform.guardrailsSource);

    // Append-to-file pattern (Copilot, Codex, Augment)
    if (platform.guardrailsAppendTarget) {
      const dest = path.join(targetDir, platform.guardrailsAppendTarget);
      if (fs.existsSync(dest)) {
        const existing = fs.readFileSync(dest, "utf8");
        if (!existing.includes(platform.guardrailsAppendMarker)) {
          const guardrails = fs.readFileSync(src, "utf8");
          if (!dryRun) fs.appendFileSync(dest, "\n\n" + guardrails);
          copied.push(`${platform.guardrailsAppendTarget} (appended guardrails)`);
        } else {
          copied.push(`${platform.guardrailsAppendTarget} (guardrails already present)`);
        }
      } else {
        if (!dryRun) fs.copyFileSync(src, dest);
        copied.push(platform.guardrailsAppendTarget);
      }
    }

    // Copy-to-target pattern (all other rules-dir platforms)
    if (platform.guardrailsTarget) {
      const dest = path.join(targetDir, platform.guardrailsTarget);
      if (!dryRun) fs.copyFileSync(src, dest);
      copied.push(platform.guardrailsTarget);
    }
  }

  return copied;
}

// Backward-compatible wrapper
function installCursor(selectedSkills, includeGuardrails, targetDir, dryRun) {
  const platform = PLATFORMS.find((p) => p.key === "cursor");
  return installRulesDir(platform, selectedSkills, includeGuardrails, targetDir, dryRun);
}

function installPlatform(platformKey, selectedSkills, includeGuardrails, targetDir, dryRun) {
  const platform = PLATFORMS.find((p) => p.key === platformKey);
  if (!platform) throw new Error(`Unknown platform: ${platformKey}`);

  if (platform.type === "claude-commands") {
    return installClaude(selectedSkills, includeGuardrails, targetDir, dryRun);
  }
  return installRulesDir(platform, selectedSkills, includeGuardrails, targetDir, dryRun);
}

module.exports = {
  SKILLS,
  PLATFORMS,
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
  installRulesDir,
  installPlatform,
};
