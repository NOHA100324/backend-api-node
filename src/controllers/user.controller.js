const pool = require('../config/db');

exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, email, role, created_at FROM users');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, password } = req.body;
    const userId = req.user.id;

    let query = 'UPDATE users SET username = ?';
    let params = [username];

    if (password && password.length >= 8) {
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashed);
    }

    query += ' WHERE id = ?';
    params.push(userId);

    await pool.query(query, params);
    res.json({ message: 'Perfil actualizado correctamente', username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Rol no válido' });
    }

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'Rol de usuario actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar rol' });
  }
};
