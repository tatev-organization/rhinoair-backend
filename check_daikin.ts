import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`SELECT data FROM "PricingConfig" WHERE id = 'default_pricing'`);
    if (res.rows.length > 0) {
       let value = res.rows[0].data;
       if (typeof value === 'string') value = JSON.parse(value);
       
       const daikin48 = value.MULTI_CONDENSER.find((c: any) => c.id === 'daikin_48k');
       console.log("Current DB daikin_48k:", daikin48);
    }
  } catch (err) {
    console.error(err);
  }
  await pool.end();
}
main();
