const { Pool } = require('/home/simon/Projects/wick-wax-relax/backend/node_modules/pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: process.env.DB_PASS || 'LocalDev123', database: 'wick_wax_relax' });

async function test() {
  const searchQuery = 'wax';
  const params = [];
  
  // relevance_rank needs raw searchQuery as $1
  params.unshift(searchQuery);
  const searchPattern = '%' + searchQuery + '%';
  params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  
  params.push(5, 0); // limit=5, offset=0

  const sql = `
    SELECT
      p.id, p.name,
      CASE
        WHEN LOWER(p.name) = LOWER($1) THEN 1
        WHEN LOWER(p.name) LIKE LOWER($1 || '%') THEN 2
        WHEN LOWER(p.name) LIKE LOWER('%' || $1 || '%') THEN 3
        ELSE 4
      END as relevance_rank
    FROM products p
    WHERE LOWER(p.name) LIKE LOWER($2) OR LOWER(p.description) LIKE LOWER($3)
    ORDER BY relevance_rank ASC
    LIMIT $6 OFFSET $7
  `;
  
  console.log('PARAMS:', params);
  console.log('SQL param count in query: 5 ($1-$5), params length:', params.length);
  
  try {
    const result = await pool.query(sql, params);
    console.log('SUCCESS:', result.rows.length, 'rows');
    if (result.rows.length > 0) console.log(result.rows[0]);
  } catch(e) {
    console.log('ERROR:', e.message);
  }
  await pool.end();
}
test();
