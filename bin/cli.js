#!/usr/bin/env node

"use strict";

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
  getVersion,
  doctor,
} = require("../lib/installer");

const { parseArgs, hasPlatformFlags } = require("../lib/args");
const { createRL, ask, askPlatform, askSkills, askRemoveSkills, askGuardrails } = require("../lib/prompt");
const { banner, printSummary, printHelp } = require("../lib/reporter");

const CWD = process.cwd();

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

  let selectedPlatforms;
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
      const files = installPlatform(
        platform.key, selectedSkills, includeGuardrails, CWD, flags.flagDryRun, flags.flagForce
      );
      allCopied.push(...files);
    }
  }

  if (flags.flagSave && !flags.flagDryRun) {
    const activeKeys = PLATFORMS.filter((p) => selectedPlatforms[p.key]).map((p) => p.key);
    const cfg = {
      skills: selectedSkills.map((s) => s.slug),
      platform: activeKeys.length === 1 ? activeKeys[0] : activeKeys,
      includeGuardrails,
    };
    writeConfig(cfg, CWD);
    allCopied.push(".skillvaultrc");
  }

  if (flags.flagJson) {
    console.log(JSON.stringify({ command: "init", files: allCopied, dryRun: flags.flagDryRun }, null, 2));
    return;
  }

  printSummary(allCopied, flags, "Installed");
}

async function cmdUpdate(flags) {
  if (!flags.flagJson) banner();

  const skills = listSkills(CWD);

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
      console.log(JSON.stringify({ command: "update", files: [], dryRun: flags.flagDryRun, summary: { updated: 0, unchanged: 0, skipped: 0 } }, null, 2));
    } else {
      console.log("  No installed skills found. Run 'skillvault init' first.\n");
    }
    return;
  }

  const slugSet = new Set(installed.map((s) => s.slug));
  const selectedSkills = SKILLS.filter((s) => slugSet.has(s.slug));

  const allCopied = [];

  // Always pass includeGuardrails=true so stale guardrails are refreshed.
  if (hasPlatformFlags(flags)) {
    for (const platform of PLATFORMS) {
      if (flags.platforms[platform.key]) {
        const files = installPlatform(
          platform.key, selectedSkills, !flags.flagNoGuardrails, CWD, flags.flagDryRun, flags.flagForce
        );
        allCopied.push(...files);
      }
    }
  } else {
    const hasClaude = installed.some((s) => s.installedClaude);
    if (hasClaude) {
      const files = installPlatform(
        "claude", selectedSkills, !flags.flagNoGuardrails, CWD, flags.flagDryRun, flags.flagForce
      );
      allCopied.push(...files);
    }

    for (const platform of PLATFORMS) {
      if (platform.type === "claude-commands") continue;
      const hasSkills = installed.some((s) => s["installed_" + platform.key]);
      if (hasSkills) {
        const files = installPlatform(
          platform.key, selectedSkills, !flags.flagNoGuardrails, CWD, flags.flagDryRun, flags.flagForce
        );
        allCopied.push(...files);
      }
    }
  }

  if (flags.flagJson) {
    const skipped  = allCopied.filter((f) => f.includes("(modified — skipped)")).length;
    const unchanged = allCopied.filter((f) => f.includes("already up to date")).length;
    const updated  = allCopied.length - skipped - unchanged;
    console.log(JSON.stringify({
      command: "update", files: allCopied, dryRun: flags.flagDryRun,
      summary: { updated, unchanged, skipped },
    }, null, 2));
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
      console.log(JSON.stringify({ command: "remove", files: [], dryRun: flags.flagDryRun }, null, 2));
    } else {
      console.log("  No installed skills found.\n");
    }
    return;
  }

  let toRemove;
  if (flags.flagAll) {
    if (!flags.flagForce && process.stdin.isTTY) {
      const rl = createRL();
      try {
        const answer = await ask(rl, `  This will remove ${installed.length} installed skill(s). Are you sure? [y/N]: `);
        if (answer.trim().toLowerCase() !== "y" && answer.trim().toLowerCase() !== "yes") {
          console.log("  Aborted.\n");
          return;
        }
      } finally {
        rl.close();
      }
    }
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
    console.log(JSON.stringify({ command: "remove", files: removed, dryRun: flags.flagDryRun }, null, 2));
    return;
  }

  if (removed.length === 0) {
    console.log("  No files to remove.\n");
    return;
  }

  printSummary(removed, flags, "Removed");
}

async function cmdDoctor(flags) {
  const result = doctor(CWD);

  if (flags.flagJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  banner();
  console.log(`  Version: ${result.version}\n`);

  console.log("  Detected platforms:");
  for (const platform of PLATFORMS) {
    const info = result.platforms[platform.key];
    const status = info.detected ? "yes" : "no";
    const skills = info.skillCount > 0 ? `, ${info.skillCount} skills` : "";
    const guard = info.guardrails ? ", guardrails installed" : "";
    console.log(`    ${platform.name.padEnd(22)} ${status}${skills}${guard}`);
  }
  console.log("");

  console.log(`  Config (.skillvaultrc): ${result.config ? "found" : "not found"}`);
  if (result.config) {
    if (result.config.skills) console.log(`    skills: ${result.config.skills.join(", ")}`);
    if (result.config.platform) {
      const p = Array.isArray(result.config.platform) ? result.config.platform.join(", ") : result.config.platform;
      console.log(`    platform: ${p}`);
    }
  }
  console.log("");

  console.log(`  Total installed skills: ${result.totalInstalled}`);
  console.log("");
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const flags = parseArgs(args);

  if (flags.flagVersion) {
    console.log(getVersion());
    process.exit(0);
  }

  if (!flags.command || flags.command === "help" || flags.command === "--help" || flags.command === "-h") {
    printHelp();
    process.exit(0);
  }

  // U4: unknown flags are fatal — a warning is too easy to miss
  if (flags.unknownFlags.length > 0) {
    for (const flag of flags.unknownFlags) {
      process.stderr.write(`  Error: unknown flag '${flag}'\n`);
    }
    process.stderr.write("  Run 'skillvault --help' for usage.\n");
    process.exit(1);
  }

  switch (flags.command) {
    case "init":   await cmdInit(flags);   break;
    case "list":   await cmdList(flags);   break;
    case "update": await cmdUpdate(flags); break;
    case "remove": await cmdRemove(flags); break;
    case "doctor": await cmdDoctor(flags); break;
    default:
      console.error(`  Unknown command: ${flags.command}. Run 'skillvault --help' for usage.`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("  Error:", err.message);
  process.exit(1);
});
