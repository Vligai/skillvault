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
