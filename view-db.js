const { db } = require('./db');

const tableArg = process.argv[2];

if (!tableArg) {
  console.log('\n📊 === NEWGRAM DATABASE OVERVIEW (newgram.db) ===\n');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  
  const stats = tables.map(t => {
    const count = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get().c;
    return { 'Table Name': t.name, 'Total Records': count };
  });

  console.table(stats);
  console.log('💡 Tip: Specific table dekhne ke liye command run karein:');
  console.log('   node view-db.js users');
  console.log('   node view-db.js posts');
  console.log('   node view-db.js messages');
  console.log('   node view-db.js comments\n');
} else {
  try {
    const rows = db.prepare(`SELECT * FROM ${tableArg} LIMIT 50`).all();
    console.log(`\n📋 === TABLE: ${tableArg.toUpperCase()} (${rows.length} rows shown) ===\n`);
    if (rows.length === 0) {
      console.log('No records found in this table.');
    } else {
      console.table(rows);
    }
    console.log('');
  } catch (err) {
    console.error(`❌ Error querying table "${tableArg}":`, err.message);
  }
}
