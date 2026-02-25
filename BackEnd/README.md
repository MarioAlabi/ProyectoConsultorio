# Backend - Clinica Esperanza de Vida

API REST para el sistema de gestion clinica. Construido con Express 5, Better Auth, Drizzle ORM y MySQL.

## Requisitos previos

- **Node.js** >= 20
- **MySQL 8** corriendo en localhost (o via Docker)
- **Cuenta en Resend** (opcional, para envio de emails)

### Base de datos con Docker

```bash
docker run -d \
  --name consultorio-medico-api-db \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=consultorio \
  -p 3306:3306 \
  mysql:8
```

## Instalacion

```bash
cd BackEnd
npm install
```

## Configuracion

Copiar el archivo de ejemplo y completar los valores:

```bash
cp .env.example .env
```

### Variables de entorno

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno de ejecucion | `development` |
| `APP_ALLOWED_ORIGINS` | Origenes permitidos (CORS + Better Auth) | `http://localhost:5173` |
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contrasena de MySQL | `root` |
| `DB_NAME` | Nombre de la base de datos | `consultorio` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `BETTER_AUTH_URL` | URL publica del backend | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Clave secreta para firmar sesiones | (generar una clave aleatoria) |
| `RESEND_API_KEY` | API key de Resend para emails | `re_xxxxxxxxxxxxxxxxxxxx` |
| `RESEND_EMAIL_FROM` | Direccion de envio de emails | `no-reply@tudominio.com` |

## Base de datos

### Aplicar migraciones

```bash
npm run db:migrate
```

### Generar nueva migracion (despues de modificar el schema)

```bash
npm run db:generate
```

### Push directo al schema (desarrollo rapido, sin migracion)

```bash
npm run db:push
```

### Explorar la base de datos con Drizzle Studio

```bash
npm run db:studio
```

## Seed de datos iniciales

Crea 3 usuarios de prueba en la base de datos:

```bash
npm run seed
```

| Email | Contrasena | Rol |
|---|---|---|
| `admin@consultorio.com` | `AdminPassword123!` | admin |
| `doctor@consultorio.com` | `DoctorPassword123!` | doctor |
| `assistant@consultorio.com` | `AssistantPassword123!` | assistant |

## Ejecucion

### Desarrollo (con hot reload)

```bash
npm run dev
```

### Produccion

```bash
npm start
```

El servidor inicia en `http://localhost:3000`. Verificar con:

```bash
curl http://localhost:3000/status
```

## Estructura del proyecto

```
BackEnd/
├── drizzle/                    # Migraciones SQL generadas
│   └── 0000_plain_vance_astro.sql
├── src/
│   ├── config/
│   │   ├── index.js            # Entry point del servidor
│   │   ├── auth.js             # Configuracion de Better Auth
│   │   └── db.js               # Pool de conexiones MySQL + Drizzle
│   ├── constants/
│   │   └── roles.js            # ROLES: admin, doctor, assistant
│   ├── middleware/
│   │   ├── isAuth.js           # Valida sesion activa
│   │   ├── requireRole.js      # Valida sesion + rol del usuario
│   │   └── errorHandler.js     # Manejador global de errores
│   ├── models/
│   │   └── schema.js           # Schema de Drizzle (tablas)
│   ├── controllers/            # (pendiente)
│   ├── routes/                 # (pendiente)
│   ├── services/               # (pendiente)
│   ├── app.js                  # Express app, CORS, rutas
│   └── seed.js                 # Script de datos iniciales
├── drizzle.config.js           # Configuracion de Drizzle Kit
├── Dockerfile
├── package.json
└── .env.example
```

## Endpoints de autenticacion

Todos los endpoints de auth son manejados por Better Auth en `/api/auth/*`:

| Metodo | Endpoint | Descripcion |
|---|---|---|
| POST | `/api/auth/sign-in/email` | Iniciar sesion |
| POST | `/api/auth/sign-up/email` | Registrar usuario |
| POST | `/api/auth/sign-out` | Cerrar sesion |
| GET | `/api/auth/get-session` | Obtener sesion actual |
| POST | `/api/auth/request-password-reset` | Solicitar reset de contrasena |
| POST | `/api/auth/reset-password` | Restablecer contrasena con token |

### Endpoints de administracion (requieren rol admin)

| Metodo | Endpoint | Descripcion |
|---|---|---|
| GET | `/api/auth/admin/list-users` | Listar usuarios |
| POST | `/api/auth/admin/create-user` | Crear usuario |
| POST | `/api/auth/admin/update-user` | Actualizar datos de usuario |
| POST | `/api/auth/admin/set-role` | Cambiar rol de usuario |
| POST | `/api/auth/admin/set-user-password` | Cambiar contrasena de usuario |
| POST | `/api/auth/admin/ban-user` | Desactivar usuario |
| POST | `/api/auth/admin/unban-user` | Activar usuario |
| POST | `/api/auth/admin/remove-user` | Eliminar usuario |

## Middlewares disponibles

### `isAuth`

Valida que el request tenga una sesion activa. Agrega `req.user` y `req.session`.

```js
import { isAuth } from "../middleware/isAuth.js";

router.get("/profile", isAuth, controller);
```

### `requireRole(allowedRoles)`

Valida sesion activa + que el usuario tenga uno de los roles permitidos. Si no paso por `isAuth` antes, resuelve la sesion internamente.

```js
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";

router.get("/admin/stats", requireRole([ROLES.ADMIN]), controller);
router.get("/patients", requireRole([ROLES.ADMIN, ROLES.DOCTOR]), controller);
```

## Tablas de la base de datos

| Tabla | Descripcion |
|---|---|
| `users` | Usuarios del sistema (id, name, email, role, banned, etc.) |
| `accounts` | Cuentas de autenticacion (password hash, provider) |
| `sessions` | Sesiones activas (token, expiracion, IP) |
| `verifications` | Tokens temporales (reset password, verificacion email) |
| `rate_limit` | Control de rate limiting por IP/usuario |

## Roles del sistema

| Rol | Valor | Descripcion |
|---|---|---|
| Administrador | `admin` | Gestion de usuarios, configuracion del sistema |
| Medico | `doctor` | Consultas medicas, expedientes |
| Asistente | `assistant` | Recepcion, preclinica, pacientes |

## Docker

### Build

```bash
docker build -t clinica-backend .
```

### Run

```bash
docker run -d \
  --name clinica-api \
  -p 3000:3000 \
  --env-file .env \
  clinica-backend
```

## Stack tecnologico

- **Express 5** - Framework HTTP
- **Better Auth** - Autenticacion (sesiones, admin, email verification, password reset)
- **Drizzle ORM** - ORM con schema declarativo y migraciones
- **MySQL 8** - Base de datos relacional
- **Resend** - Envio de emails transaccionales
