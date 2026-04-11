import dotenv from 'dotenv';
import { withNeonClient } from './_neonClient';

dotenv.config();

async function main() {
  await withNeonClient(async (client) => {
    const result = await client.query('SELECT NOW() AS now, current_database() AS database_name, current_user AS current_user;');
    console.log(JSON.stringify(result.rows[0], null, 2));
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
