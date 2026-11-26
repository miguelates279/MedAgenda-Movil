const http = require('node:http');

function createLayoutServer({ now = Date.now, log = console.log } = {}) {
  const HOUR = 3_600_000;
  const DAY = 24 * HOUR;
  const pad = (number) => String(number).padStart(2, '0');
  const dayAt = (offset = 0) =>
    new Date(now() - 5 * HOUR + offset * DAY).toISOString().slice(0, 10);
  const instant = (offset, minute = 540) =>
    new Date(
      `${dayAt(offset)}T${pad(Math.floor(minute / 60))}:${pad(minute % 60)}:00-05:00`,
    ).toISOString();
  const futureDay = (offset) => {
    let date = new Date(`${dayAt(offset)}T12:00:00Z`);
    while ([0, 6].includes(date.getUTCDay()))
      date = new Date(date.getTime() + DAY);
    return date.toISOString().slice(0, 10);
  };
  const countries = Array.from({ length: 30 }, (_, index) => ({
    country_id: index + 1,
    country_name:
      index === 0
        ? 'Colombia'
        : index === 29
          ? 'Pais final 30'
          : `Pais ${pad(index + 1)}`,
  }));
  const specialties = Array.from({ length: 30 }, (_, index) => ({
    specialty_id: index + 1,
    specialty_name:
      index === 0
        ? 'Medicina general'
        : index === 29
          ? 'Especialidad final 30'
          : `Especialidad ${pad(index + 1)}`,
  }));
  let clinics = Array.from({ length: 20 }, (_, index) => ({
    clinic_id: index + 1,
    clinic_name:
      index === 19 ? 'Clinica final 20' : `Clinica ${pad(index + 1)}`,
    clinic_address: `Calle ${index + 1} # 10-42`,
    clinic_phone_number: '3105550042',
    clinic_description:
      `Centro medico de pruebas ${index + 1}. Consultas y atencion integral. `.repeat(
        5,
      ),
    city_id: 1,
    is_open: true,
  }));
  const doctors = Array.from({ length: 20 }, (_, index) => ({
    doctor_id: 84 + index,
    first_name: index === 0 ? 'Ana' : `Medico ${pad(index + 1)}`,
    first_last_name: index === 19 ? 'Final' : 'Ruiz',
    second_last_name: 'Pruebas',
    specialties: [specialties[index % specialties.length]],
  }));
  const profileFor = (role, id) => ({
    user_id: id,
    first_name: {
      patient: 'Paciente',
      doctor: 'Medico',
      admin: 'Administrador',
      employee: 'Recepcion',
    }[role],
    first_last_name: 'Pruebas',
    second_last_name: 'Locales',
    legal_id: `1000000${pad(id)}`,
    user_email_address: `${role}@layout.test`,
    user_phone_number: '3105550042',
    birth_date: '1998-08-23',
    gender: 'O',
    address: 'Calle 42 # 10-20',
    city: 'Manizales',
    state: 'Caldas',
    country: 'Colombia',
    emergency_contact_name: 'Contacto de pruebas',
    emergency_contact_phone: '3105550099',
  });
  const profiles = {
    patient: profileFor('patient', 42),
    doctor: profileFor('doctor', 84),
    admin: profileFor('admin', 126),
    employee: profileFor('employee', 168),
  };
  const ownedClinics = {
    patient: new Set(),
    doctor: new Set(),
    admin: new Set(clinics.map((clinic) => clinic.clinic_id)),
    employee: new Set(),
  };
  const receptionClinics = new Set([1]);
  const canDispatchClinic = (role, clinicId) =>
    (role === 'admin' && ownedClinics.admin.has(clinicId)) ||
    (role === 'employee' && receptionClinics.has(clinicId));
  let appointments = Array.from({ length: 40 }, (_, index) => {
    const future = index < 20;
    const ordinal = future ? index + 1 : index - 19;
    const day = future ? futureDay(ordinal + 2) : dayAt(-ordinal);
    const minutes = 480 + (index % 6) * 30;
    const start = new Date(
      `${day}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00-05:00`,
    );
    return {
      appointment_id: index + 1,
      clinic_id: 1,
      doctor_id: 84,
      patient_id: 42,
      patient_first_name: 'Paciente',
      patient_first_last_name: 'Pruebas',
      patient_second_last_name: 'Locales',
      clinic_name: clinics[0].clinic_name,
      first_name: 'Ana',
      first_last_name: 'Ruiz',
      second_last_name: 'Pruebas',
      appointment_status: future
        ? 'scheduled'
        : index % 2
          ? 'completed'
          : 'scheduled',
      status_version: 0,
      status_updated_at: null,
      start_date_time: start.toISOString(),
      end_date_time: new Date(start.getTime() + 30 * 60_000).toISOString(),
      appointment_description:
        ordinal === 20
          ? `Cita final ${future ? 'futura' : 'pasada'} 20`
          : `Consulta de prueba ${ordinal}`,
    };
  });
  const statuses = [
    'scheduled',
    'confirmed',
    'waiting',
    'called',
    'in_progress',
    'completed',
    'cancelled',
    'no_show',
    'scheduled',
    'waiting',
  ];
  appointments.push(
    ...statuses.map((appointment_status, index) => ({
      ...appointments[0],
      appointment_id: 1000 + index,
      patient_first_name: `Paciente ${pad(index + 1)}`,
      patient_first_last_name: 'Pruebas',
      patient_second_last_name:
        index === 9
          ? 'Apellidos extensos de verificaciones de interfaz'
          : 'Locales',
      start_date_time: instant(0, 480 + index * 30),
      end_date_time: instant(0, 510 + index * 30),
      appointment_status,
      appointment_description: `Despacho de prueba ${index + 1}. ${appointments[0].appointment_description}`,
    })),
  );
  const history = Array.from({ length: 20 }, (_, index) => ({
    user_id: index === 0 ? 42 : 400 + index,
    first_name: `Paciente ${pad(index + 1)}`,
    first_last_name: 'Pruebas',
    second_last_name: index === 19 ? 'Final' : 'Locales',
    appointment_date: instant(-index - 1),
    appointment_description: `Historial de prueba ${index + 1}`,
    clinic_id: 1 + (index % 3),
    clinic_name: clinics[index % 3].clinic_name,
  }));
  let prescriptions = Array.from({ length: 40 }, (_, index) => ({
    prescription_id: index + 1,
    patient_id: index < 20 ? 42 : history[index - 20].user_id,
    clinic_id: 1 + (index % 3),
    date_emitted: instant(-1 - index),
    prescription_description:
      index === 19
        ? 'Receta final 20. Indicaciones de prueba.'
        : `Indicaciones de prueba ${index + 1}. `.repeat(4),
  }));
  const mutations = [];
  let roleFailure = false;
  let searchMode = 'normal';
  let failureRoutes = [];
  let nextClinicId = 21;
  let nextAppointmentId = 41;
  let nextPrescriptionId = 41;
  const appointmentEvents = [];
  const statusTargets = {
    confirm: 'confirmed',
    check_in: 'waiting',
    call: 'called',
    start: 'in_progress',
    complete: 'completed',
    no_show: 'no_show',
    cancel: 'cancelled',
  };
  const appointmentDay = (item) =>
    new Date(Date.parse(item.start_date_time) - 5 * HOUR)
      .toISOString()
      .slice(0, 10);
  const canViewAppointment = (item, role) =>
    (role === 'patient' && item.patient_id === profiles.patient.user_id) ||
    (role === 'doctor' && item.doctor_id === profiles.doctor.user_id) ||
    canDispatchClinic(role, item.clinic_id);
  const appointmentCapabilities = (item, role) => {
    const status = item.appointment_status;
    const preconsult = ['scheduled', 'confirmed', 'waiting', 'called'].includes(
      status,
    );
    const today = appointmentDay(item) === dayAt();
    const future = Date.parse(item.start_date_time) > now();
    const patient =
      role === 'patient' && item.patient_id === profiles.patient.user_id;
    const staff = canDispatchClinic(role, item.clinic_id);
    const doctor =
      role === 'doctor' && item.doctor_id === profiles.doctor.user_id;
    const allowed_actions = [];
    if ((patient || staff) && status === 'scheduled' && future)
      allowed_actions.push('confirm');
    if (
      (patient || staff) &&
      ['scheduled', 'confirmed'].includes(status) &&
      today
    )
      allowed_actions.push('check_in');
    if (
      (doctor || staff) &&
      ['scheduled', 'confirmed', 'waiting'].includes(status) &&
      today
    )
      allowed_actions.push('call');
    if (doctor && ['waiting', 'called'].includes(status) && today)
      allowed_actions.push('start');
    if (doctor && status === 'in_progress') allowed_actions.push('complete');
    if (
      (doctor || staff) &&
      ['scheduled', 'confirmed', 'called'].includes(status) &&
      today &&
      !future
    )
      allowed_actions.push('no_show');
    if (
      preconsult &&
      ((patient && future) || (staff && appointmentDay(item) >= dayAt()))
    )
      allowed_actions.push('cancel');
    return {
      allowed_actions,
      can_reschedule:
        patient && ['scheduled', 'confirmed'].includes(status) && future,
      can_edit_notes:
        patient && ['scheduled', 'confirmed'].includes(status) && future,
    };
  };
  const statusSnapshot = (item, role) => ({
    appointment_id: item.appointment_id,
    appointment_status: item.appointment_status,
    status_version: item.status_version,
    status_updated_at: item.status_updated_at,
    ...appointmentCapabilities(item, role),
  });
  const appointmentView = (item, role) => ({
    ...item,
    ...statusSnapshot(item, role),
    ...(role === 'patient'
      ? {}
      : {
          first_name: item.patient_first_name,
          second_name: null,
          first_last_name: item.patient_first_last_name,
          second_last_name: item.patient_second_last_name,
          doctor_first_name: item.first_name,
          doctor_second_name: item.second_name,
          doctor_first_last_name: item.first_last_name,
          doctor_second_last_name: item.second_last_name,
        }),
  });
  const changeStatus = (item, role, action) => {
    const from_status = item.appointment_status;
    item.appointment_status = statusTargets[action];
    item.status_version += 1;
    item.status_updated_at = new Date(now()).toISOString();
    appointmentEvents.push({
      appointment_id: item.appointment_id,
      from_status,
      to_status: item.appointment_status,
      action,
      actor_user_id: profiles[role].user_id,
      occurred_at: item.status_updated_at,
      version: item.status_version,
    });
  };

  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const method = request.method;
    const token = (request.headers.authorization ?? '').replace(/^Bearer /, '');
    const role =
      ['patient', 'doctor', 'admin', 'employee'].find(
        (candidate) => token === `layout-${candidate}`,
      ) ?? 'patient';
    const reply = (status, data) => {
      response.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      });
      response.end(JSON.stringify(data));
    };
    if (method === 'OPTIONS') {
      reply(204, null);
      return;
    }
    let raw = '';
    for await (const chunk of request) raw += chunk;
    let body;
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      reply(400, { message: 'Invalid JSON' });
      return;
    }
    log(method, url.pathname);
    if (method === 'POST' && url.pathname === '/__qa/failures') {
      if (
        !Array.isArray(body.routes) ||
        body.routes.some(
          (route) =>
            !route ||
            !['GET', 'POST', 'PUT', 'DELETE'].includes(route.method) ||
            typeof route.path !== 'string' ||
            !route.path.startsWith('/') ||
            route.path.startsWith('/__qa/') ||
            !Number.isInteger(route.status) ||
            route.status < 400 ||
            route.status > 599 ||
            typeof route.message !== 'string',
        )
      ) {
        reply(400, {
          message:
            'Configura routes con metodo, ruta, estado de error y mensaje validos.',
        });
        return;
      }
      failureRoutes = body.routes.map(
        ({ method: targetMethod, path, status, message }) => ({
          method: targetMethod,
          path,
          status,
          message,
        }),
      );
      reply(200, { failureRoutes });
      return;
    }
    const failure =
      !url.pathname.startsWith('/__qa/') &&
      failureRoutes.find(
        (route) => route.method === method && route.path === url.pathname,
      );
    if (failure) {
      reply(failure.status, {
        statusCode: failure.status,
        message: failure.message,
        error: 'Fixture failure',
      });
      return;
    }

    if (method === 'POST' && url.pathname === '/auth/login') {
      const selectedRole = ['patient', 'doctor', 'admin', 'employee'].find(
        (candidate) => body.email === `${candidate}@layout.test`,
      );
      if (!selectedRole) {
        reply(401, { message: 'Usa una cuenta de pruebas layout.test.' });
        return;
      }
      reply(200, {
        token: `layout-${selectedRole}`,
        isDoctor: selectedRole === 'doctor',
        isAdmin: selectedRole === 'admin',
      });
      return;
    }
    if (url.pathname === '/users/profile') {
      if (method === 'PUT') {
        Object.assign(profiles[role], body);
        mutations.push({ method, path: url.pathname, role });
      }
      reply(200, profiles[role]);
      return;
    }
    if (
      url.pathname === '/users/register' ||
      url.pathname === '/users/change-password'
    ) {
      mutations.push({ method, path: url.pathname });
      reply(200, { message: 'Guardado' });
      return;
    }
    if (url.pathname === '/doctors/isUserDoctorAnywhere') {
      reply(200, role === 'doctor');
      return;
    }
    if (url.pathname === '/admin/my-clinics') {
      if (roleFailure) {
        reply(503, {
          message:
            'No se pudieron verificar las capacidades de la cuenta de pruebas.',
        });
        return;
      }
      reply(
        200,
        clinics
          .filter((clinic) => ownedClinics[role].has(clinic.clinic_id))
          .map((clinic) => ({
            clinic_id: clinic.clinic_id,
            clinic_name: clinic.clinic_name,
            role_within_clinic: clinic.clinic_id === 2 ? 'Admin' : 'Owner',
            role_description: clinic.clinic_id === 2 ? 'Administrador de pruebas' : 'Propietario de pruebas',
          })),
      );
      return;
    }
    if (url.pathname === '/location/getCountries') {
      reply(200, countries);
      return;
    }
    if (url.pathname === '/location/getStates') {
      reply(
        200,
        Array.from({ length: 30 }, (_, index) => ({
          state_id: index + 1,
          country_id: Number(url.searchParams.get('country_id')),
          state_name:
            index === 0
              ? 'Caldas'
              : index === 29
                ? 'Departamento final 30'
                : `Departamento ${pad(index + 1)}`,
        })),
      );
      return;
    }
    if (url.pathname === '/location/getCities') {
      reply(
        200,
        Array.from({ length: 30 }, (_, index) => ({
          city_id: index + 1,
          state_id: Number(url.searchParams.get('state_id')),
          city_name:
            index === 0
              ? 'Manizales'
              : index === 29
                ? 'Ciudad final 30'
                : `Ciudad ${pad(index + 1)}`,
        })),
      );
      return;
    }
    if (url.pathname === '/clinics/getAllSpecialties') {
      reply(200, specialties);
      return;
    }
    if (url.pathname.startsWith('/clinics/getAllClinics')) {
      if (searchMode === 'error') {
        reply(503, {
          message: 'Error de busqueda de prueba. Intenta nuevamente.',
        });
        return;
      }
      reply(200, searchMode === 'empty' ? [] : clinics);
      return;
    }
    if (url.pathname === '/clinics/getClinicDetails') {
      const clinic = clinics.find(
        (item) => item.clinic_id === Number(url.searchParams.get('clinic_id')),
      );
      reply(clinic ? 200 : 404, clinic ?? { message: 'Clinica no encontrada' });
      return;
    }
    if (url.pathname === '/clinics/getClinicDoctors') {
      reply(200, doctors);
      return;
    }
    if (url.pathname === '/clinics/getClinicScheduleRules') {
      reply(200, {
        clinic_opening_time: '08:00',
        clinic_close_time: '18:00',
        clinic_average_appointment_time: '30',
        clinic_break_time: '12:00',
        clinic_break_duration: '60',
      });
      return;
    }
    if (url.pathname === '/clinics/getClinicDoctorAppointmentsForDay') {
      reply(
        200,
        appointments.filter(
          (item) =>
            item.clinic_id === Number(url.searchParams.get('clinic_id')) &&
            item.doctor_id === Number(url.searchParams.get('doctor_id')) &&
            !['cancelled', 'no_show'].includes(item.appointment_status) &&
            new Date(Date.parse(item.start_date_time) - 5 * HOUR)
              .toISOString()
              .slice(0, 10) === url.searchParams.get('appointment_date'),
        ),
      );
      return;
    }
    if (url.pathname === '/clinics/my-clinics') {
      reply(
        200,
        role === 'doctor'
          ? clinics.slice(0, 3)
          : clinics.filter((clinic) =>
              ownedClinics[role].has(clinic.clinic_id),
            ),
      );
      return;
    }
    if (method === 'POST' && url.pathname === '/clinics/createClinic') {
      const clinic = {
        ...body,
        clinic_id: nextClinicId++,
        city_id: body.clinic_city_id,
        is_open: true,
      };
      clinics.push(clinic);
      ownedClinics[role].add(clinic.clinic_id);
      mutations.push({
        method,
        path: url.pathname,
        role,
        id: clinic.clinic_id,
      });
      reply(201, { clinic_id: clinic.clinic_id });
      return;
    }
    const clinicMatch = url.pathname.match(/^\/clinics\/(\d+)$/);
    if (method === 'DELETE' && clinicMatch) {
      const id = Number(clinicMatch[1]);
      clinics = clinics.filter((clinic) => clinic.clinic_id !== id);
      Object.values(ownedClinics).forEach((ids) => ids.delete(id));
      mutations.push({ method, path: url.pathname, role });
      reply(200, { message: 'Eliminada' });
      return;
    }
    if (url.pathname === '/appointments/patient') {
      reply(
        200,
        appointments
          .filter((item) => item.patient_id === profiles[role].user_id)
          .map((item) => appointmentView(item, 'patient')),
      );
      return;
    }
    if (url.pathname === '/appointments/dispatch-clinics') {
      reply(
        200,
        clinics
          .filter((clinic) => canDispatchClinic(role, clinic.clinic_id))
          .map((clinic) => ({
            clinic_id: clinic.clinic_id,
            clinic_name: clinic.clinic_name,
            role_within_clinic: role === 'admin' ? (clinic.clinic_id === 2 ? 'Admin' : 'Owner') : 'Employee',
          })),
      );
      return;
    }
    if (
      method === 'POST' &&
      url.pathname === '/appointments/scheduleAppointment'
    ) {
      const item = {
        ...appointments[0],
        ...body,
        appointment_id: nextAppointmentId++,
        patient_id: profiles[role].user_id,
        appointment_status: 'scheduled',
        status_version: 0,
        status_updated_at: new Date(now()).toISOString(),
      };
      appointments.push(item);
      mutations.push({ method, path: url.pathname, id: item.appointment_id });
      reply(201, { appointment_id: item.appointment_id });
      return;
    }
    const clinicAgendaMatch = url.pathname.match(
      /^\/appointments\/clinic\/(\d+)$/,
    );
    if (method === 'GET' && clinicAgendaMatch) {
      const clinicId = Number(clinicAgendaMatch[1]);
      if (!canDispatchClinic(role, clinicId)) {
        reply(404, {
          message: 'No puedes consultar la agenda de esta clinica.',
        });
        return;
      }
      const date = url.searchParams.get('date');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) {
        reply(400, {
          message: 'Indica una fecha valida para consultar la agenda.',
        });
        return;
      }
      reply(
        200,
        appointments
          .filter(
            (item) =>
              item.clinic_id === clinicId && appointmentDay(item) === date,
          )
          .sort(
            (a, b) =>
              Date.parse(a.start_date_time) - Date.parse(b.start_date_time),
          )
          .map((item) => appointmentView(item, role)),
      );
      return;
    }
    const actionMatch = url.pathname.match(/^\/appointments\/(\d+)\/actions$/);
    if (method === 'POST' && actionMatch) {
      const item = appointments.find(
        (appointment) => appointment.appointment_id === Number(actionMatch[1]),
      );
      if (!item || !canViewAppointment(item, role)) {
        reply(404, { message: 'Cita no encontrada.' });
        return;
      }
      if (
        !Number.isSafeInteger(body.expected_version) ||
        !Object.hasOwn(statusTargets, body.action)
      ) {
        reply(400, {
          message: 'La accion y la version de la cita son obligatorias.',
        });
        return;
      }
      if (body.expected_version !== item.status_version) {
        reply(409, {
          message: 'La cita cambio. Actualiza la agenda e intenta otra vez.',
        });
        return;
      }
      if (
        !appointmentCapabilities(item, role).allowed_actions.includes(
          body.action,
        )
      ) {
        reply(400, {
          message:
            'Esta accion no esta disponible para el estado actual de la cita.',
        });
        return;
      }
      if (
        body.action === 'start' &&
        appointments.some(
          (other) =>
            other !== item &&
            other.doctor_id === item.doctor_id &&
            other.appointment_status === 'in_progress',
        )
      ) {
        reply(409, {
          message:
            'El medico ya tiene una consulta en curso. Finalizala antes de atender otra.',
        });
        return;
      }
      changeStatus(item, role, body.action);
      mutations.push({
        method,
        path: url.pathname,
        id: item.appointment_id,
        action: body.action,
        role,
      });
      reply(200, statusSnapshot(item, role));
      return;
    }
    const appointmentMatch = url.pathname.match(/^\/appointments\/(\d+)$/);
    if (appointmentMatch) {
      const id = Number(appointmentMatch[1]);
      const item = appointments.find(
        (appointment) => appointment.appointment_id === id,
      );
      if (!item || !canViewAppointment(item, role)) {
        reply(404, { message: 'Appointment not found.' });
        return;
      }
      if (method === 'GET') {
        reply(200, appointmentView(item, role));
        return;
      }
      if (method === 'PUT') {
        if (role !== 'patient' || item.patient_id !== profiles[role].user_id) {
          reply(404, { message: 'Cita no encontrada.' });
          return;
        }
        if (
          body.expected_version !== undefined &&
          body.expected_version !== item.status_version
        ) {
          reply(409, {
            message: 'La cita cambio. Actualiza antes de guardar.',
          });
          return;
        }
        if (!appointmentCapabilities(item, role).can_reschedule) {
          reply(400, { message: 'Esta cita ya no se puede modificar.' });
          return;
        }
        if (
          body.start_date_time !== undefined ||
          body.end_date_time !== undefined
        ) {
          if (
            !Number.isFinite(Date.parse(body.start_date_time)) ||
            !Number.isFinite(Date.parse(body.end_date_time)) ||
            Date.parse(body.start_date_time) <= now() ||
            Date.parse(body.end_date_time) -
              Date.parse(body.start_date_time) !==
              30 * 60_000
          ) {
            reply(400, { message: 'El nuevo horario no es valido.' });
            return;
          }
          item.start_date_time = body.start_date_time;
          item.end_date_time = body.end_date_time;
          const from_status = item.appointment_status;
          item.appointment_status = 'scheduled';
          item.status_version += 1;
          item.status_updated_at = new Date(now()).toISOString();
          appointmentEvents.push({
            appointment_id: item.appointment_id,
            from_status,
            to_status: 'scheduled',
            action: 'reschedule',
            actor_user_id: profiles[role].user_id,
            occurred_at: item.status_updated_at,
            version: item.status_version,
          });
        }
        if (body.appointment_description !== undefined) {
          item.appointment_description = body.appointment_description;
          if (body.start_date_time === undefined) {
            item.status_version += 1;
            item.status_updated_at = new Date(now()).toISOString();
            appointmentEvents.push({
              appointment_id: item.appointment_id,
              from_status: item.appointment_status,
              to_status: item.appointment_status,
              action: 'update_notes',
              actor_user_id: profiles[role].user_id,
              occurred_at: item.status_updated_at,
              version: item.status_version,
            });
          }
        }
      } else if (method === 'DELETE') {
        if (role !== 'patient' || item.patient_id !== profiles[role].user_id) {
          reply(404, { message: 'Cita no encontrada.' });
          return;
        }
        if (item.appointment_status === 'cancelled') {
          reply(200, { message: 'Guardado' });
          return;
        }
        if (
          !appointmentCapabilities(item, role).allowed_actions.includes(
            'cancel',
          )
        ) {
          reply(400, { message: 'Esta cita no se puede cancelar.' });
          return;
        }
        changeStatus(item, role, 'cancel');
      } else {
        reply(405, { message: 'Metodo no permitido.' });
        return;
      }
      mutations.push({ method, path: url.pathname, id });
      reply(200, { message: 'Guardado' });
      return;
    }
    if (url.pathname === '/doctors/getDoctorAppointments') {
      reply(
        200,
        appointments
          .filter((item) => item.doctor_id === profiles[role].user_id)
          .map((item) => appointmentView(item, role)),
      );
      return;
    }
    if (url.pathname === '/doctors/getDoctorPatientHistories') {
      reply(200, history);
      return;
    }
    if (url.pathname === '/prescriptions/getPrescriptionsAssignedByDoctor') {
      const clinicId = Number(url.searchParams.get('clinic_id'));
      reply(
        200,
        clinicId
          ? prescriptions.filter(
              (prescription) => prescription.clinic_id === clinicId,
            )
          : prescriptions,
      );
      return;
    }
    if (url.pathname === '/prescriptions/getUserPrescriptions') {
      reply(
        200,
        prescriptions
          .filter((prescription) => prescription.patient_id === 42)
          .map((prescription) => ({
            ...prescription,
            clinic_name:
              clinics.find(
                (clinic) => clinic.clinic_id === prescription.clinic_id,
              )?.clinic_name ?? 'Clinica de pruebas',
            doctor_first_name: 'Ana',
            doctor_last_name: 'Ruiz',
          })),
      );
      return;
    }
    if (
      method === 'POST' &&
      url.pathname === '/prescriptions/assignPrescription'
    ) {
      const prescription = {
        ...body,
        prescription_id: nextPrescriptionId++,
        date_emitted: new Date(now()).toISOString(),
      };
      prescriptions.push(prescription);
      mutations.push({
        method,
        path: url.pathname,
        id: prescription.prescription_id,
      });
      reply(201, { prescription_id: prescription.prescription_id });
      return;
    }
    const prescriptionMatch = url.pathname.match(/^\/prescriptions\/(\d+)$/);
    if (prescriptionMatch) {
      const id = Number(prescriptionMatch[1]);
      const item = prescriptions.find(
        (prescription) => prescription.prescription_id === id,
      );
      if (!item) {
        reply(404, { message: 'Receta no encontrada' });
        return;
      }
      if (method === 'PUT') Object.assign(item, body);
      else if (method === 'DELETE')
        prescriptions = prescriptions.filter(
          (prescription) => prescription !== item,
        );
      mutations.push({ method, path: url.pathname, id });
      reply(200, { message: 'Guardado' });
      return;
    }
    if (url.pathname === '/__qa/state') {
      reply(200, {
        mutations,
        appointments,
        appointmentEvents,
        prescriptions,
        clinics,
        roleFailure,
        searchMode,
        failureRoutes,
        accounts: [
          'patient@layout.test',
          'doctor@layout.test',
          'admin@layout.test',
          'employee@layout.test',
        ],
      });
      return;
    }
    if (method === 'POST' && url.pathname === '/__qa/appointment') {
      const item = appointments.find(
        (appointment) =>
          appointment.appointment_id === Number(body.appointment_id),
      );
      if (
        !item ||
        (body.appointment_status && !statuses.includes(body.appointment_status))
      ) {
        reply(400, { message: 'Cita o estado de prueba invalido.' });
        return;
      }
      for (const key of [
        'appointment_status',
        'start_date_time',
        'end_date_time',
        'appointment_description',
      ]) {
        if (body[key] !== undefined) item[key] = body[key];
      }
      item.status_version += 1;
      item.status_updated_at = new Date(now()).toISOString();
      reply(200, item);
      return;
    }
    if (method === 'POST' && url.pathname === '/__qa/role-error') {
      roleFailure = !!body.enabled;
      reply(200, { roleFailure });
      return;
    }
    if (method === 'POST' && url.pathname === '/__qa/search-state') {
      searchMode = ['normal', 'empty', 'error'].includes(body.mode)
        ? body.mode
        : 'normal';
      reply(200, { searchMode });
      return;
    }
    if (method === 'POST' && url.pathname === '/__qa/shutdown') {
      reply(200, { stopped: true });
      server.close();
      return;
    }
    reply(404, {
      message: `Endpoint de prueba no definido: ${method} ${url.pathname}`,
    });
  });
  return server;
}

module.exports = { createLayoutServer };

if (require.main === module) {
  const server = createLayoutServer();
  const port = Number(process.env.LAYOUT_TEST_PORT ?? 3003);
  server.listen(port, '127.0.0.1', () =>
    console.log(
      `Layout fixture listening on 127.0.0.1:${server.address().port}`,
    ),
  );
}
