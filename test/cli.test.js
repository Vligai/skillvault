"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

const {
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
} = require("../lib/installer");

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "skillvault-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("SKILLS registry", () => {
  it("contains 10 skills with required fields", () => {
    assert.equal(SKILLS.length, 10);
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

describe("installClaude", () => {
  it("copies all command files", () => {
    const copied = installClaude(SKILLS, false, tmpDir);
    assert.equal(copied.length, 10);

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

  it("skips append when guardrails already present", () => {
    const dest = path.join(tmpDir, "CLAUDE.md");
    const original = "# Security Skills for Claude\n\nAlready here.\n";
    fs.writeFileSync(dest, original);

    const copied = installClaude(SKILLS, true, tmpDir);

    const content = fs.readFileSync(dest, "utf8");
    assert.equal(content, original, "file should not be modified");
    assert.ok(
      copied.some((f) => f.includes("guardrails already present")),
      "should report guardrails already present"
    );
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
    // 10 skills + 1 guardrail
    assert.equal(copied.length, 11);

    const rulesDir = path.join(tmpDir, ".cursor", "rules");
    for (const skill of SKILLS) {
      assert.ok(fs.existsSync(path.join(rulesDir, skill.file)), `missing: ${skill.file}`);
    }
    assert.ok(fs.existsSync(path.join(rulesDir, "security-guardrails.md")));
  });
});

describe("detectPlatforms", () => {
  it("detects .claude directory", () => {
    fs.mkdirSync(path.join(tmpDir, ".claude"), { recursive: true });
    const result = detectPlatforms(tmpDir);
    assert.equal(result.hasClaude, true);
    assert.equal(result.hasCursor, false);
  });

  it("detects .cursor directory", () => {
    fs.mkdirSync(path.join(tmpDir, ".cursor"), { recursive: true });
    const result = detectPlatforms(tmpDir);
    assert.equal(result.hasClaude, false);
    assert.equal(result.hasCursor, true);
  });

  it("detects neither when empty", () => {
    const result = detectPlatforms(tmpDir);
    assert.equal(result.hasClaude, false);
    assert.equal(result.hasCursor, false);
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

// ── New tests ────────────────────────────────────────────────────────────────

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
    assert.equal(result.length, 5);
  });

  it("returns empty array for unknown category", () => {
    const result = filterByCategory(SKILLS, ["nonexistent"]);
    assert.equal(result.length, 0);
  });

  it("returns union for multiple categories", () => {
    const result = filterByCategory(SKILLS, ["developer", "security"]);
    assert.equal(result.length, 8); // 5 developer + 3 security
    for (const s of result) {
      assert.ok(["developer", "security"].includes(s.category));
    }
  });
});

describe("listSkills", () => {
  it("shows all skills as not installed in empty dir", () => {
    const result = listSkills(tmpDir);
    assert.equal(result.length, 10);
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
    assert.equal(notInstalled.length, 7);
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

  it("skips non-installed skills silently", () => {
    const removed = removeSkills(["review", "nonexistent-slug"], tmpDir);
    assert.equal(removed.length, 0);
  });

  it("dryRun returns paths without deleting files", () => {
    installClaude(SKILLS, false, tmpDir);
    const slugs = [SKILLS[0].slug];
    const removed = removeSkills(slugs, tmpDir, true);

    assert.equal(removed.length, 1);
    // File should still exist
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

  it("writeConfig round-trips through readConfig", () => {
    const config = { skills: ["review", "audit-deps"], platform: "both", includeGuardrails: false };
    writeConfig(config, tmpDir);

    const result = readConfig(tmpDir);
    assert.deepEqual(result.skills, config.skills);
    assert.equal(result.platform, config.platform);
    assert.equal(result.includeGuardrails, config.includeGuardrails);
  });
});

describe("installClaude dryRun", () => {
  it("returns paths but creates no files", () => {
    const copied = installClaude(SKILLS, false, tmpDir, true);
    assert.equal(copied.length, 10);

    // No files should exist
    const commandsDir = path.join(tmpDir, ".claude", "commands");
    assert.ok(!fs.existsSync(commandsDir), "commands dir should not exist");
  });

  it("returns guardrail path in dry-run mode", () => {
    const copied = installClaude(SKILLS, true, tmpDir, true);
    assert.ok(copied.some((f) => f.includes("CLAUDE.md")), "should include CLAUDE.md path");
    // CLAUDE.md should not exist
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
