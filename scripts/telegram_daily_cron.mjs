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

  const [snapCumples, snapMiembros, snapEventos, snapCitas, snapTraslados] = await Promise.all([
    getDocs(colCumples),
    getDocs(colMiembros),
    getDocs(colEventos),
    getDocs(colCitas),
    getDocs(colTraslados)
  ]);

  const cumpleanos = snapCumples.docs.map(d => ({ id: d.id, ...d.data() }));
  const integrantes = snapMiembros.docs.map(d => ({ id: d.id, ...d.data() }));
  const eventos = snapEventos.docs.map(d => ({ id: d.id, ...d.data() }));
  const citasMedicas = snapCitas.docs.map(d => ({ id: d.id, ...d.data() }));
  const trasladosPadres = snapTraslados.docs.map(d => ({ id: d.id, ...d.data() }));

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

  // 3. Construir mensaje
  let msg = `☀️ <b>¡Buenos días Familia Barnuevo!</b>\n\n`;

  if (trasladosProximos.length > 0) {
    trasladosProximos.forEach(t => {
      const esHoy = t.fecha === hoyIso;
      msg += `🚗 <b>Traslado de los Padres ${esHoy ? 'HOY' : 'MAÑANA'}:</b>\n`;
      msg += `• <b>${t.origen} ➔ ${t.destino}</b> (${t.hora || t.momentoDia || 'Horario a concretar'})\n`;
      msg += `• 👤 Conductor: <b>${t.conductor && t.conductor !== 'Pendiente de asignar' ? t.conductor : '⚠️ ¡Pendiente de conductor!'}</b>\n`;
      if (t.notas) msg += `• 📋 <i>${t.notas}</i>\n`;
      msg += '\n';
    });
  }

  if (citasProximas.length > 0) {
    citasProximas.forEach(c => {
      const esHoy = c.fecha === hoyIso;
      msg += `🏥 <b>Cita Médica ${esHoy ? 'HOY' : 'MAÑANA'}:</b>\n`;
      msg += `• <b>${c.paciente}</b> tiene cita de <b>${c.especialidad}</b> a las <b>${c.hora || 'hora por confirmar'}</b> en ${c.centro}.\n`;
      msg += `• 🚗 Acompaña: <b>${c.acompanante && c.acompanante !== 'Pendiente de asignar' ? c.acompanante : '⚠️ ¡Pendiente de asignar!'}</b>\n`;
      if (c.notas) msg += `• 📋 <i>${c.notas}</i>\n`;
      msg += '\n';
    });
  }

  if (cumplesDeHoy.length > 0) {
    cumplesDeHoy.forEach(c => {
      msg += `🎂 <b>¡Hoy es el cumpleaños de ${c.nombre}!</b> 🎉 ¡Muchísimas felicidades!\n`;
    });
    msg += '\n';
  }

  if (santosDeHoy.length > 0) {
    santosDeHoy.forEach(s => {
      msg += `✨ <b>¡Hoy es el Santo de ${s.nombre}!</b> (${s.santo}) ¡A felicitarle! 🎊\n`;
    });
    msg += '\n';
  }

  if (eventosProximos.length > 0) {
    eventosProximos.forEach(e => {
      const esHoy = e.fecha === hoyIso;
      msg += `📅 <b>Recordatorio:</b> ${esHoy ? '¡Hoy' : '¡Mañana'} tenemos <b>${e.titulo}</b> (${e.hora || ''}) en ${e.lugar}!\n`;
    });
    msg += '\n';
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
