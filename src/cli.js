const readline = require('readline');
const bcrypt = require('bcryptjs');
const Table = require('cli-table3');
const pool = require('./config/db');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let currentUser = null;

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    magenta: "\x1b[35m",
    gray: "\x1b[90m"
};

// Función para preguntar de forma profesional sin Inquirer
const question = (query) => new Promise((resolve) => rl.question(`${colors.bright}${query}${colors.reset}`, resolve));

// Función para pedir password oculto (manual)
const hiddenQuestion = (query) => {
    return new Promise((resolve) => {
        const stdin = process.stdin;
        process.stdout.write(`${colors.bright}${query}${colors.reset}`);
        stdin.resume();
        stdin.setRawMode(true);
        let password = "";
        
        const onData = (char) => {
            char = char.toString();
            switch (char) {
                case "\n":
                case "\r":
                case "\u0004":
                    stdin.setRawMode(false);
                    stdin.pause();
                    stdin.removeListener('data', onData);
                    process.stdout.write("\n");
                    resolve(password);
                    break;
                case "\u0003": // Ctrl+C
                    process.exit();
                    break;
                case "\u007f": // Backspace
                case "\b":
                    if (password.length > 0) {
                        password = password.slice(0, -1);
                        process.stdout.write("\b \b");
                    }
                    break;
                default:
                    password += char;
                    process.stdout.write("*");
                    break;
            }
        };
        stdin.on('data', onData);
    });
};

function printBanner() {
    console.clear();
    console.log(`${colors.cyan}
 ██████╗  ██████╗ ███████╗    ██████╗ ██████╗  ██████╗ 
██╔════╝ ██╔════╝ ██╔════╝    ██╔══██╗██╔══██╗██╔═══██╗
██║  ███╗██║  ███╗█████╗      ██████╔╝██████╔╝██║   ██║
██║   ██║██║   ██║██╔══╝      ██╔═══╝ ██╔══██╗██║   ██║
╚██████╔╝╚██████╔╝███████╗    ██║     ██║  ██║╚██████╔╝
 ╚═════╝  ╚═════╝ ╚══════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ 
                                      v2.5 ENTERPRISE${colors.reset}`);
    console.log(`${colors.gray}Sistema de Gestión Empresarial - Conectado a: ${process.env.DB_HOST || 'Localhost'}${colors.reset}\n`);
}

async function main() {
    while (true) {
        if (!currentUser) {
            printBanner();
            console.log(`${colors.blue}┌── ACCESO AL SISTEMA ──────────────────────────┐${colors.reset}`);
            console.log(`${colors.blue}│${colors.reset} [1] INICIAR SESIÓN CORPORATIVA             ${colors.blue}│${colors.reset}`);
            console.log(`${colors.blue}│${colors.reset} [2] REGISTRAR NUEVA CUENTA DE TRABAJO      ${colors.blue}│${colors.reset}`);
            console.log(`${colors.blue}│${colors.reset} [3] RECUPERACIÓN DE SEGURIDAD (PIN)        ${colors.blue}│${colors.reset}`);
            console.log(`${colors.blue}│${colors.reset} [0] APAGADO DE TERMINAL                    ${colors.blue}│${colors.reset}`);
            console.log(`${colors.blue}└───────────────────────────────────────────────┘${colors.reset}`);
            
            const opt = await question("\nSGE-AUTH > ");

            if (opt === '1') await login();
            else if (opt === '2') await register();
            else if (opt === '3') await recoverPassword();
            else if (opt === '0') process.exit(0);
        } else {
            if (currentUser.role === 'admin') await adminMenu();
            else await employeeMenu();
        }
    }
}

async function login() {
    console.log(`\n${colors.cyan}--- AUTENTICACIÓN DE USUARIO ---${colors.reset}`);
    const email = await question("EMAIL  : ");
    const pass = await hiddenQuestion("CLAVE  : ");

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user || user.is_blocked) {
            console.log(`\n${colors.red}✘ ACCESO DENEGADO: Usuario inexistente o bloqueado.${colors.reset}`);
            await question("\nPresione Enter...");
            return;
        }

        if (await bcrypt.compare(pass, user.password)) {
            await pool.query('UPDATE users SET failed_attempts = 0 WHERE id = ?', [user.id]);
            currentUser = user;
            console.log(`\n${colors.green}✔ IDENTIDAD VERIFICADA. Bienvenido, ${user.username}.${colors.reset}`);
            await new Promise(r => setTimeout(r, 1000));
        } else {
            const att = user.failed_attempts + 1;
            let blocked = false;
            if (att >= 3) {
                await pool.query('UPDATE users SET failed_attempts = ?, is_blocked = 1 WHERE id = ?', [att, user.id]);
                blocked = true;
            } else {
                await pool.query('UPDATE users SET failed_attempts = ? WHERE id = ?', [att, user.id]);
            }

            if (blocked) {
                console.log(`\n${colors.red}${colors.bright}🛑 CUENTA BLOQUEADA POR SEGURIDAD X DEMASIADOS INTENTOS FALLIDOS.${colors.reset}`);
            } else {
                console.log(`\n${colors.red}✘ ERROR: Clave incorrecta. Intento ${att}/3.${colors.reset}`);
            }
            await question("\nPresione Enter...");
        }
    } catch (e) { console.log(e.message); }
}

async function adminMenu() {
    printBanner();
    console.log(`${colors.magenta}--- MODO ADMINISTRADOR: ${currentUser.username.toUpperCase()} ---${colors.reset}`);
    
    const table = new Table({ chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' } });
    table.push([`${colors.yellow}[1] Personal`, `${colors.cyan}[2] Inventario`, `${colors.green}[3] Ventas`]);
    table.push([`${colors.yellow}[4] Mi Perfil`, `${colors.gray}[5] Logout`, `${colors.red}[0] Salir`]);
    console.log(table.toString());

    const opt = await question("\nSGE-ADMIN > ");

    if (opt === '1') await listUsers();
    else if (opt === '2') await listProducts();
    else if (opt === '3') await viewSales();
    else if (opt === '4') await editProfile();
    else if (opt === '5') currentUser = null;
    else if (opt === '0') process.exit(0);
}

async function employeeMenu() {
    printBanner();
    console.log(`${colors.green}--- PUNTO DE VENTA: ${currentUser.username.toUpperCase()} ---${colors.reset}`);
    console.log(` [1] Catálogo  [2] Boleta  [3] Factura  [4] Mi Perfil  [5] Logout  [0] Salir`);

    const opt = await question("\nSGE-POS > ");
    if (opt === '1') await listProducts();
    else if (opt === '2') await makeSale('boleta');
    else if (opt === '3') await makeSale('factura');
    else if (opt === '4') await editProfile();
    else if (opt === '5') currentUser = null;
    else if (opt === '0') process.exit(0);
}

async function listUsers() {
    const [rows] = await pool.query('SELECT id, username, email, role, is_blocked FROM users');
    const table = new Table({ head: ['ID', 'USUARIO', 'EMAIL', 'ROL', 'ESTADO'].map(h => colors.cyan+h+colors.reset) });
    rows.forEach(u => table.push([u.id, u.username, u.email, u.role.toUpperCase(), u.is_blocked ? colors.red+'BLOCK'+colors.reset : colors.green+'OK'+colors.reset]));
    console.log('\n' + table.toString());
    
    const cmd = await question("\n[ID] Gestionar | [Enter] Volver: ");
    if (cmd && !isNaN(cmd)) await manageUser(cmd);
}

async function manageUser(id) {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (!users[0]) return;
    const u = users[0];
    console.log(`\nAcciones para ${u.username}: [1] Cambiar Rol  [2] Block/Unblock  [3] Eliminar`);
    const act = await question("Acción > ");
    if (act === '1') await pool.query('UPDATE users SET role = ? WHERE id = ?', [u.role === 'admin' ? 'user' : 'admin', id]);
    if (act === '2') await pool.query('UPDATE users SET is_blocked = ?, failed_attempts = 0 WHERE id = ?', [!u.is_blocked, id]);
    if (act === '3') await pool.query('DELETE FROM users WHERE id = ?', [id]);
    console.log(`\n${colors.green}✔ Operación realizada.${colors.reset}`);
    await new Promise(r => setTimeout(r, 800));
}

async function listProducts() {
    const [rows] = await pool.query('SELECT * FROM items');
    const table = new Table({ head: ['ID', 'MARCA', 'MODELO', 'PRECIO'].map(h => colors.green+h+colors.reset) });
    rows.forEach(i => table.push([i.id, i.brand||'-', i.name, `$${i.price}`]));
    console.log('\n' + table.toString());
    if (currentUser.role === 'admin') {
        const cmd = await question("\n[1] Añadir Nuevo | [Enter] Volver: ");
        if (cmd === '1') await createProduct();
    } else {
        await question("\nPresione Enter para volver...");
    }
}

async function createProduct() {
    const n = await question("Nombre : ");
    const b = await question("Marca  : ");
    const p = await question("Precio : ");
    await pool.query('INSERT INTO items (name, brand, price, user_id) VALUES (?, ?, ?, ?)', [n, b, p, currentUser.id]);
    console.log(`\n${colors.green}✔ Producto registrado.${colors.reset}`);
    await new Promise(r => setTimeout(r, 800));
}

async function makeSale(type) {
    const [items] = await pool.query('SELECT id, name, price FROM items');
    if (items.length === 0) return;
    items.forEach((it, idx) => console.log(` [${idx+1}] ${it.name} ($${it.price})`));
    const sel = await question("\nSeleccione N°: ");
    const it = items[parseInt(sel)-1];
    if (!it) return;
    const c = await question("Cliente: ");
    const d = await question("Documento: ");
    await pool.query('INSERT INTO sales (item_id, user_id, type, customer_name, customer_id, total) VALUES (?,?,?,?,?,?)', [it.id, currentUser.id, type, c, d, it.price]);
    console.log(`\n${colors.green}✔ Venta procesada.${colors.reset}`);
    await question("\nPresione Enter...");
}

async function viewSales() {
    const [rows] = await pool.query('SELECT s.*, i.name, u.username FROM sales s JOIN items i ON s.item_id = i.id JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC');
    const table = new Table({ head: ['TIPO', 'PRODUCTO', 'TOTAL', 'VENDEDOR'].map(h => colors.yellow+h+colors.reset) });
    rows.forEach(s => table.push([s.type.toUpperCase(), s.name, `$${s.total}`, s.username]));
    console.log('\n' + table.toString());
    await question("\nPresione Enter...");
}

async function editProfile() {
    const n = await question("Nuevo Nombre: ");
    const p = await hiddenQuestion("Nueva Clave (Vacio = No cambiar): ");
    let q = 'UPDATE users SET username = ?';
    let params = [n];
    if (p) { q += ', password = ?'; params.push(await bcrypt.hash(p, 10)); }
    q += ' WHERE id = ?'; params.push(currentUser.id);
    await pool.query(q, params);
    currentUser.username = n;
    console.log(`\n${colors.green}✔ Perfil actualizado.${colors.reset}`);
    await new Promise(r => setTimeout(r, 800));
}

async function recoverPassword() {
    const e = await question("Email de cuenta: ");
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [e]);
    if (!rows[0]) return;
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`\n${colors.yellow}[SECURITY] PIN DE RECUPERACIÓN ENVIADO: ${pin}${colors.reset}`);
    const inputPin = await question("Ingrese PIN: ");
    if (inputPin === pin) {
        const np = await hiddenQuestion("Nueva Clave: ");
        await pool.query('UPDATE users SET password = ?, is_blocked = 0, failed_attempts = 0 WHERE id = ?', [await bcrypt.hash(np, 10), rows[0].id]);
        console.log(`\n${colors.green}✔ Cuenta restablecida.${colors.reset}`);
    }
    await question("\nPresione Enter...");
}

async function register() {
    const u = await question("Nombre: ");
    const e = await question("Email : ");
    const p = await hiddenQuestion("Clave : ");
    const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    const role = admins.length === 0 ? 'admin' : 'user';
    await pool.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [u, e, await bcrypt.hash(p, 10), role]);
    console.log(`\n${colors.green}✔ Registrado como ${role.toUpperCase()}.${colors.reset}`);
    await new Promise(r => setTimeout(r, 1000));
}

main();
