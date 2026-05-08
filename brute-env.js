const { execSync } = require('child_process');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const passwords = ['', 'root', 'rootroot', '1234', '123456', '12345678', 'admin', 'password', 'mysql', 'root123', 'admin123'];

async function brute() {
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    for (const pass of passwords) {
        console.log(`Trying password: "${pass}"`);
        const newEnv = envContent.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${pass}`);
        fs.writeFileSync(envPath, newEnv);

        try {
            const connection = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: pass,
            });
            console.log(`FOUND! Password is "${pass}"`);
            await connection.end();
            return;
        } catch (err) {
            // ignore
        }
    }
    console.log("Could not find password");
}

brute();
