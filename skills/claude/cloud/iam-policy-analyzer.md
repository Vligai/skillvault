---
name: iam-policy-analyzer
description: Review AWS/GCP/Azure IAM policies for over-permissive access and least-privilege violations
personas: [Cloud/Infra, Security]
---

# IAM Policy Analyzer

Analyze Identity and Access Management (IAM) policies from AWS, GCP, or Azure for over-permissive access, privilege escalation paths, and least-privilege violations. Use this skill during policy creation, cloud security audits, or access reviews to ensure that identities are granted only the permissions they need.

## Input

An IAM policy document in JSON or YAML format from any of the three major cloud providers. The user may also provide context about the intended purpose of the policy (e.g., "this role is for a Lambda function that reads from S3 and writes to DynamoDB"). Supported formats:

- **AWS**: IAM policy JSON (inline or managed), trust policy, SCP, resource-based policy
- **GCP**: IAM binding JSON/YAML, custom role definitions
- **Azure**: Role definition JSON, role assignment, Azure Policy definition

Example input:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*"
    }
  ]
}
```

The user may optionally describe the intended use case: "This policy is attached to a CI/CD role that deploys Lambda functions."

## Output

Return a structured analysis containing:

1. **Summary** -- overall risk rating (Critical / High / Medium / Low) and one-paragraph assessment.
2. **Policy metadata** -- detected cloud provider, policy type, and any notable structural observations.
3. **Findings table** -- each finding includes:
   - Risk level (Critical / High / Medium / Low / Info)
   - Issue type (e.g., Wildcard Actions, Wildcard Resources, Missing Conditions, Privilege Escalation Path)
   - Affected statement / binding / role
   - Description of the risk
   - Least-privilege recommendation
4. **Recommended policy** -- a corrected policy document that implements least-privilege for the stated use case. If no use case is provided, offer a generic tightened version and note assumptions.
5. **Privilege escalation paths** -- if the policy grants permissions that could be used to escalate privileges (e.g., `iam:PassRole`, `iam:CreatePolicyVersion`, `sts:AssumeRole` to admin roles), enumerate them explicitly.

## Instructions

Follow these rules when analyzing IAM policies:

### 1. Detect the Cloud Provider and Policy Type

Identify the cloud provider from the policy structure:

- **AWS**: Look for `Version`, `Statement`, `Effect`, `Action`, `Resource`, `Principal`, `Condition` fields. Determine if it is an identity-based policy, resource-based policy, trust policy, SCP, or permissions boundary.
- **GCP**: Look for `bindings`, `role`, `members`, or custom role `includedPermissions`. Determine if it is an IAM binding, custom role, or organization policy.
- **Azure**: Look for `properties`, `roleName`, `permissions`, `actions`, `notActions`, `dataActions`. Determine if it is a role definition, role assignment, or Azure Policy.

### 2. Check for Wildcard Permissions

This is the most common and dangerous misconfiguration:

- **`Action: "*"` or `actions: ["*"]`**: Grants every possible API action. Always flag as Critical.
- **`Resource: "*"`**: Grants access to all resources. Flag as High when combined with sensitive actions; flag as Medium for read-only actions.
- **Service-level wildcards** (e.g., `s3:*`, `ec2:*`): Flag as High. These grant all actions within a service, including destructive ones (delete, modify ACLs, etc.).
- **Action wildcards** (e.g., `s3:Get*`, `iam:*Policy*`): Flag as Medium. These are better than full wildcards but may still over-grant.

### 3. Check for Privilege Escalation Paths

Flag combinations of permissions that allow an identity to escalate its own privileges:

**AWS privilege escalation paths:**

| Permissions | Escalation vector |
|------------|-------------------|
| `iam:CreatePolicyVersion` | Create a new version of any policy with `*:*` and set it as default |
| `iam:AttachUserPolicy` or `iam:AttachRolePolicy` | Attach `AdministratorAccess` to self |
| `iam:PutUserPolicy` or `iam:PutRolePolicy` | Add an inline `*:*` policy to self |
| `iam:PassRole` + `lambda:CreateFunction` + `lambda:InvokeFunction` | Create and invoke a Lambda with an admin role |
| `iam:PassRole` + `ec2:RunInstances` | Launch an instance with an admin instance profile |
| `iam:CreateAccessKey` | Create access keys for other users |
| `sts:AssumeRole` with wide trust | Assume a more-privileged role |
| `iam:UpdateAssumeRolePolicy` | Modify a role's trust policy to allow self to assume it |

**GCP privilege escalation paths:**

| Permissions | Escalation vector |
|------------|-------------------|
| `resourcemanager.projects.setIamPolicy` | Grant self `roles/owner` |
| `iam.serviceAccounts.getAccessToken` | Impersonate a more-privileged SA |
| `iam.roles.update` + custom roles | Add any permission to own custom role |
| `deploymentmanager.deployments.create` | Deploy resources as the DM service account |

Flag each escalation path with specific exploitation steps so the reviewer understands the risk.

### 4. Check Conditions and Constraints

- Flag policies that lack `Condition` blocks where they would be expected (e.g., S3 access without bucket-name constraints, AssumeRole without source IP or MFA conditions).
- Recommend adding conditions such as:
  - `aws:SourceIp` or `aws:VpcSourceIp` for network restrictions
  - `aws:MultiFactorAuthPresent` for sensitive operations
  - `aws:PrincipalOrgID` for cross-account access
  - `aws:RequestedRegion` to limit to required regions
  - `StringEquals` / `ArnLike` conditions on `iam:PassRole` to restrict which roles can be passed
- For GCP, recommend IAM Conditions (e.g., resource name patterns, request time).
- For Azure, recommend conditions on role assignments and Azure Policy constraints.

### 5. Check Trust Policies and Cross-Account Access

For AWS trust policies and GCP/Azure cross-tenant bindings:

- Flag `Principal: "*"` (anyone in the world can assume the role) as Critical.
- Flag `Principal: {"AWS": "arn:aws:iam::ACCOUNT_ID:root"}` without conditions as High (entire other account can assume).
- Flag missing `sts:ExternalId` conditions on cross-account trust as Medium.
- Flag overly broad `Federated` principals without audience/subject conditions.
- For GCP, flag `allUsers` or `allAuthenticatedUsers` member bindings on sensitive resources.
- For Azure, flag role assignments scoped to the entire subscription or management group when a resource group scope would suffice.

### 6. Check for Data Exfiltration Risks

Flag permissions that enable data exfiltration:

- `s3:GetObject` on `*` without bucket constraints
- `dynamodb:Scan` / `dynamodb:GetItem` on `*`
- `rds:CreateDBSnapshot` + `rds:ModifyDBSnapshotAttribute` (share snapshots externally)
- `ec2:CreateSnapshot` + `ec2:ModifySnapshotAttribute`
- `secretsmanager:GetSecretValue` or `ssm:GetParameter` on `*`
- Cloud storage read access combined with external-facing network permissions

### 7. Check for Missing Deny Statements

Recommend explicit `Deny` statements for:

- Actions outside required AWS regions (`aws:RequestedRegion`)
- Disabling CloudTrail, GuardDuty, or other security services
- Creating IAM users or access keys (prefer roles and federation)
- Making S3 buckets public

### 8. Consider the Stated Use Case

If the user provides context about what the policy is for, tailor recommendations to that use case:

- For a Lambda function: it needs only the specific S3 buckets, DynamoDB tables, or other resources it accesses; plus CloudWatch Logs for logging.
- For a CI/CD role: scope to specific deployment actions and resources; require conditions such as source IP or OIDC claims.
- For a human user: require MFA conditions on sensitive actions; prefer temporary credentials.

### 9. Formatting Rules

- Sort findings by risk level (Critical first).
- In the recommended policy, add inline comments explaining each permission and why it is needed.
- If the policy is well-configured, say so explicitly and offer only minor hardening suggestions.
- Always output valid JSON/YAML for the recommended policy.

## Examples

### Example 1: Overly Permissive AWS IAM Policy

**Input:**

The user provides this policy and says: "This role is used by our backend API service running on ECS. It needs to read from an S3 bucket called `app-uploads`, write to a DynamoDB table called `user-sessions`, and send messages to an SQS queue called `task-queue`."

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAll",
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "dynamodb:*",
        "sqs:*",
        "logs:*",
        "ec2:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AllowPassRole",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "*"
    }
  ]
}
```

**Output:**

### Summary

**Risk: Critical.** This policy grants full access to five AWS services across all resources, plus unrestricted `iam:PassRole`. The service needs access to only three specific resources (one S3 bucket, one DynamoDB table, one SQS queue) and CloudWatch Logs. The current policy is approximately 1000x more permissive than necessary. It allows the ECS task to delete any S3 bucket in the account, drop any DynamoDB table, manage any EC2 instance, and pass any IAM role to any service -- enabling multiple privilege escalation paths.

### Policy Metadata

- **Cloud provider**: AWS
- **Policy type**: Identity-based (IAM policy)
- **Attached to**: ECS task role (per user context)

### Findings

| # | Risk | Issue Type | Statement | Description | Recommendation |
|---|------|-----------|-----------|-------------|----------------|
| 1 | Critical | Unrestricted iam:PassRole | `AllowPassRole` | Grants `iam:PassRole` on all resources. Combined with `ec2:*`, the task can launch EC2 instances with any IAM role, including admin roles. Combined with other service permissions, it can pass roles to Lambda, ECS, Glue, etc. This is a direct privilege escalation path. | Remove `iam:PassRole` entirely. The ECS task role does not need to pass roles to other services. If PassRole is needed for a specific purpose, scope it to the exact role ARN. |
| 2 | Critical | Full EC2 Access | `AllowAll` | `ec2:*` on `*` grants the ability to launch instances, modify security groups, create VPC peering, terminate any instance, and more. An ECS backend API has no reason to manage EC2 resources directly. | Remove `ec2:*` entirely. |
| 3 | High | Full S3 Access | `AllowAll` | `s3:*` on `*` grants read, write, delete, and ACL modification on every S3 bucket in the account, including backups, logs, and other sensitive buckets. The service only needs to read from `app-uploads`. | Scope to `s3:GetObject` on `arn:aws:s3:::app-uploads/*`. Add `s3:ListBucket` on `arn:aws:s3:::app-uploads` if listing is needed. |
| 4 | High | Full DynamoDB Access | `AllowAll` | `dynamodb:*` on `*` grants read, write, delete, and table management on every DynamoDB table. The service only needs to read/write items in `user-sessions`. | Scope to `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:UpdateItem`, `dynamodb:DeleteItem`, `dynamodb:Query` on the specific table ARN. |
| 5 | High | Full SQS Access | `AllowAll` | `sqs:*` on `*` grants full access to every SQS queue, including the ability to delete queues and purge messages. The service only needs to send messages to `task-queue`. | Scope to `sqs:SendMessage` on the specific queue ARN. |
| 6 | Medium | Unrestricted CloudWatch Logs | `AllowAll` | `logs:*` on `*` grants access to all log groups, including the ability to delete log groups or modify retention (which could hide an attacker's tracks). | Scope to `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` on the specific log group ARN for this service. |
| 7 | Medium | No Resource Constraints | `AllowAll` | `Resource: "*"` on all actions means no resource-level restriction. Even if the actions were scoped, the lack of resource constraints would still over-grant. | Specify exact resource ARNs for each action set. |
| 8 | Low | Missing Region Condition | Both statements | No `aws:RequestedRegion` condition. The service likely runs in a single region, but the policy allows API calls in any region. | Add a condition to restrict to the required region(s). |

### Privilege Escalation Paths

1. **PassRole + EC2**: The task can call `ec2:RunInstances` with any IAM instance profile attached, then SSH to the instance (or use SSM) to act as that role. If an admin instance profile exists, full account compromise is possible.
2. **PassRole + Lambda** (if Lambda permissions were added): Similar vector via `lambda:CreateFunction`.
3. **S3 write to CloudTrail bucket**: With `s3:*` the task can overwrite or delete CloudTrail logs, erasing evidence of the attack.
4. **DynamoDB table deletion**: With `dynamodb:*` the task can delete any table, causing a denial-of-service across the account.

### Recommended Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadFromUploadsBucket",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::app-uploads/*"
    },
    {
      "Sid": "ListUploadsBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::app-uploads"
    },
    {
      "Sid": "ReadWriteSessionsTable",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:us-east-1:123456789012:table/user-sessions",
        "arn:aws:us-east-1:123456789012:table/user-sessions/index/*"
      ]
    },
    {
      "Sid": "SendToTaskQueue",
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": "arn:aws:sqs:us-east-1:123456789012:task-queue"
    },
    {
      "Sid": "WriteCloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:123456789012:log-group:/ecs/backend-api:*"
    }
  ]
}
```

> **Note**: Replace `123456789012` with the actual AWS account ID, `us-east-1` with the actual region, and adjust the log group name as needed. If the S3 bucket uses SSE-KMS, add `kms:Decrypt` scoped to the specific KMS key ARN.

### Additional Recommendations

- Add an explicit `Deny` statement preventing the role from calling IAM, STS, or Organizations APIs.
- Add a `Condition` with `aws:RequestedRegion` to restrict API calls to the region where the service operates.
- Enable CloudTrail data events for the `app-uploads` S3 bucket to audit access.
- Consider using VPC endpoints for S3, DynamoDB, and SQS to keep traffic off the public internet, combined with `aws:sourceVpce` conditions.
- Regularly review this policy using AWS IAM Access Analyzer to verify that actual usage matches granted permissions.

## Edge Cases & Guardrails

- **Incomplete policies**: If the user provides a partial policy or only one statement from a larger policy, analyze what is visible and clearly state that the full policy should be reviewed for a complete assessment.
- **Custom policy languages**: Some organizations use Terraform, CDK, Pulumi, or CloudFormation to define IAM policies. Accept these formats and extract the underlying IAM policy for analysis. Provide remediation in the same format the user provided.
- **No use case provided**: If the user does not describe what the policy is for, still flag over-permissive patterns and provide generic tightening recommendations. Ask the user to describe the use case for more specific least-privilege guidance.
- **Multi-cloud**: If the user provides policies from multiple cloud providers, analyze each separately using the appropriate provider's rules.
- **Do not guess account IDs or resource names**: In recommended policies, use placeholder values clearly marked for the user to replace. Do not invent ARNs.
- **Do not validate JSON programmatically**: Analyze the policy semantically. If the JSON is malformed, note the syntax issues but still analyze the intent.
- **Do not recommend disabling IAM features**: Never suggest turning off SCPs, permission boundaries, or other guardrails to "simplify" a policy.
- **Sensitive information**: If the policy contains real account IDs, role names, or resource identifiers, do not flag these as secrets -- they are expected in IAM policies. However, if actual access keys or passwords appear, flag immediately and recommend rotation.
