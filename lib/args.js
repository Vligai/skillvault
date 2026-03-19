"use strict";

const { PLATFORMS } = require("./installer");

/**
 * Parses process.argv-style args into a structured flags object.
 * U3: --platform <key1,key2> sets multiple platforms in one flag.
 */
function parseArgs(args) {
  const result = {
    command: null,
    flagAll: false,
    flagNoGuardrails: false,
    flagDryRun: false,
    flagJson: false,
    flagSave: false,
    flagVersion: false,
    flagForce: false,
    categories: [],
    platforms: {}, // e.g. { claude: true, cursor: true }
    unknownFlags: [],
  };

  for (const p of PLATFORMS) {
    result.platforms[p.key] = false;
  }

  let i = 0;
  if (args.length > 0 && !args[0].startsWith("-")) {
    result.command = args[0];
    i = 1;
  }

  const platformFlags = new Set(PLATFORMS.map((p) => `--${p.flag}`));
  const validPlatformKeys = new Set(PLATFORMS.map((p) => p.key));
  const knownFlags = new Set([
    "--all", "--no-guardrails", "--dry-run", "--json", "--save",
    "--category", "--platform", "--version", "-v", "--help", "-h", "--force",
    ...platformFlags,
  ]);

  while (i < args.length) {
    const arg = args[i];

    if (arg === "--all") result.flagAll = true;
    else if (arg === "--no-guardrails") result.flagNoGuardrails = true;
    else if (arg === "--dry-run") result.flagDryRun = true;
    else if (arg === "--json") result.flagJson = true;
    else if (arg === "--save") result.flagSave = true;
    else if (arg === "--version" || arg === "-v") result.flagVersion = true;
    else if (arg === "--force") result.flagForce = true;
    else if (arg === "--category" && i + 1 < args.length) {
      i++;
      result.categories.push(args[i]);
    } else if (arg === "--platform" && i + 1 < args.length) {
      // U3: comma-separated platform keys, e.g. --platform claude,cursor
      i++;
      const keys = args[i].split(",").map((k) => k.trim().toLowerCase());
      for (const key of keys) {
        if (validPlatformKeys.has(key)) {
          result.platforms[key] = true;
        } else {
          result.unknownFlags.push(`--platform ${key}`);
        }
      }
    } else if (platformFlags.has(arg)) {
      const flag = arg.slice(2); // strip --
      const platform = PLATFORMS.find((p) => p.flag === flag);
      if (platform) result.platforms[platform.key] = true;
    } else if (arg.startsWith("-") && !knownFlags.has(arg)) {
      result.unknownFlags.push(arg);
    }

    i++;
  }

  return result;
}

function hasPlatformFlags(flags) {
  return Object.values(flags.platforms).some(Boolean);
}

function getSelectedPlatformKeys(flags) {
  return Object.entries(flags.platforms).filter(([, v]) => v).map(([k]) => k);
}

module.exports = { parseArgs, hasPlatformFlags, getSelectedPlatformKeys };
