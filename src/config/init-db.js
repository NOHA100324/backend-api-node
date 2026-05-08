const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function setupDatabase() {
  console.log('--- Intentando conectar a MySQL ---');
  console.log('Usuario:', process.env.DB_USER || 'root');
  console.log('Host:', process.env.DB_HOST || 'localhost');
  console.log('¿Tiene contraseña?:', process.env.DB_PASSWORD ? 'SÍ' : 'NO');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  const dbName = process.env.DB_NAME || 'seminario_db';

  try {
    // Crear base de datos
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`✅ Base de datos '${dbName}' verificada/creada.`);

    await connection.changeUser({ database: dbName });

    // Tabla de Usuarios
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        is_blocked BOOLEAN DEFAULT 0,
        failed_attempts INT DEFAULT 0,
        reset_token VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await connection.query(createUsersTable);
    console.log("✅ Tabla 'users' verificada/creada.");

    // Tabla de Items (Laptops)
    const createItemsTable = `
      CREATE TABLE IF NOT EXISTS items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        brand VARCHAR(50),
        description TEXT,
        price DECIMAL(10, 2) DEFAULT 0.00,
        image_url VARCHAR(255),
        processor VARCHAR(100),
        ram VARCHAR(50),
        storage VARCHAR(50),
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    await connection.query(createItemsTable);
    console.log("✅ Tabla 'items' verificada/creada.");

    // Tabla de Ventas (Boletas y Facturas)
    const createSalesTable = `
      CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        user_id INT NOT NULL,
        type ENUM('boleta', 'factura') NOT NULL,
        customer_name VARCHAR(100),
        customer_id VARCHAR(20),
        quantity INT DEFAULT 1,
        total DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;
    await connection.query(createSalesTable);
    console.log("✅ Tabla 'sales' verificada/creada.");

  } catch (error) {
    console.error("❌ Error configurando la base de datos:", error.message);
  } finally {
    await connection.end();
  }
}

setupDatabase();
