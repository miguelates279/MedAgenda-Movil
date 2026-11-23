// Isolated native acceptance fixture. Binds only to loopback and never touches a real database.
// The real Nest routes, validation and ownership are covered by Backend-MedAgenda's tests.
const http = require('node:http');
const HOUR = 3_600_000;
let nextId = 9;
const date = new Date(Date.now() - 5 * HOUR);
date.setUTCDate(date.getUTCDate() + 2);
while ([0, 6].includes(date.getUTCDay()))
  date.setUTCDate(date.getUTCDate() + 1);
const fixtureDay = date.toISOString().slice(0, 10);
const startFor = (id) =>
  new Date(`${fixtureDay}T${id === 7 ? '08' : '09'}:00:00-05:00`);
const rules = {
  clinic_opening_time: '08:00',
  clinic_close_time: '12:00',
  clinic_average_appointment_time: '30',
  clinic_break_time: '10:00',
  clinic_break_duration: '30',
};
const clinic = {
  clinic_id: 1,
  clinic_name: 'Clinica de Prueba',
  clinic_address: 'Calle de prueba 42',
};
let conflictNext = false;
let extraBookings = [];
const mutations = [];
let appointments = [7, 8].map((id) => ({
  appointment_id: id,
  clinic_id: 1,
  doctor_id: 2,
  clinic_name: 'Clinica de Prueba',
  first_name: 'Ana',
  first_last_name: 'Ruiz',
  second_last_name: '',
  start_date_time: startFor(id).toISOString(),
  end_date_time: new Date(startFor(id).getTime() + 1_800_000).toISOString(),
  appointment_description: 'Consulta de prueba',
}));
const profile = {
  user_id: 42,
  first_name: 'Paciente',
  first_last_name: 'Prueba',
  second_last_name: '',
  legal_id: 'QA42',
  user_email_address: 'qa@medagenda.test',
  user_phone_number: '3000000000',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:3002');
  let source = '';
  for await (const chunk of req) source += chunk;
  let body;
  try {
    body = source ? JSON.parse(source) : {};
  } catch {
    res.writeHead(400).end();
    return;
  }
  const reply = (status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };
  console.log(req.method, url.pathname);
  if (req.method === 'POST' && url.pathname === '/auth/login') {
    reply(200, {
      token: 'local-native-qa-session',
      isAdmin: false,
      isDoctor: false,
    });
    return;
  }
  if (url.pathname === '/users/profile') {
    reply(200, profile);
    return;
  }
  if (url.pathname === '/doctors/isUserDoctorAnywhere') {
    reply(200, false);
    return;
  }
  if (url.pathname === '/admin/my-clinics') {
    reply(200, []);
    return;
  }
  if (url.pathname === '/appointments/patient') {
    reply(200, appointments);
    return;
  }
  if (
    req.method === 'POST' &&
    url.pathname === '/appointments/scheduleAppointment'
  ) {
    const item = { ...appointments[0], ...body, appointment_id: nextId++ };
    appointments.push(item);
    reply(201, { appointment_id: item.appointment_id });
    return;
  }
  const match = url.pathname.match(/^\/appointments\/(\d+)$/);
  if (match) {
    const item = appointments.find(
      (a) => a.appointment_id === Number(match[1]),
    );
    if (!item) {
      reply(404, { message: 'Appointment not found.' });
      return;
    }
    if (req.method === 'PUT') {
      if (conflictNext) {
        conflictNext = false;
        extraBookings.push({ appointment_id: 99, ...body });
        reply(409, {
          message: 'Doctor or clinic is not available at the specified time.',
        });
        return;
      }
      mutations.push({ method: 'PUT', id: item.appointment_id, body });
      Object.assign(item, body);
      reply(200, { message: 'updated' });
      return;
    }
    if (req.method === 'DELETE') {
      appointments = appointments.filter((a) => a !== item);
      reply(200, { message: 'cancelled' });
      return;
    }
  }
  if (url.pathname === '/clinics/getClinicScheduleRules') {
    reply(200, rules);
    return;
  }
  if (url.pathname === '/clinics/getClinicDoctorAppointmentsForDay') {
    const day = url.searchParams.get('appointment_date');
    reply(
      200,
      [...appointments, ...extraBookings].filter(
        (item) =>
          new Date(Date.parse(item.start_date_time) - 5 * HOUR)
            .toISOString()
            .slice(0, 10) === day,
      ),
    );
    return;
  }
  if (url.pathname === '/clinics/getClinicDetails') {
    reply(200, clinic);
    return;
  }
  if (url.pathname === '/clinics/getClinicDoctors') {
    reply(200, [
      {
        doctor_id: 2,
        first_name: 'Ana',
        first_last_name: 'Ruiz',
        specialties: [],
      },
    ]);
    return;
  }
  if (url.pathname === '/__qa/state') {
    reply(200, { appointments, mutations, fixtureDay });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/__qa/conflict-next') {
    conflictNext = true;
    reply(200, { ready: true });
    return;
  }
  if (url.pathname === '/location/getCountries') {
    reply(200, [{ country_id: 1, country_name: 'Colombia' }]);
    return;
  }
  if (url.pathname === '/location/getStates') {
    reply(200, [{ state_id: 1, state_name: 'Caldas', country_id: 1 }]);
    return;
  }
  if (url.pathname === '/location/getCities') {
    reply(200, [{ city_id: 1, city_name: 'Manizales', state_id: 1 }]);
    return;
  }
  if (
    url.pathname.startsWith('/prescriptions/') ||
    url.pathname.startsWith('/clinics/')
  ) {
    reply(200, []);
    return;
  }
  if (req.method === 'POST' && url.pathname === '/__qa/shutdown') {
    reply(200, { stopped: true });
    server.close();
    return;
  }
  reply(404, { message: 'Fixture endpoint not found.' });
});
server.listen(3002, '127.0.0.1', () =>
  console.log('Native QA fixture listening on 127.0.0.1:3002'),
);
