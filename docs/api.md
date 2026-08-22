# API Reference

Base URL (local): `http://localhost:5000/api`

All responses follow this shape:

**Success**
```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

**Failure**
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

---

## Health

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Server uptime and status check |

## Blocks & Directory

| Method | Route | Description |
|---|---|---|
| GET | `/blocks` | List all campus blocks/buildings |
| GET | `/blocks/:id` | Get a single block's details |
| GET | `/blocks/:id/floors` | List floors within a block |
| GET | `/blocks/:id/rooms` | List all rooms within a block |
| GET | `/rooms/:id` | Get a single room's detail (photo, floor, department) |

## Departments

| Method | Route | Description |
|---|---|---|
| GET | `/departments` | List all departments |
| GET | `/departments/:id` | Get a single department's detail (location, faculty, facilities) |

## Faculty

| Method | Route | Description |
|---|---|---|
| GET | `/faculty` | List all approved faculty entries |
| GET | `/faculty/:id` | Get a single faculty member's approved public detail |

## Search

| Method | Route | Description |
|---|---|---|
| GET | `/search?q=` | Search across rooms, departments, facilities and faculty |

## Facilities

| Method | Route | Description |
|---|---|---|
| GET | `/facilities` | List public facilities (labs, offices, canteens, etc.) |
| GET | `/facilities/:id` | Get a single facility's detail |

---

## Status

This is the **planned Phase 1 route set**. Routes are added here as they are implemented — if you build a new endpoint, add it to this file in the same PR.

## Notes for contributors

- Keep controllers thin: validate input → call service → return response.
- Use the standard response shape above for every route, success or failure.
- Never return raw Mongoose documents — map to a clean response object.
- Document new query params (pagination, filters) directly in this table.
