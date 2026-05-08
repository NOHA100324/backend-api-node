const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rutas de la API
const authRoutes = require('./routes/auth.routes');
const itemsRoutes = require('./routes/items.routes');
const salesRoutes = require('./routes/sales.routes');
const userRoutes = require('./routes/user.routes');

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/users', userRoutes);

// Ruta de prueba de la API
app.get('/api/health', (req, res) => {
  res.json({ status: "ok", message: "API funcionando" });
});

// Ruta base para servir el frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal en el servidor' });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor profesional corriendo en: http://localhost:${PORT}`);
});
