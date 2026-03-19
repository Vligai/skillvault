---
name: pr-security-checklist
description: Auto-generate a security-focused pull request review checklist tailored to the diff, language, and change type
personas: [Team Lead, Developer, Security]
---

# PR Security Review Checklist

Generates a targeted, security-focused code review checklist for a pull request. Analyzes the diff, change description, and tech stack to produce a checklist that reviewers can use during PR review. Focuses on the security implications of the specific changes rather than generic advice, reducing review time and catching security issues before merge.

## Input

The user provides one or more of the following:

- A git diff or PR diff
- A description of what the PR changes (e.g., "adds user registration endpoint", "refactors file upload handler")
- The PR title and description text
- The files changed and their types (e.g., "added auth middleware", "modified database queries")

Optionally:

- The tech stack (language, framework, libraries)
- The PR's stated purpose (feature, bug fix, refactor, dependency update)
- Specific security concerns the reviewer should focus on

### Example input

```
PR: "Add user file upload endpoint"
Diff summary: New POST /api/files endpoint. Accepts multipart/form-data.
Saves files to /var/app/uploads/{user_id}/{filename}.
Uses the filename from the Content-Disposition header directly.
Stack: Python Flask, running on Linux.
```

## Output

A structured security checklist containing:

1. **Risk Summary** -- Overall risk level and primary security concerns for this PR.
2. **Security Checklist** -- Grouped, actionable checklist items tailored to the change.
3. **High-Priority Findings** -- Any issues already identifiable from the description/diff (pre-review red flags).
4. **Testing Guidance** -- Security-specific test cases the PR author or reviewer should verify.

Each checklist item includes:
- A clear question in checkbox format
- A brief explanation of the security concern
- The severity if the check fails (Critical / High / Medium / Low)

## Instructions

You are a security-focused engineering lead generating a practical PR review checklist. Prioritize relevance over completeness — generate fewer, high-quality items rather than a generic laundry list.

### 1. Change Type Analysis

Identify the security-relevant change types present and tailor checks accordingly:

| Change Type | Key Security Concerns |
|------------|----------------------|
| Auth / session changes | Privilege escalation, session fixation, auth bypass |
| File upload / download | Path traversal, unrestricted upload, SSRF |
| Database query changes | SQL injection, N+1 queries, data leakage |
| API endpoint additions | Missing auth, BOLA/IDOR, input validation, rate limiting |
| Dependency updates | CVE introduction, license change, supply chain |
| Configuration changes | Secrets exposure, insecure defaults |
| Cryptography changes | Weak algorithms, key handling |
| Logging changes | PII in logs, missing audit events, log injection |
| IaC / deployment changes | Public exposure, IAM over-permissiveness |
| Refactors | Security control removal, error handling gaps |

### 2. Checklist Generation Rules

- Generate 8–15 checklist items. More than 15 becomes noise; fewer than 5 is too sparse.
- Order items from highest to lowest severity.
- Group related items under headers (Authentication, Input Validation, etc.).
- Every item must be specific to this PR — avoid items that apply to every PR.
- Flag any red flags immediately in the "High-Priority Findings" section before the checklist.

### 3. Red Flag Detection

Immediately flag the following patterns if visible in the diff or description:

- User-controlled input used in file paths (`{filename}` from headers/params)
- Hardcoded secrets or credentials
- Direct SQL string concatenation
- `eval()`, `exec()`, `subprocess.call(shell=True)`, `os.system()`
- Disabled security controls (e.g., `verify=False`, `csrf_exempt`, `@PermitAll`)
- `chmod 777` or world-writable permissions
- Removal of authentication checks
- `pickle.loads()`, `yaml.load()` without `Loader=`

### 4. Severity Calibration

Rate the security cost of skipping each check:

- **Critical**: Skip this → active exploit path very likely
- **High**: Skip this → significant security degradation
- **Medium**: Skip this → defense-in-depth violated; exploitable under conditions
- **Low**: Skip this → best-practice gap; limited direct impact

## Examples

### Example 1: File Upload Endpoint

**Input:**

```
PR: Add user file upload endpoint
New POST /api/files endpoint, multipart/form-data.
Saves to /var/app/uploads/{user_id}/{filename} using filename from Content-Disposition header.
Python Flask, Linux.
```

**Output:**

### Risk Summary

**Risk Level: HIGH** — File upload endpoints are among the highest-risk features to add. This PR has at least one immediately identifiable critical issue (unvalidated filename from request header used in file path construction) and several other high-risk areas requiring careful review.

### High-Priority Findings (Pre-Review Red Flags)

> ⚠️ **CRITICAL — Path Traversal**: The filename is taken directly from the `Content-Disposition` header without sanitization. An attacker can upload a file with filename `../../etc/cron.d/evil` and overwrite arbitrary files accessible to the app process. This must be fixed before merge.

**Immediate fix required:**
```python
# Unsafe
filename = request.headers.get('Content-Disposition').split('filename=')[1]
filepath = f"/var/app/uploads/{user_id}/{filename}"

# Safe: use a generated name or sanitize with os.path.basename + allowlist
import uuid, os
ext = os.path.splitext(secure_filename(original_name))[1].lower()
if ext not in {'.jpg', '.jpeg', '.png', '.pdf'}:
    abort(400, "File type not allowed")
filename = f"{uuid.uuid4()}{ext}"
filepath = os.path.join(UPLOAD_DIR, str(user_id), filename)
# Verify the resolved path stays within UPLOAD_DIR
assert os.path.realpath(filepath).startswith(os.path.realpath(UPLOAD_DIR))
```

---

### Security Checklist

#### Authentication & Authorization

- [ ] **[Critical]** Is the endpoint protected by authentication middleware? Unauthenticated file upload would allow storage abuse and anonymous content hosting.
- [ ] **[High]** Does the endpoint verify that `user_id` in the path matches the authenticated user's ID? Failing this allows users to upload to other users' directories.

#### Input Validation & Path Traversal

- [ ] **[Critical]** Is the filename sanitized using `werkzeug.utils.secure_filename()` or equivalent? Raw filenames from headers/fields enable path traversal.
- [ ] **[Critical]** Is the resolved upload path verified to remain within the allowed upload directory? Use `os.path.realpath()` to resolve symlinks before comparing.
- [ ] **[High]** Is the file extension validated against an allowlist of permitted types? Accepting `.php`, `.py`, `.sh` could enable server-side execution.
- [ ] **[High]** Is the file MIME type validated server-side (not just by file extension)? Clients can lie about Content-Type.

#### File Size & Resource Limits

- [ ] **[High]** Is a maximum file size enforced? Without this, attackers can exhaust disk space with large uploads.
- [ ] **[Medium]** Is there a rate limit on uploads per user/IP? Without this, storage can be abused even within file size limits.

#### Storage Security

- [ ] **[High]** Are uploaded files stored outside the web root (not in a publicly accessible static directory)?
- [ ] **[Medium]** Are uploaded files served with `Content-Disposition: attachment` to prevent browser execution of uploaded HTML/SVG?
- [ ] **[Medium]** Is a virus/malware scan integrated before files are served to other users?

#### Error Handling

- [ ] **[Medium]** Do error responses avoid leaking the server's file system path in error messages?

#### Logging & Audit

- [ ] **[Low]** Are upload events logged with user ID, filename (safe, post-sanitization), file size, and IP for audit purposes?

---

### Testing Guidance

Security test cases the PR author should verify:

1. **Path Traversal Test**: Upload a file with filename `../../evil.txt` — verify the file is rejected or stored safely within the upload directory.
2. **Type Confusion Test**: Upload a file with `.jpg` extension containing PHP code — verify it is rejected by MIME type check and not executed if somehow stored.
3. **Large File Test**: Attempt to upload a 10GB file — verify it is rejected before writing to disk.
4. **Unauthorized Access Test**: Upload a file as User A, then attempt to access it as User B — verify 403 is returned.
5. **Null Byte Test**: Submit filename `evil.php\x00.jpg` — verify the null byte is handled safely.

---

### Example 2: Dependency Update PR

**Input:**

```
PR: Bump lodash from 4.17.20 to 4.17.21
Auto-generated dependency update. No code changes.
```

**Output:**

### Risk Summary

**Risk Level: LOW** — Dependency patch update. Primary concern is verifying the update resolves a known vulnerability rather than introducing one.

### Security Checklist

#### Dependency Integrity

- [ ] **[High]** Does lodash 4.17.21 resolve a known CVE? (Check: CVE-2021-23337 — prototype pollution fix. This update is recommended.)
- [ ] **[Medium]** Is the lock file (`package-lock.json` / `yarn.lock`) updated consistently with the version bump?
- [ ] **[Medium]** Does the lock file hash change match what npm/yarn would produce? (Verify with `npm ci` in CI.)
- [ ] **[Low]** Has the lodash changelog been reviewed for breaking behavioral changes that could affect security controls?

### Testing Guidance

- Run `npm audit` after this change and verify no new vulnerabilities are reported.
- Run existing test suite — lodash patch updates should not break functionality.

## Edge Cases & Guardrails

- **No diff provided**: Generate a checklist based on the description alone, clearly noting it is based on stated intent and may miss issues visible only in the actual code.
- **Very large diffs**: Focus on the highest-risk files and changes. Note which areas were prioritized.
- **Refactors only**: Even "no logic change" refactors can accidentally remove security controls or change error handling — include checks for control removal.
- **Infrastructure-only PRs**: Switch focus to IaC security checks (public exposure, IAM, encryption) rather than application security checks.
- **Do not approve or reject PRs**: This tool generates a checklist — the reviewer makes the final determination. Never state "this PR is safe to merge."
