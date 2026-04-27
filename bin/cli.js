#!/usr/bin/env node
const pool = require('../src/config/db');

async function showStats() {
  try {
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [items] = await pool.query('SELECT COUNT(*) as count FROM items');
    console.log('\n📊 ESTADÍSTICAS DEL SISTEMA');
    console.log('---------------------------');
    console.log(`Usuarios registrados: ${users[0].count}`);
    console.log(`Items en total:       ${items[0].count}`);
    console.log('---------------------------\n');
    process.exit(0);
  } catch (err) {
    console.error('Error al conectar con la DB:', err.message);
    process.exit(1);
  }
}

showStats();
