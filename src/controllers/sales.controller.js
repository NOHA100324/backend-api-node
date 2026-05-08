const pool = require('../config/db');

exports.createSale = async (req, res) => {
  try {
    const { item_id, type, customer_name, customer_id, quantity } = req.body;
    
    if (!item_id || !type) {
      return res.status(400).json({ message: 'Item y tipo (boleta/factura) son obligatorios' });
    }

    // Obtener precio del item
    const [items] = await pool.query('SELECT price FROM items WHERE id = ?', [item_id]);
    if (items.length === 0) return res.status(404).json({ message: 'Producto no encontrado' });
    
    const price = items[0].price;
    const qty = quantity || 1;
    const total = price * qty;

    const [result] = await pool.query(
      'INSERT INTO sales (item_id, user_id, type, customer_name, customer_id, quantity, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [item_id, req.user.id, type, customer_name, customer_id, qty, total]
    );

    res.status(201).json({
      id: result.insertId,
      item_id,
      type,
      total,
      message: `${type.toUpperCase()} generada exitosamente`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar la venta' });
  }
};

exports.getSales = async (req, res) => {
  try {
    let query = 'SELECT s.*, i.name as item_name FROM sales s JOIN items i ON s.item_id = i.id';
    let params = [];
    
    if (req.user.role !== 'admin') {
      query += ' WHERE s.user_id = ?';
      params.push(req.user.id);
    }
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener ventas' });
  }
};
