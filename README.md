# MedAgenda Móvil

Aplicación móvil de agendamiento médico construida con **Expo SDK 57**, **React Native**, **Expo Router** y **NativeWind**. Permite a pacientes buscar clínicas y agendar citas, a médicos atender su agenda del día y emitir recetas en PDF, y a administradores gestionar sus clínicas.

**Equipo:** Samuel Felipe Sánchez Vargas, Miguel Suárez Obando.

## Requisitos

- Node.js 20 o superior y npm.
- Expo Go para pruebas rápidas, o Android Studio / Xcode para builds nativos.
- Los recordatorios con precisión de alarma en Android necesitan el módulo nativo `modules/medagenda-reminder-access`, así que requieren un build propio (`npm run android` o el APK de EAS); en Expo Go no funcionan completos.

## Instalación

```bash
npm install
cp .env.example .env   # en Windows: copy .env.example .env
npm start
```

`EXPO_PUBLIC_API_URL` define el backend. Por defecto apunta al servidor público en Vercel. Para un backend local en el emulador de Android usa `http://10.0.2.2:3001`; en un teléfono físico, la IP LAN del computador. El backend no usa prefijo `/api`. Después de cambiar la variable, reinicia Metro con `npm run start:clean`.

## Scripts

| Script | Uso |
|---|---|
| `npm start` | Inicia Metro / Expo |
| `npm run start:clean` | Inicia Metro limpiando la caché |
| `npm run android` / `npm run ios` | Ejecuta la app en Android / iOS |
| `npm run typecheck` | Verifica tipos con TypeScript |
| `npm run test:reminders` | Ejecuta todas las pruebas de `tests/` |

## Roles

Cada usuario entra en un modo según sus permisos y solo ve sus pantallas. Quien tiene varios roles cambia de modo desde Perfil.

| Rol | Inicio | Qué puede hacer |
|---|---|---|
| Invitado | Clínicas | Buscar clínicas y médicos, iniciar sesión o registrarse |
| Paciente | Próxima cita | Agendar, reprogramar y cancelar citas, activar recordatorios, ver recetas y descargarlas en PDF |
| Médico | Agenda de hoy | Despachar citas (llamar, atender, marcar no asistió), ver historial del paciente, emitir y editar recetas |
| Administrador | Resumen de sedes | Crear clínicas, editar datos, horarios y equipo, eliminar clínicas propias |

## Flujo de demostración

1. Un paciente busca una clínica con un dermatólogo y agenda una cita.
2. Activa los recordatorios: recibe un aviso local 24 horas y 1 hora antes.
3. El médico abre su agenda del día, llama al paciente y lo atiende.
4. Durante la consulta emite la receta y ve las recetas anteriores del paciente.
5. El paciente abre la receta desde su app como PDF y la comparte.

## Estructura

```text
app/         Rutas de Expo Router (solo enrutan, sin lógica)
src/api/     Cliente HTTP y endpoints del backend
src/screens/ Pantallas por funcionalidad, con sus hooks y componentes
src/components/  Componentes compartidos (botones, tarjetas, campos)
src/hooks/   Hooks compartidos entre funcionalidades
src/utils/   Funciones puras (estados de cita, disponibilidad, PDF, validaciones)
src/theme/   Tokens de diseño usados por Tailwind y por el código
tests/       Pruebas con node:test ejecutadas con tsx
docs/        Documentación de recordatorios y reprogramación
```

Las reglas de arquitectura están en `FRONTEND_ARCHITECTURE_STANDARD.md`, el sistema de diseño en `DESIGN_SYSTEM.md` y `dict_styles.md`, y el estado del MVP en `06-medagenda.md`.

## Build de prueba (APK)

```bash
npx eas build --platform android --profile preview
```

El perfil `preview` de `eas.json` genera un APK instalable.

## Privacidad

El registro exige aceptar la política de tratamiento de datos personales según la Ley 1581 de 2012. Los recordatorios no incluyen síntomas ni notas clínicas.
