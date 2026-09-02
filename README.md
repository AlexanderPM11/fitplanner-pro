# FitPlanner Pro 🏋️‍♂️💪

FitPlanner Pro es una aplicación web moderna y reactiva diseñada para planificar, registrar y analizar rutinas de entrenamiento físico. Ofrece una interfaz premium con soporte para animaciones fluidas, temas oscuros y gestión en tiempo real.

---

## ✨ Características Principales

- **Dashboard Interactivo**: Visualiza estadísticas rápidas de tus entrenamientos semanales, volumen acumulado y progreso.
- **Creador de Rutinas**: Diseña y edita tus rutinas de entrenamiento con un editor dinámico e interactivo.
- **Historial Completo**: Explora tus entrenamientos pasados con detalles sobre series, repeticiones y pesos levantados.
- **Catálogo de Ejercicios**: Base de datos de ejercicios con imágenes, instrucciones paso a paso, músculos activados y videos demostrativos.
- **Planificador Semanal**: Organiza qué días vas a entrenar y qué rutinas realizarás.
- **Sincronización en la Nube**: Gestionada por la API propia y MySQL.

---

## 🛠️ Stack Tecnológico

- **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Animaciones**: [Framer Motion](https://www.framer.com/motion/)
- **Base de Datos & Auth**: ASP.NET Core 10 + ASP.NET Core Identity + MySQL.
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

El catálogo de ejercicios funciona con datos y recursos estáticos incluidos en el proyecto; no requiere una clave externa.

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:5173](http://localhost:5173).

### API ASP.NET Core + MySQL

La nueva API vive en `backend/FitPlanner.Api`. Configura `ConnectionStrings:Default` y `Jwt:Key` mediante variables de entorno o Secret Manager; no uses los valores de desarrollo en producción.

```bash
dotnet restore backend/FitPlanner.Api/FitPlanner.Api.csproj --configfile backend/NuGet.Config
dotnet ef database update --project backend/FitPlanner.Api/FitPlanner.Api.csproj
dotnet run --project backend/FitPlanner.Api
```

Incluye `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password` y `POST /api/auth/reset-password`. El frontend usa exclusivamente esta API.

### Catálogo multimedia local

El catálogo se importa desde `backend/FitPlanner.Api/Data/exercise-catalog.json` al iniciar la API. Las miniaturas y GIFs se sirven desde `public/exercise-media/images` y `public/exercise-media/gifs`; MySQL guarda únicamente rutas relativas como `/exercise-media/gifs/0001-2gPfomN.gif`, nunca imágenes en Base64. El catálogo multimedia está basado en `exercises-dataset`; sus condiciones y atribución se conservan en `public/exercise-media/LICENSE-GIF-DATASET.md` y `public/exercise-media/NOTICE-GIF-DATASET.md`.

Al iniciar, la API aplica las migraciones y crea de forma idempotente el usuario administrador definido por `ADMIN_EMAIL` y `ADMIN_PASSWORD`. El administrador puede consultar `GET /api/admin/users` desde la pantalla **Administrar usuarios** de la PWA. El resto de usuarios no tiene acceso a ese endpoint.

---

## 🐳 Despliegue en Producción (Docker & Dokploy)

El `docker-compose.yml` despliega tres servicios: `frontend` (React compilado y Nginx), `api` (ASP.NET Core) y `mysql`. `frontend` y `api` comparten la red privada `app`; el navegador solo ve el dominio del frontend. Nginx reenvía `/api/*` a `http://api:8080`, por lo que `VITE_API_URL` debe ser `/api`.

### ⚙️ Dokploy

1. Crea una aplicación desde este repositorio y selecciona **Compose**.
2. Añade como dominio público el servicio `frontend`, usando el puerto `80`. No publiques `api` ni `mysql`.
3. Configura en Dokploy las variables de `.env.example`, especialmente `JWT_KEY`, `MYSQL_PASSWORD` y `MYSQL_ROOT_PASSWORD` con valores seguros. Define `FRONTEND_URL` con el dominio HTTPS real (por ejemplo, `https://app.midominio.com`).
4. Mantén `VITE_API_URL=/api`; se inyecta como argumento de build y queda compilado en el frontend.
5. Despliega. La API aplica las migraciones EF Core pendientes al iniciar y MySQL conserva los datos en el volumen `mysql_data`.

Para probarlo localmente, copia `.env.example` a `.env`, cambia los secretos y ejecuta `docker compose up --build`. La aplicación quedará disponible en `http://localhost` si se publica el puerto 80 desde Dokploy o se añade temporalmente `80:80` al servicio `frontend`.

---

## 🗄️ Base de Datos & Migraciones

La API aplica automáticamente las migraciones de Entity Framework Core al iniciar. En producción, MySQL conserva los datos en el volumen `mysql_data` definido en `docker-compose.yml`.
