# Recordatorios locales de citas

Implementación del flujo de MedAgenda descrito en el entregable del profesor (sección 4.2): recordatorios 24 horas y 1 hora antes de una cita. Se adaptan los patrones de la guía de notificaciones: canal antes del permiso, presentación en primer plano, destino pendiente hasta iniciar sesión y limpieza antes de salir de la cuenta. El envío push del ejemplo Helpdesk no forma parte de este flujo local.

## Configuración

- `expo-notifications` se instala con `npx expo install expo-notifications`, usando la versión compatible con el SDK 57 del proyecto. Se registra su plugin en `app.json`.
- Android declara `SCHEDULE_EXACT_ALARM`. El módulo local `modules/medagenda-reminder-access` comprueba el acceso especial y abre la página de **Alarmas y recordatorios** de esta app cuando el usuario lo autoriza. Sin ese acceso, Android puede dar una ventana de retraso de hasta una hora. Por eso la app mantiene desactivados sus avisos hasta que se concedan ambos permisos, con un acceso **Revisar puntualidad** en Mis Citas. Rechazarlo no bloquea las citas. Al volver de Ajustes se recuperan los avisos futuros y se sustituyen programaciones anteriores con otra precisión.
- Los recordatorios locales no necesitan FCM, cuenta Apple de pago ni tokens push. El control de precisión Android requiere el módulo nativo del APK propio; no está incluido en Expo Go.
- `EXPO_PUBLIC_API_URL` selecciona el backend. La configuración conserva la URL pública que usaba el cliente. Para probar el backend local en un emulador Android: `http://10.0.2.2:3001`. En un teléfono, usar la IP LAN del computador. El backend no tiene prefijo `/api`. HTTP local requiere un build de desarrollo o una configuración temporal de pruebas; el APK entregado conserva HTTPS y no permite tráfico HTTP por una excepción añadida. Reiniciar Metro o recompilar el APK después de cambiar la variable.
- El backend requiere desplegar las nuevas rutas si el APK apunta al servidor público. No se hicieron cambios al esquema ni se requieren migraciones.

## Comportamiento

1. Al agendar una cita real se consultan las citas del paciente y se ofrece activar los recordatorios, con una explicación previa al diálogo del sistema. Negar el permiso no cancela la cita ni bloquea la app. También se pueden activar desde **Mis Citas**.
2. Se programa cada aviso futuro usando la fecha con zona horaria del backend. Si faltan menos de 24 horas se omite el aviso de 24 horas; si falta menos de una hora no se genera un aviso retroactivo. El mensaje incluye médico, clínica y fecha/hora de Colombia; no incluye síntomas o notas clínicas.
3. El sistema operativo conserva los avisos aunque el proceso de la app termine. El manejador de primer plano habilita banner, lista y sonido.
4. El toque abre `/appointments/[id]`. Con la app cerrada y sin sesión en memoria, primero se presenta el login, se espera el perfil y la resolución de roles, se cambia al modo Paciente si hace falta y se abre la cita. Se consume la respuesta para evitar reaperturas. Una cuenta distinta no abre el aviso de otro paciente.
5. Al cancelar se retiran los dos avisos y los avisos ya mostrados. Los cambios de fecha del servidor sustituyen los horarios anteriores manteniendo el ID de la cita. La edición de notas también conserva la sincronización. La pantalla para reprogramar corresponde al siguiente punto del inventario; la API ya admite el cambio de fecha.
6. Se reconcilia al iniciar sesión, al consultar/refrescar Mis Citas, al volver a primer plano, después de una modificación y cada minuto mientras la app está activa. La falta de red conserva los avisos existentes. Cerrar sesión o cambiar de cuenta retira los avisos del paciente anterior; las respuestas tardías no pueden recrearlos.

**Límite de las notificaciones locales:** un cambio realizado desde otro dispositivo mientras esta app permanece cerrada no se puede conocer hasta la siguiente sincronización. Para modificar avisos inmediatamente en ese escenario se necesitaría un flujo push adicional. En iOS se conservan los 64 próximos avisos por el límite del sistema; la ventana se repone al sincronizar. Android conserva todos los avisos futuros de la lista recibida.

## Backend

Las rutas existentes de agendamiento y consulta se conservan. Se agregan:

- `PUT /appointments/:id`: notas o las dos fechas `start_date_time` y `end_date_time`. Valida propiedad usando el paciente de la sesión, fechas futuras, duración de la clínica, disponibilidad y conflictos. Conserva el ID de la cita.
- `DELETE /appointments/:id`: cancela una cita futura del paciente autenticado y libera el cupo.

Las fechas se guardan y consultan como instantes Unix y se devuelven en ISO UTC. El formato mostrado en los avisos usa explícitamente la hora de Colombia. Así se evita interpretar el texto UTC como una hora local de MySQL o depender de sus tablas de zonas horarias.

La consulta y la modificación se ejecutan en una transacción con bloqueo de la cita. El agendamiento y la reprogramación también bloquean la fila del médico antes de consultar disponibilidad para serializar las reservas simultáneas. Una cita de otro paciente devuelve 404. No se acepta un `patient_id` enviado por el cliente. Las pruebas usan dobles y no escriben en una base de datos real.

## Validación automática

En el móvil:

```powershell
npm ci
npm run typecheck
npm run test:reminders
npx expo export --platform android --output-dir dist/notifications
```

En `Backend-MedAgenda`:

```powershell
npm test -- --runInBand
npm run build
```

## Prueba de aceptación en el APK

1. Instalar un APK nuevo con el plugin. Entrar con un paciente y agendar una cita. Confirmar la explicación del permiso y aceptar el diálogo del sistema. Verificar en los avisos programados las dos fechas relativas a la cita.
2. Para no esperar un día en una prueba, agendar una cita real a algo más de 24 horas: el aviso de 24 horas llegará en el margen restante. Agendar otra a algo más de una hora para el aviso de una hora. No se incorpora un botón de notificación de prueba al producto.
3. Comprobar recepción y toque con la app en primer plano, segundo plano y con su proceso terminado. Cerrar desde recientes o terminar el proceso no equivale a **Forzar detención** desde Ajustes: Android suspende los avisos de una app forzada a detenerse hasta que se vuelva a abrir.
4. Desde la app cerrada, tocar el aviso, iniciar sesión y comprobar que abre la cita exacta. Repetir con una cuenta que también tenga modo Médico o Administrador. Probar otra cuenta y confirmar que no abre el caso ajeno.
5. Cancelar una cita antes de sus avisos: ya no deben llegar. Reprogramar por la API y sincronizar: únicamente deben quedar los nuevos horarios. Comprobar que un aviso ya mostrado de la hora anterior se retira.
6. Negar el permiso, agendar y consultar citas: la app debe seguir funcionando. Activar el permiso después desde Mis Citas/Ajustes y volver a la app para recuperar los avisos futuros.
7. Repetir sincronización, reiniciar la app y alternar cuentas: no deben aparecer duplicados ni avisos de la cuenta anterior. Cortar la red y verificar que no se eliminan avisos válidos por interpretar el fallo como una lista vacía.

La entrega del profesor requiere grabar el flujo real en el APK y conservar las capturas. Las pruebas automatizadas no sustituyen esa evidencia.

Para pruebas nativas aisladas existe `node tests/fixtures/appointments-server.cjs`: solo escucha en el loopback, usa datos ficticios en memoria y no consulta ni modifica el backend real. Es un doble de transporte para comprobar Android; las reglas y rutas reales se verifican con las pruebas del backend.

## Resultado de la validación — 20 de noviembre de 2026

- Pasaron 15 pruebas de recordatorios del móvil, 15 pruebas del backend, TypeScript, la exportación Android con Hermes, la compilación del backend y la compilación nativa del APK Android.
- En un emulador Android API 36 se comprobó con datos aislados: rechazo del permiso sin bloquear las citas, activación desde Mis Citas, acceso especial de alarmas, alarmas exactas con `window=0`, entrega de 24 horas en primer plano y de 1 hora en segundo plano, apertura de la cita al tocar el aviso, cambio de fecha y cancelación desde la interfaz con retirada de ambos avisos futuros.
- También se comprobó la apertura de la cita tras un arranque en frío y login. Una prueba adicional terminó el proceso antes de la hora prevista y observó un aviso nuevo después: cierre a las `18:05:00.730Z`, aviso previsto a las `18:05:31.875Z` y observado a las `18:05:36.245Z`. La evidencia está en `dist/notifications/native-closed-delivery-proof.json`. No se usó la opción Forzar detención.
- El APK final está en `dist/apk/MedAgenda-Notificaciones.apk`. Se verificó que contiene el módulo nativo de permisos y la URL pública, sin la URL del servidor de pruebas ni la excepción temporal de HTTP utilizada en la prueba aislada.
- No se probaron dispositivos iOS. El límite de 64 avisos y la planificación de fechas tienen cobertura automatizada; la recepción nativa iOS queda pendiente.

**Pendiente del entorno real:** la consulta pública `GET https://med-agenda-1-three.vercel.app/location/getCountries` respondió HTTP 500 durante esta sesión. No se desplegó el backend ni se probó una reserva contra la base de datos real. Para grabar la evidencia final del profesor hay que restablecer esa API y desplegar las rutas de modificación/cancelación, o configurar un backend propio disponible. El APK generado apunta a la URL pública.
