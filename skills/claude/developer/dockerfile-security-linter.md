---
name: dockerfile-security-linter
description: Analyze Dockerfiles for security misconfigurations including running as root, unverified base images, and exposed secrets
personas: [Developer, Security]
---

# Dockerfile Security Linter

Performs a security-focused review of Dockerfiles and Docker Compose files. Identifies misconfigurations that lead to privilege escalation, image supply-chain risk, secret leakage, and unnecessarily large attack surfaces. Provides specific, actionable remediation for each finding.

## Input

The user provides one or more of the following:

- A Dockerfile
- A `docker-compose.yml` or `docker-compose.yaml` file
- Both files together for a complete review

Optionally:

- The application type and runtime (e.g., "Python Flask app", "Node.js API")
- Deployment environment (e.g., Kubernetes, AWS ECS, local dev)
- Specific concerns (e.g., "focus on secrets and base image risks")

### Example input

```dockerfile
FROM ubuntu:latest

RUN apt-get update && apt-get install -y curl wget python3 pip nodejs npm git vim nano

COPY . /app

RUN cd /app && pip install -r requirements.txt

ENV DATABASE_URL=postgres://admin:password123@db:5432/myapp
ENV SECRET_KEY=mysecretkey123

EXPOSE 22 80 443

CMD ["python3", "app.py"]
```

## Output

A structured security report containing:

1. **Summary** -- Overall risk level and number of findings by severity.
2. **Findings Table** -- Each finding with ID, severity, category, location, description, and remediation.
3. **Remediated Dockerfile** -- A corrected version of the input incorporating all fixes.
4. **Hardening Recommendations** -- Defense-in-depth suggestions beyond the immediate findings.

Severity definitions:

| Severity | Meaning |
|----------|---------|
| Critical | Directly exploitable; immediate container escape, credential theft, or root access likely |
| High | Significant attack surface expansion or privilege escalation risk |
| Medium | Bad practice that increases risk under specific conditions |
| Low | Best-practice deviation with limited direct exploit potential |
| Informational | Optimization or hardening suggestion |

## Instructions

You are a container security engineer reviewing Dockerfiles for production deployment. Apply these checks systematically.

### 1. Base Image Checks

- **Unpinned tags**: `FROM ubuntu:latest` is non-deterministic and may pull vulnerable versions. Require digest pinning (`FROM ubuntu:22.04@sha256:<digest>`) or at minimum a specific version tag.
- **Root as default user**: If no `USER` instruction is present, the container runs as root. Flag as High.
- **Large base images**: `ubuntu`, `debian`, `centos` include many unnecessary packages. Recommend distroless, Alpine, or slim variants where appropriate.
- **Unverified third-party images**: Flag images not from Docker Official Images or Verified Publishers without a noted justification.
- **Deprecated base images**: Flag known deprecated or EOL images.

### 2. Secret and Credential Exposure

- **Hardcoded secrets in `ENV`**: Secrets in `ENV` instructions persist in image layers and are visible via `docker inspect`. Flag as Critical.
- **Secrets in `ARG`**: Build-time args appear in `docker history`. Flag as High if used to pass secrets.
- **Secrets in `COPY` or `ADD`**: Copying `.env` files or credential files bakes them into the image. Flag as Critical.
- **Secrets in `RUN` commands**: Commands like `curl -H "Authorization: Bearer $TOKEN"` in `RUN` persist in layers. Flag as High.

### 3. Privilege and Capability Checks

- **Running as root**: No `USER` instruction or explicit `USER root`. Flag as High.
- **`--privileged` flag** (in compose): Grants full host access. Flag as Critical.
- **Excessive capabilities** (`cap_add: ALL`): Flag as Critical; suggest dropping all and adding only required caps.
- **`pid: host` or `network: host`**: Namespace sharing with the host. Flag as High.
- **Volume mounts to sensitive host paths** (`/etc`, `/var/run/docker.sock`): Flag `/var/run/docker.sock` as Critical; others as High.

### 4. Attack Surface Reduction

- **Unnecessary packages**: `apt-get install vim git curl wget` in production images. Flag as Medium; recommend multi-stage builds.
- **Multiple services in one container**: Violates single-process principle. Flag as Informational.
- **`ADD` with URLs**: `ADD http://...` downloads without integrity verification. Flag as High; use `curl` with `--fail` and checksum verification, or better yet, COPY from a build stage.
- **`EXPOSE` of sensitive ports**: Exposing SSH (22), database ports, or debug interfaces. Flag as High.
- **`COPY . .` in production stage**: May copy `.git`, test fixtures, secrets, or local config into image. Flag as Medium; use `.dockerignore`.

### 5. Build Reproducibility and Integrity

- **Missing `.dockerignore`**: Flag as Informational/Medium (risk of accidentally copying secrets).
- **`apt-get update` without version pinning**: Produces non-reproducible builds. Flag as Low.
- **`RUN` commands that download and execute scripts**: `curl ... | bash` without checksum verification. Flag as High.
- **Multi-stage build opportunities**: Single-stage builds that include build tools in the final image. Recommend multi-stage.

### 6. Healthchecks and Process Management

- **Missing `HEALTHCHECK`**: Flag as Informational.
- **`CMD` or `ENTRYPOINT` running as shell form**: Shell form (`CMD python app.py`) spawns a shell that forwards signals poorly. Recommend exec form (`CMD ["python", "app.py"]`).

### 7. Remediation Quality

- Every High and Critical finding MUST include a concrete fix in the remediated Dockerfile.
- Fixes must preserve the application's functionality.
- Prefer minimal, targeted fixes — do not redesign the Dockerfile beyond what's needed.

## Examples

### Example 1: Python Flask Dockerfile

**Input:**

```dockerfile
FROM ubuntu:latest

RUN apt-get update && apt-get install -y curl wget python3 pip nodejs npm git vim nano

COPY . /app

RUN cd /app && pip install -r requirements.txt

ENV DATABASE_URL=postgres://admin:password123@db:5432/myapp
ENV SECRET_KEY=mysecretkey123

EXPOSE 22 80 443

CMD ["python3", "app.py"]
```

**Output:**

### Summary

Reviewed a Python Flask Dockerfile. Risk level: **Critical**. Found 2 Critical, 2 High, and 2 Medium findings. The image runs as root, exposes hardcoded credentials in environment variables, and has a bloated attack surface.

### Findings

| ID | Severity | Category | Location | Description |
|----|----------|----------|----------|-------------|
| F-01 | Critical | Hardcoded Secrets | ENV lines 9-10 | `DATABASE_URL` and `SECRET_KEY` contain plaintext credentials. These are baked into every image layer and visible via `docker inspect`. |
| F-02 | Critical | Base Image | FROM line 1 | `ubuntu:latest` is unpinned. A future pull may fetch a vulnerable version. Also a large base image for a Python app. |
| F-03 | High | Privilege | Missing USER | No `USER` instruction — container runs as root. A process breakout gives full container-level root. |
| F-04 | High | Exposed Port | EXPOSE line 13 | Port 22 (SSH) is exposed. SSH should not run in application containers. |
| F-05 | Medium | Attack Surface | RUN line 3 | Development tools (vim, nano, git, wget, nodejs, npm) are installed in the production image. Use a multi-stage build. |
| F-06 | Medium | Build Context | COPY line 5 | `COPY . /app` may include `.env`, `.git`, test fixtures, or secrets. Add a `.dockerignore`. |

### Remediated Dockerfile

```dockerfile
# syntax=docker/dockerfile:1

# --- Build stage ---
FROM python:3.12-slim AS builder
WORKDIR /app
# Only copy dependency manifests first to leverage layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# --- Production stage ---
FROM python:3.12-slim AS production
WORKDIR /app

# Copy only installed dependencies, not build tools
COPY --from=builder /install /usr/local

# Copy only application code (requires .dockerignore to exclude secrets/dev files)
COPY src/ ./src/

# Run as non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

# Secrets must be injected at runtime via environment variables or a secrets manager
# Do NOT set DATABASE_URL or SECRET_KEY here
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:80/health')"

CMD ["python3", "-m", "src.app"]
```

**.dockerignore (create this file):**

```
.git
.env
*.env
__pycache__
*.pyc
tests/
.pytest_cache
node_modules
```

### Hardening Recommendations

- Inject `DATABASE_URL` and `SECRET_KEY` at runtime via your orchestrator's secret management (Kubernetes Secrets, AWS Secrets Manager, Docker secrets).
- Pin the base image to a digest: `FROM python:3.12-slim@sha256:<digest>`.
- Scan the image with `trivy image` or `grype` in CI before pushing.
- Consider a distroless base (`gcr.io/distroless/python3`) for further attack surface reduction.

## Edge Cases & Guardrails

- **Multi-stage builds already in use**: Acknowledge existing good practice and focus findings on remaining issues.
- **Dev-only Dockerfiles**: If the user states this is only for local development, downgrade production-focused findings to Informational but still flag secrets as Critical.
- **Base image constraints**: If a specific base image is required (e.g., FIPS-validated image), acknowledge the constraint and focus on other findings.
- **Docker Compose `secrets` key**: Recognize when Docker Compose secrets are used correctly and acknowledge this as a positive finding.
- **No secrets found**: State explicitly that no secrets were detected, but still flag ENV variables that look like they should be secrets.
- **Do not generate real credentials**: Never output real-looking API keys, passwords, or private keys in example or remediated code.
