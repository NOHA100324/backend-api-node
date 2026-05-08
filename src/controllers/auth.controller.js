const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    // Verificar si ya existe algún administrador
    const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    
    // Si NO hay admins, el primero puede ser admin. Si YA HAY, el resto son 'user'.
    const finalRole = admins.length === 0 ? 'admin' : 'user';

    const hashed = await bcrypt.hash(password, 10);
    
    await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashed, finalRole]
    );

    res.status(201).json({ 
      message: `Usuario registrado como ${finalRole.toUpperCase()}`,
      role: finalRole 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El usuario o email ya existe' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // 1. Check if blocked
    if (user.is_blocked) {
      return res.status(403).json({ 
        message: 'CUENTA BLOQUEADA por seguridad. Use la opción de recuperación para desbloquearla.',
        isBlocked: true 
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) {
      // 2. Increment failed attempts
      const newAttempts = user.failed_attempts + 1;
      let isNowBlocked = false;
      
      if (newAttempts >= 3) { // 3rd attempt fails -> Block
        await pool.query('UPDATE users SET failed_attempts = ?, is_blocked = true WHERE id = ?', [newAttempts, user.id]);
        isNowBlocked = true;
      } else {
        await pool.query('UPDATE users SET failed_attempts = ? WHERE id = ?', [newAttempts, user.id]);
      }

      return res.status(400).json({ 
        message: isNowBlocked ? 'CUENTA BLOQUEADA por demasiados intentos fallidos.' : `Contraseña incorrecta. Intento ${newAttempts}/3`,
        failedAttempts: newAttempts,
        isBlocked: isNowBlocked
      });
    }

    // 3. Success: Reset attempts
    await pool.query('UPDATE users SET failed_attempts = 0 WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const [rows] = await pool.query('SELECT id, username FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No existe un usuario con ese email' });
    }

    const user = rows[0];
    const token = Math.floor(100000 + Math.random() * 900000).toString(); // PIN de 6 dígitos profesional
    
    await pool.query('UPDATE users SET reset_token = ? WHERE id = ?', [token, user.id]);

    // Simulamos el envío de correo por consola con formato profesional
    console.log('\n' + '='.repeat(40));
    console.log('📧 CORREO DE SEGURIDAD ENVIADO A:', email);
    console.log('Hola', user.username);
    console.log('Su código de recuperación es:', token);
    console.log('Use este código para desbloquear su cuenta y cambiar su contraseña.');
    console.log('='.repeat(40) + '\n');

    res.json({ message: 'Código de recuperación enviado a su correo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const [rows] = await pool.query('SELECT id, reset_token FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0 || rows[0].reset_token !== token) {
      return res.status(400).json({ message: 'Código de recuperación inválido' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = ?, is_blocked = false, failed_attempts = 0, reset_token = NULL WHERE id = ?',
      [hashed, rows[0].id]
    );

    res.json({ message: 'Cuenta desbloqueada y contraseña actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error' });
  }
};
