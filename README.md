# Stytch to WorkOS Migration Tool

A Node.js tool for exporting user data from Stytch and importing it into WorkOS.

## Prerequisites

- Node.js v20 or higher
- Stytch account with API credentials
- WorkOS account with API key

## Installation

```bash
npm install
```

## Configuration

### Stytch Credentials

The tool supports both Consumer and B2B Stytch projects:

- **Consumer API**: Set credentials in the respective scripts or via environment variables
  - `STYTCH_PROJECT_ID`
  - `STYTCH_SECRET`

- **B2B API**: Update credentials in `b2bclient-exporter.js` and `export-b2b-stytch.ts`

### WorkOS Credentials

Update the API key in `workos scripts/import-user-membership.ts`:

```typescript
const workos = new WorkOS('your-api-key-here');
```

## Available Commands

### Export Commands

Export user and organization data from Stytch:

```bash
# Export B2B organizations and members (TypeScript)
npm run export-b2b

# Export B2B organizations and members (JavaScript)
npm run export-b2bclient-js

# Export consumer users via Search API
npm run export-search-api
```

### Import Command

Import exported Stytch data into WorkOS:

```bash
npm run import-to-workos
```

## Usage Workflow

### 1. Export from Stytch B2B

Run the export script to fetch all organizations and members:

```bash
npm run export-b2bclient-js
```

This creates:
- `exports/stytch-b2b-export.json` - Combined organizations and members

### 2. Import to WorkOS

Once exported, import the data into WorkOS:

```bash
npm run import-to-workos
```

The import process:
1. Creates all organizations in WorkOS
2. Creates user accounts for all active members
3. Links users to their organizations via memberships
4. Generates a mapping file with Stytch ID to WorkOS ID mappings

### 3. Review Results

After import, check:
- `exports/workos-import-mapping.json` - ID mappings and any errors
- Console output for success/failure summary

## File Structure

```
.
├── b2bclient-exporter.js       # B2B export script (JavaScript)
├── export-b2b-stytch.ts        # B2B export script (TypeScript)
├── search-API-exporter.js      # Consumer user export script
├── create-members-stytch.js    # Create members in Stytch from emails.json
├── create-users-stytch.js      # Create users in Stytch from emails.json
├── workos scripts/
│   ├── import-user-membership.ts  # Main import script to WorkOS
│   └── org-import.ts              # Organization import helper
└── exports/
    ├── stytch-b2b-export.json     # Combined export file
    ├── stytch-b2b-organizations.json
    ├── stytch-b2b-members.json
    ├── stytch-users-export.json
    └── workos-import-mapping.json # Generated after import
```

## Export File Format

### stytch-b2b-export.json

```json
{
  "organizations": [
    {
      "organization_id": "organization-test-...",
      "organization_name": "Example Org",
      "email_allowed_domains": ["example.com"]
    }
  ],
  "members": [
    {
      "member_id": "member-test-...",
      "organization_id": "organization-test-...",
      "email_address": "user@example.com",
      "name": "John Doe",
      "status": "active"
    }
  ]
}
```

### workos-import-mapping.json

```json
{
  "organizationMapping": {
    "organization-test-stytch-id": "org_workos_id"
  },
  "userMapping": {
    "member-test-stytch-id": "user_workos_id"
  },
  "errors": []
}
```

## Additional Tools

### Create Members from Email List

Add members to a Stytch B2B organization from `emails.json`:

```bash
node create-members-stytch.js
```

Edit the `ORGANIZATION_ID` constant in the script before running.

### Create Consumer Users

Create password-based users in Stytch Consumer from `emails.json`:

```bash
node create-users-stytch.js
```

Generates random passwords for each user.

## Error Handling

The import script continues processing even if individual users or organizations fail. All errors are:
- Logged to console with `[FAILED]` prefix
- Saved to the mapping file's `errors` array

## Notes

- Only members with `status: "active"` are imported to WorkOS
- User names are parsed into firstName and lastName fields
- Email verification status is preserved during import
- Organization domains are set to "pending" verification state
- The tool uses pagination to handle large datasets (1000 records per page)

## Troubleshooting

### "ENOENT: no such file or directory"

Make sure you've run the export command before trying to import. The import script requires `exports/stytch-b2b-export.json` to exist.

### "duplicate_email" errors

These occur when trying to create users that already exist in Stytch. This is expected behavior when running create scripts multiple times.

### Missing organizations during import

Verify that the export file contains both organizations and members. Run the export script again if needed.

## License

ISC

