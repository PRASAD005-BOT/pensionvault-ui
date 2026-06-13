const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://pensionvault_db_user:e465vmR9nGn5ZJEjqNdYDsZgN9tv8sKF@dpg-d8mj067lk1mc738oe5lg-a.oregon-postgres.render.com/pensionvault_db',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM "Employers"');
    console.table(res.rows);
  } catch (err) {
    console.error("Database Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
