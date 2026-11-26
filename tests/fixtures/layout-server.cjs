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
    clinic_opening_time: '08:00',
    clinic_close_time: '18:00',
    clinic_average_appointment_time: '30',
    clinic_break_time: '12:00',
    clinic_break_duration: '60',
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
  const administrationUsers = new Map(
    Object.values(profiles).map((profile) => [profile.user_id, profile]),
  );
  for (const doctor of doctors)
    administrationUsers.set(doctor.doctor_id, {
      user_id: doctor.doctor_id,
      ...doctor,
      user_email_address: `doctor${doctor.doctor_id}@layout.test`,
      user_phone_number: '3105550042',
    });
  administrationUsers.set(84, {
    ...administrationUsers.get(84),
    user_email_address: profiles.doctor.user_email_address,
    user_phone_number: profiles.doctor.user_phone_number,
  });
  administrationUsers.set(9000, {
    user_id: 9000,
    first_name: 'Propietario',
    first_last_name: 'Segunda',
    second_last_name: 'Clinica',
    user_email_address: 'owner2@layout.test',
    user_phone_number: '3105550042',
  });
  const clinicMembers = new Map(
    clinics.map((clinic) => [
      clinic.clinic_id,
      new Map([
        ...doctors.map((doctor) => [
          doctor.doctor_id,
          {
            role: 'Doctor',
            specialtyIds: doctor.specialties.map((item) => item.specialty_id),
          },
        ]),
        ...(clinic.clinic_id === 2
          ? [[126, { role: 'Admin', specialtyIds: [] }]]
          : []),
        ...(clinic.clinic_id === 1
          ? [[168, { role: 'Employee', specialtyIds: [] }]]
          : []),
      ]),
    ]),
  );
  const ownerProviderSpecialties = new Map();
  for (const clinic of clinics) {
    clinic.clinic_owner = clinic.clinic_id === 2 ? 9000 : 126;
    clinic.clinic_city_id = clinic.city_id;
    clinic.specialty_ids = specialties.map((item) => item.specialty_id);
  }
  const managementRole = (role, clinic) => {
    const actor = profiles[role].user_id;
    return clinic.clinic_owner === actor
      ? 'Owner'
      : clinicMembers.get(clinic.clinic_id)?.get(actor)?.role;
  };
  const manageable = (role, clinic) =>
    ['Owner', 'Admin'].includes(managementRole(role, clinic));
  const clinicUserView = (clinic, user) => {
    const membership = clinicMembers.get(clinic.clinic_id)?.get(user.user_id);
    const owner = clinic.clinic_owner === user.user_id;
    const assigned = (
      owner
        ? (ownerProviderSpecialties.get(clinic.clinic_id) ?? [])
        : (membership?.specialtyIds ?? [])
    )
      .map((id) => specialties.find((item) => item.specialty_id === id))
      .filter(Boolean);
    return {
      user_id: user.user_id,
      clinic_id: clinic.clinic_id,
      email: user.user_email_address,
      user_email_address: user.user_email_address,
      first_name: user.first_name,
      second_name: user.second_name ?? null,
      first_last_name: user.first_last_name,
      second_last_name: user.second_last_name,
      phone_number: user.user_phone_number,
      role_within_clinic: owner ? 'Owner' : (membership?.role ?? null),
      is_member: owner || !!membership,
      isAdmin: owner || membership?.role === 'Admin',
      isDoctor: membership?.role === 'Doctor' || assigned.length > 0,
      specialty_id: assigned[0]?.specialty_id ?? null,
      specialty_name: assigned[0]?.specialty_name ?? null,
      specialties: assigned,
    };
  };
  const managedClinicView = (role, clinic) => ({
    ...clinic,
    clinic_average_appointment_time:
      clinic.clinic_average_appointment_time == null
        ? null
        : Number(clinic.clinic_average_appointment_time),
    clinic_break_duration:
      clinic.clinic_break_duration == null
        ? null
        : Number(clinic.clinic_break_duration),
    role_within_clinic: managementRole(role, clinic),
    country_id: 1,
    state_id: 1,
    city_id: clinic.clinic_city_id,
    country_name: 'Colombia',
    state_name: 'Caldas',
    city_name: 'Manizales',
  });
  const doctorHasPending = (clinicId, userId) =>
    appointments.some(
      (item) =>
        item.clinic_id === clinicId &&
        item.doctor_id === userId &&
        ['scheduled', 'confirmed', 'waiting', 'called', 'in_progress'].includes(
          item.appointment_status,
        ) &&
        (Date.parse(item.start_date_time) >= now() ||
          item.appointment_status === 'in_progress'),
    );
  const isProvider = (clinicId, userId) =>
    (clinics.find((clinic) => clinic.clinic_id === clinicId)?.clinic_owner ===
      userId &&
      ownerProviderSpecialties.get(clinicId)?.length > 0) ||
    clinicMembers.get(clinicId)?.get(userId)?.role === 'Doctor' ||
    clinicMembers.get(clinicId)?.get(userId)?.specialtyIds.length > 0;
  const canDispatchClinic = (role, clinicId) =>
    clinics.some(
      (clinic) =>
        clinic.clinic_id === clinicId &&
        (clinic.clinic_owner === profiles[role].user_id ||
          ['Admin', 'Employee'].includes(
            clinicMembers.get(clinicId)?.get(profiles[role].user_id)?.role,
          )),
    );
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
  const absences = [];
  const minimumAdvanceMinutes = 60;
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
    const advance =
      Date.parse(item.start_date_time) - now() >=
      minimumAdvanceMinutes * 60_000;
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
    if (preconsult && (patient || staff) && advance)
      allowed_actions.push('cancel');
    return {
      allowed_actions,
      can_reschedule:
        patient && ['scheduled', 'confirmed'].includes(status) && advance,
      can_edit_notes:
        patient && ['scheduled', 'confirmed'].includes(status) && future,
    };
  };
  const statusSnapshot = (item, role) => ({
    appointment_id: item.appointment_id,
    appointment_status: item.appointment_status,
    status_version: item.status_version,
    status_updated_at: item.status_updated_at,
    minimum_advance_minutes: minimumAdvanceMinutes,
    server_now: new Date(now()).toISOString(),
    change_deadline: new Date(
      Date.parse(item.start_date_time) - minimumAdvanceMinutes * 60_000,
    ).toISOString(),
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

  const validDay = (value) =>
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
  const strictInstant = (value) => {
    if (
      typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
        value,
      ) ||
      !validDay(value.slice(0, 10))
    )
      return null;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const minuteOf = (value) => {
    if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return null;
    const [hours, minutes] = value.split(':').map(Number);
    return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
  };
  const scheduleFor = (clinic) => {
    const opening = minuteOf(clinic.clinic_opening_time);
    const closing = minuteOf(clinic.clinic_close_time);
    const breakStart = minuteOf(clinic.clinic_break_time);
    const duration = /^\d+$/.test(clinic.clinic_average_appointment_time)
      ? Number(clinic.clinic_average_appointment_time)
      : NaN;
    const breakDuration = /^\d+$/.test(clinic.clinic_break_duration)
      ? Number(clinic.clinic_break_duration)
      : NaN;
    if (
      opening === null ||
      closing === null ||
      opening >= closing ||
      !Number.isInteger(duration) ||
      duration <= 0 ||
      !Number.isInteger(breakDuration) ||
      breakDuration < 0 ||
      (breakDuration > 0 &&
        (breakStart === null ||
          breakStart < opening ||
          breakStart + breakDuration > closing))
    )
      return null;
    return { opening, closing, breakStart, duration, breakDuration };
  };
  const availability = (clinicId, doctorId, date, exclude) => {
    const clinic = clinics.find((item) => item.clinic_id === clinicId);
    const rules = clinic && scheduleFor(clinic);
    if (!clinic || !isProvider(clinicId, doctorId) || !validDay(date) || !rules)
      return {
        status: 400,
        body: { message: 'La configuracion del horario no es valida.' },
      };
    const unavailable_reason = !clinic.is_open
      ? 'closed'
      : [0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay())
        ? 'weekend'
        : null;
    const snapshot = now();
    const slots = [];
    if (!unavailable_reason) {
      const midnight = Date.parse(`${date}T00:00:00-05:00`);
      for (
        let minute = rules.opening;
        minute + rules.duration <= rules.closing;
        minute += rules.duration
      ) {
        const start = midnight + minute * 60_000;
        const end = start + rules.duration * 60_000;
        const current =
          exclude && Date.parse(exclude.start_date_time) === start;
        const duringBreak =
          rules.breakDuration > 0 &&
          minute < rules.breakStart + rules.breakDuration &&
          minute + rules.duration > rules.breakStart;
        const occupied =
          appointments.some(
            (item) =>
              item !== exclude &&
              item.doctor_id === doctorId &&
              !['cancelled', 'no_show'].includes(item.appointment_status) &&
              start < Date.parse(item.end_date_time) &&
              end > Date.parse(item.start_date_time),
          ) ||
          absences.some(
            (item) =>
              item.clinic_id === clinicId &&
              item.doctor_id === doctorId &&
              start < Date.parse(item.end_date_time) &&
              end > Date.parse(item.start_date_time),
          );
        const status = current
          ? 'current'
          : duringBreak
            ? 'break'
            : occupied
              ? 'booked'
              : start <= snapshot
                ? 'past'
                : start - snapshot < minimumAdvanceMinutes * 60_000
                  ? 'too_soon'
                  : 'available';
        slots.push({
          start_date_time: new Date(start).toISOString(),
          end_date_time: new Date(end).toISOString(),
          status,
        });
      }
    }
    return {
      status: 200,
      body: {
        clinic_id: clinicId,
        doctor_id: doctorId,
        date,
        time_zone: 'America/Bogota',
        server_now: new Date(snapshot).toISOString(),
        minimum_advance_minutes: minimumAdvanceMinutes,
        duration_minutes: rules.duration,
        unavailable_reason,
        slots,
      },
    };
  };
  const validateSchedule = (body, exclude) => {
    const start = strictInstant(body.start_date_time);
    const end = strictInstant(body.end_date_time);
    if (start === null || end === null || end <= start)
      return { status: 400, message: 'El horario no es valido.' };
    const result = availability(
      Number(body.clinic_id),
      Number(body.doctor_id),
      new Date(start - 5 * HOUR).toISOString().slice(0, 10),
      exclude,
    );
    if (result.status !== 200)
      return { status: result.status, message: result.body.message };
    const slot = result.body.slots.find(
      (item) =>
        Date.parse(item.start_date_time) === start &&
        Date.parse(item.end_date_time) === end,
    );
    if (slot?.status === 'available' || slot?.status === 'current') return null;
    return {
      status: slot?.status === 'booked' ? 409 : 400,
      message:
        slot?.status === 'booked'
          ? 'El medico no esta disponible.'
          : 'El horario debe respetar las reglas de la clinica y al menos una hora de anticipacion.',
    };
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
        isDoctor: clinics.some((clinic) =>
          isProvider(clinic.clinic_id, profiles[selectedRole].user_id),
        ),
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
      reply(
        200,
        clinics.some((clinic) =>
          isProvider(clinic.clinic_id, profiles[role].user_id),
        ),
      );
      return;
    }
    if (url.pathname.startsWith('/admin/') && !token) {
      reply(401, { message: 'Inicia sesion.' });
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
            role_within_clinic: managementRole(role, clinic),
            role_description:
              clinic.clinic_id === 2
                ? 'Administrador de pruebas'
                : 'Propietario de pruebas',
          })),
      );
      return;
    }
    if (url.pathname === '/admin/specialties') {
      reply(200, specialties);
      return;
    }
    const ownerProviderMatch = url.pathname.match(
      /^\/clinics\/(\d+)\/owner-provider$/,
    );
    if (ownerProviderMatch && method === 'PUT') {
      if (!token) {
        reply(401, { message: 'Inicia sesion.' });
        return;
      }
      const clinic = clinics.find(
        (item) => item.clinic_id === Number(ownerProviderMatch[1]),
      );
      if (!clinic || clinic.clinic_owner !== profiles[role].user_id) {
        reply(403, {
          message: 'Solo el propietario puede cambiar su perfil medico.',
        });
        return;
      }
      if (
        typeof body.isDoctor !== 'boolean' ||
        Object.keys(body).some(
          (key) => !['isDoctor', 'specialty_id'].includes(key),
        ) ||
        (body.isDoctor && !clinic.specialty_ids.includes(body.specialty_id))
      ) {
        reply(400, {
          message: 'Selecciona una especialidad ofrecida por esta clinica.',
        });
        return;
      }
      if (
        !body.isDoctor &&
        doctorHasPending(clinic.clinic_id, clinic.clinic_owner)
      ) {
        reply(409, { message: 'Tienes citas pendientes en esta clinica.' });
        return;
      }
      ownerProviderSpecialties.set(
        clinic.clinic_id,
        body.isDoctor ? [body.specialty_id] : [],
      );
      mutations.push({
        method,
        path: url.pathname,
        role,
        clinic_id: clinic.clinic_id,
      });
      reply(200, { message: 'Perfil medico actualizado.' });
      return;
    }
    const managementMatch = url.pathname.match(
      /^\/clinics\/(\d+)\/management$/,
    );
    if (managementMatch && ['GET', 'PUT'].includes(method)) {
      if (!token) {
        reply(401, { message: 'Inicia sesion.' });
        return;
      }
      const clinic = clinics.find(
        (item) => item.clinic_id === Number(managementMatch[1]),
      );
      if (!clinic) {
        reply(404, { message: 'Clinica no encontrada.' });
        return;
      }
      if (!manageable(role, clinic)) {
        reply(403, { message: 'No puedes administrar esta clinica.' });
        return;
      }
      if (method === 'PUT') {
        if (!Object.keys(body).length) {
          reply(400, { message: 'No hay cambios para guardar.' });
          return;
        }
        const candidate = { ...clinic, ...body };
        const rulesTouched =
          body.is_open === true ||
          [
            'clinic_opening_time',
            'clinic_close_time',
            'clinic_average_appointment_time',
            'clinic_break_time',
            'clinic_break_duration',
          ].some((key) => body[key] !== undefined);
        if (
          !Number.isInteger(candidate.clinic_city_id) ||
          candidate.clinic_city_id < 1 ||
          candidate.clinic_city_id > 30 ||
          !candidate.clinic_name?.trim() ||
          candidate.clinic_name.length > 25 ||
          !candidate.clinic_address?.trim() ||
          candidate.clinic_address.length > 30 ||
          typeof candidate.is_open !== 'boolean' ||
          (rulesTouched && !scheduleFor(candidate)) ||
          !Array.isArray(candidate.specialty_ids) ||
          candidate.specialty_ids.some(
            (id) => !specialties.some((item) => item.specialty_id === id),
          )
        ) {
          reply(400, {
            message: 'Los datos y horarios de la clinica no son validos.',
          });
          return;
        }
        if (
          [...clinicMembers.get(clinic.clinic_id).values()].some((member) =>
            member.specialtyIds.some(
              (id) => !candidate.specialty_ids.includes(id),
            ),
          ) ||
          (ownerProviderSpecialties.get(clinic.clinic_id) ?? []).some(
            (id) => !candidate.specialty_ids.includes(id),
          )
        ) {
          reply(409, {
            message:
              'Hay medicos asignados a una especialidad que deseas retirar.',
          });
          return;
        }
        Object.assign(clinic, candidate, { city_id: candidate.clinic_city_id });
        mutations.push({
          method,
          path: url.pathname,
          role,
          id: clinic.clinic_id,
        });
      }
      reply(200, managedClinicView(role, clinic));
      return;
    }
    const removeMemberMatch = url.pathname.match(
      /^\/admin\/clinics\/(\d+)\/members\/(\d+)$/,
    );
    if (
      [
        '/admin/clinic-users',
        '/admin/search-user',
        '/admin/update-user-role',
      ].includes(url.pathname) ||
      removeMemberMatch
    ) {
      const clinicId = Number(
        removeMemberMatch?.[1] ??
          (method === 'PUT'
            ? body.clinic_id
            : url.searchParams.get('clinic_id')),
      );
      if (!Number.isInteger(clinicId) || clinicId < 1) {
        reply(400, { message: 'Selecciona una clinica.' });
        return;
      }
      const clinic = clinics.find((item) => item.clinic_id === clinicId);
      if (!clinic || !manageable(role, clinic)) {
        reply(403, { message: 'No puedes administrar esta clinica.' });
        return;
      }
      const roster = clinicMembers.get(clinicId);
      if (url.pathname === '/admin/clinic-users') {
        const ids = new Set([clinic.clinic_owner, ...roster.keys()]);
        reply(
          200,
          [...ids].map((id) =>
            clinicUserView(clinic, administrationUsers.get(id)),
          ),
        );
        return;
      }
      if (url.pathname === '/admin/search-user') {
        const email = url.searchParams.get('email');
        if (!email || !email.includes('@')) {
          reply(400, { message: 'Indica un correo valido.' });
          return;
        }
        const found = [...administrationUsers.values()].find(
          (user) =>
            user.user_email_address.toLowerCase() ===
            email.trim().toLowerCase(),
        );
        reply(
          found ? 200 : 404,
          found
            ? clinicUserView(clinic, found)
            : { message: 'Usuario no encontrado.' },
        );
        return;
      }
      const target = removeMemberMatch
        ? administrationUsers.get(Number(removeMemberMatch[2]))
        : [...administrationUsers.values()].find(
            (user) => user.user_email_address === body.email,
          );
      if (!target) {
        reply(404, { message: 'Usuario no encontrado.' });
        return;
      }
      const previous = clinicUserView(clinic, target);
      const actorRole = managementRole(role, clinic);
      if (
        target.user_id === profiles[role].user_id ||
        previous.role_within_clinic === 'Owner' ||
        (actorRole === 'Admin' &&
          (previous.role_within_clinic === 'Admin' || body.isAdmin === true))
      ) {
        reply(403, {
          message: 'No puedes modificar este miembro ni asignar ese rol.',
        });
        return;
      }
      if (removeMemberMatch) {
        if (!previous.is_member) {
          reply(404, { message: 'Miembro no encontrado.' });
          return;
        }
        if (doctorHasPending(clinicId, target.user_id)) {
          reply(409, {
            message: 'El medico tiene citas pendientes en esta clinica.',
          });
          return;
        }
        roster.delete(target.user_id);
        if (target.user_id === profiles.employee.user_id)
          receptionClinics.delete(clinicId);
      } else {
        if (
          typeof body.isDoctor !== 'boolean' ||
          typeof body.isAdmin !== 'boolean' ||
          (body.isDoctor &&
            (!Number.isInteger(body.specialty_id) ||
              !clinic.specialty_ids.includes(body.specialty_id)))
        ) {
          reply(400, {
            message:
              'Indica un rol y una especialidad ofrecida por la clinica.',
          });
          return;
        }
        if (
          previous.isDoctor &&
          !body.isDoctor &&
          doctorHasPending(clinicId, target.user_id)
        ) {
          reply(409, {
            message: 'El medico tiene citas pendientes en esta clinica.',
          });
          return;
        }
        roster.set(target.user_id, {
          role: body.isAdmin ? 'Admin' : body.isDoctor ? 'Doctor' : 'Employee',
          specialtyIds: body.isDoctor ? [body.specialty_id] : [],
        });
        if (target.user_id === profiles.employee.user_id && !body.isDoctor)
          receptionClinics.add(clinicId);
      }
      mutations.push({
        method,
        path: url.pathname,
        role,
        clinic_id: clinicId,
        user_id: target.user_id,
      });
      reply(200, {
        message: removeMemberMatch
          ? 'Miembro retirado.'
          : 'Miembro actualizado.',
      });
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
      const clinicId = Number(url.searchParams.get('clinic_id'));
      const roster = clinicMembers.get(clinicId);
      const clinic = clinics.find((item) => item.clinic_id === clinicId);
      const providers = [...(roster ?? [])];
      if (ownerProviderSpecialties.get(clinicId)?.length)
        providers.push([
          clinic.clinic_owner,
          {
            specialtyIds: ownerProviderSpecialties.get(clinicId),
            role: 'Owner',
          },
        ]);
      reply(
        200,
        providers
          .filter(
            ([, member]) =>
              member.role === 'Doctor' || member.specialtyIds.length,
          )
          .map(([id, member]) => ({
            doctor_id: id,
            first_name: administrationUsers.get(id).first_name,
            second_name: administrationUsers.get(id).second_name ?? null,
            first_last_name: administrationUsers.get(id).first_last_name,
            second_last_name: administrationUsers.get(id).second_last_name,
            specialties: member.specialtyIds.map((specialtyId) =>
              specialties.find((item) => item.specialty_id === specialtyId),
            ),
          })),
      );
      return;
    }
    if (url.pathname === '/clinics/getClinicScheduleRules') {
      const clinic = clinics.find(
        (item) => item.clinic_id === Number(url.searchParams.get('clinic_id')),
      );
      reply(
        clinic ? 200 : 404,
        clinic
          ? {
              clinic_opening_time: clinic.clinic_opening_time,
              clinic_close_time: clinic.clinic_close_time,
              clinic_average_appointment_time:
                clinic.clinic_average_appointment_time,
              clinic_break_time: clinic.clinic_break_time,
              clinic_break_duration: clinic.clinic_break_duration,
              is_open: clinic.is_open,
              minimum_advance_minutes: minimumAdvanceMinutes,
              time_zone: 'America/Bogota',
            }
          : { message: 'Clinica no encontrada.' },
      );
      return;
    }
    if (url.pathname === '/clinics/getClinicDoctorAppointmentsForDay') {
      reply(
        200,
        appointments
          .filter(
            (item) =>
              item.clinic_id === Number(url.searchParams.get('clinic_id')) &&
              item.doctor_id === Number(url.searchParams.get('doctor_id')) &&
              !['cancelled', 'no_show'].includes(item.appointment_status) &&
              new Date(Date.parse(item.start_date_time) - 5 * HOUR)
                .toISOString()
                .slice(0, 10) === url.searchParams.get('appointment_date'),
          )
          .map(({ appointment_id, start_date_time, end_date_time }) => ({
            appointment_id,
            start_date_time,
            end_date_time,
          })),
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
        is_open: body.is_open ?? !!body.clinic_opening_time,
        clinic_owner: profiles[role].user_id,
        specialty_ids: body.specialty_ids ?? [],
      };
      clinics.push(clinic);
      ownedClinics[role].add(clinic.clinic_id);
      clinicMembers.set(clinic.clinic_id, new Map());
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
      const clinic = clinics.find((item) => item.clinic_id === id);
      if (!clinic || clinic.clinic_owner !== profiles[role].user_id) {
        reply(403, {
          message: 'Solo el propietario puede eliminar esta clinica.',
        });
        return;
      }
      if (
        appointments.some((item) => item.clinic_id === id) ||
        prescriptions.some((item) => item.clinic_id === id)
      ) {
        reply(409, {
          message:
            'La clinica tiene historial. Puedes cerrarla sin eliminar sus datos.',
        });
        return;
      }
      clinics = clinics.filter((clinic) => clinic.clinic_id !== id);
      clinicMembers.delete(id);
      ownerProviderSpecialties.delete(id);
      Object.values(ownedClinics).forEach((ids) => ids.delete(id));
      mutations.push({ method, path: url.pathname, role });
      reply(200, { message: 'Eliminada' });
      return;
    }
    if (method === 'GET' && url.pathname === '/appointments/availability/day') {
      if (
        [...url.searchParams.keys()].some(
          (key) => !['clinic_id', 'doctor_id', 'date'].includes(key),
        )
      ) {
        reply(400, { message: 'Parametros de disponibilidad invalidos.' });
        return;
      }
      const result = availability(
        Number(url.searchParams.get('clinic_id')),
        Number(url.searchParams.get('doctor_id')),
        url.searchParams.get('date'),
      );
      reply(result.status, result.body);
      return;
    }
    const availabilityMatch = url.pathname.match(
      /^\/appointments\/(\d+)\/availability$/,
    );
    if (method === 'GET' && availabilityMatch) {
      if (!token) {
        reply(401, { message: 'Inicia sesion.' });
        return;
      }
      const item = appointments.find(
        (appointment) =>
          appointment.appointment_id === Number(availabilityMatch[1]),
      );
      if (
        !item ||
        role !== 'patient' ||
        item.patient_id !== profiles.patient.user_id
      ) {
        reply(404, { message: 'Cita no encontrada.' });
        return;
      }
      if (
        !appointmentCapabilities(item, role).can_reschedule ||
        [...url.searchParams.keys()].some((key) => key !== 'date')
      ) {
        reply(400, { message: 'Esta cita ya no se puede reprogramar.' });
        return;
      }
      const result = availability(
        item.clinic_id,
        item.doctor_id,
        url.searchParams.get('date'),
        item,
      );
      reply(result.status, result.body);
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
            role_within_clinic:
              role === 'admin'
                ? clinic.clinic_id === 2
                  ? 'Admin'
                  : 'Owner'
                : 'Employee',
          })),
      );
      return;
    }
    if (
      method === 'POST' &&
      url.pathname === '/appointments/scheduleAppointment'
    ) {
      const invalid = validateSchedule(body);
      if (invalid) {
        reply(invalid.status, { message: invalid.message });
        return;
      }
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
        const changesTime =
          body.start_date_time !== undefined ||
          body.end_date_time !== undefined;
        const capabilities = appointmentCapabilities(item, role);
        if (
          changesTime
            ? !capabilities.can_reschedule
            : !capabilities.can_edit_notes
        ) {
          reply(400, { message: 'Esta cita ya no se puede modificar.' });
          return;
        }
        if (
          body.start_date_time !== undefined ||
          body.end_date_time !== undefined
        ) {
          if (
            Date.parse(body.start_date_time) ===
            Date.parse(item.start_date_time)
          ) {
            reply(400, {
              message: 'Selecciona un horario diferente al actual.',
            });
            return;
          }
          const invalid = validateSchedule(
            { ...body, clinic_id: item.clinic_id, doctor_id: item.doctor_id },
            item,
          );
          if (invalid) {
            reply(invalid.status, { message: invalid.message });
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
        absences,
        prescriptions,
        clinics,
        clinicMembers: [...clinicMembers].map(([clinic_id, members]) => ({
          clinic_id,
          members: [...members].map(([user_id, member]) => ({
            user_id,
            ...member,
          })),
        })),
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
        'clinic_id',
        'doctor_id',
        'patient_id',
      ]) {
        if (body[key] !== undefined) item[key] = body[key];
      }
      item.status_version += 1;
      item.status_updated_at = new Date(now()).toISOString();
      reply(200, item);
      return;
    }
    if (method === 'POST' && url.pathname === '/__qa/clinic') {
      const clinic = clinics.find(
        (item) => item.clinic_id === Number(body.clinic_id),
      );
      if (!clinic) {
        reply(404, { message: 'Clinica de prueba no encontrada.' });
        return;
      }
      for (const key of [
        'is_open',
        'clinic_opening_time',
        'clinic_close_time',
        'clinic_average_appointment_time',
        'clinic_break_time',
        'clinic_break_duration',
      ]) {
        if (body[key] !== undefined) clinic[key] = body[key];
      }
      reply(200, clinic);
      return;
    }
    if (method === 'POST' && url.pathname === '/__qa/absence') {
      if (
        !Number.isInteger(body.doctor_id) ||
        strictInstant(body.start_date_time) === null ||
        strictInstant(body.end_date_time) === null ||
        Date.parse(body.end_date_time) <= Date.parse(body.start_date_time)
      ) {
        reply(400, { message: 'Ausencia de prueba invalida.' });
        return;
      }
      absences.push(body);
      reply(201, body);
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
