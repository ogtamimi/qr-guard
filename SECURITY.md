# Security Policy

## Supported Versions

Only the latest version (main branch) receives security updates.

## Reporting a Vulnerability

QR Guard handles URL scanning and user authentication. If you discover a security vulnerability, please report it privately.

**Do not** report security issues via public GitHub issues.

Instead, contact the maintainer directly:

- **Email:** ogttamimi@gmail.com
- **GitHub:** [@ogtamimi](https://github.com/ogtamimi)

You can expect:

- **Acknowledgment** within 48 hours of your report.
- **An initial assessment** within 5 business days.
- **A fix timeline** communicated once the assessment is complete.

## Scope

We take the following seriously:

- Exposure of API keys or secrets (Clerk, Groq, VirusTotal, Google Safe Browsing)
- Authentication bypass or session hijacking via Clerk integration
- Injection attacks through the URL scanning endpoint
- Cross-site scripting (XSS) in the scan results display
- Exposure of user scan history or personal data

## Disclosure Policy

When a vulnerability is reported:

1. We confirm the issue and determine affected versions.
2. We develop and test a fix.
3. We release a security update and disclose the issue publicly after users have had reasonable time to update.

