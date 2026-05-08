const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    // En una tienda real, todos ven todos los productos
    const [rows] = await pool.query('SELECT * FROM items ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los productos' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Item no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el producto' });
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para crear productos' });
    }
    const { name, brand, description, price, image_url, processor, ram, storage } = req.body;
    if (!name) return res.status(400).json({ message: 'El nombre es obligatorio' });

    const [result] = await pool.query(
      'INSERT INTO items (name, brand, description, price, image_url, processor, ram, storage, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, brand, description, price || 0, image_url || 'https://via.placeholder.com/300x200?text=Laptop', processor, ram, storage, req.user.id]
    );

    res.status(201).json({ id: result.insertId, name, brand, description, price, image_url, processor, ram, storage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el producto' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, description, price, image_url, processor, ram, storage } = req.body;

    let query = 'UPDATE items SET name = ?, brand = ?, description = ?, price = ?, image_url = ?, processor = ?, ram = ?, storage = ? WHERE id = ?';
    let params = [name, brand, description, price, image_url, processor, ram, storage, id];

    if (req.user.role !== 'admin') {
      query += ' AND user_id = ?';
      params.push(req.user.id);
    }

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No encontrado o sin permisos' });
    }

    res.json({ id, name, brand, description, price, image_url, processor, ram, storage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    let query = 'DELETE FROM items WHERE id = ?';
    let params = [id];

    if (req.user.role !== 'admin') {
      query += ' AND user_id = ?';
      params.push(req.user.id);
    }

    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'No encontrado o sin permisos' });
    res.json({ message: 'Eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error' });
  }
};
