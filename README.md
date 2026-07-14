# FitPlanner Pro 🏋️‍♂️💪

FitPlanner Pro es una aplicación web moderna y reactiva diseñada para planificar, registrar y analizar rutinas de entrenamiento físico. Ofrece una interfaz premium con soporte para animaciones fluidas, temas oscuros y gestión en tiempo real.

---

## ✨ Características Principales

- **Dashboard Interactivo**: Visualiza estadísticas rápidas de tus entrenamientos semanales, volumen acumulado y progreso.
- **Creador de Rutinas**: Diseña y edita tus rutinas de entrenamiento con un editor dinámico e interactivo.
- **Historial Completo**: Explora tus entrenamientos pasados con detalles sobre series, repeticiones y pesos levantados.
- **Catálogo de Ejercicios**: Base de datos de ejercicios con imágenes, instrucciones paso a paso, músculos activados y videos demostrativos.
- **Planificador Semanal**: Organiza qué días vas a entrenar y qué rutinas realizarás.
- **Sincronización en la Nube**: Desarrollado sobre Supabase para garantizar sincronización de datos en tiempo real y autenticación segura.

---

## 🛠️ Stack Tecnológico

- **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Animaciones**: [Framer Motion](https://www.framer.com/motion/)
- **Base de Datos & Auth**: [Supabase](https://supabase.com/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Iconografía**: [Lucide React](https://lucide.dev/)

---

## 🚀 Desarrollo Local

### 1. Requisitos Previos

Asegúrate de tener instalado:
- **Node.js** (v20 o superior)
- **npm** o **yarn**

### 2. Configurar Variables de Entorno

Copia el archivo `.env.example` y renómbralo a `.env`:

```bash
cp .env.example .env
```

Llena las variables de entorno con tus credenciales de Supabase y RapidAPI:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
VITE_RAPIDAPI_KEY=tu_rapidapi_key
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:5173](http://localhost:5173).

---

## 🐳 Despliegue en Producción (Docker & Dokploy)

Este proyecto está completamente dockerizado utilizando una compilación multi-etapa (*multi-stage build*) con **Nginx** para servir los recursos estáticos de forma eficiente y comprimida con gzip.

### 📋 Variables de Entorno en Docker (Importante)
Dado que Vite compila las variables de entorno en el código JavaScript final durante la fase de construcción (*build-time*), debes proporcionar estas variables como argumentos de compilación (`build args`).

### Despliegue con Docker Compose
Hemos configurado un archivo `docker-compose.yml` optimizado:

```yaml
version: '3.8'

services:
  fitplanner-pro:
    container_name: fitplanner-pro
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
        - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
        - VITE_RAPIDAPI_KEY=${VITE_RAPIDAPI_KEY}
    ports:
      - "80:80"
    restart: unless-stopped
```

### ⚙️ Despliegue en Dokploy

Para desplegar esta aplicación en tu panel de **Dokploy**:

1. Crea una nueva **Aplicación** en Dokploy.
2. Conecta tu repositorio de GitHub.
3. En la sección **Build Configuration** del panel de la aplicación en Dokploy:
   - Selecciona **Compose** como método de despliegue si deseas usar `docker-compose.yml`.
   - Alternativamente, si seleccionas **Dockerfile**, asegúrate de añadir las variables de entorno en el panel de Dokploy, ya que Dokploy las inyecta automáticamente como variables durante el build de Docker.
4. Configura las siguientes variables de entorno en el panel de Dokploy:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_RAPIDAPI_KEY`
5. Haz clic en **Deploy**. Dokploy compilará el frontend usando Docker y servirá la app de forma segura a través de Nginx.

---

## 🗄️ Base de Datos & Migraciones

Si necesitas aplicar el esquema de base de datos en una nueva instancia de Supabase:

1. Ve a la carpeta `supabase/migrations`.
2. Ejecuta los scripts SQL en el editor de consultas SQL de tu consola de Supabase en el siguiente orden:
   1. `20260414_initial_schema.sql` (Esquema de tablas, RLS y triggers de usuarios).
   2. `20260414210020_add_exercise_avatar_storage.sql` (Configuración de almacenamiento para avatares e imágenes).
   3. `20260415160000_add_multimedia_and_user_exercises.sql` (Multimedia y ejercicios creados por usuarios).
   4. `20260415170000_add_enriched_data_and_constraints.sql` (Campos adicionales y restricciones de integridad).
   5. `20260416000000_add_marketplace_fields.sql` (Campos para el catálogo/marketplace de ejercicios).
   6. `20260416000001_delete_all_exercises.sql` (Inicialización de datos del catálogo local de ejercicios).
