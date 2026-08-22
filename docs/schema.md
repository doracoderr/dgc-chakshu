# Database Schema

MongoDB collections for DGC Chakshu Phase 1. All collections include `createdAt` and `updatedAt` timestamps (via Mongoose `timestamps: true`).

---

## `blocks`

Represents a campus building/block.

| Field | Type | Notes |
|---|---|---|
| `name` | String | e.g. "Block A", "Main Building" |
| `code` | String | Short code, e.g. "A" |
| `description` | String | Optional |
| `coverImage` | String | URL, optional |
| `floorCount` | Number | |
| `location` | { lat: Number, lng: Number } | Optional, for future map integration |

## `floors`

| Field | Type | Notes |
|---|---|---|
| `blockId` | ObjectId → `blocks` | |
| `floorNumber` | Number | Ground = 0 |
| `label` | String | e.g. "Ground Floor" |

## `rooms`

| Field | Type | Notes |
|---|---|---|
| `floorId` | ObjectId → `floors` | |
| `blockId` | ObjectId → `blocks` | Denormalized for faster queries |
| `roomNumber` | String | |
| `name` | String | e.g. "Computer Lab 2" |
| `type` | String (enum) | `classroom`, `lab`, `office`, `facility`, `other` |
| `departmentId` | ObjectId → `departments` | Optional |
| `photos` | [String] | Image URLs |
| `verified` | Boolean | Default `false` until reviewed |
| `verifiedBy` | String | Name/ID of verifier |
| `verifiedAt` | Date | |

## `departments`

| Field | Type | Notes |
|---|---|---|
| `name` | String | |
| `code` | String | Short code |
| `blockId` | ObjectId → `blocks` | Primary location |
| `description` | String | |
| `hodName` | String | Head of Department, if approved for display |
| `contactEmail` | String | Only official/public department email |

## `faculty`

Only approved, public-facing professional information is stored here — never personal contact details.

| Field | Type | Notes |
|---|---|---|
| `name` | String | |
| `designation` | String | |
| `departmentId` | ObjectId → `departments` | |
| `roomId` | ObjectId → `rooms` | Office/cabin, optional |
| `photo` | String | URL, optional, must be authorized |
| `approvedForDisplay` | Boolean | Must be `true` to appear publicly |

## `facilities`

Public facilities not tied to a specific department (canteen, library, washrooms, admin office, etc.)

| Field | Type | Notes |
|---|---|---|
| `name` | String | |
| `type` | String | e.g. `canteen`, `library`, `admin`, `washroom` |
| `blockId` | ObjectId → `blocks` | |
| `roomId` | ObjectId → `rooms` | Optional |
| `description` | String | |
| `photos` | [String] | |

---

## Conventions

- All `ObjectId` references use Mongoose `ref` for population.
- Only `verified: true` / `approvedForDisplay: true` records should be served by public-facing GET routes.
- No personal phone numbers or private emails are ever stored in these collections — see `docs/contributing.md` for data privacy rules.

## Status

Schema will evolve as Phase 1 development progresses. Any structural change should be proposed and reviewed via PR, and this file updated in the same PR.
