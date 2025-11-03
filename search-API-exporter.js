import * as stytch from "stytch";
import { writeFile } from "fs/promises";

const client = new stytch.Client({
  project_id: process.env.STYTCH_PROJECT_ID || "project-id",
  secret: process.env.STYTCH_SECRET || "secret-id",
  env: stytch.envs.test,
});

//leave params empty to get all users
let params = {};
client.users
  .search(params)
  .then(async (resp) => {
    console.log(
      `Found ${resp.results.length} users (total: ${resp.results_metadata.total})`
    );

    // Export to JSON file
    await writeFile(
      "exports/stytch-users-SEARCH-API-export.json",
      JSON.stringify(resp, null, 2)
    );
    console.log("export users to stytch-users-SEARCH-API-export.json");
  })
  .catch((err) => {
    console.log(err);
  });
