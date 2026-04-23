# Proyecto Consultorio — Monorepo

Sistema de gestión clínica para consultorios médicos. Monorepo con dos apps:

- **`BackEnd/`** — API REST (Express 5 + Better Auth + Drizzle + MySQL/MariaDB)
- **`FrontEnd/`** — SPA (React 19 + Vite 7 + TanStack Query + React Router)

Ver READMEs específicos para detalles de cada app:

- [`BackEnd/README.md`](./BackEnd/README.md) — instalación, variables de entorno, migraciones, pruebas, lista completa de endpoints
- [`FrontEnd/README.md`](./FrontEnd/README.md) — configuración, rutas, sistema de diseño, flujo de atención

## Requisitos

- **Node.js** ≥ 20
- **npm** ≥ 10 (o `pnpm`)
- **Docker** + **Docker Compose** (para la base de datos y la orquestación)

## Quickstart (flujo recomendado)

### 1. Clonar y preparar variables

```bash
git clone <url-del-repo>
cd proyecto-consultorio-monorepo
cp BackEnd/.env.example BackEnd/.env
```

Edita `BackEnd/.env` con credenciales de DB y un `BETTER_AUTH_SECRET` aleatorio:

```bash
# Genera un secret:
openssl rand -base64 32
```

Crea `FrontEnd/.env`:

```bash
echo "VITE_API_URL=http://localhost:3000" > FrontEnd/.env
```

### 2. Levantar la base de datos

```bash
docker run -d \
  --name consultorio-db \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=consultorio \
  -p 3306:3306 \
  mariadb:latest
```

Asegúrate que `BackEnd/.env` apunte a esta DB:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=consultorio
DB_PORT=3306
```

### 3. Instalar dependencias

En dos terminales distintas:

```bash
# Terminal 1
cd BackEnd && npm install

# Terminal 2
cd FrontEnd && npm install
```

### 4. Aplicar migraciones y seeds (BackEnd)

```bash
cd BackEnd
npm run db:migrate
npm run seed            # Crea admin, doctor, assistant de prueba
npm run seed:templates  # Siembra plantillas de constancia e incapacidad
```

### 5. Levantar ambos servicios

```bash
# Terminal 1 — BackEnd (http://localhost:3000)
cd BackEnd && npm run dev

# Terminal 2 — FrontEnd (http://localhost:5173)
cd FrontEnd && npm run dev
```

### 6. Abrir en el navegador

Ve a `http://localhost:5173` e inicia sesión:

| Email | Contraseña | Rol | Ruta |
|---|---|---|---|
| `admin@consultorio.com` | `AdminPassword123!` | admin | `/admin` |
| `doctor@consultorio.com` | `DoctorPassword123!` | doctor | `/doctor` |
| `assistant@consultorio.com` | `AssistantPassword123!` | assistant | `/reception` |

## Docker Compose

El `docker-compose.yml` levanta el backend y el frontend contra una base de datos externa (por defecto una DB en `100.64.0.1:3306` vía Tailscale). Ajusta los `environment:` según tu red:

```bash
docker compose up -d
```

Para desarrollo local sin VPN, es más práctico ejecutar `npm run dev` en cada app como se describe arriba.

## Pruebas

### E2E contra la API (cubre los 65 assertions y todos los endpoints)

Con backend corriendo:

```bash
cd BackEnd && npm run test:e2e
```

### Test unitario de servicio de consultas

```bash
cd BackEnd && npm test
```

### Test de aceptación (view-model de historial clínico)

```bash
cd FrontEnd && npm run test:acceptance
```

## Flujo de atención

```
Recepción registra paciente
      │
      ├── Agenda cita (status=scheduled)
      │       │  Día de la cita: "Llegó" → status=present
      │       └─ "Tomar signos" → pre-clínica
      │
      └── Walk-in directo a pre-clínica
                      │
                      ▼
         preclinical_records.status = "waiting"
                      │
                      ▼
         Doctor lo ve en /doctor
                      │
                      │  (pulsa "Iniciar consulta")
                      ▼
         status = "in_consultation" + navega a /doctor/consulta/:id
                      │
                      │  (pulsa "Finalizar consulta")
                      ▼
         transacción atómica:
           • INSERT medical_consultations
           • INSERT prescribed_medications (por cada medicamento)
           • UPDATE preclinical status = "done"
           • audit_log
```

## Estructura del monorepo

```
proyecto-consultorio-monorepo/
├── BackEnd/                     # API Express + Drizzle
│   ├── drizzle/                 # Migraciones SQL
│   ├── src/
│   │   ├── config/              # Entry point, auth, db
│   │   ├── controllers/         # Capa HTTP
│   │   ├── services/            # Lógica de negocio
│   │   ├── routes/              # Router por dominio
│   │   ├── middleware/
│   │   ├── models/schema.js     # Schema Drizzle
│   │   ├── seed.js              # Usuarios de prueba
│   │   └── seedTemplates.js     # Plantillas por defecto
│   ├── test/                    # consultationHistory + e2e
│   ├── Dockerfile
│   └── package.json
├── FrontEnd/                    # SPA React + Vite
│   ├── src/
│   │   ├── components/          # UI compartida (Modal, Calendar, Timeline…)
│   │   ├── hooks/               # React Query hooks
│   │   ├── lib/                 # api client, auth client, utils
│   │   ├── styles/theme.css     # Design tokens
│   │   └── views/               # admin, doctor, recepcion, shared
│   ├── test/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── Docs/                        # Documentación del producto
├── docker-compose.yml           # Orquesta backend + frontend
├── skills-lock.json
└── tasks.json
```

## Roles del sistema

| Rol | Constante | Acceso principal |
|---|---|---|
| Administrador | `admin` | Usuarios, auditoría, configuración, plantillas, mantenimiento |
| Médico | `doctor` | Sala de espera, consulta médica, agenda, aseguradoras, reportes |
| Asistente | `assistant` | Pacientes, citas, pre-clínica, dashboard de recepción |

## Comandos útiles

### BackEnd

| Comando | Propósito |
|---|---|
| `npm run dev` | Servidor con hot reload (nodemon) |
| `npm start` | Servidor de producción |
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:generate` | Genera nueva migración SQL desde `schema.js` |
| `npm run db:studio` | GUI web de Drizzle |
| `npm run seed` | Crea usuarios admin/doctor/assistant |
| `npm run seed:templates` | Siembra plantillas de documentos |
| `npm test` | Tests unitarios |
| `npm run test:e2e` | Tests E2E contra API viva |

### FrontEnd

| Comando | Propósito |
|---|---|
| `npm run dev` | Servidor Vite (HMR) |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el `dist/` |
| `npm run lint` | ESLint |
| `npm run test:acceptance` | Tests de aceptación |

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 19, Vite 7, TanStack Query v5, React Router v7, React Hook Form + Zod, Better Auth client, Axios, Remix Icon |
| **Backend** | Node.js 20, Express 5, Better Auth, Drizzle ORM, Resend (emails), Google AI (Gemini) |
| **Base de datos** | MySQL 8 / MariaDB 10+ |
| **Autenticación** | Sesiones en DB con cookies HTTP-only (Better Auth) |
| **Infraestructura** | Docker + Docker Compose, Nginx (frontend estático) |

## Troubleshooting rápido

### "Network Error" en el login del frontend

- ¿Backend corriendo en `http://localhost:3000`? Prueba `curl http://localhost:3000/status`.
- ¿`VITE_API_URL` apunta a la URL correcta? Recuerda que se fija en build-time.
- ¿`APP_ALLOWED_ORIGINS` del backend incluye el origen del frontend?

### Tablas faltantes después de `db:migrate`

Si falta `document_templates` o `generated_documents`, la migración `0010` no se aplicó. Ver [troubleshooting del BackEnd](./BackEnd/README.md#troubleshooting).

### Rate-limit 429 en Better Auth

Espera 60 segundos o ejecuta `DELETE FROM rate_limit;` en la DB. El test E2E lo hace automáticamente.

### Puerto 3306/3000/5173 ocupado

```bash
# ver qué proceso los usa
lsof -i :3306
lsof -i :3000
lsof -i :5173
```

## Documentación adicional

- [`Docs/`](./Docs) — documentación de producto, historias de usuario y diseño
- [`BackEnd/README.md`](./BackEnd/README.md) — referencia completa de la API
- [`FrontEnd/README.md`](./FrontEnd/README.md) — guía del cliente web

## Licencia

ISC (ver `BackEnd/package.json`).
