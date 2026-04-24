# Seminario Node.js - API REST Profesional

Este proyecto es una estructura base para desarrollar una API REST utilizando Node.js, Express y MySQL, siguiendo las mejores prácticas de desarrollo y arquitectura.

## 🚀 Características

- **Arquitectura Limpia**: Separación de responsabilidades en controladores, rutas y servicios.
- **Autenticación**: Implementación de JWT (JSON Web Tokens) para rutas protegidas.
- **Seguridad**: Encriptación de contraseñas con `bcryptjs` y configuración de `cors`.
- **Base de Datos**: Conexión optimizada con MySQL utilizando `mysql2`.
- **Contenedorización**: Listo para ser desplegado con Docker.

## 🛠️ Tecnologías

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MySQL](https://www.mysql.com/)
- [JWT](https://jwt.io/)
- [Docker](https://www.docker.com/)

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- Node.js (v18 o superior)
- MySQL Server
- Docker (opcional)

## 🔧 Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd seminario24-4-26
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copia el archivo `.env.example` a uno nuevo llamado `.env` y rellena los datos de tu base de datos:
   ```bash
   cp .env.example .env
   ```

4. **Crear base de datos y tablas automáticamente:**
   Ejecuta el siguiente comando para crear la base de datos y las tablas necesarias:
   ```bash
   npm run init-db
   ```

5. **Ejecutar la aplicación:**
   - Modo producción: `npm start`
   - Modo desarrollo (con autorecarga): `npm run dev`

## 🐳 Docker

Para ejecutar el proyecto usando Docker:

```bash
docker build -t seminario-api .
docker run -p 3000:3000 seminario-api
```

## 🛣️ Estructura del Proyecto

- `src/app.js`: Punto de entrada de la aplicación.
- `src/config/`: Configuraciones de base de datos y otros servicios.
- `src/controllers/`: Lógica de negocio para cada endpoint.
- `src/middlewares/`: Funciones intermedias (Ej. validación de JWT).
- `src/routes/`: Definición de las rutas de la API.

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.
