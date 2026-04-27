const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const itemsRoutes = require('./routes/items.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del Frontend (React)
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);

// Ruta de prueba de la API (opcional, ahora es secundaria)
app.get('/api/health', (req, res) => {
  res.json({ status: "ok", message: "API funcionando" });
});

// IMPORTANTE: Manejo de rutas de React (SPA)
// Cualquier ruta que no sea de la API o un archivo estático, devolverá el index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal en el servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
