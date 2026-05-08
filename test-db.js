const mysql = require('mysql2/promise');
async function test() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
    });
    console.log('SUCCESS: connected with password "root"');
    await connection.end();
  } catch (err) {
    console.log('FAILED: ' + err.message);
  }
}
test();
