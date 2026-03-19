"use strict";

const readline = require("readline");
const { PLATFORMS } = require("./installer");

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

    if (input === "a") { selected.fill(true); printSkills(); continue; }
    if (input === "n") { selected.fill(false); printSkills(); continue; }

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

    if (input === "") return installed.filter((_, i) => selected[i]);
    if (input === "a") { selected.fill(true); printSkills(); continue; }
    if (input === "n") { selected.fill(false); printSkills(); continue; }

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

module.exports = { createRL, ask, askPlatform, askSkills, askRemoveSkills, askGuardrails };
