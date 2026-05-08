const mysql = require('mysql2/promise');
const passwords = ['', 'root', 'rootroot', '1234', '123456', '12345678', 'admin', 'password', 'mysql'];

async function test() {
  for (const password of passwords) {
    try {
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: password,
      });
      console.log(`SUCCESS: connected with password "${password}"`);
      await connection.end();
      return;
    } catch (err) {
      console.log(`FAILED with "${password}": ` + err.message);
    }
  }
}
test();
