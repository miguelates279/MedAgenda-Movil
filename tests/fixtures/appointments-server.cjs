// Isolated native acceptance fixture. Binds only to loopback and never touches a real database.
// The real Nest routes, validation and ownership are covered by Backend-MedAgenda's tests.
const http = require('node:http');
const HOUR = 3_600_000;
let nextId = 9;
let appointments = [7, 8].map((id) => ({
  appointment_id: id,
  clinic_id: 1,
  doctor_id: 2,
  clinic_name: 'Clinica de Prueba',
  first_name: 'Ana',
  first_last_name: 'Ruiz',
  second_last_name: '',
  start_date_time: new Date(Date.now() + (48 + id) * HOUR).toISOString(),
  end_date_time: new Date(
    Date.now() + (48 + id) * HOUR + 1_800_000,
  ).toISOString(),
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
