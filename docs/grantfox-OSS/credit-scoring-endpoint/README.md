# Credit Scoring Endpoint — Evidence

## Changes Made

### 1. Backend Scoring Service (`src/services/scoring.service.ts`)
- Extended `computeAgriTrustScore` to compute `expectedHarvestValue` from activity events.
- Logic: sum of `harvest_log` amounts; if none, estimate from `planting` amounts × 1.5; otherwise 0.
- Result is deterministic and bounded (non-negative).

### 2. Types (`src/types/vyc.types.ts`)
- Added `expectedHarvestValue: number` to `ScoreResult`.

### 3. API Route (`src/routes/score.routes.ts`)
- Existing `POST /score` endpoint now returns `expectedHarvestValue` inside `data`.
- Input validation already rejects malformed events with clear errors.

### 4. Unit Tests (`src/services/scoring.service.test.ts`)
Added 3 new test cases:
- `computes expectedHarvestValue from harvest_log amounts`
- `estimates expectedHarvestValue from planting when no harvest_log present`
- `returns 0 expectedHarvestValue when neither harvest_log nor planting present`

### 5. Documentation (`backend/README.md`)
- Updated `/score` endpoint description to include `expectedHarvestValue`.

## How to Verify Locally

```bash
cd backend
npm run build
npm run test
```

The `/score` endpoint accepts:
```json
{
  "farmer": "G...",
  "activities": [
    { "type": "seed_purchase", "amount": 40, "timestamp": 1700000000, "region": "NG-LA" },
    { "type": "planting", "amount": 20, "timestamp": 1700000000, "region": "NG-LA" },
    { "type": "harvest_log", "amount": 30, "timestamp": 1700000000, "region": "NG-LA" },
    { "type": "sales", "amount": 80, "timestamp": 1700000000, "region": "NG-LA" }
  ]
}
```

And returns:
```json
{
  "success": true,
  "data": {
    "score": 0,
    "label": "low",
    "factors": { "base": 0, "consistency": 0, "recency": 0, "volume": 0, "diversity": 0 },
    "explanation": "...",
    "activityHash": "...",
    "timestamp": 1700000000,
    "expectedHarvestValue": 30
  }
}
```
