#!/usr/bin/env node

"use strict";

const readline = require("readline");
const {
  SKILLS,
  PLATFORMS,
  detectPlatforms,
  filterByCategory,
  listSkills,
  removeSkills,
  readConfig,
  writeConfig,
  installPlatform,
} = require("../lib/installer");

const CWD = process.cwd();

// ── Arg Parsing ──────────────────────────────────────────────────────────────

function parseArgs(args) {
  const result = {
    command: null,
    flagAll: false,
    flagNoGuardrails: false,
    flagDryRun: false,
    flagJson: false,
    flagSave: false,
    categories: [],
    platforms: {}, // e.g. { claude: true, cursor: true }
  };

  // Initialize all platform flags to false
  for (const p of PLATFORMS) {
    result.platforms[p.key] = false;
  }

  let i = 0;
  if (args.length > 0 && !args[0].startsWith("-")) {
    result.command = args[0];
    i = 1;
  }

  const platformFlags = new Set(PLATFORMS.map((p) => `--${p.flag}`));

  while (i < args.length) {
    const arg = args[i];
    if (arg === "--all") result.flagAll = true;
    else if (arg === "--no-guardrails") result.flagNoGuardrails = true;
    else if (arg === "--dry-run") result.flagDryRun = true;
    else if (arg === "--json") result.flagJson = true;
    else if (arg === "--save") result.flagSave = true;
    else if (arg === "--category" && i + 1 < args.length) {
      i++;
      result.categories.push(args[i]);
    } else if (platformFlags.has(arg)) {
      const flag = arg.slice(2); // remove --
      const platform = PLATFORMS.find((p) => p.flag === flag);
      if (platform) result.platforms[platform.key] = true;
    }
    i++;
  }

  return result;
}

// Backward-compatible helpers
function hasPlatformFlags(flags) {
  return Object.values(flags.platforms).some(Boolean);
}

function getSelectedPlatformKeys(flags) {
  return Object.entries(flags.platforms).filter(([, v]) => v).map(([k]) => k);
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
  console.log("  No platform detected.\n");
  console.log("  Which platform are you using?\n");

  for (let i = 0; i < PLATFORMS.length; i++) {
    const num = String(i + 1).padStart(2, " ");
    console.log(`   ${num}) ${PLATFORMS[i].name}`);
  }
  console.log("");
  console.log("  Enter one or more numbers separated by commas (e.g. 1,2):");
  console.log("");

  while (true) {
    const answer = await ask(rl, "  Choice: ");
    const parts = answer.trim().split(",").map((s) => s.trim());
    const keys = [];
    let valid = true;

    for (const part of parts) {
      const n = parseInt(part, 10);
      if (n >= 1 && n <= PLATFORMS.length) {
        keys.push(PLATFORMS[n - 1].key);
      } else {
        valid = false;
        break;
      }
    }

    if (valid && keys.length > 0) {
      const result = {};
      for (const p of PLATFORMS) result[p.key] = false;
      for (const k of keys) result[k] = true;
      return result;
    }
    console.log(`  Please enter numbers 1-${PLATFORMS.length} separated by commas.`);
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
  const answer = await ask(rl, "  Include security guardrails? [Y/n]: ");
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
      const platforms = [];
      if (s.installedClaude) platforms.push("claude");
      for (const p of PLATFORMS) {
        if (p.type === "claude-commands") continue;
        if (s["installed_" + p.key]) platforms.push(p.key);
      }
      const installed = platforms.length > 0;
      const status = installed ? "[installed]" : "[available]";
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

  let selectedPlatforms; // object: { claude: true, cursor: false, ... }
  let selectedSkills;
  let includeGuardrails;

  if (hasPlatformFlags(flags)) {
    selectedPlatforms = { ...flags.platforms };
  } else if (config && config.platform) {
    selectedPlatforms = {};
    for (const p of PLATFORMS) selectedPlatforms[p.key] = false;

    if (config.platform === "both") {
      selectedPlatforms.claude = true;
      selectedPlatforms.cursor = true;
    } else if (Array.isArray(config.platform)) {
      for (const k of config.platform) selectedPlatforms[k] = true;
    } else {
      selectedPlatforms[config.platform] = true;
    }

    if (!flags.flagJson) {
      const names = PLATFORMS.filter((p) => selectedPlatforms[p.key]).map((p) => p.name).join(" + ");
      console.log(`  Platform from config: ${names}\n`);
    }
  } else {
    const detected = detectPlatforms(CWD);
    const anyDetected = Object.values(detected).some(Boolean);
    if (anyDetected) {
      selectedPlatforms = detected;
      if (!flags.flagJson) {
        const names = PLATFORMS.filter((p) => detected[p.key]).map((p) => p.name).join(" + ");
        console.log(`  Detected platform: ${names}\n`);
      }
    } else {
      selectedPlatforms = null;
    }
  }

  if (flags.flagAll) {
    selectedSkills = availableSkills;
    includeGuardrails = !flags.flagNoGuardrails;
    if (!selectedPlatforms) {
      selectedPlatforms = {};
      for (const p of PLATFORMS) selectedPlatforms[p.key] = false;
      selectedPlatforms.claude = true;
      if (!flags.flagJson) console.log("  No platform detected — defaulting to Claude Code with --all.\n");
    }
  } else if (config && config.skills && !flags.categories.length) {
    const slugSet = new Set(config.skills);
    selectedSkills = availableSkills.filter((s) => slugSet.has(s.slug));
    includeGuardrails = flags.flagNoGuardrails ? false : (config.includeGuardrails !== false);
    if (!selectedPlatforms) {
      selectedPlatforms = {};
      for (const p of PLATFORMS) selectedPlatforms[p.key] = false;
      selectedPlatforms.claude = true;
    }
  } else {
    const rl = createRL();
    try {
      if (!selectedPlatforms) {
        selectedPlatforms = await askPlatform(rl);
        console.log("");
      }
      selectedSkills = await askSkills(rl, availableSkills);
      includeGuardrails = flags.flagNoGuardrails ? false : await askGuardrails(rl);
    } finally {
      rl.close();
    }
  }

  const allCopied = [];

  for (const platform of PLATFORMS) {
    if (selectedPlatforms[platform.key]) {
      const files = installPlatform(platform.key, selectedSkills, includeGuardrails, CWD, flags.flagDryRun);
      allCopied.push(...files);
    }
  }

  if (flags.flagSave && !flags.flagDryRun) {
    const activeKeys = PLATFORMS.filter((p) => selectedPlatforms[p.key]).map((p) => p.key);
    const cfg = {
      skills: selectedSkills.map((s) => s.slug),
      platform: activeKeys.length === 1 ? activeKeys[0] : activeKeys,
      includeGuardrails: includeGuardrails,
    };
    writeConfig(cfg, CWD);
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

  // A skill is installed if it's on any platform
  let installed = skills.filter((s) => {
    if (s.installedClaude) return true;
    for (const p of PLATFORMS) {
      if (p.type === "claude-commands") continue;
      if (s["installed_" + p.key]) return true;
    }
    return false;
  });

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

  const slugSet = new Set(installed.map((s) => s.slug));
  const selectedSkills = SKILLS.filter((s) => slugSet.has(s.slug));

  const allCopied = [];

  // Determine which platforms to update
  if (hasPlatformFlags(flags)) {
    // Only update the platforms explicitly specified
    for (const platform of PLATFORMS) {
      if (flags.platforms[platform.key]) {
        const files = installPlatform(platform.key, selectedSkills, false, CWD, flags.flagDryRun);
        allCopied.push(...files);
      }
    }
  } else {
    // Update all platforms where skills are installed
    const hasClaude = installed.some((s) => s.installedClaude);
    if (hasClaude) {
      const files = installPlatform("claude", selectedSkills, false, CWD, flags.flagDryRun);
      allCopied.push(...files);
    }

    for (const platform of PLATFORMS) {
      if (platform.type === "claude-commands") continue;
      const hasSkills = installed.some((s) => s["installed_" + platform.key]);
      if (hasSkills) {
        const files = installPlatform(platform.key, selectedSkills, false, CWD, flags.flagDryRun);
        allCopied.push(...files);
      }
    }
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
  const installed = skills.filter((s) => {
    if (s.installedClaude) return true;
    for (const p of PLATFORMS) {
      if (p.type === "claude-commands") continue;
      if (s["installed_" + p.key]) return true;
    }
    return false;
  });

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
  console.log("  Platform flags:");
  for (const p of PLATFORMS) {
    console.log(`    --${p.flag.padEnd(16)} Target ${p.name}`);
  }
  console.log("");
  console.log("  Options:");
  console.log("    --all                Install/remove all skills");
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
