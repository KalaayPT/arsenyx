# Arsenix Testing Plan

This document outlines the strategy for adding tests to the Arsenix codebase.

## Test Framework Choice

**Recommendation: Bun's built-in test runner**

Bun includes a fast, Jest-compatible test runner out of the box. Since Arsenix already uses Bun as its package manager, this is the natural choice:

- Zero additional dependencies
- Native TypeScript support
- Fast execution
- Compatible with Jest matchers via `bun:test`

### Setup Required

Add to `package.json`:
```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

## Testing Priority Matrix

### Priority 1: Critical Pure Functions (Unit Tests)

These are pure functions with complex logic that form the core of the application. They have no external dependencies and are ideal for unit testing.

| Module | File | Risk Level | Complexity |
|--------|------|------------|------------|
| Stats Calculator | `src/lib/warframe/stats-calculator.ts` | Critical | High |
| Stat Parser | `src/lib/warframe/stat-parser.ts` | Critical | High |
| Capacity Calculator | `src/lib/warframe/capacity.ts` | High | Medium |
| Build Codec | `src/lib/warframe/build-codec.ts` | High | Medium |
| Stat Caps | `src/lib/warframe/stat-caps.ts` | Medium | Low |

### Priority 2: Database Operations (Integration Tests)

These require a test database but are critical for data integrity.

| Module | File | Operations |
|--------|------|------------|
| Build CRUD | `src/lib/db/builds.ts` | create, update, delete, visibility checks |
| Votes | `src/lib/db/votes.ts` | toggle, rate limiting, uniqueness |
| Favorites | `src/lib/db/favorites.ts` | toggle, uniqueness |
| Items | `src/lib/db/items.ts` | queries, caching |
| Mods | `src/lib/db/mods.ts` | queries, compatibility filtering |

### Priority 3: Server Actions (Integration Tests)

Require auth mocking and database access.

| Action | File | Key Behaviors |
|--------|------|---------------|
| saveBuildAction | `src/app/actions/builds.ts` | auth check, create/update logic |
| deleteBuildAction | `src/app/actions/builds.ts` | ownership verification |
| toggleVoteAction | `src/app/actions/social.ts` | rate limiting, auth |
| toggleFavoriteAction | `src/app/actions/social.ts` | auth, revalidation |

### Priority 4: Utility Functions (Unit Tests)

Lower risk but still valuable.

| Module | File |
|--------|------|
| Image URLs | `src/lib/warframe/images.ts` |
| Slug Generation | `src/lib/warframe/slugs.ts` |
| Mod Utilities | `src/lib/warframe/mods.ts` |
| Categories | `src/lib/warframe/categories.ts` |

### Priority 5: Component Tests (Future)

React component testing can be added later using `@testing-library/react`.

---

## Detailed Test Plans

### 1. Stats Calculator Tests

**File:** `src/lib/warframe/__tests__/stats-calculator.test.ts`

```typescript
// Test cases to implement:

describe('calculateWarframeStats', () => {
  it('calculates base stats without mods')
  it('applies health mods correctly')
  it('applies shield mods correctly')
  it('applies armor mods correctly')
  it('applies energy mods correctly')
  it('calculates Umbral set bonuses (2-piece, 3-piece)')
  it('applies stat caps correctly')
  it('handles empty mod slots')
})

describe('calculateAbilityStats', () => {
  it('calculates base ability stats (100% each)')
  it('applies strength mods')
  it('applies duration mods')
  it('applies efficiency mods (with cap)')
  it('applies range mods')
  it('handles negative efficiency correctly')
})

describe('calculateWeaponStats', () => {
  it('calculates base damage')
  it('applies damage mods (Serration, etc.)')
  it('applies multishot mods')
  it('calculates critical chance and damage')
  it('calculates status chance')
  it('applies fire rate mods')
  it('handles elemental damage combinations')
})
```

### 2. Stat Parser Tests

**File:** `src/lib/warframe/__tests__/stat-parser.test.ts`

```typescript
describe('parseModStats', () => {
  it('extracts percentage stats from levelStats')
  it('extracts flat stats from levelStats')
  it('handles conditional mods (on kill, on hit)')
  it('falls back to description parsing when levelStats missing')
  it('handles multi-effect mods')
  it('normalizes stat names correctly')
})

describe('parseStatValue', () => {
  it('parses "+100% Health" correctly')
  it('parses "-50% Recoil" correctly')
  it('parses "+15 Energy Max" correctly')
  it('handles percentage ranges')
})
```

### 3. Capacity Calculator Tests

**File:** `src/lib/warframe/__tests__/capacity.test.ts`

```typescript
describe('calculateModDrain', () => {
  it('returns base drain for neutral polarity slot')
  it('halves drain for matching polarity')
  it('adds 25% for mismatched polarity')
  it('handles zero-drain mods')
})

describe('calculateTotalCapacity', () => {
  it('calculates total from all placed mods')
  it('includes aura bonus correctly')
  it('handles empty builds')
  it('returns remaining capacity')
})
```

### 4. Build Codec Tests

**File:** `src/lib/warframe/__tests__/build-codec.test.ts`

```typescript
describe('encodeBuild', () => {
  it('encodes empty build state')
  it('encodes build with mods')
  it('encodes build with arcanes')
  it('encodes build with shards')
  it('produces URL-safe base64')
})

describe('decodeBuild', () => {
  it('decodes encoded build correctly')
  it('handles invalid base64 gracefully')
  it('handles version mismatches')
  it('roundtrips complex builds')
})
```

### 5. Database Integration Tests

**File:** `src/lib/db/__tests__/builds.test.ts`

```typescript
// Requires test database setup

describe('createBuild', () => {
  it('creates build with valid data')
  it('generates unique slug')
  it('sets correct visibility')
  it('associates with user')
})

describe('updateBuild', () => {
  it('updates owned build')
  it('rejects update for non-owner')
  it('updates all fields correctly')
})

describe('deleteBuild', () => {
  it('deletes owned build')
  it('cascades to related records')
  it('rejects delete for non-owner')
})
```

---

## Test File Structure

```
src/
├── lib/
│   ├── warframe/
│   │   ├── __tests__/
│   │   │   ├── stats-calculator.test.ts
│   │   │   ├── stat-parser.test.ts
│   │   │   ├── capacity.test.ts
│   │   │   ├── build-codec.test.ts
│   │   │   ├── images.test.ts
│   │   │   └── slugs.test.ts
│   │   └── ...
│   └── db/
│       ├── __tests__/
│       │   ├── builds.test.ts
│       │   ├── votes.test.ts
│       │   └── favorites.test.ts
│       └── ...
├── app/
│   └── actions/
│       └── __tests__/
│           ├── builds.test.ts
│           └── social.test.ts
└── test/
    ├── setup.ts           # Global test setup
    ├── fixtures/          # Test data
    │   ├── mods.ts
    │   ├── items.ts
    │   └── builds.ts
    └── helpers/
        ├── db.ts          # Test database utilities
        └── auth.ts        # Auth mocking utilities
```

---

## Test Database Strategy

For integration tests that require database access:

1. **Option A: SQLite in-memory** (simpler)
   - Fast, no external dependencies
   - May have slight Prisma behavior differences

2. **Option B: PostgreSQL test container** (recommended)
   - Exact production parity
   - Use `testcontainers` package
   - Slightly slower but more reliable

### Test Database Setup

```typescript
// src/test/helpers/db.ts
import { PrismaClient } from '@prisma/client'

let testPrisma: PrismaClient

export async function setupTestDb() {
  testPrisma = new PrismaClient({
    datasources: {
      db: { url: process.env.TEST_DATABASE_URL }
    }
  })
  await testPrisma.$connect()
  return testPrisma
}

export async function cleanupTestDb() {
  // Truncate all tables
  await testPrisma.$executeRaw`TRUNCATE TABLE "Build" CASCADE`
  // ... other tables
}

export async function teardownTestDb() {
  await testPrisma.$disconnect()
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Add test scripts to package.json
- [ ] Create test directory structure
- [ ] Set up test fixtures with sample Warframe data
- [ ] Write first unit tests for `capacity.ts` (simplest module)

### Phase 2: Core Logic (Week 2-3)
- [ ] Complete `stats-calculator.ts` tests
- [ ] Complete `stat-parser.ts` tests
- [ ] Complete `build-codec.ts` tests
- [ ] Achieve >80% coverage on core modules

### Phase 3: Database Layer (Week 4)
- [ ] Set up test database infrastructure
- [ ] Write integration tests for `builds.ts`
- [ ] Write integration tests for `votes.ts` and `favorites.ts`

### Phase 4: Server Actions (Week 5)
- [ ] Set up auth mocking
- [ ] Test `saveBuildAction` and `deleteBuildAction`
- [ ] Test social actions with rate limiting

### Phase 5: Utilities & Polish (Week 6)
- [ ] Test remaining utility functions
- [ ] Add coverage reporting to CI
- [ ] Document testing patterns for contributors

---

## Sample Test Implementation

Here's a starter test for the capacity calculator:

```typescript
// src/lib/warframe/__tests__/capacity.test.ts
import { describe, it, expect } from 'bun:test'
import { calculateModDrain, calculateTotalCapacity } from '../capacity'

describe('calculateModDrain', () => {
  it('returns base drain for neutral polarity slot', () => {
    const mod = { drain: 10 }
    const slotPolarity = null

    expect(calculateModDrain(mod, slotPolarity)).toBe(10)
  })

  it('halves drain for matching polarity', () => {
    const mod = { drain: 10, polarity: 'madurai' }
    const slotPolarity = 'madurai'

    expect(calculateModDrain(mod, slotPolarity)).toBe(5)
  })

  it('adds 25% for mismatched polarity', () => {
    const mod = { drain: 10, polarity: 'madurai' }
    const slotPolarity = 'vazarin'

    expect(calculateModDrain(mod, slotPolarity)).toBe(13) // 10 * 1.25 rounded
  })
})
```

---

## CI Integration

Add to GitHub Actions workflow:

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install

      - run: bun test

      - run: bun test --coverage
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Core module coverage | >80% |
| Database layer coverage | >70% |
| Server actions coverage | >60% |
| All tests passing in CI | 100% |
| Test execution time | <30 seconds |

---

## Notes

- Start with pure functions - they're easiest to test and highest value
- Don't test shadcn/ui components directly - they're already tested upstream
- Focus on business logic, not UI rendering initially
- Use real Warframe mod/item data in fixtures for realistic tests
- Consider snapshot testing for complex stat calculations
