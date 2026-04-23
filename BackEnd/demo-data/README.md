# Demo data — Clínica Esperanza

Dataset clínico realista para demos y pruebas de analítica (HU-07, AI, reportes).

## Cobertura

| Rango | Consultas | Citas | Medicamentos |
|---|---|---|---|
| 2024-01 → 2024-12 | ~278 | ~200 | ~310 |
| 2025-01 → 2025-12 | ~302 | ~215 | ~340 |
| 2026-01 → 2026-04-23 | ~118 | ~80 | ~135 |
| **Total** | **~700** | **~500** | **~785** |

- **60 pacientes** (48 adultos, 12 menores).
- **6 aseguradoras** con montos pre-negociados distintos.
- **25 diagnósticos CIE-10** reales con distribución realista (frecuencia top: hipertensión, diabetes tipo 2, resfriado común).
- Factor estacional (más consultas respiratorias en junio-agosto y enero).
- Mix: 70% consultas con cita previa, 30% walk-in.
- 80% de consultas con aseguradora son facturadas a ella.
- **3 pacientes en sala de espera activa hoy** — para poder demostrar el flujo del doctor sin pre-poblar manualmente.

## Archivos

### `seed_demo.sql` (1 MB)

Dump MySQL/MariaDB con `INSERT` completos. Para cargar en otra DB:

```bash
# Prerequisito: tablas creadas (correr migraciones antes).
mariadb -uroot -proot tu_db < seed_demo.sql
```

Las tablas incluidas son:
- `patients` · `insurers` · `appointments`
- `preclinical_records` · `medical_consultations` · `prescribed_medications`

**No incluye** `users` (los crea `npm run seed`), ni `document_templates` (los crea `npm run seed:templates`), ni `audit_logs` ni `__drizzle_migrations`.

### `consultas_por_mes.csv`

Vista tabular de consultas agregadas por año + mes + código CIE-10. 395 filas. Ideal para pegar en Excel o alimentar análisis rápidos.

```csv
year,month,code,diagnosis,total
2024,1,I10,Hipertensión esencial (primaria),6
2024,1,E11.9,Diabetes mellitus tipo 2 sin complicaciones,4
...
```

## Regeneración

Si quieres limpiar y regenerar todo desde cero:

```bash
# 1. Borrar datos existentes (mantiene schema):
docker exec DB mariadb -uroot -proot consultorio -e "
  SET FOREIGN_KEY_CHECKS=0;
  TRUNCATE prescribed_medications;
  TRUNCATE medical_consultations;
  TRUNCATE preclinical_records;
  TRUNCATE appointments;
  DELETE FROM patients;
  DELETE FROM insurers;
  SET FOREIGN_KEY_CHECKS=1;
"

# 2. Re-ejecutar el seeder:
cd BackEnd && npm run seed:demo

# 3. (Opcional) regenerar el dump SQL:
docker exec DB mariadb-dump -uroot -proot --skip-triggers --complete-insert \
  consultorio patients insurers appointments preclinical_records \
  medical_consultations prescribed_medications \
  > demo-data/seed_demo.sql
```

## Uso típico en demo

1. **Reporte de diagnósticos** (`/doctor/reportes/diagnosticos`):
   - Selecciona rango 2024 → 2026.
   - Muestra las tendencias, top 6, gráficos, export PDF/Excel.
   - Pulsa "Análisis con IA" para la narrativa generativa.

2. **Analítica por aseguradora** (`/doctor/reportes/aseguradoras`):
   - Filtra por MAPFRE o ASESUISA en el último año.
   - Verás pacientes atendidos y monto total a cobrar.

3. **Historial clínico con IA** (`/doctor/pacientes` → Historial):
   - Elige un paciente crónico (los que tienen DM2/HTA tienen 8-14 consultas/año).
   - Botón "Resumen IA" genera el patient-at-a-glance.

4. **Sala de espera** (`/doctor`):
   - Hay 3 pacientes activos listos para iniciar consulta.
