import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCPc3BTDzRFts7TJYhEbrFjZ-fre5nsmXQ",
  authDomain: "familiabarnuevoapp.firebaseapp.com",
  projectId: "familiabarnuevoapp",
  storageBucket: "familiabarnuevoapp.firebasestorage.app",
  messagingSenderId: "202440118958",
  appId: "1:202440118958:web:db654e234f9dee1861d33f"
};

const TELEGRAM_BOT_TOKEN = '8563679097:AAFit3k4k38GYIeFCJCAsdT9vVz2ylToi6E';
const APP_ID = 'family-app-cloud';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function getFechaHoySpain() {
  const parts = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const day = parts.find(p => p.type === 'day')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const year = parts.find(p => p.type === 'year')?.value;
  return `${year}-${month}-${day}`;
}

function formatearFechaBonita(fechaStr) {
  if (!fechaStr) return 'Fecha sin definir';
  try {
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const diaSemana = DIAS_SEMANA[d.getDay()];
      const diaNum = parts[2];
      const mesNombre = MESES[parseInt(parts[1], 10) - 1];
      return `${diaSemana} ${diaNum} de ${mesNombre}`;
    }
  } catch {
    // fallback
  }
  return fechaStr;
}

function matchesSaintDate(santoStr, fechaObj) {
  if (!santoStr || typeof santoStr !== 'string') return false;
  const s = santoStr.toLowerCase();
  if (s.includes('no especificado') || s.includes('desconocido')) return false;

  const dia = fechaObj.getDate();
  const mesIndex = fechaObj.getMonth();
  const mesNombre = MESES[mesIndex];

  const patron1 = `${dia} de ${mesNombre}`;
  const patron2 = `${dia}/${mesIndex + 1}`;
  const patron3 = `${dia}-${mesIndex + 1}`;
  const patron4 = `${dia.toString().padStart(2, '0')}/${(mesIndex + 1).toString().padStart(2, '0')}`;

  return s.includes(patron1) || s.includes(patron2) || s.includes(patron3) || s.includes(patron4);
}

async function enviarRespuestaTelegram(chatId, texto, replyToMessageId = null) {
  try {
    const body = {
      chat_id: chatId,
      text: texto,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };
    if (replyToMessageId) {
      body.reply_to_message_id = replyToMessageId;
    }
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error('Error enviando mensaje a Telegram:', err);
  }
}

async function obtenerDatosFirestore() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    await signInAnonymously(auth);
  } catch (e) {
    console.warn('Sesión auth anónima ya activa o fallo:', e.message);
  }

  const [snapCumples, snapMiembros, snapCitas, snapTraslados] = await Promise.all([
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'cumpleanos')),
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'miembros')),
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'citasMedicas')),
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'trasladosPadres'))
  ]);

  return {
    cumpleanos: snapCumples.docs.map(d => ({ id: d.id, ...d.data() })),
    integrantes: snapMiembros.docs.map(d => ({ id: d.id, ...d.data() })),
    citasMedicas: snapCitas.docs.map(d => ({ id: d.id, ...d.data() })),
    trasladosPadres: snapTraslados.docs.map(d => ({ id: d.id, ...d.data() }))
  };
}

export default async function handler(req, res) {
  // Manejo de peticiones GET de prueba/health check
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'FamilyApp Telegram Webhook activo y listo' });
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Método no permitido');
  }

  const update = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!update || !update.message) {
    return res.status(200).json({ ok: true, ignored: 'No message update' });
  }

  const msg = update.message;
  const chatId = msg.chat?.id;
  const texto = (msg.text || '').trim();
  const messageId = msg.message_id;

  if (!texto.startsWith('/') || !chatId) {
    return res.status(200).json({ ok: true, ignored: 'Not a command' });
  }

  // Extraer comando (soporta /citas y /citas@Familiabarnuevo_bot)
  const primerElemento = texto.split(' ')[0].toLowerCase();
  const comando = primerElemento.split('@')[0];

  console.log(`[Telegram Bot] Recibido comando: ${comando} de chat: ${chatId}`);

  try {
    const hoyIso = getFechaHoySpain();
    const [hAno, hMes, hDia] = hoyIso.split('-').map(Number);
    const hoyObj = new Date(hAno, hMes - 1, hDia);

    switch (comando) {
      case '/start':
      case '/ayuda':
      case '/help':
      case '/menu': {
        const ayudaTxt =
          `👋 <b>¡Hola! Soy el Bot de FamilyApp</b> 🏡\n\n` +
          `Puedes consultarme lo que necesites usando estos comandos:\n\n` +
          `🚗 <b>/traslados</b> — Próximos viajes de los padres y quién conduce\n` +
          `🏥 <b>/citas</b> — Próximas citas médicas de Papá y Mamá\n` +
          `☀️ <b>/hoy</b> — Todo lo previsto para hoy (viajes, médicos, santos...)\n` +
          `🎂 <b>/cumples</b> — Cumpleaños de este mes\n` +
          `✨ <b>/santos</b> — Santos de hoy y de esta semana\n` +
          `❓ <b>/ayuda</b> — Ver este menú de ayuda\n\n` +
          `👉 <a href="https://familiabarnuevoapp.web.app">Abrir FamilyApp en la Web</a>`;
        await enviarRespuestaTelegram(chatId, ayudaTxt, messageId);
        break;
      }

      case '/citas': {
        const { citasMedicas } = await obtenerDatosFirestore();
        const citasPendientes = citasMedicas
          .filter(c => c.estado !== 'completada' && c.fecha && c.fecha >= hoyIso)
          .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.hora || '').localeCompare(b.hora || ''))
          .slice(0, 6);

        if (citasPendientes.length === 0) {
          const resp = `🏥 <b>Citas Médicas de Papá y Mamá</b>\n\n` +
            `✅ ¡No hay citas médicas pendientes en los próximos días!\n\n` +
            `👉 <a href="https://familiabarnuevoapp.web.app">Añadir cita en FamilyApp</a>`;
          await enviarRespuestaTelegram(chatId, resp, messageId);
          break;
        }

        let resp = `🏥 <b>Próximas Citas Médicas (${citasPendientes.length}):</b>\n\n`;
        citasPendientes.forEach((c, idx) => {
          const diffDias = Math.round((new Date(c.fecha).getTime() - new Date(hoyIso).getTime()) / (1000 * 60 * 60 * 24));
          const avisoTiempo = diffDias === 0 ? '🚨 <b>¡HOY!</b>' : diffDias === 1 ? '⏳ <b>Mañana</b>' : `En ${diffDias} días`;

          let textoAcompanante = '';
          if (c.noNecesitaAcompanante) {
            textoAcompanante = `• 🚶 <i>No necesita acompañante</i>`;
          } else if (c.quienLleva && c.quienRecoge && c.quienLleva !== c.quienRecoge) {
            textoAcompanante = `• 🚗 Lleva (Ida): <b>${c.quienLleva}</b>\n• 🚙 Recoge (Vuelta): <b>${c.quienRecoge}</b>`;
          } else {
            const persona = c.quienLleva || c.acompanante;
            const tiene = persona && persona !== 'Pendiente de asignar';
            textoAcompanante = `• 🚗 Acompaña: <b>${tiene ? persona : '⚠️ ¡Pendiente de asignar!'}</b>`;
          }

          resp += `${idx + 1}. <b>${c.paciente || 'Mamá/Papá'}</b> — ${c.especialidad || 'Consulta'} (${avisoTiempo})\n` +
            `• 📅 ${formatearFechaBonita(c.fecha)} a las <b>${c.hora || 'hora por confirmar'}</b>\n` +
            (c.centro ? `• 📍 ${c.centro}\n` : '') +
            `${textoAcompanante}\n` +
            (c.notas ? `• 📋 <i>${c.notas}</i>\n` : '') +
            `\n`;
        });

        resp += `👉 <a href="https://familiabarnuevoapp.web.app">Ver y gestionar en la Web</a>`;
        await enviarRespuestaTelegram(chatId, resp, messageId);
        break;
      }

      case '/traslados': {
        const { trasladosPadres } = await obtenerDatosFirestore();
        const trasladosPendientes = trasladosPadres
          .filter(t => t.estado !== 'realizado' && t.fecha && t.fecha >= hoyIso)
          .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
          .slice(0, 6);

        if (trasladosPendientes.length === 0) {
          const resp = `🚗 <b>Traslados de los Padres</b>\n\n` +
            `✅ ¡No hay traslados pendientes programados actualmente!\n\n` +
            `👉 <a href="https://familiabarnuevoapp.web.app">Planificar viaje en FamilyApp</a>`;
          await enviarRespuestaTelegram(chatId, resp, messageId);
          break;
        }

        let resp = `🚗 <b>Próximos Traslados de los Padres (${trasladosPendientes.length}):</b>\n\n`;
        trasladosPendientes.forEach((t, idx) => {
          const diffDias = Math.round((new Date(t.fecha).getTime() - new Date(hoyIso).getTime()) / (1000 * 60 * 60 * 24));
          const avisoTiempo = diffDias === 0 ? '🚨 <b>¡HOY!</b>' : diffDias === 1 ? '⏳ <b>Mañana</b>' : `En ${diffDias} días`;
          const sinConductor = !t.conductor || t.conductor === 'Pendiente de asignar';

          resp += `${idx + 1}. <b>${t.origen} ➔ ${t.destino}</b> (${avisoTiempo})\n` +
            `• 📅 ${formatearFechaBonita(t.fecha)} (${t.hora || t.momentoDia || 'Tarde'})\n` +
            `• 👤 Conductor: <b>${sinConductor ? '⚠️ ¡Pendiente de asignar!' : t.conductor}</b>\n`;

          if (t.opciones && t.opciones.length > 1) {
            resp += `• 💡 <i>Opciones propuestas:</i> ` +
              t.opciones.map(o => `${o.conductor} (${o.hora})${o.esElegida ? ' ⭐' : ''}`).join(', ') + `\n`;
          }

          if (t.notas) resp += `• 📋 <i>${t.notas}</i>\n`;
          resp += '\n';
        });

        resp += `👉 <a href="https://familiabarnuevoapp.web.app">Elegir preferencia o proponerse en la Web</a>`;
        await enviarRespuestaTelegram(chatId, resp, messageId);
        break;
      }

      case '/hoy': {
        const { citasMedicas, trasladosPadres, cumpleanos, integrantes } = await obtenerDatosFirestore();

        const trasladosHoy = trasladosPadres.filter(t => t.fecha === hoyIso && t.estado !== 'realizado');
        const citasHoy = citasMedicas.filter(c => c.fecha === hoyIso && c.estado !== 'completada');

        const cumplesHoy = cumpleanos.filter(c => {
          if (!c.fecha || !c.fecha.includes('-')) return false;
          const parts = c.fecha.split('-');
          const m = parts.length === 3 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
          const d = parts.length === 3 ? parseInt(parts[2], 10) : parseInt(parts[1], 10);
          return m === hMes && d === hDia;
        });

        const santosHoy = [];
        integrantes.forEach(i => {
          if (i.santo && matchesSaintDate(i.santo, hoyObj)) santosHoy.push(i.nombre);
        });
        cumpleanos.forEach(c => {
          if (c.santo && matchesSaintDate(c.santo, hoyObj) && !santosHoy.includes(c.nombre)) {
            santosHoy.push(c.nombre);
          }
        });

        let resp = `☀️ <b>Previsión para HOY (${formatearFechaBonita(hoyIso)}):</b>\n\n`;

        if (cumplesHoy.length > 0) {
          resp += `🎂 <b>¡Cumpleaños de hoy!</b>\n` + cumplesHoy.map(c => `• ¡Felicidades a <b>${c.nombre}</b>! 🎉`).join('\n') + `\n\n`;
        }

        if (santosHoy.length > 0) {
          resp += `✨ <b>¡Santos de hoy!</b>\n` + santosHoy.map(n => `• ¡Santo de <b>${n}</b>! 🎊`).join('\n') + `\n\n`;
        }

        if (trasladosHoy.length > 0) {
          resp += `🚗 <b>Traslados para hoy:</b>\n`;
          trasladosHoy.forEach(t => {
            resp += `• <b>${t.origen} ➔ ${t.destino}</b> a las <b>${t.hora || t.momentoDia}</b> (Conductor: <b>${t.conductor || '⚠️ Sin asignar'}</b>)\n`;
          });
          resp += '\n';
        }

        if (citasHoy.length > 0) {
          resp += `🏥 <b>Citas médicas para hoy:</b>\n`;
          citasHoy.forEach(c => {
            const quien = c.quienLleva || c.acompanante || (c.noNecesitaAcompanante ? 'No necesita' : '⚠️ Sin asignar');
            resp += `• <b>${c.paciente}</b>: ${c.especialidad} (${c.hora || 'hora por confirmar'}) en ${c.centro}. Acompaña: <b>${quien}</b>\n`;
          });
          resp += '\n';
        }

        if (cumplesHoy.length === 0 && santosHoy.length === 0 && trasladosHoy.length === 0 && citasHoy.length === 0) {
          resp += `🏖️ ¡Día tranquilo! No hay traslados, citas médicas ni celebraciones programadas para hoy.\n\n`;
        }

        resp += `👉 <a href="https://familiabarnuevoapp.web.app">Abrir FamilyApp</a>`;
        await enviarRespuestaTelegram(chatId, resp, messageId);
        break;
      }

      case '/cumples': {
        const { cumpleanos } = await obtenerDatosFirestore();
        const mesActualNum = hMes;
        const nombreMesActual = MESES[mesActualNum - 1];

        const cumplesDelMes = cumpleanos
          .filter(c => {
            if (!c.fecha || !c.fecha.includes('-')) return false;
            const parts = c.fecha.split('-');
            const m = parts.length === 3 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
            return m === mesActualNum;
          })
          .map(c => {
            const parts = c.fecha.split('-');
            const d = parts.length === 3 ? parseInt(parts[2], 10) : parseInt(parts[1], 10);
            return { ...c, dia: d };
          })
          .sort((a, b) => a.dia - b.dia);

        let resp = `🎂 <b>Cumpleaños de ${nombreMesActual.toUpperCase()} (${cumplesDelMes.length}):</b>\n\n`;

        if (cumplesDelMes.length === 0) {
          resp += `No hay cumpleaños registrados en el mes de ${nombreMesActual}.\n\n`;
        } else {
          cumplesDelMes.forEach(c => {
            const esHoy = c.dia === hDia;
            const pasado = c.dia < hDia;
            const icono = esHoy ? '🎉' : pasado ? '✅' : '⏳';
            resp += `${icono} <b>${c.dia} de ${nombreMesActual}</b> — <b>${c.nombre}</b>${esHoy ? ' 🚨 <b>¡HOY!</b>' : ''}\n`;
          });
          resp += '\n';
        }

        resp += `👉 <a href="https://familiabarnuevoapp.web.app">Ver lista completa en la Web</a>`;
        await enviarRespuestaTelegram(chatId, resp, messageId);
        break;
      }

      case '/santos': {
        const { integrantes, cumpleanos } = await obtenerDatosFirestore();

        // Buscar santos de hoy y próximos 7 días
        const santosProximos = [];
        for (let i = 0; i <= 7; i++) {
          const f = new Date(hoyObj.getTime() + i * 24 * 60 * 60 * 1000);
          const dia = f.getDate();
          const mesNom = MESES[f.getMonth()];

          integrantes.forEach(ing => {
            if (ing.santo && matchesSaintDate(ing.santo, f)) {
              santosProximos.push({ nombre: ing.nombre, dia, mesNom, diff: i });
            }
          });
          cumpleanos.forEach(c => {
            if (c.santo && matchesSaintDate(c.santo, f) && !santosProximos.some(s => s.nombre === c.nombre && s.diff === i)) {
              santosProximos.push({ nombre: c.nombre, dia, mesNom, diff: i });
            }
          });
        }

        let resp = `✨ <b>Santos de esta semana:</b>\n\n`;
        if (santosProximos.length === 0) {
          resp += `No hay santos registrados para esta semana.\n\n`;
        } else {
          santosProximos.forEach(s => {
            const esHoy = s.diff === 0;
            const esManana = s.diff === 1;
            const tag = esHoy ? '🚨 <b>¡HOY!</b>' : esManana ? '⏳ Mañana' : `En ${s.diff} días`;
            resp += `• <b>${s.nombre}</b>: ${s.dia} de ${s.mesNom} (${tag})\n`;
          });
          resp += '\n';
        }

        resp += `👉 <a href="https://familiabarnuevoapp.web.app">Ver todos los santos en la Web</a>`;
        await enviarRespuestaTelegram(chatId, resp, messageId);
        break;
      }

      default: {
        // Comando desconocido
        break;
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error en Telegram Webhook handler:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
