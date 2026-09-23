import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCPc3BTDzRFts7TJYhEbrFjZ-fre5nsmXQ",
  authDomain: "familiabarnuevoapp.firebaseapp.com",
  projectId: "familiabarnuevoapp",
  storageBucket: "familiabarnuevoapp.firebasestorage.app",
  messagingSenderId: "202440118958",
  appId: "1:202440118958:web:db654e234f9dee1861d33f"
};

const TELEGRAM_BOT_TOKEN = '8563679097:AAFit3k4k38GYIeFCJCAsdT9vVz2ylToi6E';
const TELEGRAM_CHAT_ID = '-1004328933116'; // Grupo Laos
const APP_ID = 'family-app-cloud';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

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

async function enviarMensajeTelegram(texto) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: texto,
      parse_mode: 'HTML'
    })
  });
  const data = await res.json();
  return data && data.ok;
}

export async function runDailyDigest(force = false) {
  console.log(`[${new Date().toISOString()}] Iniciando comprobación matutina de FamilyApp...`);

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInAnonymously(auth);
  console.log("Sesión anónima iniciada en Firebase.");

  const hoyIso = getFechaHoySpain();
  const [hAno, hMes, hDia] = hoyIso.split('-').map(Number);
  const hoyObj = new Date(hAno, hMes - 1, hDia);

  console.log(`Fecha evaluada (Madrid): ${hoyIso} (Día: ${hDia}, Mes: ${hMes})`);

  // Salvaguarda horaria: No enviar antes de las 07:00 AM hora de España
  const partsHora = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    hour: 'numeric',
    hour12: false
  }).formatToParts(new Date()).find(p => p.type === 'hour')?.value;
  const horaMadrid = parseInt(partsHora, 10);

  if (!force && horaMadrid < 7) {
    console.log(`[Hora en Madrid: ${horaMadrid}:00] Es antes de las 07:00 AM. No se envía el aviso para no molestar a horas intempestivas.`);
    return { enviado: false, motivo: 'demasiado_temprano_antes_de_las_7' };
  }

  // Comprobar si ya se envió hoy
  if (!force) {
    try {
      const digestRef = doc(db, 'artifacts', APP_ID, 'public', 'telegram_digest');
      const snap = await getDoc(digestRef);
      if (snap.exists() && snap.data()?.fecha === hoyIso) {
        console.log(`El aviso de hoy (${hoyIso}) ya fue enviado previamente. Finalizando sin duplicar.`);
        return { enviado: false, motivo: 'ya_enviado_hoy' };
      }
    } catch (e) {
      console.warn("No se pudo leer telegram_digest:", e.message);
    }
  }

  // 1. Obtener datos de Firestore
  const colCumples = collection(db, 'artifacts', APP_ID, 'public', 'data', 'cumpleanos');
  const colMiembros = collection(db, 'artifacts', APP_ID, 'public', 'data', 'miembros');
  const colEventos = collection(db, 'artifacts', APP_ID, 'public', 'data', 'eventos');
  const colCitas = collection(db, 'artifacts', APP_ID, 'public', 'data', 'citasMedicas');
  const colTraslados = collection(db, 'artifacts', APP_ID, 'public', 'data', 'trasladosPadres');
  const colVacaciones = collection(db, 'artifacts', APP_ID, 'public', 'data', 'vacaciones');
  const docUbicacion = doc(db, 'artifacts', APP_ID, 'public', 'config_ubicacion_padres');

  const [snapCumples, snapMiembros, snapEventos, snapCitas, snapTraslados, snapVacaciones, snapUbicacion] = await Promise.all([
    getDocs(colCumples),
    getDocs(colMiembros),
    getDocs(colEventos),
    getDocs(colCitas),
    getDocs(colTraslados),
    getDocs(colVacaciones),
    getDoc(docUbicacion)
  ]);

  const cumpleanos = snapCumples.docs.map(d => ({ id: d.id, ...d.data() }));
  const integrantes = snapMiembros.docs.map(d => ({ id: d.id, ...d.data() }));
  const eventos = snapEventos.docs.map(d => ({ id: d.id, ...d.data() }));
  const citasMedicas = snapCitas.docs.map(d => ({ id: d.id, ...d.data() }));
  const trasladosPadres = snapTraslados.docs.map(d => ({ id: d.id, ...d.data() }));
  const vacaciones = snapVacaciones.docs.map(d => ({ id: d.id, ...d.data() }));
  const ubicacionPadres = (snapUbicacion && snapUbicacion.exists() && snapUbicacion.data()?.ubicacion)
    ? snapUbicacion.data().ubicacion
    : 'Alcalá (Esgaravita)';

  // 2. Filtrar celebraciones y avisos de hoy y mañana
  const cumplesDeHoy = cumpleanos.filter(c => {
    if (!c.fecha || !c.fecha.includes('-')) return false;
    const parts = c.fecha.split('-');
    const m = parts.length === 3 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
    const d = parts.length === 3 ? parseInt(parts[2], 10) : parseInt(parts[1], 10);
    return m === hMes && d === hDia;
  });

  const santosDeHoy = [];
  integrantes.forEach(i => {
    if (i.santo && matchesSaintDate(i.santo, hoyObj)) {
      santosDeHoy.push({ nombre: i.nombre, santo: i.santo });
    }
  });
  cumpleanos.forEach(c => {
    if (c.santo && matchesSaintDate(c.santo, hoyObj) && !santosDeHoy.some(s => s.nombre === c.nombre)) {
      santosDeHoy.push({ nombre: c.nombre, santo: c.santo });
    }
  });

  const trasladosProximos = trasladosPadres.filter(t => {
    if (!t.fecha || t.estado === 'realizado') return false;
    const diffDias = Math.round((new Date(t.fecha).getTime() - new Date(hoyIso).getTime()) / (1000 * 60 * 60 * 24));
    return diffDias >= 0 && diffDias <= 1;
  });

  const citasProximas = citasMedicas.filter(c => {
    if (!c.fecha || c.estado === 'completada') return false;
    const diffDias = Math.round((new Date(c.fecha).getTime() - new Date(hoyIso).getTime()) / (1000 * 60 * 60 * 24));
    return diffDias >= 0 && diffDias <= 1;
  });

  const eventosProximos = eventos.filter(e => {
    if (!e.fecha) return false;
    const diffDias = Math.round((new Date(e.fecha).getTime() - new Date(hoyIso).getTime()) / (1000 * 60 * 60 * 24));
    return diffDias >= 0 && diffDias <= 1;
  });

  const hayAvisos = cumplesDeHoy.length > 0 || santosDeHoy.length > 0 || trasladosProximos.length > 0 || citasProximas.length > 0 || eventosProximos.length > 0;

  if (!hayAvisos) {
    console.log("Hoy no hay cumpleaños, santos, traslados ni citas programadas. No se envía mensaje.");
    return { enviado: false, motivo: 'sin_eventos_hoy' };
  }

  function normalizarHora(hora, momentoDia) {
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
  }

  // Agrupar y ordenar cronológicamente
  const itemsAgenda = [];

  trasladosProximos.forEach(t => {
    const esHoy = t.fecha === hoyIso;
    itemsAgenda.push({
      tipo: 'traslado',
      esHoy,
      horaSort: normalizarHora(t.hora, t.momentoDia),
      data: t
    });
  });

  citasProximas.forEach(c => {
    const esHoy = c.fecha === hoyIso;
    itemsAgenda.push({
      tipo: 'cita',
      esHoy,
      horaSort: normalizarHora(c.hora),
      data: c
    });
  });

  eventosProximos.forEach(e => {
    const esHoy = e.fecha === hoyIso;
    itemsAgenda.push({
      tipo: 'evento',
      esHoy,
      horaSort: normalizarHora(e.hora),
      data: e
    });
  });

  const itemsHoy = itemsAgenda.filter(i => i.esHoy).sort((a, b) => a.horaSort.localeCompare(b.horaSort));
  const itemsManana = itemsAgenda.filter(i => !i.esHoy).sort((a, b) => a.horaSort.localeCompare(b.horaSort));

  function renderItem(item) {
    let out = '';
    const esHoy = item.esHoy;
    const tagDia = esHoy ? 'HOY' : 'MAÑANA';

    if (item.tipo === 'cita') {
      const c = item.data;
      const horaTxt = c.hora ? ` a las <b>${c.hora}</b>` : '';
      const tieneDetalle = c.quienLleva && c.quienRecoge && c.quienLleva !== c.quienRecoge;
      let textoLlevaRecoge = '';
      if (c.noNecesitaAcompanante || c.acompanante === 'No necesita acompañante') {
        textoLlevaRecoge = `• 🚶 <i>No necesita acompañante (va solo/a)</i>\n`;
      } else if (tieneDetalle) {
        textoLlevaRecoge = `• 🚗 Lleva (Ida): <b>${c.quienLleva}</b>\n• 🚙 Recoge (Vuelta): <b>${c.quienRecoge}</b>\n`;
      } else {
        const persona = c.quienLleva || c.acompanante;
        const tiene = persona && persona !== 'Pendiente de asignar';
        textoLlevaRecoge = `• 🚗 Acompaña: <b>${tiene ? persona : '⚠️ ¡Pendiente de asignar!'}</b>\n`;
      }

      out += `🏥 <b>Cita Médica ${tagDia}:</b>\n`;
      out += `• <b>${c.paciente || 'Papá (Jaime)'}</b> tiene cita de <b>${c.especialidad || 'Consulta'}</b>${horaTxt}` + (c.centro ? ` en ${c.centro}` : '') + `.\n`;
      out += textoLlevaRecoge;
      if (c.notas) out += `• 📋 <i>${c.notas}</i>\n`;
      out += '\n';
    } else if (item.tipo === 'traslado') {
      const t = item.data;
      const horaTxt = t.hora ? ` (${t.hora})` : (t.momentoDia ? ` (${t.momentoDia})` : '');
      const sinConductor = !t.conductor || t.conductor === 'Pendiente de asignar';

      out += `🚗 <b>Traslado de los Padres ${tagDia}:</b>\n`;
      out += `• <b>${t.origen} ➔ ${t.destino}</b>${horaTxt}\n`;
      out += `• 👤 Conductor: <b>${sinConductor ? '⚠️ ¡Pendiente de conductor!' : t.conductor}</b>\n`;
      if (t.opciones && t.opciones.length > 1) {
        out += `• 💡 <i>Opciones:</i> ` + t.opciones.map(o => `${o.conductor} (${o.hora})${o.esElegida ? ' ⭐' : ''}`).join(', ') + `\n`;
      }
      if (t.notas) out += `• 📋 <i>${t.notas}</i>\n`;
      out += '\n';
    } else if (item.tipo === 'evento') {
      const e = item.data;
      out += `📅 <b>Recordatorio:</b> ${esHoy ? '¡Hoy' : '¡Mañana'} tenemos <b>${e.titulo}</b>${e.hora ? ` (${e.hora})` : ''}` + (e.lugar ? ` en ${e.lugar}` : '') + `!\n\n`;
    }

    return out;
  }

  // 3. Construir mensaje
  let msg = `☀️ <b>¡Buenos días Familia Barnuevo!</b>\n\n`;
  msg += `🏡 <b>Ubicación de Papá y Mamá:</b> <b>${ubicacionPadres}</b>\n\n`;

  if (cumplesDeHoy.length > 0) {
    cumplesDeHoy.forEach(c => {
      const miembro = integrantes.find(i => i.nombre?.toLowerCase().trim() === c.nombre?.toLowerCase().trim());
      let edadTxt = '';
      if (miembro && miembro.fechaNacimiento) {
        const anoNac = parseInt(miembro.fechaNacimiento.split('-')[0], 10);
        if (!isNaN(anoNac)) {
          const edad = hAno - anoNac;
          edadTxt = ` (¡Cumple <b>${edad} años</b>! 🎈)`;
        }
      }
      msg += `🎂 <b>¡Hoy es el cumpleaños de ${c.nombre}!</b>${edadTxt} 🎉 ¡Muchísimas felicidades!\n`;
    });
    msg += '\n';
  }

  if (santosDeHoy.length > 0) {
    santosDeHoy.forEach(s => {
      msg += `✨ <b>¡Hoy es el Santo de ${s.nombre}!</b> (${s.santo}) ¡A felicitarle! 🎊\n`;
    });
    msg += '\n';
  }

  // Primero lo de HOY por estricto orden horario
  if (itemsHoy.length > 0) {
    itemsHoy.forEach(item => {
      msg += renderItem(item);
    });
  }

  // Luego la previsión de MAÑANA por orden horario
  if (itemsManana.length > 0) {
    itemsManana.forEach(item => {
      msg += renderItem(item);
    });
  }

  // Avisos de Vacaciones
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
      msg += `🏖️ <b>¡Vacaciones Próximas!</b> ${cuando} comienzan las vacaciones en <b>${v.lugar}</b> (${quienes}).\n`;
      if (v.nota) msg += `• 📝 <i>"${v.nota}"</i>\n`;
      msg += '\n';
    });
  }

  if (vacsActivas.length > 0) {
    vacsActivas.forEach(v => {
      const quienes = v.quienes && v.quienes.length > 0 ? v.quienes.join(', ') : 'La familia';
      msg += `🌴 <b>¡Actualmente de Vacaciones!</b> En <b>${v.lugar}</b> (${quienes}).\n\n`;
    });
  }

  msg += `👉 <a href="https://familiabarnuevoapp.web.app">Abrir App Familiar</a>`;

  console.log("Enviando mensaje a Telegram:\n", msg);
  const ok = await enviarMensajeTelegram(msg);

  if (ok) {
    console.log("✅ Mensaje enviado a Telegram con éxito.");
    // Guardar marca de fecha en Firestore para deduplicación
    try {
      const digestRef = doc(db, 'artifacts', APP_ID, 'public', 'telegram_digest');
      await setDoc(digestRef, { fecha: hoyIso, enviadoEl: new Date().toISOString(), enviadoPor: 'cron-service' });
      console.log("Marca de digest guardada en Firestore.");
    } catch (e) {
      console.warn("No se pudo guardar digest en Firestore:", e.message);
    }
    return { enviado: true, fecha: hoyIso };
  } else {
    console.error("❌ Fallo al enviar mensaje a Telegram.");
    return { enviado: false, error: 'telegram_api_error' };
  }
}

// Si se ejecuta directamente desde línea de comandos
if (process.argv[1] && process.argv[1].endsWith('telegram_daily_cron.mjs')) {
  const forceFlag = process.argv.includes('--force');
  runDailyDigest(forceFlag)
    .then(res => {
      console.log("Resultado:", res);
      process.exit(0);
    })
    .catch(err => {
      console.error("Error fatal:", err);
      process.exit(1);
    });
}
