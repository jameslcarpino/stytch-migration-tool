import * as stytch from "stytch";
import { readFile } from "fs/promises";

const client = new stytch.B2BClient({
  project_id: "project-id",
  secret: "secretkey",
});

// Configuration
const ORGANIZATION_ID =
  "organization-test-04841e24-65e4-42b5-96bd-43cb2e44f903";

// Main execution: Read emails.json and create members
(async () => {
  try {
    console.log("📧 Reading emails...\n");

    const emailsData = await readFile("./emails.json", "utf-8");
    const { emails } = JSON.parse(emailsData);

    console.log(`Found ${emails.length} emails to process\n`);
    console.log("Creating members using Stytch B2B API...\n");

    for (const email of emails) {
      const params = {
        organization_id: ORGANIZATION_ID,
        email_address: email,
      };

      try {
        const response = await client.organizations.members.create(params);
        console.log(
          `${email} - Member created (ID: ${response.member.member_id})`
        );
      } catch (error) {
        console.error(`${email} - Error: ${error.message}`);
      }
    }

    console.log(" Done processing all emails!");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
})();
