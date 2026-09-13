const TELEGRAM_BOT_TOKEN = '8563679097:AAFit3k4k38GYIeFCJCAsdT9vVz2ylToi6E';
const TELEGRAM_CHAT_ID = '-1004328933116'; // Grupo Laos

const msg = `🏠 <b>¡Bienvenida Familia Barnuevo a la FamilyApp!</b> 🌟

Os dejamos un resumen rápido de todo lo que podéis organizar juntos desde la web familiar:

🚗 <b>1. Traslados de los Padres (Alcalá ⇄ Madrid)</b>
• Indicador en tiempo real de dónde están alojados Mamá y Papá (Madrid o Alcalá/Esgaravita).
• Planificación de viajes de ida y vuelta.
• Asignación de conductor con 1 solo clic (o escribir quién les lleva).

🩺 <b>2. Citas Médicas y Revisiones de Mamá y Papá</b>
• Agenda completa con especialistas, hospitales (con enlace directo a Google Maps) y notas médicas (ayunas, análisis...).
• <b>Coordinación doble:</b> permite indicar quién les lleva a la cita (Ida) y quién les recoge al terminar (Vuelta).
• Botones rápidos para ofrecerse a acompañarles.

🎂 <b>3. Cumpleaños y Santos (Onomásticas)</b>
• Agenda anual de los 7 hermanos, cuñados, sobrinos y abuelos.
• Cuenta atrás en días y aviso automático del bot a las 7:00 AM los días de celebración para felicitar a tiempo.

☀️ <b>4. Vacaciones de Verano y Barbacoas / Quedadas</b>
• Calendario visual de vacaciones para Julio y Agosto.
• Propuestas de barbacoas familiares con confirmación de asistencia en vivo.

📅 <b>5. Google Calendar y Descargas en PDF</b>
• Botón <b>+Calendar</b> en cada viaje, cita médica o cumpleaños para añadirlo al calendario de tu móvil.
• Botón <b>Descargar PDF</b> para guardar o imprimir el Árbol, las Vacaciones, la Agenda de Santos, las Citas Médicas y los Traslados.

🤖 <b>6. Avisos Automáticos del Bot</b>
• Recordatorios matutinos a las 7:00 AM si hay viajes o citas programadas para hoy o mañana.
• Notificación inmediata al grupo cada vez que se planifica algo nuevo.

👉 <b>Accede directamente desde cualquier móvil u ordenador sin instalar nada:</b>
<a href="https://familiabarnuevoapp.web.app">https://familiabarnuevoapp.web.app</a>`;

async function main() {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: msg,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    })
  });
  const data = await res.json();
  console.log('Resultado Telegram:', data);
}

main();
