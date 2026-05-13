# 🚀 Premium Task Manager

Un sistema profesional de gestión de tareas full-stack, construido con **Next.js** y **Node.js**. Diseñado con una estética moderna de "Glassmorphism" y preparado para entornos de producción.

## ✨ Características

-   **Autenticación Segura**: Registro e inicio de sesión con JWT y validación de contraseñas.
-   **Gestión de Tareas**: CRUD completo (Crear, Leer, Actualizar, Borrar).
-   **Prioridades**: Clasificación de tareas por prioridad (Alta, Media, Baja).
-   **Adjuntos**: Subida de archivos (imágenes, PDF, etc.) integrada con **Cloudinary**.
-   **Papelera de Reciclaje**: Sistema de borrado suave (Soft Delete) con opción de restaurar.
-   **Diseño Premium**: Interfaz moderna creada con Tailwind CSS v4, animaciones suaves y modo oscuro.
-   **Búsqueda en Tiempo Real**: Filtros dinámicos por texto y prioridad.

## 🛠️ Tecnologías

**Frontend:**
-   [Next.js 15+](https://nextjs.org/)
-   [Tailwind CSS v4](https://tailwindcss.com/)
-   [Lucide React](https://lucide.dev/) (Iconos)
-   [Axios](https://axios-http.com/)

**Backend:**
-   [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
-   [PostgreSQL](https://www.postgresql.org/) con [Sequelize](https://sequelize.org/)
-   [Cloudinary](https://cloudinary.com/) (Almacenamiento de archivos)
-   [TypeScript](https://www.typescriptlang.org/)

## 📁 Estructura del Proyecto

```text
task-manager/
├── backend/           # API REST (Node.js/Express)
└── frontend/          # Aplicación Web (Next.js)
```

## 🚀 Instalación y Uso Local

### 1. Clonar el repositorio
```bash
git clone <https://github.com/agustin-leon-schiavo/task-manager.git>
cd task-manager
```

### 2. Configurar el Backend
```bash
cd backend
npm install
# Crea un archivo .env basado en las variables necesarias
npm run dev
```

### 3. Configurar el Frontend
```bash
cd ../frontend
npm install
# Configura el NEXT_PUBLIC_API_URL en tu .env
npm run dev
```

## ☁️ Despliegue (Render)

Este proyecto está configurado para desplegarse fácilmente en **Render** como dos servicios separados dentro del mismo repositorio (Monorepo), utilizando el ajuste de **Root Directory**.

---
## 👨‍💻 Desarrollador

- Agustín Schiavo 
