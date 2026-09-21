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

  const [snapCumples, snapMiembros, snapCitas, snapTraslados, snapEventos, snapVacaciones] = await Promise.all([
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'cumpleanos')),
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'miembros')),
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'citasMedicas')),
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'trasladosPadres')),
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'eventos')),
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'vacaciones'))
  ]);

  return {
    cumpleanos: snapCumples.docs.map(d => ({ id: d.id, ...d.data() })),
    integrantes: snapMiembros.docs.map(d => ({ id: d.id, ...d.data() })),
    citasMedicas: snapCitas.docs.map(d => ({ id: d.id, ...d.data() })),
    trasladosPadres: snapTraslados.docs.map(d => ({ id: d.id, ...d.data() })),
    eventos: snapEventos.docs.map(d => ({ id: d.id, ...d.data() })),
    vacaciones: snapVacaciones.docs.map(d => ({ id: d.id, ...d.data() }))
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
          `🍖 <b>/eventos</b> — Barbacoas, comidas y quedadas familiares\n` +
          `🏖️ <b>/vacaciones</b> — Períodos y lugares de vacaciones de la familia\n` +
          `☀️ <b>/hoy</b> — Todo lo previsto para hoy (viajes, médicos, santos...)\n` +
          `🎂 <b>/cumples</b> — Cumpleaños de este mes\n` +
          `✨ <b>/santos</b> — Santos de hoy y de este mes\n` +
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
          .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.hora || '').localeCompare(b.hora || ''))
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

      case '/eventos':
      case '/quedadas':
      case '/barbacoas':
      case '/planes': {
        const { eventos } = await obtenerDatosFirestore();
        const eventosFuturos = (eventos || [])
          .filter(e => {
            const fechaLimite = e.fechaFin || e.fecha;
            return fechaLimite && fechaLimite >= hoyIso;
          })
          .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.hora || '').localeCompare(b.hora || ''))
          .slice(0, 8);

        if (eventosFuturos.length === 0) {
          const resp = `🍖 <b>Planes y Quedadas Familiares</b>\n\n` +
            `No hay barbacoas o quedadas programadas próximamente.\n\n` +
            `👉 <a href="https://familiabarnuevoapp.web.app">Proponer una comida o quedada en la Web</a>`;
          await enviarRespuestaTelegram(chatId, resp, messageId);
          break;
        }

        let resp = `🍖 <b>Próximas Barbacoas y Quedadas (${eventosFuturos.length}):</b>\n\n`;
        eventosFuturos.forEach((evt, idx) => {
          const diffDias = Math.round((new Date(evt.fecha).getTime() - new Date(hoyIso).getTime()) / (1000 * 60 * 60 * 24));
          const avisoTiempo = diffDias === 0 ? '🚨 <b>¡HOY!</b>' : diffDias === 1 ? '⏳ <b>Mañana</b>' : `En ${diffDias} días`;

          let fechaTxt = formatearFechaBonita(evt.fecha);
          if (evt.fechaFin && evt.fechaFin !== evt.fecha) {
            fechaTxt = `Del ${formatearFechaBonita(evt.fecha)} al ${formatearFechaBonita(evt.fechaFin)}`;
          }

          const horaTxt = evt.hora ? ` a las ${evt.hora}` : '';
          const asistentes = (evt.asistentes && evt.asistentes.length > 0)
            ? evt.asistentes.join(', ')
            : '<i>Nadie confirmado aún</i>';

          resp += `${idx + 1}. <b>${evt.titulo}</b> (${avisoTiempo})\n` +
            `• 📅 ${fechaTxt}${horaTxt}\n` +
            `• 📍 Lugar: ${evt.lugar || 'Por definir'}\n` +
            `• 👥 Confirmados (${evt.asistentes?.length || 0}): ${asistentes}\n`;

          if (evt.descripcion) {
            resp += `• 📝 <i>"${evt.descripcion}"</i>\n`;
          }
          resp += '\n';
        });

        resp += `👉 <a href="https://familiabarnuevoapp.web.app">Apuntarse o proponer en la Web</a>`;
        await enviarRespuestaTelegram(chatId, resp, messageId);
        break;
      }

      case '/vacaciones': {
        const { vacaciones } = await obtenerDatosFirestore();
        const vacsFuturas = (vacaciones || [])
          .filter(v => {
            const fechaLimite = v.fechaFin || v.fechaInicio;
            return fechaLimite && fechaLimite >= hoyIso;
          })
          .sort((a, b) => (a.fechaInicio || '').localeCompare(b.fechaInicio || ''));

        if (vacsFuturas.length === 0) {
          const resp = `🏖️ <b>Vacaciones Familiares</b>\n\n` +
            `No hay períodos de vacaciones activos o próximos registrados.\n\n` +
            `👉 <a href="https://familiabarnuevoapp.web.app">Registrar vacaciones en la Web</a>`;
          await enviarRespuestaTelegram(chatId, resp, messageId);
          break;
        }

        let resp = `🏖️ <b>Próximas Vacaciones Familiares (${vacsFuturas.length}):</b>\n\n`;
        vacsFuturas.forEach((vac, idx) => {
          let periodoTxt = '';
          if (vac.fechaInicio && vac.fechaFin) {
            periodoTxt = `Del ${formatearFechaBonita(vac.fechaInicio)} al ${formatearFechaBonita(vac.fechaFin)}`;
          } else if (vac.fechaInicio) {
            periodoTxt = `A partir del ${formatearFechaBonita(vac.fechaInicio)}`;
          } else {
            periodoTxt = 'Fechas por definir';
          }

          const quienes = (vac.quienes && vac.quienes.length > 0)
            ? vac.quienes.join(', ')
            : 'Toda la familia';

          resp += `${idx + 1}. 📍 <b>${vac.lugar}</b>\n` +
            `• 📅 ${periodoTxt}\n` +
            `• 👥 Quiénes: <b>${quienes}</b>\n`;

          if (vac.nota) {
            resp += `• 📝 <i>"${vac.nota}"</i>\n`;
          }
          resp += '\n';
        });

        resp += `👉 <a href="https://familiabarnuevoapp.web.app">Ver mapa y calendario en la Web</a>`;
        await enviarRespuestaTelegram(chatId, resp, messageId);
        break;
      }

      case '/hoy': {
        const { citasMedicas, trasladosPadres, cumpleanos, integrantes, eventos, vacaciones } = await obtenerDatosFirestore();

        const normalizarHora = (hora, momentoDia) => {
          if (hora && /^\d{1,2}:\d{2}$/.test(hora.trim())) {
            const [h, m] = hora.trim().split(':');
            return `${h.padStart(2, '0')}:${m}`;
          }
          const m = (momentoDia || '').toLowerCase();
          if (m.includes('mañana') || m.includes('manana')) return '10:00';
          if (m.includes('mediodía') || m.includes('mediodia')) return '14:00';
          if (m.includes('tarde')) return '18:00';
          if (m.includes('noche')) return '21:00';
          return '23:59';
        };

        const trasladosHoy = trasladosPadres.filter(t => t.fecha === hoyIso && t.estado !== 'realizado');
        const citasHoy = citasMedicas.filter(c => c.fecha === hoyIso && c.estado !== 'completada');
        const eventosHoy = (eventos || []).filter(e => {
          if (e.fecha === hoyIso) return true;
          if (e.fechaInicio && e.fechaFin && hoyIso >= e.fechaInicio && hoyIso <= e.fechaFin) return true;
          return false;
        });

        const itemsHoy = [
          ...trasladosHoy.map(t => ({ tipo: 'traslado', horaSort: normalizarHora(t.hora, t.momentoDia), data: t })),
          ...citasHoy.map(c => ({ tipo: 'cita', horaSort: normalizarHora(c.hora), data: c })),
          ...eventosHoy.map(e => ({ tipo: 'evento', horaSort: normalizarHora(e.hora), data: e }))
        ].sort((a, b) => a.horaSort.localeCompare(b.horaSort));

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
          resp += `🎂 <b>¡Cumpleaños de hoy!</b>\n` + cumplesHoy.map(c => {
            const miembro = integrantes.find(i => i.nombre?.toLowerCase().trim() === c.nombre?.toLowerCase().trim());
            let edadTxt = '';
            if (miembro && miembro.fechaNacimiento) {
              const anoNac = parseInt(miembro.fechaNacimiento.split('-')[0], 10);
              if (!isNaN(anoNac)) {
                edadTxt = ` (¡Cumple <b>${hAno - anoNac} años</b>! 🎈)`;
              }
            }
            return `• ¡Felicidades a <b>${c.nombre}</b>!${edadTxt} 🎉`;
          }).join('\n') + `\n\n`;
        }

        if (santosHoy.length > 0) {
          resp += `✨ <b>¡Santos de hoy!</b>\n` + santosHoy.map(n => `• ¡Santo de <b>${n}</b>! 🎊`).join('\n') + `\n\n`;
        }

        if (itemsHoy.length > 0) {
          itemsHoy.forEach((item, idx) => {
            if (item.tipo === 'cita') {
              const c = item.data;
              const horaTxt = c.hora ? ` a las <b>${c.hora}</b>` : '';
              const tieneDetalle = c.quienLleva && c.quienRecoge && c.quienLleva !== c.quienRecoge;
              let textoLlevaRecoge = '';
              if (c.noNecesitaAcompanante || c.acompanante === 'No necesita acompañante') {
                textoLlevaRecoge = `• 🚶 <i>No necesita acompañante</i>\n`;
              } else if (tieneDetalle) {
                textoLlevaRecoge = `• 🚗 Lleva (Ida): <b>${c.quienLleva}</b>\n• 🚙 Recoge (Vuelta): <b>${c.quienRecoge}</b>\n`;
              } else {
                const persona = c.quienLleva || c.acompanante;
                const tiene = persona && persona !== 'Pendiente de asignar';
                textoLlevaRecoge = `• 🚗 Acompaña: <b>${tiene ? persona : '⚠️ ¡Pendiente de asignar!'}</b>\n`;
              }

              resp += `🏥 <b>Cita Médica HOY:</b>\n` +
                `• <b>${c.paciente || 'Papá (Jaime)'}</b> tiene cita de <b>${c.especialidad || 'Consulta'}</b>${horaTxt}` + (c.centro ? ` en ${c.centro}` : '') + `.\n` +
                textoLlevaRecoge +
                (c.notas ? `• 📋 <i>${c.notas}</i>\n` : '') +
                `\n`;
            } else if (item.tipo === 'traslado') {
              const t = item.data;
              const horaTxt = t.hora ? ` (${t.hora})` : (t.momentoDia ? ` (${t.momentoDia})` : '');
              const sinConductor = !t.conductor || t.conductor === 'Pendiente de asignar';

              resp += `🚗 <b>Traslado de los Padres HOY:</b>\n` +
                `• <b>${t.origen} ➔ ${t.destino}</b>${horaTxt}\n` +
                `• 👤 Conductor: <b>${sinConductor ? '⚠️ ¡Pendiente de conductor!' : t.conductor}</b>\n` +
                (t.opciones && t.opciones.length > 1 ? `• 💡 <i>Opciones:</i> ` + t.opciones.map(o => `${o.conductor} (${o.hora})${o.esElegida ? ' ⭐' : ''}`).join(', ') + `\n` : '') +
                (t.notas ? `• 📋 <i>${t.notas}</i>\n` : '') +
                `\n`;
            } else if (item.tipo === 'evento') {
              const e = item.data;
              resp += `🍖 <b>Evento / Quedada HOY:</b>\n` +
                `• <b>${e.titulo}</b>${e.hora ? ` (${e.hora})` : ''}` + (e.lugar ? ` en ${e.lugar}` : '') + `\n` +
                (e.descripcion ? `• 📋 <i>"${e.descripcion}"</i>\n` : '') +
                `\n`;
            }
          });
        }

        // Vacaciones activas o próximas
        const vacsActivas = [];
        const vacsProximas = [];
        (vacaciones || []).forEach(v => {
          if (!v.fechaInicio) return;
          const fIni = v.fechaInicio;
          const fFin = v.fechaFin || v.fechaInicio;
          if (hoyIso >= fIni && hoyIso <= fFin) {
            vacsActivas.push(v);
          } else if (fIni > hoyIso) {
            const diff = Math.round((new Date(fIni).getTime() - new Date(hoyIso).getTime()) / (1000 * 60 * 60 * 24));
            if (diff <= 3) {
              vacsProximas.push({ ...v, diffDias: diff });
            }
          }
        });

        if (vacsProximas.length > 0) {
          vacsProximas.forEach(v => {
            const cuando = v.diffDias === 1 ? '¡Mañana' : (v.diffDias === 0 ? '¡Hoy' : `En ${v.diffDias} días`);
            const quienes = v.quienes && v.quienes.length > 0 ? v.quienes.join(', ') : 'La familia';
            resp += `🏖️ <b>¡Vacaciones Próximas!</b> ${cuando} comienzan las vacaciones en <b>${v.lugar}</b> (${quienes}).\n`;
            if (v.nota) resp += `• 📝 <i>"${v.nota}"</i>\n`;
            resp += '\n';
          });
        }

        if (vacsActivas.length > 0) {
          vacsActivas.forEach(v => {
            const quienes = v.quienes && v.quienes.length > 0 ? v.quienes.join(', ') : 'La familia';
            resp += `🌴 <b>¡Actualmente de Vacaciones!</b> En <b>${v.lugar}</b> (${quienes}).\n\n`;
          });
        }

        if (cumplesHoy.length === 0 && santosHoy.length === 0 && itemsHoy.length === 0 && vacsActivas.length === 0 && vacsProximas.length === 0) {
          resp += `🏖️ ¡Día tranquilo! No hay traslados, citas médicas, quedadas ni celebraciones programadas para hoy.\n\n`;
        }

        resp += `👉 <a href="https://familiabarnuevoapp.web.app">Abrir FamilyApp</a>`;
        await enviarRespuestaTelegram(chatId, resp, messageId);
        break;
      }

      case '/cumples': {
        const { cumpleanos, integrantes } = await obtenerDatosFirestore();
        const mesActualNum = hMes;
        const nombreMesActual = MESES[mesActualNum - 1];
        const mesSiguienteNum = hMes === 12 ? 1 : hMes + 1;
        const anoSiguiente = hMes === 12 ? hAno + 1 : hAno;
        const nombreMesSiguiente = MESES[mesSiguienteNum - 1];

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

        const cumplesMesSiguiente = cumpleanos
          .filter(c => {
            if (!c.fecha || !c.fecha.includes('-')) return false;
            const parts = c.fecha.split('-');
            const m = parts.length === 3 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
            return m === mesSiguienteNum;
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
            const miembro = integrantes.find(i => i.nombre?.toLowerCase().trim() === c.nombre?.toLowerCase().trim());
            let edadTxt = '';
            if (miembro && miembro.fechaNacimiento) {
              const anoNac = parseInt(miembro.fechaNacimiento.split('-')[0], 10);
              if (!isNaN(anoNac)) {
                edadTxt = ` <i>(Cumple ${hAno - anoNac} años)</i>`;
              }
            }
            const esHoy = c.dia === hDia;
            const pasado = c.dia < hDia;
            const icono = esHoy ? '🎉' : pasado ? '✅' : '⏳';
            const tag = esHoy ? ' 🚨 <b>¡HOY!</b>' : pasado ? ' <i>(Pasado)</i>' : ` <i>(Faltan ${c.dia - hDia} días)</i>`;
            resp += `${icono} <b>${c.dia} de ${nombreMesActual}</b> — <b>${c.nombre}</b>${edadTxt}${tag}\n`;
          });
          resp += '\n';
        }

        if (cumplesMesSiguiente.length > 0) {
          resp += `🔮 <b>Próximos en ${nombreMesSiguiente}:</b>\n`;
          cumplesMesSiguiente.forEach(c => {
            const miembro = integrantes.find(i => i.nombre?.toLowerCase().trim() === c.nombre?.toLowerCase().trim());
            let edadTxt = '';
            if (miembro && miembro.fechaNacimiento) {
              const anoNac = parseInt(miembro.fechaNacimiento.split('-')[0], 10);
              if (!isNaN(anoNac)) {
                edadTxt = ` <i>(Cumple ${anoSiguiente - anoNac} años)</i>`;
              }
            }
            resp += `• <b>${c.dia} de ${nombreMesSiguiente}</b> — <b>${c.nombre}</b>${edadTxt}\n`;
          });
          resp += '\n';
        }

        resp += `👉 <a href="https://familiabarnuevoapp.web.app">Ver lista completa en la Web</a>`;
        await enviarRespuestaTelegram(chatId, resp, messageId);
        break;
      }

      case '/santos': {
        const { integrantes, cumpleanos } = await obtenerDatosFirestore();
        const nombreMesActual = MESES[hMes - 1];
        const mesSiguienteNum = hMes === 12 ? 1 : hMes + 1;
        const anoSiguiente = hMes === 12 ? hAno + 1 : hAno;
        const nombreMesSiguiente = MESES[mesSiguienteNum - 1];

        const diasEnMesActual = new Date(hAno, hMes, 0).getDate();
        const todosMiembrosYSantos = [];
        const nombresVistos = new Set();

        integrantes.forEach(i => {
          if (i.santo && !nombresVistos.has(i.nombre)) {
            todosMiembrosYSantos.push({ nombre: i.nombre, santo: i.santo });
            nombresVistos.add(i.nombre);
          }
        });
        cumpleanos.forEach(c => {
          if (c.santo && !nombresVistos.has(c.nombre)) {
            todosMiembrosYSantos.push({ nombre: c.nombre, santo: c.santo });
            nombresVistos.add(c.nombre);
          }
        });

        const santosMesActual = [];
        for (let d = 1; d <= diasEnMesActual; d++) {
          const f = new Date(hAno, hMes - 1, d);
          todosMiembrosYSantos.forEach(item => {
            if (matchesSaintDate(item.santo, f)) {
              santosMesActual.push({
                nombre: item.nombre,
                dia: d,
                mesNom: nombreMesActual,
                santoDesc: item.santo,
                esHoy: d === hDia,
                pasado: d < hDia,
                diffDias: d - hDia
              });
            }
          });
        }

        // Santos del próximo mes para prever
        const diasEnMesSiguiente = new Date(anoSiguiente, mesSiguienteNum, 0).getDate();
        const santosMesSiguiente = [];
        for (let d = 1; d <= diasEnMesSiguiente; d++) {
          const f = new Date(anoSiguiente, mesSiguienteNum - 1, d);
          todosMiembrosYSantos.forEach(item => {
            if (matchesSaintDate(item.santo, f)) {
              santosMesSiguiente.push({
                nombre: item.nombre,
                dia: d,
                mesNom: nombreMesSiguiente,
                santoDesc: item.santo
              });
            }
          });
        }

        let resp = `✨ <b>Santos de ${nombreMesActual.toUpperCase()} (${santosMesActual.length}):</b>\n\n`;

        if (santosMesActual.length === 0) {
          resp += `No hay santos registrados en el mes de ${nombreMesActual}.\n\n`;
        } else {
          santosMesActual.forEach(s => {
            let tag = '';
            let icono = '⏳';
            if (s.esHoy) {
              tag = ' 🚨 <b>¡HOY!</b>';
              icono = '🎉';
            } else if (s.pasado) {
              tag = ' <i>(Pasado)</i>';
              icono = '✅';
            } else {
              tag = s.diffDias === 1 ? ' (Mañana)' : ` (En ${s.diffDias} días)`;
            }
            resp += `${icono} <b>${s.dia} de ${s.mesNom}</b> — <b>${s.nombre}</b>${tag}\n`;
          });
          resp += '\n';
        }

        if (santosMesSiguiente.length > 0) {
          resp += `🔮 <b>Próximos en ${nombreMesSiguiente}:</b>\n`;
          santosMesSiguiente.forEach(s => {
            resp += `• <b>${s.dia} de ${s.mesNom}</b> — <b>${s.nombre}</b>\n`;
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
