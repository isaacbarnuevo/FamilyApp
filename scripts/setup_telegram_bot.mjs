// Script para configurar comandos y Webhook en el Bot de Telegram de FamilyApp
const TELEGRAM_BOT_TOKEN = '8563679097:AAFit3k4k38GYIeFCJCAsdT9vVz2ylToi6E';

const COMANDOS_BOT = [
  { command: 'hoy', description: '☀️ Todo lo programado para hoy (viajes, citas, santos)' },
  { command: 'traslados', description: '🚗 Próximos traslados de los padres y conductores' },
  { command: 'citas', description: '🏥 Próximas citas médicas de Papá y Mamá' },
  { command: 'eventos', description: '🍖 Quedadas, barbacoas y comidas familiares' },
  { command: 'vacaciones', description: '🏖️ Vacaciones familiares y quiénes van' },
  { command: 'cumples', description: '🎂 Cumpleaños del mes en curso' },
  { command: 'santos', description: '✨ Santos de hoy y del mes' },
  { command: 'ayuda', description: '❓ Ver lista de comandos y enlace a la Web' }
];

async function registrarComandos() {
  console.log('Registrando menú de comandos en la API de Telegram...');
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands: COMANDOS_BOT })
  });
  const data = await res.json();
  if (data.ok) {
    console.log('✅ ¡Comandos registrados con éxito en Telegram!');
    console.log(COMANDOS_BOT);
  } else {
    console.error('❌ Error registrando comandos:', data);
  }
}

async function verEstadoWebhook() {
  console.log('Consultando estado actual del Webhook en Telegram...');
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
  const data = await res.json();
  console.log('Estado actual del Webhook:', data.result);
}

async function configurarWebhook(url) {
  if (!url) {
    console.log('ℹ️ Para configurar el webhook ejecuta: node scripts/setup_telegram_bot.mjs set https://TU-URL.vercel.app/api/telegram');
    return;
  }
  console.log(`Configurando Webhook hacia: ${url}...`);
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: url })
  });
  const data = await res.json();
  if (data.ok) {
    console.log('✅ ¡Webhook configurado con éxito en Telegram!');
  } else {
    console.error('❌ Error configurando webhook:', data);
  }
}

async function main() {
  const accion = process.argv[2] || 'comandos';
  const paramUrl = process.argv[3];

  if (accion === 'comandos') {
    await registrarComandos();
    await verEstadoWebhook();
  } else if (accion === 'info') {
    await verEstadoWebhook();
  } else if (accion === 'set') {
    await configurarWebhook(paramUrl);
    await verEstadoWebhook();
  } else {
    console.log('Uso:');
    console.log('  node scripts/setup_telegram_bot.mjs comandos     (Registra los comandos de autocompletado)');
    console.log('  node scripts/setup_telegram_bot.mjs info         (Muestra el estado del webhook actual)');
    console.log('  node scripts/setup_telegram_bot.mjs set <URL>    (Configura la URL del webhook)');
  }
}

main();
