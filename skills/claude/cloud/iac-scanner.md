---
name: iac-scanner
description: Review Terraform and CloudFormation templates for security misconfigurations such as public S3 buckets, open security groups, and unencrypted storage
personas: [Developer, Security, Cloud/Infra]
---

# Infrastructure-as-Code Security Scanner

Reviews Terraform (`.tf`), CloudFormation (`.yaml`/`.json`), and Pulumi infrastructure definitions for security misconfigurations. Identifies public exposure risks, missing encryption, overly permissive access controls, and deviations from cloud security best practices. Maps findings to CIS Benchmarks, AWS/GCP/Azure security baselines, and MITRE ATT&CK Cloud Matrix.

## Input

The user provides one or more of the following:

- A Terraform `.tf` file or directory
- A CloudFormation template (YAML or JSON)
- A Pulumi program excerpt
- A CDK stack definition

Optionally:

- Target cloud provider (AWS, GCP, Azure)
- Environment context (production, staging, dev)
- Specific concerns (e.g., "focus on S3 and IAM", "check for public exposure")

### Example input

```hcl
resource "aws_s3_bucket" "data" {
  bucket = "my-company-data"
  acl    = "public-read"
}

resource "aws_security_group" "web" {
  name = "web-sg"
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "main" {
  engine         = "postgres"
  instance_class = "db.t3.micro"
  username       = "admin"
  password       = "Password123!"
  publicly_accessible = true
}
```

## Output

A structured report containing:

1. **Summary** -- Risk level and finding counts by severity.
2. **Findings Table** -- Each finding with ID, severity, resource, misconfiguration, impact, and fix.
3. **Remediated Code** -- Corrected IaC with inline comments explaining the security changes.
4. **Additional Hardening** -- Defense-in-depth suggestions not covered by the findings.

Severity definitions:

| Severity | Meaning |
|----------|---------|
| Critical | Immediate public exposure or full access compromise possible |
| High | Significant attack surface increase or data exposure risk |
| Medium | Exploitable under specific conditions; defense-in-depth violation |
| Low | Best-practice deviation with limited direct impact |
| Informational | Hardening suggestion or observability improvement |

## Instructions

You are a cloud security architect reviewing IaC templates before production deployment. Apply the following checks systematically.

### 1. Public Exposure Checks (Critical/High)

**S3 Buckets (AWS):**
- `acl = "public-read"` or `"public-read-write"` → Critical
- Missing `aws_s3_bucket_public_access_block` resource → High
- Missing bucket policy that enforces `https` only → Medium

**Security Groups / Firewall Rules:**
- `cidr_blocks = ["0.0.0.0/0"]` or `"::/0"` on ports beyond 80/443 → High/Critical depending on port
- Port 22 (SSH), 3389 (RDP), 3306 (MySQL), 5432 (Postgres), 27017 (MongoDB), 6379 (Redis) open to `0.0.0.0/0` → Critical
- All ports open (`from_port = 0, to_port = 65535`) → Critical

**Databases and Caches:**
- `publicly_accessible = true` on RDS, ElastiCache, Redshift → Critical
- Missing VPC placement → High

**Cloud Functions / Lambdas:**
- Function URLs with `auth_type = "NONE"` → High
- Missing resource-based policy → Medium

**Kubernetes (EKS/GKE/AKS):**
- Public API server endpoint without CIDR restriction → High
- `privileged: true` in pod spec → Critical
- Host network/PID namespace sharing → High

### 2. Encryption Checks (High/Medium)

- S3 bucket missing server-side encryption (`aws_s3_bucket_server_side_encryption_configuration`) → High
- EBS volumes with `encrypted = false` (or missing) → High
- RDS with `storage_encrypted = false` → High
- SQS queue without `kms_master_key_id` → Medium
- SNS topic without encryption → Medium
- ElastiCache without `at_rest_encryption_enabled = true` → High
- Secrets stored as plaintext in parameter store (SSM `type = "String"` vs `"SecureString"`) → High
- CloudTrail without `kms_key_id` → Medium

### 3. IAM and Access Control (Critical/High)

- IAM policy with `"*"` on both `Action` and `Resource` → Critical
- Inline IAM policies (prefer managed) → Low
- IAM role with `"sts:AssumeRole"` from `"*"` principal → Critical
- S3 bucket policy granting `s3:*` to `"*"` → Critical
- Missing `condition` blocks on cross-account trust policies → High
- Lambda execution role with `"*"` actions → High

### 4. Logging and Monitoring (Medium/Low)

- CloudTrail not enabled or missing multi-region → Medium
- S3 bucket access logging disabled → Low
- VPC flow logs not enabled → Medium
- RDS without `enabled_cloudwatch_logs_exports` → Low
- Missing AWS Config rules reference → Informational

### 5. Secrets in Plaintext (Critical)

- Hardcoded passwords in `password = "..."` → Critical
- Hardcoded access keys or tokens → Critical
- Recommend: Use `data "aws_secretsmanager_secret_version"` or `aws_ssm_parameter` with `SecureString`.

### 6. Network Architecture (High/Medium)

- Resources placed in default VPC → Medium
- Subnets without explicit `map_public_ip_on_launch = false` for private subnets → Medium
- Missing NACLs or reliance solely on security groups → Informational
- VPC endpoints not used for S3/DynamoDB access (traffic traverses public internet) → Informational

### 7. CloudFormation-Specific Checks

- `DeletionPolicy: Delete` on production databases → High
- Missing stack termination protection → Medium
- `NoEcho: false` on sensitive parameters → High
- Hardcoded account IDs instead of `!Sub ${AWS::AccountId}` → Low

### 8. Remediation Quality

- Every Critical and High finding must include corrected IaC.
- Fixes must be valid, functional code in the same language/format as input.
- Do not introduce new misconfigurations in fixes.
- Add inline comments explaining why each security control was added.

## Examples

### Example 1: Terraform AWS — Public S3, Open SG, Public RDS

**Input:**

```hcl
resource "aws_s3_bucket" "data" {
  bucket = "my-company-data"
  acl    = "public-read"
}

resource "aws_security_group" "web" {
  name = "web-sg"
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "main" {
  engine              = "postgres"
  instance_class      = "db.t3.micro"
  username            = "admin"
  password            = "Password123!"
  publicly_accessible = true
}
```

**Output:**

### Summary

Risk level: **Critical**. Found 3 Critical and 2 High findings. The S3 bucket is publicly readable, all TCP ports are open to the internet, the database is publicly accessible with a hardcoded password, and encryption is missing.

### Findings

| ID | Severity | Resource | Misconfiguration | Impact |
|----|----------|----------|-----------------|--------|
| F-01 | Critical | aws_s3_bucket.data | `acl = "public-read"` | All objects readable by anyone on the internet |
| F-02 | Critical | aws_security_group.web | All TCP ports open to `0.0.0.0/0` | Full port exposure to internet — SSH, databases, admin interfaces accessible |
| F-03 | Critical | aws_db_instance.main | `publicly_accessible = true` + hardcoded password | Database reachable from internet with guessable credentials |
| F-04 | High | aws_s3_bucket.data | Missing public access block and SSE | Data can be exposed or tampered with without detection |
| F-05 | High | aws_db_instance.main | `storage_encrypted = false` (default) | Data at rest unencrypted |

### Remediated Terraform

```hcl
# S3 bucket: private, encrypted, with public access block
resource "aws_s3_bucket" "data" {
  bucket = "my-company-data"
  # Removed: acl = "public-read" — use bucket policies for controlled access
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

# Security group: only allow HTTPS (443) from internet; SSH only from VPN CIDR
resource "aws_security_group" "web" {
  name   = "web-sg"
  vpc_id = var.vpc_id

  # HTTPS only from internet
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH restricted to VPN/bastion CIDR — set your actual VPN CIDR in variables
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpn_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# RDS: private, encrypted, password from Secrets Manager
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = var.db_secret_arn
}

resource "aws_db_instance" "main" {
  engine              = "postgres"
  instance_class      = "db.t3.micro"
  username            = "admin"
  password            = data.aws_secretsmanager_secret_version.db_password.secret_string

  # Keep database private — accessed via application subnets only
  publicly_accessible = false
  db_subnet_group_name = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]

  # Encrypt storage at rest
  storage_encrypted = true

  # Enable automated backups
  backup_retention_period = 7

  # Enable deletion protection for production
  deletion_protection = true
}
```

### Additional Hardening

- Enable VPC flow logs to monitor network traffic.
- Enable CloudTrail with S3 data event logging for the bucket.
- Add `aws_s3_bucket_logging` to the data bucket.
- Consider using AWS PrivateLink for RDS access from application services.

## Edge Cases & Guardrails

- **Dev/test environments**: If the user specifies this is dev-only, still flag Critical findings but note lower urgency for Medium/Low.
- **Intentionally public buckets** (static website hosting): Acknowledge the intent and ensure a bucket policy restricts access to `s3:GetObject` only with `https` enforcement.
- **Missing provider context**: If the cloud provider is unclear from the template, ask before generating provider-specific fixes.
- **Partial templates (modules)**: Note that the review is limited to the provided code and full security posture depends on how modules are called.
- **Terraform state files**: Warn if state files may be stored without encryption (remote state with S3 backend should have encryption and DynamoDB locking).
- **Do not generate real credentials**: Never output real-looking passwords, access keys, or tokens in remediated code.
