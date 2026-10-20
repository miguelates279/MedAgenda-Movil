# MedAgenda · Checklist MVP

**Equipo:** Samuel Felipe Sánchez Vargas, Miguel Suárez Obando
**Fuente:** `MedAgenda.pdf` · **Fecha límite:** viernes 5 de diciembre de 2026 (7 semanas)

## Diagnóstico

El backend viene de semestres anteriores y es fuerte. La app ya tiene buscador de clínicas con agendamiento, CRUD de citas y recetas, dashboard del doctor, login/registro y una buena refactorización (hooks, `app/` solo enruta).

El documento describe mucho alcance de la plataforma completa (WhatsApp, facturación electrónica, pagos) que **no** es el MVP móvil. Lo que el propio equipo marca como faltante es lo correcto: administrar clínicas, ejecutar citas (despacho) y **ordenar la app por rol**. Esto último es lo más urgente: si cada rol no tiene su propia navegación, ninguna demo se entiende.

Observaciones:
- Falta una sección de "estado actual" más concreta: qué roles existen y qué ve cada uno.
- La "ejecución de citas" necesita una máquina de estados clara (por ejemplo `agendada → confirmada → en sala → en consulta → atendida`, con `cancelada` y `no asistió`). Las transiciones válidas las decide el backend.
- Recordatorios: WhatsApp y SMS cuestan dinero. Las **notificaciones locales** con `expo-notifications` son gratis y cubren "que no olviden su cita".

## Fuera del alcance

- WhatsApp, SMS, enlaces de pago y facturación electrónica.
- Historial clínico completo editable (solo consulta de citas y recetas previas).
- Publicación en tiendas.

## Checklist

### Obligatorio · Diseño de la interfaz

Estilo elegido: **Clean Clinical UI / Flat 2.0** (diseño de superficies limpias, elevación sutil y bordes delimitados de 1px).
* **Justificación médica y accesibilidad:** Se descartan *Neumorphism* (contraste deficiente que rompe normas WCAG e impide a adultos mayores o pacientes bajo estrés distinguir botones e inputs) y *Claymorphism* (estética lúdica/juguete inapropiada para el contexto clínico formal, además de desperdiciar valioso espacio en pantalla por redondeces exageradas). Clean Clinical UI asegura contraste superior a 15:1 en texto principal (`#171717` sobre `#ffffff`), affordance inmediato y excelente rendimiento nativo en cualquier dispositivo móvil.

- [x] Elegir el estilo y justificarlo en el documento.
- [x] Tokens (colores por rol si ayudan, radios, sombras) centralizados en `tailwind.config.js`, `dict_styles.md` y `src/theme/tokens.ts`.
- [ ] Componentes base: tarjeta de cita (con su estado), tarjeta de clínica/médico, botón, campo de texto, badge de estado.
- [ ] Aplicado a: buscador, agendamiento, mis citas, dashboard del doctor, recetas, admin.
- [ ] Contraste 4.5:1 y estados presionado/deshabilitado.
- [ ] Probado en Android e iOS.

### Fase 1 · Ordenar la app por rol (20 oct – 2 nov)

<!-- - [ ] Escribir en el documento la tabla rol → pantallas (paciente, médico, administrador de clínica). -->
- [ ] Navegación por rol con `Stack.Protected` / tabs distintas: cada rol ve solo lo suyo desde el inicio.
- [ ] Mover cada función a la sección del rol que la usa (lo que el equipo identificó como "no tiene sentido").
- [ ] Pantalla de inicio por rol (paciente: próxima cita; médico: agenda de hoy; admin: resumen de la clínica).
- [ ] Cerrar sesión automáticamente si el backend responde 401.

### Fase 2 · Clínicas y despacho de citas (3 – 16 nov)

- [ ] Administración de clínicas: editar datos, horarios, médicos asociados y eliminar con confirmación.
- [ ] Máquina de estados de la cita en el backend; la app solo envía la acción y muestra el error si no es válida.
- [ ] Despacho para el médico/recepción: agenda del día agrupada por hora (`SectionList`), botones "Llamar a consulta", "Atender", "Marcar no asistió".
- [ ] El paciente ve el estado de su cita en tiempo casi real (refrescar al enfocar la pantalla + pull-to-refresh).
- [ ] Paciente puede cancelar o reprogramar (la regla de anticipación mínima la valida el backend).

### Fase 3 · Valor para paciente y médico (17 – 28 nov)

- [ ] Recordatorio local de la cita (24 h y 1 h antes) con `expo-notifications`, programado al agendar y cancelado al cancelar.
- [ ] Receta en PDF con `expo-print` y compartir con `expo-sharing` (reemplaza el papel, que es la promesa del alcance).
- [ ] Historial de recetas del paciente visible para el médico al atenderlo.
- [ ] Consentimiento de tratamiento de datos en el registro (Ley 1581/2012; está en el alcance de seguridad).
- [ ] Estados de carga, vacío y error en todas las listas.
- [ ] Márgenes seguros con insets (botón "Agendar" fijo abajo, formularios con teclado).

### Cierre · Entrega (1 – 5 dic)

- [ ] Backend y base de datos en plan gratuito (o túnel gratuito para la demo).
- [ ] APK de prueba (EAS gratuito) o demo en Expo Go.
- [ ] Datos semilla: 2 clínicas, 3 médicos de distintas especialidades, 3 pacientes, citas en todos los estados.
- [ ] README + video: paciente busca médico → agenda → recibe recordatorio → médico lo atiende → emite receta en PDF.

## Definición de terminado

Un paciente busca un dermatólogo, agenda una cita y recibe un recordatorio local; el médico ve su agenda del día, llama al paciente, lo atiende, emite la receta y el paciente la abre como PDF desde su app. El administrador de la clínica gestiona médicos y horarios. Cada rol entra a una app que solo le muestra lo suyo.
