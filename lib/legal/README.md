# Legal RAG System

The Legal RAG (Retrieval-Augmented Generation) system provides legal guidance for child abuse incidents. This module is organized into separate files for better maintainability.

## Folder Structure

```
lib/legal/
├── index.ts          # Main export file (use this for imports)
├── api.ts            # API calls to the Legal RAG backend
├── types.ts          # TypeScript type definitions
├── utils.ts          # Utility functions for processing results
└── README.md         # This file
```

## Usage

### Import from the main index file

```typescript
import { 
  queryLegalRAG, 
  checkLegalAPIHealth,
  parseRoadmapSteps,
  validateLegalQuery 
} from "../lib/legal";
```

### Query for Legal Guidance

```typescript
const result = await queryLegalRAG({
  description: "Child was hit by parent",
  language: "si"  // "en" for English or "si" for Sinhala
});

// result contains:
// - detected_language: string
// - abuse_category: string
// - relevant_laws: LegalLaw[]
// - decision_roadmap: string[]
```

### Parse Roadmap Steps

```typescript
import { parseRoadmapSteps } from "../lib/legal";

const steps = parseRoadmapSteps(result.decision_roadmap);
// Returns an array of { number, title, description }
```

### Validate User Input

```typescript
import { validateLegalQuery } from "../lib/legal";

const validation = validateLegalQuery(userInput);
if (!validation.valid) {
  console.error(validation.error);
}
```

### Check API Health

```typescript
import { checkLegalAPIHealth } from "../lib/legal";

const isHealthy = await checkLegalAPIHealth();
```

## API Configuration

The Legal RAG API runs on `http://127.0.0.1:8000/api/rag`

- **Query Endpoint:** `POST /api/rag/query`
- **Health Endpoint:** `GET /api/rag/health`

## Type Definitions

### LegalQuery
```typescript
{
  description: string;
  language: "en" | "si";
}
```

### LegalResult
```typescript
{
  detected_language: string;
  abuse_category: string;
  relevant_laws: LegalLaw[];
  decision_roadmap: string[];
}
```

### LegalLaw
```typescript
{
  section: string;
  title: string;
  simple_explanation: string;
  reporting_guidance: string;
}
```

## Backward Compatibility

The old `lib/legalApi.ts` file re-exports from this module, so existing imports will continue to work.
