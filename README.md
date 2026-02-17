# SkillVault

[![CI](https://github.com/Vligai/skillvault/actions/workflows/ci.yml/badge.svg)](https://github.com/Vligai/skillvault/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node 18+](https://img.shields.io/badge/node-18+-blue.svg)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](package.json)

*Security skills for AI coding agents.*

A collection of security skills for AI coding agents: Claude Code, Cursor, Copilot, Windsurf, Cline, Codex, and other major platforms. These skills guide agents to follow secure coding practices, prevent common vulnerabilities (OWASP Top 10), and avoid security anti-patterns.

---

## Installation

The fastest way to add security skills to your project:

```bash
npx skillvault init
```

This will detect your platform (Claude Code, Cursor, Windsurf, Copilot, Cline, and 9 more), let you pick which skills to install, and copy the files into your project.

### Commands

```bash
npx skillvault init       # Install skills (interactive)
npx skillvault list       # Show installed and available skills
npx skillvault update     # Re-copy installed skills (pick up new versions)
npx skillvault remove     # Uninstall selected skills
npx skillvault doctor     # Show diagnostic overview
npx skillvault --version  # Print version number
```

### Options

```bash
npx skillvault init --all              # Install everything, no prompts
npx skillvault init --claude           # Target Claude Code only
npx skillvault init --cursor           # Target Cursor only
npx skillvault init --windsurf         # Target Windsurf only
npx skillvault init --copilot          # Target GitHub Copilot only
npx skillvault init --cline            # Target Cline only
npx skillvault init --codex            # Target Codex CLI only
npx skillvault init --no-guardrails    # Skip guardrail files
npx skillvault init --category developer  # Filter by category (repeatable)
npx skillvault init --dry-run          # Preview without writing files
npx skillvault init --json             # Machine-readable JSON output
npx skillvault init --save             # Save selections to .skillvaultrc
npx skillvault remove --all            # Remove all installed skills
npx skillvault update --category security # Update only security skills
npx skillvault doctor                  # Diagnostic overview
npx skillvault doctor --json           # Machine-readable diagnostics
```

### `.skillvaultrc` config

Save your selections with `--save` so `skillvault init` is reproducible across team members:

```json
{
  "skills": ["review", "scan-secrets"],
  "platform": "claude",
  "includeGuardrails": true
}
```

### Manual installation

Clone the repo and copy the files you need:

```bash
git clone https://github.com/Vligai/skillvault.git
cp -r skillvault/.claude/commands/ your-project/.claude/commands/
cp skillvault/Claude.md your-project/CLAUDE.md
```

---

## Security Guardrails

All platforms share a single guardrail source ([guardrails.md](guardrails.md)). The CLI injects the platform name and copies it to the right location. Claude uses its own format ([Claude.md](Claude.md)) for `CLAUDE.md` append behavior.

Run `npx skillvault init` to install guardrails automatically, or copy manually:

| Platform | Target location |
|----------|----------------|
| **Claude** | Appended to `CLAUDE.md` |
| **Cursor** | `.cursor/rules/security-guardrails.md` |
| **Windsurf** | `.windsurf/rules/security-guardrails.md` |
| **GitHub Copilot** | Appended to `.github/copilot-instructions.md` |
| **Cline** | `.cline/rules/security-guardrails.md` |
| **Roo Code** | `.roo/rules/security-guardrails.md` |
| **Continue** | `.continue/rules/security-guardrails.md` |
| **Codex CLI** | Appended to `AGENTS.md` |
| **Amazon Q** | `.q/rules/security-guardrails.md` |
| **Sourcegraph Cody** | `.cody/rules/security-guardrails.md` |
| **JetBrains AI** | `.junie/guidelines/security-guardrails.md` |
| **Tabnine** | `.tabnine/rules/security-guardrails.md` |
| **Aider** | `.aider/rules/security-guardrails.md` |
| **Augment Code** | Appended to `augment-guidelines.md` |

---

## Skills

Specialized security skill prompts organized by persona. Each skill is a standalone system prompt with structured I/O, detailed instructions, and worked examples.

### Developer Skills

| Skill | Description | File |
|-------|-------------|------|
| **Code Security Reviewer** | Scan code for OWASP Top 10 vulnerabilities, secrets, and insecure patterns | [code-security-reviewer.md](skills/claude/developer/code-security-reviewer.md) |
| **Secret Scanner** | Detect hardcoded secrets, API keys, and credentials in code and config | [secret-scanner.md](skills/claude/developer/secret-scanner.md) |
| **Dependency Auditor** | Audit dependency manifests for known vulnerabilities and suggest upgrades | [dependency-auditor.md](skills/claude/developer/dependency-auditor.md) |
| **Input Validation Generator** | Generate validation schemas and sanitization logic for endpoints and forms | [input-validation-generator.md](skills/claude/developer/input-validation-generator.md) |
| **CI/CD Security Hardener** | Review pipeline configs for secret leaks, injection risks, and excessive permissions | [cicd-security-hardener.md](skills/claude/developer/cicd-security-hardener.md) |

### Security Skills

| Skill | Description | File |
|-------|-------------|------|
| **Threat Model Generator** | Produce structured threat models (STRIDE) from architecture descriptions | [threat-model-generator.md](skills/claude/security/threat-model-generator.md) |
| **Incident Response Playbook Builder** | Generate IR runbooks for specific incident scenarios | [incident-response-playbook-builder.md](skills/claude/security/incident-response-playbook-builder.md) |
| **Hardening Checklist Generator** | Produce CIS-benchmark-style hardening checklists for OS/service/cloud configs | [hardening-checklist-generator.md](skills/claude/security/hardening-checklist-generator.md) |

### Cloud / Infrastructure Skills

| Skill | Description | File |
|-------|-------------|------|
| **IAM Policy Analyzer** | Review AWS/GCP/Azure IAM policies for over-permissive access | [iam-policy-analyzer.md](skills/claude/cloud/iam-policy-analyzer.md) |

### User Skills

| Skill | Description | File |
|-------|-------------|------|
| **Phishing Email Analyzer** | Analyze suspicious emails for phishing indicators and recommend actions | [phishing-email-analyzer.md](skills/claude/user/phishing-email-analyzer.md) |

---

## Testing

Tests use the Node.js built-in test runner (`node:test` + `node:assert`) — zero dependencies required.

```bash
npm test
```

Tests run automatically on every push and PR via GitHub Actions across Node 18, 20, and 22.

---

## Project Structure

```
skillvault/
├── guardrails.md              # Single guardrail template (all platforms)
├── Claude.md                  # Claude-specific guardrails (CLAUDE.md append)
├── bin/cli.js                 # CLI entry point
├── lib/installer.js           # Core install logic (testable)
├── test/cli.test.js           # Unit tests
├── .github/workflows/ci.yml   # CI pipeline
├── ideation.md                # Roadmap and planned skills by persona
├── README.md
└── skills/
    └── claude/
        ├── developer/         # Developer-focused skills
        ├── security/          # Security professional skills
        ├── cloud/             # Cloud/infrastructure skills
        └── user/              # Non-technical user skills
```

See [ideation.md](ideation.md) for the full skill ideation map with 40+ planned skills across 5 personas.

---

## Roadmap

### More Platforms

SkillVault supports 14 platforms with auto-detection:

| Platform | Config location | Status |
|----------|----------------|--------|
| **Claude Code** | `.claude/commands/` + `CLAUDE.md` | Shipped |
| **Cursor** | `.cursor/rules/` | Shipped |
| **Windsurf** | `.windsurf/rules/` | Shipped |
| **GitHub Copilot** | `.github/copilot/skills/` + `.github/copilot-instructions.md` | Shipped |
| **Cline** | `.cline/rules/` | Shipped |
| **Roo Code** | `.roo/rules/` | Shipped |
| **Continue** | `.continue/rules/` | Shipped |
| **Codex CLI** | `codex-skills/` + `AGENTS.md` | Shipped |
| **Amazon Q Developer** | `.q/rules/` | Shipped |
| **Sourcegraph Cody** | `.cody/rules/` | Shipped |
| **JetBrains AI** | `.junie/guidelines/` | Shipped |
| **Tabnine** | `.tabnine/rules/` | Shipped |
| **Aider** | `.aider/rules/` | Shipped |
| **Augment Code** | `augment-skills/` + `augment-guidelines.md` | Shipped |

Auto-detection is built in — `skillvault init` detects any of these and offers the right installer.

### CLI Improvements

| Feature | Description | Status |
|---------|-------------|--------|
| `skillvault list` | Show installed and available skills | Shipped |
| `skillvault update` | Re-copy skills to pick up new versions | Shipped |
| `skillvault remove` | Uninstall selected skills cleanly | Shipped |
| `--category <name>` | Filter by category (repeatable) | Shipped |
| `.skillvaultrc` config | Project-level config for reproducible installs | Shipped |
| `--dry-run` | Preview without writing files | Shipped |
| `--json` | Machine-readable output for CI/scripting | Shipped |
| `--version` / `-v` | Print version number | Shipped |
| `skillvault doctor` | Diagnostic overview (platforms, config, skills) | Shipped |
| Unknown flag warnings | Warn on stderr for unrecognized flags | Shipped |

### Community & Ecosystem

| Feature | Description |
|---------|-------------|
| **Skill authoring template** | `skillvault create-skill` scaffolds a new skill with the standard sections (Input, Output, Instructions, Examples, Edge Cases) |
| **Custom skill directories** | Point to a local folder or git repo of custom skills via `.skillvaultrc` |
| **Composable skill packs** | Publish themed skill bundles as npm packages (`@skillvault/devsecops`, `@skillvault/cloud`) that plug into the CLI |
| **Severity profiles** | `--profile strict` vs `--profile standard` — strict adds extra guardrails, blocks more patterns |
| **Team sharing** | `skillvault export` / `skillvault import` to share curated skill sets as portable JSON configs |

### Next Skills (from [ideation.md](ideation.md))

| Skill | Persona | Priority |
|-------|---------|----------|
| Auth Flow Scaffolder | Developer | High |
| Dockerfile Security Linter | Developer | High |
| Detection Rule Generator (Sigma/SPL/KQL) | Security | High |
| IaC Scanner (Terraform/CloudFormation) | Cloud | High |
| SBOM Generator | Developer | Medium |
| CVE Analyzer | Security | Medium |
| Secure API Design Reviewer | Developer | Medium |
| PR Security Review Checklist | Team Lead | Medium |

---

## Contributing

Contributions welcome. Keep skills concise, actionable, and platform-appropriate. Each skill should follow the [standard template](ideation.md#prioritized-top-10-skills) with Input, Output, Instructions, Examples, and Edge Cases sections.

---

## License

[MIT](LICENSE)
