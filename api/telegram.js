import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { runDailyDigest, resolverUbicacionPadres, deduplicarCumpleanos, matchesSaintDate, esMiembroActivoValido } from '../scripts/telegram_daily_cron.mjs';

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

async function guardarUbicacionManualFirestore(nuevaUbicacion, autorNombre = 'Telegram') {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  try {
    await signInAnonymously(auth);
  } catch (e) {}

  const nowIso = new Date().toISOString();
  const payload = {
    ubicacion: nuevaUbicacion,
    modo: 'manual',
    esManual: true,
    fechaCambio: nowIso,
    fecha: nowIso,
    actualizadoPor: autorNombre
  };

  await Promise.all([
    setDoc(doc(db, 'artifacts', APP_ID, 'public', 'config_ubicacion_padres'), payload, { merge: true }),
    setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'configuracion', 'config_ubicacion_padres'), payload, { merge: true })
  ]);
  return nuevaUbicacion;
}

async function enviarRespuestaTelegram(chatId, texto, replyToMessageId = null, replyMarkup = null) {
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
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
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

async function setMessageReactionTelegram(chatId, messageId, emoji = '👍') {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMessageReaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reaction: [{ type: 'emoji', emoji: emoji }]
      })
    });
  } catch (err) {
    console.error('Error enviando reacción a Telegram:', err);
  }
}

async function answerCallbackQuery(callbackQueryId, text, showAlert = false) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: showAlert
      })
    });
  } catch (err) {
    console.error('Error answering callback query:', err);
  }
}

async function editMessageTextTelegram(chatId, messageId, texto, replyMarkup = null) {
  try {
    const payload = {
      chat_id: chatId,
      message_id: messageId,
      text: texto,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Error editMessageText en Telegram:', err);
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

  const docUbicacion = doc(db, 'artifacts', APP_ID, 'public', 'config_ubicacion_padres');

  const [snapCumples, snapMiembros, snapCitas, snapTraslados, snapEventos, snapVacaciones, snapUbicacion] = await Promise.all([
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'cumpleanos')),
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'miembros')),
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'citasMedicas')),
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'trasladosPadres')),
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'eventos')),
    getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'vacaciones')),
    getDoc(docUbicacion)
  ]);

  const integrantesList = snapMiembros.docs.map(d => ({ ...d.data(), id: d.id }));
  const trasladosList = snapTraslados.docs.map(d => ({ ...d.data(), id: d.id }));
  const ubicacionPadres = resolverUbicacionPadres(snapUbicacion, trasladosList, getFechaHoySpain());

  return {
    cumpleanos: deduplicarCumpleanos(snapCumples.docs.map(d => ({ ...d.data(), id: d.id })), integrantesList),
    integrantes: integrantesList,
    citasMedicas: snapCitas.docs.map(d => ({ ...d.data(), id: d.id })),
    trasladosPadres: trasladosList,
    eventos: snapEventos.docs.map(d => ({ ...d.data(), id: d.id })),
    vacaciones: snapVacaciones.docs.map(d => ({ ...d.data(), id: d.id })),
    ubicacionPadres
  };
}

async function procesarVotoEncuesta(pollAnswer) {
  const pollId = String(pollAnswer.poll_id || '');
  const user = pollAnswer.user;
  const optionIds = pollAnswer.option_ids || [];

  if (!pollId || !user) return;

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    await signInAnonymously(auth);
  } catch (e) {
    // ignore
  }

  const colEventos = collection(db, 'artifacts', APP_ID, 'public', 'data', 'eventos');
  const snapEventos = await getDocs(colEventos);

  const propuestaDoc = snapEventos.docs.find(d => {
    const data = d.data();
    return String(data.pollId || data.poll_id || '') === pollId;
  });

  if (!propuestaDoc) {
    console.log(`[Telegram Poll] No se encontró evento para pollId: ${pollId}`);
    return;
  }

  const pData = propuestaDoc.data();
  const opciones = pData.opcionesVotacion || ['¡Me apunto! 🙋‍♂️', 'No puedo esta vez 😔', 'Llego a los cafés ☕'];

  // Obtener integrantes para mapear al nombre del familiar
  const snapMiembros = await getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'miembros'));
  const integrantes = snapMiembros.docs.map(d => ({ id: d.id, ...d.data() }));

  const firstName = (user.first_name || '').trim().toLowerCase();
  const username = (user.username || '').trim().toLowerCase();

  const match = integrantes.find(i => {
    const n = (i.nombre || '').toLowerCase();
    const alias = (i.alias || '').toLowerCase();
    const tg = (i.telegram || i.telegramUser || '').toLowerCase().replace('@', '');
    return (
      (firstName && (n.includes(firstName) || firstName.includes(n))) ||
      (username && tg && tg === username) ||
      (alias && firstName && (alias.includes(firstName) || firstName.includes(alias)))
    );
  });

  const votanteNombre = match?.nombre || user.first_name || user.username || `Usuario ${user.id}`;
  const currentVotos = { ...(pData.votos || {}) };
  let currentAsistentes = Array.isArray(pData.asistentes) ? [...pData.asistentes] : [];

  if (optionIds.length > 0) {
    const optIdx = optionIds[0];
    const votoTexto = opciones[optIdx] || `Opción ${optIdx}`;
    currentVotos[votanteNombre] = votoTexto;

    const esPositivo = !votoTexto.toLowerCase().includes('no puedo') && !votoTexto.toLowerCase().includes('no asisto');
    if (esPositivo && !currentAsistentes.includes(votanteNombre)) {
      currentAsistentes.push(votanteNombre);
    } else if (!esPositivo) {
      currentAsistentes = currentAsistentes.filter(a => a !== votanteNombre);
    }
  } else {
    delete currentVotos[votanteNombre];
    currentAsistentes = currentAsistentes.filter(a => a !== votanteNombre);
  }

  await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'eventos', propuestaDoc.id), {
    votos: currentVotos,
    asistentes: currentAsistentes,
    actualizadoEl: new Date().toISOString()
  });

  console.log(`[Telegram Poll] Voto registrado para ${votanteNombre}: ${currentVotos[votanteNombre] || 'retirado'}`);
}

async function procesarCallbackQuery(callbackQuery) {
  const data = callbackQuery.data || '';
  const queryId = callbackQuery.id;
  const user = callbackQuery.from;

  if (data.startsWith('ubicacion:')) {
    const destCode = data.split(':')[1];
    const nuevaUbicacion = destCode === 'madrid' ? 'Madrid' : 'Alcalá (Esgaravita)';
    const autor = user?.first_name || user?.username || 'Telegram';

    await guardarUbicacionManualFirestore(nuevaUbicacion, `${autor} (Telegram)`);
    await answerCallbackQuery(queryId, `🏡 Ubicación fijada en: ${nuevaUbicacion}`);

    if (callbackQuery.message) {
      const chatId = callbackQuery.message.chat.id;
      await enviarRespuestaTelegram(
        chatId,
        `🏡 <b>Ubicación actualizada:</b> <b>${autor}</b> ha confirmado que Papá y Mamá están en <b>${nuevaUbicacion}</b>.`
      );
    }
    return;
  }

  if (!data.startsWith('rsvp:')) {
    await answerCallbackQuery(queryId, 'Acción no soportada');
    return;
  }

  const parts = data.split(':');
  const eventId = parts[1];
  const accion = parts[2]; // 'apunto', 'cafes', 'no'

  if (!eventId || !accion) {
    await answerCallbackQuery(queryId, 'Datos de quedada inválidos');
    return;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    await signInAnonymously(auth);
  } catch (e) {}

  const colEventos = collection(db, 'artifacts', APP_ID, 'public', 'data', 'eventos');
  let eventDoc = null;
  let eventDocId = eventId;

  // Intentar leer por id directo
  try {
    const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'eventos', eventId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      eventDoc = snap.data();
    }
  } catch (e) {}

  if (!eventDoc) {
    // Si no coincide id directo, buscar en la colección
    const snapAll = await getDocs(colEventos);
    const found = snapAll.docs.find(d => d.id === eventId || String(d.data().pollId || '') === eventId || String(d.data().poll_id || '') === eventId);
    if (found) {
      eventDoc = found.data();
      eventDocId = found.id;
    }
  }

  if (!eventDoc) {
    await answerCallbackQuery(queryId, '⚠️ No se encontró la quedada en FamilyApp.');
    return;
  }

  // Identificar el integrante familiar
  const snapMiembros = await getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'miembros'));
  const integrantes = snapMiembros.docs.map(d => ({ ...d.data(), id: d.id }));

  const firstName = (user.first_name || '').trim().toLowerCase();
  const username = (user.username || '').trim().toLowerCase();

  const match = integrantes.find(i => {
    const n = (i.nombre || '').toLowerCase();
    const alias = (i.alias || '').toLowerCase();
    const tg = (i.telegram || i.telegramUser || '').toLowerCase().replace('@', '');
    return (
      (firstName && (n.includes(firstName) || firstName.includes(n))) ||
      (username && tg && tg === username) ||
      (alias && firstName && (alias.includes(firstName) || firstName.includes(alias)))
    );
  });

  const votanteNombre = match?.nombre || user.first_name || user.username || `Usuario ${user.id}`;
  let currentAsistentes = Array.isArray(eventDoc.asistentes) ? [...eventDoc.asistentes] : [];
  let currentVotos = { ...(eventDoc.votos || {}) };
  let feedbackText = '';

  if (accion === 'apunto') {
    if (!currentAsistentes.includes(votanteNombre)) currentAsistentes.push(votanteNombre);
    currentVotos[votanteNombre] = '¡Me apunto! 🙋‍♂️';
    feedbackText = `🎉 ¡Te has apuntado a "${eventDoc.titulo}"!`;
  } else if (accion === 'cafes') {
    if (!currentAsistentes.includes(votanteNombre)) currentAsistentes.push(votanteNombre);
    currentVotos[votanteNombre] = 'Llego a los cafés ☕';
    feedbackText = `☕ ¡Apuntado a los cafés para "${eventDoc.titulo}"!`;
  } else if (accion === 'no') {
    currentAsistentes = currentAsistentes.filter(a => a !== votanteNombre);
    currentVotos[votanteNombre] = 'No puedo esta vez 😔';
    feedbackText = `😔 Has cancelado tu asistencia a "${eventDoc.titulo}".`;
  }

  // Guardar en Firestore
  await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'eventos', eventDocId), {
    asistentes: currentAsistentes,
    votos: currentVotos,
    actualizadoEl: new Date().toISOString()
  });

  // Notificar al usuario con popup
  await answerCallbackQuery(queryId, feedbackText);

  // Actualizar el mensaje de Telegram para mostrar la lista en vivo
  if (callbackQuery.message) {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    const listaAsistentesStr = currentAsistentes.length > 0
      ? currentAsistentes.map(a => `• ${a} ${currentVotos[a]?.includes('cafés') ? '☕' : '🙋‍♂️'}`).join('\n')
      : '• <i>Ninguno confirmado aún</i>';

    const fechaTexto = (eventDoc.fechaFin && eventDoc.fechaFin !== eventDoc.fecha)
      ? `Del ${formatearFechaBonita(eventDoc.fecha)} al ${formatearFechaBonita(eventDoc.fechaFin)}`
      : `${formatearFechaBonita(eventDoc.fecha)}${eventDoc.hora ? ` a las ${eventDoc.hora}` : ''}`;

    const nuevoTexto =
      `🍖 <b>¡Quedada Familiar: ${eventDoc.titulo}!</b>\n\n` +
      `📅 Fecha: <b>${fechaTexto}</b>\n` +
      `📍 Lugar: <b>${eventDoc.lugar || 'Por concretar'}</b>\n` +
      (eventDoc.descripcion ? `📝 <i>"${eventDoc.descripcion}"</i>\n\n` : '\n') +
      `👥 <b>Asistentes confirmados (${currentAsistentes.length}):</b>\n` +
      `${listaAsistentesStr}\n\n` +
      `👇 ¡Toca un botón para confirmar o cambiar tu asistencia:`;

    await editMessageTextTelegram(chatId, messageId, nuevoTexto, callbackQuery.message.reply_markup);
  }
}

function obtenerAutorFamiliar(user, integrantes = []) {
  if (!user) return 'Familiar';
  const firstName = (user.first_name || '').trim();
  const lastName = (user.last_name || '').trim();
  const username = (user.username || '').trim().toLowerCase().replace('@', '');
  const fullName = `${firstName} ${lastName}`.trim().toLowerCase();

  if (/encarna|mam[aá]/i.test(fullName)) return 'Mamá';
  if (/jaime|pap[aá]/i.test(fullName)) return 'Papá';
  if (/mariuge/i.test(fullName)) return 'Tía Mariuge';
  if (/rebe/i.test(fullName)) return 'Rebeca';
  if (/isaac|isik/i.test(fullName)) return 'Isaac';
  if (/m[oó]nica/i.test(fullName)) return 'Mónica';
  if (/mar[ií]a/i.test(fullName)) return 'María';
  if (/bartek/i.test(fullName)) return 'Bartek';
  if (/juan/i.test(fullName)) return 'Juan';
  if (/ana\b|anita/i.test(fullName)) return 'Ana';
  if (/javi/i.test(fullName)) return 'Javier';
  if (/cristina|cris\b/i.test(fullName)) return 'Cristina';
  if (/teresa|tere\b/i.test(fullName)) return 'Teresa';
  if (/jorge/i.test(fullName)) return 'Jorge';

  const match = integrantes.find(i => {
    const n = (i.nombre || '').toLowerCase();
    const alias = (i.alias || '').toLowerCase();
    const tg = (i.telegram || i.telegramUser || '').toLowerCase().replace('@', '');
    return (
      (username && tg && tg === username) ||
      (firstName && n.includes(firstName.toLowerCase())) ||
      (alias && firstName && alias.includes(firstName.toLowerCase()))
    );
  });

  return match?.nombre || firstName || user.username || 'Familiar';
}

function normalizarNombreFamiliar(nombreRaw, integrantes = [], autorNombre = 'Familiar') {
  if (!nombreRaw) return null;
  const n = nombreRaw.trim().toLowerCase();
  if (['yo', 'mí', 'mi', 'nosotros', 'nosotras', 'servidor'].includes(n)) return autorNombre;
  if (n.includes('mariuge')) return 'Tía Mariuge';
  if (n.includes('rebe')) return 'Rebeca';
  if (n.includes('isik') || n.includes('isaac')) return 'Isaac';
  if (n.includes('moni')) return 'Mónica';
  if (n.includes('bartek')) return 'Bartek';
  if (n.includes('juan')) return 'Juan';
  if (n.includes('ana')) return 'Ana';
  if (n.includes('javi')) return 'Javier';
  if (n.includes('cris')) return 'Cristina';
  if (n.includes('tere')) return 'Teresa';
  if (n.includes('jorge')) return 'Jorge';
  if (n.includes('mari') && !n.includes('mariuge')) return 'María';
  if (n.includes('papá') || n.includes('papa') || n.includes('jaime')) return 'Papá (Jaime)';
  if (n.includes('mamá') || n.includes('mama') || n.includes('encarna')) return 'Mamá (Encarnación)';

  const match = integrantes.find(i => {
    const iname = (i.nombre || '').toLowerCase();
    return iname.includes(n) || n.includes(iname.split(' ')[0]);
  });
  if (match) return match.nombre;

  return nombreRaw.charAt(0).toUpperCase() + nombreRaw.slice(1);
}

async function procesarMensajeNaturalGrupo(msg, chatId, texto, messageId) {
  const replyTo = msg.reply_to_message;
  const replyText = (replyTo?.text || '').toLowerCase();
  const t = texto.toLowerCase();

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  try {
    await signInAnonymously(auth);
  } catch (e) {}

  // 1. Detección de Ubicación de los Padres (ej: "Estamos en la Esgaravita", "Están en Madrid", "Ya hemos llegado a Alcalá")
  const matchUbicacion = texto.match(/(?:estamos|est[aá]n|padres\s+est[aá]n|pap[aá]\s+y\s+mam[aá]\s+est[aá]n|ya\s+hemos\s+llegado|ya\s+estamos)\s+en\s+(?:la\s+)?(esgaravita|alcal[aá]|madrid)/i);
  if (matchUbicacion) {
    const lugarRaw = matchUbicacion[1].toLowerCase();
    const nuevaUbi = lugarRaw.includes('madrid') ? 'Madrid' : 'Alcalá (Esgaravita)';
    const snapMiembros = await getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'miembros'));
    const integrantes = snapMiembros.docs.map(d => ({ ...d.data(), id: d.id }));
    const autor = obtenerAutorFamiliar(msg.from, integrantes);

    await guardarUbicacionManualFirestore(nuevaUbi, `${autor} (Telegram)`);
    await setMessageReactionTelegram(chatId, messageId, '🏡');
    await enviarRespuestaTelegram(
      chatId,
      `🏡 ✅ ¡Anotado, <b>${autor}</b>! He actualizado la ubicación de Papá y Mamá en la app a: <b>${nuevaUbi}</b>.`,
      messageId
    );
    return { tipo: 'ubicacion', ubicacion: nuevaUbi };
  }

  // 2. Detección de Quedadas / Barbacoas / Comidas
  const esQuedada = /(?:barbacoa|quedada|paella|comida|cena|reuni[oó]n)/i.test(t) || /(?:barbacoa|quedada|evento)/i.test(replyText);
  const esApuntarse = /(?:me\s+apunto|ap[uú]ntame|nos\s+apuntamos|contad\s+conmigo|contad\s+con\s+nosotros|voy\s+yo|asistir[eé]|asistiremos)/i.test(t);
  const esDesapuntarse = /(?:no\s+puedo|no\s+podr[eé]|no\s+vamos|no\s+voy|me\s+desapunto|no\s+cont[eé]is)/i.test(t);

  if (esQuedada && (esApuntarse || esDesapuntarse)) {
    const snapMiembros = await getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'miembros'));
    const integrantes = snapMiembros.docs.map(d => ({ ...d.data(), id: d.id }));
    const autor = obtenerAutorFamiliar(msg.from, integrantes);

    const snapEventos = await getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'eventos'));
    const hoyIso = getFechaHoySpain();
    const eventosFuturos = snapEventos.docs
      .map(d => ({ ...d.data(), id: d.id }))
      .filter(e => (e.fechaFin || e.fecha) >= hoyIso)
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));

    if (eventosFuturos.length > 0) {
      const evento = eventosFuturos[0];
      let asistentes = Array.isArray(evento.asistentes) ? [...evento.asistentes] : [];
      let votos = { ...(evento.votos || {}) };

      if (esApuntarse) {
        if (!asistentes.includes(autor)) asistentes.push(autor);
        votos[autor] = '¡Me apunto! 🙋‍♂️';
      } else {
        asistentes = asistentes.filter(a => a !== autor);
        votos[autor] = 'No puedo esta vez 😔';
      }

      await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'eventos', evento.id), {
        asistentes,
        votos,
        actualizadoEl: new Date().toISOString()
      });

      await setMessageReactionTelegram(chatId, messageId, esApuntarse ? '🎉' : '👍');
      const respTxt = esApuntarse
        ? `🍖 🎉 ¡Anotado, <b>${autor}</b>! Te he apuntado a la quedada <b>"${evento.titulo}"</b> (${formatearFechaBonita(evento.fecha)}). ¡Ya sois ${asistentes.length} confirmados!`
        : `🍖 👍 Entendido, <b>${autor}</b>. He actualizado la quedada <b>"${evento.titulo}"</b> marcando que no puedes asistir esta vez.`;

      await enviarRespuestaTelegram(chatId, respTxt, messageId);
      return { tipo: 'evento', eventoId: evento.id, accion: esApuntarse ? 'apunto' : 'desapunto' };
    }
  }

  // 3. Detección de Traslados de los Padres (ej: "Yo llevo a los padres el viernes", "Yo hago el traslado")
  const esTraslado = /(?:traslado|viaje\s+de\s+los\s+padres|llevar\s+a\s+los\s+padres|llevo\s+a\s+los\s+padres|llevo\s+a\s+pap[aá]\s+y\s+mam[aá]|conducir\s+yo)/i.test(t) || /(?:traslado\s+de\s+los\s+padres|traslado)/i.test(replyText);
  const conduceYo = /(?:yo\s+llevo|yo\s+conduzco|yo\s+hago|me\s+encargo\s+yo|conduzco\s+yo|llevo\s+yo)/i.test(t);

  if (esTraslado && conduceYo) {
    const snapMiembros = await getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'miembros'));
    const integrantes = snapMiembros.docs.map(d => ({ ...d.data(), id: d.id }));
    const autor = obtenerAutorFamiliar(msg.from, integrantes);

    const snapTraslados = await getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'trasladosPadres'));
    const hoyIso = getFechaHoySpain();
    const trasladosPendientes = snapTraslados.docs
      .map(d => ({ ...d.data(), id: d.id }))
      .filter(tr => tr.estado !== 'realizado' && tr.fecha && tr.fecha >= hoyIso)
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));

    const trasladoTarget = trasladosPendientes.find(tr => !tr.conductor || tr.conductor === 'Pendiente de asignar') || trasladosPendientes[0];

    if (trasladoTarget) {
      await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'trasladosPadres', trasladoTarget.id), {
        conductor: autor,
        actualizadoPor: `${autor} (Telegram)`,
        actualizadoEl: new Date().toISOString()
      });

      await setMessageReactionTelegram(chatId, messageId, '🚗');
      await enviarRespuestaTelegram(
        chatId,
        `🚗 ✅ ¡Muchísimas gracias, <b>${autor}</b>!\n\n` +
        `Te he asignado como conductor/a para el traslado de los padres:\n` +
        `• <b>${trasladoTarget.origen} ➔ ${trasladoTarget.destino}</b>\n` +
        `• 📅 <b>${formatearFechaBonita(trasladoTarget.fecha)}</b> (${trasladoTarget.hora || trasladoTarget.momentoDia || 'Hora por definir'})\n\n` +
        `👉 <a href="https://familiabarnuevoapp.web.app/?tab=traslados">Ver en FamilyApp</a>`,
        messageId
      );
      return { tipo: 'traslado', trasladoId: trasladoTarget.id, conductor: autor };
    }
  }

  // 4. Detección de Citas Médicas (Acompañamiento, Ida / Vuelta / Por su cuenta / Autobús / Andando)
  const tienePalabraMedica = /(?:dentista|m[eé]dico|doctor|consulta|hospital|ambulatorio|alcarria|quir[oó]n|endocrino|oculista|oftalm[oó]logo|trauma|an[aá]lisis|vacuna|gripe|pod[oó]logo|juan\s+de\s+austria|inyecci[oó]n|colonoscopia|pruebas|revisi[oó]n|cita)/i.test(t) || /(?:cita\s+m[eé]dica|dentista|consulta|m[eé]dico)/i.test(replyText);
  const tienePalabraTransporte = /(?:nos\s+lleva|me\s+lleva|le\s+lleva|la\s+lleva|llevo\s+yo|yo\s+llevo|nos\s+trae|me\s+trae|le\s+trae|la\s+trae|traigo\s+yo|yo\s+traigo|yo\s+(?:le\s+|la\s+)?acerco|acompa[ñn]o\s+yo|yo\s+acompa[ñn]o|recojo\s+yo|yo\s+recojo|le\s+recoge|la\s+recoge|me\s+recoge|nos\s+recoge|volveremos|volvere|volver[aá]n|volver[eé]|vuelta|por\s+mis\s+medios|por\s+nuestra\s+cuenta|por\s+su\s+cuenta|autob[uú]s|andando|voy\s+sol[oa]|vamos\s+sol[oa]s|no\s+necesita\s+acompa[ñn]ante|no\s+hace\s+falta\s+que\s+(?:me|nos)\s+(?:llev[eé]is|acompa[ñn][eé]is)|lleva\s+[a-záéíóúñ]+|acompa[ñn]a\s+[a-záéíóúñ]+|recoge\s+[a-záéíóúñ]+|trae\s+[a-záéíóúñ]+)/i.test(t);

  const hoyIso = getFechaHoySpain();
  const [hAno, hMes, hDia] = hoyIso.split('-').map(Number);
  const dManana = new Date(hAno, hMes - 1, hDia + 1);
  const mananaIso = `${dManana.getFullYear()}-${String(dManana.getMonth() + 1).padStart(2, '0')}-${String(dManana.getDate()).padStart(2, '0')}`;

  const snapCitas = await getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'citasMedicas'));
  const citasPendientes = snapCitas.docs
    .map(d => ({ ...d.data(), id: d.id }))
    .filter(c => c.estado !== 'completada' && c.fecha && c.fecha >= hoyIso)
    .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.hora || '').localeCompare(b.hora || ''));

  const citasHoyPendientes = citasPendientes.some(c => c.fecha === hoyIso);

  const esMensajeCita = (tienePalabraMedica && tienePalabraTransporte) ||
    (tienePalabraTransporte && replyText.includes('cita')) ||
    (tienePalabraTransporte && /(?:a\s+pap[aá]|a\s+mam[aá])/i.test(t)) ||
    (tienePalabraTransporte && citasHoyPendientes);

  if (esMensajeCita && citasPendientes.length > 0) {
    const snapMiembros = await getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'miembros'));
    const integrantes = snapMiembros.docs.map(d => ({ ...d.data(), id: d.id }));
    const autor = obtenerAutorFamiliar(msg.from, integrantes);

    // Separar posibles cláusulas compuestas si se habla de varias citas en el mismo mensaje
    // (Ej: "Esta mañana nos lleva Carmen a la vacuna y por la tarde nos acerca Juan al endocrino")
    const subMensajes = texto.split(/(?:\s+y\s+(?=por\s+la\s+(?:tarde|mañana|noche)|luego\b|despu[eé]s\b|a\s+las?\s+\d))/i);

    const citasActualizadas = [];
    const citasYaAsignadasIds = new Set();

    for (const subTexto of subMensajes) {
      const subT = subTexto.toLowerCase();

      // Puntuación de citas para esta cláusula
      let citaTarget = null;
      let mejorPuntuacion = -1;

      for (const c of citasPendientes) {
        if (citasYaAsignadasIds.has(c.id)) continue;
        let score = 0;
        const esp = (c.especialidad || '').toLowerCase().trim();
        const centro = (c.centro || '').toLowerCase().trim();
        const pac = (c.paciente || '').toLowerCase().trim();
        const hora = c.hora || '';
        const horaNorm = hora.replace(':', '.');

        if (esp && (subT.includes(esp) || replyText.includes(esp))) score += 15;
        if (centro && (subT.includes(centro) || replyText.includes(centro))) score += 8;

        // Si mencionan 'vacuna', asociar con centros o citas de vacunas / Juan de Austria / inyecciones
        if (subT.includes('vacuna') && (esp.includes('vacuna') || esp.includes('juan de austria') || centro.includes('juan de austria') || esp.includes('inyecci'))) {
          score += 14;
        }

        if (hora) {
          const horaNum = parseInt(hora.split(':')[0], 10);
          if (horaNum < 14 && /(?:esta\s+mañana|por\s+la\s+mañana)/i.test(subT)) score += 8;
          if (horaNum >= 14 && /(?:esta\s+tarde|por\s+la\s+tarde)/i.test(subT)) score += 8;
          if (subT.includes(hora) || subT.includes(horaNorm)) score += 8;
        }

        if (subT.includes('mañana') && c.fecha === mananaIso && !/(?:esta\s+mañana|por\s+la\s+mañana)/i.test(subT)) score += 10;
        if (c.fecha === hoyIso && (subT.includes('hoy') || /(?:esta\s+mañana|esta\s+tarde)/i.test(subT))) score += 6;

        if (pac.includes('mamá') && /(?:mam[aá]|la\s+lleva|me\s+lleva|nos\s+lleva)/i.test(subT)) score += 2;
        if (pac.includes('papá') && /(?:pap[aá]|le\s+lleva|lo\s+lleva|nos\s+lleva)/i.test(subT)) score += 2;

        if (!c.quienLleva || c.quienLleva === 'Pendiente de asignar') score += 1;

        if (score > mejorPuntuacion && score > 0) {
          mejorPuntuacion = score;
          citaTarget = c;
        }
      }

      if (!citaTarget && subMensajes.length === 1) {
        citaTarget = citasPendientes.find(c => c.fecha === hoyIso && (!c.quienLleva || c.quienLleva === 'Pendiente de asignar'))
          || citasPendientes.find(c => c.fecha === mananaIso && (!c.quienLleva || c.quienLleva === 'Pendiente de asignar'))
          || citasPendientes.find(c => c.fecha === hoyIso)
          || citasPendientes.find(c => c.fecha === mananaIso)
          || citasPendientes[0];
      }

      if (!citaTarget) continue;

      const esPorSusMedios = /(?:por\s+(?:mis|nuestros?|sus)\s+medios|por\s+(?:mi|nuestra|su)\s+cuenta|autob[uú]s|andando|voy\s+sol[oa]|vamos\s+sol[oa]s|no\s+necesita\s+acompa[ñn]ante|no\s+hace\s+falta\s+que\s+(?:me|nos)\s+(?:llev[eé]is|acompa[ñn][eé]is))/i.test(subT);
      const vueltaPorCuenta = /(?:vuelta|regreso|volver[aá]n?|volver[eé])\s+(?:.*?\s+)?(?:por\s+(?:nuestra|su|mi)\s+cuenta|sol[oa]s?|andando|en\s+autob[uú]s)/i.test(subT);

      let quienLleva = null;
      let quienRecoge = null;
      let noNecesitaAcompanante = false;

      // 1. Extraer familiares mencionados usando límites estrictos de palabra en español
      // (evitando que 'mañana' coincida con 'ana')
      const familiares = [];
      if (/(?:llevo\s+yo|yo\s+llevo|recojo\s+yo|yo\s+recojo|traigo\s+yo|yo\s+la\s+traigo|yo\s+le\s+traigo|acompa[ñn]o\s+yo|yo\s+acompa[ñn]o|yo\s+(?:le\s+|la\s+)?acerco|me\s+encargo\s+yo|yo\s+me\s+encargo)/i.test(subT)) {
        familiares.push({ nombre: autor, pos: subT.search(/\byo\b|\bllevo\b|\bacompa[ñn]o\b|\btraigo\b|\brecojo\b/) });
      }

      // Quitar 'juan de austria' para no confundir el centro de salud con Juan
      const tLimpio = subT.replace(/juan\s+de\s+austria/gi, '                 ');

      const aliasFamiliares = [
        { name: 'carmen', nombre: 'Carmen' },
        { name: 'mariuge', nombre: 'Tía Mariuge' },
        { name: 'rebeca', nombre: 'Rebeca' },
        { name: 'rebe', nombre: 'Rebeca' },
        { name: 'isaac', nombre: 'Isaac' },
        { name: 'isik', nombre: 'Isaac' },
        { name: 'monica', nombre: 'Mónica' },
        { name: 'mónica', nombre: 'Mónica' },
        { name: 'moni', nombre: 'Mónica' },
        { name: 'bartek', nombre: 'Bartek' },
        { name: 'juan', nombre: 'Juan' },
        { name: 'javier', nombre: 'Javier' },
        { name: 'javi', nombre: 'Javier' },
        { name: 'cristina', nombre: 'Cristina' },
        { name: 'cris', nombre: 'Cristina' },
        { name: 'teresa', nombre: 'Teresa' },
        { name: 'tere', nombre: 'Teresa' },
        { name: 'jorge', nombre: 'Jorge' },
        { name: 'carlos', nombre: 'Carlos' },
        { name: 'sofia', nombre: 'Sofía' },
        { name: 'sofía', nombre: 'Sofía' },
        { name: 'maría', nombre: 'María' },
        { name: 'maria', nombre: 'María' },
        { name: 'ana', nombre: 'Ana' },
        { name: 'david', nombre: 'David' },
        { name: 'elena', nombre: 'Elena' },
        { name: 'samuel', nombre: 'Samuel' },
        { name: 'paloma', nombre: 'Paloma' },
        { name: 'nieves', nombre: 'Nieves' },
        { name: 'lucyna', nombre: 'Lucyna' }
      ];

      for (const a of aliasFamiliares) {
        const rx = new RegExp('(?:^|[^a-záéíóúüñ])(' + a.name + ')(?:[^a-záéíóúüñ]|$)', 'i');
        const m = tLimpio.match(rx);
        if (m) {
          const idx = tLimpio.indexOf(m[1]);
          if (!familiares.some(f => f.nombre === a.nombre)) {
            familiares.push({ nombre: a.nombre, pos: idx });
          }
        }
      }

      for (const inte of integrantes) {
        if (['Papá (Jaime)', 'Mamá (Encarnación)'].includes(inte.nombre)) continue;
        const iname = (inte.nombre || '').toLowerCase();
        if (iname) {
          const rx = new RegExp('(?:^|[^a-záéíóúüñ])(' + iname + ')(?:[^a-záéíóúüñ]|$)', 'i');
          const m = tLimpio.match(rx);
          if (m && !familiares.some(f => f.nombre === inte.nombre)) {
            familiares.push({ nombre: inte.nombre, pos: tLimpio.indexOf(m[1]) });
          }
        }
      }

      familiares.sort((a, b) => a.pos - b.pos);

      // Ver si hay mención explícita a recogida o traer de vuelta
      const posRecoge = subT.search(/\b(?:recog|trae|traer|vuelta|regreso)\b/);
      if (posRecoge !== -1 && familiares.length > 0) {
        const antesRecoge = familiares.filter(f => f.pos < posRecoge);
        const despuesRecoge = familiares.filter(f => f.pos >= posRecoge);
        if (antesRecoge.length > 0) quienLleva = antesRecoge[0].nombre;
        if (despuesRecoge.length > 0) quienRecoge = despuesRecoge[0].nombre;
      } else if (familiares.length === 1) {
        quienLleva = familiares[0].nombre;
        quienRecoge = familiares[0].nombre;
      } else if (familiares.length >= 2) {
        quienLleva = familiares[0].nombre;
        quienRecoge = familiares[1].nombre;
      }

      // Fallback regex por si se menciona un nombre no catalogado
      if (!quienLleva && !esPorSusMedios) {
        const matchLlevaTercero = subTexto.match(/(?:nos|me|le|la)?\s*(?:lleva|acerca|acompa[ñn]a|trae|recoge)\s+([a-záéíóúñ]+)/i);
        if (matchLlevaTercero) {
          quienLleva = normalizarNombreFamiliar(matchLlevaTercero[1], integrantes, autor);
        }
      }

      if (vueltaPorCuenta) {
        quienRecoge = 'Por su cuenta';
      } else if (quienLleva && !quienRecoge && !esPorSusMedios) {
        quienRecoge = quienLleva;
      }

      if (esPorSusMedios && !quienLleva) {
        noNecesitaAcompanante = true;
        quienLleva = 'No necesita acompañante';
        quienRecoge = 'No necesita acompañante';
      }

      if (noNecesitaAcompanante || quienLleva || quienRecoge) {
        citasYaAsignadasIds.add(citaTarget.id);
        citasActualizadas.push({
          citaTarget,
          quienLleva,
          quienRecoge,
          noNecesitaAcompanante,
          subTexto
        });
      }
    }

    if (citasActualizadas.length > 0) {
      let bloquesTextoRespuesta = '';

      for (let i = 0; i < citasActualizadas.length; i++) {
        const item = citasActualizadas[i];
        const { citaTarget, quienLleva, quienRecoge, noNecesitaAcompanante, subTexto } = item;

        const updateData = {
          actualizadoPor: `${autor} (Telegram)`,
          actualizadoEl: new Date().toISOString()
        };

        if (noNecesitaAcompanante) {
          updateData.noNecesitaAcompanante = true;
          updateData.acompanante = 'No necesita acompañante (por sus propios medios)';
          updateData.quienLleva = 'No necesita acompañante';
          updateData.quienRecoge = 'No necesita acompañante';
          updateData.mismoConductorVuelta = true;
          updateData.notas = citaTarget.notas ? `${citaTarget.notas} | ${subTexto}` : subTexto;

          await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'citasMedicas', citaTarget.id), updateData);

          bloquesTextoRespuesta += `${citasActualizadas.length > 1 ? `\n<b>${i + 1}️⃣ ${citaTarget.especialidad.trim()}</b> (${citaTarget.hora || ''})\n` : `• <b>${citaTarget.paciente}</b>: Cita de <b>${citaTarget.especialidad.trim()}</b> (${citaTarget.hora || ''})\n`}  🚶 <i>No necesita acompañante</i>\n`;
        } else {
          const llevaFinal = quienLleva || citaTarget.quienLleva || 'Pendiente de asignar';
          const recogeFinal = quienRecoge || citaTarget.quienRecoge || llevaFinal;
          const mismo = llevaFinal === recogeFinal;

          updateData.quienLleva = llevaFinal;
          updateData.quienRecoge = recogeFinal;
          updateData.mismoConductorVuelta = mismo;
          updateData.noNecesitaAcompanante = false;
          updateData.acompanante = mismo ? llevaFinal : `${llevaFinal} (ida) / ${recogeFinal} (vuelta)`;
          updateData.notas = citaTarget.notas ? `${citaTarget.notas} | ${subTexto}` : subTexto;

          await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'citasMedicas', citaTarget.id), updateData);

          if (citasActualizadas.length > 1) {
            bloquesTextoRespuesta += `\n<b>${i + 1}️⃣ ${citaTarget.especialidad.trim()}</b> a las <b>${citaTarget.hora || 'hora por definir'}</b>\n` +
              (mismo ? `• 🚗 <b>Acompaña:</b> <b>${llevaFinal}</b>\n` : `• 🚗 <b>Lleva (Ida):</b> <b>${llevaFinal}</b>\n• 🚙 <b>Recoge (Vuelta):</b> <b>${recogeFinal}</b>\n`);
          } else {
            bloquesTextoRespuesta += `• <b>${citaTarget.paciente}</b>: Cita de <b>${citaTarget.especialidad.trim()}</b>\n` +
              `• 📅 <b>${formatearFechaBonita(citaTarget.fecha)}</b> a las <b>${citaTarget.hora || '10:30'}</b>\n` +
              (citaTarget.centro ? `• 📍 ${citaTarget.centro}\n` : '') +
              (mismo ? `• 🚗 <b>Acompaña:</b> <b>${llevaFinal}</b>\n` : `• 🚗 <b>Lleva (Ida):</b> <b>${llevaFinal}</b>\n• 🚙 <b>Recoge (Vuelta):</b> <b>${recogeFinal}</b>\n`);
          }
        }
      }

      await setMessageReactionTelegram(chatId, messageId, '👍');
      await enviarRespuestaTelegram(
        chatId,
        `🏥 ✅ ¡Anotado, <b>${autor}</b>!\n\n` +
        `He actualizado ${citasActualizadas.length > 1 ? 'las citas médicas' : 'la cita médica'} en FamilyApp:\n` +
        bloquesTextoRespuesta +
        `\n👉 <a href="https://familiabarnuevoapp.web.app/?tab=citas">Ver citas en FamilyApp</a>`,
        messageId
      );

      return { tipo: 'citas_multiples', total: citasActualizadas.length };
    }
  }

  return null;
}

export default async function handler(req, res) {
  // Manejo de peticiones GET de prueba/health check o ejecución de CRON
  if (req.method === 'GET') {
    const isCron = req.query?.cron === 'daily' || (req.url && req.url.includes('cron=daily'));
    if (isCron) {
      try {
        const resultado = await runDailyDigest(false);
        return res.status(200).json({ ok: true, cron: 'daily', resultado });
      } catch (cronErr) {
        console.error('Error ejecutando cron daily:', cronErr);
        return res.status(500).json({ ok: false, error: cronErr.message });
      }
    }
    return res.status(200).json({ ok: true, message: 'FamilyApp Telegram Webhook activo y listo' });
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Método no permitido');
  }

  const update = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!update) {
    return res.status(200).json({ ok: true, ignored: 'Empty update' });
  }

  // Manejar clics en botones de confirmación (RSVP o ubicación) en Telegram
  if (update.callback_query) {
    try {
      await procesarCallbackQuery(update.callback_query);
      return res.status(200).json({ ok: true, type: 'callback_query_processed' });
    } catch (cbErr) {
      console.error('Error procesando callback_query:', cbErr);
      return res.status(200).json({ ok: false, error: cbErr.message });
    }
  }

  // Manejar respuestas/votos a encuestas de Telegram automáticamente
  if (update.poll_answer) {
    try {
      await procesarVotoEncuesta(update.poll_answer);
      return res.status(200).json({ ok: true, type: 'poll_answer_processed' });
    } catch (pollErr) {
      console.error('Error procesando poll_answer:', pollErr);
      return res.status(200).json({ ok: false, error: pollErr.message });
    }
  }

  if (!update.message) {
    return res.status(200).json({ ok: true, ignored: 'No message update' });
  }

  const msg = update.message;
  const chatId = msg.chat?.id;
  const texto = (msg.text || '').trim();
  const messageId = msg.message_id;

  if (!chatId || !texto) {
    return res.status(200).json({ ok: true, ignored: 'No text or chatId' });
  }

  // Procesar mensajes en lenguaje natural del grupo (citas, traslados, ubicación, barbacoas)
  if (!texto.startsWith('/')) {
    try {
      const resNatural = await procesarMensajeNaturalGrupo(msg, chatId, texto, messageId);
      if (resNatural) {
        return res.status(200).json({ ok: true, natural: resNatural });
      }
    } catch (errNatural) {
      console.error('Error procesando mensaje natural del grupo:', errNatural);
    }
    return res.status(200).json({ ok: true, ignored: 'Regular message or no action needed' });
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
          `🏡 <b>/ubicacion</b> — Ver o cambiar dónde están Papá y Mamá (Alcalá / Madrid)\n` +
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

      case '/ubicacion':
      case '/esgaravita':
      case '/alcala':
      case '/madrid': {
        const arg = texto.toLowerCase();
        const autor = msg.from?.first_name || msg.from?.username || 'Telegram';
        if (comando === '/madrid' || arg.includes('madrid')) {
          await guardarUbicacionManualFirestore('Madrid', `${autor} (Telegram)`);
          await enviarRespuestaTelegram(chatId, `🏡 ✅ Ubicación de Papá y Mamá fijada en: <b>Madrid 🏢</b>`, messageId);
        } else if (comando === '/esgaravita' || comando === '/alcala' || arg.includes('alcala') || arg.includes('alcalá') || arg.includes('esgaravita')) {
          await guardarUbicacionManualFirestore('Alcalá (Esgaravita)', `${autor} (Telegram)`);
          await enviarRespuestaTelegram(chatId, `🏡 ✅ Ubicación de Papá y Mamá fijada en: <b>Alcalá (Esgaravita) 🌿</b>`, messageId);
        } else {
          const { ubicacionPadres } = await obtenerDatosFirestore();
          const btnMarkup = {
            inline_keyboard: [
              [
                { text: "🌿 Están en Esgaravita", callback_data: "ubicacion:alcala" },
                { text: "🏢 Están en Madrid", callback_data: "ubicacion:madrid" }
              ]
            ]
          };
          await enviarRespuestaTelegram(
            chatId,
            `🏡 <b>Ubicación actual de Papá y Mamá:</b> <b>${ubicacionPadres}</b>\n\n👇 Toca un botón si deseas cambiarla:`,
            messageId,
            btnMarkup
          );
        }
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
        const { trasladosPadres, ubicacionPadres } = await obtenerDatosFirestore();
        const trasladosPendientes = trasladosPadres
          .filter(t => t.estado !== 'realizado' && t.fecha && t.fecha >= hoyIso)
          .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.hora || '').localeCompare(b.hora || ''))
          .slice(0, 6);

        if (trasladosPendientes.length === 0) {
          const resp = `🚗 <b>Traslados de los Padres</b>\n\n` +
            `🏡 <b>Ubicación actual:</b> <b>${ubicacionPadres}</b>\n\n` +
            `✅ ¡No hay traslados pendientes programados actualmente!\n\n` +
            `👉 <a href="https://familiabarnuevoapp.web.app">Planificar viaje en FamilyApp</a>`;
          await enviarRespuestaTelegram(chatId, resp, messageId);
          break;
        }

        let resp = `🚗 <b>Traslados de los Padres</b>\n` +
          `🏡 <b>Ubicación actual:</b> <b>${ubicacionPadres}</b>\n\n` +
          `<b>Próximos traslados programados (${trasladosPendientes.length}):</b>\n\n`;
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
        const { citasMedicas, trasladosPadres, cumpleanos, integrantes, eventos, vacaciones, ubicacionPadres } = await obtenerDatosFirestore();

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

        const cumplesHoy = [];
        const cumplesVistos = new Set();
        cumpleanos.forEach(c => {
          if (!c.fecha || !c.fecha.includes('-')) return;
          if (!esMiembroActivoValido(c.nombre, integrantes)) return;
          const parts = c.fecha.split('-');
          const m = parts.length === 3 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
          const d = parts.length === 3 ? parseInt(parts[2], 10) : parseInt(parts[1], 10);
          if (m === hMes && d === hDia) {
            const norm = (c.nombre || '').toLowerCase().split('(')[0].trim();
            if (!cumplesVistos.has(norm)) {
              cumplesVistos.add(norm);
              cumplesHoy.push(c);
            }
          }
        });

        const santosHoy = [];
        const santosVistos = new Set();
        integrantes.forEach(i => {
          if (!esMiembroActivoValido(i.nombre, integrantes)) return;
          const norm = (i.nombre || '').toLowerCase().split('(')[0].trim();
          if (i.santo && matchesSaintDate(i.santo, hoyObj) && !santosVistos.has(norm)) {
            santosVistos.add(norm);
            santosHoy.push(i.nombre);
          }
        });
        cumpleanos.forEach(c => {
          if (!esMiembroActivoValido(c.nombre, integrantes)) return;
          const norm = (c.nombre || '').toLowerCase().split('(')[0].trim();
          if (c.santo && matchesSaintDate(c.santo, hoyObj) && !santosVistos.has(norm)) {
            santosVistos.add(norm);
            santosHoy.push(c.nombre);
          }
        });

        let resp = `☀️ <b>Previsión para HOY (${formatearFechaBonita(hoyIso)}):</b>\n` +
          `🏡 <b>Ubicación de Papá y Mamá:</b> <b>${ubicacionPadres}</b>\n\n`;

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
          if (!esMiembroActivoValido(i.nombre, integrantes)) return;
          const baseKey = (i.nombre || '').toLowerCase().split('(')[0].trim();
          if (i.santo && !nombresVistos.has(baseKey)) {
            todosMiembrosYSantos.push({ nombre: i.nombre, santo: i.santo });
            nombresVistos.add(baseKey);
          }
        });
        cumpleanos.forEach(c => {
          if (!esMiembroActivoValido(c.nombre, integrantes)) return;
          const baseKey = (c.nombre || '').toLowerCase().split('(')[0].trim();
          if (c.santo && !nombresVistos.has(baseKey)) {
            todosMiembrosYSantos.push({ nombre: c.nombre, santo: c.santo });
            nombresVistos.add(baseKey);
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
