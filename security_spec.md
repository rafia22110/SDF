# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default-Deny Catch-All**: All paths not explicitly matched in `/databases/{database}/documents` are strictly denied (`allow read, write: if false;`).
2. **Ownership & Verified Identity**: A `Pdf3DModel` document in `/pdf3dModels/{modelId}` can only be created, read, updated, or deleted by an authenticated user with a verified email (`request.auth.token.email_verified == true`) whose `request.auth.uid` matches `ownerId`.
3. **Strict Key & Volumetric Boundaries**: Every `Pdf3DModel` document enforces exact required keys (`hasAll` + `hasOnly`), string length bounds (`title <= 120`, `fileName <= 160`, `summary <= 800`, `authorName <= 80`, `ownerId <= 128`), enum allowlists (`theme`, `category`), bounded array (`nodes.size() >= 1 && nodes.size() <= 8`), and server timestamps (`createdAt == request.time`, `updatedAt == request.time`).
4. **Immutable Fields**: `ownerId`, `fileName`, and `createdAt` cannot be modified during `update`.
5. **Query Enforcer on List**: `allow list` on `/pdf3dModels/{modelId}` strictly checks `resource.data.ownerId == request.auth.uid` so clients cannot scrape other users' documents.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `auth == null` attempting to create `/pdf3dModels/model_1` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: Authenticated user with `email_verified: false` attempting to create `/pdf3dModels/model_1` -> `PERMISSION_DENIED`.
3. **Identity Spoofing on Create**: User `uid_A` attempting to create a model with `ownerId: "uid_B"` -> `PERMISSION_DENIED`.
4. **Shadow/Ghost Field Injection on Create**: Payload containing an extra undeclared field `isAdmin: true` -> `PERMISSION_DENIED`.
5. **ID Poisoning**: Document ID `modelId` containing spaces, slashes, or exceeding 128 characters -> `PERMISSION_DENIED`.
6. **Denial-of-Wallet Oversized String**: `summary` field with 50,000 characters (> 800 limit) -> `PERMISSION_DENIED`.
7. **Invalid Enum Value**: `theme: "hacked-theme"` not in the allowed 6 themes -> `PERMISSION_DENIED`.
8. **Unbounded Array Injection**: `nodes` array with 50 items (> 8 limit) or non-string element -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: `createdAt` set to a past/future timestamp instead of `request.time` -> `PERMISSION_DENIED`.
10. **Owner Hijack on Update**: Updating `ownerId` from `uid_A` to `uid_B` -> `PERMISSION_DENIED`.
11. **CreatedAt Mutation on Update**: Changing `createdAt` during an update -> `PERMISSION_DENIED`.
12. **Blanket List Scraping**: User `uid_B` listing `/pdf3dModels` without filtering `ownerId == uid_B` -> `PERMISSION_DENIED`.
