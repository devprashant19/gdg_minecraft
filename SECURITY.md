# Security Policy

## Supported Versions

We actively maintain and provide security patches for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| `0.1.x` | :white_check_mark: |
| `< 0.1` | :x:                |

---

## Reporting a Vulnerability

If you discover a security vulnerability within Voxel Island (CraftHacks), please follow responsible disclosure principles. **Do not disclose the vulnerability in public GitHub issues, discussions, or social media channels.**

### How to Report

Please report security vulnerabilities by emailing the core maintenance team at:
`security@crafthacks.dev` (or opening a private GitHub Security Advisory if available on the repository).

In your report, please include:
1. **Summary**: A clear description of the vulnerability.
2. **Steps to Reproduce**: Detailed proof of concept or reproduction steps.
3. **Impact**: Potential consequences if exploited (e.g., unauthorized database modification, RLS bypass, XSS).
4. **Suggested Remediation**: (Optional) Recommended code fixes or configuration changes.

### Our Commitment

- We will acknowledge receipt of your vulnerability report within **48 hours**.
- We will provide regular updates regarding our progress in assessing and fixing the issue.
- Once a fix is verified and deployed, we will publicly credit you in the release notes (unless you request anonymity).

---

## Security Invariants

When contributing or auditing code in this repository:
- **Supabase Row Level Security (RLS)**: Must remain enabled on all tables (`registrations`, `waitlist`, `audit_logs`).
- **Service Role Secrets**: The `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the client or imported in client components.
- **Input Validation**: All client payloads must pass strict [Zod](https://zod.dev) schema validation in API route handlers (`lib/schema.ts`).
- **Rate Limiting**: Public endpoints (e.g. `/api/register`) must implement abuse mitigation and rate limiting.

