#!/usr/bin/env node

"use strict";

const readline = require("readline");
const {
  SKILLS,
  detectPlatforms,
  filterByCategory,
  listSkills,
  removeSkills,
  readConfig,
  writeConfig,
  installClaude,
  installCursor,
} = require("../lib/installer");

const CWD = process.cwd();

// ── Arg Parsing ──────────────────────────────────────────────────────────────

function parseArgs(args) {
  const result = {
    command: null,
    flagAll: false,
    flagClaude: false,
    flagCursor: false,
    flagNoGuardrails: false,
    flagDryRun: false,
    flagJson: false,
    flagSave: false,
    categories: [],
  };

  let i = 0;
  if (args.length > 0 && !args[0].startsWith("-")) {
    result.command = args[0];
    i = 1;
  }

  while (i < args.length) {
    const arg = args[i];
    if (arg === "--all") result.flagAll = true;
    else if (arg === "--claude") result.flagClaude = true;
    else if (arg === "--cursor") result.flagCursor = true;
    else if (arg === "--no-guardrails") result.flagNoGuardrails = true;
    else if (arg === "--dry-run") result.flagDryRun = true;
    else if (arg === "--json") result.flagJson = true;
    else if (arg === "--save") result.flagSave = true;
    else if (arg === "--category" && i + 1 < args.length) {
      i++;
      result.categories.push(args[i]);
    }
    i++;
  }

  return result;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function banner() {
  console.log("");
  console.log("  SkillVault — Security skills for AI agents");
  console.log("  ───────────────────────────────────────────");
  console.log("");
}

function prefix(flags) {
  return flags.flagDryRun ? "[dry-run] " : "";
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

async function askSkills(rl, skillSet) {
  const selected = new Array(skillSet.length).fill(true);

  console.log("  Select skills to install (enter number to toggle, a=all, n=none, press Enter to confirm):\n");

  function printSkills() {
    for (let i = 0; i < skillSet.length; i++) {
      const check = selected[i] ? "[x]" : "[ ]";
      const num = String(i + 1).padStart(2, " ");
      console.log(`    ${num}) ${check} ${skillSet[i].name}`);
    }
    console.log("");
  }

  printSkills();

  while (true) {
    const answer = await ask(rl, "  Toggle # (or a/n/Enter): ");
    const input = answer.trim().toLowerCase();

    if (input === "") {
      const result = skillSet.filter((_, i) => selected[i]);
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
    if (num >= 1 && num <= skillSet.length) {
      selected[num - 1] = !selected[num - 1];
      printSkills();
    } else {
      console.log(`  Enter a number 1-${skillSet.length}, a, n, or Enter.`);
    }
  }
}

async function askRemoveSkills(rl, installed) {
  const selected = new Array(installed.length).fill(true);

  console.log("  Select skills to remove (enter number to toggle, a=all, n=none, press Enter to confirm):\n");

  function printSkills() {
    for (let i = 0; i < installed.length; i++) {
      const check = selected[i] ? "[x]" : "[ ]";
      const num = String(i + 1).padStart(2, " ");
      console.log(`    ${num}) ${check} ${installed[i].name}`);
    }
    console.log("");
  }

  printSkills();

  while (true) {
    const answer = await ask(rl, "  Toggle # (or a/n/Enter): ");
    const input = answer.trim().toLowerCase();

    if (input === "") {
      return installed.filter((_, i) => selected[i]);
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
    if (num >= 1 && num <= installed.length) {
      selected[num - 1] = !selected[num - 1];
      printSkills();
    } else {
      console.log(`  Enter a number 1-${installed.length}, a, n, or Enter.`);
    }
  }
}

async function askGuardrails(rl) {
  const answer = await ask(rl, "  Include security guardrails (CLAUDE.md / Cursor.md)? [Y/n]: ");
  return answer.trim().toLowerCase() !== "n";
}

// ── Summary ─────────────────────────────────────────────────────────────────

function printSummary(files, flags, verb) {
  const p = prefix(flags);
  console.log("");
  console.log(`  ${p}${verb}:\n`);
  for (const f of files) {
    const symbol = verb === "Removed" ? "-" : "+";
    console.log(`    ${symbol} ${f}`);
  }
  console.log("");
  if (!flags.flagDryRun) {
    console.log("  Done! Your AI agent now has security superpowers.");
  } else {
    console.log("  Dry run complete — no files were modified.");
  }
  console.log("");
}

// ── Commands ────────────────────────────────────────────────────────────────

async function cmdList(flags) {
  const skills = listSkills(CWD);

  if (flags.flagJson) {
    console.log(JSON.stringify(skills, null, 2));
    return;
  }

  banner();

  const categories = [...new Set(SKILLS.map((s) => s.category))];

  for (const cat of categories) {
    console.log(`  ${cat.charAt(0).toUpperCase() + cat.slice(1)}:`);
    const catSkills = skills.filter((s) => s.category === cat);
    for (const s of catSkills) {
      const installed = s.installedClaude || s.installedCursor;
      const status = installed ? "[installed]" : "[available]";
      const platforms = [];
      if (s.installedClaude) platforms.push("claude");
      if (s.installedCursor) platforms.push("cursor");
      const platformStr = platforms.length > 0 ? ` (${platforms.join(", ")})` : "";
      console.log(`    ${status} ${s.name}${platformStr}`);
    }
    console.log("");
  }
}

async function cmdInit(flags) {
  if (!flags.flagJson) banner();

  // Read config for defaults
  let config = null;
  try {
    config = readConfig(CWD);
  } catch (err) {
    if (!flags.flagJson) console.log(`  Warning: ${err.message}\n`);
  }

  let availableSkills = SKILLS;
  if (flags.categories.length > 0) {
    availableSkills = filterByCategory(SKILLS, flags.categories);
  }

  let platforms;
  let selectedSkills;
  let includeGuardrails;

  if (flags.flagClaude || flags.flagCursor) {
    platforms = { claude: flags.flagClaude, cursor: flags.flagCursor };
  } else if (config && config.platform) {
    const p = config.platform;
    platforms = { claude: p === "claude" || p === "both", cursor: p === "cursor" || p === "both" };
    if (!flags.flagJson) {
      const names = [platforms.claude && "Claude Code", platforms.cursor && "Cursor"].filter(Boolean).join(" + ");
      console.log(`  Platform from config: ${names}\n`);
    }
  } else {
    const detected = detectPlatforms(CWD);
    if (detected.hasClaude || detected.hasCursor) {
      platforms = { claude: detected.hasClaude, cursor: detected.hasCursor };
      if (!flags.flagJson) {
        const names = [detected.hasClaude && "Claude Code", detected.hasCursor && "Cursor"].filter(Boolean).join(" + ");
        console.log(`  Detected platform: ${names}\n`);
      }
    } else {
      platforms = null;
    }
  }

  if (flags.flagAll) {
    selectedSkills = availableSkills;
    includeGuardrails = !flags.flagNoGuardrails;
    if (!platforms) {
      platforms = { claude: true, cursor: false };
      if (!flags.flagJson) console.log("  No platform detected — defaulting to Claude Code with --all.\n");
    }
  } else if (config && config.skills && !flags.categories.length) {
    // Use config skills as defaults in non-interactive mode
    const slugSet = new Set(config.skills);
    selectedSkills = availableSkills.filter((s) => slugSet.has(s.slug));
    includeGuardrails = flags.flagNoGuardrails ? false : (config.includeGuardrails !== false);
    if (!platforms) {
      platforms = { claude: true, cursor: false };
    }
  } else {
    const rl = createRL();
    try {
      if (!platforms) {
        platforms = await askPlatform(rl);
        console.log("");
      }
      selectedSkills = await askSkills(rl, availableSkills);
      includeGuardrails = flags.flagNoGuardrails ? false : await askGuardrails(rl);
    } finally {
      rl.close();
    }
  }

  const p = prefix(flags);
  const allCopied = [];

  if (platforms.claude) {
    const files = installClaude(selectedSkills, includeGuardrails, CWD, flags.flagDryRun);
    allCopied.push(...files);
  }

  if (platforms.cursor) {
    const files = installCursor(selectedSkills, includeGuardrails, CWD, flags.flagDryRun);
    allCopied.push(...files);
  }

  if (flags.flagSave && !flags.flagDryRun) {
    const platformStr = platforms.claude && platforms.cursor ? "both" : platforms.claude ? "claude" : "cursor";
    const cfg = {
      skills: selectedSkills.map((s) => s.slug),
      platform: platformStr,
      includeGuardrails: includeGuardrails,
    };
    const cfgPath = writeConfig(cfg, CWD);
    allCopied.push(".skillvaultrc");
  }

  if (flags.flagJson) {
    console.log(JSON.stringify({ installed: allCopied, dryRun: flags.flagDryRun }, null, 2));
    return;
  }

  printSummary(allCopied, flags, "Installed");
}

async function cmdUpdate(flags) {
  if (!flags.flagJson) banner();

  const skills = listSkills(CWD);
  let installed = skills.filter((s) => s.installedClaude || s.installedCursor);

  if (flags.categories.length > 0) {
    installed = installed.filter((s) => {
      const cats = new Set(flags.categories.map((c) => c.toLowerCase()));
      return cats.has(s.category.toLowerCase());
    });
  }

  if (installed.length === 0) {
    if (flags.flagJson) {
      console.log(JSON.stringify({ updated: [], dryRun: flags.flagDryRun }, null, 2));
    } else {
      console.log("  No installed skills found. Run 'skillvault init' first.\n");
    }
    return;
  }

  // Map back to full SKILLS objects
  const slugSet = new Set(installed.map((s) => s.slug));
  const selectedSkills = SKILLS.filter((s) => slugSet.has(s.slug));

  const allCopied = [];

  // Detect which platforms have installed skills
  const hasClaude = flags.flagClaude || installed.some((s) => s.installedClaude);
  const hasCursor = flags.flagCursor || installed.some((s) => s.installedCursor);

  if (hasClaude && !flags.flagCursor) {
    const files = installClaude(selectedSkills, false, CWD, flags.flagDryRun);
    allCopied.push(...files);
  }

  if (hasCursor && !flags.flagClaude) {
    const files = installCursor(selectedSkills, false, CWD, flags.flagDryRun);
    allCopied.push(...files);
  }

  if (flags.flagJson) {
    console.log(JSON.stringify({ updated: allCopied, dryRun: flags.flagDryRun }, null, 2));
    return;
  }

  printSummary(allCopied, flags, "Updated");
}

async function cmdRemove(flags) {
  if (!flags.flagJson) banner();

  const skills = listSkills(CWD);
  const installed = skills.filter((s) => s.installedClaude || s.installedCursor);

  if (installed.length === 0) {
    if (flags.flagJson) {
      console.log(JSON.stringify({ removed: [], dryRun: flags.flagDryRun }, null, 2));
    } else {
      console.log("  No installed skills found.\n");
    }
    return;
  }

  let toRemove;
  if (flags.flagAll) {
    toRemove = installed;
  } else {
    const rl = createRL();
    try {
      toRemove = await askRemoveSkills(rl, installed);
    } finally {
      rl.close();
    }
  }

  const slugs = toRemove.map((s) => s.slug);
  const removed = removeSkills(slugs, CWD, flags.flagDryRun);

  if (flags.flagJson) {
    console.log(JSON.stringify({ removed, dryRun: flags.flagDryRun }, null, 2));
    return;
  }

  if (removed.length === 0) {
    console.log("  No files to remove.\n");
    return;
  }

  printSummary(removed, flags, "Removed");
}

// ── Help ────────────────────────────────────────────────────────────────────

function printHelp() {
  banner();
  console.log("  Usage: skillvault <command> [options]\n");
  console.log("  Commands:");
  console.log("    init      Install skills into your project");
  console.log("    list      Show installed and available skills");
  console.log("    update    Re-copy installed skills (pick up new versions)");
  console.log("    remove    Uninstall selected skills");
  console.log("");
  console.log("  Options:");
  console.log("    --all                Install/remove all skills");
  console.log("    --claude             Target Claude Code only");
  console.log("    --cursor             Target Cursor only");
  console.log("    --no-guardrails      Skip guardrail files");
  console.log("    --category <name>    Filter by category (repeatable)");
  console.log("    --dry-run            Preview without writing/deleting files");
  console.log("    --json               Machine-readable JSON output");
  console.log("    --save               Save selections to .skillvaultrc");
  console.log("");
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const flags = parseArgs(args);

  if (!flags.command || flags.command === "help" || flags.command === "--help" || flags.command === "-h") {
    printHelp();
    process.exit(0);
  }

  switch (flags.command) {
    case "init":
      await cmdInit(flags);
      break;
    case "list":
      await cmdList(flags);
      break;
    case "update":
      await cmdUpdate(flags);
      break;
    case "remove":
      await cmdRemove(flags);
      break;
    default:
      console.error(`  Unknown command: ${flags.command}. Run 'skillvault help' for usage.`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("  Error:", err.message);
  process.exit(1);
});
