import * as stytch from "stytch";
import { readFile } from "fs/promises";

const client = new stytch.Client({
  project_id: "project-id",
  secret: process.env.STYTCH_SECRET || "secret-id",
});

/**
 * Generate a random secure password
 * @param {number} length - Length of the password (default: 20)
 * @returns {string} - A randomly generated password
 */
const generatePassword = (length = 20) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
};

/**
 * Create passwords for a list of emails
 * @param {string[]} emails - Array of email addresses
 * @param {number} sessionDurationMinutes - Session duration in minutes (default: 60)
 * @returns {Promise<Array>} - Array of results with email, password, and status
 */
export const createPasswordsForEmails = async (
  emails,
  sessionDurationMinutes = 60
) => {
  const results = [];

  for (const email of emails) {
    const password = generatePassword();

    try {
      const response = await client.passwords.create({
        email: email,
        password: password,
        session_duration_minutes: sessionDurationMinutes,
      });

      results.push({
        email: email,
        password: password,
        status: "success",
        response: response,
      });

      console.log(`✓ Password created for ${email}`);
    } catch (error) {
      results.push({
        email: email,
        password: password,
        status: "error",
        error: error.message,
      });

      console.error(`✗ Failed to create password for ${email}:`, error.message);
    }
  }

  return results;
};

/**
 * Create a single password for one email
 * @param {string} email - Email address
 * @param {string} password - Optional custom password (if not provided, will be auto-generated)
 * @param {number} sessionDurationMinutes - Session duration in minutes (default: 60)
 */
export const createPassword = async (
  email,
  password = null,
  sessionDurationMinutes = 60
) => {
  const finalPassword = password || generatePassword();

  try {
    const response = await client.passwords.create({
      email: email,
      password: finalPassword,
      session_duration_minutes: sessionDurationMinutes,
    });

    console.log(`✓ Password created for ${email}`);
    return {
      email: email,
      password: finalPassword,
      status: "success",
      response: response,
    };
  } catch (error) {
    console.error(`✗ Failed to create password for ${email}:`, error.message);
    return {
      email: email,
      password: finalPassword,
      status: "error",
      error: error.message,
    };
  }
};

// Main execution: Read emails.json and create passwords
(async () => {
  try {
    console.log("📧 Reading emails from emails.json...\n");

    const emailsData = await readFile("./emails.json", "utf-8");
    const { emails } = JSON.parse(emailsData);

    console.log(`Found ${emails.length} emails to process\n`);
    console.log("🔐 Creating passwords using Stytch API...\n");

    for (const email of emails) {
      const password = generatePassword();

      try {
        await client.passwords.create({
          email: email,
          password: password,
          session_duration_minutes: 60,
        });

        console.log(`✓ ${email} - Password: ${password}`);
      } catch (error) {
        console.error(`✗ ${email} - Error: ${error.message}`);
      }
    }

    console.log("\n✅ Done processing all emails!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
