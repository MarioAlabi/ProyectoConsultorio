# FrontEnd — Clínica Esperanza de Vida

SPA construida con React 19 + Vite 7 que consume la API del BackEnd. Maneja autenticación por sesión con Better Auth, caché de datos con React Query, formularios con React Hook Form + Zod, y routing con React Router v7.

## Requisitos previos

- **Node.js** ≥ 20
- **npm** ≥ 10 (o `pnpm` si prefieres; el repo incluye `pnpm-lock.yaml`)
- **BackEnd corriendo** (por defecto en `http://localhost:3000`). Ver `BackEnd/README.md`.

## Instalación

```bash
cd FrontEnd
npm install
```

## Configuración

Crea el archivo `.env` en la raíz de `FrontEnd/`:

```bash
VITE_API_URL=http://localhost:3000
```

### Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL del BackEnd (sin trailing slash) | `http://localhost:3000` |

Consumidas en `src/lib/api.js:3` y `src/lib/auth-client.js:4`.

> **Importante:** Vite solo inyecta variables con prefijo `VITE_` en el bundle. El valor se fija en **build time**, no en runtime. Para cambiarlo en producción hay que reconstruir (o pasarlo con `--build-arg VITE_API_URL=...` en Docker).

## Ejecución

### Desarrollo (HMR)

```bash
npm run dev
```

Sirve en `http://localhost:5173`. Vite escucha cambios en `src/` y recarga en caliente.

### Build de producción

```bash
npm run build
```

Genera `dist/` con los assets optimizados. Sirve el `dist/` con cualquier servidor estático (Nginx, Caddy, `vite preview`, etc.).

### Preview del build

```bash
npm run preview
```

## Credenciales de desarrollo

Usa las creadas por el seed del BackEnd (`cd BackEnd && npm run seed`):

| Email | Contraseña | Rol | Ruta inicial |
|---|---|---|---|
| `admin@consultorio.com` | `AdminPassword123!` | admin | `/admin` |
| `doctor@consultorio.com` | `DoctorPassword123!` | doctor | `/doctor` |
| `assistant@consultorio.com` | `AssistantPassword123!` | assistant | `/reception` |

## Scripts disponibles

| Script | Propósito |
|---|---|
| `npm run dev` | Servidor Vite con HMR |
| `npm run build` | Compila a `dist/` |
| `npm run preview` | Sirve el `dist/` localmente |
| `npm run lint` | ESLint sobre `src/` |
| `npm run test:acceptance` | Pruebas de aceptación (view-models de historial clínico) |

## Estructura del proyecto

```
FrontEnd/
├── index.html                       # Entry HTML; precarga Geist/Inter/JetBrains Mono
├── src/
│   ├── main.jsx                     # Bootstrap: React Query + Toaster
│   ├── App.jsx                      # BrowserRouter + ProtectedRoute por rol
│   ├── index.css                    # @import del sistema de diseño
│   ├── styles/
│   │   └── theme.css                # Design tokens + componentes base
│   ├── components/
│   │   ├── Layout.jsx               # Sidebar + <Outlet/>
│   │   ├── Navbar.jsx / Navbar.css
│   │   ├── Modal.jsx                # Modal accesible (focus trap, escape)
│   │   ├── ProtectedRoute.jsx       # Guard por rol
│   │   ├── calendar/                # Vistas mes/semana/día
│   │   ├── clinical-history/        # Timeline + view-model
│   │   ├── GenerateDocumentModal.jsx
│   │   ├── PrescriptionPreviewModal.jsx
│   │   └── ErrorBoundary.jsx
│   ├── hooks/                       # React Query hooks por dominio
│   │   ├── usePatients.js
│   │   ├── useAppointments.js
│   │   ├── usePreclinical.js
│   │   ├── useConsultations.js
│   │   ├── useInsurers.js
│   │   ├── useDocumentTemplates.js
│   │   └── useSettings.js
│   ├── lib/
│   │   ├── api.js                   # Axios instance con credentials: true
│   │   ├── auth-client.js           # Better Auth client
│   │   ├── queryClient.js
│   │   ├── utils.js                 # edad, DUI, badges, IMC
│   │   ├── constants/roles.js
│   │   └── validations/             # Schemas Zod
│   └── views/
│       ├── admin/                   # Dashboard, usuarios, auditoría, config
│       ├── doctor/                  # Sala de espera, consulta, aseguradoras
│       ├── recepcion/               # Dashboard recepción
│       └── shared/                  # Login, Landing, Pacientes, Agenda
├── test/                            # Pruebas de aceptación (Node test runner)
├── eslint.config.js
├── vite.config.js
├── Dockerfile
└── nginx.conf                       # Config para servir el build tras Nginx
```

## Sistema de diseño

Tokens CSS en `src/styles/theme.css`:

- Paleta sage (brand `--brand = #285444`), acentos coral/ochre/forest/slate/plum
- Tipografía: Geist (display/body) + JetBrains Mono (tabular)
- Componentes: `.page`, `.page-header`, `.card`, `.card-elevated`, `.stat-card`, `.data-table`, `.btn`, `.btn-primary|secondary|ghost|danger|ai`, `.form-input`, `.form-group`, `.badge`, `.field-error`, `.form-banner`
- Animaciones: `fadeIn`, `slideUp`, `pageIn` con `var(--ease-smooth)`

## Rutas principales

Todas (excepto `/`, `/login`, `/forgot-password`, `/reset-password`) están protegidas por rol via `ProtectedRoute`.

| Ruta | Rol | Vista |
|---|---|---|
| `/` | público | Landing |
| `/login` | público | Login con panel editorial |
| `/forgot-password`, `/reset-password` | público | Recuperación de contraseña |
| `/admin` | admin | Dashboard administrativo |
| `/admin/usuarios` | admin | Gestión de empleados |
| `/admin/auditoria` | admin | Registros de auditoría |
| `/admin/mantenimiento` | admin | Backup/restore |
| `/admin/configuracion` | admin | Configuración de la clínica |
| `/admin/plantillas` | admin | Plantillas de documentos |
| `/doctor` | doctor | Sala de espera en tiempo real |
| `/doctor/pacientes` | doctor | Expedientes + historial |
| `/doctor/consulta/:id` | doctor | Consulta médica (receta, dx) |
| `/doctor/agenda` | doctor | Calendario de citas |
| `/doctor/aseguradoras` | doctor | Convenios |
| `/doctor/reportes/aseguradoras` | doctor | Reporte de cobro |
| `/reception` | assistant | Panel de recepción |
| `/reception/pacientes` | assistant | Registro/edición de pacientes |
| `/reception/preclinica` | assistant | Toma de signos vitales |
| `/reception/agenda` | assistant | Agendar citas |

## Flujo de atención (resumen)

```
Recepción registra paciente
      │
      ├── Agenda cita (scheduled)
      │       └── Día de la cita: "Llegó" → (present)
      │               └── "Tomar signos" → pre-clínica
      └── Walk-in directo a pre-clínica
                      │
                      ▼
              preclinical.status = "waiting"
                      │
                      ▼
              Doctor inicia consulta → "in_consultation"
                      │
                      ▼
              Finalizar consulta → INSERT medical_consultations + preclinical = "done"
```

Detalle completo en `src/views/doctor/SalaEspera.jsx:67-78` (handler de inicio) y `src/views/doctor/ConsultaMedica.jsx:306-346` (finalización).

## Docker

### Build (pasa la URL del backend en build-time)

```bash
docker build \
  --build-arg VITE_API_URL=http://localhost:3000 \
  -t clinica-frontend .
```

### Run

```bash
docker run -d --name clinica-frontend -p 5173:80 clinica-frontend
```

Expone en `http://localhost:5173`. La config de Nginx está en `nginx.conf` (fallback a `index.html` para SPA routing).

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | React 19 |
| Build | Vite 7 |
| Routing | React Router v7 |
| Estado servidor | TanStack Query v5 |
| Formularios | React Hook Form + Zod |
| Auth | Better Auth (cliente) |
| HTTP | Axios |
| Iconos | Remix Icon |
| Notificaciones | react-hot-toast |
| Fuentes | Geist + Inter + JetBrains Mono |

## Troubleshooting

### "Network Error" o CORS en el login

Verifica que el BackEnd esté corriendo y que `APP_ALLOWED_ORIGINS` en `BackEnd/.env` contenga la URL del frontend (`http://localhost:5173` en dev).

### Sesión no persiste al recargar

Better Auth usa cookies con `SameSite=Lax`. Si frontend y backend están en dominios/puertos distintos en producción, revisa `cookieDomain` en `BackEnd/src/config/auth.js:37`.

### `VITE_API_URL` no aplica en producción

Las variables `VITE_*` se sustituyen en **build-time**, no en runtime. Reconstruye el bundle cada vez que cambies la URL del backend.

### Build muestra warning de chunk >500KB

Es esperado (Remix Icon + React + React Query). Para optimizar, activar code-splitting con `manualChunks` en `vite.config.js`.
