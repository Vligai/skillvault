"use strict";

const { PLATFORMS } = require("./installer");

function banner() {
  console.log("");
  console.log("  SkillVault — Security skills for AI agents");
  console.log("  ───────────────────────────────────────────");
  console.log("");
}

function prefix(flags) {
  return flags.flagDryRun ? "[dry-run] " : "";
}

/**
 * Prints a summary of files installed/updated/removed.
 * U2: For "Updated", always shows a count breakdown (updated / unchanged / skipped).
 */
function printSummary(files, flags, verb) {
  const p = prefix(flags);
  console.log("");
  console.log(`  ${p}${verb}:\n`);

  for (const f of files) {
    const symbol = verb === "Removed" ? "-" : "+";
    console.log(`    ${symbol} ${f}`);
  }
  console.log("");

  if (verb === "Updated") {
    const skipped  = files.filter((f) => f.includes("(modified — skipped)")).length;
    const unchanged = files.filter((f) => f.includes("already up to date")).length;
    const updated  = files.length - skipped - unchanged;
    const skipNote = skipped > 0 ? `, ${skipped} skipped (use --force to overwrite)` : "";
    console.log(`  ${updated} updated, ${unchanged} already up to date${skipNote}.`);
    console.log("");
  }

  if (!flags.flagDryRun) {
    console.log("  Done! Your AI agent now has security superpowers.");
  } else {
    console.log("  Dry run complete — no files were modified.");
  }
  console.log("");
}

function printHelp() {
  banner();
  console.log("  Usage: skillvault <command> [options]\n");
  console.log("  Commands:");
  console.log("    init      Install skills into your project");
  console.log("    list      Show installed and available skills");
  console.log("    update    Re-copy installed skills (pick up new versions)");
  console.log("    remove    Uninstall selected skills");
  console.log("    doctor    Show diagnostic overview");
  console.log("");
  console.log("  Platform flags (any combination):");
  for (const p of PLATFORMS) {
    console.log(`    --${p.flag.padEnd(16)} Target ${p.name}`);
  }
  console.log(`    --platform <list>   Comma-separated platform keys (e.g. claude,cursor)`);
  console.log("");
  console.log("  Options:");
  console.log("    --all                Install/remove all skills");
  console.log("    --force              Skip confirmation prompts; overwrite modified files");
  console.log("    --no-guardrails      Skip guardrail files");
  console.log("    --category <name>    Filter by category (repeatable)");
  console.log("    --dry-run            Preview without writing/deleting files");
  console.log("    --json               Machine-readable JSON output");
  console.log("    --save               Save selections to .skillvaultrc");
  console.log("    --version, -v        Show version number");
  console.log("");
}

module.exports = { banner, prefix, printSummary, printHelp };
