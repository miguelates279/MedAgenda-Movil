# MedAgenda · Checklist MVP

**Equipo:** Samuel Felipe Sánchez Vargas, Miguel Suárez Obando
**Fuente:** `MedAgenda.pdf` · **Fecha límite:** viernes 5 de diciembre de 2026 (7 semanas)
**Última revisión contra el código:** sábado 28 de noviembre de 2026

## Diagnóstico

El backend viene de semestres anteriores y es fuerte. La app ya tiene buscador de clínicas con agendamiento, CRUD de citas y recetas, dashboard del doctor, login/registro y una buena refactorización (hooks, `app/` solo enruta).

El documento describe mucho alcance de la plataforma completa (WhatsApp, facturación electrónica, pagos) que **no** es el MVP móvil. Lo que el propio equipo marca como faltante es lo correcto: administrar clínicas, ejecutar citas (despacho) y **ordenar la app por rol**. Esto último es lo más urgente: si cada rol no tiene su propia navegación, ninguna demo se entiende.

Observaciones:
- Falta una sección de "estado actual" más concreta: qué roles existen y qué ve cada uno. *(Resuelto: ver tabla de roles en Fase 1 y el README.)*
- La "ejecución de citas" necesita una máquina de estados clara. *(Resuelto: `scheduled → confirmed → waiting → called → in_progress → completed`, más `cancelled` y `no_show`; el backend devuelve `allowed_actions` y valida con `expected_version`.)*
- Recordatorios: WhatsApp y SMS cuestan dinero. Las **notificaciones locales** con `expo-notifications` son gratis y cubren "que no olviden su cita".

## Estado al 28 de noviembre

Las fases 1, 2 y 3 están completas en código. Queda:

1. **Estilo visual:** el documento dice *Clean Clinical UI* y descarta Claymorphism, pero desde el commit `e4902a1` la app usa un diseño "clay" tokenizado (`ClaySurface`, `ClayPressable`, `rounded-clay`, sombras `clay-*`). Hay que alinear el documento con el código o el código con el documento antes de sustentar.
2. **Probar en Android e iOS.**
3. **Cierre:** generar el APK, cargar los datos semilla, grabar el video y reemplazar los íconos genéricos de Expo (`assets/icon.png`, `adaptive-icon.png`, `splash-icon.png`).

## Fuera del alcance

- WhatsApp, SMS, enlaces de pago y facturación electrónica.
- Historial clínico completo editable (solo consulta de citas y recetas previas).
- Publicación en tiendas.

## Checklist

Leyenda: `[x]` hecho y verificado en código · `[ ]` pendiente · ⚠️ parcial o por verificar.

### Obligatorio · Diseño de la interfaz

Estilo elegido: **Clean Clinical UI** (diseño de superficies limpias, elevación sutil y bordes delimitados de 1px).
* **Justificación médica y accesibilidad:** Se descartan *Neumorphism* (contraste deficiente que rompe normas WCAG e impide a adultos mayores o pacientes bajo estrés distinguir botones e inputs) y *Claymorphism* (estética lúdica/juguete inapropiada para el contexto clínico formal, además de desperdiciar valioso espacio en pantalla por redondeces exageradas). Clean Clinical UI asegura contraste superior a 15:1 en texto principal (`#171717` sobre `#ffffff`), affordance inmediato y excelente rendimiento nativo en cualquier dispositivo móvil.

- [x] Elegir el estilo y justificarlo en el documento.
- [x] Tokens (colores por rol si ayudan, radios, sombras) centralizados en `tailwind.config.js`, `dict_styles.md` y `src/theme/tokens.ts` (todos leen de `src/theme/design-tokens.js`).
- [x] Componentes base: tarjeta de cita (con su estado), tarjeta de clínica/médico, botón, campo de texto, badge de estado (`AppointmentCard`, `AppointmentDispatchCard`, `AppointmentStatusBadge`, `ClinicCard`, `DoctorCard`, `Button`, `Field`, `Badge`).
- [ ] ⚠️ Aplicado a: buscador, agendamiento, mis citas, dashboard del doctor, recetas, admin. Los tokens se usan en todas las pantallas, pero con la capa "clay" que contradice el estilo declarado arriba.
- [x] Contraste 4.5:1 y estados presionado/deshabilitado (`active:` y `disabled` en botones; `min-h-touch` en controles).
- [ ] Probado en Android e iOS.

### Fase 1 · Ordenar la app por rol (20 oct – 2 nov)

## Tabla de Rol → Pantallas y Rutas Protegidas

| Rol | Pantalla de Inicio | Pestañas (Tabs) Visibles | Rutas Adicionales Protegidas | Funcionalidades y Alcance por Rol |
|---|---|---|---|---|
| **Invitado** (No autenticado) | `/clinics` (Catálogo público) | Clínicas (`/clinics`), Perfil (`/profile`) | Ninguna (rutas privadas bloqueadas); `/clinics/[id]` es pública | Búsqueda pública de clínicas y doctores, formulario de login y registro con consentimiento de datos |
| **Paciente** | `/home` (Próxima Cita) | Inicio (`/home`), Citas (`/appointments`), Clínicas (`/clinics`), Perfil (`/profile`) | `/appointments/new`<br>`/appointments/[id]`<br>`/prescriptions/index` | Próxima cita, agendamiento, reprogramación y cancelación, historial de citas, recetas en PDF y recordatorios locales |
| **Médico** | `/doctor` (Agenda de Hoy) | Inicio (`/doctor`), Perfil (`/profile`) | Modales de prescripción en `/doctor` | Agenda del día agrupada por hora con acciones de despacho, historial por paciente, expedición, edición, eliminación y PDF de recetas |
| **Administrador de Clínica** | `/admin` (Resumen de Sedes) | Inicio (`/admin`), Perfil (`/profile`) | `/clinics/mine`<br>`/clinics/manage/[id]`<br>`/clinics/new` (cualquier usuario autenticado) | Sedes a cargo, registro de nueva clínica, administración de datos, horarios y equipo, eliminación (solo *Owner*) |

- [x] Navegación por rol con `Stack.Protected` / `Tabs.Protected`: cada rol ve solo lo suyo desde el inicio (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`).
- [x] Mover cada función a la sección del rol que la usa (lo que el equipo identificó como "no tiene sentido").
- [x] Pantalla de inicio por rol (paciente: próxima cita; médico: agenda de hoy; admin: resumen de la clínica).
- [x] Cerrar sesión automáticamente si el backend responde 401 (`ApiClient.onUnauthorized`; distingue el 401 de permisos del backend con una verificación contra `/users/profile`).

### Fase 2 · Clínicas y despacho de citas (3 – 16 nov)

- [x] Administración de clínicas: editar datos, horarios, médicos asociados y eliminar con confirmación (`ClinicManagementScreen` con `ClinicEditorFields`, `ClinicTeam` y `ClinicOwnerProvider` en `/clinics/manage/[id]`; eliminación solo *Owner* con resincronización de roles).
- [x] Máquina de estados de la cita en el backend; la app solo envía la acción y muestra el error si no es válida (`POST /appointments/:id/actions` con `expected_version`; botones según `allowed_actions`).
- [x] Despacho para el médico/recepción: agenda del día agrupada por hora (`SectionList` en `TodayAgendaSection`), acciones llamar, iniciar, completar y marcar no asistió en `AppointmentDispatchCard`. Recepción: `ClinicAppointmentAgenda` y `ReceptionClinicsSection`.
- [x] El paciente ve el estado de su cita en tiempo casi real (refrescar al enfocar la pantalla con `useFocusedRefresh` + pull-to-refresh).
- [x] Paciente puede cancelar o reprogramar (la regla de anticipación mínima la valida el backend: `can_reschedule`, `change_deadline`, `RescheduleAppointmentModal`).

### Fase 3 · Valor para paciente y médico (17 – 28 nov)

- [x] Recordatorio local de la cita 24 h y 1 h antes con `expo-notifications`, programado al agendar, sustituido al reprogramar y cancelado al cancelar (`src/screens/appointments/reminders/`, `docs/appointment-reminders.md`).
- [x] Receta en PDF con `expo-print` y compartir con `expo-sharing` (`GET /prescriptions/:id/document`, `usePrescriptionExport`, `PrescriptionPdfActions`), disponible para paciente y médico.
- [x] Historial de recetas del paciente visible para el médico al atenderlo (dashboard por paciente y, al recetar, las últimas cinco recetas en el mismo modal).
- [x] Consentimiento de tratamiento de datos en el registro (Ley 1581/2012): casilla obligatoria y política en `DataPolicyModal`. El consentimiento se valida en la app; el backend no lo almacena.
- [x] Estados de carga, vacío y error en todas las listas (recetas del paciente ahora muestran el error con "Reintentar" en vez de solo una alerta).
- [x] Márgenes seguros con insets (`SafeAreaView` en el layout raíz, `KeyboardAwareScrollView` en formularios, botón "Confirmar y Guardar Cita" fijo abajo).

### Cierre · Entrega (1 – 5 dic)

- [ ] ⚠️ Backend y base de datos en plan gratuito (o túnel gratuito para la demo). El backend responde en `https://med-agenda-1-three.vercel.app`; verificar que la base de datos siga activa el día de la demo.
- [ ] APK de prueba (EAS gratuito) o demo en Expo Go. `eas.json` ya tiene el perfil `preview` con `buildType: apk`; falta generar el build y reemplazar los íconos genéricos de Expo.
- [ ] Datos semilla: 2 clínicas, 3 médicos de distintas especialidades, 3 pacientes, citas en todos los estados.
- [ ] ⚠️ README + video. El README ya documenta instalación, roles y flujo de demo; falta el video: paciente busca médico → agenda → recibe recordatorio → médico lo atiende → emite receta en PDF.

## Notas técnicas

- `useDoctorDashboard` devuelve más de 35 valores y mezcla agenda, historial y dos modales de receta; incumple las reglas 15 y 16 de `FRONTEND_ARCHITECTURE_STANDARD.md`. No bloquea la entrega.
- El consentimiento de datos solo se exige en la app. Si se quiere evidencia de la autorización (Ley 1581, art. 9), el backend debería guardar fecha y versión de la política aceptada.
- Pruebas: `npm run test:reminders` ejecuta toda la carpeta `tests/`, incluidas las validaciones del registro.

## Definición de terminado

Un paciente busca un dermatólogo, agenda una cita y recibe un recordatorio local; el médico ve su agenda del día, llama al paciente, lo atiende, emite la receta y el paciente la abre como PDF desde su app. El administrador de la clínica gestiona médicos y horarios. Cada rol entra a una app que solo le muestra lo suyo.
