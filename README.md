<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run locally

## Prerequisites

- Node.js 18+

## Setup

1. Install dependencies:
   `npm install`
2. Create a `.env` file from `.env.example`.
3. Set `AIHUBMIX_API_KEY` in `.env` (server-side only).
4. For demo/testing without real key, set `MOCK_AI=true`.
4. Start the app (frontend + API server):
   `npm run dev`

## Security note

- The API key is now read only by `server/index.ts`.
- The browser never stores or displays the key.
- If `MOCK_AI=true` (or key is missing), backend automatically returns mock content.
