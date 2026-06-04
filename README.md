# QR Guard

**Scan any QR code or URL — know if it's safe in seconds.**

QR Guard analyzes links for phishing, malware, and other threats by running them through four security engines and an AI model. It traces every redirect hop, scores risk visually, and delivers a plain-English safety report.

---

## Features

- **QR Code & URL Scanning** ge Upload or drag-and-drop a QR image, or paste a URL directly. QR codes are decoded client-side before scanning.
- **Multi-Engine Threat Detection** - Four independent sources run in parallel:
  - **VirusTotal** - Aggregated antivirus database
  - **Google Safe Browsing** - Google's real-time blocklist
  - **URLhaus** - abuse.ch collaborative malware feed
  - **Groq Llama-3 AI** - Semantic analysis of URL structure, redirect chain, and threat signals with a natural-language risk assessment
- **Redirect Chain Tracing** - Follows every server-side redirect up to 8 hops, detecting domain changes and circular loops
- **Heuristic Scoring** - Evaluates HTTPS status, redirect depth, domain changes, suspicious keywords (login, verify, bank, crypto, etc.), and IP-based hosting
- **Risk Score Dashboard** - Visual circular gauge with SAFE / SUSPICIOUS / DANGEROUS classification
- **Scan History** - Per-user history with search and status filtering, persisted across sessions
- **User Authentication** - Powered by Clerk; sandbox bypass available for development
- **Usage Limits** - Daily scan quotas by plan: FREE (5), PRO (500), ENTERPRISE (unlimited)
- **Dark / Light Mode** - Persisted theme preference
- **Responsive Design** - Mobile-first layout with Tailwind CSS v4

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4 |
| Backend | Vercel Serverless Functions (Node.js, TypeScript) |
| Auth | Clerk |
| AI | Groq (Llama-3.3-70b) |
| Threat Intel | VirusTotal v2, Google Safe Browsing v4, URLhaus |
| Dev Server | Express + Vite middleware via `tsx` |
| Hosting | Vercel (static SPA + serverless API) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/ogtamimi/qr-guard.git
cd qr-guard
npm install
```

### Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key for Llama-3 AI analysis |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (client-side) |
| `CLERK_SECRET_KEY` | Clerk secret key (server-side) |
| `VIRUSTOTAL_API_KEY` | VirusTotal v2 API key |
| `GOOGLE_SAFE_BROWSING_API_KEY` | Google Safe Browsing v4 API key |

All keys are optional — missing ones degrade gracefully. Scans still run using heuristics and whatever engines are configured.

### Running Locally

```bash
npm run dev
```

Starts an Express + Vite dev server at `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

Builds the frontend with Vite and bundles `server.ts` into `dist/`, then serves the SPA with Express.

### Deploy to Vercel

Push to GitHub and import the repo in the [Vercel dashboard](https://vercel.com). The `vercel.json` config handles SPA routing rewrites; API functions in `api/` are automatically deployed as serverless functions.

---

## How It Works

1. **Input** - User uploads a QR image (decoded client-side with jsQR) or pastes a URL
2. **Scan Request** - Sent to `POST /api/scan`
3. **Redirect Tracing** - Follows the full HTTP redirect chain, up to 8 hops, with manual redirect mode
4. **Parallel Threat Queries** - VirusTotal, Google Safe Browsing, and URLhaus queried simultaneously
5. **DNS Resolution** - Resolves A, NS, and MX records to validate domain infrastructure
6. **Heuristic Scoring** - Calculates a base risk score from all gathered signals
7. **AI Enhancement** - If `GROQ_API_KEY` is set, scan metadata goes to Llama-3.3-70b for semantic analysis and a natural-language risk report
8. **Response** - Combined result displayed in the dashboard

---

## API Reference

### `POST /api/scan`

Scans a URL for security threats.

**Request body:**
```json
{
  "url": "https://example.com",
  "inputType": "DIRECT_URL"
}
```

**Response:** A `ScanResult` object containing the risk score, classification, redirect chain, AI summary, and per-engine threat results.

### `GET /api/health`

Returns the connection status of all configured API backends.

### `POST /api/admin/set-role`

Sets a user's role in Clerk. Protected by an `x-setup-key` header that must match the `SETUP_SECRET` environment variable.

---

## Project Structure

```
qr-guard/
├── api/                        # Vercel serverless functions
│   ├── _utils.ts               # Shared utilities (redirect chain, DNS, threat lookups)
│   ├── scan.ts                 # POST /api/scan
│   ├── health.ts               # GET /api/health
│   └── admin/set-role.ts       # POST /api/admin/set-role
├── src/
│   ├── App.tsx                 # Root component: routing, scan logic, pricing
│   ├── types.ts                # Shared TypeScript types
│   ├── components/
│   │   ├── auth/               # Clerk auth modal + sandbox bypass
│   │   ├── dashboard/          # Landing page, scan history, usage stats
│   │   ├── results/            # Risk gauge, AI panel, threat detail widgets
│   │   └── scanner/            # QR drag-and-drop decoder, URL input form
│   └── pages/                  # Admin, payment success/cancel pages
├── server.ts                   # Dev server (Express + Vite middleware)
├── vercel.json                 # Vercel deployment config
├── vite.config.ts
└── .env.example                # Environment variable template
```

---


## License

[Apache 2.0](LICENSE)