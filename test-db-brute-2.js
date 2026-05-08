const mysql = require('mysql2/promise');
const passwords = ['', 'root', 'admin', '1234', '12345', '123456', '12345678', 'password', 'root123', 'admin123', 'mysql', 'root1234', 'admin1234', 'Abc12345', 'Abc123456', 'Soporte123', 'Soporte1234'];

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
      return password;
    } catch (err) {
      // console.log(`FAILED with "${password}": ` + err.message);
    }
  }
  console.log("NOT FOUND");
}
test();
