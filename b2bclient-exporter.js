import { B2BClient } from 'stytch';
import { writeFile } from 'fs/promises';

const client = new B2BClient({
  project_id: process.env.STYTCH_PROJECT_ID,
  secret: process.env.STYTCH_SECRET,
});

async function exportOrganizations() {
  const allOrganizations = [];
  let cursor = '';

  do {
    const response = await client.organizations.search({
      cursor,
      limit: 1000,
    });

    allOrganizations.push(...response.organizations);
    cursor = response.results_metadata.next_cursor || '';
  } while (cursor);

  return allOrganizations;
}

async function exportMembers(organizationIds) {
  const allMembers = [];
  let cursor = '';

  do {
    const response = await client.organizations.members.search({
      organization_ids: organizationIds,
      cursor,
      limit: 1000,
    });

    allMembers.push(...response.members);
    cursor = response.results_metadata.next_cursor || '';
  } while (cursor);

  return allMembers;
}

// Export all data
console.log('Exporting organizations...');
const organizations = await exportOrganizations();
console.log(`Found ${organizations.length} organizations`);

const organizationIds = organizations.map((org) => org.organization_id);

console.log('Exporting members...');
const members = await exportMembers(organizationIds);
console.log(`Found ${members.length} members`);

// Write combined export
await writeFile('exports/stytch-b2b-export.json', JSON.stringify({ organizations, members }, null, 2));
console.log('Exported combined data to stytch-b2b-export.json');
