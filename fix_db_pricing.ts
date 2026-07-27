import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`SELECT data FROM "PricingConfig" WHERE id = 'default_pricing'`);
    console.log(`Found ${res.rows.length} rows`);
    if (res.rows.length > 0) {
       let value = res.rows[0].data;
       if (typeof value === 'string') value = JSON.parse(value);
       console.log("Tier 4 is:", value.TIER_ANCHORS["4"]);
       
       if (value.TIER_ANCHORS["4"] == 16525) {
         value.TIER_ANCHORS["4"] = 16500;
         await pool.query(`UPDATE "PricingConfig" SET data = $1 WHERE id = 'default_pricing'`, [value]);
         console.log("UPDATED PricingConfig successfully!");
       }
    }
  } catch (err) {
    console.error(err);
  }
  await pool.end();
}
main();
