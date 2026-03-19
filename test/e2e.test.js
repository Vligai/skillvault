"use strict";

/**
 * T4 — End-to-end CLI tests.
 * Spawns bin/cli.js as a child process in a temp directory to validate the
 * full install/list/update/remove pipeline as published users would experience it.
 */

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const CLI = path.join(__dirname, "..", "bin", "cli.js");
const PKG_ROOT = path.join(__dirname, "..");

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "skillvault-e2e-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function cli(args, cwd) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: cwd || tmpDir,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  return result;
}

describe("e2e — init", () => {
  it("installs all claude skills and exits 0", () => {
    const result = cli(["init", "--all", "--claude", "--force"]);
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);

    const commandsDir = path.join(tmpDir, ".claude", "commands");
    assert.ok(fs.existsSync(commandsDir), ".claude/commands should exist");

    const files = fs.readdirSync(commandsDir);
    assert.ok(files.length > 0, "at least one command file should be installed");
  });

  it("installs CLAUDE.md with guardrails", () => {
    cli(["init", "--all", "--claude", "--force"]);
    const claudeMd = path.join(tmpDir, "CLAUDE.md");
    assert.ok(fs.existsSync(claudeMd), "CLAUDE.md should exist");
    const content = fs.readFileSync(claudeMd, "utf8");
    assert.ok(content.includes("skillvault-guardrails"), "guardrails version tag should be present");
  });

  it("--json outputs consistent schema", () => {
    const result = cli(["init", "--all", "--claude", "--force", "--json"]);
    assert.equal(result.status, 0);
    const json = JSON.parse(result.stdout);
    assert.equal(json.command, "init");
    assert.ok(Array.isArray(json.files));
    assert.equal(typeof json.dryRun, "boolean");
  });

  it("--dry-run installs nothing", () => {
    cli(["init", "--all", "--claude", "--dry-run"]);
    const commandsDir = path.join(tmpDir, ".claude", "commands");
    assert.ok(!fs.existsSync(commandsDir), ".claude/commands should not be created");
  });
});

describe("e2e — list", () => {
  it("--json returns an array of skill objects", () => {
    const result = cli(["list", "--json"]);
    assert.equal(result.status, 0);
    const json = JSON.parse(result.stdout);
    assert.ok(Array.isArray(json));
    assert.ok(json.length > 0);
    assert.ok("slug" in json[0]);
    assert.ok("name" in json[0]);
    assert.ok("category" in json[0]);
  });

  it("shows installed status after init", () => {
    cli(["init", "--all", "--claude", "--force"]);
    const result = cli(["list", "--json"]);
    const json = JSON.parse(result.stdout);
    assert.ok(json.some((s) => s.installedClaude === true));
  });
});

describe("e2e — update", () => {
  it("updates installed skills and exits 0", () => {
    cli(["init", "--all", "--claude", "--force"]);
    const result = cli(["update", "--force"]);
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  });

  it("--json outputs consistent schema with summary", () => {
    cli(["init", "--all", "--claude", "--force"]);
    const result = cli(["update", "--force", "--json"]);
    assert.equal(result.status, 0);
    const json = JSON.parse(result.stdout);
    assert.equal(json.command, "update");
    assert.ok(Array.isArray(json.files));
    assert.equal(typeof json.dryRun, "boolean");
    assert.ok("summary" in json);
    assert.equal(typeof json.summary.updated, "number");
    assert.equal(typeof json.summary.unchanged, "number");
    assert.equal(typeof json.summary.skipped, "number");
  });
});

describe("e2e — remove", () => {
  it("removes all skills and exits 0", () => {
    cli(["init", "--all", "--claude", "--force"]);
    const result = cli(["remove", "--all", "--force"]);
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  });

  it("--json outputs consistent schema", () => {
    cli(["init", "--all", "--claude", "--force"]);
    const result = cli(["remove", "--all", "--force", "--json"]);
    assert.equal(result.status, 0);
    const json = JSON.parse(result.stdout);
    assert.equal(json.command, "remove");
    assert.ok(Array.isArray(json.files));
    assert.equal(typeof json.dryRun, "boolean");
  });

  it("cleans up the commands directory when empty", () => {
    cli(["init", "--all", "--claude", "--force"]);
    cli(["remove", "--all", "--force"]);
    const commandsDir = path.join(tmpDir, ".claude", "commands");
    assert.ok(!fs.existsSync(commandsDir), "empty .claude/commands should be removed");
  });
});

describe("e2e — doctor", () => {
  it("exits 0 and returns version in --json mode", () => {
    const result = cli(["doctor", "--json"]);
    assert.equal(result.status, 0);
    const json = JSON.parse(result.stdout);
    assert.match(json.version, /^\d+\.\d+\.\d+/);
    assert.ok("platforms" in json);
  });
});

describe("e2e — error handling", () => {
  it("exits 1 for unknown command", () => {
    const result = cli(["badcommand"]);
    assert.equal(result.status, 1);
  });

  it("exits 1 for unknown flag", () => {
    const result = cli(["init", "--not-a-real-flag"]);
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes("unknown flag"));
  });
});
