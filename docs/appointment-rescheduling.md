# Reprogramación de citas

Desde **Mis Citas → Gestionar Cita → Reprogramar cita**, el paciente puede elegir otro día y horario con el mismo médico y clínica. La selección abre un modal; volver o cancelar la confirmación conserva la cita y las notas sin guardar del detalle.

La disponibilidad utiliza las reglas y reservas reales de la clínica. Agendamiento y reprogramación comparten el selector y el cálculo de horarios. Las fechas y horas se interpretan explícitamente en `America/Bogota`, independientemente de la zona del teléfono. Se bloquean descansos, horarios ocupados y pasados; los fines de semana siguen la restricción actual del backend. El horario actual aparece identificado y no se puede confirmar como un cambio.

Al confirmar se hace `PUT /appointments/:id` con las dos fechas ISO. Se conserva el ID, médico, clínica y descripción; no se cancela y crea una segunda cita. Si otro paciente ocupa el horario, la respuesta de conflicto mantiene el horario anterior y vuelve a consultar la disponibilidad. El botón y los selectores se bloquean mientras se guarda.

Después del éxito del servidor, se retiran los avisos antiguos y se sincronizan los nuevos recordatorios de 24 h y 1 h. Si falla esa sincronización, el cambio de la cita sigue siendo exitoso y se muestra una advertencia para reintentar desde Mis Citas. Un cambio de cuenta invalida las respuestas pendientes.

## Contrato del backend

`GET /appointments/patient` debe devolver `doctor_id` y `clinic_id` para cada cita. La consulta del backend se amplía con `a.doctor_id`; no cambia el esquema ni se identifican médicos por su nombre. El cambio está en la rama `feature/notificaciones-citas` del backend. Esta versión de la app requiere desplegar ese cambio en el backend al que apunte `EXPO_PUBLIC_API_URL`.

Las rutas de reprogramación existentes siguen validando propiedad, fechas futuras, duración y disponibilidad en una transacción. No se modifican estas reglas ni las ramas `Main`/`main` en este trabajo.

## Validación

```powershell
npm run typecheck
npm run test:reminders
```

Las 26 pruebas del móvil cubren fechas en Colombia y cambios de calendario, ocupación/descanso/pasado, exclusión de la cita actual, conservación del ID y notas, conflictos, fallos de red o notificaciones y cambios de sesión. Las 15 pruebas del backend y su compilación validan también el identificador del médico en la respuesta.

Para la aceptación nativa se utiliza el servidor aislado `node tests/fixtures/appointments-server.cjs`, con clínica, reglas y citas ficticias en memoria. Permite provocar un conflicto con `POST /__qa/conflict-next` y comprobar el estado con `GET /__qa/state`. No se consulta ni modifica una base de datos real.

La evidencia final del profesor debe repetirse contra un backend real disponible que incluya `doctor_id`, con las dos ramas integradas y desplegadas cuando se autorice.

## Aceptación Android — 23 de noviembre de 2026

Se comprobó en el APK de release instalado en un emulador API 36, usando exclusivamente el servidor ficticio:

- Horario actual, reservas ajenas y descansos deshabilitados; cancelar la confirmación no envía un cambio.
- Reprogramación desde las 08:00 a las 11:00 conservando ID, notas, médico y clínica. El `PUT` contiene únicamente las dos fechas.
- Verificación directa de AlarmManager: los cuatro avisos exactos de las dos citas coinciden con sus fechas actualizadas. Se sustituyen los dos de la cita modificada y se conservan los de la otra cita.
- Conflicto HTTP 409: se conserva el horario anterior y todos los avisos; se vuelve a consultar disponibilidad y el horario disputado aparece ocupado.
- Al volver a Mis Citas, la lista muestra el nuevo horario.
- El agendamiento existente sigue funcionando con el selector compartido: cambiar de día limpia la selección anterior y permite crear una cita nueva. Al finalizar se verificaron tres citas y sus seis avisos correctos.

La evidencia funcional queda en `dist/rescheduling/native-proof.json`; las capturas se conservan en ese directorio. El emulador se ejecutó con renderizado por software para obtener capturas válidas.

El APK final con la URL pública y sin excepción HTTP está en `dist/apk/MedAgenda-Reprogramacion.apk`. El APK de la prueba aislada no es el archivo de entrega.
