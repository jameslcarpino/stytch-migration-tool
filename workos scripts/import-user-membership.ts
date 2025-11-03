import { WorkOS } from "@workos-inc/node";
import { readFile, writeFile } from "fs/promises";

const workos = new WorkOS("sk-key");

// Import organization function
async function importOrganization(stytchOrg: any) {
  const domainData =
    stytchOrg.email_allowed_domains?.map((domain: string) => ({
      domain,
      state: "pending",
    })) || [];

  const org = await workos.organizations.createOrganization({
    name: stytchOrg.organization_name,
    domainData,
  });

  return org;
}

// Import user function
async function importUser(stytchMember: any) {
  // Parse name into first and last name
  const nameParts = stytchMember.name?.split(" ") || [];
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const user = await workos.userManagement.createUser({
    email: stytchMember.email_address,
    emailVerified: stytchMember.email_address_verified,
    firstName,
    lastName,
  });

  return user;
}

// Create membership function
async function createMembership(
  workosUserId: string,
  workosOrgId: string,
  roleSlug: string = "member"
) {
  return await workos.userManagement.createOrganizationMembership({
    userId: workosUserId,
    organizationId: workosOrgId,
    roleSlug,
  });
}

// Main execution
(async () => {
  try {
    console.log("Reading Stytch export...");
    const exportData = await readFile(
      "../exports/stytch-b2b-export.json",
      "utf-8"
    );
    const { organizations, members } = JSON.parse(exportData);

    // Step 1: Import organizations and create mapping
    console.log("Importing organizations...");
    const orgIdMapping = new Map();

    for (const stytchOrg of organizations) {
      try {
        const workosOrg = await importOrganization(stytchOrg);
        orgIdMapping.set(stytchOrg.organization_id, workosOrg.id);
        console.log(
          `[SUCCESS] ${stytchOrg.organization_name} -> ${workosOrg.id}`
        );
      } catch (error: any) {
        console.error(
          `[FAILED] Import ${stytchOrg.organization_name}: ${error.message}`
        );
      }
    }

    console.log(`\nImported ${orgIdMapping.size} organizations\n`);

    // Step 2: Import only active members
    console.log("Importing members...");
    const activeMembers = members.filter((m: any) => m.status === "active");
    console.log(`Processing ${activeMembers.length} active members\n`);

    const userIdMapping = new Map();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const stytchMember of activeMembers) {
      try {
        const workosUser = await importUser(stytchMember);
        userIdMapping.set(stytchMember.member_id, workosUser.id);

        const workosOrgId = orgIdMapping.get(stytchMember.organization_id);
        if (workosOrgId) {
          await createMembership(workosUser.id, workosOrgId);
          console.log(
            `[SUCCESS] ${stytchMember.email_address} -> ${workosUser.id}`
          );
          results.success++;
        } else {
          console.warn(
            `[WARNING] No WorkOS org found for ${stytchMember.email_address}`
          );
          results.failed++;
        }
      } catch (error: any) {
        console.error(
          `[FAILED] Import ${stytchMember.email_address}: ${error.message}`
        );
        results.failed++;
        results.errors.push({
          email: stytchMember.email_address,
          error: error.message,
        });
      }
    }

    console.log("\nSummary:");
    console.log(`Successful: ${results.success}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Total: ${activeMembers.length}`);

    // Save mapping to file
    const mappingData = {
      organizationMapping: Object.fromEntries(orgIdMapping),
      userMapping: Object.fromEntries(userIdMapping),
      errors: results.errors,
    };

    await writeFile(
      "../exports/workos-import-mapping.json",
      JSON.stringify(mappingData, null, 2)
    );
    console.log("\nSaved ID mappings to exports/workos-import-mapping.json");
  } catch (error: any) {
    console.error("ERROR:", error.message);
    process.exit(1);
  }
})();
