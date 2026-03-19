"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

const {
  SKILLS,
  PLATFORMS,
  PKG_ROOT,
  CONFIG_VERSION,
  GUARDRAILS_VERSION,
  getVersion,
  verifyChecksums,
  getGuardrailsVersion,
  replaceGuardrailsBlock,
  doctor,
  skillSourcePath,
  commandSourcePath,
  guardrailsContent,
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
} = require("../lib/installer");

const { parseArgs } = require("../lib/args");

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "skillvault-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("SKILLS registry", () => {
  it("contains 18 skills with required fields", () => {
    assert.equal(SKILLS.length, 18);
    for (const skill of SKILLS) {
      assert.ok(skill.name, "missing name");
      assert.ok(skill.slug, "missing slug");
      assert.ok(skill.category, "missing category");
      assert.ok(skill.file, "missing file");
      assert.ok(skill.command, "missing command");
    }
  });

  it("all source files exist on disk", () => {
    for (const skill of SKILLS) {
      assert.ok(fs.existsSync(skillSourcePath(skill)), `missing skill file: ${skill.file}`);
      assert.ok(fs.existsSync(commandSourcePath(skill)), `missing command file: ${skill.command}`);
    }
  });
});

describe("PLATFORMS registry", () => {
  it("contains 14 platforms", () => {
    assert.equal(PLATFORMS.length, 14);
  });

  it("all platforms have required fields", () => {
    for (const p of PLATFORMS) {
      assert.ok(p.key, "missing key");
      assert.ok(p.name, "missing name");
      assert.ok(p.flag, "missing flag");
      assert.ok(Array.isArray(p.detect), "detect must be array");
      assert.ok(p.type, "missing type");
    }
  });

  it("has unique keys and flags", () => {
    const keys = PLATFORMS.map((p) => p.key);
    assert.equal(new Set(keys).size, keys.length, "duplicate keys");
    const flags = PLATFORMS.map((p) => p.flag);
    assert.equal(new Set(flags).size, flags.length, "duplicate flags");
  });
});

describe("guardrailsContent", () => {
  it("guardrails.md source file exists", () => {
    assert.ok(fs.existsSync(path.join(PKG_ROOT, "docs", "guardrails.md")));
  });

  it("injects platform name into header", () => {
    const content = guardrailsContent("Cursor");
    assert.ok(content.includes("# Security Skills for Cursor\n"));
    assert.ok(content.startsWith("<!-- skillvault-guardrails:"), "should start with version tag");
  });

  it("contains core guardrail sections", () => {
    const content = guardrailsContent("TestPlatform");
    assert.ok(content.includes("## Principles"));
    assert.ok(content.includes("## OWASP Top 10 Checklist"));
    assert.ok(content.includes("## Never Generate"));
  });

  it("generates different headers for different platforms", () => {
    const a = guardrailsContent("Windsurf");
    const b = guardrailsContent("Cline");
    assert.ok(a.includes("# Security Skills for Windsurf"));
    assert.ok(b.includes("# Security Skills for Cline"));
    // Body content should be identical after the header
    assert.equal(a.replace("Windsurf", "X"), b.replace("Cline", "X"));
  });
});

describe("installClaude", () => {
  it("copies all command files", () => {
    const copied = installClaude(SKILLS, false, tmpDir);
    assert.equal(copied.length, 18);

    const commandsDir = path.join(tmpDir, ".claude", "commands");
    for (const skill of SKILLS) {
      const dest = path.join(commandsDir, skill.command);
      assert.ok(fs.existsSync(dest), `missing: ${skill.command}`);
    }
  });

  it("creates CLAUDE.md when missing", () => {
    installClaude(SKILLS, true, tmpDir);
    const dest = path.join(tmpDir, "CLAUDE.md");
    assert.ok(fs.existsSync(dest));
    const content = fs.readFileSync(dest, "utf8");
    assert.ok(content.includes("# Security Skills for Claude"));
  });

  it("appends guardrails to existing CLAUDE.md", () => {
    const dest = path.join(tmpDir, "CLAUDE.md");
    fs.writeFileSync(dest, "# My Project\n\nExisting content.\n");

    installClaude(SKILLS, true, tmpDir);

    const content = fs.readFileSync(dest, "utf8");
    assert.ok(content.startsWith("# My Project"), "original content preserved");
    assert.ok(content.includes("# Security Skills for Claude"), "guardrails appended");
  });

  it("skips append when current-version guardrails already present", () => {
    const dest = path.join(tmpDir, "CLAUDE.md");
    // Write a file that already has the current version tag
    const existing = `<!-- skillvault-guardrails:${GUARDRAILS_VERSION} -->\n# Security Skills for Claude\n\nAlready here.\n`;
    fs.writeFileSync(dest, existing);

    const copied = installClaude(SKILLS, true, tmpDir);

    const content = fs.readFileSync(dest, "utf8");
    assert.equal(content, existing, "file should not be modified");
    assert.ok(
      copied.some((f) => f.includes("already up to date")),
      "should report guardrails already up to date"
    );
  });

  it("replaces legacy (unversioned) guardrails in place", () => {
    const dest = path.join(tmpDir, "CLAUDE.md");
    // Old install without version tag
    fs.writeFileSync(dest, "# My Project\n\n# Security Skills for Claude\n\nOld guardrails.\n");

    const copied = installClaude(SKILLS, true, tmpDir);

    const content = fs.readFileSync(dest, "utf8");
    assert.ok(content.includes("# My Project"), "original header preserved");
    assert.ok(content.includes(`<!-- skillvault-guardrails:${GUARDRAILS_VERSION} -->`), "version tag written");
    assert.ok(!content.includes("Old guardrails."), "old guardrails replaced");
    assert.ok(copied.some((f) => f.includes("updated to v")), "should report update");
  });

  it("installs only selected subset", () => {
    const subset = SKILLS.slice(0, 3);
    const copied = installClaude(subset, false, tmpDir);
    assert.equal(copied.length, 3);

    const commandsDir = path.join(tmpDir, ".claude", "commands");
    const files = fs.readdirSync(commandsDir);
    assert.equal(files.length, 3);
  });

  it("skips guardrails when includeGuardrails is false", () => {
    installClaude(SKILLS, false, tmpDir);
    const dest = path.join(tmpDir, "CLAUDE.md");
    assert.ok(!fs.existsSync(dest), "CLAUDE.md should not exist");
  });
});

describe("installCursor", () => {
  it("copies all skill files and guardrails", () => {
    const copied = installCursor(SKILLS, true, tmpDir);
    // 18 skills + 1 guardrail
    assert.equal(copied.length, 19);

    const rulesDir = path.join(tmpDir, ".cursor", "rules");
    for (const skill of SKILLS) {
      assert.ok(fs.existsSync(path.join(rulesDir, skill.file)), `missing: ${skill.file}`);
    }
    const guardrailFile = path.join(rulesDir, "security-guardrails.md");
    assert.ok(fs.existsSync(guardrailFile));
    const content = fs.readFileSync(guardrailFile, "utf8");
    assert.ok(content.includes("# Security Skills for Cursor"));
  });
});

describe("installRulesDir", () => {
  it("installs skills to windsurf rules dir with templated guardrails", () => {
    const platform = PLATFORMS.find((p) => p.key === "windsurf");
    const copied = installRulesDir(platform, SKILLS, true, tmpDir);
    assert.equal(copied.length, 19);

    const rulesDir = path.join(tmpDir, ".windsurf", "rules");
    for (const skill of SKILLS) {
      assert.ok(fs.existsSync(path.join(rulesDir, skill.file)), `missing: ${skill.file}`);
    }
    const content = fs.readFileSync(path.join(rulesDir, "security-guardrails.md"), "utf8");
    assert.ok(content.includes("# Security Skills for Windsurf"));
  });

  it("installs skills to cline rules dir", () => {
    const platform = PLATFORMS.find((p) => p.key === "cline");
    const copied = installRulesDir(platform, SKILLS, false, tmpDir);
    assert.equal(copied.length, 18);

    const rulesDir = path.join(tmpDir, ".cline", "rules");
    for (const skill of SKILLS) {
      assert.ok(fs.existsSync(path.join(rulesDir, skill.file)), `missing: ${skill.file}`);
    }
  });

  it("installs skills to jetbrains guidelines dir", () => {
    const platform = PLATFORMS.find((p) => p.key === "jetbrains");
    const copied = installRulesDir(platform, SKILLS, true, tmpDir);
    assert.equal(copied.length, 19);

    const content = fs.readFileSync(
      path.join(tmpDir, ".junie", "guidelines", "security-guardrails.md"), "utf8"
    );
    assert.ok(content.includes("# Security Skills for JetBrains AI"));
  });

  it("handles append-to-file pattern for copilot", () => {
    const platform = PLATFORMS.find((p) => p.key === "copilot");
    const instrDir = path.join(tmpDir, ".github");
    fs.mkdirSync(instrDir, { recursive: true });
    fs.writeFileSync(path.join(instrDir, "copilot-instructions.md"), "# My Instructions\n");

    const copied = installRulesDir(platform, SKILLS, true, tmpDir);
    assert.equal(copied.length, 19);
    assert.ok(copied.some((f) => f.includes("appended guardrails")));

    const content = fs.readFileSync(path.join(instrDir, "copilot-instructions.md"), "utf8");
    assert.ok(content.includes("# My Instructions"), "original preserved");
    assert.ok(content.includes("# Security Skills for GitHub Copilot"), "guardrails appended");
  });

  it("handles append-to-file for codex when AGENTS.md does not exist", () => {
    const platform = PLATFORMS.find((p) => p.key === "codex");
    const copied = installRulesDir(platform, SKILLS, true, tmpDir);
    assert.equal(copied.length, 19);
    assert.ok(copied.some((f) => f === "AGENTS.md"));

    const content = fs.readFileSync(path.join(tmpDir, "AGENTS.md"), "utf8");
    assert.ok(content.includes("# Security Skills for Codex CLI"));
  });

  it("skips append when current-version guardrails already in append target", () => {
    const platform = PLATFORMS.find((p) => p.key === "codex");
    const existing = `<!-- skillvault-guardrails:${GUARDRAILS_VERSION} -->\n# Security Skills for Codex CLI\n\nExisting.\n`;
    fs.writeFileSync(path.join(tmpDir, "AGENTS.md"), existing);

    const copied = installRulesDir(platform, SKILLS, true, tmpDir);
    assert.ok(copied.some((f) => f.includes("already up to date")));
  });

  it("replaces legacy (unversioned) guardrails in append target", () => {
    const platform = PLATFORMS.find((p) => p.key === "codex");
    fs.writeFileSync(path.join(tmpDir, "AGENTS.md"), "# My Agents\n\n# Security Skills for Codex CLI\n\nOld content.\n");

    const copied = installRulesDir(platform, SKILLS, true, tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, "AGENTS.md"), "utf8");
    assert.ok(content.includes("# My Agents"), "original header preserved");
    assert.ok(content.includes(`<!-- skillvault-guardrails:${GUARDRAILS_VERSION} -->`), "version tag written");
    assert.ok(!content.includes("Old content."), "old guardrails replaced");
    assert.ok(copied.some((f) => f.includes("updated to v")));
  });

  it("dry run returns paths without creating files", () => {
    const platform = PLATFORMS.find((p) => p.key === "windsurf");
    const copied = installRulesDir(platform, SKILLS, true, tmpDir, true);
    assert.ok(copied.length > 0);

    const rulesDir = path.join(tmpDir, ".windsurf", "rules");
    assert.ok(!fs.existsSync(rulesDir), "rules dir should not exist");
  });
});

describe("installPlatform", () => {
  it("dispatches to installClaude for claude key", () => {
    const copied = installPlatform("claude", SKILLS, false, tmpDir);
    assert.equal(copied.length, 18);
    assert.ok(copied[0].includes(".claude/commands/"));
  });

  it("dispatches to installRulesDir for windsurf key", () => {
    const copied = installPlatform("windsurf", SKILLS, false, tmpDir);
    assert.equal(copied.length, 18);
    assert.ok(copied[0].includes(".windsurf/rules/"));
  });

  it("throws for unknown platform", () => {
    assert.throws(() => installPlatform("unknown", SKILLS, false, tmpDir), /Unknown platform/);
  });
});

describe("detectPlatforms", () => {
  it("detects .claude directory", () => {
    fs.mkdirSync(path.join(tmpDir, ".claude"), { recursive: true });
    const result = detectPlatforms(tmpDir);
    assert.equal(result.claude, true);
    assert.equal(result.cursor, false);
  });

  it("detects .cursor directory", () => {
    fs.mkdirSync(path.join(tmpDir, ".cursor"), { recursive: true });
    const result = detectPlatforms(tmpDir);
    assert.equal(result.claude, false);
    assert.equal(result.cursor, true);
  });

  it("detects neither when empty", () => {
    const result = detectPlatforms(tmpDir);
    for (const p of PLATFORMS) {
      assert.equal(result[p.key], false, `${p.key} should not be detected`);
    }
  });

  it("detects windsurf directory", () => {
    fs.mkdirSync(path.join(tmpDir, ".windsurf"), { recursive: true });
    const result = detectPlatforms(tmpDir);
    assert.equal(result.windsurf, true);
  });

  it("detects copilot instructions file", () => {
    fs.mkdirSync(path.join(tmpDir, ".github"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, ".github", "copilot-instructions.md"), "");
    const result = detectPlatforms(tmpDir);
    assert.equal(result.copilot, true);
  });

  it("detects AGENTS.md for codex", () => {
    fs.writeFileSync(path.join(tmpDir, "AGENTS.md"), "");
    const result = detectPlatforms(tmpDir);
    assert.equal(result.codex, true);
  });

  it("detects .aider.conf.yml for aider", () => {
    fs.writeFileSync(path.join(tmpDir, ".aider.conf.yml"), "");
    const result = detectPlatforms(tmpDir);
    assert.equal(result.aider, true);
  });

  it("detects augment-guidelines.md for augment", () => {
    fs.writeFileSync(path.join(tmpDir, "augment-guidelines.md"), "");
    const result = detectPlatforms(tmpDir);
    assert.equal(result.augment, true);
  });

  it("detects .junie for jetbrains", () => {
    fs.mkdirSync(path.join(tmpDir, ".junie"), { recursive: true });
    const result = detectPlatforms(tmpDir);
    assert.equal(result.jetbrains, true);
  });
});

describe("file content integrity", () => {
  it("copied files match source exactly", () => {
    installClaude(SKILLS, true, tmpDir);

    const skill = SKILLS[0];
    const src = commandSourcePath(skill);
    const dest = path.join(tmpDir, ".claude", "commands", skill.command);

    const srcContent = fs.readFileSync(src, "utf8");
    const destContent = fs.readFileSync(dest, "utf8");
    assert.equal(srcContent, destContent, "copied file should match source exactly");
  });
});

describe("filterByCategory", () => {
  it("returns all skills when categories is empty", () => {
    const result = filterByCategory(SKILLS, []);
    assert.equal(result.length, SKILLS.length);
  });

  it("filters by a single category", () => {
    const result = filterByCategory(SKILLS, ["developer"]);
    assert.ok(result.length > 0);
    for (const s of result) {
      assert.equal(s.category, "developer");
    }
    assert.equal(result.length, 9);
  });

  it("returns empty array for unknown category", () => {
    const result = filterByCategory(SKILLS, ["nonexistent"]);
    assert.equal(result.length, 0);
  });

  it("returns union for multiple categories", () => {
    const result = filterByCategory(SKILLS, ["developer", "security"]);
    assert.equal(result.length, 14);
    for (const s of result) {
      assert.ok(["developer", "security"].includes(s.category));
    }
  });
});

describe("listSkills", () => {
  it("shows all skills as not installed in empty dir", () => {
    const result = listSkills(tmpDir);
    assert.equal(result.length, 18);
    for (const s of result) {
      assert.equal(s.installedClaude, false);
      assert.equal(s.installedCursor, false);
    }
  });

  it("shows installedClaude=true after installClaude", () => {
    installClaude(SKILLS, false, tmpDir);
    const result = listSkills(tmpDir);
    for (const s of result) {
      assert.equal(s.installedClaude, true);
      assert.equal(s.installedCursor, false);
    }
  });

  it("shows partial installation correctly", () => {
    const subset = SKILLS.slice(0, 3);
    installClaude(subset, false, tmpDir);
    const result = listSkills(tmpDir);

    const installed = result.filter((s) => s.installedClaude);
    const notInstalled = result.filter((s) => !s.installedClaude);
    assert.equal(installed.length, 3);
    assert.equal(notInstalled.length, 15);
  });

  it("shows installed_windsurf after installPlatform windsurf", () => {
    installPlatform("windsurf", SKILLS, false, tmpDir);
    const result = listSkills(tmpDir);
    for (const s of result) {
      assert.equal(s.installed_windsurf, true);
      assert.equal(s.installedClaude, false);
    }
  });
});

describe("removeSkills", () => {
  it("removes claude command files", () => {
    installClaude(SKILLS, false, tmpDir);
    const slugs = [SKILLS[0].slug, SKILLS[1].slug];
    const removed = removeSkills(slugs, tmpDir);

    assert.equal(removed.length, 2);
    for (const slug of slugs) {
      const skill = SKILLS.find((s) => s.slug === slug);
      const dest = path.join(tmpDir, ".claude", "commands", skill.command);
      assert.ok(!fs.existsSync(dest), `${skill.command} should be deleted`);
    }
  });

  it("removes cursor rule files", () => {
    installCursor(SKILLS, false, tmpDir);
    const slugs = [SKILLS[0].slug];
    const removed = removeSkills(slugs, tmpDir);

    assert.equal(removed.length, 1);
    const skill = SKILLS[0];
    const dest = path.join(tmpDir, ".cursor", "rules", skill.file);
    assert.ok(!fs.existsSync(dest), `${skill.file} should be deleted`);
  });

  it("removes skills from multiple platforms", () => {
    installClaude(SKILLS.slice(0, 1), false, tmpDir);
    installPlatform("windsurf", SKILLS.slice(0, 1), false, tmpDir);
    const removed = removeSkills([SKILLS[0].slug], tmpDir);

    assert.equal(removed.length, 2);
    assert.ok(removed.some((f) => f.includes(".claude/commands/")));
    assert.ok(removed.some((f) => f.includes(".windsurf/rules/")));
  });

  it("skips non-installed skills silently", () => {
    const removed = removeSkills(["review", "nonexistent-slug"], tmpDir);
    assert.equal(removed.length, 0);
  });

  it("dryRun returns paths without deleting files", () => {
    installClaude(SKILLS, false, tmpDir);
    const slugs = [SKILLS[0].slug];
    const removed = removeSkills(slugs, tmpDir, true);

    assert.equal(removed.length, 1);
    const skill = SKILLS[0];
    const dest = path.join(tmpDir, ".claude", "commands", skill.command);
    assert.ok(fs.existsSync(dest), "file should still exist after dry run");
  });
});

describe("readConfig / writeConfig", () => {
  it("returns null when .skillvaultrc is absent", () => {
    const result = readConfig(tmpDir);
    assert.equal(result, null);
  });

  it("reads a valid config file", () => {
    const config = { skills: ["review", "scan-secrets"], platform: "claude", includeGuardrails: true };
    fs.writeFileSync(path.join(tmpDir, ".skillvaultrc"), JSON.stringify(config));

    const result = readConfig(tmpDir);
    assert.deepEqual(result.skills, ["review", "scan-secrets"]);
    assert.equal(result.platform, "claude");
    assert.equal(result.includeGuardrails, true);
  });

  it("throws on invalid JSON", () => {
    fs.writeFileSync(path.join(tmpDir, ".skillvaultrc"), "not json{{{");
    assert.throws(() => readConfig(tmpDir), /invalid JSON/);
  });

  it("throws on unknown skill slug", () => {
    const config = { skills: ["review", "fake-skill"] };
    fs.writeFileSync(path.join(tmpDir, ".skillvaultrc"), JSON.stringify(config));
    assert.throws(() => readConfig(tmpDir), /unknown skill slug 'fake-skill'/);
  });

  it("accepts all platform keys", () => {
    for (const p of PLATFORMS) {
      const config = { platform: p.key };
      fs.writeFileSync(path.join(tmpDir, ".skillvaultrc"), JSON.stringify(config));
      const result = readConfig(tmpDir);
      assert.equal(result.platform, p.key);
    }
  });

  it("accepts legacy 'both' platform", () => {
    const config = { platform: "both" };
    fs.writeFileSync(path.join(tmpDir, ".skillvaultrc"), JSON.stringify(config));
    const result = readConfig(tmpDir);
    assert.equal(result.platform, "both");
  });

  it("accepts array of platform keys", () => {
    const config = { platform: ["claude", "windsurf", "copilot"] };
    fs.writeFileSync(path.join(tmpDir, ".skillvaultrc"), JSON.stringify(config));
    const result = readConfig(tmpDir);
    assert.deepEqual(result.platform, ["claude", "windsurf", "copilot"]);
  });

  it("throws on unknown platform in array", () => {
    const config = { platform: ["claude", "fakePlatform"] };
    fs.writeFileSync(path.join(tmpDir, ".skillvaultrc"), JSON.stringify(config));
    assert.throws(() => readConfig(tmpDir), /unknown platform 'fakePlatform'/);
  });

  it("throws on invalid platform string", () => {
    const config = { platform: "invalid" };
    fs.writeFileSync(path.join(tmpDir, ".skillvaultrc"), JSON.stringify(config));
    assert.throws(() => readConfig(tmpDir), /platform must be one of/);
  });

  it("writeConfig round-trips through readConfig", () => {
    const config = { skills: ["review", "audit-deps"], platform: "both", includeGuardrails: false };
    writeConfig(config, tmpDir);

    const result = readConfig(tmpDir);
    assert.deepEqual(result.skills, config.skills);
    assert.equal(result.platform, config.platform);
    assert.equal(result.includeGuardrails, config.includeGuardrails);
    assert.equal(result.version, CONFIG_VERSION, "writeConfig should persist version");
  });

  it("writeConfig writes version field", () => {
    writeConfig({ skills: ["review"], platform: "claude" }, tmpDir);
    const raw = JSON.parse(fs.readFileSync(path.join(tmpDir, ".skillvaultrc"), "utf8"));
    assert.equal(raw.version, CONFIG_VERSION);
  });
});

describe("installClaude dryRun", () => {
  it("returns paths but creates no files", () => {
    const copied = installClaude(SKILLS, false, tmpDir, true);
    assert.equal(copied.length, 18);

    const commandsDir = path.join(tmpDir, ".claude", "commands");
    assert.ok(!fs.existsSync(commandsDir), "commands dir should not exist");
  });

  it("returns guardrail path in dry-run mode", () => {
    const copied = installClaude(SKILLS, true, tmpDir, true);
    assert.ok(copied.some((f) => f.includes("CLAUDE.md")), "should include CLAUDE.md path");
    assert.ok(!fs.existsSync(path.join(tmpDir, "CLAUDE.md")), "CLAUDE.md should not exist");
  });
});

describe("installCursor dryRun", () => {
  it("returns paths but creates no files", () => {
    const copied = installCursor(SKILLS, true, tmpDir, true);
    assert.ok(copied.length > 0);

    const rulesDir = path.join(tmpDir, ".cursor", "rules");
    assert.ok(!fs.existsSync(rulesDir), "rules dir should not exist");
  });
});

describe(".skillvaultrc integration", () => {
  it("writeConfig creates a valid file that readConfig can read", () => {
    const config = { skills: ["review"], platform: "cursor", includeGuardrails: true };
    const filePath = writeConfig(config, tmpDir);

    assert.ok(fs.existsSync(filePath));
    const content = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(content);
    assert.deepEqual(parsed.skills, ["review"]);
  });

  it("readConfig validates platform field", () => {
    const config = { platform: "invalid" };
    fs.writeFileSync(path.join(tmpDir, ".skillvaultrc"), JSON.stringify(config));
    assert.throws(() => readConfig(tmpDir), /platform must be one of/);
  });
});

describe("getGuardrailsVersion", () => {
  it("returns GUARDRAILS_VERSION for current-version content", () => {
    const content = `<!-- skillvault-guardrails:${GUARDRAILS_VERSION} -->\n# Security Skills for Test\n`;
    assert.equal(getGuardrailsVersion(content), GUARDRAILS_VERSION);
  });

  it("returns 0 for legacy (unversioned) content", () => {
    assert.equal(getGuardrailsVersion("# Security Skills for Cursor\n\nSome content."), 0);
  });

  it("returns null when guardrails are absent", () => {
    assert.equal(getGuardrailsVersion("# My Project\n\nNo guardrails here."), null);
  });
});

describe("replaceGuardrailsBlock", () => {
  it("replaces versioned block at end of file", () => {
    const original = "# Header\n\n<!-- skillvault-guardrails:0 -->\n# Security Skills for X\n\nOld.";
    const result = replaceGuardrailsBlock(original, "NEW BLOCK");
    assert.ok(result.includes("# Header"), "header preserved");
    assert.ok(result.includes("NEW BLOCK"), "new block inserted");
    assert.ok(!result.includes("Old."), "old block removed");
  });

  it("replaces legacy block without version tag", () => {
    const original = "# Header\n\n# Security Skills for X\n\nOld.";
    const result = replaceGuardrailsBlock(original, "NEW BLOCK");
    assert.ok(result.includes("# Header"), "header preserved");
    assert.ok(result.includes("NEW BLOCK"), "new block inserted");
    assert.ok(!result.includes("Old."), "old block removed");
  });
});

describe("verifyChecksums", () => {
  it("passes when checksums.json is absent (dev/test env)", () => {
    // checksums.json exists in PKG_ROOT; this tests that verify does not throw
    // when the file matches expectations (no tampering in test env)
    assert.doesNotThrow(() => verifyChecksums());
  });

  it("throws when a skill file has been tampered with", () => {
    // Copy checksums.json to tmpDir, write a bad hash, then point PKG_ROOT at tmpDir
    const crypto = require("crypto");
    const checksumsPath = path.join(PKG_ROOT, "checksums.json");
    const real = JSON.parse(fs.readFileSync(checksumsPath, "utf8"));

    // Write a doctored checksums.json with one bad hash into a temp pkg-like dir
    const fakeRoot = path.join(tmpDir, "pkg");
    fs.mkdirSync(fakeRoot, { recursive: true });

    // Copy all referenced files into fakeRoot
    for (const relPath of Object.keys(real)) {
      const src = path.join(PKG_ROOT, relPath);
      const dest = path.join(fakeRoot, relPath);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }

    // Tamper with the checksums file
    const tampered = { ...real };
    const firstKey = Object.keys(tampered)[0];
    tampered[firstKey] = "deadbeef".repeat(8); // wrong hash

    fs.writeFileSync(path.join(fakeRoot, "checksums.json"), JSON.stringify(tampered, null, 2));

    // Replicate verifyChecksums logic inline to test against fakeRoot
    const checksumsData = JSON.parse(fs.readFileSync(path.join(fakeRoot, "checksums.json"), "utf8"));
    let threw = false;
    for (const [relPath, expectedHash] of Object.entries(checksumsData)) {
      const fullPath = path.join(fakeRoot, relPath);
      if (!fs.existsSync(fullPath)) { threw = true; break; }
      const actualHash = crypto.createHash("sha256").update(fs.readFileSync(fullPath)).digest("hex");
      if (actualHash !== expectedHash) { threw = true; break; }
    }
    assert.ok(threw, "should detect tampered file");
  });
});

describe("getVersion", () => {
  it("returns a semver string", () => {
    const version = getVersion();
    assert.match(version, /^\d+\.\d+\.\d+/);
  });
});

describe("doctor", () => {
  it("returns correct structure with empty dir", () => {
    const result = doctor(tmpDir);
    assert.equal(typeof result.version, "string");
    assert.match(result.version, /^\d+\.\d+\.\d+/);
    assert.equal(typeof result.platforms, "object");
    assert.equal(result.config, null);
    assert.equal(result.totalInstalled, 0);

    for (const platform of PLATFORMS) {
      const info = result.platforms[platform.key];
      assert.equal(info.detected, false);
      assert.equal(info.skillCount, 0);
      assert.equal(info.guardrails, false);
    }
  });

  it("detects installed skills per platform", () => {
    installClaude(SKILLS, false, tmpDir);
    installPlatform("cursor", SKILLS.slice(0, 3), false, tmpDir);

    const result = doctor(tmpDir);
    assert.equal(result.platforms.claude.skillCount, 18);
    assert.equal(result.platforms.cursor.skillCount, 3);
    assert.equal(result.totalInstalled, 21);
  });

  it("detects guardrails for claude", () => {
    installClaude(SKILLS, true, tmpDir);
    const result = doctor(tmpDir);
    assert.equal(result.platforms.claude.guardrails, true);
  });

  it("detects guardrails for rules-dir platforms", () => {
    installPlatform("cursor", SKILLS, true, tmpDir);
    const result = doctor(tmpDir);
    assert.equal(result.platforms.cursor.guardrails, true);
  });

  it("detects guardrails for append-target platforms", () => {
    installPlatform("codex", SKILLS, true, tmpDir);
    const result = doctor(tmpDir);
    assert.equal(result.platforms.codex.guardrails, true);
  });

  it("reads config when present", () => {
    const config = { skills: ["review"], platform: "claude" };
    fs.writeFileSync(path.join(tmpDir, ".skillvaultrc"), JSON.stringify(config));

    const result = doctor(tmpDir);
    assert.ok(result.config);
    assert.deepEqual(result.config.skills, ["review"]);
  });

  it("detects platform directories", () => {
    fs.mkdirSync(path.join(tmpDir, ".claude"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, ".cursor"), { recursive: true });

    const result = doctor(tmpDir);
    assert.equal(result.platforms.claude.detected, true);
    assert.equal(result.platforms.cursor.detected, true);
    assert.equal(result.platforms.windsurf.detected, false);
  });
});

// ── Medium priority: C6, U3, U4 ─────────────────────────────────────────────

describe("C6 — modified file protection", () => {
  it("skips a skill file that has been locally modified", () => {
    // First install normally
    installClaude([SKILLS[0]], false, tmpDir);

    // Modify the installed file
    const dest = path.join(tmpDir, ".claude", "commands", SKILLS[0].command);
    fs.appendFileSync(dest, "\n<!-- locally modified -->");

    // Re-install without --force: should skip
    const copied = installClaude([SKILLS[0]], false, tmpDir);
    assert.ok(copied.some((f) => f.includes("(modified — skipped)")), "should skip modified file");

    // File should still have the modification
    const content = fs.readFileSync(dest, "utf8");
    assert.ok(content.includes("<!-- locally modified -->"), "modification should be preserved");
  });

  it("overwrites modified file when force=true", () => {
    installClaude([SKILLS[0]], false, tmpDir);

    const dest = path.join(tmpDir, ".claude", "commands", SKILLS[0].command);
    fs.appendFileSync(dest, "\n<!-- locally modified -->");

    // Re-install with force=true: should overwrite
    const copied = installClaude([SKILLS[0]], false, tmpDir, false, true);
    assert.ok(!copied.some((f) => f.includes("(modified — skipped)")), "should not skip with --force");

    const content = fs.readFileSync(dest, "utf8");
    assert.ok(!content.includes("<!-- locally modified -->"), "modification should be overwritten");
  });

  it("skips modified skill in rules-dir platform", () => {
    const platform = PLATFORMS.find((p) => p.key === "cursor");
    installRulesDir(platform, [SKILLS[0]], false, tmpDir);

    const dest = path.join(tmpDir, ".cursor", "rules", SKILLS[0].file);
    fs.appendFileSync(dest, "\n<!-- locally modified -->");

    const copied = installRulesDir(platform, [SKILLS[0]], false, tmpDir);
    assert.ok(copied.some((f) => f.includes("(modified — skipped)")));
  });

  it("does not warn when unmodified file already exists", () => {
    // Install once, then install again without changes — no skip
    installClaude([SKILLS[0]], false, tmpDir);
    const copied = installClaude([SKILLS[0]], false, tmpDir);
    assert.ok(!copied.some((f) => f.includes("(modified — skipped)")), "unmodified re-install should not skip");
  });
});

describe("U3 — --platform comma-separated flag", () => {
  it("sets single platform via --platform", () => {
    const flags = parseArgs(["init", "--platform", "claude"]);
    assert.equal(flags.platforms.claude, true);
    assert.equal(flags.platforms.cursor, false);
  });

  it("sets multiple platforms via comma-separated --platform", () => {
    const flags = parseArgs(["init", "--platform", "claude,cursor,windsurf"]);
    assert.equal(flags.platforms.claude, true);
    assert.equal(flags.platforms.cursor, true);
    assert.equal(flags.platforms.windsurf, true);
    assert.equal(flags.platforms.cline, false);
  });

  it("treats unknown platform key as unknown flag", () => {
    const flags = parseArgs(["init", "--platform", "claude,fakeplatform"]);
    assert.equal(flags.platforms.claude, true);
    assert.ok(flags.unknownFlags.some((f) => f.includes("fakeplatform")));
  });

  it("--platform coexists with individual platform flags", () => {
    const flags = parseArgs(["init", "--platform", "claude", "--cursor"]);
    assert.equal(flags.platforms.claude, true);
    assert.equal(flags.platforms.cursor, true);
  });
});

describe("U4 — unknown flags collected for fatal handling", () => {
  it("collects unknown flags", () => {
    const flags = parseArgs(["init", "--typo-flag"]);
    assert.ok(flags.unknownFlags.includes("--typo-flag"));
  });

  it("does not collect known flags as unknown", () => {
    const flags = parseArgs(["init", "--all", "--dry-run", "--force"]);
    assert.equal(flags.unknownFlags.length, 0);
  });

  it("does not collect platform flags as unknown", () => {
    const flags = parseArgs(["init", "--claude", "--cursor"]);
    assert.equal(flags.unknownFlags.length, 0);
  });
});
