---
name: sbom-generator
description: Produce a Software Bill of Materials (SBOM) in SPDX or CycloneDX format from dependency manifests for compliance and vulnerability tracking
personas: [Developer, Security]
---

# SBOM Generator

Generates a Software Bill of Materials (SBOM) from dependency manifests and source code context. Outputs structured SBOMs in SPDX 2.3 (JSON/YAML/tag-value) or CycloneDX 1.5 (JSON/XML) formats. Supports compliance workflows (NTIA Minimum Elements, Executive Order 14028), license auditing, and vulnerability tracking integration.

## Input

The user provides one or more of the following:

- Dependency manifest files: `package.json`, `package-lock.json`, `requirements.txt`, `Pipfile.lock`, `go.mod`, `go.sum`, `pom.xml`, `build.gradle`, `Cargo.toml`, `Cargo.lock`, `Gemfile.lock`, `composer.lock`
- A `Dockerfile` or container image name (for image-level SBOM)
- A project description (for context: project name, version, author, license)

Optionally:

- Desired output format: SPDX (JSON, YAML, or tag-value) or CycloneDX (JSON or XML)
- SBOM purpose: compliance reporting, vulnerability tracking, license auditing, or supply chain security
- Additional metadata: supplier name, document namespace, contact information

### Example input

```
Generate a CycloneDX JSON SBOM for this Node.js project. Project: "my-api", version 1.2.0, author "ACME Corp".

package.json:
{
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

## Output

1. **SBOM Document** -- Complete, valid SBOM in the requested format with all NTIA minimum elements populated.
2. **Component Summary** -- Table of all components with name, version, license, and PURL.
3. **License Summary** -- Grouped view of all licenses present and any potentially problematic ones.
4. **Vulnerability Scan Pointers** -- Notes on how to use the SBOM with vulnerability databases (OSV, NVD, GitHub Advisory).
5. **Compliance Notes** -- Assessment against NTIA Minimum Elements and any gaps.

## Instructions

You are a supply chain security engineer generating SBOMs for compliance and security operations.

### 1. NTIA Minimum Elements (always include)

Per NTIA guidance, every component entry must have:
- **Supplier Name** -- The entity that created or distributed the component.
- **Component Name** -- The name of the component.
- **Version** -- The specific version of the component.
- **Other Unique Identifiers** -- Package URL (PURL) using the `pkg:` schema.
- **Dependency Relationship** -- Whether this is a direct or transitive dependency.
- **Author of SBOM Data** -- Who generated this SBOM.
- **Timestamp** -- When the SBOM was generated.

### 2. Package URL (PURL) Format

Generate PURLs following the PURL specification:

| Ecosystem | PURL Format |
|-----------|-------------|
| npm | `pkg:npm/lodash@4.17.21` |
| PyPI | `pkg:pypi/requests@2.31.0` |
| Maven | `pkg:maven/org.springframework/spring-core@6.0.0` |
| Go | `pkg:golang/github.com/gin-gonic/gin@v1.9.0` |
| Cargo | `pkg:cargo/serde@1.0.190` |
| RubyGems | `pkg:gem/rails@7.1.0` |
| NuGet | `pkg:nuget/Newtonsoft.Json@13.0.3` |

### 3. License Identification

- Use SPDX license identifiers (e.g., `MIT`, `Apache-2.0`, `GPL-3.0-only`).
- Flag potentially problematic licenses for commercial use: GPL, AGPL, LGPL, EUPL, CDDL.
- Flag `NOASSERTION` or `UNKNOWN` when license cannot be determined.

### 4. CycloneDX Format

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "serialNumber": "urn:uuid:<uuid>",
  "version": 1,
  "metadata": {
    "timestamp": "<ISO8601>",
    "tools": [{ "vendor": "SkillVault", "name": "sbom-generator", "version": "1.0" }],
    "authors": [{ "name": "<author>" }],
    "component": {
      "type": "application",
      "name": "<project-name>",
      "version": "<project-version>"
    }
  },
  "components": [
    {
      "type": "library",
      "name": "<name>",
      "version": "<version>",
      "purl": "<purl>",
      "licenses": [{ "license": { "id": "<spdx-id>" } }],
      "scope": "required"
    }
  ],
  "dependencies": [
    { "ref": "<purl>", "dependsOn": ["<dep-purl>"] }
  ]
}
```

### 5. SPDX Format

```yaml
spdxVersion: SPDX-2.3
dataLicense: CC0-1.0
SPDXID: SPDXRef-DOCUMENT
name: <project-name>
documentNamespace: https://example.com/sbom/<project>-<version>
documentDescribes:
  - SPDXRef-Package-<project>

packages:
  - SPDXID: SPDXRef-Package-lodash
    name: lodash
    versionInfo: "4.17.21"
    downloadLocation: https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz
    filesAnalyzed: false
    externalRefs:
      - referenceCategory: PACKAGE-MANAGER
        referenceType: purl
        referenceLocator: pkg:npm/lodash@4.17.21
    licenseConcluded: MIT
    licenseDeclared: MIT
    copyrightText: NOASSERTION

relationships:
  - spdxElementId: SPDXRef-Package-<project>
    relationshipType: DEPENDS_ON
    relatedSpdxElement: SPDXRef-Package-lodash
```

### 6. Scope Classification

- **Required** (direct runtime dependencies)
- **Optional** (optional/peer dependencies)
- **Excluded** (dev dependencies — include in SBOM but mark as excluded from runtime)

### 7. Transitive Dependencies

- When lock files are available, include transitive dependencies.
- When only manifest files are available, note that transitive dependencies cannot be fully enumerated from the manifest alone and recommend generating the SBOM using a tool like `syft`, `cdxgen`, or `cyclonedx-bom` against the installed `node_modules` or equivalent.

## Examples

### Example 1: CycloneDX JSON for Node.js Project

**Input:**

```
Generate a CycloneDX JSON SBOM for: project "my-api", version 1.2.0.
Dependencies: express@4.18.2, jsonwebtoken@9.0.0, lodash@4.17.21 (dev: jest@29.0.0)
```

**Output:**

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "serialNumber": "urn:uuid:f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "version": 1,
  "metadata": {
    "timestamp": "2026-03-01T00:00:00Z",
    "tools": [
      { "vendor": "SkillVault", "name": "sbom-generator", "version": "1.0" }
    ],
    "component": {
      "type": "application",
      "bom-ref": "pkg:npm/my-api@1.2.0",
      "name": "my-api",
      "version": "1.2.0"
    }
  },
  "components": [
    {
      "type": "library",
      "bom-ref": "pkg:npm/express@4.18.2",
      "name": "express",
      "version": "4.18.2",
      "purl": "pkg:npm/express@4.18.2",
      "licenses": [{ "license": { "id": "MIT" } }],
      "scope": "required"
    },
    {
      "type": "library",
      "bom-ref": "pkg:npm/jsonwebtoken@9.0.0",
      "name": "jsonwebtoken",
      "version": "9.0.0",
      "purl": "pkg:npm/jsonwebtoken@9.0.0",
      "licenses": [{ "license": { "id": "MIT" } }],
      "scope": "required"
    },
    {
      "type": "library",
      "bom-ref": "pkg:npm/lodash@4.17.21",
      "name": "lodash",
      "version": "4.17.21",
      "purl": "pkg:npm/lodash@4.17.21",
      "licenses": [{ "license": { "id": "MIT" } }],
      "scope": "required"
    },
    {
      "type": "library",
      "bom-ref": "pkg:npm/jest@29.0.0",
      "name": "jest",
      "version": "29.0.0",
      "purl": "pkg:npm/jest@29.0.0",
      "licenses": [{ "license": { "id": "MIT" } }],
      "scope": "excluded"
    }
  ],
  "dependencies": [
    {
      "ref": "pkg:npm/my-api@1.2.0",
      "dependsOn": [
        "pkg:npm/express@4.18.2",
        "pkg:npm/jsonwebtoken@9.0.0",
        "pkg:npm/lodash@4.17.21"
      ]
    }
  ]
}
```

#### Component Summary

| Name | Version | License | PURL | Scope |
|------|---------|---------|------|-------|
| express | 4.18.2 | MIT | pkg:npm/express@4.18.2 | required |
| jsonwebtoken | 9.0.0 | MIT | pkg:npm/jsonwebtoken@9.0.0 | required |
| lodash | 4.17.21 | MIT | pkg:npm/lodash@4.17.21 | required |
| jest | 29.0.0 | MIT | pkg:npm/jest@29.0.0 | excluded (dev) |

#### License Summary

All components use **MIT** — permissive, compatible with commercial use.

#### Vulnerability Scan Pointers

- Submit the SBOM to [OSV.dev](https://osv.dev) for vulnerability matching.
- Use `grype sbom:./bom.json` (Anchore Grype) for local scanning.
- Use `trivy sbom ./bom.json` for Trivy-based scanning.

#### NTIA Compliance

All NTIA minimum elements are present. Note: transitive dependencies are not included — regenerate with `npx @cyclonedx/cyclonedx-npm --output-file bom.json` after `npm install` for full coverage.

## Edge Cases & Guardrails

- **No lock file provided**: Generate the SBOM from the manifest but clearly note that versions are ranges, not pinned, and transitive deps are not included.
- **Unknown licenses**: Mark as `NOASSERTION` per SPDX spec; do not guess.
- **Monorepo**: If multiple manifests are provided, generate one SBOM per package or a top-level aggregate — clarify with the user.
- **Private packages**: Include private package entries with `downloadLocation: NOASSERTION`.
- **Version ranges**: If a range is given (e.g., `^4.18.2`), note the minimum resolved version and recommend using a lock file.
