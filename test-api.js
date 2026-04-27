const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function runTest() {
  console.log('🧪 Iniciando pruebas del CRUD...\n');

  try {
    // 1. Registro
    console.log('1. Registrando usuario...');
    const userData = { username: 'testuser' + Date.now(), email: 'test' + Date.now() + '@example.com', password: '123' };
    await axios.post(`${API_URL}/auth/register`, userData);
    console.log('✅ Usuario registrado.');

    // 2. Login
    console.log('2. Iniciando sesión...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, { email: userData.email, password: userData.password });
    const token = loginRes.data.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ Login exitoso, token obtenido.');

    // 3. Crear Item
    console.log('3. Creando un item...');
    const itemRes = await axios.post(`${API_URL}/items`, { name: 'Item de Prueba', description: 'Creado por el script' }, config);
    const itemId = itemRes.data.id;
    console.log(`✅ Item creado con ID: ${itemId}`);

    // 4. Leer Items
    console.log('4. Listando items...');
    const listRes = await axios.get(`${API_URL}/items`, config);
    console.log(`✅ Items encontrados: ${listRes.data.length}`);

    // 5. Actualizar Item
    console.log('5. Actualizando item...');
    await axios.put(`${API_URL}/items/${itemId}`, { name: 'Item Actualizado', description: 'Nueva descripción' }, config);
    console.log('✅ Item actualizado.');

    // 6. Eliminar Item
    console.log('6. Eliminando item...');
    await axios.delete(`${API_URL}/items/${itemId}`, config);
    console.log('✅ Item eliminado.');

    console.log('\n✨ ¡Todas las pruebas del CRUD pasaron exitosamente!');
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

runTest();
