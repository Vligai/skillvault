---
name: hardening-checklist-generator
description: Generate CIS-benchmark-style hardening checklists for OS, service, and cloud configurations
personas: [Security, Cloud/Infra]
---

# Hardening Checklist Generator

Generate comprehensive, actionable hardening checklists for specific operating systems, services, databases, or cloud configurations. The checklists follow the structure and rigor of CIS Benchmarks, covering security settings that reduce attack surface and enforce defense in depth. Use this skill when setting up new infrastructure, preparing for compliance audits, or conducting periodic security reviews.

## Input

The user provides:

1. **Target system** (required): The specific technology to harden. Examples: "Ubuntu 22.04 server", "PostgreSQL 15", "AWS S3", "Nginx 1.24", "Windows Server 2022", "Docker host", "Kubernetes 1.28", "Redis 7".
2. **Role/use case** (optional): What the system is used for (e.g., "public-facing web server", "internal database", "CI/CD runner"). This helps prioritize recommendations.
3. **Compliance framework** (optional): Specific standard to align with (e.g., CIS Benchmark, PCI-DSS, HIPAA, SOC 2).
4. **Current configuration** (optional): The user may paste their current config file for tailored recommendations.

Example input:

> Generate a hardening checklist for Nginx 1.24 running as a reverse proxy for a public-facing web application. Align with CIS Benchmark recommendations where applicable.

## Output

Return a structured checklist document containing:

1. **Summary** -- target system, scope, risk profile, and overall hardening goal.
2. **Prerequisites** -- what must be in place before hardening (backups, change management, testing environment).
3. **Checklist sections** -- categorized by security domain (e.g., Installation, Network, Authentication, Logging, File Permissions), each containing a table of items with:
   - Priority (Critical / High / Medium / Low)
   - Setting or control description
   - Current risk (what can go wrong if not applied)
   - Recommended value or action
   - Verification command or method
4. **Post-hardening validation** -- steps to verify the system still functions correctly after applying changes.
5. **Maintenance** -- ongoing monitoring and review cadence.

## Instructions

Follow these rules when generating hardening checklists:

### 1. Structure and Format

- Organize items into logical categories that match the technology's configuration domains. Common categories include:
  - Installation and Patching
  - Network Configuration
  - Authentication and Access Control
  - Authorization and Permissions
  - Logging and Auditing
  - Data Protection / Encryption
  - Service Configuration
  - File System Permissions
  - Resource Limits
  - Backup and Recovery
- Within each category, sort items by priority (Critical first).
- Use a consistent table format for every item.
- Include the specific configuration directive, file path, or command for each item -- do not just say "disable unnecessary services" without specifying which ones and how.

### 2. Priority Assignment

Assign priorities based on exploitation risk and blast radius:

| Priority | Criteria | Examples |
|----------|----------|---------|
| **Critical** | Directly exploitable from the network; leads to system compromise or data breach if not applied | Default credentials, unencrypted data in transit, remotely exploitable service misconfigurations |
| **High** | Significantly increases attack surface or reduces visibility; commonly exploited | Unnecessary services enabled, missing access controls, no logging |
| **Medium** | Provides defense in depth; reduces risk but not immediately exploitable on its own | File permission tightening, resource limits, header hardening |
| **Low** | Best practice; minor risk reduction or compliance alignment | Banner removal, cosmetic security settings, non-default port numbers |

### 3. Verification Commands

Every item must include a verification command or method that allows the user to check whether the hardening has been applied. These should be:

- Copy-pasteable commands that return a clear pass/fail result
- Non-destructive (read-only checks, never modify the system)
- Specific to the target OS/platform (e.g., use `systemctl` on systemd-based Linux, `sysctl` for kernel parameters, `nginx -T` for Nginx config)

### 4. Technology-Specific Guidance

Tailor the checklist to the specific technology and version:

**Web servers (Nginx, Apache, IIS):**
- TLS configuration (protocols, ciphers, HSTS, OCSP stapling)
- Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Request limits (body size, header size, rate limiting)
- Directory listing, server tokens, version disclosure
- Access control (IP restrictions, authentication for admin paths)
- Module minimization

**Databases (PostgreSQL, MySQL, Redis, MongoDB):**
- Authentication method and password policy
- Network binding (listen address, allowed connections)
- Encryption at rest and in transit (TLS)
- User privileges (least privilege, no shared accounts)
- Logging (query logging, connection logging, slow query logging)
- Backup encryption

**Operating systems (Linux, Windows):**
- Kernel hardening (sysctl parameters, ASLR, NX)
- User and group management (no shared accounts, sudo configuration)
- SSH hardening (key-based auth, no root login, allowed users)
- Filesystem permissions and mount options (noexec, nosuid, nodev)
- Firewall configuration (default deny, minimal open ports)
- Automatic security updates
- Audit logging (auditd, syslog)

**Cloud services (AWS S3, IAM, Azure, GCP):**
- Public access controls
- Encryption (at rest, in transit, key management)
- Access policies (least privilege, resource policies)
- Logging (access logs, CloudTrail integration)
- Versioning and lifecycle policies
- Cross-account access restrictions

**Container platforms (Docker, Kubernetes):**
- Image security (base images, scanning, signing)
- Runtime security (read-only root filesystem, no privileged containers, seccomp, AppArmor)
- Network policies
- Secret management
- Resource limits
- RBAC

### 5. Compliance Mapping

If the user specifies a compliance framework, map checklist items to specific controls:

- **CIS Benchmark**: Reference the specific benchmark section number (e.g., "CIS Nginx 1.0.0, Section 2.4.1")
- **PCI-DSS**: Map to requirements (e.g., "Requirement 2.2 - Develop configuration standards")
- **HIPAA**: Map to safeguards (e.g., "Technical Safeguard 164.312(a)(1) - Access Control")
- **SOC 2**: Map to Trust Service Criteria (e.g., "CC6.1 - Logical and Physical Access Controls")

If no framework is specified, align with CIS Benchmark structure as a sensible default and note this in the output.

### 6. Practical Considerations

- Always recommend **testing changes in a non-production environment first**.
- Always recommend **taking a backup or snapshot before applying changes**.
- Note when a hardening item **may break functionality** and describe how to test for it.
- For production systems, recommend applying changes incrementally, not all at once.
- Include rollback steps for high-impact changes.

### 7. Do Not Include

- Offensive techniques or exploit details
- Recommendations to disable security features
- Platform-specific settings for the wrong version (e.g., do not recommend a Nginx 1.25 directive for a 1.24 installation)
- Settings that require a specific commercial product unless the user mentions it

## Examples

### Example 1: Nginx Web Server Hardening Checklist

**Input:**

> Generate a hardening checklist for Nginx 1.24 as a public-facing reverse proxy.

**Output:**

---

# Hardening Checklist: Nginx 1.24 (Public-Facing Reverse Proxy)

## Summary

| Field | Value |
|-------|-------|
| **Target** | Nginx 1.24.x |
| **Role** | Public-facing reverse proxy |
| **Base reference** | CIS Nginx Benchmark 1.0.0, Mozilla SSL Configuration Generator |
| **Risk profile** | High (internet-exposed, processes untrusted requests) |
| **Goal** | Minimize attack surface, enforce TLS best practices, prevent information leakage, add defense-in-depth headers |

## Prerequisites

- [ ] Back up the current Nginx configuration: `cp -a /etc/nginx /etc/nginx.bak.$(date +%F)`
- [ ] Ensure you can test changes before applying to production (staging environment or `nginx -t` for syntax validation)
- [ ] Verify you have root/sudo access to the server
- [ ] Know the upstream application's requirements (headers it expects, WebSocket usage, etc.)

---

## 1. Installation and Version Management

| # | Priority | Setting | Current Risk | Recommended Action | Verification |
|---|----------|---------|-------------|-------------------|-------------|
| 1.1 | Critical | Nginx is the latest stable patch | Unpatched versions may have known CVEs (e.g., HTTP/2 rapid reset) | Update to the latest patch in the 1.24.x branch via your package manager | `nginx -v` -- confirm version is 1.24.x with latest patch |
| 1.2 | High | Installed from official repository | Third-party builds may include unvetted modules or modifications | Use the official Nginx repository or your OS vendor's security-maintained package | `apt-cache policy nginx` or `rpm -qi nginx` -- verify the source repository |
| 1.3 | Medium | Minimal modules compiled/loaded | Unused modules increase attack surface (e.g., `ngx_http_autoindex_module`) | Load only required modules. If using dynamic modules, remove unused `.so` files from `/etc/nginx/modules-enabled/` | `nginx -V 2>&1 | tr ' ' '\n' | grep module` -- review loaded modules |

---

## 2. Information Disclosure

| # | Priority | Setting | Current Risk | Recommended Action | Verification |
|---|----------|---------|-------------|-------------------|-------------|
| 2.1 | High | `server_tokens` | Nginx version exposed in HTTP response headers and error pages, aiding attackers in identifying known vulnerabilities | Set `server_tokens off;` in the `http` block | `curl -sI https://yoursite.com | grep -i server` -- should show `nginx` without version number |
| 2.2 | Medium | Custom error pages | Default error pages reveal Nginx branding and version | Configure custom error pages: `error_page 404 /custom_404.html; error_page 500 502 503 504 /custom_50x.html;` | `curl -s -o /dev/null -w "%{http_code}" https://yoursite.com/nonexistent` then inspect the response body for Nginx branding |
| 2.3 | Low | `proxy_hide_header` | Backend server version headers (X-Powered-By, Server, X-AspNet-Version) forwarded to clients | Add `proxy_hide_header X-Powered-By; proxy_hide_header X-AspNet-Version; proxy_hide_header Server;` in the `location` or `server` block | `curl -sI https://yoursite.com | grep -iE "x-powered-by|x-aspnet"` -- should return nothing |

---

## 3. TLS Configuration

| # | Priority | Setting | Current Risk | Recommended Action | Verification |
|---|----------|---------|-------------|-------------------|-------------|
| 3.1 | Critical | TLS protocols | Older protocols (TLS 1.0, 1.1, SSLv3) have known vulnerabilities (POODLE, BEAST) | Set `ssl_protocols TLSv1.2 TLSv1.3;` | `nmap --script ssl-enum-ciphers -p 443 yoursite.com` or `testssl.sh yoursite.com` -- verify only TLS 1.2 and 1.3 are offered |
| 3.2 | Critical | TLS cipher suites | Weak ciphers enable decryption or downgrade attacks | Use Mozilla's recommended cipher string: `ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';` and set `ssl_prefer_server_ciphers on;` | `nmap --script ssl-enum-ciphers -p 443 yoursite.com` -- verify no weak ciphers (RC4, DES, 3DES, NULL, export) |
| 3.3 | High | HSTS | Without HSTS, users can be downgraded from HTTPS to HTTP via MITM | Add `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;` | `curl -sI https://yoursite.com | grep -i strict-transport` -- should return the header with `max-age` >= 31536000 |
| 3.4 | High | OCSP stapling | Without OCSP stapling, clients must contact the CA for certificate validation, adding latency and a privacy leak | Set `ssl_stapling on; ssl_stapling_verify on; resolver 1.1.1.1 8.8.8.8 valid=300s;` | `openssl s_client -connect yoursite.com:443 -status < /dev/null 2>&1 | grep "OCSP Response Status"` -- should show "successful" |
| 3.5 | High | DH parameters | Default DH parameters may be weak (1024-bit) | Generate strong DH parameters: `openssl dhparam -out /etc/nginx/dhparam.pem 4096` and set `ssl_dhparam /etc/nginx/dhparam.pem;` | `openssl s_client -connect yoursite.com:443 -cipher 'DHE' < /dev/null 2>&1 | grep "Server Temp Key"` -- should show DH >= 2048 bits |
| 3.6 | Medium | SSL session configuration | Long session caches can aid session hijacking | Set `ssl_session_timeout 1d; ssl_session_cache shared:SSL:10m; ssl_session_tickets off;` (disable session tickets unless you have a proper rotation strategy) | Review config: `nginx -T | grep ssl_session` |
| 3.7 | Medium | HTTP to HTTPS redirect | HTTP access allows MITM and credential theft | Add a server block that redirects port 80 to 443: `server { listen 80; server_name yoursite.com; return 301 https://$server_name$request_uri; }` | `curl -sI http://yoursite.com | grep -i location` -- should show `https://` redirect |

---

## 4. Security Headers

| # | Priority | Setting | Current Risk | Recommended Action | Verification |
|---|----------|---------|-------------|-------------------|-------------|
| 4.1 | High | Content-Security-Policy | Without CSP, the site is vulnerable to XSS and data injection attacks | Add `add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;` -- **tailor this to your application's actual needs** | `curl -sI https://yoursite.com | grep -i content-security-policy` |
| 4.2 | High | X-Frame-Options | Without this header, the site can be embedded in iframes for clickjacking attacks | Add `add_header X-Frame-Options "DENY" always;` (or `SAMEORIGIN` if your app uses iframes internally) | `curl -sI https://yoursite.com | grep -i x-frame-options` |
| 4.3 | High | X-Content-Type-Options | Without this header, browsers may MIME-sniff responses, enabling XSS via content type confusion | Add `add_header X-Content-Type-Options "nosniff" always;` | `curl -sI https://yoursite.com | grep -i x-content-type-options` |
| 4.4 | Medium | Referrer-Policy | Without this header, the full URL (including query parameters with sensitive data) may be leaked to third parties | Add `add_header Referrer-Policy "strict-origin-when-cross-origin" always;` | `curl -sI https://yoursite.com | grep -i referrer-policy` |
| 4.5 | Medium | Permissions-Policy | Without this header, the page can access device features (camera, microphone, geolocation) that it may not need | Add `add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;` -- adjust based on application needs | `curl -sI https://yoursite.com | grep -i permissions-policy` |
| 4.6 | Low | X-XSS-Protection | Legacy header, but still useful for older browsers | Add `add_header X-XSS-Protection "1; mode=block" always;` | `curl -sI https://yoursite.com | grep -i x-xss-protection` |

---

## 5. Request Limits and Denial-of-Service Protection

| # | Priority | Setting | Current Risk | Recommended Action | Verification |
|---|----------|---------|-------------|-------------------|-------------|
| 5.1 | High | `client_max_body_size` | Without a limit, attackers can send extremely large requests to exhaust disk or memory | Set `client_max_body_size 10m;` (adjust to your application's maximum expected upload size) | `nginx -T | grep client_max_body_size` |
| 5.2 | High | `client_body_timeout` and `client_header_timeout` | Slow clients can hold connections open indefinitely (Slowloris-style DoS) | Set `client_body_timeout 10s; client_header_timeout 10s;` | `nginx -T | grep -E "client_body_timeout|client_header_timeout"` |
| 5.3 | High | Rate limiting | Without rate limiting, login pages and APIs are vulnerable to brute force and abuse | Define a rate limit zone: `limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;` and apply: `limit_req zone=general burst=20 nodelay;` | `nginx -T | grep limit_req` |
| 5.4 | Medium | `large_client_header_buffers` | Oversized headers can trigger buffer-related vulnerabilities | Set `large_client_header_buffers 4 8k;` | `nginx -T | grep large_client_header_buffers` |
| 5.5 | Medium | `keepalive_timeout` | Very long keepalive allows connection exhaustion | Set `keepalive_timeout 15s;` | `nginx -T | grep keepalive_timeout` |

---

## 6. Access Control

| # | Priority | Setting | Current Risk | Recommended Action | Verification |
|---|----------|---------|-------------|-------------------|-------------|
| 6.1 | Critical | Restrict access to sensitive paths | Admin panels, status pages, and config endpoints exposed to the internet | Add `location` blocks with `deny all;` or IP restrictions for paths like `/admin`, `/status`, `/.git`, `/.env` | `curl -sI https://yoursite.com/.env` -- should return 403 or 404 |
| 6.2 | High | Block dotfiles | Files like `.git`, `.env`, `.htaccess` can leak secrets and source code | Add `location ~ /\. { deny all; return 404; }` | `curl -sI https://yoursite.com/.git/config` -- should return 403 or 404 |
| 6.3 | High | Disable directory listing | `autoindex on` reveals file structure to attackers | Ensure `autoindex off;` is set (this is the default, but verify it is not overridden) | `nginx -T | grep autoindex` -- should be `off` or absent (off is default) |
| 6.4 | Medium | Restrict HTTP methods | Unused methods (TRACE, DELETE, PUT) can be abused | Add `if ($request_method !~ ^(GET|HEAD|POST)$) { return 405; }` or use `limit_except` in location blocks | `curl -sI -X TRACE https://yoursite.com` -- should return 405 |

---

## 7. Logging and Monitoring

| # | Priority | Setting | Current Risk | Recommended Action | Verification |
|---|----------|---------|-------------|-------------------|-------------|
| 7.1 | High | Access logging enabled | Without access logs, security incidents cannot be investigated | Ensure `access_log /var/log/nginx/access.log;` is set in every `server` block. Use a detailed log format that includes `$remote_addr`, `$request`, `$status`, `$http_user_agent`, `$http_referer` | `nginx -T | grep access_log` -- should not be `off` |
| 7.2 | High | Error logging enabled | Without error logs, misconfigurations and attacks go unnoticed | Set `error_log /var/log/nginx/error.log warn;` | `nginx -T | grep error_log` |
| 7.3 | Medium | Log rotation | Unrotated logs fill the disk, potentially causing a denial of service | Configure logrotate for Nginx logs: daily rotation, 30-day retention, compression | `cat /etc/logrotate.d/nginx` -- verify rotation policy exists |
| 7.4 | Medium | Centralized logging | Local-only logs can be tampered with by an attacker who gains server access | Forward logs to a SIEM or centralized logging service (e.g., via rsyslog, Filebeat, or Datadog agent) | Verify log entries appear in your central logging system |

---

## 8. File System Permissions

| # | Priority | Setting | Current Risk | Recommended Action | Verification |
|---|----------|---------|-------------|-------------------|-------------|
| 8.1 | High | Nginx config file permissions | World-readable config may expose upstream addresses, internal paths, or auth credentials | Set `chmod 640 /etc/nginx/nginx.conf` and `chown root:nginx /etc/nginx/nginx.conf` | `ls -la /etc/nginx/nginx.conf` -- should show `-rw-r-----` |
| 8.2 | High | TLS private key permissions | World-readable private key = complete TLS compromise | Set `chmod 600 /etc/nginx/ssl/private.key` and `chown root:root /etc/nginx/ssl/private.key` | `ls -la /etc/nginx/ssl/private.key` -- should show `-rw-------` |
| 8.3 | Medium | Nginx worker process user | Running as root means a vulnerability gives the attacker root access | Set `user nginx;` (or `www-data` on Debian/Ubuntu) -- the worker processes should NOT run as root | `ps aux | grep nginx` -- worker processes should show the non-root user |
| 8.4 | Medium | Web root permissions | Overly permissive web root allows Nginx worker to modify served files | Set web root owned by a deploy user, readable by nginx: `chown -R deploy:nginx /var/www/html && chmod -R 750 /var/www/html` | `ls -la /var/www/html` -- verify correct ownership and permissions |

---

## 9. Proxy-Specific Hardening

| # | Priority | Setting | Current Risk | Recommended Action | Verification |
|---|----------|---------|-------------|-------------------|-------------|
| 9.1 | High | `proxy_set_header Host` | Without forwarding the correct Host header, the backend cannot distinguish virtual hosts, and some attacks bypass host-based access controls | Set `proxy_set_header Host $host;` | `nginx -T | grep proxy_set_header` -- verify Host is set |
| 9.2 | High | `proxy_set_header X-Real-IP` and `X-Forwarded-For` | Without these, the backend cannot see the real client IP for logging or rate limiting | Set `proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` | `nginx -T | grep proxy_set_header` |
| 9.3 | Medium | `proxy_set_header X-Forwarded-Proto` | Backend cannot distinguish HTTP from HTTPS, may serve insecure content or generate wrong redirect URLs | Set `proxy_set_header X-Forwarded-Proto $scheme;` | `nginx -T | grep X-Forwarded-Proto` |
| 9.4 | Medium | `proxy_buffering` | Misconfigured buffering can cause memory issues or allow response splitting | Set `proxy_buffering on;` with appropriate `proxy_buffer_size` and `proxy_buffers` values | `nginx -T | grep proxy_buffer` |

---

## Post-Hardening Validation

After applying all changes:

- [ ] Run `nginx -t` to verify configuration syntax is valid
- [ ] Reload Nginx: `systemctl reload nginx` (use reload, not restart, to avoid downtime)
- [ ] Test the application thoroughly -- verify all pages load, forms submit, APIs respond, WebSockets connect
- [ ] Run an external TLS test: `https://www.ssllabs.com/ssltest/` -- target an A+ rating
- [ ] Run a security headers test: `https://securityheaders.com/` -- target an A rating
- [ ] Verify logging is working: check that new requests appear in access and error logs
- [ ] Verify rate limiting is working: send rapid requests and confirm they are throttled
- [ ] Run a vulnerability scan (e.g., `nikto -h https://yoursite.com`) to check for remaining issues

## Maintenance

- **Weekly**: Review error logs for anomalies
- **Monthly**: Check for Nginx security advisories and patch if needed
- **Quarterly**: Re-run TLS and security header tests; review and update CSP as application changes
- **Annually**: Full re-audit of this checklist; update for new Nginx versions and evolving best practices
- **On change**: Re-validate after any Nginx configuration change

---

*Checklist generated based on CIS Nginx Benchmark 1.0.0, Mozilla Server Side TLS guidelines, and OWASP Secure Headers Project. Adapt to your specific environment and application requirements.*

## Edge Cases & Guardrails

- **Version specificity**: If the user requests hardening for a specific version, ensure recommendations are compatible with that version. Do not recommend directives that only exist in newer versions. If unsure, note the version the directive was introduced.
- **Breaking changes**: Always warn when a hardening item may break application functionality (e.g., restrictive CSP headers, disabling HTTP methods the app uses, TLS settings that drop old client support). Recommend testing in staging.
- **Incomplete information**: If the user does not specify the role or use case, generate a general-purpose checklist and note assumptions. Ask for clarification if the system could serve very different roles (e.g., "Is this PostgreSQL instance internal only or internet-facing?").
- **Cloud-managed services**: If the target is a managed service (e.g., AWS RDS, Azure App Service), note which settings are controlled by the cloud provider and which are user-configurable. Do not recommend changes that are not possible on managed services.
- **Do not recommend disabling security features**: Never suggest turning off firewalls, SELinux/AppArmor, or other OS security mechanisms to "simplify" configuration.
- **Do not provide exploit details**: Explain the risk of each misconfiguration but do not provide step-by-step exploitation instructions.
- **Compliance mapping**: If the user requests compliance alignment, map items to the specific framework but note that the checklist is not a substitute for a formal compliance assessment.
- **Custom configurations**: If the user provides their current config, analyze it against the checklist and highlight which items are already satisfied and which need remediation. Do not regenerate items that are already properly configured.
