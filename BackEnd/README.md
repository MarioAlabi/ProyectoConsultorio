# BackEnd — Clínica Esperanza de Vida

API REST del sistema de gestión clínica. Express 5 + Better Auth + Drizzle ORM + MySQL/MariaDB.

## Requisitos previos

- **Node.js** ≥ 20
- **MySQL 8** o **MariaDB 10+** (el proyecto se prueba contra MariaDB)
- **Docker** (opcional, para levantar la DB localmente)
- **Cuenta en Resend** (opcional, para emails de verificación / reset password)
- **API key de Google AI Studio** (opcional, para plantillas asistidas por IA)

### Levantar la base de datos con Docker

```bash
docker run -d \
  --name consultorio-db \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=consultorio \
  -p 3306:3306 \
  mariadb:latest
```

## Instalación

```bash
cd BackEnd
npm install
```

## Configuración

Copia el template y completa los valores:

```bash
cp .env.example .env
```

### Variables de entorno

| Variable | Requerida | Descripción | Ejemplo |
|---|---|---|---|
| `NODE_ENV` | no | Entorno de ejecución | `development` |
| `PORT` | no | Puerto del servidor HTTP | `3000` |
| `APP_ALLOWED_ORIGINS` | sí | CSV de orígenes permitidos (CORS + Better Auth) | `http://localhost:5173` |
| `DB_HOST` | sí | Host de la base de datos | `localhost` |
| `DB_USER` | sí | Usuario DB | `root` |
| `DB_PASSWORD` | sí | Contraseña DB | `root` |
| `DB_NAME` | sí | Nombre de la base de datos | `consultorio` |
| `DB_PORT` | sí | Puerto DB | `3306` |
| `BETTER_AUTH_URL` | sí | URL pública del backend | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | sí | Clave para firmar sesiones (generar aleatoria) | `openssl rand -base64 32` |
| `RESEND_API_KEY` | no | API key de Resend para emails | `re_xxxxxxxx` |
| `RESEND_EMAIL_FROM` | no | Remitente para emails | `no-reply@tudominio.com` |
| `GEMINI_API_KEY` | no | API key de Google AI (IA para plantillas) | `AIzaSy...` |
| `GEMINI_MODEL` | no | Modelo a usar | `gemini-2.5-flash` |

## Preparar la base de datos

### 1. Aplicar migraciones

```bash
npm run db:migrate
```

> **Nota:** El directorio `drizzle/` contiene las migraciones SQL versionadas. Si agregas una nueva migración manual (fuera del flujo de `db:generate`), recuerda registrarla en `drizzle/meta/_journal.json` y en la tabla `__drizzle_migrations` para que `db:migrate` no intente reaplicarla.

### 2. Crear usuarios de prueba

```bash
npm run seed
```

Crea 3 usuarios con credenciales conocidas:

| Email | Contraseña | Rol |
|---|---|---|
| `admin@consultorio.com` | `AdminPassword123!` | admin |
| `doctor@consultorio.com` | `DoctorPassword123!` | doctor |
| `assistant@consultorio.com` | `AssistantPassword123!` | assistant |

### 3. Sembrar plantillas por defecto (opcional pero recomendado)

```bash
npm run seed:templates
```

Inserta 3 plantillas: incapacidad por enfermedad, incapacidad por embarazo, constancia de buena salud.

### Otros comandos de Drizzle

| Comando | Propósito |
|---|---|
| `npm run db:generate` | Genera SQL tras modificar `src/models/schema.js` |
| `npm run db:push` | Empuja el schema directo (desarrollo rápido, sin migraciones) |
| `npm run db:studio` | GUI web para inspeccionar la DB (Drizzle Studio) |

## Ejecución

### Desarrollo (hot reload con nodemon)

```bash
npm run dev
```

### Producción

```bash
npm start
```

Verifica que esté vivo:

```bash
curl http://localhost:3000/status
# → {"status":"ok","message":"Clinic server active","timestamp":"..."}
```

## Pruebas

### Test de integración de servicio

```bash
npm test
```

Ejercita `consultationService` con stubs del driver MySQL. No requiere servidor corriendo ni DB.

### Test E2E (end-to-end)

```bash
npm run test:e2e
```

Cubre **todos los endpoints REST** (65 assertions) contra un backend vivo. Verifica autenticación, guards por rol, reglas de negocio (DUI válido, conflicto de citas, duplicados pre-clínica, etc.) y los 12 dominios:

1. Health check
2. Autenticación (login/sesión/logout + credenciales inválidas)
3. Guards de rol (401 anónimo, 403 rol insuficiente)
4. Settings de clínica
5. Aseguradoras (CRUD + activar/inactivar)
6. Pacientes (CRUD + búsqueda + cambio de estado)
7. Citas (crear, conflicto, reschedule, bulk-cancel)
8. Pre-clínica (crear, duplicar, dashboard, status)
9. Consultas (finalizar, historial, reporte por aseguradora)
10. Plantillas de documentos (CRUD + IA draft)
11. Documentos generados (constancia/incapacidad)
12. Auditoría (solo admin) + mantenimiento (backup)

**Requisitos:**
- Backend corriendo en `BASE_URL` (default `http://localhost:3000`)
- `npm run seed` ejecutado
- Migración `0010_document_templates.sql` aplicada
- Acceso a la DB con las credenciales del `.env` (para resetear el rate-limiter entre corridas)

**Variables opcionales:**

```bash
BASE_URL=http://localhost:3000 \
ORIGIN=http://localhost:5173 \
npm run test:e2e
```

## Estructura del proyecto

```
BackEnd/
├── drizzle/                          # Migraciones SQL versionadas
│   ├── 0000_plain_vance_astro.sql
│   ├── ...
│   ├── 0010_document_templates.sql
│   └── meta/_journal.json            # Índice de Drizzle
├── src/
│   ├── config/
│   │   ├── index.js                  # Entry point (arranca connectDB + app.listen)
│   │   ├── auth.js                   # Configuración de Better Auth
│   │   └── db.js                     # Pool MySQL + Drizzle
│   ├── constants/
│   │   └── roles.js                  # admin, doctor, assistant
│   ├── middleware/
│   │   ├── isAuth.js                 # Valida sesión, inyecta req.user
│   │   ├── requireRole.js            # Valida sesión + rol
│   │   └── errorHandler.js           # Manejador global
│   ├── models/
│   │   └── schema.js                 # Schema Drizzle (todas las tablas)
│   ├── controllers/                  # Capa HTTP (req/res, audit log)
│   │   ├── patientController.js
│   │   ├── appointmentController.js
│   │   ├── preclinicalController.js
│   │   ├── consultationController.js
│   │   ├── insurerController.js
│   │   ├── auditController.js
│   │   ├── settingsController.js
│   │   ├── documentTemplateController.js
│   │   ├── generatedDocumentController.js
│   │   └── mantenimientocontroller.js
│   ├── routes/                       # Router Express por dominio
│   ├── services/                     # Lógica de negocio + acceso a DB
│   │   ├── patientService.js
│   │   ├── appointmentService.js
│   │   ├── preclinicalService.js
│   │   ├── consultationService.js
│   │   ├── insurerService.js
│   │   ├── auditService.js
│   │   ├── settingsService.js
│   │   ├── documentTemplateService.js
│   │   ├── generatedDocumentService.js
│   │   └── aiTemplateService.js      # Wrapper de Google AI
│   ├── app.js                        # CORS, body parsers, rutas
│   ├── seed.js                       # Usuarios iniciales
│   └── seedTemplates.js              # Plantillas de documentos
├── test/
│   ├── consultationHistory.test.js   # Test unitario del servicio
│   └── e2e.test.js                   # Test E2E de todos los endpoints
├── drizzle.config.js
├── Dockerfile
├── package.json
└── .env.example
```

## Endpoints

### Autenticación (Better Auth)

Todas bajo `/api/auth/*`. Implementadas por Better Auth, ver [docs oficiales](https://better-auth.com/docs).

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/sign-in/email` | Iniciar sesión |
| POST | `/api/auth/sign-out` | Cerrar sesión |
| GET | `/api/auth/get-session` | Sesión actual |
| POST | `/api/auth/request-password-reset` | Solicitar reset |
| POST | `/api/auth/reset-password` | Reset con token |
| POST | `/api/auth/change-password` | Cambiar contraseña (usuario autenticado) |
| GET | `/api/auth/admin/list-users` | Listar usuarios (admin) |
| POST | `/api/auth/admin/create-user` | Crear usuario (admin) |
| POST | `/api/auth/admin/update-user` | Actualizar (admin) |
| POST | `/api/auth/admin/set-role` | Cambiar rol (admin) |
| POST | `/api/auth/admin/set-user-password` | Cambiar contraseña (admin) |
| POST | `/api/auth/admin/ban-user` / `unban-user` | Desactivar/activar (admin) |

### API de dominio

| Método | Endpoint | Roles |
|---|---|---|
| **Pacientes** | | |
| POST | `/api/patients/register` | assistant, doctor, admin |
| GET | `/api/patients` | assistant, doctor, admin |
| GET | `/api/patients/:id` | assistant, doctor, admin |
| PUT | `/api/patients/:id` | assistant, doctor, admin |
| PATCH | `/api/patients/:id/status` | assistant, doctor, admin |
| **Citas** | | |
| POST | `/api/appointments` | assistant, doctor, admin |
| GET | `/api/appointments` | todos |
| PUT | `/api/appointments/:id` | assistant, doctor, admin |
| PATCH | `/api/appointments/:id/status` | assistant, doctor, admin |
| PATCH | `/api/appointments/bulk-cancel` | assistant, doctor, admin |
| **Pre-clínica** | | |
| POST | `/api/preclinical` | assistant, doctor, admin |
| GET | `/api/preclinical` | todos |
| GET | `/api/preclinical/dashboard` | doctor, admin |
| GET | `/api/preclinical/patient/:patientId` | todos |
| GET | `/api/preclinical/:id` | doctor, admin |
| PATCH | `/api/preclinical/:id/status` | todos |
| **Consultas** | | |
| POST | `/api/consultations/:preclinicalId` | doctor |
| GET | `/api/consultations/:preclinicalId` | doctor, assistant |
| GET | `/api/consultations/patient/:patientId/history` | doctor, assistant |
| GET | `/api/consultations/reports/by-insurer` | doctor, admin |
| **Aseguradoras** | | |
| GET | `/api/insurers` | assistant, doctor, admin |
| GET | `/api/insurers/:id` | assistant, doctor, admin |
| POST | `/api/insurers` | doctor, admin |
| PUT | `/api/insurers/:id` | doctor, admin |
| PATCH | `/api/insurers/:id/status` | doctor, admin |
| **Plantillas de documento** | | |
| GET | `/api/document-templates` | todos |
| GET | `/api/document-templates/:id` | todos |
| POST | `/api/document-templates` | doctor, admin |
| PUT | `/api/document-templates/:id` | doctor, admin |
| PATCH | `/api/document-templates/:id/status` | doctor, admin |
| DELETE | `/api/document-templates/:id` | doctor, admin |
| POST | `/api/document-templates/ai-draft` | doctor, admin |
| **Documentos generados** | | |
| POST | `/api/documents` | doctor |
| GET | `/api/documents/:id` | todos |
| GET | `/api/documents/patient/:patientId` | todos |
| **Configuración de clínica** | | |
| GET | `/api/settings` | público |
| POST | `/api/settings` | admin |
| **Auditoría** | | |
| GET | `/api/audit` | admin |
| GET | `/api/audit/record/:recordId` | admin |
| GET | `/api/audit/patient/:patientId` | admin |
| **Mantenimiento** | | |
| GET | `/api/admin/backup` | admin |
| POST | `/api/admin/restore` | admin |
| **Health** | | |
| GET | `/status` | público |

## Middlewares

### `isAuth`

Valida sesión activa (cookie `better-auth.session_token`). Inyecta `req.user` y `req.session`. Responde 401 si falta.

```js
import { isAuth } from "../middleware/isAuth.js";
router.get("/profile", isAuth, controller);
```

### `requireRole(allowedRoles)`

Valida sesión **y** rol. Si el usuario no aún está autenticado en `req`, resuelve la sesión internamente. Responde 401 o 403 según corresponda.

```js
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";

router.get("/admin/stats", requireRole([ROLES.ADMIN]), controller);
router.get("/patients", requireRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASSISTANT]), controller);
```

## Tablas principales

| Tabla | Descripción |
|---|---|
| `users` | Empleados (id, name, email, role, dui, jvpm, jvpe, banned…) |
| `accounts` | Credenciales (hash de password por usuario) |
| `sessions` | Sesiones activas |
| `verifications` | Tokens temporales (reset password, verificación) |
| `rate_limit` | Control de rate-limiting (Better Auth) |
| `patients` | Expedientes clínicos |
| `appointments` | Citas agendadas |
| `preclinical_records` | Signos vitales + estado del paciente |
| `medical_consultations` | Consultas finalizadas por doctor |
| `prescribed_medications` | Medicamentos recetados (FK → consultation) |
| `insurers` | Convenios con aseguradoras |
| `document_templates` | Plantillas de constancias/incapacidades |
| `generated_documents` | Documentos emitidos |
| `clinic_settings` | Configuración de la clínica (nombre, logo, dirección) |
| `audit_logs` | Trazabilidad de cambios |
| `__drizzle_migrations` | Journal de migraciones aplicadas |

## Roles

| Rol | Valor | Permisos principales |
|---|---|---|
| Administrador | `admin` | Usuarios, auditoría, configuración, mantenimiento |
| Médico | `doctor` | Consultas, recetas, aseguradoras, plantillas |
| Asistente | `assistant` | Pacientes, citas, pre-clínica |

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

El `docker-compose.yml` del monorepo también lo orquesta junto con el frontend.

## Troubleshooting

### `Error connecting to MariaDB database`

- Verifica que el contenedor de DB esté corriendo: `docker ps`
- Confirma que `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` en `.env` sean correctos
- Si usas MariaDB en Docker con `network_mode: host`, el host debe ser `127.0.0.1` o `localhost`

### `Table 'consultorio.document_templates' doesn't exist`

Falta aplicar la migración `0010_document_templates.sql`. Corre:

```bash
npm run db:migrate
```

Si Drizzle la ignora, aplícala manualmente:

```bash
cat drizzle/0010_document_templates.sql | docker exec -i consultorio-db mariadb -uroot -proot consultorio
```

Y luego registra la migración en `__drizzle_migrations` para que no se reaplique.

### `Too many requests` (429) en tests

Better Auth aplica rate-limit por IP (100 req/60s). El test E2E limpia `rate_limit` al inicio; si corres el test repetidas veces sin él (o usas `curl`/Postman a mano), espera 60s o limpia manualmente:

```sql
DELETE FROM rate_limit;
```

### Las migraciones manuales no se registran

`drizzle-kit migrate` lee `drizzle/meta/_journal.json` para decidir qué aplicar. Si agregaste un `.sql` sin pasar por `db:generate`:

1. Añade la entrada en `_journal.json` con `idx`, `tag`, `when` (timestamp)
2. Inserta el hash SHA256 del archivo en `__drizzle_migrations`:

```bash
python3 -c "import hashlib; print(hashlib.sha256(open('drizzle/0010_document_templates.sql','rb').read()).hexdigest())"
```

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 20 + ES modules |
| Framework | Express 5 |
| Autenticación | Better Auth (sesiones en DB, admin plugin, rate-limit) |
| ORM | Drizzle ORM |
| DB | MySQL 8 / MariaDB 10+ |
| Validación | Zod (en FrontEnd) + validaciones imperativas en servicios |
| Emails | Resend |
| IA | Google AI (Gemini) |
| File upload | express-fileupload |
