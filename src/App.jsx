import React, { useState, useEffect, useMemo, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  getDoc,
  setDoc
} from 'firebase/firestore';
import {
  Calendar as CalendarIcon,
  Users,
  MapPin,
  Gift,
  Plus,
  Trash2,
  Edit2,
  Check,
  MessageSquare,
  AlertCircle,
  Sparkles,
  Clock,
  Sun,
  Home,
  ChevronRight,
  ChevronLeft,
  Heart,
  UserPlus,
  Wifi,
  ExternalLink,
  Map,
  BellRing,
  XCircle,
  Baby,
  Smile,
  FileText,
  Printer,
  ChevronDown,
  BookOpen,
  Download,
  Activity,
  Stethoscope,
  HeartPulse,
  Car,
  ArrowRight,
  Navigation
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE EN LA NUBE CON SALVAGUARDA DE MODO LOCAL ---
const firebaseConfig = (typeof __firebase_config !== 'undefined' && __firebase_config) 
  ? JSON.parse(__firebase_config) 
  : (import.meta.env.VITE_FIREBASE_CONFIG 
      ? JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG)
      : (import.meta.env.VITE_FIREBASE_API_KEY 
          ? {
              apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
              authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
              projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
              storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
              messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
              appId: import.meta.env.VITE_FIREBASE_APP_ID
            }
          : {
              apiKey: "AIzaSyCPc3BTDzRFts7TJYhEbrFjZ-fre5nsmXQ",
              authDomain: "familiabarnuevoapp.firebaseapp.com",
              projectId: "familiabarnuevoapp",
              storageBucket: "familiabarnuevoapp.firebasestorage.app",
              messagingSenderId: "202440118958",
              appId: "1:202440118958:web:db654e234f9dee1861d33f"
            }
        )
    );


const isCloudMode = !!(firebaseConfig && firebaseConfig.apiKey);

let app, auth, db;
if (isCloudMode) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Error inicializando Firebase SDK:", error);
  }
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'family-app-cloud';

// Datos de semilla con Santos incorporados
const INTEGRANTES_PREDEFINIDOS = [
  { nombre: 'Encarnación', rol: 'Padres', santo: 'No especificado', email: null },
  { nombre: 'Jaime', rol: 'Padres', santo: 'No especificado', email: null },
  { nombre: 'Rebeca', rol: 'Hermanos', parejaDe: 'Bartek', santo: '30 de Agosto (Santa Rebeca)', email: null },
  { nombre: 'Isaac (Isik)', rol: 'Hermanos', parejaDe: 'Mónica', santo: '3 de Junio (San Isaac)', email: null },
  { nombre: 'Mónica', rol: 'Cuñados', parejaDe: 'Isaac (Isik)', santo: '27 de Agosto (Santa Mónica)', email: null },
  { nombre: 'María', rol: 'Hermanos', parejaDe: 'Bartek', santo: '12 de Septiembre (Dulce Nombre de María)', email: null },
  { nombre: 'Bartek', rol: 'Cuñados', parejaDe: 'María', santo: '24 de Agosto (San Bartolomé)', email: null },
  { nombre: 'Juan', rol: 'Hermanos', parejaDe: null, santo: '24 de junio', email: null, fechaNacimiento: '1985-06-25' },
  { nombre: 'Ana', rol: 'Hermanos', parejaDe: 'Javier', santo: 'No especificado', email: null },
  { nombre: 'Javier', rol: 'Cuñados', parejaDe: 'Ana', santo: '3 de Diciembre (San Francisco Javier)', email: null },
  { nombre: 'Cristina', rol: 'Hermanos', parejaDe: null, santo: 'No especificado', email: null },
  { nombre: 'Teresa', rol: 'Hermanos', parejaDe: null, santo: 'No especificado', email: null },
  { nombre: 'Jorge', rol: 'Cuñados', parejaDe: null, santo: 'No especificado', email: null },
  { nombre: 'Lucas', rol: 'Hijos', padres: ['Isaac (Isik)', 'Mónica'], padrinos: ['Rebeca'], santo: '18 de Octubre (San Lucas)', email: null },
  { nombre: 'Elena', rol: 'Hijos', padres: ['Rebeca', 'Bartek'], padrinos: ['Isaac (Isik)'], santo: '18 de Agosto (Santa Elena)', email: null },
  { nombre: 'David', rol: 'Hijos', padres: ['Ana', 'Javier'], padrinos: [], santo: 'No especificado', email: null, fechaNacimiento: '2020-01-02' },
  { nombre: 'Carmen', rol: 'Hijos', padres: ['Ana', 'Javier'], padrinos: [], santo: 'No especificado', email: null, fechaNacimiento: '2023-03-25' },
  { nombre: 'Nieves', rol: 'Hijos', padres: ['Ana', 'Javier'], padrinos: [], santo: '5 Agosto', email: null, fechaNacimiento: '2012-01-25' },
  { nombre: 'Miriam', rol: 'Hijos', padres: ['Ana', 'Javier'], padrinos: [], santo: '12 de Septiembre', email: null, fechaNacimiento: '2014-11-19' },
  { nombre: 'Jaime (Hijo)', rol: 'Hijos', padres: ['Ana', 'Javier'], padrinos: [], santo: '25 de Julio', email: null, fechaNacimiento: '2013-07-04' },
  { nombre: 'Francisco', rol: 'Hijos', padres: ['Ana', 'Javier'], padrinos: [], santo: '4 de Octubre (San Francisco de Asís)', email: null, fechaNacimiento: '2016-12-01' },
  { nombre: 'Tía Mariuge', rol: 'Tíos/Familiares', santo: 'No especificado', email: null }
];

const CUMPLEANOS_PREDEFINIDOS = [
  { nombre: 'Encarnación', fecha: '10-05', parentesco: 'Padres', santo: 'No especificado' },
  { nombre: 'Jaime', fecha: '05-19', parentesco: 'Padres', santo: 'No especificado' },
  { nombre: 'Rebeca', fecha: '09-15', parentesco: 'Hermana', santo: '30 de Agosto (Santa Rebeca)' },
  { nombre: 'Isaac (Isik)', fecha: '06-21', parentesco: 'Hermano', santo: '3 de Junio (San Isaac)' },
  { nombre: 'Mónica', fecha: '10-20', parentesco: 'Cuñada', santo: '27 de Agosto (Santa Mónica)' },
  { nombre: 'María', fecha: '10-22', parentesco: 'Hermana', santo: '12 de Septiembre (Dulce Nombre de María)' },
  { nombre: 'Bartek', fecha: '01-15', parentesco: 'Cuñado', santo: '24 de Agosto (San Bartolomé)' },
  { nombre: 'Juan', fecha: '06-25', parentesco: 'Hermano/a', santo: '24 de junio' },
  { nombre: 'Ana', fecha: '04-05', parentesco: 'Hermano/a', santo: 'No especificado' },
  { nombre: 'Javier', fecha: '12-03', parentesco: 'Cuñado/a', santo: '3 de Diciembre (San Francisco Javier)' },
  { nombre: 'Cristina', fecha: '08-15', parentesco: 'Hermano/a', santo: 'No especificado' },
  { nombre: 'Teresa', fecha: '03-12', parentesco: 'Hermano/a', santo: 'No especificado' },
  { nombre: 'Lucas', fecha: '05-12', parentesco: 'Sobrino/Hijo', santo: '18 de Octubre (San Lucas)' },
  { nombre: 'Elena', fecha: '08-20', parentesco: 'Sobrino/Hijo', santo: '18 de Agosto (Santa Elena)' },
  { nombre: 'David', fecha: '01-02', parentesco: 'Sobrino/Hijo', santo: 'No especificado' },
  { nombre: 'Carmen', fecha: '03-25', parentesco: 'Sobrino/Hijo', santo: 'No especificado' },
  { nombre: 'Nieves', fecha: '01-25', parentesco: 'Sobrino/Hijo', santo: '5 Agosto' },
  { nombre: 'Miriam', fecha: '11-19', parentesco: 'Sobrino/Hijo', santo: '12 de Septiembre' },
  { nombre: 'Jaime (Hijo)', fecha: '07-04', parentesco: 'Sobrino/Hijo', santo: '25 de Julio' },
  { nombre: 'Francisco', fecha: '12-01', parentesco: 'Sobrino/Hijo', santo: '4 de Octubre (San Francisco de Asís)' }
];

// --- FUNCIONES HELPER GLOBALES ---
const formatearFechaStr = (fechaStr) => {
  if (!fechaStr || typeof fechaStr !== 'string') return '';
  const partes = fechaStr.split('-');
  if (partes.length < 3) return fechaStr;
  const ano = partes[0];
  const mes = parseInt(partes[1], 10);
  const dia = parseInt(partes[2], 10);
  const meses = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  const mesNombre = meses[mes - 1] || 'Ene';
  return `${dia} ${mesNombre} ${ano}`;
};

const normalizarTexto = (txt) => {
  return (txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const getFechaHoyLocal = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
};

const matchesSaintDate = (santoStr, date) => {
  if (!santoStr || typeof santoStr !== 'string') return false;
  const cleanStr = normalizarTexto(santoStr);
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const regex = /(\d+)\s*(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i;
  const match = cleanStr.match(regex);
  if (match) {
    const dia = parseInt(match[1], 10);
    const mesNombre = match[2].toLowerCase();
    const mesIndex = meses.indexOf(mesNombre);
    return date.getDate() === dia && date.getMonth() === mesIndex;
  }
  return false;
};

const esHermano = (nombre) => {
  const norm = (nombre || '').toLowerCase().trim();
  return (
    norm.includes('rebeca') ||
    norm.includes('isaac') ||
    norm.includes('isik') ||
    norm.includes('maría') ||
    norm.includes('maria') ||
    norm.includes('ana') ||
    norm.includes('juan') ||
    norm.includes('teresa') ||
    norm.includes('cristina')
  );
};

const obtenerPaletaPlan = (idOrLugar) => {
  const str = String(idOrLugar || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 7;
  
  const paletas = [
    {
      // 0. Esmeralda
      cellBg: 'bg-emerald-100/35 text-emerald-950',
      borderClass: 'border-emerald-300',
      sitioColor: 'text-emerald-800',
      badgeHermano: 'bg-emerald-600 text-white border border-emerald-700 shadow-3xs',
      badgeCuñado: 'bg-emerald-100/75 text-emerald-900 border border-emerald-250 font-bold'
    },
    {
      // 1. Azul Cielo
      cellBg: 'bg-sky-100/35 text-sky-950',
      borderClass: 'border-sky-300',
      sitioColor: 'text-sky-850',
      badgeHermano: 'bg-sky-600 text-white border border-sky-700 shadow-3xs',
      badgeCuñado: 'bg-sky-100/75 text-sky-900 border border-sky-250 font-bold'
    },
    {
      // 2. Rosa / Fresa
      cellBg: 'bg-rose-100/35 text-rose-950',
      borderClass: 'border-rose-300',
      sitioColor: 'text-rose-850',
      badgeHermano: 'bg-rose-600 text-white border border-rose-700 shadow-3xs',
      badgeCuñado: 'bg-rose-100/75 text-rose-900 border border-rose-250 font-bold'
    },
    {
      // 3. Violeta
      cellBg: 'bg-violet-100/35 text-violet-950',
      borderClass: 'border-violet-300',
      sitioColor: 'text-violet-850',
      badgeHermano: 'bg-violet-600 text-white border border-violet-700 shadow-3xs',
      badgeCuñado: 'bg-violet-100/75 text-violet-900 border border-violet-250 font-bold'
    },
    {
      // 4. Coral / Naranja
      cellBg: 'bg-orange-100/35 text-orange-950',
      borderClass: 'border-orange-300',
      sitioColor: 'text-orange-850',
      badgeHermano: 'bg-orange-650 text-white border border-orange-750 shadow-3xs',
      badgeCuñado: 'bg-orange-100/75 text-orange-900 border border-orange-250 font-bold'
    },
    {
      // 5. Fucsia
      cellBg: 'bg-fuchsia-100/35 text-fuchsia-950',
      borderClass: 'border-fuchsia-300',
      sitioColor: 'text-fuchsia-850',
      badgeHermano: 'bg-fuchsia-600 text-white border border-fuchsia-700 shadow-3xs',
      badgeCuñado: 'bg-fuchsia-100/75 text-fuchsia-900 border border-fuchsia-250 font-bold'
    },
    {
      // 6. Ámbar / Oro
      cellBg: 'bg-amber-100/35 text-amber-950',
      borderClass: 'border-amber-300',
      sitioColor: 'text-amber-850',
      badgeHermano: 'bg-amber-600 text-white border border-amber-700 shadow-3xs',
      badgeCuñado: 'bg-amber-100/75 text-amber-900 border border-amber-250 font-bold'
    }
  ];

  return paletas[index];
};

const getInitialState = (key, seedData) => {
  const localData = localStorage.getItem(`family_app_${key}`);
  if (localData) {
    try {
      return JSON.parse(localData);
    } catch (e) {
      console.error(`Error leyendo localStorage para ${key}:`, e);
    }
  }
  return seedData;
};

const obtenerMesDiaSanto = (santoStr) => {
  if (!santoStr || typeof santoStr !== 'string') return null;
  const cleanStr = santoStr.toLowerCase().trim();
  if (cleanStr.includes('no especificado') || cleanStr.includes('no registrado')) return null;
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const regex = /(\d+)\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i;
  const match = cleanStr.match(regex);
  if (match) {
    const dia = parseInt(match[1], 10);
    const mesNombre = match[2].toLowerCase();
    const mesIndex = meses.indexOf(mesNombre);
    return { mes: mesIndex + 1, dia };
  }
  return null;
};

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const getSantoDia = (santoStr) => {
  const parsed = obtenerMesDiaSanto(santoStr);
  return parsed ? String(parsed.dia).padStart(2, '0') : '';
};

const getSantoMes = (santoStr) => {
  const parsed = obtenerMesDiaSanto(santoStr);
  return parsed ? String(parsed.mes).padStart(2, '0') : '';
};

const updateSantoFromDiaMes = (dia, mes) => {
  if (!dia && !mes) return '';
  const mesNum = parseInt(mes || '01', 10);
  const diaNum = parseInt(dia || '01', 10);
  const nombreMes = MESES_NOMBRES[mesNum - 1] || 'Enero';
  return `${diaNum} de ${nombreMes}`;
};

const calcularDiasRestantes = (mes, dia) => {
  const hoy = new Date();
  const hoyMes = hoy.getMonth() + 1;
  const hoyDia = hoy.getDate();
  let cumpleAno = hoy.getFullYear();
  if (mes < hoyMes || (mes === hoyMes && dia < hoyDia)) {
    cumpleAno += 1;
  }
  const fechaCel = new Date(cumpleAno, mes - 1, dia);
  const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const fechaCelMidnight = new Date(fechaCel.getFullYear(), fechaCel.getMonth(), fechaCel.getDate());
  return Math.round((fechaCelMidnight.getTime() - hoyMidnight.getTime()) / (1000 * 60 * 60 * 24));
};

// --- INTEGRACIÓN GOOGLE CALENDAR & .ICS ---
const getGoogleCalendarUrlForEvent = (evt) => {
  if (!evt || !evt.fecha) return '#';
  const title = encodeURIComponent(`Familiar: ${evt.titulo || 'Quedada'}`);
  const details = encodeURIComponent(
    `${evt.descripcion || ''}\n\nLugar: ${evt.lugar || ''}\nConfirmados: ${(evt.asistentes || []).join(', ') || 'Nadie aún'}`
  );
  const location = encodeURIComponent(evt.lugar || '');
  
  const cleanDate = evt.fecha.replace(/-/g, '');
  let datesParam = '';
  if (evt.hora && evt.hora.includes(':')) {
    const [hh, mm] = evt.hora.split(':');
    const startHour = hh.padStart(2, '0');
    const startMin = mm.padStart(2, '0');
    const endHour = String((parseInt(startHour, 10) + 3) % 24).padStart(2, '0');
    datesParam = `${cleanDate}T${startHour}${startMin}00/${cleanDate}T${endHour}${startMin}00`;
  } else {
    const nextDay = new Date(evt.fecha);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().slice(0, 10).replace(/-/g, '');
    datesParam = `${cleanDate}/${nextDayStr}`;
  }
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}&location=${location}`;
};

const getGoogleCalendarUrlForBirthday = (nombre, fechaMmDd) => {
  if (!fechaMmDd || !fechaMmDd.includes('-')) return '#';
  const [mesStr, diaStr] = fechaMmDd.split('-');
  const mm = mesStr.padStart(2, '0');
  const dd = diaStr.padStart(2, '0');
  const currentYear = new Date().getFullYear();
  const dateStart = `${currentYear}${mm}${dd}`;
  
  const nextDate = new Date(currentYear, parseInt(mm, 10) - 1, parseInt(dd, 10) + 1);
  const nextMm = String(nextDate.getMonth() + 1).padStart(2, '0');
  const nextDd = String(nextDate.getDate()).padStart(2, '0');
  const nextYy = nextDate.getFullYear();
  const dateEnd = `${nextYy}${nextMm}${nextDd}`;

  const title = encodeURIComponent(`🎂 Cumpleaños de ${nombre}`);
  const details = encodeURIComponent(`¡Hoy es el cumpleaños de ${nombre}! Celebración familiar Barnuevo.`);
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStart}/${dateEnd}&details=${details}&recur=RRULE:FREQ=YEARLY`;
};

const getGoogleCalendarUrlForSaint = (nombre, santoStr) => {
  const parsed = obtenerMesDiaSanto(santoStr);
  if (!parsed) return '#';
  const mm = String(parsed.mes).padStart(2, '0');
  const dd = String(parsed.dia).padStart(2, '0');
  const currentYear = new Date().getFullYear();
  const dateStart = `${currentYear}${mm}${dd}`;
  
  const nextDate = new Date(currentYear, parsed.mes - 1, parsed.dia + 1);
  const nextMm = String(nextDate.getMonth() + 1).padStart(2, '0');
  const nextDd = String(nextDate.getDate()).padStart(2, '0');
  const nextYy = nextDate.getFullYear();
  const dateEnd = `${nextYy}${nextMm}${nextDd}`;

  const title = encodeURIComponent(`✨ Santo de ${nombre}`);
  const details = encodeURIComponent(`¡Hoy es el Santo / Onomástica de ${nombre} (${santoStr})! Felicidades en familia.`);
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStart}/${dateEnd}&details=${details}&recur=RRULE:FREQ=YEARLY`;
};

const exportFamilyCalendarIcs = (cumples = [], eventos = []) => {
  const currentYear = new Date().getFullYear();
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Familia Barnuevo//Calendario Familiar//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Familia Barnuevo',
    'X-WR-TIMEZONE:Europe/Madrid'
  ];

  cumples.forEach((cum, i) => {
    if (cum.fecha && cum.fecha.includes('-')) {
      const [mesStr, diaStr] = cum.fecha.split('-');
      const mm = mesStr.padStart(2, '0');
      const dd = diaStr.padStart(2, '0');
      const dtStart = `${currentYear}${mm}${dd}`;
      
      const nextDate = new Date(currentYear, parseInt(mm, 10) - 1, parseInt(dd, 10) + 1);
      const nextMm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const nextDd = String(nextDate.getDate()).padStart(2, '0');
      const nextYy = nextDate.getFullYear();
      const dtEnd = `${nextYy}${nextMm}${nextDd}`;

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:cumple-${cum.id || i}-${currentYear}@familiabarnuevo.web.app`);
      icsContent.push(`DTSTAMP:${nowStamp}`);
      icsContent.push(`DTSTART;VALUE=DATE:${dtStart}`);
      icsContent.push(`DTEND;VALUE=DATE:${dtEnd}`);
      icsContent.push('RRULE:FREQ=YEARLY');
      icsContent.push(`SUMMARY:🎂 Cumpleaños de ${cum.nombre}`);
      icsContent.push(`DESCRIPTION:¡Cumpleaños de ${cum.nombre}! Familia Barnuevo.`);
      icsContent.push('END:VEVENT');
    }

    if (cum.santo && cum.santo !== 'No registrado' && !cum.santo.toLowerCase().includes('no especificado')) {
      const parsed = obtenerMesDiaSanto(cum.santo);
      if (parsed) {
        const mm = String(parsed.mes).padStart(2, '0');
        const dd = String(parsed.dia).padStart(2, '0');
        const dtStart = `${currentYear}${mm}${dd}`;
        
        const nextDate = new Date(currentYear, parsed.mes - 1, parsed.dia + 1);
        const nextMm = String(nextDate.getMonth() + 1).padStart(2, '0');
        const nextDd = String(nextDate.getDate()).padStart(2, '0');
        const nextYy = nextDate.getFullYear();
        const dtEnd = `${nextYy}${nextMm}${nextDd}`;

        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:santo-${cum.id || i}-${currentYear}@familiabarnuevo.web.app`);
        icsContent.push(`DTSTAMP:${nowStamp}`);
        icsContent.push(`DTSTART;VALUE=DATE:${dtStart}`);
        icsContent.push(`DTEND;VALUE=DATE:${dtEnd}`);
        icsContent.push('RRULE:FREQ=YEARLY');
        icsContent.push(`SUMMARY:✨ Santo de ${cum.nombre}`);
        icsContent.push(`DESCRIPTION:Onomástica de ${cum.nombre} (${cum.santo}). Familia Barnuevo.`);
        icsContent.push('END:VEVENT');
      }
    }
  });

  eventos.forEach((evt, i) => {
    if (evt.fecha) {
      const cleanDate = evt.fecha.replace(/-/g, '');
      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:evento-${evt.id || i}@familiabarnuevo.web.app`);
      icsContent.push(`DTSTAMP:${nowStamp}`);
      if (evt.hora && evt.hora.includes(':')) {
        const [hh, min] = evt.hora.split(':');
        const startH = hh.padStart(2, '0');
        const startM = min.padStart(2, '0');
        const endH = String((parseInt(startH, 10) + 3) % 24).padStart(2, '0');
        icsContent.push(`DTSTART:${cleanDate}T${startH}${startM}00`);
        icsContent.push(`DTEND:${cleanDate}T${endH}${startM}00`);
      } else {
        icsContent.push(`DTSTART;VALUE=DATE:${cleanDate}`);
        const nextDay = new Date(evt.fecha);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().slice(0, 10).replace(/-/g, '');
        icsContent.push(`DTEND;VALUE=DATE:${nextDayStr}`);
      }
      icsContent.push(`SUMMARY:🍖 ${evt.titulo}`);
      if (evt.lugar) icsContent.push(`LOCATION:${evt.lugar}`);
      if (evt.descripcion) icsContent.push(`DESCRIPTION:${evt.descripcion}`);
      icsContent.push('END:VEVENT');
    }
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'familia-barnuevo-agenda.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// --- INTEGRACIÓN BOT DE TELEGRAM ---
const TELEGRAM_BOT_TOKEN = '8563679097:AAFit3k4k38GYIeFCJCAsdT9vVz2ylToi6E';
const TELEGRAM_CHAT_ID = '-1004328933116';

const enviarMensajeTelegram = async (texto) => {
  try {
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
  } catch (err) {
    console.error('Error al enviar mensaje a Telegram:', err);
    return false;
  }
};

// --- PRESELECCIONES Y UTILIDADES PARA CITAS MÉDICAS ---
const CITAS_MEDICAS_PREDEFINIDAS = [
  {
    id: 'cit_1',
    paciente: 'Mamá (Encarnación)',
    especialidad: 'Médico de Cabecera (Revisión y Recetas)',
    medico: 'Dra. Carmen Navarro',
    centro: 'Centro de Salud',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Centro+de+Salud',
    fecha: '2026-09-15',
    hora: '10:30',
    acompanante: 'Pendiente de asignar',
    notas: 'Llevar la lista de medicamentos habituales para renovación de recetas.',
    estado: 'pendiente',
    creadoPor: 'Isaac (Isik)'
  },
  {
    id: 'cit_2',
    paciente: 'Papá (Jaime)',
    especialidad: 'Traumatología (Revisión Rodilla)',
    medico: 'Dr. Fernando Martínez',
    centro: 'Hospital General',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Hospital+General',
    fecha: '2026-09-22',
    hora: '11:15',
    acompanante: 'Jaime',
    notas: 'Llevar las radiografías anteriores que están en el sobre azul del salón.',
    estado: 'pendiente',
    creadoPor: 'Jaime'
  }
];

const generateGoogleCalendarUrlForCita = (cita) => {
  if (!cita || !cita.fecha) return '#';
  const cleanFecha = cita.fecha.replace(/-/g, '');
  let horaStr = cita.hora || '10:00';
  if (!horaStr.includes(':')) horaStr = '10:00';
  const [h, m] = horaStr.split(':');
  const startH = h.padStart(2, '0');
  const startM = m.padStart(2, '0');
  const endH = String((parseInt(startH, 10) + 1) % 24).padStart(2, '0');

  const startDateTime = `${cleanFecha}T${startH}${startM}00`;
  const endDateTime = `${cleanFecha}T${endH}${startM}00`;

  const title = encodeURIComponent(`🩺 Cita Médica: ${cita.paciente} (${cita.especialidad})`);
  const details = encodeURIComponent(
    `Paciente: ${cita.paciente}\n` +
    `Especialidad: ${cita.especialidad}\n` +
    `Doctor/a: ${cita.medico || 'No especificado'}\n` +
    `Centro: ${cita.centro}\n` +
    `Acompaña: ${cita.acompanante || 'Pendiente de asignar'}\n` +
    `Notas: ${cita.notas || 'Ninguna'}\n\n` +
    `Sincronizado desde FamilyApp 🏠`
  );
  const location = encodeURIComponent(cita.centro || '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`;
};

// --- PRESELECCIONES Y UTILIDADES PARA TRASLADOS DE LOS PADRES ---
const TRASLADOS_PADRES_PREDEFINIDOS = [
  {
    id: 'tras_1',
    origen: 'Madrid',
    destino: 'Alcalá (Esgaravita)',
    fecha: '2026-09-13',
    hora: '18:00',
    momentoDia: 'Tarde',
    conductor: 'Juan',
    notas: 'Llevar a los padres a Esgaravita para pasar la semana.',
    estado: 'pendiente',
    creadoPor: 'Juan'
  },
  {
    id: 'tras_2',
    origen: 'Alcalá (Esgaravita)',
    destino: 'Madrid',
    fecha: '2026-09-15',
    hora: '11:00',
    momentoDia: 'Mañana',
    conductor: 'Rebeca',
    notas: 'Vuelta a Madrid para gestiones y compras.',
    estado: 'pendiente',
    creadoPor: 'Rebeca'
  },
  {
    id: 'tras_3',
    origen: 'Madrid',
    destino: 'Alcalá (Esgaravita)',
    fecha: '2026-09-17',
    hora: '17:30',
    momentoDia: 'Tarde',
    conductor: 'Rebeca',
    notas: 'Regreso a Esgaravita para el fin de semana.',
    estado: 'pendiente',
    creadoPor: 'Rebeca'
  },
  {
    id: 'tras_4',
    origen: 'Alcalá (Esgaravita)',
    destino: 'Madrid',
    fecha: '2026-09-23',
    hora: '12:00',
    momentoDia: 'Mediodía',
    conductor: 'Pendiente de asignar',
    notas: 'Retorno a Madrid tras unos días en Alcalá.',
    estado: 'pendiente',
    creadoPor: 'Isaac (Isik)'
  }
];

const generateGoogleCalendarUrlForTraslado = (traslado) => {
  if (!traslado || !traslado.fecha) return '#';
  const cleanFecha = traslado.fecha.replace(/-/g, '');
  let horaStr = traslado.hora || '18:00';
  if (!horaStr.includes(':')) horaStr = '18:00';
  const [h, m] = horaStr.split(':');
  const startH = h.padStart(2, '0');
  const startM = m.padStart(2, '0');
  const endH = String((parseInt(startH, 10) + 1) % 24).padStart(2, '0');

  const startDateTime = `${cleanFecha}T${startH}${startM}00`;
  const endDateTime = `${cleanFecha}T${endH}${startM}00`;

  const title = encodeURIComponent(`🚗 Traslado Padres: ${traslado.origen} ➔ ${traslado.destino}`);
  const details = encodeURIComponent(
    `Trayecto: ${traslado.origen} ➔ ${traslado.destino}\n` +
    `Fecha: ${traslado.fecha} (${traslado.momentoDia || ''})\n` +
    `Conductor: ${traslado.conductor || 'Pendiente de asignar'}\n` +
    `Notas: ${traslado.notas || 'Ninguna'}\n\n` +
    `Coordinado desde FamilyApp 🏠`
  );
  const location = encodeURIComponent(traslado.destino || '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`;
};

export default function App() {
  // --- ESTADOS DEL SISTEMA ---
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('inicio');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [isLocalMode, setIsLocalMode] = useState(!isCloudMode);

  // --- PERSPECTIVA DE USUARIO ACTIVO ("¿Quién eres tú?") ---
  const [usuarioActivo, setUsuarioActivo] = useState(() => {
    return localStorage.getItem('family_app_usuario_activo') || 'Isaac (Isik)';
  });
  const [matchedMember, setMatchedMember] = useState(null);
  const [bootstrapProfileName, setBootstrapProfileName] = useState('');
  const [showLinkAccountModal, setShowLinkAccountModal] = useState(false);

  // --- ESTADOS PARA EDITAR FAMILIAR ---
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingMemberOldNombre, setEditingMemberOldNombre] = useState('');
  const [editMemberForm, setEditMemberForm] = useState({
    nombreBase: '',
    pseudonimo: '',
    santo: '',
    rol: 'Hermanos',
    tipoFamiliar: 'Hermanos',
    parejaDe: '',
    padre1: '',
    padre2: '',
    padrinoMadrina: '',
    email: '',
    hijoAsociado: '',
    fechaNacimiento: ''
  });

  // --- ESTADOS DE DATOS SINCRONIZADOS ---
  const [integrantes, setIntegrantes] = useState(() => getInitialState('miembros', INTEGRANTES_PREDEFINIDOS.map((m, i) => ({ id: 'm_' + i, ...m }))));
  const [vacaciones, setVacaciones] = useState(() => getInitialState('vacaciones', []));
  const [eventos, setEventos] = useState(() => getInitialState('eventos', []));
  const [cumpleanos, setCumpleanos] = useState(() => getInitialState('cumpleanos', CUMPLEANOS_PREDEFINIDOS.map((c, i) => ({ id: 'c_' + i, ...c }))));
  const [ideas, setIdeas] = useState(() => getInitialState('ideas', []));
  const [citasMedicas, setCitasMedicas] = useState(() => getInitialState('citasMedicas', CITAS_MEDICAS_PREDEFINIDAS));
  const [trasladosPadres, setTrasladosPadres] = useState(() => getInitialState('trasladosPadres', TRASLADOS_PADRES_PREDEFINIDOS));
  const [ubicacionActualPadres, setUbicacionActualPadres] = useState(() => {
    return localStorage.getItem('family_app_ubicacion_padres') || 'Alcalá (Esgaravita)';
  });
  const [printType, setPrintType] = useState('full'); // 'full', 'calendar', 'cumples', 'arbol'
  const [showPrintModal, setShowPrintModal] = useState(false);

  // --- ESTADOS DE SELECCIÓN DE CALENDARIO VISUAL ---
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date(2026, 7, 1)); // Agosto 2026

  // --- ESTADOS DE FORMULARIOS ---
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [showConfirmResetModal, setShowConfirmResetModal] = useState(false); 
  const [newVacation, setNewVacation] = useState({
    lugar: '',
    ubicacionUrl: '',
    fechaInicio: '',
    fechaFin: '',
    quienes: [],
    nota: ''
  });

  const [isEditingVacation, setIsEditingVacation] = useState(false);
  const [editingVacationId, setEditingVacationId] = useState(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedImportList, setParsedImportList] = useState([]);

  const [showEventModal, setShowEventModal] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [newEvent, setNewEvent] = useState({
    titulo: '',
    fecha: '',
    hora: '',
    lugar: '',
    ubicacionUrl: '',
    descripcion: '',
    asistentes: []
  });
  const [notifyTelegramOnEvent, setNotifyTelegramOnEvent] = useState(true);

  const [showCumpleModal, setShowCumpleModal] = useState(false);
  const [isEditingCumple, setIsEditingCumple] = useState(false);
  const [editingCumpleId, setEditingCumpleId] = useState(null);
  const [newCumple, setNewCumple] = useState({
    nombre: '',
    dia: '01',
    mes: '01',
    parentesco: 'Hermano',
    santo: ''
  });

  const [newIdeaText, setNewIdeaText] = useState('');
  const [newIdeaAuthor, setNewIdeaAuthor] = useState('');

  // --- ESTADOS DE CITAS MÉDICAS ---
  const [showCitaModal, setShowCitaModal] = useState(false);
  const [isEditingCita, setIsEditingCita] = useState(false);
  const [editingCitaId, setEditingCitaId] = useState(null);
  const [filtroPacienteCita, setFiltroPacienteCita] = useState('todas');
  const [notifyTelegramOnCita, setNotifyTelegramOnCita] = useState(true);
  const [newCita, setNewCita] = useState({
    paciente: 'Mamá (Encarnación)',
    especialidad: 'Médico de Cabecera',
    medico: '',
    centro: 'Centro de Salud',
    ubicacionUrl: '',
    fecha: '',
    hora: '10:00',
    acompanante: 'Pendiente de asignar',
    notas: '',
    estado: 'pendiente'
  });

  // --- ESTADOS DE TRASLADOS DE LOS PADRES ---
  const [showTrasladoModal, setShowTrasladoModal] = useState(false);
  const [isEditingTraslado, setIsEditingTraslado] = useState(false);
  const [editingTrasladoId, setEditingTrasladoId] = useState(null);
  const [filtroTraslado, setFiltroTraslado] = useState('todos');
  const [notifyTelegramOnTraslado, setNotifyTelegramOnTraslado] = useState(true);
  const [customConductorMode, setCustomConductorMode] = useState(false);
  const [customAcompananteMode, setCustomAcompananteMode] = useState(false);
  const [newTraslado, setNewTraslado] = useState({
    origen: 'Madrid',
    destino: 'Alcalá (Esgaravita)',
    fecha: '',
    hora: '18:00',
    momentoDia: 'Tarde',
    conductor: 'Pendiente de asignar',
    notas: '',
    estado: 'pendiente'
  });

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    nombre: '',
    rol: 'Hermanos',
    tipoFamiliar: 'Hermanos',
    parejaDe: '',
    padre1: '',
    padre2: '',
    padrinoMadrina: '',
    santo: '',
    hijoAsociado: '',
    email: '',
    fechaNacimiento: ''
  });

  // Estado para controlar la impresión/exportación limpia
  const [isExporting, setIsExporting] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Helper local storage para modo offline
  const persistLocal = (key, data) => {
    localStorage.setItem(`family_app_${key}`, JSON.stringify(data));
  };

  // --- 1. AUTENTICACIÓN GOOGLE ---
  useEffect(() => {
    if (!isCloudMode) {
      setUser({ uid: 'offline-user', displayName: 'Familiar Local', email: 'offline@family.com' });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (loggedUser) => {
      if (loggedUser) {
        setUser(loggedUser);
        setLoading(false);
      } else {
        try {
          const anon = await signInAnonymously(auth);
          setUser(anon.user);
        } catch (e) {
          console.warn("Inicio anónimo:", e);
          setUser({ uid: 'guest-local', displayName: 'Familiar' });
        } finally {
          setLoading(false);
        }
      }
    }, (err) => {
      console.error("Error Auth:", err);
      setUser({ uid: 'guest-local', displayName: 'Familiar' });
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- ASOCIACIÓN DE PERFIL DE GOOGLE ---
  useEffect(() => {
    if (!user || user.uid === 'offline-user' || isLocalMode || user.isAnonymous || !user.email) {
      setMatchedMember(null);
      return;
    }

    // Buscar si algún miembro tiene este correo de Google
    const userEmailLower = (user.email || '').toLowerCase().trim();
    const match = integrantes.find(i => i && i.email && typeof i.email === 'string' && i.email.toLowerCase().trim() === userEmailLower);
    if (match) {
      setMatchedMember(match);
      setUsuarioActivo(match.nombre);
      try {
        localStorage.setItem('family_app_usuario_activo', match.nombre);
      } catch (e) {}
      setShowLinkAccountModal(false);
    } else {
      setMatchedMember(null);
      setShowLinkAccountModal(true);
    }
  }, [user, integrantes, isLocalMode]);

  // --- EFECTO PARA DEDUPLICAR Y SANEAR RELACIONES EN LA BASE DE DATOS ---
  useEffect(() => {
    if (integrantes.length === 0) return;

    const runDeduplication = async () => {
      // 1. Limpieza de "Laura" a petición familiar (Cloud)
      if (isCloudMode && user && !isLocalMode) {
        const lauras = integrantes.filter(i => i && i.nombre && i.nombre.toLowerCase() === 'laura');
        if (lauras.length > 0) {
          console.log(`Eliminando a Laura de los miembros en la nube...`);
          try {
            await Promise.all(lauras.map(m => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', m.id))));
            triggerToast("🧹 Laura ha sido removida de los integrantes.");
          } catch (e) {
            console.error("Error al quitar a Laura:", e);
          }
        }
        const lauraCumples = cumpleanos.filter(c => c && c.nombre && c.nombre.toLowerCase() === 'laura');
        if (lauraCumples.length > 0) {
          console.log(`Eliminando cumpleaños de Laura en la nube...`);
          try {
            await Promise.all(lauraCumples.map(c => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cumpleanos', c.id))));
          } catch (e) {
            console.error("Error al quitar cumpleaños de Laura:", e);
          }
        }
      }

      // 1.1 Limpieza de "Paulino" a petición familiar (Cloud)
      if (isCloudMode && user && !isLocalMode) {
        const paulinos = integrantes.filter(i => i && i.nombre && i.nombre.toLowerCase() === 'paulino');
        if (paulinos.length > 0) {
          console.log(`Eliminando a Paulino de los miembros en la nube...`);
          try {
            await Promise.all(paulinos.map(m => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', m.id))));
            triggerToast("🧹 Paulino ha sido removido de los integrantes.");
          } catch (e) {
            console.error("Error al quitar a Paulino:", e);
          }
        }
        const paulinoCumples = cumpleanos.filter(c => c && c.nombre && c.nombre.toLowerCase() === 'paulino');
        if (paulinoCumples.length > 0) {
          console.log(`Eliminando cumpleaños de Paulino en la nube...`);
          try {
            await Promise.all(paulinoCumples.map(c => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cumpleanos', c.id))));
          } catch (e) {
            console.error("Error al quitar cumpleaños de Paulino:", e);
          }
        }
      }

      // 3. Fusión de duplicados y renombramiento de Isaac / Isaac (Isik) (Cloud)
      if (isCloudMode && user && !isLocalMode) {
        const isaacMiem = integrantes.filter(i => i && i.nombre && (i.nombre === 'Isaac' || i.nombre === 'Isaac (Isik)'));
        if (isaacMiem.length > 1) {
          console.log(`Detectado duplicado de Isaac/Isaac (Isik) en miembros en la nube. Fusionando...`);
          try {
            let principal = isaacMiem.find(m => m.email) || isaacMiem.find(m => !m.id.startsWith('m_')) || isaacMiem[0];
            const duplicados = isaacMiem.filter(m => m.id !== principal.id);
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', principal.id), {
              nombre: 'Isaac (Isik)',
              santo: '3 de Junio (San Isaac)'
            });
            await Promise.all(duplicados.map(m => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', m.id))));
            triggerToast("🧹 Cuentas duplicadas de Isaac fusionadas.");
          } catch (e) {
            console.error("Error al fusionar Isaac:", e);
          }
        } else if (isaacMiem.length === 1 && isaacMiem[0].nombre === 'Isaac') {
          try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', isaacMiem[0].id), {
              nombre: 'Isaac (Isik)',
              santo: '3 de Junio (San Isaac)'
            });
          } catch (e) {
            console.error(e);
          }
        }

        const isaacCump = cumpleanos.filter(c => c && c.nombre && (c.nombre === 'Isaac' || c.nombre === 'Isaac (Isik)'));
        if (isaacCump.length > 1) {
          console.log(`Detectado duplicado de Isaac/Isaac (Isik) en cumpleaños en la nube. Fusionando...`);
          try {
            let principal = isaacCump.find(c => !c.id.startsWith('c_')) || isaacCump[0];
            const duplicados = isaacCump.filter(c => c.id !== principal.id);
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cumpleanos', principal.id), {
              nombre: 'Isaac (Isik)',
              santo: '3 de Junio (San Isaac)'
            });
            await Promise.all(duplicados.map(c => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cumpleanos', c.id))));
          } catch (e) {
            console.error("Error al fusionar cumpleaños de Isaac:", e);
          }
        } else if (isaacCump.length === 1 && isaacCump[0].nombre === 'Isaac') {
          try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cumpleanos', isaacCump[0].id), {
              nombre: 'Isaac (Isik)',
              santo: '3 de Junio (San Isaac)'
            });
          } catch (e) {
            console.error(e);
          }
        }
      }

      // 4. Fusión de duplicados y renombramiento de Isaac / Isaac (Isik) (Local/Fallback)
      if (isLocalMode || !isCloudMode || !user) {
        const isaacMiem = integrantes.filter(i => i && i.nombre && (i.nombre === 'Isaac' || i.nombre === 'Isaac (Isik)'));
        if (isaacMiem.length > 1) {
          const filtrados = integrantes.filter(i => i && i.nombre !== 'Isaac' && i.nombre !== 'Isaac (Isik)');
          const fusionado = { ...isaacMiem[0], nombre: 'Isaac (Isik)', santo: '3 de Junio (San Isaac)' };
          const nuevos = [...filtrados, fusionado];
          setIntegrantes(nuevos);
          persistLocal('miembros', nuevos);
        } else if (isaacMiem.length === 1 && isaacMiem[0].nombre === 'Isaac') {
          const nuevos = integrantes.map(i => i.id === isaacMiem[0].id ? { ...i, nombre: 'Isaac (Isik)', santo: '3 de Junio (San Isaac)' } : i);
          setIntegrantes(nuevos);
          persistLocal('miembros', nuevos);
        }

        const isaacCump = cumpleanos.filter(c => c && c.nombre && (c.nombre === 'Isaac' || c.nombre === 'Isaac (Isik)'));
        if (isaacCump.length > 1) {
          const filtrados = cumpleanos.filter(c => c && c.nombre !== 'Isaac' && c.nombre !== 'Isaac (Isik)');
          const fusionado = { ...isaacCump[0], nombre: 'Isaac (Isik)', santo: '3 de Junio (San Isaac)' };
          const nuevos = [...filtrados, fusionado];
          setCumpleanos(nuevos);
          persistLocal('cumpleanos', nuevos);
        } else if (isaacCump.length === 1 && isaacCump[0].nombre === 'Isaac') {
          const nuevos = cumpleanos.map(c => c.id === isaacCump[0].id ? { ...c, nombre: 'Isaac (Isik)', santo: '3 de Junio (San Isaac)' } : c);
          setCumpleanos(nuevos);
          persistLocal('cumpleanos', nuevos);
        }
      }

      // 2. Limpieza de "Laura" y "Paulino" a petición familiar (Local/Fallback)
      if (isLocalMode || !isCloudMode || !user) {
        const tieneLauraMiem = integrantes.some(i => i && i.nombre && i.nombre.toLowerCase() === 'laura');
        const tieneLauraCum = cumpleanos.some(c => c && c.nombre && c.nombre.toLowerCase() === 'laura');
        const tienePaulinoMiem = integrantes.some(i => i && i.nombre && i.nombre.toLowerCase() === 'paulino');
        const tienePaulinoCum = cumpleanos.some(c => c && c.nombre && c.nombre.toLowerCase() === 'paulino');

        if (tieneLauraMiem || tienePaulinoMiem) {
          const filtrados = integrantes.filter(i => !i || !i.nombre || (i.nombre.toLowerCase() !== 'laura' && i.nombre.toLowerCase() !== 'paulino'));
          setIntegrantes(filtrados);
          persistLocal('miembros', filtrados);
        }
        if (tieneLauraCum || tienePaulinoCum) {
          const filtrados = cumpleanos.filter(c => !c || !c.nombre || (c.nombre.toLowerCase() !== 'laura' && c.nombre.toLowerCase() !== 'paulino'));
          setCumpleanos(filtrados);
          persistLocal('cumpleanos', filtrados);
        }
      }

      if (!isCloudMode || !user || isLocalMode) return;

      const agrupados = {};
      integrantes.forEach(miembro => {
        const nombreNorm = (miembro.nombre || '').trim().toLowerCase();
        if (!nombreNorm) return;
        if (!agrupados[nombreNorm]) agrupados[nombreNorm] = [];
        agrupados[nombreNorm].push(miembro);
      });

      for (const nombreNorm in agrupados) {
        const list = agrupados[nombreNorm];
        if (list.length > 1) {
          console.log(`Detectado miembro duplicado para: "${list[0].nombre}" (${list.length} veces).`);
          
          let indexToKeep = 0;
          let maxFieldsCount = -1;

          list.forEach((j, index) => {
            let fieldsCount = 0;
            for (const k in j) {
              if (j[k] !== null && j[k] !== undefined && j[k] !== '') {
                if (Array.isArray(j[k])) {
                  if (j[k].length > 0) fieldsCount++;
                } else {
                  fieldsCount++;
                }
              }
            }
            if (fieldsCount > maxFieldsCount) {
              maxFieldsCount = fieldsCount;
              indexToKeep = index;
            }
          });

          const miembroToKeep = list[indexToKeep];
          console.log(`Manteniendo ID: ${miembroToKeep.id} para "${miembroToKeep.nombre}"`);

          const deletePromises = list
            .filter((_, idx) => idx !== indexToKeep)
            .map(m => {
              console.log(`Eliminando duplicado ID: ${m.id} de "${m.nombre}"`);
              const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'miembros', m.id);
              return deleteDoc(docRef);
            });
          
          try {
            await Promise.all(deletePromises);
            triggerToast(`🧹 Base de datos saneada: Duplicados de "${list[0].nombre}" eliminados.`);
          } catch (e) {
            console.error("Error al deduplicar:", e);
          }
        }
      }
    };

    const runRelationshipSanitization = async () => {
      const updatesCloud = [];
      let updatedLocal = [...integrantes];
      let hasChangesLocal = false;

      // 1. Enlazar padres predeterminados a los Hermanos si no tienen ninguno asignado en la base de datos
      const hermanosSinPadres = integrantes.filter(i => i && i.rol === 'Hermanos' && (!i.padres || i.padres.length === 0));
      if (hermanosSinPadres.length > 0) {
        // Encontrar los padres por defecto activos (que no sean abuelos de otros padres)
        const padresPorDefecto = integrantes.filter(i => {
          if (i.rol !== 'Padres') return false;
          const esAbuelo = integrantes.some(otro => otro.rol === 'Padres' && otro.padres && otro.padres.includes(i.nombre));
          return !esAbuelo;
        });

        const nombresPadres = padresPorDefecto.length > 0 
          ? padresPorDefecto.map(p => p.nombre)
          : ['Mamá', 'Papá'];

        console.log(`🧹 Vinculando padres activos ${JSON.stringify(nombresPadres)} a ${hermanosSinPadres.length} hermanos sin padres registrados.`);

        for (const herm of hermanosSinPadres) {
          if (isCloudMode && user && !isLocalMode) {
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'miembros', herm.id);
            updatesCloud.push(updateDoc(docRef, { padres: nombresPadres }));
          }
          updatedLocal = updatedLocal.map(m => m.id === herm.id ? { ...m, padres: nombresPadres } : m);
          hasChangesLocal = true;
        }
      }

      // 2. Limpieza de relaciones asimétricas o no bidireccionales
      for (const miembro of integrantes) {
        if (miembro && miembro.parejaDe) {
          const parejaApuntada = integrantes.find(i => i && i.nombre === miembro.parejaDe);
          
          // Si la pareja apuntada no existe, o existe pero no le apunta de vuelta
          if (!parejaApuntada || parejaApuntada.parejaDe !== miembro.nombre) {
            console.log(`🧹 Relación asimétrica corregida: ${miembro.nombre} apuntaba a "${miembro.parejaDe}" pero no es mutuo. Limpiando.`);
            
            if (isCloudMode && user && !isLocalMode) {
              const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'miembros', miembro.id);
              updatesCloud.push(updateDoc(docRef, { parejaDe: null }));
            }
            
            updatedLocal = updatedLocal.map(m => m.id === miembro.id ? { ...m, parejaDe: null } : m);
            hasChangesLocal = true;
          }
        }
      }

      if (updatesCloud.length > 0) {
        try {
          await Promise.all(updatesCloud);
          triggerToast("🧹 Base de datos y relaciones familiares sincronizadas.");
        } catch (e) {
          console.error("Error al sanear relaciones en la nube:", e);
        }
      }

      if (hasChangesLocal && (isLocalMode || !isCloudMode || !user)) {
        setIntegrantes(updatedLocal);
        persistLocal('miembros', updatedLocal);
      }
    };

    const timer = setTimeout(() => {
      runDeduplication();
      runRelationshipSanitization();
    }, 3000);

    return () => clearTimeout(timer);
  }, [integrantes, user, isLocalMode]);

  const syncBirthdayFromMember = async (nombre, fechaNacimiento, tipoFamiliar, santo, oldNombre) => {
    if (!fechaNacimiento || !nombre) return;
    const partes = fechaNacimiento.split('-');
    if (partes.length !== 3) return;
    const mesDia = `${partes[1]}-${partes[2]}`; // Formato "MM-DD"
    
    let parentesco = 'Familiar';
    if (tipoFamiliar === 'Hermanos') parentesco = 'Hermano/a';
    else if (tipoFamiliar === 'Cuñados') parentesco = 'Cuñado/a';
    else if (tipoFamiliar === 'Hijos') parentesco = 'Sobrino/Hijo';
    else if (tipoFamiliar === 'Padres') parentesco = 'Padres';
    else if (tipoFamiliar === 'Abuelos') parentesco = 'Abuelos';

    const cumpleData = {
      nombre: nombre,
      fecha: mesDia,
      parentesco: parentesco,
      santo: santo || ''
    };

    const searchName = oldNombre || nombre;

    if (isCloudMode && user && !isLocalMode) {
      try {
        const col = collection(db, 'artifacts', appId, 'public', 'data', 'cumpleanos');
        const existente = cumpleanos.find(c => c && (c.nombre === searchName || c.nombre === nombre));
        if (existente) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cumpleanos', existente.id);
          await updateDoc(docRef, cumpleData);
        } else {
          await addDoc(col, cumpleData);
        }
      } catch (e) {
        console.error("Error sincronizando cumpleaños:", e);
      }
    } else {
      const existente = cumpleanos.find(c => c && (c.nombre === searchName || c.nombre === nombre));
      let updated;
      if (existente) {
        updated = cumpleanos.map(c => c.id === existente.id ? { ...c, ...cumpleData } : c);
      } else {
        updated = [...cumpleanos, { id: 'c_' + Date.now(), ...cumpleData }];
      }
      setCumpleanos(updated);
      persistLocal('cumpleanos', updated);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      triggerToast('👋 ¡Sesión iniciada con Google!');
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      triggerToast(`Error al iniciar sesión: ${error.message || 'Cancelado'}`);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await signOut(auth);
      setMatchedMember(null);
      setShowLinkAccountModal(false);
      triggerToast('🔒 Sesión cerrada.');
    } catch (error) {
      console.error(error);
    }
  };

  const handleBootstrapLink = async (e) => {
    e.preventDefault();
    if (!bootstrapProfileName || !user || !user.email) return;

    const memberToLink = integrantes.find(i => i.nombre === bootstrapProfileName);
    if (!memberToLink) return;

    if (isCloudMode && !isLocalMode) {
      try {
        const isLocalMember = typeof memberToLink.id === 'string' && memberToLink.id.startsWith('m_');
        if (!isLocalMember) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'miembros', memberToLink.id);
          await updateDoc(docRef, { email: user.email });
        } else {
          // Si es miembro de semilla local, promocionarlo a Firestore
          const colMiem = collection(db, 'artifacts', appId, 'public', 'data', 'miembros');
          const padresArray = memberToLink.padres || [];
          const padrinosArray = memberToLink.padrinos || [];
          await addDoc(colMiem, {
            nombre: memberToLink.nombre,
            rol: memberToLink.rol,
            parejaDe: memberToLink.parejaDe || null,
            padres: padresArray.length > 0 ? padresArray : null,
            padrinos: padrinosArray.length > 0 ? padrinosArray : null,
            santo: memberToLink.santo || 'No especificado',
            email: user.email
          });
        }
        setMatchedMember({ ...memberToLink, email: user.email });
        setUsuarioActivo(memberToLink.nombre);
        try {
          localStorage.setItem('family_app_usuario_activo', memberToLink.nombre);
        } catch (e) {}
        setShowLinkAccountModal(false);
        triggerToast(`🎉 ¡Vinculada tu cuenta a ${bootstrapProfileName}!`);
      } catch (err) {
        console.error(err);
        triggerToast(`Error al vincular: ${err.message || 'Permiso denegado'}`);
      }
    } else {
      // Fallback local
      const updated = integrantes.map(i => i.id === memberToLink.id ? { ...i, email: user.email } : i);
      setIntegrantes(updated);
      setMatchedMember({ ...memberToLink, email: user.email });
      setUsuarioActivo(memberToLink.nombre);
      try {
        localStorage.setItem('family_app_usuario_activo', memberToLink.nombre);
      } catch (e) {}
      setShowLinkAccountModal(false);
      persistLocal('miembros', updated);
      triggerToast(`🎉 ¡Vinculada tu cuenta localmente a ${bootstrapProfileName}!`);
    }
  };

  // --- 2. CARGA Y SEMILLA DE DATOS (OFFLINE U ONILNE) ---
  useEffect(() => {
    if (!isCloudMode) {
      // Configuración en modo local offline con semillas predefinidas
      const seedIntegrantes = INTEGRANTES_PREDEFINIDOS.map((m, i) => ({ id: 'm_' + i, ...m }));
      const seedCumples = CUMPLEANOS_PREDEFINIDOS.map((c, i) => ({ id: 'c_' + i, ...c }));
      const seedVacaciones = [
        {
          id: 'v_1',
          lugar: 'Sevilla',
          ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Sevilla',
          fechaInicio: '2026-08-01',
          fechaFin: '2026-08-15',
          quienes: ['Isaac (Isik)', 'Mónica'],
          nota: 'Primera quincena disfrutando de Sevilla en familia.'
        },
        {
          id: 'v_2',
          lugar: 'Chiclana de la Frontera',
          ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Chiclana+de+la+Frontera',
          fechaInicio: '2026-08-16',
          fechaFin: '2026-08-30',
          quienes: ['María', 'Bartek', 'Lucas'],
          nota: 'Segunda quincena playera en Chiclana.'
        },
        {
          id: 'v_3',
          lugar: 'Munibáñez',
          ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Munibañez',
          fechaInicio: '2026-08-10',
          fechaFin: '2026-08-14',
          quienes: ['Mamá', 'Papá', 'Rebeca', 'Isaac (Isik)', 'Mónica', 'María', 'Bartek', 'Javier', 'Sofía', 'Carlos', 'Lucas', 'Elena'],
          nota: 'Reunión anual con barbacoa.'
        }
      ];
      const seedEventos = [
        {
          id: 'e_1',
          titulo: 'Comida familiar de Domingo en la Ribera',
          fecha: '2026-06-14',
          hora: '14:30',
          lugar: 'La Ribera',
          ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=La+Ribera',
          descripcion: 'Para planear las maletas de agosto.',
          asistentes: ['Mamá', 'Papá', 'Rebeca', 'Isaac (Isik)', 'Mónica']
        }
      ];
      const seedIdeas = [
        {
          id: 'i_1',
          autor: 'Isaac (Isik)',
          texto: 'Imprimir el calendario de vacaciones en Munibáñez para colgarlo en el salón.',
          votos: 12
        }
      ];

      setIntegrantes(getInitialState('miembros', seedIntegrantes));
      setCumpleanos(getInitialState('cumpleanos', seedCumples));
      setVacaciones(getInitialState('vacaciones', seedVacaciones));
      setEventos(getInitialState('eventos', seedEventos));
      setIdeas(getInitialState('ideas', seedIdeas));
      setCitasMedicas(getInitialState('citasMedicas', CITAS_MEDICAS_PREDEFINIDAS));
      setTrasladosPadres(getInitialState('trasladosPadres', TRASLADOS_PADRES_PREDEFINIDOS));
      setLoading(false);
      return;
    }

    if (!user) return;

    const colMiembros = collection(db, 'artifacts', appId, 'public', 'data', 'miembros');
    const colVacaciones = collection(db, 'artifacts', appId, 'public', 'data', 'vacaciones');
    const colEventos = collection(db, 'artifacts', appId, 'public', 'data', 'eventos');
    const colCumples = collection(db, 'artifacts', appId, 'public', 'data', 'cumpleanos');
    const colIdeas = collection(db, 'artifacts', appId, 'public', 'data', 'ideas');
    const colCitasMedicas = collection(db, 'artifacts', appId, 'public', 'data', 'citasMedicas');
    const colTrasladosPadres = collection(db, 'artifacts', appId, 'public', 'data', 'trasladosPadres');
    const docUbicacion = doc(db, 'artifacts', appId, 'public', 'config_ubicacion_padres');

    const sembrarDatosSiVacios = async () => {
      try {
        const snapMiembros = await getDocs(colMiembros);
        if (snapMiembros.empty) {
          for (const integrante of INTEGRANTES_PREDEFINIDOS) {
            await addDoc(colMiembros, integrante);
          }
          for (const cumple of CUMPLEANOS_PREDEFINIDOS) {
            await addDoc(colCumples, cumple);
          }
          await addDoc(colVacaciones, {
            lugar: 'Sevilla',
            ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Sevilla',
            fechaInicio: '2026-08-01',
            fechaFin: '2026-08-15',
            quienes: ['Isaac (Isik)', 'Mónica'],
            nota: 'Primera quincena disfrutando de Sevilla en familia.'
          });
          await addDoc(colVacaciones, {
            lugar: 'Chiclana de la Frontera',
            ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Chiclana+de+la+Frontera',
            fechaInicio: '2026-08-16',
            fechaFin: '2026-08-30',
            quienes: ['María', 'Bartek', 'Lucas'],
            nota: 'Segunda quincena playera en Chiclana.'
          });
          await addDoc(colVacaciones, {
            lugar: 'Munibáñez',
            ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Munibañez',
            fechaInicio: '2026-08-10',
            fechaFin: '2026-08-14',
            quienes: ['Mamá', 'Papá', 'Rebeca', 'Isaac (Isik)', 'Mónica', 'María', 'Bartek', 'Javier', 'Sofía', 'Carlos', 'Lucas', 'Elena'],
            nota: 'Reunión anual con barbacoa.'
          });

          await addDoc(colEventos, {
            titulo: 'Comida familiar de Domingo en la Ribera',
            fecha: '2026-06-14',
            hora: '14:30',
            lugar: 'La Ribera',
            ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=La+Ribera',
            descripcion: 'Para planear las maletas de agosto.',
            asistentes: ['Mamá', 'Papá', 'Rebeca', 'Isaac (Isik)', 'Mónica']
          });

          await addDoc(colIdeas, {
            autor: 'Isaac (Isik)',
            texto: 'Imprimir el calendario de vacaciones en Munibáñez para colgarlo en el salón.',
            votos: 12
          });

          for (const cita of CITAS_MEDICAS_PREDEFINIDAS) {
            await addDoc(colCitasMedicas, cita);
          }

          for (const tras of TRASLADOS_PADRES_PREDEFINIDOS) {
            await addDoc(colTrasladosPadres, tras);
          }

          await setDoc(docUbicacion, { ubicacion: 'Alcalá (Esgaravita)', actualizadoPor: 'Sistema' }, { merge: true });
        }
      } catch (err) {
        console.error("Error sembrando datos:", err);
      }
    };

    sembrarDatosSiVacios();

    const unsubMiembros = onSnapshot(colMiembros, (snapshot) => {
      setIntegrantes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error al suscribirse a miembros (posiblemente reglas de Firestore):", err);
      setIntegrantes(getInitialState('miembros', INTEGRANTES_PREDEFINIDOS.map((m, i) => ({ id: 'm_' + i, ...m }))));
      setIsLocalMode(true);
    });

    const unsubVacaciones = onSnapshot(colVacaciones, (snapshot) => {
      setVacaciones(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Error al suscribirse a vacaciones (posiblemente reglas de Firestore):", err);
      setVacaciones(getInitialState('vacaciones', []));
      setIsLocalMode(true);
      setLoading(false);
    });

    const unsubEventos = onSnapshot(colEventos, (snapshot) => {
      setEventos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error al suscribirse a eventos (posiblemente reglas de Firestore):", err);
      setEventos(getInitialState('eventos', []));
      setIsLocalMode(true);
    });

    const unsubCumples = onSnapshot(colCumples, (snapshot) => {
      setCumpleanos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error al suscribirse a cumpleaños (posiblemente reglas de Firestore):", err);
      setCumpleanos(getInitialState('cumpleanos', CUMPLEANOS_PREDEFINIDOS.map((c, i) => ({ id: 'c_' + i, ...c }))));
      setIsLocalMode(true);
    });

    const unsubIdeas = onSnapshot(colIdeas, (snapshot) => {
      setIdeas(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error al suscribirse a ideas (posiblemente reglas de Firestore):", err);
      setIdeas(getInitialState('ideas', []));
      setIsLocalMode(true);
    });

    const unsubCitasMedicas = onSnapshot(colCitasMedicas, (snapshot) => {
      setCitasMedicas(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error al suscribirse a citas médicas (posiblemente reglas de Firestore):", err);
      setCitasMedicas(getInitialState('citasMedicas', CITAS_MEDICAS_PREDEFINIDAS));
      setIsLocalMode(true);
    });

    const unsubTraslados = onSnapshot(colTrasladosPadres, (snapshot) => {
      setTrasladosPadres(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error al suscribirse a traslados:", err);
      setTrasladosPadres(getInitialState('trasladosPadres', TRASLADOS_PADRES_PREDEFINIDOS));
    });

    const unsubUbicacion = onSnapshot(docUbicacion, (docSnap) => {
      if (docSnap.exists() && docSnap.data()?.ubicacion) {
        setUbicacionActualPadres(docSnap.data().ubicacion);
        localStorage.setItem('family_app_ubicacion_padres', docSnap.data().ubicacion);
      }
    }, (err) => {
      console.warn("Error snapshot ubicación padres:", err);
    });

    return () => {
      unsubMiembros();
      unsubVacaciones();
      unsubEventos();
      unsubCumples();
      unsubIdeas();
      unsubCitasMedicas();
      unsubTraslados();
      unsubUbicacion();
    };
  }, [user]);

  // --- AVISO DIARIO AUTOMÁTICO AL GRUPO DE TELEGRAM (LAOS) ---
  const avisoDiarioTelegramRef = useRef(false);

  useEffect(() => {
    if (loading || avisoDiarioTelegramRef.current) return;
    if (!cumpleanos || cumpleanos.length === 0) return;

    const hoy = new Date();
    const hoyIso = getFechaHoyLocal(hoy);
    const lastCheckKey = 'last_telegram_digest_date';
    const lastDateLocal = localStorage.getItem(lastCheckKey);

    if (lastDateLocal === hoyIso) {
      avisoDiarioTelegramRef.current = true;
      return;
    }

    const ejecutarDigest = async () => {
      // Verificación en la nube para evitar duplicados entre distintos familiares
      if (isCloudMode && db && user && !isLocalMode && !user.uid?.startsWith('guest-local')) {
        try {
          const digestRef = doc(db, 'artifacts', appId, 'public', 'telegram_digest');
          const snap = await getDoc(digestRef);
          if (snap.exists() && snap.data()?.fecha === hoyIso) {
            localStorage.setItem(lastCheckKey, hoyIso);
            avisoDiarioTelegramRef.current = true;
            return;
          }
        } catch (e) {
          console.warn("No se pudo comprobar digest en la nube:", e);
        }
      }

      const hoyMes = hoy.getMonth() + 1;
      const hoyDia = hoy.getDate();

      const cumplesDeHoy = cumpleanos.filter(c => {
        if (!c.fecha || !c.fecha.includes('-')) return false;
        const [m, d] = c.fecha.split('-');
        return parseInt(m, 10) === hoyMes && parseInt(d, 10) === hoyDia;
      });

      const santosDeHoy = [];
      integrantes.forEach(i => {
        if (i.santo && matchesSaintDate(i.santo, hoy)) {
          santosDeHoy.push({ nombre: i.nombre, santo: i.santo });
        }
      });
      cumpleanos.forEach(c => {
        if (c.santo && matchesSaintDate(c.santo, hoy) && !santosDeHoy.some(s => s.nombre === c.nombre)) {
          santosDeHoy.push({ nombre: c.nombre, santo: c.santo });
        }
      });

      const eventosProximos = (eventos || []).filter(e => {
        if (!e.fecha) return false;
        const diffDias = Math.round((new Date(e.fecha).getTime() - new Date(hoyIso).getTime()) / (1000 * 60 * 60 * 24));
        return diffDias >= 0 && diffDias <= 1;
      });

      const citasProximas = (citasMedicas || []).filter(c => {
        if (!c.fecha || c.estado === 'completada') return false;
        const diffDias = Math.round((new Date(c.fecha).getTime() - new Date(hoyIso).getTime()) / (1000 * 60 * 60 * 24));
        return diffDias >= 0 && diffDias <= 1;
      });

      const trasladosProximos = (trasladosPadres || []).filter(t => {
        if (!t.fecha || t.estado === 'realizado') return false;
        const diffDias = Math.round((new Date(t.fecha).getTime() - new Date(hoyIso).getTime()) / (1000 * 60 * 60 * 24));
        return diffDias >= 0 && diffDias <= 1;
      });

      if (cumplesDeHoy.length > 0 || santosDeHoy.length > 0 || eventosProximos.length > 0 || citasProximas.length > 0 || trasladosProximos.length > 0) {
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

        const ok = await enviarMensajeTelegram(msg);
        if (ok) {
          localStorage.setItem(lastCheckKey, hoyIso);
          avisoDiarioTelegramRef.current = true;
          if (isCloudMode && db && user && !isLocalMode && !user.uid?.startsWith('guest-local')) {
            try {
              const digestRef = doc(db, 'artifacts', appId, 'public', 'telegram_digest');
              await setDoc(digestRef, { fecha: hoyIso, enviadoEl: new Date().toISOString() }, { merge: true });
            } catch (e) {
              console.warn("No se pudo guardar registro de digest en la nube:", e);
            }
          }
        }
      } else if (cumpleanos.length >= 15) {
        // Solo bloquear si ya están cargados los datos familiares completos
        localStorage.setItem(lastCheckKey, hoyIso);
        avisoDiarioTelegramRef.current = true;
      }
    };

    ejecutarDigest();
  }, [loading, cumpleanos, integrantes, eventos, citasMedicas, trasladosPadres, user]);

  // --- 3. LOGICA DINÁMICA DE PARENTESCOS BLINDADA ---
  const getParentescoDinamico = (miembro, yoNombre) => {
    if (!miembro) return 'Otros';
    if (miembro.nombre === yoNombre) return 'Tú';

    const yo = integrantes.find(i => i.nombre === yoNombre);
    if (!yo) return miembro.rol || 'Otros';

    // 1. ESPOSOS / PAREJA
    if (miembro.parejaDe === yoNombre || (yo.parejaDe && yo.parejaDe === miembro.nombre)) {
      return yo.rol === 'Hermanos' ? 'Tu Esposa/o' : 'Tu Pareja';
    }

    // 2. PADRES
    if (miembro.rol === 'Padres') {
      return miembro.nombre === 'Mamá' ? 'Tu Madre' : 'Tu Padre';
    }

    // 3. HIJOS DIRECTOS
    if (miembro.rol === 'Hijos' && miembro.padres && Array.isArray(miembro.padres) && miembro.padres.includes(yoNombre)) {
      return 'Tu Hijo/a';
    }

    // 4. AHIJADOS DIRECTOS
    if (miembro.padrinos && Array.isArray(miembro.padrinos) && miembro.padrinos.includes(yoNombre)) {
      return 'Tu Ahijado/a 🌟';
    }

    // 5. HERMANOS
    if (yo.rol === 'Hermanos' && miembro.rol === 'Hermanos') {
      return 'Tu Hermano/a';
    }

    // 6. CUÑADOS
    if (yo.rol === 'Hermanos' && miembro.rol === 'Cuñados') {
      if (miembro.parejaDe) {
        return `Tu Cuñado/a (Pareja de ${miembro.parejaDe})`;
      }
      return 'Tu Cuñado/a';
    }

    if (yo.rol === 'Cuñados' && miembro.rol === 'Hermanos') {
      if (yo.parejaDe === miembro.nombre) {
        return 'Tu Pareja / Esposo';
      }
      return 'Tu Cuñado/a';
    }

    // 7. SOBRINOS (Hijos de tus hermanos)
    if (miembro.rol === 'Hijos' && miembro.padres && Array.isArray(miembro.padres)) {
      const esHijoDeHermano = miembro.padres.some(p => {
        const progenitor = integrantes.find(i => i.nombre === p);
        return progenitor && progenitor.rol === 'Hermanos' && progenitor.nombre !== yoNombre;
      });
      if (esHijoDeHermano) {
        return 'Tu Sobrino/a';
      }
    }

    // 8. NIETOS
    if (yo.rol === 'Padres' && miembro.rol === 'Hijos') {
      return 'Tu Nieto/a';
    }
    if (yo.rol === 'Padres' && miembro.rol === 'Hermanos') {
      return 'Tu Hijo/a';
    }

    return miembro.rol || 'Otros';
  };

  // --- 4. CÁLCULOS EN MEMORIA TOTALMENTE SALVAGUARDADOS (CRASH-FREE) ---
  const cumpleanosOrdenados = useMemo(() => {
    const hoy = new Date();
    const hoyMes = hoy.getMonth() + 1;
    const hoyDia = hoy.getDate();

    return [...cumpleanos]
      .filter(cumple => cumple && cumple.nombre && cumple.fecha && typeof cumple.fecha === 'string' && cumple.fecha.includes('-'))
      .map(cumple => {
        const [mesStr, diaStr] = cumple.fecha.split('-');
        const mes = parseInt(mesStr, 10) || 1;
        const dia = parseInt(diaStr, 10) || 1;
        
        let cumpleAno = hoy.getFullYear();
        if (mes < hoyMes || (mes === hoyMes && dia < hoyDia)) {
          cumpleAno += 1;
        }
        
        const fechaCumple = new Date(cumpleAno, mes - 1, dia);
        const diferenciaMs = fechaCumple.getTime() - hoy.getTime();
        const diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

        const integranteAsociado = integrantes.find(i => i.nombre === cumple.nombre);
        const santoTexto = cumple.santo || (integranteAsociado ? (integranteAsociado.santo || 'No registrado') : 'No registrado');

        let diasFaltantesSanto = null;
        if (santoTexto && santoTexto !== 'No registrado' && !santoTexto.toLowerCase().includes('no especificado')) {
          const fechaSanto = obtenerMesDiaSanto(santoTexto);
          if (fechaSanto) {
            diasFaltantesSanto = calcularDiasRestantes(fechaSanto.mes, fechaSanto.dia);
          }
        }

        return {
          ...cumple,
          diasFaltantes: diasRestantes,
          fechaVisual: `${dia} de ${obtenerNombreMes(mes)}`,
          santo: santoTexto,
          diasFaltantesSanto
        };
      })
      .sort((a, b) => a.diasFaltantes - b.diasFaltantes);
  }, [cumpleanos, integrantes]);

  const proximasCelebraciones30Dias = useMemo(() => {
    const listado = [];

    // A. Procesar cumpleaños
    cumpleanos.forEach(cumple => {
      if (!cumple || !cumple.nombre || !cumple.fecha || !cumple.fecha.includes('-')) return;
      const [mesStr, diaStr] = cumple.fecha.split('-');
      const mes = parseInt(mesStr, 10);
      const dia = parseInt(diaStr, 10);
      if (isNaN(mes) || isNaN(dia)) return;

      const diasFaltantes = calcularDiasRestantes(mes, dia);
      const integranteAsociado = integrantes.find(i => i.nombre === cumple.nombre);
      const parentesco = cumple.parentesco || (integranteAsociado ? (integranteAsociado.rol === 'Hermanos' ? 'Hermano/a' : integranteAsociado.rol === 'Cuñados' ? 'Cuñado/a' : integranteAsociado.rol === 'Hijos' ? 'Sobrino/Hijo' : integranteAsociado.rol) : 'Familiar');

      listado.push({
        id: `cumple-${cumple.id || cumple.nombre}`,
        nombre: cumple.nombre,
        tipo: '🎂 Cumpleaños',
        fechaVisual: `${dia} de ${obtenerNombreMes(mes)}`,
        diasFaltantes,
        parentesco,
        santoTexto: cumple.santo || (integranteAsociado ? integranteAsociado.santo : null)
      });
    });

    // B. Procesar onomásticas (santos) combinando integrantes y cumpleaños
    const santosProcesados = new Set();

    integrantes.forEach(miembro => {
      if (!miembro || !miembro.nombre) return;
      const cumpleAsociado = cumpleanos.find(c => c && c.nombre === miembro.nombre);
      const santoTexto = (miembro.santo && !miembro.santo.toLowerCase().includes('no especificado'))
        ? miembro.santo
        : (cumpleAsociado && cumpleAsociado.santo && !cumpleAsociado.santo.toLowerCase().includes('no especificado') ? cumpleAsociado.santo : null);

      if (!santoTexto) return;
      const fechaSanto = obtenerMesDiaSanto(santoTexto);
      if (!fechaSanto) return;

      santosProcesados.add(miembro.nombre);
      const diasFaltantes = calcularDiasRestantes(fechaSanto.mes, fechaSanto.dia);
      const parentesco = miembro.rol === 'Hermanos' ? 'Hermano/a' : miembro.rol === 'Cuñados' ? 'Cuñado/a' : miembro.rol === 'Hijos' ? 'Sobrino/Hijo' : miembro.rol;

      listado.push({
        id: `santo-${miembro.id || miembro.nombre}`,
        nombre: miembro.nombre,
        tipo: '✨ Santo',
        fechaVisual: `${fechaSanto.dia} de ${obtenerNombreMes(fechaSanto.mes)}`,
        diasFaltantes,
        parentesco,
        santoTexto
      });
    });

    cumpleanos.forEach(cumple => {
      if (!cumple || !cumple.nombre || santosProcesados.has(cumple.nombre)) return;
      if (!cumple.santo || cumple.santo.toLowerCase().includes('no especificado')) return;
      const fechaSanto = obtenerMesDiaSanto(cumple.santo);
      if (!fechaSanto) return;

      santosProcesados.add(cumple.nombre);
      const diasFaltantes = calcularDiasRestantes(fechaSanto.mes, fechaSanto.dia);
      listado.push({
        id: `santo-cumple-${cumple.id || cumple.nombre}`,
        nombre: cumple.nombre,
        tipo: '✨ Santo',
        fechaVisual: `${fechaSanto.dia} de ${obtenerNombreMes(fechaSanto.mes)}`,
        diasFaltantes,
        parentesco: cumple.parentesco || 'Familiar',
        santoTexto: cumple.santo
      });
    });

    // C. Filtrar (0 a 30 días) y ordenar cronológicamente
    return listado
      .filter(cel => cel.diasFaltantes >= 0 && cel.diasFaltantes <= 30)
      .sort((a, b) => a.diasFaltantes - b.diasFaltantes);
  }, [cumpleanos, integrantes]);

  const cuentaAtrasVacaciones = useMemo(() => {
    const hoy = new Date();
    const futuras = vacaciones
      .filter(vac => vac && vac.fechaInicio && typeof vac.fechaInicio === 'string')
      .map(vac => {
        const fechaIn = new Date(vac.fechaInicio);
        if (isNaN(fechaIn.getTime())) return { ...vac, diasFaltantes: 999999 };
        const diffTime = fechaIn.getTime() - hoy.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...vac, diasFaltantes: diffDays };
      })
      .filter(vac => vac.diasFaltantes >= 0 && vac.diasFaltantes !== 999999)
      .sort((a, b) => a.diasFaltantes - b.diasFaltantes);

    return futuras.length > 0 ? futuras[0] : null;
  }, [vacaciones]);

  const otrosConductoresRegistrados = useMemo(() => {
    const nombres = new Set();
    trasladosPadres.forEach(t => {
      const c = (t.conductor || '').trim();
      if (
        c && 
        c !== 'Pendiente de asignar' && 
        c !== 'Taxi' &&
        !integrantes.some(i => i.nombre?.toLowerCase() === c.toLowerCase())
      ) {
        nombres.add(c);
      }
    });
    return Array.from(nombres).sort();
  }, [trasladosPadres, integrantes]);

  const otrosAcompanantesRegistrados = useMemo(() => {
    const nombres = new Set();
    citasMedicas.forEach(c => {
      const a = (c.acompanante || '').trim();
      if (
        a && 
        a !== 'Pendiente de asignar' && 
        a !== 'Taxi' &&
        a !== 'Taxi / Sanitario' &&
        !integrantes.some(i => i.nombre?.toLowerCase() === a.toLowerCase())
      ) {
        nombres.add(a);
      }
    });
    return Array.from(nombres).sort();
  }, [citasMedicas, integrantes]);

  function obtenerNombreMes(mesNum) {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mesNum - 1] || 'Enero';
  }

  // --- 5. LOGICA DE EXPORTACIÓN EN PDF / IMPRESIÓN ---
  const getCalendarDaysForMonth = (year, month) => {
    const primerDiaSemana = new Date(year, month, 1).getDay();
    const offset = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

    const diasTotalesMes = new Date(year, month + 1, 0).getDate();
    const diasTotalesMesAnterior = new Date(year, month, 0).getDate();

    const result = [];

    for (let i = offset - 1; i >= 0; i--) {
      result.push({
        day: diasTotalesMesAnterior - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, diasTotalesMesAnterior - i)
      });
    }

    for (let i = 1; i <= diasTotalesMes; i++) {
      result.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      result.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    return result;
  };

  const handleDownloadPDF = async (type) => {
    setPrintType(type);
    setIsExporting(true);
    setShowPrintModal(false);

    try {
      // Dar tiempo para que el DOM se monte y cargue los estilos
      await new Promise((resolve) => setTimeout(resolve, 600));

      const container = document.getElementById('printable-family-report');
      if (!container) {
        throw new Error('No se encontró el contenedor de generación de PDF');
      }

      const pageSections = container.querySelectorAll('.pdf-page-section');
      if (!pageSections || pageSections.length === 0) {
        throw new Error('No se encontraron páginas para exportar');
      }

      let pdf = null;

      for (let i = 0; i < pageSections.length; i++) {
        const pageEl = pageSections[i];
        const orientation = pageEl.getAttribute('data-orientation') || 'portrait';

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });

        const imgWidthPx = canvas.width;
        const imgHeightPx = canvas.height;

        if (i === 0) {
          pdf = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: 'a4'
          });
        } else {
          pdf.addPage('a4', orientation);
        }

        const pageWidthMm = pdf.internal.pageSize.getWidth();
        const pageHeightMm = pdf.internal.pageSize.getHeight();
        const marginMm = 8;
        const targetWidthMm = pageWidthMm - marginMm * 2;
        const targetHeightMm = pageHeightMm - marginMm * 2;

        const pageCanvasHeight = (imgWidthPx * targetHeightMm) / targetWidthMm;

        if (imgHeightPx <= pageCanvasHeight * 1.1) {
          // Cabe perfectamente en 1 sola página
          let renderWidth = targetWidthMm;
          let renderHeight = (targetWidthMm * imgHeightPx) / imgWidthPx;
          if (renderHeight > targetHeightMm) {
            renderHeight = targetHeightMm;
            renderWidth = (targetHeightMm * imgWidthPx) / imgHeightPx;
          }
          const posX = (pageWidthMm - renderWidth) / 2;
          const posY = marginMm + Math.max(0, (targetHeightMm - renderHeight) / 6);
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight);
        } else {
          // Contenido extenso: partir limpiamente en varias páginas
          let currentY = 0;
          let isFirstSlice = true;
          while (currentY < imgHeightPx) {
            if (!isFirstSlice) {
              pdf.addPage('a4', orientation);
            }
            const sliceHeight = Math.min(pageCanvasHeight, imgHeightPx - currentY);
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = imgWidthPx;
            sliceCanvas.height = sliceHeight;
            const sCtx = sliceCanvas.getContext('2d');
            sCtx.fillStyle = '#ffffff';
            sCtx.fillRect(0, 0, imgWidthPx, sliceHeight);
            sCtx.drawImage(
              canvas,
              0, currentY, imgWidthPx, sliceHeight,
              0, 0, imgWidthPx, sliceHeight
            );
            const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
            const sliceHeightMm = (sliceHeight * targetWidthMm) / imgWidthPx;
            const posX = (pageWidthMm - targetWidthMm) / 2;
            pdf.addImage(sliceImgData, 'JPEG', posX, marginMm, targetWidthMm, sliceHeightMm);

            currentY += sliceHeight;
            isFirstSlice = false;
          }
        }
      }

      const fileNames = {
        arbol: 'arbol-genealogico-familia-barnuevo.pdf',
        calendar: 'calendario-vacaciones-familia-barnuevo.pdf',
        cumples: 'agenda-cumpleanos-familia-barnuevo.pdf',
        citas: 'citas-medicas-padres-barnuevo.pdf',
        traslados: 'traslados-padres-alcala-madrid.pdf',
        full: 'reporte-familiar-completo-barnuevo.pdf'
      };

      const finalName = fileNames[type] || `reporte-familiar-${type}.pdf`;
      pdf.save(finalName);
      triggerToast('📄 ¡PDF descargado correctamente!');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      triggerToast('⚠️ Error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = handleDownloadPDF;

  const renderPrintCalendarGrid = (year, monthIndex) => {
    const days = getCalendarDaysForMonth(year, monthIndex);
    return (
      <div className="border border-slate-350 rounded-2xl overflow-hidden bg-white text-slate-800 w-full max-w-4xl mx-auto">
        <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-350 text-center py-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dayName => (
            <span key={dayName} className="text-[10px] font-bold text-slate-650 uppercase tracking-wider">{dayName}</span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((cell, idx) => {
            const details = getDailyDetails(cell.date);
            let cellBg = 'bg-white';
            if (!cell.isCurrentMonth) {
              cellBg = 'bg-slate-50 text-slate-300';
            } else if (details.coincidenTodos) {
              cellBg = 'bg-rose-100 text-rose-900 border border-rose-250';
            } else if (details.vacacionando.length > 0) {
              cellBg = 'bg-amber-50/70 border-amber-250';
            }

            return (
              <div key={idx} className={`min-h-[85px] border-r border-b border-slate-200 p-1 flex flex-col justify-between ${cellBg}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-black rounded-full w-4.5 h-4.5 flex items-center justify-center ${
                    cell.isCurrentMonth ? 'text-slate-800' : 'text-slate-300'
                  }`}>
                    {cell.day}
                  </span>
                  <div className="flex gap-0.5 items-center">
                    {details.cumples && details.cumples.length > 0 && <span className="text-[9px]">🎂</span>}
                    {details.santos && details.santos.length > 0 && <span className="text-[9px] text-amber-500 font-bold">✨</span>}
                  </div>
                </div>

                <div className="space-y-0.5 mt-1 text-[7.5px] flex-1 flex flex-col justify-end overflow-hidden">
                  {details.vacacionando.length > 0 && <div className="font-bold text-[7px] text-slate-500 truncate">📍 {details.sitios.join(' & ')}</div>}
                  
                  {/* Vacaciones */}
                  <div className="flex flex-wrap gap-0.5 max-h-5 overflow-hidden">
                    {details.vacacionando.slice(0, 3).map((pers, pIdx) => (
                      <span key={pIdx} className="px-1 py-0.2 bg-amber-100 text-amber-900 border border-amber-200 rounded text-[6.5px] font-medium truncate">
                        {pers.split(' ')[0]}
                      </span>
                    ))}
                  </div>

                  {/* Cumpleaños */}
                  {details.cumples && details.cumples.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      {details.cumples.map((cum, cIdx) => (
                        <span key={cIdx} className="px-1 py-0.2 bg-pink-100 text-pink-900 border border-pink-200 rounded text-[6.5px] font-black truncate">
                          🎂 {cum.nombre.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Santos */}
                  {details.santos && details.santos.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      {details.santos.map((santoName, sIdx) => (
                        <span key={sIdx} className="px-1 py-0.2 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded text-[6.5px] font-bold truncate">
                          ✨ {santoName.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPrintTree = () => {
    return (
      <div className="space-y-6 bg-white p-2 max-w-5xl mx-auto text-slate-800">
        <div className="scale-[0.8] origin-top space-y-6">
          {/* Abuelos */}
          {misPadres.length > 0 && (
            <div className="flex flex-col items-center space-y-2">
              <span className="text-[8px] uppercase font-bold text-slate-400">Abuelos 👴👵</span>
              <div className="flex gap-4 justify-center">
                {misPadres.map(padre => {
                  const abuelosDeRama = padre.padres 
                    ? padre.padres.map(gpName => integrantes.find(i => i.nombre === gpName)).filter(Boolean)
                    : [];
                  return (
                    <div key={padre.id} className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col items-center min-w-[180px]">
                      <span className="text-[7.5px] uppercase font-bold text-indigo-600 mb-1">
                        Rama de {padre.nombre.split(' ')[0]}
                      </span>
                      <div className="flex justify-center gap-1.5">
                        {abuelosDeRama.map(abuelo => (
                          <div key={abuelo.id} className="bg-amber-500 text-white p-1.5 rounded-lg text-center w-24 border border-amber-300">
                            <p className="font-bold text-[9px] truncate">{abuelo.nombre}</p>
                            <span className="bg-amber-700/40 text-amber-100 text-[6.5px] font-bold px-1 py-0.2 rounded-full uppercase">Abuelo/a</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="w-0.5 h-3 bg-slate-350"></div>
            </div>
          )}

          {/* Padres */}
          {misPadres.length > 0 && (
            <div className="flex flex-col items-center">
              <span className="text-[8px] uppercase font-bold text-slate-400">Padres 👩‍🍼👨‍🍼</span>
              <div className="flex justify-center gap-3 mt-1">
                {misPadres.map(padre => (
                  <div key={padre.id} className="bg-rose-500 text-white p-1.5 rounded-lg text-center w-32 border border-rose-300">
                    <p className="font-bold text-[9px] truncate">{padre.nombre}</p>
                    <span className="bg-rose-700/40 text-rose-100 text-[6.5px] font-bold px-1 py-0.2 rounded-full uppercase">Progenitor</span>
                  </div>
                ))}
              </div>
              <div className="w-0.5 h-3 bg-slate-350"></div>
              <div className="w-5/6 h-0.5 bg-slate-200 mb-3"></div>
            </div>
          )}

          {/* Sibling columns */}
          <div className="grid grid-cols-7 gap-2.5 text-center">
            {hermanosAgrupadosConParejas.map((rama, idx) => {
              const herm = rama.hermano;
              const pareja = rama.pareja;
              const hijos = rama.hijos;
              if (!herm) return null;

              return (
                <div key={idx} className="flex flex-col items-center bg-slate-50/50 p-2 rounded-lg border border-slate-200 relative">
                  <div className="space-y-1 w-full">
                    <div className="bg-white p-1.5 rounded-md border border-emerald-250 shadow-3xs">
                      <p className="font-bold text-[8.5px] text-slate-800 truncate">{herm.nombre}</p>
                      <span className="bg-emerald-55 text-emerald-800 text-[6px] font-bold px-1 py-0.2 rounded uppercase">Hermano/a</span>
                    </div>

                    {pareja ? (
                      <div className="space-y-0.5">
                        <div className="text-[7.5px]">❤️</div>
                        <div className="bg-white p-1.5 rounded-md border border-indigo-250 shadow-3xs">
                          <p className="font-bold text-[8.5px] text-slate-800 truncate">{pareja.nombre}</p>
                          <span className="bg-indigo-55 text-indigo-800 text-[6px] font-bold px-1 py-0.2 rounded uppercase">Cuñado/a</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[7px] text-slate-400 italic">Sin pareja</div>
                    )}
                  </div>

                  {hijos && hijos.length > 0 && (
                    <div className="w-full space-y-1 pt-1 border-t border-dashed border-slate-300 mt-1.5">
                      <div className="space-y-1">
                        {hijos.map((hijo, hIdx) => (
                          <div key={hIdx} className="bg-sky-50/80 p-1 rounded border border-sky-100 text-[7.5px]">
                            <p className="font-bold text-sky-950 truncate">👶 {hijo.nombre}</p>
                            {hijo.fechaNacimiento && (
                              <p className="text-[6.2px] text-sky-600 bg-sky-50 px-1 py-0.2 rounded truncate mt-0.5">
                                📅 {formatearFechaStr(hijo.fechaNacimiento).replace(/ \d{4}/, '')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // --- 6. ACCIONES DE ESCRITURA ---
  const handleAddVacation = async (e) => {
    e.preventDefault();
    if (!newVacation.lugar || !newVacation.fechaInicio || !newVacation.fechaFin || !newVacation.quienes || newVacation.quienes.length === 0) {
      triggerToast('Completa el destino, las fechas e indica quiénes viajan.');
      return;
    }

    const mapUrl = newVacation.ubicacionUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newVacation.lugar)}`;
    const vacData = {
      lugar: newVacation.lugar,
      ubicacionUrl: mapUrl,
      fechaInicio: newVacation.fechaInicio,
      fechaFin: newVacation.fechaFin,
      quienes: newVacation.quienes,
      nota: newVacation.nota || ''
    };

    const isLocalVacId = typeof editingVacationId === 'string' && editingVacationId.startsWith('v_');

    if (isCloudMode && user && !isLocalMode) {
      try {
        if (isEditingVacation && !isLocalVacId) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'vacaciones', editingVacationId);
          await updateDoc(docRef, vacData);
          triggerToast('🎉 Vacaciones actualizadas en la nube.');
        } else {
          const col = collection(db, 'artifacts', appId, 'public', 'data', 'vacaciones');
          await addDoc(col, vacData);
          triggerToast('☀️ ¡Vacaciones creadas en la nube familiar!');
        }
        setNewVacation({ lugar: '', ubicacionUrl: '', fechaInicio: '', fechaFin: '', quienes: [], nota: '' });
        setShowVacationModal(false);
        setIsEditingVacation(false);
        setEditingVacationId(null);
      } catch (err) {
        console.error(err);
        triggerToast(`Error al guardar en la nube: ${err.message || 'Permiso denegado'}`);
      }
    } else {
      if (isEditingVacation) {
        const updated = vacaciones.map(v => v.id === editingVacationId ? { ...v, ...vacData } : v);
        setVacaciones(updated);
        persistLocal('vacaciones', updated);
        triggerToast('🎉 Vacaciones actualizadas correctamente.');
      } else {
        const updated = [...vacaciones, { id: 'v_' + Date.now(), ...vacData }];
        setVacaciones(updated);
        persistLocal('vacaciones', updated);
        triggerToast('☀️ ¡Vacaciones guardadas localmente!');
      }
      setNewVacation({ lugar: '', ubicacionUrl: '', fechaInicio: '', fechaFin: '', quienes: [], nota: '' });
      setShowVacationModal(false);
      setIsEditingVacation(false);
      setEditingVacationId(null);
    }
  };

  const startEditVacation = (vac) => {
    if (!vac) return;
    setNewVacation({
      lugar: vac.lugar || '',
      ubicacionUrl: vac.ubicacionUrl || '',
      fechaInicio: vac.fechaInicio || '',
      fechaFin: vac.fechaFin || '',
      quienes: vac.quienes || [],
      nota: vac.nota || ''
    });
    setEditingVacationId(vac.id);
    setIsEditingVacation(true);
    setShowVacationModal(true);
  };

  const parseDictadoVacaciones = (texto) => {
    const lineas = texto.split('\n');
    let mesActual = 7; // Julio por defecto
    const anio = 2026; // Año del localTime actual
    const resultados = [];

    const mesesMap = {
      'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
      'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
    };

    for (let linea of lineas) {
      linea = linea.trim();
      if (!linea) continue;

      // Detectar si la línea define un mes, ej: "Julio:", "Agosto:"
      const mesMatch = linea.match(/^(julio|agosto|septiembre|octubre|noviembre|diciembre|enero|febrero|marzo|abril|mayo|junio)\s*:?\s*$/i);
      if (mesMatch) {
        mesActual = mesesMap[mesMatch[1].toLowerCase()];
        continue;
      }

      // Buscar si hay mención explícita de un mes en la línea, ej: "19 de agosto"
      let mesLinea = mesActual;
      const mesEnLineaMatch = linea.match(/de\s+(julio|agosto|septiembre|octubre|noviembre|diciembre|enero|febrero|marzo|abril|mayo|junio)/i);
      if (mesEnLineaMatch) {
        mesLinea = mesesMap[mesEnLineaMatch[1].toLowerCase()];
      }

      // Intentar emparejar rangos de fechas:
      // 1. "del 1 Hasta el 10" o "del 10 al 14" o "del 16 al 26"
      // 2. "13-17" o "13 a 17"
      // 3. "el 23" o iniciando con número
      let diaInicio = null;
      let diaFin = null;
      let restoTexto = '';

      const rangoRegex1 = /(?:del|de|desde)\s+(\d+)\s+(?:hasta\s+el|al|a)\s+(\d+)/i;
      const rangoRegex2 = /(\d+)\s*(?:-|a)\s*(\d+)/;
      const diaUnicoRegex = /(?:el|día|^)\s*(\d+)\b/i;

      let match = linea.match(rangoRegex1);
      if (match) {
        diaInicio = parseInt(match[1]);
        diaFin = parseInt(match[2]);
        restoTexto = linea.replace(rangoRegex1, '').replace(/^[:\s\-*]+|[:\s\-*]+$/g, '').trim();
      } else {
        match = linea.match(rangoRegex2);
        if (match) {
          diaInicio = parseInt(match[1]);
          diaFin = parseInt(match[2]);
          restoTexto = linea.replace(rangoRegex2, '').replace(/^[:\s\-*]+|[:\s\-*]+$/g, '').trim();
        } else {
          match = linea.match(diaUnicoRegex);
          if (match) {
            diaInicio = parseInt(match[1]);
            diaFin = diaInicio;
            restoTexto = linea.replace(diaUnicoRegex, '').replace(/^[:\s\-*]+|[:\s\-*]+$/g, '').trim();
          }
        }
      }

      if (diaInicio !== null) {
        if (mesEnLineaMatch) {
          restoTexto = restoTexto.replace(mesEnLineaMatch[0], '').replace(/^[:\s\-*]+|[:\s\-*]+$/g, '').trim();
        }

        let lugar = 'Destino Familiar';
        let nota = '';

        const parentesisMatch = restoTexto.match(/\(([^)]+)\)/);
        if (parentesisMatch) {
          nota = parentesisMatch[1];
          restoTexto = restoTexto.replace(parentesisMatch[0], '').trim();
        }

        let limpio = restoTexto.replace(/^[:\s\-*]+|[:\s\-*]+$/g, '').trim();
        
        let lugarDetectado = '';
        const lugaresClave = ['esgaravita', 'llanes', 'ribera', 'munibañez', 'munibáñez', 'polonia', 'alicante', 'sevilla', 'chiclana'];
        for (const lc of lugaresClave) {
          if (limpio.toLowerCase().includes(lc)) {
            lugarDetectado = lc.charAt(0).toUpperCase() + lc.slice(1);
            if (lc === 'ribera') lugarDetectado = 'La Ribera';
            if (lc === 'munibañez' || lc === 'munibáñez') lugarDetectado = 'Munibáñez';
            break;
          }
        }

        if (lugarDetectado) {
          lugar = lugarDetectado;
          let extraNota = limpio.replace(new RegExp(lugarDetectado, 'i'), '').replace(/^in|en|la\s+/i, '').replace(/^[:\s\-*,]+|[:\s\-*,]+$/g, '').trim();
          if (extraNota) {
            nota = nota ? `${nota} - ${extraNota}` : extraNota;
          }
        } else if (limpio) {
          lugar = limpio.charAt(0).toUpperCase() + limpio.slice(1);
        }

        const MM = String(mesLinea).padStart(2, '0');
        const DD_inicio = String(diaInicio).padStart(2, '0');
        const DD_fin = String(diaFin).padStart(2, '0');

        resultados.push({
          id: 'temp_' + Date.now() + Math.random().toString(36).substr(2, 5),
          lugar: lugar,
          fechaInicio: `${anio}-${MM}-${DD_inicio}`,
          fechaFin: `${anio}-${MM}-${DD_fin}`,
          nota: nota,
          quienes: [usuarioActivo]
        });
      }
    }

    setParsedImportList(resultados);
  };

  const handleSaveImportedVacations = async () => {
    if (!parsedImportList || parsedImportList.length === 0) {
      triggerToast('No hay tramos detectados para guardar.');
      return;
    }

    const validTramos = parsedImportList.filter(t => t.lugar && t.fechaInicio && t.fechaFin && t.quienes && t.quienes.length > 0);

    if (validTramos.length === 0) {
      triggerToast('Por favor, selecciona al menos un familiar viajero por tramo.');
      return;
    }

    if (isCloudMode && user && !isLocalMode) {
      try {
        const col = collection(db, 'artifacts', appId, 'public', 'data', 'vacaciones');
        const savePromises = validTramos.map(tramo => {
          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tramo.lugar)}`;
          return addDoc(col, {
            lugar: tramo.lugar,
            ubicacionUrl: mapUrl,
            fechaInicio: tramo.fechaInicio,
            fechaFin: tramo.fechaFin,
            quienes: tramo.quienes,
            nota: tramo.nota || ''
          });
        });
        await Promise.all(savePromises);
        triggerToast(`🎉 ¡Creados ${validTramos.length} tramos de vacaciones en la nube!`);
        setShowImportModal(false);
        setImportText('');
        setParsedImportList([]);
      } catch (err) {
        console.error(err);
        triggerToast(`Error al guardar vacaciones: ${err.message || 'Permiso denegado'}`);
      }
    } else {
      const newTramos = validTramos.map(tramo => {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tramo.lugar)}`;
        return {
          id: 'v_' + Date.now() + Math.random().toString(36).substr(2, 5),
          lugar: tramo.lugar,
          ubicacionUrl: mapUrl,
          fechaInicio: tramo.fechaInicio,
          fechaFin: tramo.fechaFin,
          quienes: tramo.quienes,
          nota: tramo.nota || ''
        };
      });
      const updated = [...vacaciones, ...newTramos];
      setVacaciones(updated);
      persistLocal('vacaciones', updated);
      triggerToast(`🎉 ¡Creados ${validTramos.length} tramos localmente!`);
      setShowImportModal(false);
      setImportText('');
      setParsedImportList([]);
    }
  };


  const handleClearAllVacations = async () => {
    if (isCloudMode && user && !isLocalMode) {
      try {
        const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'vacaciones');
        const snapshot = await getDocs(colRef);
        
        const deletePromises = snapshot.docs.map(docSnap => 
          deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vacaciones', docSnap.id))
        );
        
        await Promise.all(deletePromises);
        triggerToast('🗑️ Se han eliminado todas las vacaciones en la nube.');
        setShowConfirmResetModal(false);
      } catch (error) {
        console.error(error);
        triggerToast(`Error al vaciar en la nube: ${error.message || 'Permiso denegado'}`);
      }
    } else {
      setVacaciones([]);
      persistLocal('vacaciones', []);
      triggerToast('🗑️ Se han eliminado todas las vacaciones.');
      setShowConfirmResetModal(false);
    }
  };

  const toggleQuienVacacion = (nombre) => {
    const quienes = newVacation.quienes || [];
    const index = quienes.indexOf(nombre);
    if (index === -1) {
      setNewVacation({ ...newVacation, quienes: [...quienes, nombre] });
    } else {
      setNewVacation({
        ...newVacation,
        quienes: quienes.filter(q => q !== nombre)
      });
    }
  };

  const handleSaveCumple = async (e) => {
    e.preventDefault();
    if (!newCumple.nombre) {
      triggerToast('Escribe el nombre del familiar.');
      return;
    }

    const cumpleData = {
      nombre: newCumple.nombre,
      fecha: `${newCumple.mes}-${newCumple.dia}`,
      parentesco: newCumple.parentesco,
      santo: newCumple.santo || ''
    };

    const isLocalCumpleId = typeof editingCumpleId === 'string' && editingCumpleId.startsWith('c_');

    if (isCloudMode && user && !isLocalMode) {
      try {
        if (isEditingCumple && !isLocalCumpleId) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cumpleanos', editingCumpleId);
          await updateDoc(docRef, cumpleData);
          triggerToast('🎉 Cumpleaños actualizado en la nube.');
        } else {
          const col = collection(db, 'artifacts', appId, 'public', 'data', 'cumpleanos');
          await addDoc(col, cumpleData);
          triggerToast('🎉 Cumpleaños guardado en la nube.');
        }
        setNewCumple({ nombre: '', dia: '01', mes: '01', parentesco: 'Hermano', santo: '' });
        setShowCumpleModal(false);
        setIsEditingCumple(false);
        setEditingCumpleId(null);
      } catch (e) {
        console.error(e);
        triggerToast(`Error al guardar cumpleaños: ${e.message || 'Permiso denegado'}`);
      }
    } else {
      if (isEditingCumple) {
        const updated = cumpleanos.map(c => c.id === editingCumpleId ? { ...c, ...cumpleData } : c);
        setCumpleanos(updated);
        persistLocal('cumpleanos', updated);
      } else {
        const updated = [...cumpleanos, { id: 'c_' + Date.now(), ...cumpleData }];
        setCumpleanos(updated);
        persistLocal('cumpleanos', updated);
      }
      setNewCumple({ nombre: '', dia: '01', mes: '01', parentesco: 'Hermano', santo: '' });
      setShowCumpleModal(false);
      setIsEditingCumple(false);
      setEditingCumpleId(null);
      triggerToast('🎉 Cumpleaños guardado correctamente.');
    }
  };

  const startEditCumple = (cumple, focusSanto = false) => {
    if (!cumple) return;
    let dia = '01';
    let mes = '01';
    if (cumple.fecha && typeof cumple.fecha === 'string' && cumple.fecha.includes('-')) {
      const parts = cumple.fecha.split('-');
      if (parts.length === 3) {
        // Formato YYYY-MM-DD
        mes = parts[1] || '01';
        dia = parts[2] || '01';
      } else if (parts.length === 2) {
        // Formato MM-DD
        mes = parts[0] || '01';
        dia = parts[1] || '01';
      }
    }
    setNewCumple({
      nombre: cumple.nombre || '',
      dia: dia.padStart(2, '0'),
      mes: mes.padStart(2, '0'),
      parentesco: cumple.parentesco || 'Hermano',
      santo: cumple.santo || ''
    });
    setEditingCumpleId(cumple.id);
    setIsEditingCumple(true);
    setShowCumpleModal(true);

    if (focusSanto) {
      setTimeout(() => {
        const input = document.getElementById('santo-input');
        if (input) {
          input.focus();
          input.select();
        }
      }, 100);
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.titulo || !newEvent.fecha || !newEvent.lugar) {
      triggerToast('Faltan datos obligatorios de la quedada.');
      return;
    }

    const mapUrl = newEvent.ubicacionUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newEvent.lugar)}`;
    const eventData = {
      titulo: newEvent.titulo,
      fecha: newEvent.fecha,
      hora: newEvent.hora || 'Por concretar',
      lugar: newEvent.lugar,
      ubicacionUrl: mapUrl,
      descripcion: newEvent.descripcion || '',
      asistentes: newEvent.asistentes || []
    };

    const isLocalEventId = typeof editingEventId === 'string' && editingEventId.startsWith('e_');

    if (isCloudMode && user && !isLocalMode) {
      try {
        if (isEditingEvent && !isLocalEventId) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'eventos', editingEventId);
          await updateDoc(docRef, eventData);
          triggerToast('📅 ¡Quedada actualizada en la nube!');
        } else {
          const col = collection(db, 'artifacts', appId, 'public', 'data', 'eventos');
          await addDoc(col, eventData);
          triggerToast('📅 ¡Quedada guardada en la nube!');
        }
        if (notifyTelegramOnEvent) {
          const accionTxt = isEditingEvent ? 'actualizado' : 'propuesto';
          const autorTxt = usuarioActivo.split(' ')[0];
          const msgTg = `🍖 <b>¡Plan familiar ${accionTxt} por ${autorTxt}!</b>\n\n📌 <b>${eventData.titulo}</b>\n📅 Fecha: ${formatearFechaStr(eventData.fecha)} a las ${eventData.hora}\n📍 Lugar: ${eventData.lugar}\n${eventData.descripcion ? `📝 <i>"${eventData.descripcion}"</i>\n` : ''}\n👉 <a href="https://familiabarnuevoapp.web.app">Entrar a la app para confirmar</a>`;
          enviarMensajeTelegram(msgTg);
        }

        setNewEvent({ titulo: '', fecha: '', hora: '', lugar: '', ubicacionUrl: '', descripcion: '', asistentes: [] });
        setShowEventModal(false);
        setIsEditingEvent(false);
        setEditingEventId(null);
      } catch (err) {
        console.error(err);
        triggerToast(`Error al guardar quedada: ${err.message || 'Permiso denegado'}`);
      }
    } else {
      if (isEditingEvent) {
        const updated = eventos.map(evt => evt.id === editingEventId ? { ...evt, ...eventData } : evt);
        setEventos(updated);
        persistLocal('eventos', updated);
        triggerToast('📅 ¡Quedada actualizada localmente!');
      } else {
        const updated = [...eventos, { id: 'e_' + Date.now(), ...eventData }];
        setEventos(updated);
        persistLocal('eventos', updated);
        triggerToast('📅 ¡Quedada guardada localmente!');
      }

      if (notifyTelegramOnEvent) {
        const accionTxt = isEditingEvent ? 'actualizado' : 'propuesto';
        const autorTxt = usuarioActivo.split(' ')[0];
        const msgTg = `🍖 <b>¡Plan familiar ${accionTxt} por ${autorTxt}!</b>\n\n📌 <b>${eventData.titulo}</b>\n📅 Fecha: ${formatearFechaStr(eventData.fecha)} a las ${eventData.hora}\n📍 Lugar: ${eventData.lugar}\n${eventData.descripcion ? `📝 <i>"${eventData.descripcion}"</i>\n` : ''}\n👉 <a href="https://familiabarnuevoapp.web.app">Entrar a la app para confirmar</a>`;
        enviarMensajeTelegram(msgTg);
      }

      setNewEvent({ titulo: '', fecha: '', hora: '', lugar: '', ubicacionUrl: '', descripcion: '', asistentes: [] });
      setShowEventModal(false);
      setIsEditingEvent(false);
      setEditingEventId(null);
    }
  };

  const handleEnviarResumenManualTelegram = async () => {
    try {
      const hoy = new Date();
      const hoyMes = hoy.getMonth() + 1;
      const hoyDia = hoy.getDate();

      const cumplesDeHoy = cumpleanos.filter(c => {
        if (!c.fecha || !c.fecha.includes('-')) return false;
        const [m, d] = c.fecha.split('-');
        return parseInt(m, 10) === hoyMes && parseInt(d, 10) === hoyDia;
      });

      const santosDeHoy = [];
      integrantes.forEach(i => {
        if (i.santo && matchesSaintDate(i.santo, hoy)) {
          santosDeHoy.push({ nombre: i.nombre, santo: i.santo });
        }
      });
      cumpleanos.forEach(c => {
        if (c.santo && matchesSaintDate(c.santo, hoy) && !santosDeHoy.some(s => s.nombre === c.nombre)) {
          santosDeHoy.push({ nombre: c.nombre, santo: c.santo });
        }
      });

      let msg = `📢 <b>Actualización Familia Barnuevo</b>\n\n`;

      if (cumplesDeHoy.length > 0) {
        msg += `🎂 <b>¡Hoy es el cumpleaños de:</b> ${cumplesDeHoy.map(c => c.nombre).join(', ')}! 🎉\n`;
      }
      if (santosDeHoy.length > 0) {
        msg += `✨ <b>¡Hoy es el Santo de:</b> ${santosDeHoy.map(s => `${s.nombre} (${s.santo})`).join(', ')}! 🎊\n`;
      }

      if (proximasCelebraciones30Dias.length > 0) {
        msg += `🗓️ <b>Próximas celebraciones (30 días):</b>\n`;
        proximasCelebraciones30Dias.slice(0, 6).forEach(cel => {
          msg += `• ${cel.tipo === '🎂 Cumpleaños' ? '🎂' : '✨'} <b>${cel.nombre}</b> (${cel.fechaVisual || cel.santoTexto}) - ${cel.diasFaltantes === 0 ? '¡Hoy!' : `Faltan ${cel.diasFaltantes} días`}\n`;
        });
      }

      if ((eventos || []).length > 0) {
        msg += `\n🍖 <b>Planes familiares:</b>\n`;
        eventos.slice(0, 3).forEach(e => {
          msg += `• <b>${e.titulo}</b> (${formatearFechaStr(e.fecha)} - ${e.hora || ''}) en ${e.lugar}\n`;
        });
      }

      msg += `\n👉 <a href="https://familiabarnuevoapp.web.app">Abrir App Familiar</a>`;

      triggerToast('Enviando mensaje a Telegram (Laos)...');
      const ok = await enviarMensajeTelegram(msg);
      if (ok) {
        triggerToast('✈️ ¡Aviso enviado con éxito al grupo de Telegram (Laos)!');
      } else {
        triggerToast('⚠️ Error al enviar el mensaje a Telegram');
      }
    } catch (err) {
      console.error(err);
      triggerToast('⚠️ Error al contactar con Telegram');
    }
  };

  // --- ACCIONES DE CITAS MÉDICAS ---
  const resetCitaForm = () => {
    setNewCita({
      paciente: 'Mamá (Encarnación)',
      especialidad: 'Médico de Cabecera',
      medico: '',
      centro: 'Centro de Salud',
      ubicacionUrl: '',
      fecha: '',
      hora: '10:00',
      acompanante: 'Pendiente de asignar',
      notas: '',
      estado: 'pendiente'
    });
    setShowCitaModal(false);
    setIsEditingCita(false);
    setEditingCitaId(null);
    setCustomAcompananteMode(false);
  };

  const handleSaveCita = async (e) => {
    e.preventDefault();
    if (!newCita.paciente || !newCita.especialidad || !newCita.fecha || !newCita.centro) {
      triggerToast('Completa paciente, especialidad, fecha y centro médico.');
      return;
    }

    const citaData = {
      paciente: newCita.paciente,
      especialidad: newCita.especialidad,
      medico: newCita.medico || '',
      centro: newCita.centro,
      ubicacionUrl: newCita.ubicacionUrl || '',
      fecha: newCita.fecha,
      hora: newCita.hora || '10:00',
      acompanante: newCita.acompanante || 'Pendiente de asignar',
      notas: newCita.notas || '',
      estado: newCita.estado || 'pendiente',
      actualizadoPor: usuarioActivo
    };

    const isLocalCitaId = typeof editingCitaId === 'string' && editingCitaId.startsWith('cit_');

    if (isCloudMode && user && !isLocalMode) {
      try {
        if (isEditingCita && !isLocalCitaId) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'citasMedicas', editingCitaId);
          await updateDoc(docRef, citaData);
          triggerToast('🩺 Cita médica actualizada en la nube');
        } else {
          const col = collection(db, 'artifacts', appId, 'public', 'data', 'citasMedicas');
          await addDoc(col, { ...citaData, creadoEl: new Date().toISOString() });
          triggerToast('🩺 Cita médica guardada en la nube');
        }

        if (notifyTelegramOnCita) {
          const accionTxt = isEditingCita ? 'actualizada' : 'programada';
          const sinAcompanante = !citaData.acompanante || citaData.acompanante === 'Pendiente de asignar';
          const emojiAlerta = sinAcompanante ? '⚠️' : '🏥';
          const msgTg = `${emojiAlerta} <b>Cita Médica ${accionTxt}</b>\n\n` +
            `👤 <b>Paciente:</b> ${citaData.paciente}\n` +
            `🩺 <b>Especialidad:</b> ${citaData.especialidad}\n` +
            (citaData.medico ? `👨‍⚕️ <b>Doctor/a:</b> ${citaData.medico}\n` : '') +
            `🏥 <b>Centro:</b> ${citaData.centro}\n` +
            `📅 <b>Fecha:</b> ${formatearFechaStr(citaData.fecha)} a las ${citaData.hora}\n` +
            `🚗 <b>Acompañante:</b> ${sinAcompanante ? '⚠️ <b>¡Pendiente de asignar! ¿Quién le acompaña?</b>' : citaData.acompanante}\n` +
            (citaData.notas ? `📋 <b>Notas:</b> <i>${citaData.notas}</i>\n` : '') +
            `\n👉 <a href="https://familiabarnuevoapp.web.app">Abrir App para ofrecerse o ver detalles</a>`;
          enviarMensajeTelegram(msgTg);
        }

        resetCitaForm();
      } catch (err) {
        console.error(err);
        triggerToast(`Error al guardar cita: ${err.message || 'Permiso denegado'}`);
      }
    } else {
      if (isEditingCita) {
        const updated = citasMedicas.map(c => c.id === editingCitaId ? { ...c, ...citaData } : c);
        setCitasMedicas(updated);
        persistLocal('citasMedicas', updated);
        triggerToast('🩺 Cita médica actualizada localmente');
      } else {
        const updated = [...citasMedicas, { id: 'cit_' + Date.now(), ...citaData, creadoEl: new Date().toISOString() }];
        setCitasMedicas(updated);
        persistLocal('citasMedicas', updated);
        triggerToast('🩺 Cita médica guardada localmente');
      }
      resetCitaForm();
    }
  };

  const startEditCita = (cita) => {
    if (!cita) return;
    setNewCita({
      paciente: cita.paciente || 'Mamá (Encarnación)',
      especialidad: cita.especialidad || '',
      medico: cita.medico || '',
      centro: cita.centro || '',
      ubicacionUrl: cita.ubicacionUrl || '',
      fecha: cita.fecha || '',
      hora: cita.hora || '10:00',
      acompanante: cita.acompanante || 'Pendiente de asignar',
      notas: cita.notas || '',
      estado: cita.estado || 'pendiente'
    });
    setEditingCitaId(cita.id);
    setIsEditingCita(true);
    const esConocido = !cita.acompanante || cita.acompanante === 'Pendiente de asignar' || integrantes.some(i => i.nombre === cita.acompanante);
    setCustomAcompananteMode(!esConocido);
    setShowCitaModal(true);
  };

  const handleDeleteCita = async (citaId) => {
    if (!confirm('¿Seguro que deseas eliminar esta cita médica?')) return;
    const isLocal = typeof citaId === 'string' && citaId.startsWith('cit_');
    if (isCloudMode && user && !isLocalMode && !isLocal) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'citasMedicas', citaId));
        triggerToast('🗑️ Cita médica eliminada.');
      } catch (err) {
        console.error(err);
        triggerToast(`Error al eliminar cita: ${err.message}`);
      }
    } else {
      const updated = citasMedicas.filter(c => c.id !== citaId);
      setCitasMedicas(updated);
      persistLocal('citasMedicas', updated);
      triggerToast('🗑️ Cita médica eliminada.');
    }
  };

  const handleToggleEstadoCita = async (cita) => {
    const nuevoEstado = cita.estado === 'completada' ? 'pendiente' : 'completada';
    const isLocal = typeof cita.id === 'string' && cita.id.startsWith('cit_');
    if (isCloudMode && user && !isLocalMode && !isLocal) {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'citasMedicas', cita.id), {
          estado: nuevoEstado
        });
        triggerToast(nuevoEstado === 'completada' ? '✅ Cita marcada como completada' : '⏳ Cita reabierta como pendiente');
      } catch (err) {
        console.error(err);
      }
    } else {
      const updated = citasMedicas.map(c => c.id === cita.id ? { ...c, estado: nuevoEstado } : c);
      setCitasMedicas(updated);
      persistLocal('citasMedicas', updated);
      triggerToast(nuevoEstado === 'completada' ? '✅ Cita marcada como completada' : '⏳ Cita reabierta como pendiente');
    }
  };

  const handleAsignarmeComoAcompanante = async (cita) => {
    const acompananteNombre = usuarioActivo;
    const isLocal = typeof cita.id === 'string' && cita.id.startsWith('cit_');
    if (isCloudMode && user && !isLocalMode && !isLocal) {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'citasMedicas', cita.id), {
          acompanante: acompananteNombre
        });
        triggerToast(`🚗 ¡Te has asignado para acompañar a ${cita.paciente}!`);
        enviarMensajeTelegram(`🚗 <b>${acompananteNombre}</b> acompañará a <b>${cita.paciente}</b> a su cita de ${cita.especialidad} (${formatearFechaStr(cita.fecha)} a las ${cita.hora}).`);
      } catch (err) {
        console.error(err);
      }
    } else {
      const updated = citasMedicas.map(c => c.id === cita.id ? { ...c, acompanante: acompananteNombre } : c);
      setCitasMedicas(updated);
      persistLocal('citasMedicas', updated);
      triggerToast(`🚗 ¡Te has asignado para acompañar a ${cita.paciente}!`);
      enviarMensajeTelegram(`🚗 <b>${acompananteNombre}</b> acompañará a <b>${cita.paciente}</b> a su cita de ${cita.especialidad} (${formatearFechaStr(cita.fecha)} a las ${cita.hora}).`);
    }
  };

  const handleEnviarResumenCitasTelegram = async () => {
    const pendientes = citasMedicas
      .filter(c => c.estado !== 'completada' && c.fecha)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    if (pendientes.length === 0) {
      triggerToast('No hay citas médicas pendientes para enviar.');
      return;
    }

    let msg = `🩺 <b>CALENDARIO DE CITAS MÉDICAS FAMILIARES</b>\n\n`;
    pendientes.slice(0, 6).forEach(c => {
      msg += `• <b>${c.paciente}</b>: ${c.especialidad}\n`;
      msg += `  📅 ${formatearFechaStr(c.fecha)} (${c.hora || 'hora por confirmar'})\n`;
      msg += `  📍 ${c.centro}\n`;
      msg += `  🚗 Acompaña: <b>${c.acompanante && c.acompanante !== 'Pendiente de asignar' ? c.acompanante : '⚠️ ¡Pendiente!'}</b>\n`;
      if (c.notas) msg += `  📋 <i>${c.notas}</i>\n`;
      msg += `\n`;
    });
    msg += `👉 <a href="https://familiabarnuevoapp.web.app">Abrir App para ver todas o asignarse</a>`;

    triggerToast('Enviando citas médicas a Telegram (Laos)...');
    const ok = await enviarMensajeTelegram(msg);
    if (ok) {
      triggerToast('✈️ ¡Resumen de citas médicas enviado a Telegram!');
    } else {
      triggerToast('⚠️ Error al enviar el resumen a Telegram.');
    }
  };

  // --- ACCIONES DE TRASLADOS Y ESTANCIAS DE LOS PADRES ---
  const resetTrasladoForm = () => {
    setNewTraslado({
      origen: 'Madrid',
      destino: 'Alcalá (Esgaravita)',
      fecha: '',
      hora: '18:00',
      momentoDia: 'Tarde',
      conductor: 'Pendiente de asignar',
      notas: '',
      estado: 'pendiente'
    });
    setShowTrasladoModal(false);
    setIsEditingTraslado(false);
    setEditingTrasladoId(null);
    setCustomConductorMode(false);
  };

  const handleSaveTraslado = async (e) => {
    e.preventDefault();
    if (!newTraslado.origen || !newTraslado.destino || !newTraslado.fecha) {
      triggerToast('Completa origen, destino y fecha del traslado.');
      return;
    }

    const trasladoData = {
      origen: newTraslado.origen,
      destino: newTraslado.destino,
      fecha: newTraslado.fecha,
      hora: newTraslado.hora || '18:00',
      momentoDia: newTraslado.momentoDia || 'Tarde',
      conductor: newTraslado.conductor || 'Pendiente de asignar',
      notas: newTraslado.notas || '',
      estado: newTraslado.estado || 'pendiente',
      actualizadoPor: usuarioActivo
    };

    const isLocalTrasladoId = typeof editingTrasladoId === 'string' && editingTrasladoId.startsWith('tras_');

    if (isCloudMode && user && !isLocalMode) {
      try {
        if (isEditingTraslado && !isLocalTrasladoId) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'trasladosPadres', editingTrasladoId);
          await updateDoc(docRef, trasladoData);
          triggerToast('🚗 Traslado actualizado en la nube');
        } else {
          const col = collection(db, 'artifacts', appId, 'public', 'data', 'trasladosPadres');
          await addDoc(col, { ...trasladoData, creadoEl: new Date().toISOString() });
          triggerToast('🚗 Traslado guardado en la nube');
        }

        if (notifyTelegramOnTraslado) {
          const accionTxt = isEditingTraslado ? 'actualizado' : 'programado';
          const sinConductor = !trasladoData.conductor || trasladoData.conductor === 'Pendiente de asignar';
          const emojiAlerta = sinConductor ? '⚠️' : '🚗';
          const msgTg = `${emojiAlerta} <b>Traslado de los Padres ${accionTxt}</b>\n\n` +
            `📍 <b>Ruta:</b> ${trasladoData.origen} ➔ ${trasladoData.destino}\n` +
            `📅 <b>Fecha:</b> ${formatearFechaStr(trasladoData.fecha)} (${trasladoData.hora || trasladoData.momentoDia})\n` +
            `👤 <b>Conductor:</b> ${sinConductor ? '⚠️ <b>¡Pendiente de asignar! ¿Quién les lleva?</b>' : trasladoData.conductor}\n` +
            (trasladoData.notas ? `📋 <b>Notas:</b> <i>${trasladoData.notas}</i>\n` : '') +
            `\n👉 <a href="https://familiabarnuevoapp.web.app">Abrir App para ofrecerse o ver detalles</a>`;
          enviarMensajeTelegram(msgTg);
        }

        resetTrasladoForm();
      } catch (err) {
        console.error(err);
        triggerToast(`Error al guardar traslado: ${err.message || 'Permiso denegado'}`);
      }
    } else {
      if (isEditingTraslado) {
        const updated = trasladosPadres.map(t => t.id === editingTrasladoId ? { ...t, ...trasladoData } : t);
        setTrasladosPadres(updated);
        persistLocal('trasladosPadres', updated);
        triggerToast('🚗 Traslado actualizado localmente');
      } else {
        const updated = [...trasladosPadres, { id: 'tras_' + Date.now(), ...trasladoData, creadoEl: new Date().toISOString() }];
        setTrasladosPadres(updated);
        persistLocal('trasladosPadres', updated);
        triggerToast('🚗 Traslado guardado localmente');
      }
      resetTrasladoForm();
    }
  };

  const startEditTraslado = (traslado) => {
    if (!traslado) return;
    setNewTraslado({
      origen: traslado.origen || 'Madrid',
      destino: traslado.destino || 'Alcalá (Esgaravita)',
      fecha: traslado.fecha || '',
      hora: traslado.hora || '18:00',
      momentoDia: traslado.momentoDia || 'Tarde',
      conductor: traslado.conductor || 'Pendiente de asignar',
      notas: traslado.notas || '',
      estado: traslado.estado || 'pendiente'
    });
    setEditingTrasladoId(traslado.id);
    setIsEditingTraslado(true);
    const esConocido = !traslado.conductor || traslado.conductor === 'Pendiente de asignar' || integrantes.some(i => i.nombre === traslado.conductor);
    setCustomConductorMode(!esConocido);
    setShowTrasladoModal(true);
  };

  const handleDeleteTraslado = async (trasladoId) => {
    if (!confirm('¿Seguro que deseas eliminar este traslado?')) return;
    const isLocal = typeof trasladoId === 'string' && trasladoId.startsWith('tras_');
    if (isCloudMode && user && !isLocalMode && !isLocal) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'trasladosPadres', trasladoId));
        triggerToast('🗑️ Traslado eliminado.');
      } catch (err) {
        console.error(err);
        triggerToast(`Error al eliminar: ${err.message}`);
      }
    } else {
      const updated = trasladosPadres.filter(t => t.id !== trasladoId);
      setTrasladosPadres(updated);
      persistLocal('trasladosPadres', updated);
      triggerToast('🗑️ Traslado eliminado.');
    }
  };

  const handleToggleEstadoTraslado = async (traslado) => {
    const nuevoEstado = traslado.estado === 'realizado' ? 'pendiente' : 'realizado';
    const isLocal = typeof traslado.id === 'string' && traslado.id.startsWith('tras_');
    if (isCloudMode && user && !isLocalMode && !isLocal) {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'trasladosPadres', traslado.id), {
          estado: nuevoEstado
        });
        if (nuevoEstado === 'realizado') {
          handleChangeUbicacionPadres(traslado.destino, false);
        }
        triggerToast(nuevoEstado === 'realizado' ? `✅ Traslado marcado como realizado (Padres en ${traslado.destino})` : '⏳ Traslado reactivado');
      } catch (err) {
        console.error(err);
      }
    } else {
      const updated = trasladosPadres.map(t => t.id === traslado.id ? { ...t, estado: nuevoEstado } : t);
      setTrasladosPadres(updated);
      persistLocal('trasladosPadres', updated);
      if (nuevoEstado === 'realizado') {
        handleChangeUbicacionPadres(traslado.destino, false);
      }
      triggerToast(nuevoEstado === 'realizado' ? `✅ Traslado marcado como realizado (Padres en ${traslado.destino})` : '⏳ Traslado reactivado');
    }
  };

  const handleAsignarmeComoConductor = async (traslado) => {
    const conductorNombre = usuarioActivo;
    const isLocal = typeof traslado.id === 'string' && traslado.id.startsWith('tras_');
    if (isCloudMode && user && !isLocalMode && !isLocal) {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'trasladosPadres', traslado.id), {
          conductor: conductorNombre
        });
        triggerToast(`🚗 ¡Te has asignado para llevar a los padres!`);
        enviarMensajeTelegram(`🚗 <b>${conductorNombre}</b> se ha ofrecido para llevar a los padres de <b>${traslado.origen} a ${traslado.destino}</b> (${formatearFechaStr(traslado.fecha)} - ${traslado.hora || traslado.momentoDia || ''}). ¡Muchas gracias! 👍`);
      } catch (err) {
        console.error(err);
      }
    } else {
      const updated = trasladosPadres.map(t => t.id === traslado.id ? { ...t, conductor: conductorNombre } : t);
      setTrasladosPadres(updated);
      persistLocal('trasladosPadres', updated);
      triggerToast(`🚗 ¡Te has asignado para llevar a los padres!`);
      enviarMensajeTelegram(`🚗 <b>${conductorNombre}</b> se ha ofrecido para llevar a los padres de <b>${traslado.origen} a ${traslado.destino}</b> (${formatearFechaStr(traslado.fecha)} - ${traslado.hora || traslado.momentoDia || ''}). ¡Muchas gracias! 👍`);
    }
  };

  const handleChangeUbicacionPadres = async (nuevaUbicacion, notify = true) => {
    setUbicacionActualPadres(nuevaUbicacion);
    localStorage.setItem('family_app_ubicacion_padres', nuevaUbicacion);

    if (isCloudMode && user && !isLocalMode) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'config_ubicacion_padres');
        await setDoc(docRef, {
          ubicacion: nuevaUbicacion,
          actualizadoPor: usuarioActivo,
          fecha: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn(e);
      }
    }

    triggerToast(`📍 Ubicación de los padres actualizada: ${nuevaUbicacion}`);
    if (notify) {
      enviarMensajeTelegram(`📍 <b>Aviso Familiar:</b> Los padres están actualmente en <b>${nuevaUbicacion}</b> (actualizado por ${usuarioActivo}).`);
    }
  };

  const handleEnviarResumenTrasladosTelegram = async () => {
    const pendientes = trasladosPadres
      .filter(t => t.estado !== 'realizado' && t.fecha)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    if (pendientes.length === 0) {
      triggerToast('No hay traslados pendientes programados.');
      return;
    }

    let msg = `🚗 <b>PLANIFICACIÓN DE TRASLADOS DE LOS PADRES</b>\n`;
    msg += `📍 <b>Ubicación actual:</b> ${ubicacionActualPadres}\n\n`;

    pendientes.slice(0, 6).forEach(t => {
      const sinConductor = !t.conductor || t.conductor === 'Pendiente de asignar';
      msg += `• <b>${t.origen} ➔ ${t.destino}</b>\n`;
      msg += `  📅 ${formatearFechaStr(t.fecha)} (${t.hora || t.momentoDia || ''})\n`;
      msg += `  👤 Conductor: ${sinConductor ? '⚠️ <b>¡SIN ASIGNAR!</b>' : `<b>${t.conductor}</b>`}\n`;
      if (t.notas) msg += `  📋 <i>${t.notas}</i>\n`;
      msg += `\n`;
    });
    msg += `👉 <a href="https://familiabarnuevoapp.web.app">Abrir App Familiar para ver o coordinar</a>`;

    triggerToast('Enviando traslados a Telegram (Laos)...');
    const ok = await enviarMensajeTelegram(msg);
    if (ok) {
      triggerToast('✈️ ¡Resumen de traslados enviado a Telegram!');
    } else {
      triggerToast('⚠️ Error al enviar el resumen a Telegram.');
    }
  };

  const startEditEvent = (evt) => {
    if (!evt) return;
    setNewEvent({
      titulo: evt.titulo || '',
      fecha: evt.fecha || '',
      hora: evt.hora === 'Por concretar' ? '' : (evt.hora || ''),
      lugar: evt.lugar || '',
      ubicacionUrl: evt.ubicacionUrl || '',
      descripcion: evt.descripcion || '',
      asistentes: evt.asistentes || []
    });
    setEditingEventId(evt.id);
    setIsEditingEvent(true);
    setShowEventModal(true);
  };

  const alternarFamiliarEnEvento = async (evtId, asistentesActuales, nombreFamiliar) => {
    const actuales = Array.isArray(asistentesActuales) ? asistentesActuales : [];
    const yaAsiste = actuales.includes(nombreFamiliar);
    const nuevosAsistentes = yaAsiste
      ? actuales.filter(n => n !== nombreFamiliar)
      : [...actuales, nombreFamiliar];

    const isLocalEvtId = typeof evtId === 'string' && evtId.startsWith('e_');

    if (isCloudMode && user && !isLocalMode) {
      try {
        if (!isLocalEvtId) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'eventos', evtId);
          await updateDoc(docRef, { asistentes: nuevosAsistentes });
        } else {
          const localEvt = eventos.find(e => e.id === evtId);
          if (localEvt) {
            const col = collection(db, 'artifacts', appId, 'public', 'data', 'eventos');
            await addDoc(col, {
              titulo: localEvt.titulo,
              fecha: localEvt.fecha,
              hora: localEvt.hora || 'Por concretar',
              lugar: localEvt.lugar,
              ubicacionUrl: localEvt.ubicacionUrl || '',
              descripcion: localEvt.descripcion || '',
              asistentes: nuevosAsistentes
            });
          }
        }
        triggerToast(yaAsiste ? `Se desapuntó a ${nombreFamiliar}` : `¡Apuntado ${nombreFamiliar} al plan!`);
      } catch (e) {
        console.error(e);
        triggerToast(`Error al actualizar asistencia: ${e.message || 'Permiso denegado'}`);
      }
    } else {
      const updated = eventos.map(evt => evt.id === evtId ? { ...evt, asistentes: nuevosAsistentes } : evt);
      setEventos(updated);
      persistLocal('eventos', updated);
      triggerToast(yaAsiste ? `Se desapuntó a ${nombreFamiliar}` : `¡Apuntado ${nombreFamiliar} al plan!`);
    }
  };

  const getVoterKey = () => {
    if (user && user.uid !== 'offline-user' && user.email) {
      return user.email.toLowerCase();
    }
    return usuarioActivo || 'offline-user';
  };

  const obtenerDestinosResumen = (incluirPrefijo = false) => {
    const lugaresUnicos = [
      ...new Set(
        vacaciones
          .map(v => {
            let name = v.lugar || '';
            if (name.toLowerCase().includes('chiclana')) return 'Chiclana';
            if (name.toLowerCase().includes('sevilla')) return 'Sevilla';
            if (name.toLowerCase().includes('munibáñez') || name.toLowerCase().includes('munibañez')) return 'Munibáñez';
            const parts = name.split(' ');
            return parts.slice(0, 2).join(' ');
          })
          .filter(Boolean)
      )
    ];

    if (lugaresUnicos.length === 0) {
      return incluirPrefijo ? 'los destinos familiares' : 'Destinos Familiares';
    }

    if (lugaresUnicos.length === 1) {
      return lugaresUnicos[0];
    }

    if (lugaresUnicos.length === 2) {
      return `${lugaresUnicos[0]} y ${lugaresUnicos[1]}`;
    }

    const ultimo = lugaresUnicos[lugaresUnicos.length - 1];
    const resto = lugaresUnicos.slice(0, -1).join(', ');
    return `${resto} y ${ultimo}`;
  };

  const handleAddIdea = async (e) => {
    e.preventDefault();
    if (!newIdeaText || !newIdeaAuthor) return;

    const voterKey = getVoterKey();
    const ideaData = {
      autor: newIdeaAuthor,
      texto: newIdeaText,
      votos: 1,
      voters: [voterKey]
    };

    if (isCloudMode && user && !isLocalMode) {
      try {
        const col = collection(db, 'artifacts', appId, 'public', 'data', 'ideas');
        await addDoc(col, ideaData);
        triggerToast('💡 Idea enviada al buzón en la nube.');
        setNewIdeaText('');
        setNewIdeaAuthor('');
      } catch (e) {
        console.error(e);
        triggerToast(`Error al enviar idea: ${e.message || 'Permiso denegado'}`);
      }
    } else {
      const updated = [...ideas, { id: 'i_' + Date.now(), ...ideaData }];
      setIdeas(updated);
      persistLocal('ideas', updated);
      triggerToast('💡 Idea enviada al buzón.');
      setNewIdeaText('');
      setNewIdeaAuthor('');
    }
  };

  const handleVotarIdea = async (ideaId, currentVoters = [], currentVotos = 0) => {
    const voterKey = getVoterKey();
    const votersList = Array.isArray(currentVoters) ? currentVoters : [];
    const alreadyVoted = votersList.includes(voterKey);

    let nuevosVoters = [];
    let nuevosVotos = 0;

    if (alreadyVoted) {
      // Toggle: retirar el voto
      nuevosVoters = votersList.filter(v => v !== voterKey);
      nuevosVotos = Math.max(0, currentVotos - 1);
      triggerToast('💔 Voto retirado');
    } else {
      // Toggle: añadir el voto
      nuevosVoters = [...votersList, voterKey];
      nuevosVotos = currentVotos + 1;
      triggerToast('❤️ ¡Voto sumado!');
    }

    const isLocalIdeaId = typeof ideaId === 'string' && ideaId.startsWith('i_');

    if (isCloudMode && user && !isLocalMode) {
      try {
        if (!isLocalIdeaId) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'ideas', ideaId);
          await updateDoc(docRef, { 
            votos: nuevosVotos,
            voters: nuevosVoters
          });
        } else {
          const localIdea = ideas.find(i => i.id === ideaId);
          if (localIdea) {
            const col = collection(db, 'artifacts', appId, 'public', 'data', 'ideas');
            await addDoc(col, {
              autor: localIdea.autor,
              texto: localIdea.texto,
              votos: nuevosVotos,
              voters: nuevosVoters
            });
          }
        }
      } catch (e) {
        console.error(e);
        triggerToast(`Error al votar: ${e.message || 'Permiso denegado'}`);
      }
    } else {
      const updated = ideas.map(id => id.id === ideaId ? { ...id, votos: nuevosVotos, voters: nuevosVoters } : id);
      setIdeas(updated);
      persistLocal('ideas', updated);
    }
  };


  const handleDeleteElement = async (coleccion, docId) => {
    const isLocalId = typeof docId === 'string' && (
      docId.startsWith('m_') || 
      docId.startsWith('v_') || 
      docId.startsWith('e_') || 
      docId.startsWith('c_') || 
      docId.startsWith('i_')
    );

    if (isCloudMode && user && !isLocalMode && !isLocalId) {
      try {
        if (coleccion === 'miembros') {
          const miembroAEliminar = integrantes.find(i => i.id === docId);
          if (miembroAEliminar) {
            const nombreEliminado = miembroAEliminar.nombre;
            // Limpiar a todas las personas que apunten a este miembro como pareja
            const parejasAsociadas = integrantes.filter(i => i.parejaDe === nombreEliminado);
            for (const p of parejasAsociadas) {
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', p.id), { parejaDe: null });
            }
          }
        }
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', coleccion, docId);
        await deleteDoc(docRef);
        triggerToast('Elemento eliminado correctamente.');
      } catch (e) {
        console.error("Error al eliminar de la nube:", e);
        triggerToast(`Error al eliminar: ${e.message || 'Permiso denegado'}`);
      }
    } else {
      let deleted = false;
      if (coleccion === 'miembros') {
        const miembroAEliminar = integrantes.find(i => i.id === docId);
        const nombreEliminado = miembroAEliminar ? miembroAEliminar.nombre : '';
        const updated = integrantes
          .filter(i => i.id !== docId)
          .map(i => i.parejaDe === nombreEliminado ? { ...i, parejaDe: null } : i);
        setIntegrantes(updated);
        persistLocal('miembros', updated);
        deleted = true;
      } else if (coleccion === 'vacaciones') {
        const updated = vacaciones.filter(v => v.id !== docId);
        setVacaciones(updated);
        persistLocal('vacaciones', updated);
        deleted = true;
      } else if (coleccion === 'eventos') {
        const updated = eventos.filter(e => e.id !== docId);
        setEventos(updated);
        persistLocal('eventos', updated);
        deleted = true;
      } else if (coleccion === 'cumpleanos') {
        const updated = cumpleanos.filter(c => c.id !== docId);
        setCumpleanos(updated);
        persistLocal('cumpleanos', updated);
        deleted = true;
      } else if (coleccion === 'ideas') {
        const updated = ideas.filter(i => i.id !== docId);
        setIdeas(updated);
        persistLocal('ideas', updated);
        deleted = true;
      }
      if (deleted) {
        triggerToast('Elemento eliminado correctamente.');
      }
    }
  };

  const handleCalendarPrevMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
  };

  const handleCalendarNextMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const primerDiaSemana = new Date(year, month, 1).getDay();
    const offset = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

    const diasTotalesMes = new Date(year, month + 1, 0).getDate();
    const diasTotalesMesAnterior = new Date(year, month, 0).getDate();

    const result = [];

    for (let i = offset - 1; i >= 0; i--) {
      result.push({
        day: diasTotalesMesAnterior - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, diasTotalesMesAnterior - i)
      });
    }

    for (let i = 1; i <= diasTotalesMes; i++) {
      result.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      result.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    return result;
  }, [currentCalendarDate]);

  const getDailyDetails = (date) => {
    const dDia = String(date.getDate()).padStart(2, '0');
    const dMes = String(date.getMonth() + 1).padStart(2, '0');
    const dFechaCumple = `${dMes}-${dDia}`;

    const personasEnVacaciones = [];
    const sitiosVacaciones = [];
    let primaryVacationId = null;
    let primaryVacationLugar = null;
    
    vacaciones.forEach(v => {
      if (!v || !v.fechaInicio || !v.fechaFin) return;
      const start = new Date(v.fechaInicio);
      const end = new Date(v.fechaFin);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

      const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      current.setHours(0,0,0,0);

      if (current >= start && current <= end) {
        personasEnVacaciones.push(...(v.quienes || []));
        sitiosVacaciones.push(v.lugar || 'Desconocido');
        if (!primaryVacationId) {
          primaryVacationId = v.id;
          primaryVacationLugar = v.lugar;
        }
      }
    });

    // 1. Cumpleaños de hoy (coincidiendo por fecha "MM-DD" o buscando en miembros por su fechaNacimiento)
    const cumplesHoy = cumpleanos.filter(c => {
      if (!c || !c.fecha) return false;
      if (c.fecha === dFechaCumple) return true;
      if (c.fecha.length === 10 && c.fecha.substring(5) === dFechaCumple) return true;
      return false;
    });

    // También buscar en integrantes por si tienen fechaNacimiento y no están en la colección de cumpleanos
    integrantes.forEach(i => {
      if (i && i.fechaNacimiento && typeof i.fechaNacimiento === 'string') {
        const partes = i.fechaNacimiento.split('-');
        if (partes.length === 3 && `${partes[1]}-${partes[2]}` === dFechaCumple) {
          const nombreSimple = i.nombre.split(' ')[0];
          if (!cumplesHoy.some(c => c.nombre === i.nombre || c.nombre === nombreSimple)) {
            cumplesHoy.push({
              nombre: i.nombre,
              fecha: `${partes[1]}-${partes[2]}`,
              parentesco: i.rol === 'Hermanos' ? 'Hermano/a' : i.rol === 'Cuñados' ? 'Cuñado/a' : i.rol === 'Hijos' ? 'Sobrino/Hijo' : i.rol,
              santo: i.santo || ''
            });
          }
        }
      }
    });

    // 2. Santos de hoy (onomásticas)
    const santosHoy = [];
    integrantes.forEach(i => {
      if (i && i.santo && matchesSaintDate(i.santo, date)) {
        santosHoy.push(i.nombre);
      }
    });
    cumpleanos.forEach(c => {
      if (c && c.santo && matchesSaintDate(c.santo, date) && !santosHoy.includes(c.nombre)) {
        santosHoy.push(c.nombre);
      }
    });

    const distinctPersonas = [...new Set(personasEnVacaciones)];
    
    // Filtrar para mostrar ÚNICAMENTE a los hermanos
    const hermanosVacacionando = distinctPersonas.filter(esHermano);
    
    const totalHermanos = integrantes.filter(i => i.rol === 'Hermanos').length || 7;
    const vanTodosLosHermanos = hermanosVacacionando.length >= totalHermanos;

    const esGranCoincidencia = distinctPersonas.length >= 4;

    return {
      vacacionando: distinctPersonas,
      adultosVacacionando: hermanosVacacionando, // Asignar únicamente los hermanos
      vanTodosLosHermanos: vanTodosLosHermanos,
      sitios: [...new Set(sitiosVacaciones)],
      cumples: cumplesHoy,
      santos: santosHoy,
      coincidenTodos: esGranCoincidencia,
      planId: primaryVacationId,
      planLugar: primaryVacationLugar
    };
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.nombre) return;

    const finalRol = newMember.tipoFamiliar === 'Abuelos' ? 'Padres' : newMember.tipoFamiliar;

    const padresArray = [];
    if (newMember.padre1 && newMember.tipoFamiliar === 'Hijos') padresArray.push(newMember.padre1);
    if (newMember.padre2 && newMember.tipoFamiliar === 'Hijos') padresArray.push(newMember.padre2);

    const padrinosArray = [];
    if (newMember.padrinoMadrina && newMember.tipoFamiliar === 'Hijos') padrinosArray.push(newMember.padrinoMadrina);

    const memberData = {
      nombre: newMember.nombre,
      rol: finalRol,
      parejaDe: (newMember.tipoFamiliar === 'Hermanos' || newMember.tipoFamiliar === 'Cuñados') ? (newMember.parejaDe || null) : null,
      padres: padresArray.length > 0 ? padresArray : null,
      padrinos: padrinosArray.length > 0 ? padrinosArray : null,
      santo: newMember.santo || 'No especificado',
      email: newMember.email || null,
      fechaNacimiento: newMember.fechaNacimiento || null
    };

    if (isCloudMode && user && !isLocalMode) {
      try {
        const colMiem = collection(db, 'artifacts', appId, 'public', 'data', 'miembros');
        await addDoc(colMiem, memberData);

        // Sincronizar automáticamente con el listado de cumpleaños
        if (memberData.fechaNacimiento) {
          await syncBirthdayFromMember(memberData.nombre, memberData.fechaNacimiento, newMember.tipoFamiliar, memberData.santo);
        }

        if (memberData.parejaDe) {
          const otroMiembro = integrantes.find(i => i.nombre === memberData.parejaDe);
          if (otroMiembro) {
            // A. Limpiar ex-parejas del otro miembro para evitar duplicados
            const exParejas = integrantes.filter(i => i.id !== otroMiembro.id && i.parejaDe === memberData.parejaDe);
            for (const exP of exParejas) {
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', exP.id), { parejaDe: null });
            }
            // B. Limpiar a cualquier otra persona que apunte al nuevo miembro como pareja
            const exParejasDeNuevo = integrantes.filter(i => i.nombre !== memberData.parejaDe && i.parejaDe === newMember.nombre);
            for (const exP of exParejasDeNuevo) {
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', exP.id), { parejaDe: null });
            }
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'miembros', otroMiembro.id);
            await updateDoc(docRef, { parejaDe: newMember.nombre });
          }
        }

        // Vincular automáticamente como padre/madre directo de TODOS los Hermanos (si es Padres)
        if (newMember.tipoFamiliar === 'Padres') {
          const hermanos = integrantes.filter(i => i.rol === 'Hermanos');
          for (const herm of hermanos) {
            const nuevosPadres = herm.padres ? [...herm.padres] : [];
            if (!nuevosPadres.includes(newMember.nombre)) {
              nuevosPadres.push(newMember.nombre);
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', herm.id), { padres: nuevosPadres });
            }
          }
        }

        // Vincular automáticamente como padre/madre del hijo/a asociado/a si es Abuelo
        if (newMember.tipoFamiliar === 'Abuelos' && newMember.hijoAsociado) {
          const hijoMiembro = integrantes.find(i => i.nombre === newMember.hijoAsociado);
          if (hijoMiembro) {
            const nuevosPadres = hijoMiembro.padres ? [...hijoMiembro.padres] : [];
            if (!nuevosPadres.includes(newMember.nombre)) {
              nuevosPadres.push(newMember.nombre);
            }
            const docRefHijo = doc(db, 'artifacts', appId, 'public', 'data', 'miembros', hijoMiembro.id);
            await updateDoc(docRefHijo, { padres: nuevosPadres });
          }
        }

        triggerToast(`¡${newMember.nombre} añadido correctamente a la nube!`);
        setNewMember({ nombre: '', rol: 'Hermanos', tipoFamiliar: 'Hermanos', parejaDe: '', padre1: '', padre2: '', padrinoMadrina: '', santo: '', hijoAsociado: '', email: '', fechaNacimiento: '' });
        setShowMemberModal(false);
      } catch (e) {
        console.error(e);
        triggerToast(`Error al añadir familiar: ${e.message || 'Permiso denegado'}`);
      }
    } else {
      const newId = 'm_' + Date.now();
      let updated = [...integrantes, { id: newId, ...memberData }];
      
      if (memberData.parejaDe) {
        updated = updated.map(i => {
          // A. Limpiar ex-pareja del otro miembro
          if (i.nombre !== memberData.parejaDe && i.parejaDe === memberData.parejaDe) {
            return { ...i, parejaDe: null };
          }
          // B. Limpiar a cualquier otra persona apuntando al nuevo miembro
          if (i.nombre !== memberData.parejaDe && i.parejaDe === newMember.nombre) {
            return { ...i, parejaDe: null };
          }
          // C. Enlazar
          if (i.nombre === memberData.parejaDe) {
            return { ...i, parejaDe: newMember.nombre };
          }
          return i;
        });
      }

      // Sincronizar cumpleaños local
      if (memberData.fechaNacimiento) {
        const partes = memberData.fechaNacimiento.split('-');
        if (partes.length === 3) {
          const mesDia = `${partes[1]}-${partes[2]}`;
          let parentesco = 'Familiar';
          if (newMember.tipoFamiliar === 'Hermanos') parentesco = 'Hermano/a';
          else if (newMember.tipoFamiliar === 'Cuñados') parentesco = 'Cuñado/a';
          else if (newMember.tipoFamiliar === 'Hijos') parentesco = 'Sobrino/Hijo';
          else if (newMember.tipoFamiliar === 'Padres') parentesco = 'Padres';
          else if (newMember.tipoFamiliar === 'Abuelos') parentesco = 'Abuelos';

          const cumpleData = {
            nombre: memberData.nombre,
            fecha: mesDia,
            parentesco: parentesco,
            santo: memberData.santo || ''
          };
          const existente = cumpleanos.find(c => c && c.nombre === memberData.nombre);
          let updatedCumples;
          if (existente) {
            updatedCumples = cumpleanos.map(c => c.id === existente.id ? { ...c, ...cumpleData } : c);
          } else {
            updatedCumples = [...cumpleanos, { id: 'c_' + Date.now(), ...cumpleData }];
          }
          setCumpleanos(updatedCumples);
          persistLocal('cumpleanos', updatedCumples);
        }
      }

      // Vincular automáticamente como padres de todos los Hermanos
      if (newMember.tipoFamiliar === 'Padres') {
        updated = updated.map(i => {
          if (i.rol === 'Hermanos') {
            const nuevosPadres = i.padres ? [...i.padres] : [];
            if (!nuevosPadres.includes(newMember.nombre)) {
              nuevosPadres.push(newMember.nombre);
            }
            return { ...i, padres: nuevosPadres };
          }
          return i;
        });
      }

      // Vincular automáticamente local Abuelo
      if (newMember.tipoFamiliar === 'Abuelos' && newMember.hijoAsociado) {
        updated = updated.map(i => {
          if (i.nombre === newMember.hijoAsociado) {
            const nuevosPadres = i.padres ? [...i.padres] : [];
            if (!nuevosPadres.includes(newMember.nombre)) {
              nuevosPadres.push(newMember.nombre);
            }
            return { ...i, padres: nuevosPadres };
          }
          return i;
        });
      }
      
      setIntegrantes(updated);
      persistLocal('miembros', updated);
      triggerToast(`¡${newMember.nombre} añadido correctamente!`);
      setNewMember({ nombre: '', rol: 'Hermanos', tipoFamiliar: 'Hermanos', parejaDe: '', padre1: '', padre2: '', padrinoMadrina: '', santo: '', hijoAsociado: '', email: '', fechaNacimiento: '' });
      setShowMemberModal(false);
    }
  };

  const startEditMember = (miembro) => {
    if (!miembro) return;

    const match = miembro.nombre.match(/^([^(]+)\s*\(([^)]+)\)$/);
    const nombreBase = match ? match[1].trim() : miembro.nombre;
    const pseudonimo = match ? match[2].trim() : '';

    const padres = miembro.padres || [];
    const padrinos = miembro.padrinos || [];

    const hijo = integrantes.find(i => i.padres && i.padres.includes(miembro.nombre));
    const hijoAsociado = hijo ? hijo.nombre : '';

    const esAbuelo = miembro.rol === 'Padres' && hijo && hijo.rol === 'Padres';
    const tipoFamiliar = esAbuelo ? 'Abuelos' : miembro.rol;

    setEditingMemberId(miembro.id);
    setEditingMemberOldNombre(miembro.nombre);
    setEditMemberForm({
      nombreBase: nombreBase,
      pseudonimo: pseudonimo,
      santo: miembro.santo || '',
      rol: miembro.rol || 'Hermanos',
      tipoFamiliar: tipoFamiliar || 'Hermanos',
      parejaDe: miembro.parejaDe || '',
      padre1: padres[0] || '',
      padre2: padres[1] || '',
      padrinoMadrina: padrinos[0] || '',
      email: miembro.email || '',
      hijoAsociado: hijoAsociado,
      fechaNacimiento: miembro.fechaNacimiento || ''
    });
    setShowEditMemberModal(true);
  };

  const handleSaveEditedMember = async (e) => {
    e.preventDefault();
    if (!editMemberForm.nombreBase) return;

    const newNombre = editMemberForm.pseudonimo.trim()
      ? `${editMemberForm.nombreBase.trim()} (${editMemberForm.pseudonimo.trim()})`
      : editMemberForm.nombreBase.trim();

    const finalRol = editMemberForm.tipoFamiliar === 'Abuelos' ? 'Padres' : editMemberForm.tipoFamiliar;

    const padresArray = [];
    if (editMemberForm.padre1 && editMemberForm.tipoFamiliar === 'Hijos') padresArray.push(editMemberForm.padre1);
    if (editMemberForm.padre2 && editMemberForm.tipoFamiliar === 'Hijos') padresArray.push(editMemberForm.padre2);

    const padrinosArray = [];
    if (editMemberForm.padrinoMadrina && editMemberForm.tipoFamiliar === 'Hijos') padrinosArray.push(editMemberForm.padrinoMadrina);

    const updatedData = {
      nombre: newNombre,
      rol: finalRol,
      parejaDe: (editMemberForm.tipoFamiliar === 'Hermanos' || editMemberForm.tipoFamiliar === 'Cuñados') ? (editMemberForm.parejaDe || null) : null,
      padres: padresArray.length > 0 ? padresArray : null,
      padrinos: padrinosArray.length > 0 ? padrinosArray : null,
      santo: editMemberForm.santo || 'No especificado',
      email: editMemberForm.email || null,
      fechaNacimiento: editMemberForm.fechaNacimiento || null
    };

    const isLocalMemberId = typeof editingMemberId === 'string' && editingMemberId.startsWith('m_');

    const oldHijo = integrantes.find(i => i.padres && i.padres.includes(editingMemberOldNombre));
    const newHijo = (editMemberForm.tipoFamiliar === 'Abuelos' && editMemberForm.hijoAsociado)
      ? integrantes.find(i => i.nombre === editMemberForm.hijoAsociado)
      : null;

    if (isCloudMode && user && !isLocalMode) {
      try {
        if (!isLocalMemberId) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'miembros', editingMemberId);
          await updateDoc(docRef, updatedData);
        } else {
          const colMiem = collection(db, 'artifacts', appId, 'public', 'data', 'miembros');
          await addDoc(colMiem, updatedData);
        }

        // Sincronizar automáticamente con el listado de cumpleaños
        if (updatedData.fechaNacimiento) {
          await syncBirthdayFromMember(newNombre, updatedData.fechaNacimiento, editMemberForm.tipoFamiliar, updatedData.santo, editingMemberOldNombre);
        }

        // Vincular automáticamente como padres de todos los Hermanos
        if (editMemberForm.tipoFamiliar === 'Padres') {
          const hermanos = integrantes.filter(i => i.rol === 'Hermanos');
          for (const herm of hermanos) {
            const nuevosPadres = herm.padres ? [...herm.padres] : [];
            if (!nuevosPadres.includes(newNombre)) {
              nuevosPadres.push(newNombre);
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', herm.id), { padres: nuevosPadres });
            }
          }
        }

        // --- ACTUALIZAR VÍNCULO DE PAREJA (DEDUPLICADO Y LIMPIEZA) ---
        const miembroOriginal = integrantes.find(i => i.id === editingMemberId);
        const oldPartnerName = miembroOriginal ? miembroOriginal.parejaDe : null;
        const newPartnerName = updatedData.parejaDe;

        if (oldPartnerName !== newPartnerName) {
          // 1. Limpiar ex-parejas antiguas
          if (oldPartnerName) {
            const exPartners = integrantes.filter(i => i.nombre === oldPartnerName && i.parejaDe === (miembroOriginal ? miembroOriginal.nombre : editingMemberOldNombre));
            for (const exP of exPartners) {
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', exP.id), { parejaDe: null });
            }
          }
          // 2. Establecer nueva pareja
          if (newPartnerName) {
            const newPartnerObj = integrantes.find(i => i.nombre === newPartnerName);
            if (newPartnerObj) {
              // Limpiar a cualquier ex-pareja de esta nueva pareja para evitar bigamia
              const exPartnersOfNew = integrantes.filter(i => i.id !== editingMemberId && i.parejaDe === newPartnerName);
              for (const exP of exPartnersOfNew) {
                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', exP.id), { parejaDe: null });
              }
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', newPartnerObj.id), { parejaDe: newNombre });
            }
          }
        } else if (newPartnerName && newNombre !== editingMemberOldNombre) {
          // Si cambió de nombre pero es la misma pareja, actualizar nombre apuntado
          const partnerObj = integrantes.find(i => i.nombre === newPartnerName);
          if (partnerObj) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', partnerObj.id), { parejaDe: newNombre });
          }
        }

        // Remover del anterior hijo si cambió
        if (oldHijo && (!newHijo || oldHijo.id !== newHijo.id)) {
          const nuevosPadresOld = (oldHijo.padres || []).filter(p => p !== editingMemberOldNombre && p !== newNombre);
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', oldHijo.id), { padres: nuevosPadresOld.length > 0 ? nuevosPadresOld : null });
        }
        // Añadir al nuevo hijo
        if (newHijo) {
          const nuevosPadresNew = (newHijo.padres || []).filter(p => p !== editingMemberOldNombre);
          if (!nuevosPadresNew.includes(newNombre)) {
            nuevosPadresNew.push(newNombre);
          }
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', newHijo.id), { padres: nuevosPadresNew });
        }

        if (newNombre !== editingMemberOldNombre) {

          for (const member of integrantes) {
            if (member.id === editingMemberId) continue;
            if (member.id === (oldHijo ? oldHijo.id : '') || member.id === (newHijo ? newHijo.id : '')) continue;
            let needsUpdate = false;
            let changes = {};
            if (member.padres && member.padres.includes(editingMemberOldNombre)) {
              changes.padres = member.padres.map(p => p === editingMemberOldNombre ? newNombre : p);
              needsUpdate = true;
            }
            if (member.padrinos && member.padrinos.includes(editingMemberOldNombre)) {
              changes.padrinos = member.padrinos.map(p => p === editingMemberOldNombre ? newNombre : p);
              needsUpdate = true;
            }
            if (needsUpdate) {
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'miembros', member.id), changes);
            }
          }

          for (const vac of vacaciones) {
            if (vac.quienes && vac.quienes.includes(editingMemberOldNombre)) {
              const newQuienes = vac.quienes.map(q => q === editingMemberOldNombre ? newNombre : q);
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vacaciones', vac.id), { quienes: newQuienes });
            }
          }

          for (const evt of eventos) {
            if (evt.asistentes && evt.asistentes.includes(editingMemberOldNombre)) {
              const newAsistentes = evt.asistentes.map(a => a === editingMemberOldNombre ? newNombre : a);
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'eventos', evt.id), { asistentes: newAsistentes });
            }
          }

          for (const idea of ideas) {
            if (idea.autor === editingMemberOldNombre) {
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ideas', idea.id), { autor: newNombre });
            }
          }

          for (const cum of cumpleanos) {
            if (cum.nombre === editingMemberOldNombre) {
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cumpleanos', cum.id), { nombre: newNombre });
            }
          }
        }

        triggerToast('¡Familiar actualizado correctamente en la nube!');
        setShowEditMemberModal(false);
      } catch (err) {
        console.error("Error al actualizar familiar en la nube:", err);
        triggerToast(`Error al guardar: ${err.message || 'Permiso denegado'}`);
      }
    } else {
      const miembroOriginal = integrantes.find(i => i.id === editingMemberId);
      const oldPartnerName = miembroOriginal ? miembroOriginal.parejaDe : null;
      const newPartnerName = updatedData.parejaDe;

      let updatedIntegrantes = integrantes.map(miembro => {
        if (miembro.id === editingMemberId) {
          return { ...miembro, ...updatedData };
        }
        
        let updatedMiembro = { ...miembro };

        // 1. Limpiar ex-pareja local
        if (oldPartnerName && miembro.nombre === oldPartnerName && miembro.parejaDe === (miembroOriginal ? miembroOriginal.nombre : editingMemberOldNombre)) {
          updatedMiembro.parejaDe = null;
        }

        // 2. Establecer nueva pareja local
        if (newPartnerName && miembro.nombre === newPartnerName) {
          updatedMiembro.parejaDe = newNombre;
        }

        // 3. Limpiar ex-pareja de la nueva pareja si existía otra persona apuntando a ella
        if (newPartnerName && miembro.parejaDe === newPartnerName && miembro.id !== editingMemberId) {
          updatedMiembro.parejaDe = null;
        }

        // 4. Si el nombre de la pareja cambió pero la relación sigue igual, actualizar nombre apuntado
        if (newPartnerName === oldPartnerName && newPartnerName && miembro.parejaDe === editingMemberOldNombre) {
          updatedMiembro.parejaDe = newNombre;
        }

        // Vincular automáticamente local Padres
        if (editMemberForm.tipoFamiliar === 'Padres' && miembro.rol === 'Hermanos') {
          const nuevosPadres = (miembro.padres || []).filter(p => p !== editingMemberOldNombre);
          if (!nuevosPadres.includes(newNombre)) {
            nuevosPadres.push(newNombre);
          }
          updatedMiembro.padres = nuevosPadres;
        }

        // Remover del anterior local
        if (oldHijo && miembro.id === oldHijo.id && (!newHijo || oldHijo.id !== newHijo.id)) {
          updatedMiembro.padres = (miembro.padres || []).filter(p => p !== editingMemberOldNombre && p !== newNombre);
          if (updatedMiembro.padres.length === 0) updatedMiembro.padres = null;
        }
        // Añadir al nuevo local
        if (newHijo && miembro.id === newHijo.id) {
          const nuevosPadres = (miembro.padres || []).filter(p => p !== editingMemberOldNombre);
          if (!nuevosPadres.includes(newNombre)) {
            nuevosPadres.push(newNombre);
          }
          updatedMiembro.padres = nuevosPadres;
        }
        if (miembro.padres && miembro.padres.includes(editingMemberOldNombre) && (!oldHijo || miembro.id !== oldHijo.id) && (!newHijo || miembro.id !== newHijo.id)) {
          updatedMiembro.padres = miembro.padres.map(p => p === editingMemberOldNombre ? newNombre : p);
        }
        if (miembro.padrinos && miembro.padrinos.includes(editingMemberOldNombre)) {
          updatedMiembro.padrinos = miembro.padrinos.map(p => p === editingMemberOldNombre ? newNombre : p);
        }
        return updatedMiembro;
      });

      // Sincronizar cumpleaños local
      if (updatedData.fechaNacimiento) {
        const partes = updatedData.fechaNacimiento.split('-');
        if (partes.length === 3) {
          const mesDia = `${partes[1]}-${partes[2]}`;
          let parentesco = 'Familiar';
          if (editMemberForm.tipoFamiliar === 'Hermanos') parentesco = 'Hermano/a';
          else if (editMemberForm.tipoFamiliar === 'Cuñados') parentesco = 'Cuñado/a';
          else if (editMemberForm.tipoFamiliar === 'Hijos') parentesco = 'Sobrino/Hijo';
          else if (editMemberForm.tipoFamiliar === 'Padres') parentesco = 'Padres';
          else if (editMemberForm.tipoFamiliar === 'Abuelos') parentesco = 'Abuelos';

          const cumpleData = {
            nombre: newNombre,
            fecha: mesDia,
            parentesco: parentesco,
            santo: updatedData.santo || ''
          };
          const existente = cumpleanos.find(c => c && (c.nombre === editingMemberOldNombre || c.nombre === newNombre));
          let updatedCumples;
          if (existente) {
            updatedCumples = cumpleanos.map(c => c.id === existente.id ? { ...c, ...cumpleData } : c);
          } else {
            updatedCumples = [...cumpleanos, { id: 'c_' + Date.now(), ...cumpleData }];
          }
          setCumpleanos(updatedCumples);
          persistLocal('cumpleanos', updatedCumples);
        }
      }

      setIntegrantes(updatedIntegrantes);
      persistLocal('miembros', updatedIntegrantes);

      if (newNombre !== editingMemberOldNombre) {
        const updatedVacaciones = vacaciones.map(vac => {
          if (vac.quienes && vac.quienes.includes(editingMemberOldNombre)) {
            return { ...vac, quienes: vac.quienes.map(q => q === editingMemberOldNombre ? newNombre : q) };
          }
          return vac;
        });
        setVacaciones(updatedVacaciones);
        persistLocal('vacaciones', updatedVacaciones);

        const updatedEventos = eventos.map(evt => {
          if (evt.asistentes && evt.asistentes.includes(editingMemberOldNombre)) {
            return { ...evt, asistentes: evt.asistentes.map(a => a === editingMemberOldNombre ? newNombre : a) };
          }
          return evt;
        });
        setEventos(updatedEventos);
        persistLocal('eventos', updatedEventos);

        const updatedIdeas = ideas.map(idea => {
          if (idea.autor === editingMemberOldNombre) {
            return { ...idea, autor: newNombre };
          }
          return idea;
        });
        setIdeas(updatedIdeas);
        persistLocal('ideas', updatedIdeas);

        const updatedCumples = cumpleanos.map(cum => {
          if (cum.nombre === editingMemberOldNombre) {
            return { ...cum, nombre: newNombre };
          }
          return cum;
        });
        setCumpleanos(updatedCumples);
        persistLocal('cumpleanos', updatedCumples);
      }

      triggerToast('¡Familiar actualizado correctamente!');
      setShowEditMemberModal(false);
    }

    if (usuarioActivo === editingMemberOldNombre) {
      setUsuarioActivo(newNombre);
    }
  };

  // --- ESTRUCTURA DE LOS 7 HERMANOS PARA EL ÁRBOL GRÁFICO (BLINDADO) ---
  const hermanosAgrupadosConParejas = useMemo(() => {
    const listadoHermanos = integrantes.filter(i => i && i.rol === 'Hermanos');
    
    // Ordenar los hermanos de izquierda a derecha en base a su cumpleaños según el orden especificado:
    // Rebeca, Isaac, María, Ana, Juan, Teresa y Cristina
    const getHermanoOrderIndex = (name) => {
      const norm = (name || '').toLowerCase().trim();
      if (norm.includes('rebeca')) return 0;
      if (norm.includes('isaac') || norm.includes('isik')) return 1;
      if (norm.includes('maría') || norm.includes('maria')) return 2;
      if (norm.includes('ana')) return 3;
      if (norm.includes('juan')) return 4;
      if (norm.includes('teresa')) return 5;
      if (norm.includes('cristina')) return 6;
      return 999;
    };
    
    listadoHermanos.sort((a, b) => getHermanoOrderIndex(a.nombre) - getHermanoOrderIndex(b.nombre));

    const parejas = integrantes.filter(i => i && i.rol === 'Cuñados');
    
    return listadoHermanos.map(herm => {
      const suPareja = parejas.find(p => p && (p.parejaDe === herm.nombre || herm.parejaDe === p.nombre));
      
      const susHijos = integrantes.filter(h => 
        h && h.rol === 'Hijos' && h.padres && Array.isArray(h.padres) && 
        (h.padres.includes(herm.nombre) || (suPareja && h.padres.includes(suPareja.nombre)))
      );

      // Ordenar por fecha de nacimiento (de mayor a menor edad / orden de nacimiento)
      susHijos.sort((a, b) => {
        const dateA = a.fechaNacimiento || '';
        const dateB = b.fechaNacimiento || '';
        if (!dateA) return 1; // Colocar al final si no tiene fecha
        if (!dateB) return -1;
        return dateA.localeCompare(dateB);
      });

      return {
        hermano: herm,
        pareja: suPareja,
        hijos: susHijos
      };
    });
  }, [integrantes]);

  const misPadres = useMemo(() => {
    const yoObj = integrantes.find(i => i.nombre === usuarioActivo);
    if (!yoObj) return [];
    
    let padresList = yoObj.padres;
    if ((!padresList || padresList.length === 0) && yoObj.rol === 'Hermanos') {
      const list = integrantes.filter(i => {
        if (i.rol !== 'Padres') return false;
        const esAbuelo = integrantes.some(otro => otro.rol === 'Padres' && otro.padres && otro.padres.includes(i.nombre));
        return !esAbuelo;
      });
      if (list.length > 0) {
        return list.slice(0, 2);
      }
      padresList = ['Mamá', 'Papá'];
    }
    
    if (!padresList) return [];
    return padresList.map(pName => integrantes.find(i => i.nombre === pName)).filter(Boolean);
  }, [integrantes, usuarioActivo]);

  const misAbuelos = useMemo(() => {
    const yoObj = integrantes.find(i => i.nombre === usuarioActivo);
    if (!yoObj) return [];
    
    let padresList = yoObj.padres;
    if ((!padresList || padresList.length === 0) && yoObj.rol === 'Hermanos') {
      const list = integrantes.filter(i => {
        if (i.rol !== 'Padres') return false;
        const esAbuelo = integrantes.some(otro => otro.rol === 'Padres' && otro.padres && otro.padres.includes(i.nombre));
        return !esAbuelo;
      });
      padresList = list.map(p => p.nombre);
      if (padresList.length === 0) {
        padresList = ['Mamá', 'Papá'];
      }
    }
    
    if (!padresList) return [];
    const list = [];
    padresList.forEach(pName => {
      const pObj = integrantes.find(i => i.nombre === pName);
      if (pObj && pObj.padres) {
        pObj.padres.forEach(gpName => {
          const gpObj = integrantes.find(i => i.nombre === gpName);
          if (gpObj && !list.some(x => x.id === gpObj.id)) {
            list.push(gpObj);
          }
        });
      }
    });
    return list;
  }, [integrantes, usuarioActivo]);

  return (
    <div className="min-h-screen text-slate-800 font-sans pb-20 md:pb-8 bg-slate-50">
      
      {/* --- OVERLAY DE DESCARGA DIRECTA DE PDF --- */}
      {isExporting && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center text-white backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800/95 p-7 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center space-y-4 max-w-sm text-center">
            <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="font-bold text-base text-white">Generando archivo PDF...</p>
              <p className="text-xs text-slate-400 mt-1">Preparando la descarga directa en tu dispositivo</p>
            </div>
          </div>
        </div>
      )}

      {/* --- CONTENEDOR DE CAPTURA PARA GENERACIÓN DE PDF --- */}
      {isExporting && (
        <div 
          id="printable-family-report"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '1050px',
            zIndex: 45,
            backgroundColor: '#ffffff',
            color: '#0f172a',
            pointerEvents: 'none'
          }}
        >
          {/* PRINT TYPE: CUMPLES */}
          {printType === 'cumples' && (
            <div className="pdf-page-section p-10 bg-white" data-orientation="portrait" style={{ width: '850px', margin: '0 auto' }}>
              <div className="text-center pb-6 border-b-2 border-pink-500 mb-6">
                <h1 className="text-3xl font-black text-pink-700">🎂 Agenda de Cumpleaños y Santos 🎂</h1>
                <p className="text-sm text-slate-500 mt-1">Sincronizado en tiempo real desde la nube de la Familia Barnuevo</p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-2">
                {cumpleanosOrdenados.map((cum, idx) => (
                  <div key={idx} className="p-3 border border-pink-100 rounded-2xl bg-pink-50/5 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 text-sm">{cum.nombre}</p>
                      <p className="text-[10px] text-pink-650 bg-pink-50/50 px-2.5 py-0.5 rounded-full inline-block font-bold">
                        {cum.parentesco || 'Familiar'}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs font-black text-slate-800">📅 {cum.fechaVisual}</p>
                      <p className="text-[10px] text-indigo-650 font-bold">✨ Santo: {cum.santo || 'No registrado'}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-8 border-t text-[10px] text-slate-400 mt-12">
                Hecho con mucho cariño para los 7 hermanos, cuñados, sobrinos y abuelos.
              </div>
            </div>
          )}

          {/* PRINT TYPE: CALENDAR */}
          {printType === 'calendar' && (
            <div>
              {/* PÁGINA 1: JULIO 2026 */}
              <div className="pdf-page-section p-8 bg-white" data-orientation="landscape" style={{ width: '1050px' }}>
                <div className="text-center pb-4 border-b-2 border-emerald-500 mb-6">
                  <h1 className="text-3xl font-black text-emerald-800">☀️ Calendario de Vacaciones - JULIO 2026 ☀️</h1>
                  <p className="text-xs text-slate-500">Planificación de Vacaciones de la Familia Barnuevo</p>
                </div>
                {renderPrintCalendarGrid(2026, 6)}
              </div>

              {/* PÁGINA 2: AGOSTO 2026 */}
              <div className="pdf-page-section p-8 bg-white" data-orientation="landscape" style={{ width: '1050px' }}>
                <div className="text-center pb-4 border-b-2 border-emerald-500 mb-6">
                  <h1 className="text-3xl font-black text-emerald-800">☀️ Calendario de Vacaciones - AGOSTO 2026 ☀️</h1>
                  <p className="text-xs text-slate-500">Planificación de Vacaciones de la Familia Barnuevo</p>
                </div>
                {renderPrintCalendarGrid(2026, 7)}
              </div>
            </div>
          )}

          {/* PRINT TYPE: ARBOL */}
          {printType === 'arbol' && (
            <div className="pdf-page-section p-8 bg-white" data-orientation="landscape" style={{ width: '1050px' }}>
              <div className="text-center pb-4 border-b-2 border-emerald-500 mb-6">
                <h1 className="text-3xl font-black text-emerald-800">🌳 Árbol Genealógico - Familia Barnuevo 🌳</h1>
                <p className="text-xs text-slate-500">Sincronizado en tiempo real desde la nube familiar</p>
              </div>
              {renderPrintTree()}
            </div>
          )}

          {/* PRINT TYPE: FULL (REPORTE COMBINADO) */}
          {printType === 'full' && (
            <div>
              {/* Página 1: Portada */}
              <div className="pdf-page-section p-12 bg-white text-center flex flex-col justify-center min-h-[900px]" data-orientation="portrait" style={{ width: '850px', margin: '0 auto' }}>
                <div className="max-w-xl mx-auto space-y-6 pt-12">
                  <div className="text-6xl mb-4">🏠</div>
                  <h1 className="text-5xl font-black text-slate-900 mb-4">FamilyApp 🏠</h1>
                  <p className="text-xl text-slate-650">Planificación de Vacaciones de Verano, Agenda y Árbol Familiar</p>
                  <div className="mt-14 p-8 bg-slate-50 border border-slate-200 rounded-3xl text-left text-sm max-w-xl mx-auto space-y-3">
                    <p className="font-bold text-slate-800">Este reporte contiene la información oficial sincronizada:</p>
                    <ul className="list-disc list-inside space-y-1.5 font-medium text-slate-600">
                      <li>🌳 Árbol Genealógico Completo.</li>
                      <li>☀️ Calendarios de Vacaciones (Julio y Agosto 2026).</li>
                      <li>🎂 Agenda Anual de Cumpleaños y Santos.</li>
                    </ul>
                  </div>
                  <div className="pt-16 text-xs text-slate-400">
                    Documento oficial de la Familia Barnuevo • {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Página 2: Árbol Genealógico */}
              <div className="pdf-page-section p-8 bg-white" data-orientation="landscape" style={{ width: '1050px' }}>
                <div className="text-center pb-4 border-b-2 border-emerald-500 mb-6">
                  <h2 className="text-2xl font-bold text-emerald-800">🌳 Árbol Genealógico Familiar 🌳</h2>
                </div>
                {renderPrintTree()}
              </div>

              {/* Página 3: Calendario Julio */}
              <div className="pdf-page-section p-8 bg-white" data-orientation="landscape" style={{ width: '1050px' }}>
                <div className="text-center pb-4 border-b-2 border-emerald-500 mb-6">
                  <h2 className="text-2xl font-bold text-emerald-800">☀️ Calendario de Vacaciones - Julio 2026 ☀️</h2>
                </div>
                {renderPrintCalendarGrid(2026, 6)}
              </div>

              {/* Página 4: Calendario Agosto */}
              <div className="pdf-page-section p-8 bg-white" data-orientation="landscape" style={{ width: '1050px' }}>
                <div className="text-center pb-4 border-b-2 border-emerald-500 mb-6">
                  <h2 className="text-2xl font-bold text-emerald-800">☀️ Calendario de Vacaciones - Agosto 2026 ☀️</h2>
                </div>
                {renderPrintCalendarGrid(2026, 7)}
              </div>

              {/* Página 5: Cumpleaños */}
              <div className="pdf-page-section p-10 bg-white" data-orientation="portrait" style={{ width: '850px', margin: '0 auto' }}>
                <div className="text-center pb-4 border-b-2 border-pink-500 mb-6">
                  <h2 className="text-2xl font-bold text-pink-700">🎂 Agenda de Cumpleaños y Santos 🎂</h2>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {cumpleanosOrdenados.map((cum, idx) => (
                    <div key={idx} className="p-3.5 border border-pink-100 rounded-xl bg-pink-50/5 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{cum.nombre} ({cum.parentesco || 'Familiar'})</span>
                      <span className="text-slate-655 font-semibold">📅 {cum.fechaVisual} | Santo: {cum.santo || 'No registrado'}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center pt-8 border-t text-[10px] text-slate-400 mt-12">
                  Hecho con mucho cariño para los 7 hermanos, cuñados, sobrinos y abuelos.
                </div>
              </div>
            </div>
          )}

          {/* PRINT TYPE: CITAS MÉDICAS */}
          {printType === 'citas' && (
            <div className="pdf-page-section p-10 bg-white" data-orientation="portrait" style={{ width: '850px', margin: '0 auto' }}>
              <div className="text-center pb-6 border-b-2 border-rose-500 mb-6">
                <div className="text-3xl mb-1">🩺</div>
                <h1 className="text-2xl font-black text-rose-800">Citas Médicas y Revisiones de los Padres</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Encarnación (Mamá) y Jaime (Papá) • Sincronizado en tiempo real • Familia Barnuevo
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Fecha del informe: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Resumen numérico */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-rose-600 block">Total Citas</span>
                  <span className="text-xl font-black text-rose-900">{citasMedicas.length}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-600 block">Pendientes</span>
                  <span className="text-xl font-black text-amber-900">{citasMedicas.filter(c => c.estado !== 'completada').length}</span>
                </div>
                <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-purple-600 block">Mamá</span>
                  <span className="text-xl font-black text-purple-900">{citasMedicas.filter(c => c.paciente?.includes('Mamá') || c.paciente?.includes('Encarnación')).length}</span>
                </div>
                <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-sky-600 block">Papá</span>
                  <span className="text-xl font-black text-sky-900">{citasMedicas.filter(c => c.paciente?.includes('Papá') || c.paciente?.includes('Jaime')).length}</span>
                </div>
              </div>

              {/* Listado de Citas */}
              <div className="space-y-3">
                {[...citasMedicas]
                  .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
                  .map((c, idx) => {
                    const isCompletada = c.estado === 'completada';
                    const sinAcompanante = !c.acompanante || c.acompanante === 'Pendiente de asignar';
                    return (
                      <div 
                        key={c.id || idx} 
                        className={`p-4 border rounded-2xl ${isCompletada ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200 shadow-xs'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${c.paciente?.includes('Mamá') ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'}`}>
                              {c.paciente?.includes('Mamá') ? '👵 Mamá (Encarnación)' : '👴 Papá (Jaime)'}
                            </span>
                            <span className="text-xs font-black text-slate-800">
                              {c.especialidad}
                            </span>
                            {c.medico && (
                              <span className="text-[11px] text-slate-500 font-medium">
                                ({c.medico})
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${isCompletada ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {isCompletada ? '✅ Realizada' : '⏳ Pendiente'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs py-1 border-t border-b border-slate-100 my-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Fecha y Hora</span>
                            <span className="font-bold text-slate-800">📅 {formatearFechaStr(c.fecha)} • {c.hora || '10:00'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Centro / Hospital</span>
                            <span className="font-semibold text-slate-700">🏥 {c.centro}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Acompañante</span>
                            <span className={`font-bold ${sinAcompanante ? 'text-amber-600' : 'text-emerald-700'}`}>
                              🚗 {sinAcompanante ? '⚠️ ¡Sin asignar!' : c.acompanante}
                            </span>
                          </div>
                        </div>

                        {c.notas && (
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-150">
                            <strong>📋 Instrucciones y Notas:</strong> {c.notas}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div className="text-center pt-8 border-t text-[10px] text-slate-400 mt-8">
                Portal Familiar Familia Barnuevo • Documento informativo para el cuidado de los padres
              </div>
            </div>
          )}

          {/* PRINT TYPE: TRASLADOS PADRES */}
          {printType === 'traslados' && (
            <div className="pdf-page-section p-10 bg-white" data-orientation="portrait" style={{ width: '850px', margin: '0 auto' }}>
              <div className="text-center pb-6 border-b-2 border-amber-500 mb-6">
                <div className="text-3xl mb-1">🚗</div>
                <h1 className="text-2xl font-black text-amber-900">Traslados y Estancias de los Padres</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Organización de viajes entre Alcalá de Henares (Esgaravita) y Madrid • Familia Barnuevo
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Fecha del informe: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Indicador de Ubicación Actual */}
              <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex items-center justify-between mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">ESTADO ACTUAL</span>
                  <p className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-2">
                    <span>{ubicacionActualPadres.includes('Alcalá') ? '🏡' : '🏢'}</span>
                    Actualmente alojados en: <span className="text-amber-800 underline decoration-amber-400">{ubicacionActualPadres}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-700 font-bold block">Total viajes registrados: {trasladosPadres.length}</span>
                  <span className="text-[10px] text-slate-500">Pendientes: {trasladosPadres.filter(t => t.estado !== 'realizado').length}</span>
                </div>
              </div>

              {/* Listado de Traslados */}
              <div className="space-y-3">
                {[...trasladosPadres]
                  .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
                  .map((t, idx) => {
                    const isRealizado = t.estado === 'realizado';
                    const sinConductor = !t.conductor || t.conductor === 'Pendiente de asignar';
                    return (
                      <div 
                        key={t.id || idx} 
                        className={`p-4 border rounded-2xl ${isRealizado ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-amber-200/70 shadow-xs'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">
                              {t.origen?.includes('Madrid') ? '🏢' : '🏡'} {t.origen} ➔ {t.destino?.includes('Madrid') ? '🏢' : '🏡'} {t.destino}
                            </span>
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                              {t.momentoDia || 'Horario'}
                            </span>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${isRealizado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {isRealizado ? '✅ Realizado' : '⏳ Pendiente'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs py-1 border-t border-b border-slate-100 my-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Fecha y Hora</span>
                            <span className="font-bold text-slate-800">📅 {formatearFechaStr(t.fecha)} • {t.hora || '18:00'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Conductor Asignado</span>
                            <span className={`font-bold ${sinConductor ? 'text-amber-600' : 'text-emerald-700'}`}>
                              🚗 {sinConductor ? '⚠️ ¡Sin conductor asignado!' : t.conductor}
                            </span>
                          </div>
                        </div>

                        {t.notas && (
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-150">
                            <strong>📋 Notas / Equipaje:</strong> {t.notas}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div className="text-center pt-8 border-t text-[10px] text-slate-400 mt-8">
                Portal Familiar Familia Barnuevo • Organización y traslados de Papá y Mamá
              </div>
            </div>
          )}
        </div>
      )}
          {/* --- TOAST --- */}
          {toastMessage && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-slate-700 animate-bounce">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-medium">{toastMessage}</span>
            </div>
          )}

          {/* --- CABECERA --- */}
          <header className="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-700 text-white shadow-md sticky top-0 z-30">
            <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-md">
                  <Users className="w-8 h-8 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">FamilyApp 🏠</h1>
                    <span className="bg-emerald-500/30 text-[10px] text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                      {isCloudMode ? 'Nube Sincronizada' : 'Modo Offline (Local)'}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 font-light">
                    Portal familiar con onomásticas, árbol visual y exportación PDF para los 7 hermanos
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* BOTÓN DESCARGAR REPORTE PDF */}
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all border border-white/10 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>Descargar PDF</span>
                </button>

                {/* MODO NUBE VINCULADO VS LOCAL */}
                {user && user.uid !== 'offline-user' && matchedMember && !isLocalMode ? (
                  <div className="flex items-center gap-2 bg-slate-900/30 p-1.5 px-3 rounded-xl border border-white/10">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="w-6 h-6 rounded-full border border-emerald-400" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center border border-emerald-400">
                        {matchedMember.nombre.charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] text-emerald-250 font-bold leading-none">{matchedMember.nombre}</span>
                      <span className="text-[8px] text-white/50 leading-none mt-0.5">Identidad Segura</span>
                    </div>
                    <button
                      onClick={handleGoogleLogout}
                      className="ml-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 hover:text-white text-[9px] font-bold py-1 px-2 rounded-lg transition-all"
                    >
                      Salir
                    </button>
                  </div>
                ) : (
                  <>
                    {/* PERSPECTIVA DINÁMICA (Local / Offline o anónimo) */}
                    <div className="flex items-center gap-1.5 bg-slate-900/30 p-1.5 rounded-xl border border-white/10">
                      <select
                        className="bg-transparent text-white text-xs font-bold py-0.5 px-1.5 border-none focus:outline-none cursor-pointer"
                        value={usuarioActivo}
                        onChange={(e) => {
                          const nom = e.target.value;
                          setUsuarioActivo(nom);
                          try {
                            localStorage.setItem('family_app_usuario_activo', nom);
                          } catch (err) {}
                          triggerToast(`Viendo app como: ${nom}`);
                        }}
                      >
                        {integrantes.map(inte => (
                          <option key={inte.id} value={inte.nombre} className="text-slate-800">
                            Ver como: {inte.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isCloudMode && (!user || user.isAnonymous || !matchedMember) && (
                      <button
                        onClick={handleGoogleLogin}
                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-1.5 px-3 rounded-xl border border-white/15 transition-all flex items-center gap-1.5 shadow-xs"
                        title="Vincular tu cuenta de Google"
                      >
                        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.985 0-.737-.08-1.3-.176-1.86H12.24z"/>
                        </svg>
                        <span className="hidden sm:inline">Entrar con Google</span>
                      </button>
                    )}

                    {isLocalMode && isCloudMode && (
                      <button
                        onClick={() => {
                          setIsLocalMode(false);
                          triggerToast('🔌 Conectando a la nube...');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-xl border border-emerald-500 transition-all shadow-xs"
                      >
                        Conectar a Nube
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </header>

          {/* --- WIDGET ALERTA CUENTA ATRÁS --- */}
          {cuentaAtrasVacaciones && (
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white py-3 px-4 shadow-inner text-center">
              <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2">
                <BellRing className="w-5 h-5 text-yellow-200 shrink-0 animate-bounce" />
                <p className="text-xs sm:text-sm font-bold tracking-wide">
                  📢 ¡VACACIONES CERCA! Faltan <span className="underline decoration-yellow-300 decoration-2 font-black text-yellow-100 text-base">{cuentaAtrasVacaciones.diasFaltantes} días</span> para viajar a <span className="bg-white/20 px-2 py-0.5 rounded-md font-black">{cuentaAtrasVacaciones.lugar || 'tu destino'}</span> ({Array.isArray(cuentaAtrasVacaciones.quienes) ? cuentaAtrasVacaciones.quienes.join(', ') : 'Varios'}).
                </p>
                <button
                  onClick={() => setActiveTab('vacaciones')}
                  className="text-xs font-bold text-yellow-100 bg-black/10 hover:bg-black/20 px-3 py-1 rounded-lg border border-white/10 transition-all"
                >
                  Ver detalles
                </button>
              </div>
            </div>
          )}

          {/* --- NAVEGACIÓN PRINCIPAL --- */}
          <nav className="bg-white border-b border-slate-200 sticky top-[72px] sm:top-[76px] z-20 shadow-sm">
            <div className="max-w-6xl mx-auto px-2 flex justify-around sm:justify-start gap-1 md:gap-6 overflow-x-auto scrollbar-none">
              {[
                { id: 'inicio', label: 'Inicio', icon: Home },
                { id: 'traslados', label: 'Padres (Alcalá/Madrid)', icon: Car },
                { id: 'citas', label: 'Citas Médicas', icon: Activity },
                { id: 'arbol', label: 'Árbol Genealógico', icon: Users },
                { id: 'calendario', label: 'Calendario Visual', icon: CalendarIcon },
                { id: 'vacaciones', label: 'Vacaciones Verano', icon: Sun },
                { id: 'eventos', label: 'Barbacoas y Quedadas', icon: CalendarIcon },
                { id: 'cumples', label: 'Cumples y Santos', icon: Gift },
                { id: 'ideas', label: 'Buzón de Ideas', icon: MessageSquare }
              ].map(tab => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3.5 px-3 md:px-5 font-semibold text-xs md:text-sm flex flex-col sm:flex-row items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                      isSelected 
                        ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50' 
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* --- CONTENIDO --- */}
          <main className="max-w-6xl mx-auto px-4 py-6">
            {loading ? (
              <div className="text-center py-20 space-y-3">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-500 text-sm">Cargando base de datos familiar...</p>
              </div>
            ) : (
              <>
                {/* ================= PÁGINA: INICIO ================= */}
                {activeTab === 'inicio' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="bg-gradient-to-br from-teal-55 via-emerald-55 to-indigo-55 border border-teal-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                      <div className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-black text-slate-800">¡Bienvenidos a FamilyApp! 👋</h2>
                        <p className="text-slate-600 text-sm max-w-xl">
                          Sincroniza los tramos libres de {obtenerDestinosResumen(true)}, los cumpleaños, onomásticas (santos) y el árbol visual familiar de los 7 hermanos con un solo clic.
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setActiveTab('arbol')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition shadow-md">
                          Ver Árbol Visual 🌳
                        </button>
                        <button onClick={() => setActiveTab('traslados')} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5" title="Ver o planificar traslados de los padres">
                          <Car className="w-3.5 h-3.5" /> Traslados Padres 🚗
                        </button>
                        <button onClick={() => setActiveTab('citas')} className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5" title="Ver o registrar citas médicas de los padres">
                          <Activity className="w-3.5 h-3.5" /> Citas Médicas Padres 🩺
                        </button>
                        <button onClick={handleEnviarResumenManualTelegram} className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5" title="Enviar recordatorio al grupo de Telegram (Laos)">
                          <span>✈️</span> Avisar en Telegram
                        </button>
                        <button onClick={() => setShowPrintModal(true)} className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5 text-emerald-400" /> Descargar PDF
                        </button>
                      </div>
                    </div>

                    {/* Grid Resumen */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {/* Siguiente cumpleaños */}
                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-150 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <Gift className="w-3 h-3 text-pink-500" /> Próximas Celebraciones (30 días)
                            </span>
                          </div>
                          {proximasCelebraciones30Dias.length > 0 ? (
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                              {proximasCelebraciones30Dias.map((cel) => (
                                <div key={cel.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-pink-200 hover:bg-pink-50/10 transition duration-150">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base leading-none shrink-0">{cel.tipo === '🎂 Cumpleaños' ? '🎂' : '✨'}</span>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                        <span className="truncate">{cel.nombre}</span>
                                        <span className="text-[9px] font-medium text-slate-400">({cel.parentesco})</span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-medium truncate">
                                        {cel.tipo === '🎂 Cumpleaños' ? `Cumple: ${cel.fechaVisual}` : `Santo: ${cel.santoTexto}`}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    {cel.diasFaltantes === 0 ? (
                                      <span className="text-[9px] bg-red-150 text-red-700 font-black px-2 py-0.5 rounded-md animate-pulse">
                                        ¡Hoy! 🎉
                                      </span>
                                    ) : (
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${cel.tipo === '🎂 Cumpleaños' ? 'bg-pink-100 text-pink-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {cel.diasFaltantes === 1 ? 'Mañana' : `Faltan ${cel.diasFaltantes} d`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 text-xs py-8 text-center">No hay cumpleaños ni santos en los próximos 30 días.</p>
                          )}
                        </div>
                        {proximasCelebraciones30Dias.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {proximasCelebraciones30Dias.length} {proximasCelebraciones30Dias.length === 1 ? 'evento próximo' : 'eventos próximos'}
                            </span>
                            <button onClick={() => setActiveTab('cumples')} className="text-xs text-slate-500 hover:text-emerald-600 font-semibold flex items-center gap-0.5">
                              Ver todos <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Quedada próxima */}
                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-150 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3 text-indigo-600" /> Quedada Próxima
                            </span>
                          </div>
                          {eventos.length > 0 ? (
                            <div className="space-y-1">
                              <h3 className="text-base font-bold text-slate-800 line-clamp-1">{eventos[0].titulo}</h3>
                              <p className="text-xs text-slate-500">📅 {formatearFechaStr(eventos[0].fecha)} - {eventos[0].hora}</p>
                              <p className="text-xs text-emerald-600 font-semibold truncate">📍 {eventos[0].lugar}</p>
                            </div>
                          ) : (
                            <p className="text-slate-400 text-xs py-8 text-center">No hay quedadas agendadas.</p>
                          )}
                        </div>
                        {eventos.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-indigo-600 bg-indigo-50 font-bold px-2.5 py-1 rounded-full">
                              {eventos[0].asistentes?.length || 0} confirmados 👍
                            </span>
                            <button onClick={() => setActiveTab('eventos')} className="text-xs text-slate-500 hover:text-emerald-600 font-semibold flex items-center gap-0.5">
                              Detalles <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Vacaciones */}
                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-150 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <Sun className="w-3 h-3 text-emerald-600" /> Verano Compartido
                            </span>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-base font-bold text-slate-800 truncate">{obtenerDestinosResumen(false)}</h3>
                            <p className="text-xs text-slate-600">
                              Hay <strong className="text-emerald-700">{vacaciones.length} tramos</strong> registrados. ¿Cuál está libre?
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-emerald-700 bg-emerald-50 font-medium px-2 py-0.5 rounded-full">
                            Nube activa
                          </span>
                          <button onClick={() => setActiveTab('calendario')} className="text-xs text-slate-500 hover:text-emerald-600 font-semibold flex items-center gap-0.5">
                            Ver Mes Gráfico <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Citas Médicas de los Padres */}
                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-150 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <Activity className="w-3 h-3 text-rose-600" /> Citas Médicas Padres
                            </span>
                            <button
                              onClick={() => { resetCitaForm(); setShowCitaModal(true); }}
                              className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-lg border border-rose-200 transition"
                            >
                              + Añadir
                            </button>
                          </div>
                          {citasMedicas.filter(c => c.estado !== 'completada').length > 0 ? (
                            (() => {
                              const proxima = [...citasMedicas]
                                .filter(c => c.estado !== 'completada' && c.fecha)
                                .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
                              if (!proxima) return <p className="text-slate-400 text-xs py-4 text-center">No hay citas pendientes.</p>;
                              return (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      {proxima.paciente}
                                    </span>
                                    <span className="text-[9px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded">
                                      {formatearFechaStr(proxima.fecha)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-rose-700 font-bold truncate">🩺 {proxima.especialidad}</p>
                                  <p className="text-[11px] text-slate-500 truncate">📍 {proxima.centro} ({proxima.hora})</p>
                                  <div className="pt-1">
                                    {proxima.acompanante && proxima.acompanante !== 'Pendiente de asignar' ? (
                                      <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full inline-block truncate max-w-[140px]">
                                        🚗 Acompaña: {proxima.acompanante}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full inline-block animate-pulse">
                                        ⚠️ Sin acompañante
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <p className="text-slate-400 text-xs py-6 text-center">No hay citas médicas pendientes para Papá o Mamá.</p>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {citasMedicas.filter(c => c.estado !== 'completada').length} pendientes
                          </span>
                          <button onClick={() => setActiveTab('citas')} className="text-xs text-slate-500 hover:text-rose-600 font-semibold flex items-center gap-0.5">
                            Ver todas <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta Destacada: ¿Dónde están los Padres? y Próximo Traslado */}
                    <div className="bg-white border border-amber-200/90 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                            🏡
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-bold text-slate-900">
                                ¿Dónde están Papá y Mamá? (Alcalá ⇄ Madrid)
                              </h3>
                              <span className={`text-xs font-black px-3 py-1 rounded-full border shadow-2xs ${
                                ubicacionActualPadres.includes('Alcalá') || ubicacionActualPadres.includes('Esgaravita')
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-blue-100 text-blue-900 border-blue-300'
                              }`}>
                                📍 Actualmente: {ubicacionActualPadres}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Coordinación entre hermanos para llevarles y recogerles de Esgaravita o Madrid
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleChangeUbicacionPadres(
                              ubicacionActualPadres.includes('Alcalá') ? 'Madrid' : 'Alcalá (Esgaravita)'
                            )}
                            className="text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition flex items-center gap-1.5"
                            title="Cambiar la ubicación actual de los padres"
                          >
                            <span>🔄</span> Cambiar a {ubicacionActualPadres.includes('Alcalá') ? 'Madrid 🏢' : 'Alcalá (Esga) 🌿'}
                          </button>
                          <button
                            onClick={() => { resetTrasladoForm(); setShowTrasladoModal(true); }}
                            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Planificar Viaje
                          </button>
                        </div>
                      </div>

                      {/* Próximo traslado previsto */}
                      <div className="mt-4 pt-1">
                        {(() => {
                          const pendientes = (trasladosPadres || [])
                            .filter(t => t.estado !== 'realizado' && t.fecha)
                            .sort((a, b) => a.fecha.localeCompare(b.fecha));
                          const proximo = pendientes[0];

                          if (!proximo) {
                            return (
                              <div className="p-4 bg-slate-50 rounded-2xl text-center flex flex-col sm:flex-row items-center justify-between gap-3">
                                <p className="text-xs text-slate-500 font-medium">
                                  No hay ningún traslado programado en los próximos días.
                                </p>
                                <button
                                  onClick={() => { resetTrasladoForm(); setShowTrasladoModal(true); }}
                                  className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
                                >
                                  + Añadir nuevo traslado
                                </button>
                              </div>
                            );
                          }

                          const sinConductor = !proximo.conductor || proximo.conductor === 'Pendiente de asignar';
                          const hoyIso = getFechaHoyLocal();
                          const diffDias = Math.round((new Date(proximo.fecha).getTime() - new Date(hoyIso).getTime()) / (1000 * 60 * 60 * 24));

                          return (
                            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                                    Próximo Traslado Previsto:
                                  </span>
                                  {diffDias === 0 ? (
                                    <span className="text-[10px] bg-rose-500 text-white font-black px-2.5 py-0.5 rounded-full animate-pulse">
                                      🚨 ¡HOY!
                                    </span>
                                  ) : diffDias === 1 ? (
                                    <span className="text-[10px] bg-amber-500 text-white font-black px-2.5 py-0.5 rounded-full">
                                      ⏳ Mañana
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                                      En {diffDias} días
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-sm font-black text-slate-800 flex-wrap">
                                  <span className="px-2.5 py-1 bg-white rounded-xl border border-slate-200 text-slate-700 shadow-3xs">
                                    {proximo.origen}
                                  </span>
                                  <ArrowRight className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span className="px-2.5 py-1 bg-white rounded-xl border border-slate-200 text-slate-700 shadow-3xs">
                                    {proximo.destino}
                                  </span>
                                  <span className="text-xs font-medium text-slate-500 ml-2">
                                    📅 {formatearFechaStr(proximo.fecha)} ({proximo.hora || proximo.momentoDia || ''})
                                  </span>
                                </div>

                                {proximo.notas && (
                                  <p className="text-[11px] text-slate-600 italic">
                                    📋 {proximo.notas}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                {sinConductor ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-rose-100 text-rose-800 font-bold px-3 py-1 rounded-xl border border-rose-200 animate-pulse">
                                      ⚠️ ¡Sin conductor!
                                    </span>
                                    <button
                                      onClick={() => handleAsignarmeComoConductor(proximo)}
                                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1"
                                    >
                                      🚗 Yo les llevo 👍
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-3xs">
                                    🚗 Conductor: <strong>{proximo.conductor}</strong>
                                  </span>
                                )}

                                <a
                                  href={generateGoogleCalendarUrlForTraslado(proximo)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition flex items-center gap-1"
                                  title="Añadir viaje a Google Calendar"
                                >
                                  <CalendarIcon className="w-3.5 h-3.5 text-blue-600" /> +Calendar
                                </a>

                                <button
                                  onClick={() => setActiveTab('traslados')}
                                  className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-100/60 hover:bg-amber-100 px-3 py-1.5 rounded-xl transition flex items-center gap-0.5"
                                >
                                  Ver todos ({pendientes.length}) <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                  </div>
                )}

                {/* ================= PÁGINA: ÁRBOL GENEALÓGICO VISUAL ================= */}
                {activeTab === 'arbol' && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <Users className="w-6 h-6 text-emerald-600" /> Árbol Genealógico Interactivo
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                          Representación visual de la familia de los 7 hermanos, sus parejas e hijos/sobrinos. ¡Sincronizado en tiempo real!
                        </p>
                      </div>
                      <button
                        onClick={() => setShowMemberModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0"
                      >
                        <UserPlus className="w-4 h-4" /> Añadir Familiar
                      </button>
                    </div>

                    {/* LIENZO GRÁFICO DEL ÁRBOL */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-12 overflow-x-auto min-w-full">
                      
                      {/* NIVEL 0: LOS ABUELOS DEL USUARIO ACTIVO */}
                      {misPadres.length > 0 && (
                        <div className="flex flex-col items-center space-y-4">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Abuelos de {usuarioActivo.split(' ')[0]} 👴👵</span>
                          
                          <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
                            {misPadres.map(padre => {
                              const abuelosDeRama = padre.padres 
                                ? padre.padres.map(gpName => integrantes.find(i => i.nombre === gpName)).filter(Boolean)
                                : [];
                                
                              return (
                                <div key={padre.id} className="bg-slate-50/50 p-4 rounded-3xl border border-slate-200/60 flex flex-col items-center min-w-[280px]">
                                  <span className="text-[10px] uppercase font-bold text-indigo-600 mb-2">
                                    Rama de {padre.nombre.split(' ')[0]} (Padres de {padre.nombre.split(' ')[0]})
                                  </span>
                                  <div className="flex justify-center gap-3">
                                    {abuelosDeRama.map(abuelo => (
                                      <div key={abuelo.id} className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-3.5 rounded-2xl shadow-md text-center w-40 border-2 border-amber-300 relative">
                                        {/* Botón editar */}
                                        <button
                                          type="button"
                                          onClick={() => startEditMember(abuelo)}
                                          className="absolute top-2 right-8 text-white hover:text-slate-200 p-1 bg-black/10 hover:bg-black/25 rounded-full transition"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        {/* Botón borrar */}
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteElement('miembros', abuelo.id)}
                                          className="absolute top-2 right-2 text-rose-200 hover:text-rose-150 p-1 bg-black/10 hover:bg-black/25 rounded-full transition"
                                        >
                                          <XCircle className="w-3.5 h-3.5" />
                                        </button>
                                        <p className="font-bold text-xs truncate mt-2">{abuelo.nombre}</p>
                                        <span className="bg-amber-700/40 text-amber-100 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase mt-1 inline-block">Abuelo/a</span>
                                        {abuelo.santo && (
                                          <p className="text-[8px] text-amber-200 mt-1 truncate">✨ Santo: {abuelo.santo.split(' ')[0]}</p>
                                        )}
                                      </div>
                                    ))}
                                    {Array.from({ length: Math.max(0, 2 - abuelosDeRama.length) }).map((_, slotIdx) => (
                                      <div key={`empty-slot-${slotIdx}`} className="bg-white border-2 border-dashed border-slate-200 text-slate-500 p-3.5 rounded-2xl text-center w-40 shadow-xs flex flex-col justify-center items-center min-h-[105px]">
                                        <p className="text-[9px] font-bold text-slate-700">
                                          {abuelosDeRama.length === 0 
                                            ? (slotIdx === 0 ? 'Añadir Abuelo' : 'Añadir Abuela') 
                                            : 'Añadir Abuelo/a (2)'}
                                        </p>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setNewMember({
                                              nombre: '',
                                              rol: 'Padres',
                                              tipoFamiliar: 'Abuelos',
                                              parejaDe: '',
                                              padre1: '',
                                              padre2: '',
                                              padrinoMadrina: '',
                                              santo: '',
                                              hijoAsociado: padre.nombre
                                            });
                                            setShowMemberModal(true);
                                          }}
                                          className="mt-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[9px] font-bold py-1 px-2 border rounded-lg transition-all shadow-xs inline-flex items-center gap-0.5"
                                        >
                                          <span>➕</span> Añadir
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="w-0.5 h-6 bg-slate-300"></div>
                        </div>
                      )}

                      {/* NIVEL 1: LOS PADRES DEL USUARIO ACTIVO */}
                      {misPadres.length > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Padres de {usuarioActivo.split(' ')[0]} 👩‍🍼👨‍🍼</span>
                          <div className="flex justify-center gap-4 mt-2">
                            {misPadres.map(padre => (
                              <div key={padre.id} className="bg-gradient-to-r from-rose-500 to-rose-600 text-white p-4 rounded-2xl shadow-md text-center w-56 border-2 border-rose-300 relative">
                                {/* Botón editar */}
                                <button
                                  type="button"
                                  onClick={() => startEditMember(padre)}
                                  className="absolute top-2 right-8 text-white hover:text-slate-200 p-1 bg-black/10 hover:bg-black/25 rounded-full transition"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {/* Botón borrar */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteElement('miembros', padre.id)}
                                  className="absolute top-2 right-2 text-rose-200 hover:text-rose-150 p-1 bg-black/10 hover:bg-black/25 rounded-full transition"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                                <p className="font-bold text-sm truncate mt-2">{padre.nombre}</p>
                                <span className="bg-rose-700/40 text-rose-100 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase mt-1 inline-block">Progenitor</span>
                                {padre.santo && (
                                  <p className="text-[8px] text-rose-200 mt-1 truncate">✨ Santo: {padre.santo.split(' ')[0]}</p>
                                )}
                              </div>
                            ))}
                            {misPadres.length < 2 && (
                              <div className="bg-white border-2 border-dashed border-slate-200 text-slate-500 p-4 rounded-2xl text-center w-56 shadow-xs flex flex-col justify-center items-center min-h-[120px]">
                                <p className="text-[11px] font-bold text-slate-700">Registrar Progenitor</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewMember({
                                      nombre: '',
                                      rol: 'Padres',
                                      parejaDe: '',
                                      padre1: '',
                                      padre2: '',
                                      padrinoMadrina: '',
                                      santo: '',
                                      hijoAsociado: usuarioActivo
                                    });
                                    setShowMemberModal(true);
                                  }}
                                  className="mt-2 bg-slate-50 hover:bg-slate-100 text-slate-750 text-[10px] font-bold py-1.5 px-3 border rounded-xl transition-all shadow-xs inline-flex items-center gap-1"
                                >
                                  <span>➕</span> Añadir Padre/Madre
                                </button>
                              </div>
                            )}
                          </div>
                          {/* Conector vertical hacia abajo */}
                          <div className="w-0.5 h-8 bg-slate-300"></div>
                          <div className="w-5/6 h-0.5 bg-slate-300"></div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="bg-slate-50 border-2 border-dashed border-slate-200 text-slate-500 p-5 rounded-3xl text-center w-64 shadow-xs">
                            <span className="text-lg">👴👵</span>
                            <p className="text-xs font-bold text-slate-700 mt-1">Padres de {usuarioActivo.split(' ')[0]}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Aún no has registrado a tus padres en la aplicación.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setNewMember({
                                  nombre: '',
                                  rol: 'Padres',
                                  parejaDe: '',
                                  padre1: '',
                                  padre2: '',
                                  padrinoMadrina: '',
                                  santo: '',
                                  hijoAsociado: usuarioActivo
                                });
                                setShowMemberModal(true);
                              }}
                              className="mt-3 bg-white hover:bg-slate-100 text-slate-755 text-[10px] font-bold py-1.5 px-3 border rounded-xl transition-all shadow-xs inline-flex items-center gap-1"
                            >
                              <span>➕</span> Registrar Padres
                            </button>
                          </div>
                          {/* Conector vertical hacia abajo */}
                          <div className="w-0.5 h-8 bg-slate-300"></div>
                          <div className="w-5/6 h-0.5 bg-slate-300"></div>
                        </div>
                      )}

                      {/* NIVEL 2: LOS 7 HERMANOS, SUS PAREJAS Y SUS RAMAS */}
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-6 text-center">
                        {hermanosAgrupadosConParejas.map((rama, idx) => {
                          const hermanoActivo = rama.hermano;
                          const parejaActiva = rama.pareja;
                          const hijosActivos = rama.hijos;

                          if (!hermanoActivo) return null;

                          return (
                            <div key={idx} className="flex flex-col items-center space-y-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-150 relative">
                              
                              {/* Tarjeta del Hermano */}
                              <div className="space-y-2 w-full">
                                <div className="bg-white p-3 pt-6 rounded-xl border border-emerald-200 shadow-xs relative">
                                  {/* Botón editar */}
                                  <button
                                    type="button"
                                    onClick={() => startEditMember(hermanoActivo)}
                                    className="absolute top-1.5 right-7 text-emerald-600 hover:text-emerald-800 p-1 bg-slate-50 hover:bg-slate-100 rounded-full transition shadow-3xs"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Botón borrar */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteElement('miembros', hermanoActivo.id)}
                                    className="absolute top-1.5 right-1.5 text-rose-400 hover:text-rose-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-full transition shadow-3xs"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>

                                  <p className="font-bold text-xs text-slate-800 truncate">{hermanoActivo.nombre}</p>
                                  <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">Hermano</span>
                                  {hermanoActivo.santo && (
                                    <p className="text-[8px] text-slate-400 mt-1 truncate">✨ Santo: {hermanoActivo.santo.split(' ')[0]}</p>
                                  )}
                                </div>

                                {/* Conector de pareja si existe */}
                                {parejaActiva ? (
                                  <div className="space-y-2">
                                    <div className="text-slate-400 text-xs font-black">❤️</div>
                                    <div className="bg-white p-3 pt-6 rounded-xl border border-indigo-200 shadow-xs relative">
                                      <button
                                        type="button"
                                        onClick={() => startEditMember(parejaActiva)}
                                        className="absolute top-1.5 right-7 text-emerald-600 hover:text-emerald-850 p-1 bg-slate-50 hover:bg-slate-100 rounded-full transition shadow-3xs"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteElement('miembros', parejaActiva.id)}
                                        className="absolute top-1.5 right-1.5 text-rose-400 hover:text-rose-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-full transition shadow-3xs"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                      </button>
                                      <p className="font-bold text-xs text-slate-800 truncate">{parejaActiva.nombre}</p>
                                      <span className="bg-indigo-100 text-indigo-800 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">Cuñado/a</span>
                                      {parejaActiva.santo && (
                                        <p className="text-[8px] text-slate-400 mt-1 truncate">✨ Santo: {parejaActiva.santo.split(' ')[0]}</p>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-400 italic mt-2">Sin pareja</div>
                                )}
                              </div>

                              {/* Conectores hacia la rama de hijos si existen */}
                              {hijosActivos && hijosActivos.length > 0 && (
                                <>
                                  <div className="w-0.5 h-6 bg-slate-300"></div>
                                  <div className="w-full space-y-2 pt-1 border-t border-dashed border-slate-300">
                                    <p className="text-[9px] text-slate-400 uppercase font-black">Hijos / Sobrinos</p>
                                    <div className="space-y-1.5">
                                      {hijosActivos.map((hijo, hIdx) => (
                                        <div key={hIdx} className="bg-sky-50 p-2 pt-5 rounded-lg border border-sky-100 text-[10px] relative">
                                          <button
                                            type="button"
                                            onClick={() => startEditMember(hijo)}
                                            className="absolute top-1 right-6 text-emerald-600 hover:text-emerald-800 p-0.5 bg-white/60 hover:bg-white rounded-full transition shadow-3xs"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => handleDeleteElement('miembros', hijo.id)}
                                            className="absolute top-1 right-1 text-rose-400 hover:text-rose-600 p-0.5 bg-white/60 hover:bg-white rounded-full transition shadow-3xs"
                                          >
                                            <XCircle className="w-3 h-3" />
                                          </button>
                                          <p className="font-bold text-sky-950 truncate flex items-center justify-center gap-0.5">
                                            👶 {hijo.nombre}
                                          </p>
                                          {hijo.fechaNacimiento && (
                                            <p className="text-[8px] text-sky-600 bg-sky-100/50 rounded px-1.5 py-0.5 mt-1 truncate">
                                              📅 Nacimiento: {formatearFechaStr(hijo.fechaNacimiento)}
                                            </p>
                                          )}
                                          {hijo.santo && hijo.santo !== 'No especificado' && (
                                            <p className="text-[8px] text-slate-500 bg-slate-100/50 rounded px-1.5 py-0.5 mt-0.5 truncate">
                                              ✨ Santo: {hijo.santo}
                                            </p>
                                          )}
                                          {hijo.padrinos && Array.isArray(hijo.padrinos) && hijo.padrinos.length > 0 && (
                                            <p className="text-[8px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-0.5 truncate">
                                              🌟 Ahijado de {hijo.padrinos.join(', ')}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}

                            </div>
                          );
                        })}
                      </div>

                    </div>

                  </div>
                )}

                {/* ================= PÁGINA: CALENDARIO VISUAL ================= */}
                {activeTab === 'calendario' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <CalendarIcon className="w-6 h-6 text-emerald-600" /> Planificador Gráfico Mensual
                          </h2>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl">
                          <button onClick={handleCalendarPrevMonth} className="p-1.5 bg-white rounded-lg shadow-xs text-slate-700 hover:bg-slate-50">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-black text-slate-800 px-3 uppercase tracking-wider min-w-[130px] text-center">
                            {obtenerNombreMes(currentCalendarDate.getMonth() + 1)} {currentCalendarDate.getFullYear()}
                          </span>
                          <button onClick={handleCalendarNextMonth} className="p-1.5 bg-white rounded-lg shadow-xs text-slate-700 hover:bg-slate-50">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white px-6 py-3.5 rounded-2xl border border-slate-150 shadow-xs flex flex-wrap gap-4 text-xs text-slate-600 justify-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-md bg-amber-200 border border-amber-300 inline-block"></span>
                        <span>Vacaciones registradas</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-md bg-rose-500 border border-rose-600 inline-block"></span>
                        <span>¡Coincidencia familiar total! (4+)</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2.5">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dayName => (
                          <span key={dayName} className="text-xs font-black text-slate-500 uppercase tracking-wider">{dayName}</span>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 md:h-[600px] border-b border-slate-200">
                        {calendarDays.map((cell, idx) => {
                          const details = getDailyDetails(cell.date);
                          const isToday = new Date().toDateString() === cell.date.toDateString();

                          const paleta = (details.planId || details.planLugar) 
                            ? obtenerPaletaPlan(details.planId || details.planLugar) 
                            : null;

                          let cellBg = 'bg-white text-slate-800';
                          if (!cell.isCurrentMonth) {
                            cellBg = 'bg-slate-50/70 text-slate-400';
                          } else if (details.vacacionando.length > 0) {
                            cellBg = paleta ? `${paleta.cellBg}` : 'bg-amber-50/60 border-amber-250/50 text-slate-850';
                          }

                          const borderClass = (cell.isCurrentMonth && paleta && paleta.borderClass)
                            ? paleta.borderClass
                            : 'border-slate-200';

                          return (
                            <div key={idx} className={`min-h-[95px] md:min-h-[110px] border-r border-b p-2 flex flex-col justify-between hover:bg-slate-50/70 relative ${borderClass} ${cellBg}`}>
                              
                              {/* Barra de Coincidencia Total (Elegante y Sutil en el borde superior) */}
                              {cell.isCurrentMonth && details.coincidenTodos && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-orange-400 z-10 animate-pulse" title="Coincidencia familiar total (4+ miembros)" />
                              )}

                              <div className="flex justify-between items-center">
                                <span className={`text-[11px] font-black rounded-full w-5 h-5 flex items-center justify-center ${
                                  isToday 
                                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 font-extrabold shadow-sm' 
                                    : cell.isCurrentMonth 
                                      ? 'text-slate-850 font-black' 
                                      : 'text-slate-400/80 font-bold'
                                }`}>
                                  {cell.day}
                                </span>
                                <div className="flex gap-1 items-center">
                                  {details.cumples && details.cumples.length > 0 && <span className="text-xs" title="¡Cumpleaños!">🎂</span>}
                                  {details.santos && details.santos.length > 0 && <span className="text-xs text-amber-500 font-bold" title="¡Santo / Onomástica!">✨</span>}
                                  {cell.isCurrentMonth && details.coincidenTodos && (
                                    <span className="text-[10px]" title="Coincidencia familiar (4+)">🔥</span>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-1 mt-1 text-[9px] overflow-hidden flex-1 flex flex-col justify-end">
                                {details.vacacionando.length > 0 && (
                                  <div className={`font-black text-[8.5px] truncate flex items-center gap-0.5 ${
                                    paleta 
                                      ? paleta.sitioColor 
                                      : cell.isCurrentMonth 
                                        ? 'text-slate-700' 
                                        : 'text-slate-450'
                                  }`}>
                                    <span>📍</span> {details.sitios.join(' & ')}
                                  </div>
                                )}
                                
                                {/* Lista de Vacacionando */}
                                <div className="flex flex-wrap gap-0.5 max-h-7 overflow-y-auto mt-0.5">
                                  {details.vanTodosLosHermanos ? (
                                    <span 
                                      className={`px-1.5 py-0.2 rounded font-black text-[7.5px] uppercase tracking-wider ${
                                        paleta 
                                          ? `${paleta.badgeHermano} animate-pulse` 
                                          : 'bg-emerald-600 text-white border border-emerald-700 font-black shadow-3xs animate-pulse'
                                      }`}
                                    >
                                      🌴 Todos
                                    </span>
                                  ) : (
                                    details.adultosVacacionando.slice(0, 4).map((pers, pIdx) => {
                                      const esSocioHermano = esHermano(pers);
                                      return (
                                        <span 
                                          key={pIdx} 
                                          className={`px-1 py-0.2 rounded font-black text-[7.5px] truncate ${
                                            esSocioHermano
                                              ? paleta 
                                                ? paleta.badgeHermano 
                                                : 'bg-emerald-600 text-white border border-emerald-700 font-black shadow-3xs'
                                              : paleta 
                                                ? paleta.badgeCuñado 
                                                : 'bg-slate-100 text-slate-800 border border-slate-200/80 font-medium'
                                          }`}
                                          title={esSocioHermano ? 'Hermano/a' : 'Familiar'}
                                        >
                                          {pers.split(' ')[0]}
                                        </span>
                                      );
                                    })
                                  )}
                                </div>

                                {/* Lista de Cumpleaños */}
                                {details.cumples && details.cumples.length > 0 && (
                                  <div className="flex flex-col gap-0.5 mt-1">
                                    {details.cumples.map((cum, cIdx) => (
                                      <span 
                                        key={cIdx} 
                                        className="px-1.5 py-0.2 rounded text-[7.5px] font-black truncate flex items-center gap-0.5 bg-pink-100 text-pink-950 border border-pink-300 font-black"
                                      >
                                        <span>🎂</span> {cum.nombre.split(' ')[0]}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Lista de Santos */}
                                {details.santos && details.santos.length > 0 && (
                                  <div className="flex flex-col gap-0.5 mt-0.5">
                                    {details.santos.map((santoName, sIdx) => (
                                      <span 
                                        key={sIdx} 
                                        className="px-1.5 py-0.2 rounded text-[7.5px] font-black truncate flex items-center gap-0.5 bg-indigo-50 text-indigo-950 border border-indigo-300 font-black"
                                      >
                                        <span>✨</span> {santoName.split(' ')[0]}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= PÁGINA: VACACIONES ================= */}
                {activeTab === 'vacaciones' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <Sun className="w-6 h-6 text-amber-500" /> Planificador de Vacaciones Familiares
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto flex-wrap">
                        <button onClick={() => setShowConfirmResetModal(true)} className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs">
                          <Trash2 className="w-4 h-4" /> Vaciar Todo
                        </button>
                        <button onClick={() => setShowImportModal(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-750 hover:to-indigo-750 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-md transition">
                          <span>🪄</span> Asistente Dictado AI
                        </button>
                        <button onClick={() => setShowVacationModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-md transition">
                          <Plus className="w-4 h-4" /> Registrar Mis Vacaciones
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {vacaciones.map(vac => (
                        <div key={vac.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-emerald-200 transition-all">
                          <div className="p-5">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">Destino Vacacional</span>
                                <h3 className="text-xl font-bold text-slate-800 mt-2 flex items-center gap-2">
                                  <MapPin className="w-5 h-5 text-rose-500" /> {vac.lugar || 'Destino'}
                                </h3>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => startEditVacation(vac)} className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-slate-100 rounded-lg transition" title="Editar vacaciones">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteElement('vacaciones', vac.id)} className="text-slate-300 hover:text-rose-500 p-1.5 hover:bg-slate-100 rounded-lg transition" title="Eliminar vacaciones">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs text-slate-600">
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Entrada</p>
                                <p className="font-semibold text-slate-800">{formatearFechaStr(vac.fechaInicio)}</p>
                              </div>
                              <div className="h-6 w-px bg-slate-200" />
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Salida</p>
                                <p className="font-semibold text-slate-800">{formatearFechaStr(vac.fechaFin)}</p>
                              </div>
                            </div>

                            <div className="mt-4">
                              <p className="text-xs font-bold text-slate-500 mb-2">Familiares allí ({vac.quienes?.length || 0}):</p>
                              <div className="flex flex-wrap gap-1.5">
                                {vac.quienes?.map((nombre, idx) => (
                                  <span key={idx} className="text-xs bg-white border border-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded-lg">👤 {nombre}</span>
                                ))}
                              </div>
                            </div>
                            {vac.nota && (
                              <p className="mt-3 text-xs italic text-slate-500 bg-slate-50 p-2 rounded-lg">
                                "{vac.nota}"
                              </p>
                            )}
                          </div>
                          <div className="bg-slate-50 p-3.5 text-right border-t border-slate-100">
                            {vac.ubicacionUrl && (
                              <a href={vac.ubicacionUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 font-bold inline-flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> Ver ubicación en Maps
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ================= PÁGINA: EVENTOS ================= */}
                {activeTab === 'eventos' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <CalendarIcon className="w-6 h-6 text-indigo-600" /> Barbacoas y Quedadas Fines de Semana
                        </h2>
                      </div>
                      <button onClick={() => setShowEventModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shrink-0">
                        <Plus className="w-4 h-4" /> Proponer Plan Familiar
                      </button>
                    </div>

                    <div className="space-y-4">
                      {eventos.map(evt => (
                        <div key={evt.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-2 flex-1 relative pr-12">
                              {/* Botones de acción rápidos */}
                              <div className="absolute top-0 right-0 flex gap-1">
                                <button
                                  onClick={() => startEditEvent(evt)}
                                  className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
                                  title="Editar plan"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteElement('eventos', evt.id)}
                                  className="text-slate-350 hover:text-rose-500 p-1.5 hover:bg-slate-100 rounded-lg transition"
                                  title="Eliminar plan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <h3 className="text-xl font-bold text-slate-800 pr-12">{evt.titulo}</h3>
                              <p className="text-xs text-slate-500">📅 Fecha: {formatearFechaStr(evt.fecha)} - {evt.hora} | 📍 Lugar: {evt.lugar}</p>
                              {evt.descripcion && <p className="text-xs text-slate-650 bg-slate-50 p-2 rounded-lg">{evt.descripcion}</p>}
                              <div className="pt-1">
                                <a
                                  href={getGoogleCalendarUrlForEvent(evt)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 px-3 py-1.5 rounded-xl border border-indigo-200 transition shadow-3xs"
                                  title="Abrir y guardar en Google Calendar"
                                >
                                  <span>📅</span> Añadir a Google Calendar
                                </a>
                              </div>
                            </div>
                            <div className="md:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <p className="text-xs font-bold text-slate-600 mb-2">Confirmados:</p>
                              <div className="flex flex-wrap gap-1">
                                {integrantes.map(int => {
                                  const asiste = evt.asistentes?.includes(int.nombre);
                                  return (
                                    <button
                                      key={int.id}
                                      onClick={() => alternarFamiliarEnEvento(evt.id, evt.asistentes || [], int.nombre)}
                                      className={`text-[9px] px-2 py-0.5 rounded ${asiste ? 'bg-emerald-600 text-white font-bold' : 'bg-white border text-slate-600'}`}
                                    >
                                      {int.nombre}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ================= PÁGINA: CUMPLEAÑOS Y SANTOS ================= */}
                {activeTab === 'cumples' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <Gift className="w-6 h-6 text-pink-500" /> Cumpleaños y Onomásticas (Santos)
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                          No te olvides de felicitar ni por el cumpleaños ni por su Santo. ¡Sincronizado en tiempo real!
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={handleEnviarResumenManualTelegram}
                          className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl shadow-xs shrink-0 inline-flex items-center gap-1.5 transition"
                          title="Enviar aviso de celebraciones al grupo de Telegram (Laos)"
                        >
                          <span>✈️</span> Avisar en Telegram
                        </button>
                        <button
                          onClick={() => exportFamilyCalendarIcs(cumpleanosOrdenados, eventos)}
                          className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-3.5 rounded-xl border border-slate-200 shadow-xs shrink-0 inline-flex items-center gap-1.5 transition"
                          title="Descargar archivo .ics para importar en Google Calendar, iPhone o Outlook"
                        >
                          <Download className="w-4 h-4 text-indigo-600" /> Sincronizar Google Calendar (.ics)
                        </button>
                        <button onClick={() => { setIsEditingCumple(false); setShowCumpleModal(true); }} className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shrink-0 inline-flex items-center gap-1">
                          <Plus className="w-4 h-4" /> Añadir Cumple/Santo
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {cumpleanosOrdenados.map((cum, idx) => (
                        <div key={cum.id} className={`p-5 rounded-2xl border ${idx === 0 ? 'bg-pink-50/70 border-pink-200 ring-2 ring-pink-400' : 'bg-white border-slate-200'}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span>🎂</span>
                              <h3 className="font-bold text-slate-800">{cum.nombre}</h3>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => startEditCumple(cum)} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteElement('cumpleanos', cum.id)} className="text-slate-300 hover:text-rose-500 p-1">✕</button>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-650 space-y-2">
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <p>📅 <strong>Cumpleaños:</strong> {cum.fechaVisual} ({cum.diasFaltantes === 0 ? '¡Hoy! 🎉' : `Faltan ${cum.diasFaltantes} días`})</p>
                              <a
                                href={getGoogleCalendarUrlForBirthday(cum.nombre, cum.fecha)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-slate-400 hover:text-indigo-600 px-1.5 py-0.5 hover:bg-slate-100 rounded-md transition font-bold"
                                title="Añadir cumpleaños a Google Calendar"
                              >
                                📅 +Calendar
                              </a>
                            </div>
                            <div className="text-indigo-600 font-medium flex items-center justify-between gap-1.5 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>✨ <strong>Santo:</strong></span>
                                {cum.santo && cum.santo !== 'No registrado' && !cum.santo.toLowerCase().includes('no especificado') ? (
                                  <>
                                    <span className="bg-indigo-50 text-indigo-750 px-2 py-0.5 rounded-md font-bold">{cum.santo}</span>
                                    {cum.diasFaltantesSanto !== null && cum.diasFaltantesSanto !== undefined && (
                                      <span className="text-[11px] text-indigo-500 font-semibold">
                                        ({cum.diasFaltantesSanto === 0 ? '¡Hoy! 🎉' : (cum.diasFaltantesSanto === 1 ? '¡Mañana!' : `Faltan ${cum.diasFaltantesSanto} días`)})
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => startEditCumple(cum, true)}
                                    className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md text-[10px] font-black transition inline-flex items-center gap-0.5 border border-amber-300 shadow-3xs"
                                  >
                                    ➕ Registrar Santo
                                  </button>
                                )}
                              </div>
                              {cum.santo && cum.santo !== 'No registrado' && !cum.santo.toLowerCase().includes('no especificado') && (
                                <a
                                  href={getGoogleCalendarUrlForSaint(cum.nombre, cum.santo)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-slate-400 hover:text-indigo-600 px-1.5 py-0.5 hover:bg-slate-100 rounded-md transition font-bold"
                                  title="Añadir santo a Google Calendar"
                                >
                                  📅 +Calendar
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ================= PÁGINA: BUZÓN DE IDEAS ================= */}
                {activeTab === 'ideas' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm">
                      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-emerald-600" /> Buzón de Sugerencias Familiares
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 h-fit space-y-4">
                        <form onSubmit={handleAddIdea} className="space-y-3">
                          <input type="text" required className="w-full text-xs p-2.5 rounded-xl border" placeholder="Tu Nombre" value={newIdeaAuthor} onChange={(e) => setNewIdeaAuthor(e.target.value)} />
                          <textarea rows="3" required className="w-full text-xs p-2.5 rounded-xl border" placeholder="Escribe tu idea..." value={newIdeaText} onChange={(e) => setNewIdeaText(e.target.value)} />
                          <button type="submit" className="w-full bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl">Publicar Idea</button>
                        </form>
                      </div>

                      <div className="md:col-span-2 space-y-3">
                        {ideas.map(id => (
                          <div key={id.id} className="bg-white p-4 rounded-xl border border-slate-150 flex justify-between items-center">
                            <div>
                              <p className="text-xs text-slate-700">"{id.texto}"</p>
                              <p className="text-[10px] text-slate-400 font-medium">Propuesto por {id.autor}</p>
                            </div>
                            {(() => {
                              const voterKey = getVoterKey();
                              const userVoted = Array.isArray(id.voters) && id.voters.includes(voterKey);
                              return (
                                <button
                                  onClick={() => handleVotarIdea(id.id, id.voters, id.votos)}
                                  className={`border px-3 py-2 rounded-xl flex flex-col items-center transition-all duration-200 ${
                                    userVoted 
                                      ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-2xs hover:bg-rose-100/70' 
                                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                                  }`}
                                >
                                  <Heart className={`w-4.5 h-4.5 transition-all duration-200 ${userVoted ? 'text-rose-500 fill-rose-500 scale-110' : 'text-slate-400 fill-none hover:scale-105'}`} />
                                  <span className={`text-[10px] font-bold mt-1 ${userVoted ? 'text-rose-600' : 'text-slate-605'}`}>{id.votos || 0} votos</span>
                                </button>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= PÁGINA: CITAS MÉDICAS DE LOS PADRES ================= */}
                {activeTab === 'citas' && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Cabecera del Módulo */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-rose-100 rounded-2xl text-rose-600">
                            <Activity className="w-6 h-6" />
                          </div>
                          <h2 className="text-xl md:text-2xl font-black text-slate-800">
                            Citas Médicas y Revisiones de los Padres 🩺
                          </h2>
                        </div>
                        <p className="text-slate-500 text-xs md:text-sm mt-1 max-w-2xl">
                          Coordinación entre los 7 hermanos para las revisiones de <strong>Encarnación (Mamá)</strong> y <strong>Jaime (Papá)</strong>. Consulta especialistas, centros y quién les acompaña a cada cita.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleDownloadPDF('citas')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                          title="Descargar agenda de citas médicas en PDF"
                        >
                          <Download className="w-4 h-4" /> <span>Descargar PDF</span>
                        </button>
                        <button
                          onClick={handleEnviarResumenCitasTelegram}
                          className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                          title="Enviar lista de próximas citas al grupo de Telegram (Laos)"
                        >
                          <span>✈️</span> Avisar en Telegram
                        </button>
                        <button
                          onClick={() => { resetCitaForm(); setShowCitaModal(true); }}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0"
                        >
                          <Plus className="w-4 h-4" /> Nueva Cita Médica
                        </button>
                      </div>
                    </div>

                    {/* Barra de Filtros y Estadísticas */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-150 shadow-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'todas', label: 'Todas' },
                          { id: 'mama', label: '👵 Mamá (Encarnación)' },
                          { id: 'papa', label: '👴 Papá (Jaime)' },
                          { id: 'sin_acompanante', label: '⚠️ Sin Acompañante' },
                          { id: 'pendientes', label: '⏳ Solo Pendientes' },
                          { id: 'completadas', label: '✅ Realizadas' }
                        ].map(filtro => (
                          <button
                            key={filtro.id}
                            onClick={() => setFiltroPacienteCita(filtro.id)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                              filtroPacienteCita === filtro.id
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {filtro.label}
                          </button>
                        ))}
                      </div>

                      <div className="text-xs text-slate-400 font-medium">
                        {citasMedicas.filter(c => c.estado !== 'completada').length} pendientes • {citasMedicas.filter(c => c.estado === 'completada').length} realizadas
                      </div>
                    </div>

                    {/* Listado de Citas */}
                    {(() => {
                      const citasFiltradas = citasMedicas.filter(c => {
                        if (filtroPacienteCita === 'mama') {
                          return (c.paciente || '').toLowerCase().includes('mamá') || (c.paciente || '').toLowerCase().includes('encarnación');
                        }
                        if (filtroPacienteCita === 'papa') {
                          return (c.paciente || '').toLowerCase().includes('papá') || (c.paciente || '').toLowerCase().includes('jaime');
                        }
                        if (filtroPacienteCita === 'sin_acompanante') {
                          return !c.acompanante || c.acompanante === 'Pendiente de asignar';
                        }
                        if (filtroPacienteCita === 'pendientes') {
                          return c.estado !== 'completada';
                        }
                        if (filtroPacienteCita === 'completadas') {
                          return c.estado === 'completada';
                        }
                        return true;
                      }).sort((a, b) => {
                        if (a.estado !== b.estado) {
                          return a.estado === 'completada' ? 1 : -1;
                        }
                        return (a.fecha || '').localeCompare(b.fecha || '');
                      });

                      if (citasFiltradas.length === 0) {
                        return (
                          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                            <div className="w-14 h-14 mx-auto bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-2xl">
                              🩺
                            </div>
                            <h3 className="text-base font-bold text-slate-800">No hay citas médicas con este filtro</h3>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                              Puedes registrar una nueva cita médica pulsando en el botón superior o cambiar el filtro.
                            </p>
                            <button
                              onClick={() => { resetCitaForm(); setShowCitaModal(true); }}
                              className="mt-2 inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm"
                            >
                              <Plus className="w-4 h-4" /> Registrar Cita
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {citasFiltradas.map(cita => {
                            const hoyIso = new Date().toISOString().slice(0, 10);
                            const diffDias = cita.fecha ? Math.round((new Date(cita.fecha).getTime() - new Date(hoyIso).getTime()) / (1000 * 60 * 60 * 24)) : null;
                            const esMama = (cita.paciente || '').toLowerCase().includes('mamá') || (cita.paciente || '').toLowerCase().includes('encarnación');
                            const esCompletada = cita.estado === 'completada';
                            const sinAcompanante = !cita.acompanante || cita.acompanante === 'Pendiente de asignar';

                            return (
                              <div
                                key={cita.id}
                                className={`rounded-3xl border p-5 transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                                  esCompletada
                                    ? 'bg-slate-50/80 border-slate-200 opacity-75'
                                    : 'bg-white border-slate-200/90 hover:border-rose-300 hover:shadow-md'
                                }`}
                              >
                                <div>
                                  {/* Cabecera de la tarjeta */}
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xl p-2 rounded-2xl ${esMama ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {esMama ? '👵' : '👴'}
                                      </span>
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <h3 className="font-bold text-slate-900 text-sm">{cita.paciente}</h3>
                                          {esCompletada && (
                                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                              Completada
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium">{cita.especialidad}</p>
                                      </div>
                                    </div>

                                    {/* Badge Urgencia / Días */}
                                    <div>
                                      {!esCompletada && diffDias !== null && (
                                        diffDias === 0 ? (
                                          <span className="bg-rose-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1 shadow-xs">
                                            🚨 ¡HOY!
                                          </span>
                                        ) : diffDias === 1 ? (
                                          <span className="bg-amber-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-xs">
                                            ⏳ Mañana
                                          </span>
                                        ) : diffDias > 1 && diffDias <= 7 ? (
                                          <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                                            En {diffDias} días
                                          </span>
                                        ) : diffDias < 0 ? (
                                          <span className="bg-slate-200 text-slate-600 font-medium text-[9px] px-2 py-0.5 rounded-full">
                                            Pasada
                                          </span>
                                        ) : (
                                          <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                                            En {diffDias} días
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>

                                  {/* Detalles de fecha, hora y centro */}
                                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-150">
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Fecha y Hora</span>
                                      <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                                        {formatearFechaStr(cita.fecha)} • {cita.hora || 'Por concretar'}
                                      </p>
                                    </div>

                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Centro Médico</span>
                                      <a
                                        href={cita.ubicacionUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cita.centro)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-indigo-600 hover:underline flex items-center gap-1 mt-0.5 truncate"
                                      >
                                        <MapPin className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                                        <span className="truncate">{cita.centro}</span>
                                      </a>
                                    </div>
                                  </div>

                                  {/* Doctor si está indicado */}
                                  {cita.medico && (
                                    <p className="text-[11px] text-slate-600 font-medium mt-2 flex items-center gap-1.5 px-1">
                                      <span className="text-slate-400">👨‍⚕️ Médico:</span> <strong>{cita.medico}</strong>
                                    </p>
                                  )}

                                  {/* Notas o preparaciones */}
                                  {cita.notas && (
                                    <div className="mt-2.5 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-1.5">
                                      <span className="shrink-0">📋</span>
                                      <span className="font-medium">{cita.notas}</span>
                                    </div>
                                  )}

                                  {/* Acompañante */}
                                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs">🚗</span>
                                      <span className="text-xs text-slate-500 font-medium">Acompaña:</span>
                                      {sinAcompanante ? (
                                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                                          ¡Sin asignar!
                                        </span>
                                      ) : (
                                        <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                          {cita.acompanante}
                                        </span>
                                      )}
                                    </div>

                                    {sinAcompanante && !esCompletada && (
                                      <button
                                        onClick={() => handleAsignarmeComoAcompanante(cita)}
                                        className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-xl transition shadow-2xs shrink-0"
                                      >
                                        Yo le acompaño 👍
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Acciones de la tarjeta */}
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5">
                                    <a
                                      href={generateGoogleCalendarUrlForCita(cita)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2.5 py-1.5 rounded-xl border border-slate-200 transition flex items-center gap-1"
                                      title="Añadir a Google Calendar"
                                    >
                                      <CalendarIcon className="w-3 h-3 text-blue-600" /> +Calendar
                                    </a>

                                    <button
                                      onClick={() => handleToggleEstadoCita(cita)}
                                      className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1 ${
                                        esCompletada
                                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                                      }`}
                                    >
                                      <Check className="w-3 h-3" /> {esCompletada ? 'Reabrir' : 'Hecha'}
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => startEditCita(cita)}
                                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                      title="Editar cita"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCita(cita.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      title="Eliminar cita"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ================= PÁGINA: TRASLADOS Y ESTANCIAS DE LOS PADRES ================= */}
                {activeTab === 'traslados' && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Cabecera del Módulo */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <Car className="w-6 h-6 text-amber-600" /> Traslados y Estancias de los Padres 🚗
                        </h2>
                        <p className="text-slate-500 text-xs sm:text-sm mt-1">
                          Organización entre hermanos: saber dónde están Papá y Mamá (Alcalá ⇄ Madrid) y quién se encarga de cada viaje.
                        </p>
                      </div>

                      <div className="flex gap-2 flex-wrap w-full md:w-auto">
                        <button
                          onClick={() => handleDownloadPDF('traslados')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5"
                          title="Descargar planificación de traslados en PDF"
                        >
                          <Download className="w-4 h-4" /> <span>Descargar PDF</span>
                        </button>
                        <button
                          onClick={handleEnviarResumenTrasladosTelegram}
                          className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
                          title="Enviar calendario de traslados a Telegram (Laos)"
                        >
                          <span>✈️</span> Avisar en Telegram
                        </button>
                        <button
                          onClick={() => { resetTrasladoForm(); setShowTrasladoModal(true); }}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" /> Planificar Traslado
                        </button>
                      </div>
                    </div>

                    {/* Tarjeta de Ubicación Actual: Esgaravita vs Madrid */}
                    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-emerald-50 border border-amber-200/90 rounded-3xl p-6 shadow-xs">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800 block">
                            ESTADO ACTUAL DE LOS PADRES
                          </span>
                          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-0.5">
                            <span>{ubicacionActualPadres.includes('Alcalá') ? '🏡' : '🏢'}</span>
                            Actualmente alojados en: <span className="text-amber-700 underline decoration-amber-400 decoration-2">{ubicacionActualPadres}</span>
                          </h3>
                          <p className="text-xs text-slate-600 mt-1">
                            Puedes cambiar la ubicación actual cuando hayan llegado a su destino para que toda la familia lo sepa.
                          </p>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleChangeUbicacionPadres('Alcalá (Esgaravita)')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition shadow-2xs flex items-center gap-1.5 ${
                              ubicacionActualPadres.includes('Alcalá')
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <span>🌿</span> Alcalá (Esgaravita)
                          </button>
                          <button
                            onClick={() => handleChangeUbicacionPadres('Madrid')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition shadow-2xs flex items-center gap-1.5 ${
                              ubicacionActualPadres.includes('Madrid')
                                ? 'bg-blue-600 text-white border-blue-700'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <span>🏢</span> Madrid
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Filtros de Traslados */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-500 mr-1">Filtrar:</span>
                        {[
                          { id: 'todos', label: 'Todos' },
                          { id: 'pendientes', label: '⏳ Pendientes' },
                          { id: 'sin_conductor', label: '⚠️ Sin Conductor' },
                          { id: 'madrid_esga', label: 'Madrid ➔ Esga' },
                          { id: 'esga_madrid', label: 'Esga ➔ Madrid' },
                          { id: 'realizados', label: '✅ Realizados' }
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => setFiltroTraslado(f.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              filtroTraslado === f.id
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <div className="text-xs text-slate-400 font-medium">
                        {trasladosPadres.filter(t => t.estado !== 'realizado').length} pendientes • {trasladosPadres.filter(t => t.estado === 'realizado').length} realizados
                      </div>
                    </div>

                    {/* Listado de Tarjetas de Traslados */}
                    {(() => {
                      const trasladosFiltrados = trasladosPadres.filter(t => {
                        if (filtroTraslado === 'pendientes') {
                          return t.estado !== 'realizado';
                        }
                        if (filtroTraslado === 'sin_conductor') {
                          return (!t.conductor || t.conductor === 'Pendiente de asignar') && t.estado !== 'realizado';
                        }
                        if (filtroTraslado === 'madrid_esga') {
                          return (t.origen || '').toLowerCase().includes('madrid');
                        }
                        if (filtroTraslado === 'esga_madrid') {
                          return (t.origen || '').toLowerCase().includes('alcalá') || (t.origen || '').toLowerCase().includes('esga');
                        }
                        if (filtroTraslado === 'realizados') {
                          return t.estado === 'realizado';
                        }
                        return true;
                      }).sort((a, b) => {
                        if (a.estado !== b.estado) {
                          return a.estado === 'realizado' ? 1 : -1;
                        }
                        return (a.fecha || '').localeCompare(b.fecha || '');
                      });

                      if (trasladosFiltrados.length === 0) {
                        return (
                          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                            <div className="w-14 h-14 mx-auto bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-2xl">
                              🚗
                            </div>
                            <h3 className="text-base font-bold text-slate-800">No hay traslados con este filtro</h3>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                              Puedes planificar un nuevo traslado de los padres entre Madrid y Alcalá pulsando el botón superior.
                            </p>
                            <button
                              onClick={() => { resetTrasladoForm(); setShowTrasladoModal(true); }}
                              className="mt-2 inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm"
                            >
                              <Plus className="w-4 h-4" /> Planificar Traslado
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {trasladosFiltrados.map(traslado => {
                            const hoyIso = getFechaHoyLocal();
                            const diffDias = traslado.fecha ? Math.round((new Date(traslado.fecha).getTime() - new Date(hoyIso).getTime()) / (1000 * 60 * 60 * 24)) : null;
                            const esRealizado = traslado.estado === 'realizado';
                            const sinConductor = !traslado.conductor || traslado.conductor === 'Pendiente de asignar';
                            const vaAEsga = (traslado.destino || '').toLowerCase().includes('alcalá') || (traslado.destino || '').toLowerCase().includes('esga');

                            return (
                              <div
                                key={traslado.id}
                                className={`rounded-3xl border p-5 transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                                  esRealizado
                                    ? 'bg-slate-50/80 border-slate-200 opacity-75'
                                    : 'bg-white border-slate-200/90 hover:border-amber-300 hover:shadow-md'
                                }`}
                              >
                                <div>
                                  {/* Cabecera de la tarjeta: Ruta */}
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-2xl shadow-3xs">
                                          <span className="text-xs font-black text-slate-800">
                                            {traslado.origen}
                                          </span>
                                          <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                          <span className={`text-xs font-black ${vaAEsga ? 'text-emerald-700' : 'text-blue-700'}`}>
                                            {traslado.destino}
                                          </span>
                                        </div>
                                        {esRealizado && (
                                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                            Realizado
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Badge días restantes */}
                                    <div>
                                      {!esRealizado && diffDias !== null && (
                                        diffDias === 0 ? (
                                          <span className="bg-rose-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1 shadow-xs">
                                            🚨 ¡HOY!
                                          </span>
                                        ) : diffDias === 1 ? (
                                          <span className="bg-amber-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-xs">
                                            ⏳ Mañana
                                          </span>
                                        ) : diffDias > 1 && diffDias <= 7 ? (
                                          <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                                            En {diffDias} días
                                          </span>
                                        ) : diffDias < 0 ? (
                                          <span className="bg-slate-200 text-slate-600 font-medium text-[9px] px-2 py-0.5 rounded-full">
                                            Pasado
                                          </span>
                                        ) : (
                                          <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                                            En {diffDias} días
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>

                                  {/* Detalles de fecha y hora */}
                                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-150">
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Fecha Prevista</span>
                                      <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                                        {formatearFechaStr(traslado.fecha)}
                                      </p>
                                    </div>

                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Horario / Franja</span>
                                      <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                                        <span>⏰</span>
                                        {traslado.hora || '18:00'} ({traslado.momentoDia || 'Tarde'})
                                      </p>
                                    </div>
                                  </div>

                                  {/* Notas adicionales */}
                                  {traslado.notas && (
                                    <div className="mt-2.5 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-1.5">
                                      <span className="shrink-0">📋</span>
                                      <span className="font-medium">{traslado.notas}</span>
                                    </div>
                                  )}

                                  {/* Conductor asignado */}
                                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs">🚗</span>
                                      <span className="text-xs text-slate-500 font-medium">Conductor:</span>
                                      {sinConductor ? (
                                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                                          ¡Sin asignar!
                                        </span>
                                      ) : (
                                        <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                          {traslado.conductor}
                                        </span>
                                      )}
                                    </div>

                                    {sinConductor && !esRealizado && (
                                      <button
                                        onClick={() => handleAsignarmeComoConductor(traslado)}
                                        className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-xl transition shadow-2xs shrink-0"
                                      >
                                        Yo les llevo 👍
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Acciones de la tarjeta */}
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5">
                                    <a
                                      href={generateGoogleCalendarUrlForTraslado(traslado)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2.5 py-1.5 rounded-xl border border-slate-200 transition flex items-center gap-1"
                                      title="Añadir a Google Calendar"
                                    >
                                      <CalendarIcon className="w-3 h-3 text-blue-600" /> +Calendar
                                    </a>

                                    <button
                                      onClick={() => handleToggleEstadoTraslado(traslado)}
                                      className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1 ${
                                        esRealizado
                                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                                      }`}
                                    >
                                      <Check className="w-3 h-3" /> {esRealizado ? 'Reabrir' : 'Realizado'}
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => startEditTraslado(traslado)}
                                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                      title="Editar traslado"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTraslado(traslado.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      title="Eliminar traslado"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </main>

          {/* --- MODALES --- */}

          {/* 1.5. Asistente de Importación de Vacaciones con Inteligencia Artificial */}
          {showImportModal && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-100 my-8">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-1.5">
                    <span>🪄</span> Asistente Vacacional Inteligente
                  </h3>
                  <button 
                    onClick={() => { setShowImportModal(false); setImportText(''); setParsedImportList([]); }}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Pega o dicta tus notas sobre el verano (fechas, rangos de días, destinos, quiénes viajan, etc.) en el recuadro inferior. El asistente extraerá automáticamente todos los tramos organizados por meses.
                  </p>
                  
                  <textarea 
                    rows="6" 
                    placeholder="Ej: Julio: del 1 al 10 en esgaravita. Del 10 al 14 en Llanes con Tere y Jorge..." 
                    className="w-full p-3 border border-slate-200 rounded-2xl text-xs font-mono bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500 transition-all outline-none"
                    value={importText} 
                    onChange={(e) => setImportText(e.target.value)} 
                  />

                  <div className="flex justify-end gap-2">
                    <button 
                      type="button" 
                      onClick={() => { setShowImportModal(false); setImportText(''); setParsedImportList([]); }} 
                      className="text-xs font-semibold px-4 py-2 text-slate-500 hover:text-slate-700 transition"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button" 
                      onClick={() => parseDictadoVacaciones(importText)} 
                      className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md transition-all duration-200"
                    >
                      Analizar Texto 🪄
                    </button>
                  </div>
                </div>

                {parsedImportList.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-3 animate-fadeIn">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                      <span>📌</span> Tramos de Vacaciones Detectados ({parsedImportList.length})
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Revisa los tramos, ajusta los detalles si es necesario y selecciona qué familiares participarán en cada viaje.
                    </p>

                    <div className="overflow-x-auto border border-slate-150 rounded-2xl max-h-80">
                      <table className="w-full text-[11px] text-left border-collapse bg-slate-50/30">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 uppercase text-[9px] font-black tracking-wider border-b border-slate-200">
                            <th className="p-3">Destino</th>
                            <th className="p-3">Fechas (Inic ➔ Fin)</th>
                            <th className="p-3">Notas</th>
                            <th className="p-3">Viajeros</th>
                            <th className="p-2 text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 text-slate-700">
                          {parsedImportList.map((tramo, idx) => (
                            <tr key={tramo.id} className="hover:bg-white transition-colors">
                              <td className="p-3">
                                <input 
                                  type="text" 
                                  className="p-1.5 border rounded-lg w-28 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-violet-400"
                                  value={tramo.lugar}
                                  onChange={(e) => {
                                    const updated = [...parsedImportList];
                                    updated[idx].lugar = e.target.value;
                                    setParsedImportList(updated);
                                  }}
                                />
                              </td>
                              <td className="p-3 space-y-1">
                                <div className="flex flex-col gap-1">
                                  <input 
                                    type="date" 
                                    className="p-1 border rounded-lg text-[10px] bg-white text-slate-800"
                                    value={tramo.fechaInicio}
                                    onChange={(e) => {
                                      const updated = [...parsedImportList];
                                      updated[idx].fechaInicio = e.target.value;
                                      setParsedImportList(updated);
                                    }}
                                  />
                                  <input 
                                    type="date" 
                                    className="p-1 border rounded-lg text-[10px] bg-white text-slate-800"
                                    value={tramo.fechaFin}
                                    onChange={(e) => {
                                      const updated = [...parsedImportList];
                                      updated[idx].fechaFin = e.target.value;
                                      setParsedImportList(updated);
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="p-3">
                                <textarea 
                                  rows="2"
                                  className="p-1.5 border rounded-lg w-32 bg-white text-[10px] text-slate-650"
                                  value={tramo.nota}
                                  onChange={(e) => {
                                    const updated = [...parsedImportList];
                                    updated[idx].nota = e.target.value;
                                    setParsedImportList(updated);
                                  }}
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-0.5 max-w-40 max-h-24 overflow-y-auto p-1 bg-white border rounded-lg">
                                  {integrantes.map(miembro => {
                                    const activo = tramo.quienes.includes(miembro.nombre);
                                    return (
                                      <button
                                        key={miembro.id}
                                        type="button"
                                        onClick={() => {
                                          const updated = [...parsedImportList];
                                          const quienesAct = tramo.quienes;
                                          if (quienesAct.includes(miembro.nombre)) {
                                            updated[idx].quienes = quienesAct.filter(q => q !== miembro.nombre);
                                          } else {
                                            updated[idx].quienes = [...quienesAct, miembro.nombre];
                                          }
                                          setParsedImportList(updated);
                                        }}
                                        className={`px-1.5 py-0.5 rounded text-[9px] border transition ${
                                          activo ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'bg-slate-50 text-slate-400 border-slate-100'
                                        }`}
                                      >
                                        {miembro.nombre.split(' ')[0]}
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const updated = parsedImportList.filter(t => t.id !== tramo.id);
                                    setParsedImportList(updated);
                                  }}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition"
                                  title="Eliminar tramo"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                      <button 
                        type="button" 
                        onClick={() => { setImportText(''); setParsedImportList([]); }}
                        className="text-xs font-semibold px-4 py-2.5 text-slate-500 hover:text-slate-700 transition"
                      >
                        Limpiar Todo
                      </button>
                      <button 
                        type="button" 
                        onClick={handleSaveImportedVacations} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition duration-200"
                      >
                        Guardar Tramos en la Nube 🚀
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 1. Registrar Vacaciones */}
          {showVacationModal && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4">
                <h3 className="font-bold text-slate-800 text-lg">{isEditingVacation ? 'Editar Vacaciones' : 'Registrar Vacaciones'}</h3>
                <form onSubmit={handleAddVacation} className="space-y-3 text-xs">
                  <input type="text" required placeholder="Destino..." className="w-full p-2.5 border rounded-xl" value={newVacation.lugar} onChange={(e) => setNewVacation({ ...newVacation, lugar: e.target.value })} />
                  <input type="url" placeholder="URL Google Maps (Opcional)..." className="w-full p-2.5 border rounded-xl" value={newVacation.ubicacionUrl} onChange={(e) => setNewVacation({ ...newVacation, ubicacionUrl: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Entrada</label>
                      <input type="date" required className="w-full p-2.5 border rounded-xl" value={newVacation.fechaInicio} onChange={(e) => setNewVacation({ ...newVacation, fechaInicio: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Salida</label>
                      <input type="date" required className="w-full p-2.5 border rounded-xl" value={newVacation.fechaFin} onChange={(e) => setNewVacation({ ...newVacation, fechaFin: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Familiares que viajan:</label>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 border rounded-xl">
                      {integrantes.map(miembro => {
                        const seleccionado = newVacation.quienes?.includes(miembro.nombre);
                        return (
                          <button key={miembro.id} type="button" onClick={() => toggleQuienVacacion(miembro.nombre)} className={`px-2 py-1 rounded text-[10px] border transition-all ${seleccionado ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'bg-slate-50 text-slate-500'}`}>
                            {miembro.nombre}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <textarea placeholder="Alguna nota extra (ej: tramo libre, nos vemos allí...)..." rows="2" className="w-full p-2.5 border rounded-xl" value={newVacation.nota} onChange={(e) => setNewVacation({ ...newVacation, nota: e.target.value })} />
                  
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button type="button" onClick={() => { setShowVacationModal(false); setIsEditingVacation(false); setEditingVacationId(null); setNewVacation({ lugar: '', ubicacionUrl: '', fechaInicio: '', fechaFin: '', quienes: [], nota: '' }); }} className="p-2">Cancelar</button>
                    <button type="submit" className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold">{isEditingVacation ? 'Guardar Cambios' : 'Registrar'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 2. Confirmar Resetear Vacaciones */}
          {showConfirmResetModal && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4">
                <h3 className="font-bold text-slate-950 text-lg">¿Resetear todas las vacaciones?</h3>
                <p className="text-xs text-slate-500">Esta acción eliminará de forma irreversible todas las vacaciones.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowConfirmResetModal(false)} className="w-full border p-2 rounded-xl text-xs">No, cancelar</button>
                  <button onClick={handleClearAllVacations} className="w-full bg-rose-600 text-white p-2 rounded-xl text-xs">Sí, vaciar todo</button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Registrar Familiar */}
          {showMemberModal && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
                <h3 className="font-bold text-slate-800 text-base">Añadir Miembro / Familiar</h3>
                <form onSubmit={handleAddMember} className="space-y-4 text-xs">
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nombre Completo:</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej: Sofía, Lucas, Elena..." 
                      className="w-full p-2.5 border rounded-xl" 
                      value={newMember.nombre} 
                      onChange={(e) => setNewMember({ ...newMember, nombre: e.target.value })} 
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-slate-500">Día de su Santo (Onomástica - Opcional):</label>
                      {newMember.santo && (
                        <button
                          type="button"
                          onClick={() => setNewMember({ ...newMember, santo: '' })}
                          className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold"
                        >
                          Quitar Santo
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <select 
                          className="w-full p-2.5 border rounded-xl bg-white text-slate-700 font-medium"
                          value={getSantoDia(newMember.santo)}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              setNewMember({ ...newMember, santo: '' });
                            } else {
                              const mes = getSantoMes(newMember.santo) || '01';
                              setNewMember({ ...newMember, santo: updateSantoFromDiaMes(val, mes) });
                            }
                          }}
                        >
                          <option value="">-- Sin día --</option>
                          {Array.from({ length: 31 }, (_, i) => {
                            const num = String(i + 1).padStart(2, '0');
                            return <option key={num} value={num}>{num}</option>;
                          })}
                        </select>
                      </div>
                      <div>
                        <select 
                          className="w-full p-2.5 border rounded-xl bg-white text-slate-700 font-medium"
                          value={getSantoMes(newMember.santo)}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              setNewMember({ ...newMember, santo: '' });
                            } else {
                              const dia = getSantoDia(newMember.santo) || '01';
                              setNewMember({ ...newMember, santo: updateSantoFromDiaMes(dia, val) });
                            }
                          }}
                        >
                          <option value="">-- Sin mes --</option>
                          {Array.from({ length: 12 }, (_, i) => {
                            const num = String(i + 1).padStart(2, '0');
                            return <option key={num} value={num}>{MESES_NOMBRES[i]}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                    {newMember.santo && (
                      <p className="text-[10px] text-indigo-600 font-bold mt-1">✨ {newMember.santo}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Rol / Tipo de Familiar:</label>
                    <select 
                      className="w-full p-2.5 border rounded-xl bg-white font-bold" 
                      value={newMember.tipoFamiliar} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewMember({ 
                          ...newMember, 
                          tipoFamiliar: val, 
                          rol: val === 'Abuelos' ? 'Padres' : val,
                          hijoAsociado: val === 'Abuelos' ? (newMember.hijoAsociado || (integrantes.find(i => i.nombre === 'Mamá') ? 'Mamá' : '')) : ''
                        });
                      }}
                    >
                      <option value="Hermanos">Hermano/a (Uno de los 7 hermanos)</option>
                      <option value="Cuñados">Cuñado/a (Pareja de un hermano)</option>
                      <option value="Hijos">Hijo/a (Sobrino/a de la familia)</option>
                      <option value="Padres">Padre/Madre directo (Mamá o Papá)</option>
                      <option value="Abuelos">Abuelo/a (Padres de Mamá o Papá)</option>
                      <option value="Tíos/Familiares">Tío/a u Otro Familiar (Tía Mariuge, primos, etc.)</option>
                    </select>
                  </div>

                  {/* CAMPOS DINÁMICOS SEGÚN EL ROL */}
                  
                  {newMember.tipoFamiliar === 'Hermanos' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">¿Quién es su pareja? (Opcional):</label>
                      <select 
                        className="w-full p-2.5 border rounded-xl bg-white" 
                        value={newMember.parejaDe}
                        onChange={(e) => setNewMember({ ...newMember, parejaDe: e.target.value })}
                      >
                        <option value="">Nadie / Soltero</option>
                        {integrantes.filter(i => i.rol === 'Cuñados').map(i => (
                          <option key={i.id} value={i.nombre}>{i.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newMember.tipoFamiliar === 'Cuñados' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">¿De quién es pareja? (Recomendado):</label>
                      <select 
                        className="w-full p-2.5 border rounded-xl bg-white" 
                        value={newMember.parejaDe}
                        onChange={(e) => setNewMember({ ...newMember, parejaDe: e.target.value })}
                      >
                        <option value="">Ninguno / Por asignar</option>
                        {integrantes.filter(i => i.rol === 'Hermanos').map(i => (
                          <option key={i.id} value={i.nombre}>{i.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newMember.tipoFamiliar === 'Hijos' && (
                    <>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500">¿Quiénes son sus padres? (Selecciona los dos):</label>
                        <div className="grid grid-cols-2 gap-2">
                          <select 
                            className="p-2.5 border rounded-xl bg-white" 
                            value={newMember.padre1}
                            onChange={(e) => setNewMember({ ...newMember, padre1: e.target.value })}
                          >
                            <option value="">Madre/Padre 1</option>
                            {integrantes.filter(i => i.rol === 'Hermanos' || i.rol === 'Cuñados').map(i => (
                              <option key={i.id} value={i.nombre}>{i.nombre}</option>
                            ))}
                          </select>
                          <select 
                            className="p-2.5 border rounded-xl bg-white" 
                            value={newMember.padre2}
                            onChange={(e) => setNewMember({ ...newMember, padre2: e.target.value })}
                          >
                            <option value="">Madre/Padre 2</option>
                            {integrantes.filter(i => i.rol === 'Hermanos' || i.rol === 'Cuñados').map(i => (
                              <option key={i.id} value={i.nombre}>{i.nombre}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">¿Quién es su Padrino o Madrina?:</label>
                        <select 
                          className="w-full p-2.5 border rounded-xl bg-white" 
                          value={newMember.padrinoMadrina}
                          onChange={(e) => setNewMember({ ...newMember, padrinoMadrina: e.target.value })}
                        >
                          <option value="">Sin padrino registrado</option>
                          {integrantes.filter(i => i.rol === 'Hermanos' || i.rol === 'Cuñados').map(i => (
                            <option key={i.id} value={i.nombre}>{i.nombre}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {newMember.tipoFamiliar === 'Abuelos' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">¿De quién es padre/madre? (Elige a Mamá o Papá):</label>
                      <select 
                        className="w-full p-2.5 border rounded-xl bg-white font-bold text-indigo-750" 
                        value={newMember.hijoAsociado}
                        onChange={(e) => setNewMember({ ...newMember, hijoAsociado: e.target.value })}
                        required
                      >
                        <option value="">-- Selecciona --</option>
                        {integrantes.filter(i => {
                          if (i.rol !== 'Padres') return false;
                          const esAbuelo = integrantes.some(otro => otro.rol === 'Padres' && otro.padres && otro.padres.includes(i.nombre));
                          return !esAbuelo;
                        }).map(i => (
                          <option key={i.id} value={i.nombre}>{i.nombre}</option>
                        ))}
                      </select>
                      <p className="text-[9px] text-slate-400 mt-1.5 italic">Esto colocará automáticamente al abuelo/a en la rama correcta del árbol familiar.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Fecha de Nacimiento (Opcional - Usado para ordenar hijos por edad):</label>
                    <input 
                      type="date" 
                      className="w-full p-2.5 border rounded-xl" 
                      value={newMember.fechaNacimiento || ''} 
                      onChange={(e) => setNewMember({ ...newMember, fechaNacimiento: e.target.value })} 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Correo Electrónico de Google (Opcional):</label>
                    <input 
                      type="email" 
                      placeholder="Ej: isaac81@gmail.com..." 
                      className="w-full p-2.5 border rounded-xl" 
                      value={newMember.email || ''} 
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} 
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button type="button" onClick={() => { setShowMemberModal(false); setNewMember({ nombre: '', rol: 'Hermanos', tipoFamiliar: 'Hermanos', parejaDe: '', padre1: '', padre2: '', padrinoMadrina: '', santo: '', hijoAsociado: '', email: '' }); }} className="p-2">Cancelar</button>
                    <button type="submit" className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold">Añadir</button>
                  </div>

                </form>
              </div>
            </div>
          )}

          {/* 1. Editar Familiar */}
          {showEditMemberModal && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <h3 className="font-bold text-slate-800 text-base">Editar Familiar</h3>
                <form onSubmit={handleSaveEditedMember} className="space-y-4 text-xs">
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nombre Base:</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej: Isaac, Sofía..." 
                      className="w-full p-2.5 border rounded-xl" 
                      value={editMemberForm.nombreBase} 
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, nombreBase: e.target.value })} 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Pseudónimo / Apodo:</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Isik, Sofi (Opcional)..." 
                      className="w-full p-2.5 border rounded-xl" 
                      value={editMemberForm.pseudonimo} 
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, pseudonimo: e.target.value })} 
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-slate-500">Día de su Santo (Onomástica - Opcional):</label>
                      {editMemberForm.santo && (
                        <button
                          type="button"
                          onClick={() => setEditMemberForm({ ...editMemberForm, santo: '' })}
                          className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold"
                        >
                          Quitar Santo
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <select 
                          className="w-full p-2.5 border rounded-xl bg-white text-slate-700 font-medium"
                          value={getSantoDia(editMemberForm.santo)}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              setEditMemberForm({ ...editMemberForm, santo: '' });
                            } else {
                              const mes = getSantoMes(editMemberForm.santo) || '01';
                              setEditMemberForm({ ...editMemberForm, santo: updateSantoFromDiaMes(val, mes) });
                            }
                          }}
                        >
                          <option value="">-- Sin día --</option>
                          {Array.from({ length: 31 }, (_, i) => {
                            const num = String(i + 1).padStart(2, '0');
                            return <option key={num} value={num}>{num}</option>;
                          })}
                        </select>
                      </div>
                      <div>
                        <select 
                          className="w-full p-2.5 border rounded-xl bg-white text-slate-700 font-medium"
                          value={getSantoMes(editMemberForm.santo)}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              setEditMemberForm({ ...editMemberForm, santo: '' });
                            } else {
                              const dia = getSantoDia(editMemberForm.santo) || '01';
                              setEditMemberForm({ ...editMemberForm, santo: updateSantoFromDiaMes(dia, val) });
                            }
                          }}
                        >
                          <option value="">-- Sin mes --</option>
                          {Array.from({ length: 12 }, (_, i) => {
                            const num = String(i + 1).padStart(2, '0');
                            return <option key={num} value={num}>{MESES_NOMBRES[i]}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                    {editMemberForm.santo && (
                      <p className="text-[10px] text-indigo-600 font-bold mt-1">✨ {editMemberForm.santo}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Rol / Tipo de Familiar:</label>
                    <select 
                      className="w-full p-2.5 border rounded-xl bg-white font-bold" 
                      value={editMemberForm.tipoFamiliar} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditMemberForm({ 
                          ...editMemberForm, 
                          tipoFamiliar: val, 
                          rol: val === 'Abuelos' ? 'Padres' : val,
                          hijoAsociado: val === 'Abuelos' ? (editMemberForm.hijoAsociado || (integrantes.find(i => i.nombre === 'Mamá') ? 'Mamá' : '')) : ''
                        });
                      }}
                    >
                      <option value="Hermanos">Hermano/a (Uno de los 7 hermanos)</option>
                      <option value="Cuñados">Cuñado/a (Pareja de un hermano)</option>
                      <option value="Hijos">Hijo/a (Sobrino/a de la familia)</option>
                      <option value="Padres">Padre/Madre directo (Mamá o Papá)</option>
                      <option value="Abuelos">Abuelo/a (Padres de Mamá o Papá)</option>
                      <option value="Tíos/Familiares">Tío/a u Otro Familiar (Tía Mariuge, primos, etc.)</option>
                    </select>
                  </div>

                  {/* CAMPOS DINÁMICOS EN EDICIÓN */}
                  
                  {editMemberForm.tipoFamiliar === 'Hermanos' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">¿Quién es su pareja? (Opcional):</label>
                      <select 
                        className="w-full p-2.5 border rounded-xl bg-white" 
                        value={editMemberForm.parejaDe}
                        onChange={(e) => setEditMemberForm({ ...editMemberForm, parejaDe: e.target.value })}
                      >
                        <option value="">Nadie / Soltero</option>
                        {integrantes.filter(i => i.rol === 'Cuñados' && i.nombre !== editingMemberOldNombre).map(i => (
                          <option key={i.id} value={i.nombre}>{i.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {editMemberForm.tipoFamiliar === 'Cuñados' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">¿De quién es pareja? (Recomendado):</label>
                      <select 
                        className="w-full p-2.5 border rounded-xl bg-white" 
                        value={editMemberForm.parejaDe}
                        onChange={(e) => setEditMemberForm({ ...editMemberForm, parejaDe: e.target.value })}
                      >
                        <option value="">Ninguno / Por asignar</option>
                        {integrantes.filter(i => i.rol === 'Hermanos' && i.nombre !== editingMemberOldNombre).map(i => (
                          <option key={i.id} value={i.nombre}>{i.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {editMemberForm.tipoFamiliar === 'Hijos' && (
                    <>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500">¿Quiénes son sus padres? (Selecciona los dos):</label>
                        <div className="grid grid-cols-2 gap-2">
                          <select 
                            className="p-2.5 border rounded-xl bg-white" 
                            value={editMemberForm.padre1}
                            onChange={(e) => setEditMemberForm({ ...editMemberForm, padre1: e.target.value })}
                          >
                            <option value="">Madre/Padre 1</option>
                            {integrantes.filter(i => (i.rol === 'Hermanos' || i.rol === 'Cuñados') && i.nombre !== editingMemberOldNombre).map(i => (
                              <option key={i.id} value={i.nombre}>{i.nombre}</option>
                            ))}
                          </select>
                          <select 
                            className="p-2.5 border rounded-xl bg-white" 
                            value={editMemberForm.padre2}
                            onChange={(e) => setEditMemberForm({ ...editMemberForm, padre2: e.target.value })}
                          >
                            <option value="">Madre/Padre 2</option>
                            {integrantes.filter(i => (i.rol === 'Hermanos' || i.rol === 'Cuñados') && i.nombre !== editingMemberOldNombre).map(i => (
                              <option key={i.id} value={i.nombre}>{i.nombre}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">¿Quién es su Padrino o Madrina?:</label>
                        <select 
                          className="w-full p-2.5 border rounded-xl bg-white" 
                          value={editMemberForm.padrinoMadrina}
                          onChange={(e) => setEditMemberForm({ ...editMemberForm, padrinoMadrina: e.target.value })}
                        >
                          <option value="">Sin padrino registrado</option>
                          {integrantes.filter(i => (i.rol === 'Hermanos' || i.rol === 'Cuñados') && i.nombre !== editingMemberOldNombre).map(i => (
                            <option key={i.id} value={i.nombre}>{i.nombre}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {editMemberForm.tipoFamiliar === 'Abuelos' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">¿De quién es padre/madre? (Elige a Mamá o Papá):</label>
                      <select 
                        className="w-full p-2.5 border rounded-xl bg-white font-bold text-indigo-750" 
                        value={editMemberForm.hijoAsociado}
                        onChange={(e) => setEditMemberForm({ ...editMemberForm, hijoAsociado: e.target.value })}
                        required
                      >
                        <option value="">-- Selecciona --</option>
                        {integrantes.filter(i => {
                          if (i.rol !== 'Padres' || i.nombre === editingMemberOldNombre) return false;
                          const esAbuelo = integrantes.some(otro => otro.rol === 'Padres' && otro.padres && otro.padres.includes(i.nombre));
                          return !esAbuelo;
                        }).map(i => (
                          <option key={i.id} value={i.nombre}>{i.nombre}</option>
                        ))}
                      </select>
                      <p className="text-[9px] text-slate-400 mt-1.5 italic">Esto colocará automáticamente al abuelo/a en la rama correcta del árbol familiar.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Fecha de Nacimiento (Opcional - Usado para ordenar hijos por edad):</label>
                    <input 
                      type="date" 
                      className="w-full p-2.5 border rounded-xl" 
                      value={editMemberForm.fechaNacimiento || ''} 
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, fechaNacimiento: e.target.value })} 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Correo Electrónico de Google (Opcional):</label>
                    <input 
                      type="email" 
                      placeholder="Ej: isaac81@gmail.com..." 
                      className="w-full p-2.5 border rounded-xl" 
                      value={editMemberForm.email || ''} 
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, email: e.target.value })} 
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button type="button" onClick={() => setShowEditMemberModal(false)} className="p-2">Cancelar</button>
                    <button type="submit" className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold">Guardar Cambios</button>
                  </div>

                </form>
              </div>
            </div>
          )}

          {/* 4. Registrar Cumpleaños */}
          {showCumpleModal && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4">
                <h3 className="font-bold text-slate-800 text-base">{isEditingCumple ? 'Editar Cumpleaños' : 'Registrar Cumpleaños'}</h3>
                <form onSubmit={handleSaveCumple} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nombre:</label>
                    <input type="text" required placeholder="Nombre..." className="w-full p-2.5 border rounded-xl" value={newCumple.nombre} onChange={(e) => setNewCumple({ ...newCumple, nombre: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Día:</label>
                      <select className="w-full p-2.5 border rounded-xl bg-white" value={newCumple.dia} onChange={(e) => setNewCumple({ ...newCumple, dia: e.target.value })}>
                        {Array.from({ length: 31 }, (_, i) => {
                          const num = String(i + 1).padStart(2, '0');
                          return <option key={num} value={num}>{num}</option>;
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Mes:</label>
                      <select className="w-full p-2.5 border rounded-xl bg-white" value={newCumple.mes} onChange={(e) => setNewCumple({ ...newCumple, mes: e.target.value })}>
                        {Array.from({ length: 12 }, (_, i) => {
                          const num = String(i + 1).padStart(2, '0');
                          return <option key={num} value={num}>{obtenerNombreMes(i + 1)}</option>;
                        })}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Parentesco:</label>
                    <select className="w-full p-2.5 border rounded-xl bg-white" value={newCumple.parentesco} onChange={(e) => setNewCumple({ ...newCumple, parentesco: e.target.value })}>
                      <option value="Hermano">Hermano/a</option>
                      <option value="Cuñado">Cuñado/a</option>
                      <option value="Sobrino/Hijo">Sobrino/a / Hijo/a</option>
                      <option value="Mamá">Mamá</option>
                      <option value="Papá">Papá</option>
                      <option value="Abuelo">Abuelo/a</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-slate-500">Día de su Santo (Onomástica - Opcional):</label>
                      {newCumple.santo && (
                        <button
                          type="button"
                          onClick={() => setNewCumple({ ...newCumple, santo: '' })}
                          className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold"
                        >
                          Quitar Santo
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <select 
                          className="w-full p-2.5 border rounded-xl bg-white text-slate-700 font-medium"
                          value={getSantoDia(newCumple.santo)}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              setNewCumple({ ...newCumple, santo: '' });
                            } else {
                              const mes = getSantoMes(newCumple.santo) || '01';
                              setNewCumple({ ...newCumple, santo: updateSantoFromDiaMes(val, mes) });
                            }
                          }}
                        >
                          <option value="">-- Sin día --</option>
                          {Array.from({ length: 31 }, (_, i) => {
                            const num = String(i + 1).padStart(2, '0');
                            return <option key={num} value={num}>{num}</option>;
                          })}
                        </select>
                      </div>
                      <div>
                        <select 
                          className="w-full p-2.5 border rounded-xl bg-white text-slate-700 font-medium"
                          value={getSantoMes(newCumple.santo)}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              setNewCumple({ ...newCumple, santo: '' });
                            } else {
                              const dia = getSantoDia(newCumple.santo) || '01';
                              setNewCumple({ ...newCumple, santo: updateSantoFromDiaMes(dia, val) });
                            }
                          }}
                        >
                          <option value="">-- Sin mes --</option>
                          {Array.from({ length: 12 }, (_, i) => {
                            const num = String(i + 1).padStart(2, '0');
                            return <option key={num} value={num}>{MESES_NOMBRES[i]}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                    {newCumple.santo && (
                      <p className="text-[10px] text-indigo-600 font-bold mt-1">✨ {newCumple.santo}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button type="button" onClick={() => { setShowCumpleModal(false); setIsEditingCumple(false); }} className="p-2">Cancelar</button>
                    <button type="submit" className="bg-pink-600 text-white px-5 py-2 rounded-xl font-bold">Guardar</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 5. Proponer Quedada / Evento */}
          {showEventModal && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-xs">
                <h3 className="font-bold text-slate-800 text-base">{isEditingEvent ? 'Editar Plan / Quedada Familiar' : 'Proponer Plan / Quedada Familiar'}</h3>
                <form onSubmit={handleSaveEvent} className="space-y-3">
                  <input type="text" required placeholder="Título del plan (ej: Barbacoa familiar...)" className="w-full p-2.5 border rounded-xl" value={newEvent.titulo} onChange={(e) => setNewEvent({ ...newEvent, titulo: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Fecha</label>
                      <input type="date" required className="w-full p-2.5 border rounded-xl" value={newEvent.fecha} onChange={(e) => setNewEvent({ ...newEvent, fecha: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Hora</label>
                      <input type="time" className="w-full p-2.5 border rounded-xl" value={newEvent.hora} onChange={(e) => setNewEvent({ ...newEvent, hora: e.target.value })} />
                    </div>
                  </div>
                  <input type="text" required placeholder="Lugar (ej: Ribera, casa de mamá...)" className="w-full p-2.5 border rounded-xl" value={newEvent.lugar} onChange={(e) => setNewEvent({ ...newEvent, lugar: e.target.value })} />
                  <input type="url" placeholder="URL ubicación (Google Maps, opcional)..." className="w-full p-2.5 border rounded-xl" value={newEvent.ubicacionUrl} onChange={(e) => setNewEvent({ ...newEvent, ubicacionUrl: e.target.value })} />
                  <textarea placeholder="Descripción del plan..." rows="2" className="w-full p-2.5 border rounded-xl" value={newEvent.descripcion} onChange={(e) => setNewEvent({ ...newEvent, descripcion: e.target.value })} />
                  
                  <div className="bg-sky-50 border border-sky-150 p-2.5 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                        checked={notifyTelegramOnEvent}
                        onChange={(e) => setNotifyTelegramOnEvent(e.target.checked)}
                      />
                      <span className="text-[11px] font-semibold text-sky-900 flex items-center gap-1.5">
                        <span>✈️</span> Notificar este plan al grupo de Telegram (Laos)
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button type="button" onClick={() => { setShowEventModal(false); setIsEditingEvent(false); setEditingEventId(null); setNewEvent({ titulo: '', fecha: '', hora: '', lugar: '', ubicacionUrl: '', descripcion: '', asistentes: [] }); }} className="p-2">Cancelar</button>
                    <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold">{isEditingEvent ? 'Guardar Cambios' : 'Proponer'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL DE SELECCIÓN DE EXPORTACIÓN A PDF */}
          {showPrintModal && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
                <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <Download className="w-4.5 h-4.5 text-emerald-600" /> Descargar Reporte en PDF
                  </h3>
                  <button 
                    onClick={() => setShowPrintModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm transition"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Elige qué documento deseas generar y descargar directamente a tu dispositivo en formato PDF de alta calidad:
                </p>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    onClick={() => handleDownloadPDF('arbol')}
                    className="w-full text-left p-3.5 border border-emerald-100 hover:border-emerald-300 rounded-2xl bg-emerald-50/20 hover:bg-emerald-50/50 transition-all flex justify-between items-center group"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-800 flex items-center gap-1">🌳 Árbol Genealógico Completo</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Diseño apaisado (horizontal) con todas las ramas y abuelos.</p>
                    </div>
                    <Download className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleDownloadPDF('calendar')}
                    className="w-full text-left p-3.5 border border-amber-150 hover:border-amber-300 rounded-2xl bg-amber-50/20 hover:bg-amber-50/50 transition-all flex justify-between items-center group"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-800 flex items-center gap-1">☀️ Calendario de Verano (Julio y Agosto)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Planificadores mensuales limpios de alta definición (2 páginas).</p>
                    </div>
                    <Download className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleDownloadPDF('cumples')}
                    className="w-full text-left p-3.5 border border-pink-100 hover:border-pink-300 rounded-2xl bg-pink-50/20 hover:bg-pink-50/50 transition-all flex justify-between items-center group"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-800 flex items-center gap-1">🎂 Agenda de Cumpleaños y Santos</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Listado anual ordenado con fechas de santos y cumpleaños.</p>
                    </div>
                    <Download className="w-4 h-4 text-pink-600 group-hover:scale-110 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleDownloadPDF('citas')}
                    className="w-full text-left p-3.5 border border-rose-100 hover:border-rose-300 rounded-2xl bg-rose-50/20 hover:bg-rose-50/50 transition-all flex justify-between items-center group"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-800 flex items-center gap-1">🩺 Citas Médicas y Revisiones de los Padres</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Listado completo con fechas, horas, especialistas, centros y acompañantes.</p>
                    </div>
                    <Download className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleDownloadPDF('traslados')}
                    className="w-full text-left p-3.5 border border-amber-100 hover:border-amber-300 rounded-2xl bg-amber-50/20 hover:bg-amber-50/50 transition-all flex justify-between items-center group"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-800 flex items-center gap-1">🚗 Traslados y Estancias de los Padres</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Ubicación actual (Alcalá ⇄ Madrid), próximos viajes y conductores asignados.</p>
                    </div>
                    <Download className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleDownloadPDF('full')}
                    className="w-full text-left p-3.5 border border-indigo-100 hover:border-indigo-300 rounded-2xl bg-indigo-50/20 hover:bg-indigo-50/50 transition-all flex justify-between items-center group"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-800 flex items-center gap-1">🏠 Dossier Familiar Completo</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Une Portada, Árbol, Calendarios (Jul/Ago) y Agenda en un solo PDF.</p>
                    </div>
                    <Download className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                  </button>
                </div>

                <div className="flex justify-end pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(false)}
                    className="text-xs font-bold text-slate-550 hover:text-slate-700 bg-slate-50 hover:bg-slate-105 border px-4.5 py-2 rounded-xl transition"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. Modal de Citas Médicas */}
          {showCitaModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-rose-100 text-rose-600 rounded-2xl text-lg">🩺</span>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">
                        {isEditingCita ? 'Editar Cita Médica' : 'Nueva Cita Médica de los Padres'}
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Coordina especialistas, revisiones y quién le acompaña a la consulta
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetCitaForm}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1 text-base transition"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveCita} className="space-y-3.5 text-xs">
                  {/* Paciente con botones rápidos */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Paciente *
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setNewCita({ ...newCita, paciente: 'Mamá (Encarnación)' })}
                        className={`p-2.5 rounded-2xl border flex items-center justify-center gap-2 font-bold transition text-xs ${
                          newCita.paciente === 'Mamá (Encarnación)'
                            ? 'bg-fuchsia-50 border-fuchsia-400 text-fuchsia-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>👵</span> Mamá (Encarnación)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCita({ ...newCita, paciente: 'Papá (Jaime)' })}
                        className={`p-2.5 rounded-2xl border flex items-center justify-center gap-2 font-bold transition text-xs ${
                          newCita.paciente === 'Papá (Jaime)'
                            ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>👴</span> Papá (Jaime)
                      </button>
                    </div>

                    <select
                      value={newCita.paciente}
                      onChange={(e) => setNewCita({ ...newCita, paciente: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-700 font-medium outline-none focus:ring-2 focus:ring-rose-400"
                    >
                      <option value="Mamá (Encarnación)">👵 Mamá (Encarnación)</option>
                      <option value="Papá (Jaime)">👴 Papá (Jaime)</option>
                      {integrantes
                        .filter(m => m.nombre !== 'Encarnación' && m.nombre !== 'Jaime')
                        .map(m => (
                          <option key={m.id || m.nombre} value={m.nombre}>
                            👤 {m.nombre}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Especialidad con sugerencias rápidas */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Especialidad Médica *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Cabecera, Cardiología, Traumatología..."
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-400"
                      value={newCita.especialidad}
                      onChange={(e) => setNewCita({ ...newCita, especialidad: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        'Médico de Cabecera',
                        'Análisis de Sangre',
                        'Cardiología',
                        'Traumatología',
                        'Oftalmología',
                        'Revisión Oído',
                        'Dermatología'
                      ].map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setNewCita({ ...newCita, especialidad: sug })}
                          className={`text-[9px] px-2 py-0.5 rounded-lg border transition ${
                            newCita.especialidad === sug
                              ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-150'
                          }`}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Doctor o Profesional */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Nombre del Doctor / Especialista (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Dr. Morales, Dra. Carmen Sánchez..."
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-400"
                      value={newCita.medico}
                      onChange={(e) => setNewCita({ ...newCita, medico: e.target.value })}
                    />
                  </div>

                  {/* Fecha y Hora */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Fecha *
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-400"
                        value={newCita.fecha}
                        onChange={(e) => setNewCita({ ...newCita, fecha: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Hora (aprox) *
                      </label>
                      <input
                        type="time"
                        required
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-400"
                        value={newCita.hora}
                        onChange={(e) => setNewCita({ ...newCita, hora: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Centro de Salud / Hospital con sugerencias */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Centro Médico u Hospital *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Centro de Salud, Hospital Morales Meseguer..."
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-400"
                      value={newCita.centro}
                      onChange={(e) => setNewCita({ ...newCita, centro: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        'Centro de Salud',
                        'Hospital Morales Meseguer',
                        'Hospital Reina Sofía',
                        'Hospital Virgen de la Arrixaca'
                      ].map(centroSug => (
                        <button
                          key={centroSug}
                          type="button"
                          onClick={() => setNewCita({ ...newCita, centro: centroSug })}
                          className={`text-[9px] px-2 py-0.5 rounded-lg border transition ${
                            newCita.centro === centroSug
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-150'
                          }`}
                        >
                          {centroSug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ubicación Google Maps */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Enlace Google Maps (Opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://maps.google.com/..."
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-400"
                      value={newCita.ubicacionUrl}
                      onChange={(e) => setNewCita({ ...newCita, ubicacionUrl: e.target.value })}
                    />
                  </div>

                  {/* ¿Quién le acompaña? */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        ¿Quién le acompaña? (Acompañante)
                      </label>
                      {usuarioActivo && (
                        <button
                          type="button"
                          onClick={() => setNewCita({ ...newCita, acompanante: usuarioActivo })}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          🚗 Yo ({usuarioActivo})
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {/* Campo de texto libre para escribir el nombre directamente */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Escribe aquí el nombre (ej: Carlos, Tía Mariuge, Taxi, Vecino...)..."
                          className="w-full p-2.5 pl-8 border-2 border-rose-300 focus:border-rose-500 rounded-xl bg-white text-slate-800 font-bold outline-none focus:ring-2 focus:ring-rose-200 text-xs shadow-2xs"
                          value={newCita.acompanante === 'Pendiente de asignar' ? '' : newCita.acompanante}
                          onChange={(e) => setNewCita({ ...newCita, acompanante: e.target.value })}
                        />
                        <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">✏️</span>
                        {newCita.acompanante && newCita.acompanante !== 'Pendiente de asignar' && (
                          <button
                            type="button"
                            onClick={() => setNewCita({ ...newCita, acompanante: '' })}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
                            title="Limpiar campo"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Desplegable auxiliar para elegir a un familiar con 1 clic */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-bold shrink-0">O elegir de la lista:</span>
                        <select
                          value={integrantes.some(i => i.nombre === newCita.acompanante) ? newCita.acompanante : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              setNewCita({ ...newCita, acompanante: e.target.value });
                            }
                          }}
                          className="w-full p-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium outline-none focus:ring-1 focus:ring-rose-400"
                        >
                          <option value="">-- Seleccionar familiar para rellenar --</option>
                          <optgroup label="Hermanos">
                            {integrantes
                              .filter(m => m.rol === 'Hermanos' || esHermano(m.nombre))
                              .map(m => (
                                <option key={m.id || m.nombre} value={m.nombre}>
                                  🚗 {m.nombre}
                                </option>
                              ))}
                          </optgroup>
                          <optgroup label="Familiares y Allegados (Tía Mariuge, etc.)">
                            {integrantes
                              .filter(m => m.rol !== 'Hermanos' && !esHermano(m.nombre))
                              .map(m => (
                                <option key={m.id || m.nombre} value={m.nombre}>
                                  👤 {m.nombre}
                                </option>
                              ))}
                          </optgroup>
                          {otrosAcompanantesRegistrados.length > 0 && (
                            <optgroup label="Otros acompañantes guardados anteriormente">
                              {otrosAcompanantesRegistrados.map(nom => (
                                <option key={nom} value={nom}>
                                  ✨ {nom}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>

                      {/* Botones rápidos de 1 clic */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Atajos:</span>
                        <button
                          type="button"
                          onClick={() => setNewCita({ ...newCita, acompanante: 'Tía Mariuge' })}
                          className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300 font-bold transition flex items-center gap-1"
                        >
                          🚗 Tía Mariuge
                        </button>
                        {otrosAcompanantesRegistrados.slice(0, 3).map(nom => (
                          <button
                            key={nom}
                            type="button"
                            onClick={() => setNewCita({ ...newCita, acompanante: nom })}
                            className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200 font-semibold transition flex items-center gap-1"
                          >
                            <span>👤</span> {nom}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setNewCita({ ...newCita, acompanante: 'Taxi / Sanitario' })}
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 font-medium transition flex items-center gap-1"
                        >
                          🚕 Taxi / Sanitario
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewCita({ ...newCita, acompanante: 'Pendiente de asignar' })}
                          className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200 font-medium transition"
                        >
                          ⚠️ Sin acompañante
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notas o preparaciones */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Instrucciones previas y notas
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Ej: Ir en ayunas de 8 horas, llevar analítica reciente, sobre azul de pruebas..."
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-400"
                      value={newCita.notas}
                      onChange={(e) => setNewCita({ ...newCita, notas: e.target.value })}
                    />
                  </div>

                  {/* Estado si está editando */}
                  {isEditingCita && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">Estado de la cita:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewCita({ ...newCita, estado: 'pendiente' })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            newCita.estado === 'pendiente'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          ⏳ Pendiente
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewCita({ ...newCita, estado: 'completada' })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            newCita.estado === 'completada'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          ✅ Realizada
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notificación Telegram */}
                  <div className="bg-sky-50 border border-sky-150 p-2.5 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                        checked={notifyTelegramOnCita}
                        onChange={(e) => setNotifyTelegramOnCita(e.target.checked)}
                      />
                      <span className="text-[11px] font-semibold text-sky-900 flex items-center gap-1.5">
                        <span>✈️</span> Notificar al grupo de Telegram (Laos)
                      </span>
                    </label>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={resetCitaForm}
                      className="text-xs font-semibold px-4 py-2 text-slate-500 hover:text-slate-700 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition duration-200 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      {isEditingCita ? 'Guardar Cambios' : 'Guardar Cita'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 7. Modal de Traslados de los Padres */}
          {showTrasladoModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-amber-100 text-amber-600 rounded-2xl text-lg">🚗</span>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">
                        {isEditingTraslado ? 'Editar Traslado de los Padres' : 'Planificar Traslado de los Padres 🚗'}
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Coordina quién lleva o trae a papá y mamá entre Alcalá y Madrid
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetTrasladoForm}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1 text-base transition"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveTraslado} className="space-y-3.5 text-xs">
                  {/* Selector rápido de Trayecto */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Trayecto / Ruta *
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setNewTraslado({ ...newTraslado, origen: 'Madrid', destino: 'Alcalá (Esgaravita)' })}
                        className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 font-bold transition text-xs ${
                          newTraslado.origen === 'Madrid' && newTraslado.destino === 'Alcalá (Esgaravita)'
                            ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-1">🏢 Madrid <ArrowRight className="w-3.5 h-3.5 text-amber-600" /> 🌿 Esga</span>
                        <span className="text-[10px] font-normal text-slate-500">Madrid ➔ Alcalá</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewTraslado({ ...newTraslado, origen: 'Alcalá (Esgaravita)', destino: 'Madrid' })}
                        className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 font-bold transition text-xs ${
                          newTraslado.origen === 'Alcalá (Esgaravita)' && newTraslado.destino === 'Madrid'
                            ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-1">🌿 Esga <ArrowRight className="w-3.5 h-3.5 text-amber-600" /> 🏢 Madrid</span>
                        <span className="text-[10px] font-normal text-slate-500">Alcalá ➔ Madrid</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-400 font-semibold mb-0.5">Punto de Origen</label>
                        <select
                          value={newTraslado.origen}
                          onChange={(e) => setNewTraslado({ ...newTraslado, origen: e.target.value })}
                          className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-700 font-medium outline-none focus:ring-2 focus:ring-amber-400"
                        >
                          <option value="Madrid">🏢 Madrid</option>
                          <option value="Alcalá (Esgaravita)">🌿 Alcalá (Esgaravita)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400 font-semibold mb-0.5">Punto de Destino</label>
                        <select
                          value={newTraslado.destino}
                          onChange={(e) => setNewTraslado({ ...newTraslado, destino: e.target.value })}
                          className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-700 font-medium outline-none focus:ring-2 focus:ring-amber-400"
                        >
                          <option value="Alcalá (Esgaravita)">🌿 Alcalá (Esgaravita)</option>
                          <option value="Madrid">🏢 Madrid</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Fecha y Franja horaria */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Fecha del viaje *
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-amber-400"
                        value={newTraslado.fecha}
                        onChange={(e) => setNewTraslado({ ...newTraslado, fecha: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Hora (aprox) *
                      </label>
                      <input
                        type="time"
                        required
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-amber-400"
                        value={newTraslado.hora}
                        onChange={(e) => setNewTraslado({ ...newTraslado, hora: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Momento del día (Sugerencias rápidas) */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Momento preferido del día
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: 'Mañana', hora: '10:00' },
                        { label: 'Mediodía', hora: '14:00' },
                        { label: 'Tarde', hora: '18:00' },
                        { label: 'Noche', hora: '21:00' }
                      ].map(m => (
                        <button
                          key={m.label}
                          type="button"
                          onClick={() => setNewTraslado({ ...newTraslado, momentoDia: m.label, hora: m.hora })}
                          className={`p-1.5 rounded-xl border text-center font-bold text-[11px] transition ${
                            newTraslado.momentoDia === m.label
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conductor / ¿Quién les lleva? */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        ¿Quién les lleva? (Conductor)
                      </label>
                      {usuarioActivo && (
                        <button
                          type="button"
                          onClick={() => setNewTraslado({ ...newTraslado, conductor: usuarioActivo })}
                          className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1"
                        >
                          🚗 Yo ({usuarioActivo})
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {/* Campo de texto libre para escribir el nombre directamente */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Escribe aquí el nombre (ej: Tía Mariuge, Taxi, Vecino Paco...)"
                          className="w-full p-2.5 pl-8 border-2 border-amber-300 focus:border-amber-500 rounded-xl bg-white text-slate-800 font-bold outline-none focus:ring-2 focus:ring-amber-200 text-xs shadow-2xs"
                          value={newTraslado.conductor === 'Pendiente de asignar' ? '' : newTraslado.conductor}
                          onChange={(e) => setNewTraslado({ ...newTraslado, conductor: e.target.value })}
                        />
                        <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">✏️</span>
                        {newTraslado.conductor && newTraslado.conductor !== 'Pendiente de asignar' && (
                          <button
                            type="button"
                            onClick={() => setNewTraslado({ ...newTraslado, conductor: '' })}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
                            title="Limpiar campo"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Desplegable auxiliar para elegir a un familiar con 1 clic */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-bold shrink-0">O elegir de la lista:</span>
                        <select
                          value={integrantes.some(i => i.nombre === newTraslado.conductor) ? newTraslado.conductor : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              setNewTraslado({ ...newTraslado, conductor: e.target.value });
                            }
                          }}
                          className="w-full p-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium outline-none focus:ring-1 focus:ring-amber-400"
                        >
                          <option value="">-- Seleccionar familiar para rellenar --</option>
                          <optgroup label="Hermanos">
                            {integrantes
                              .filter(m => m.rol === 'Hermanos' || esHermano(m.nombre))
                              .map(m => (
                                <option key={m.id || m.nombre} value={m.nombre}>
                                  🚗 {m.nombre}
                                </option>
                              ))}
                          </optgroup>
                          <optgroup label="Familiares y Allegados (Tía Mariuge, etc.)">
                            {integrantes
                              .filter(m => m.rol !== 'Hermanos' && !esHermano(m.nombre) && m.nombre !== 'Encarnación' && m.nombre !== 'Jaime')
                              .map(m => (
                                <option key={m.id || m.nombre} value={m.nombre}>
                                  👤 {m.nombre}
                                </option>
                              ))}
                          </optgroup>
                          {otrosConductoresRegistrados.length > 0 && (
                            <optgroup label="Otros conductores guardados anteriormente">
                              {otrosConductoresRegistrados.map(nom => (
                                <option key={nom} value={nom}>
                                  ✨ {nom}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>

                      {/* Botones rápidos de 1 clic */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Atajos:</span>
                        <button
                          type="button"
                          onClick={() => setNewTraslado({ ...newTraslado, conductor: 'Tía Mariuge' })}
                          className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300 font-bold transition flex items-center gap-1"
                        >
                          🚗 Tía Mariuge
                        </button>
                        {otrosConductoresRegistrados.slice(0, 3).map(nom => (
                          <button
                            key={nom}
                            type="button"
                            onClick={() => setNewTraslado({ ...newTraslado, conductor: nom })}
                            className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200 font-semibold transition flex items-center gap-1"
                          >
                            <span>👤</span> {nom}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setNewTraslado({ ...newTraslado, conductor: 'Taxi' })}
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 font-medium transition flex items-center gap-1"
                        >
                          🚕 Taxi
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewTraslado({ ...newTraslado, conductor: 'Pendiente de asignar' })}
                          className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200 font-medium transition"
                        >
                          ⚠️ Sin conductor
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Notas y Equipaje (Opcional)
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Ej: Llevar maleta grande, medicación semanal, llaves del campo, pasar por el súper..."
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-amber-400"
                      value={newTraslado.notas}
                      onChange={(e) => setNewTraslado({ ...newTraslado, notas: e.target.value })}
                    />
                  </div>

                  {/* Estado si está editando */}
                  {isEditingTraslado && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">Estado del viaje:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewTraslado({ ...newTraslado, estado: 'pendiente' })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            newTraslado.estado === 'pendiente'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          ⏳ Pendiente
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewTraslado({ ...newTraslado, estado: 'realizado' })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            newTraslado.estado === 'realizado'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          ✅ Realizado
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notificación Telegram */}
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                        checked={notifyTelegramOnTraslado}
                        onChange={(e) => setNotifyTelegramOnTraslado(e.target.checked)}
                      />
                      <span className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
                        <span>✈️</span> Notificar al grupo de Telegram (Laos)
                      </span>
                    </label>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={resetTrasladoForm}
                      className="text-xs font-semibold px-4 py-2 text-slate-500 hover:text-slate-700 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition duration-200 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      {isEditingTraslado ? 'Guardar Cambios' : 'Guardar Traslado'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 8. Modal de Vinculación de Cuenta de Google */}
          {showLinkAccountModal && user && !user.isAnonymous && user.email && !matchedMember && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-center">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-sm">
                  ✨
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    ¡Bienvenido/a a FamilyApp!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Has iniciado sesión con <strong>{user.email}</strong>. Para asignarte tus planes y reconocerte automáticamente cada vez que entres:
                  </p>
                </div>

                <form onSubmit={handleBootstrapLink} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      ¿Quién eres de la familia?
                    </label>
                    <select
                      value={bootstrapProfileName}
                      onChange={(e) => setBootstrapProfileName(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-400"
                      required
                    >
                      <option value="">-- Selecciona quién eres --</option>
                      {integrantes.map(i => (
                        <option key={i.id || i.nombre} value={i.nombre}>
                          👤 {i.nombre} ({i.rol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition"
                  >
                    Confirmar y Asociar Mi Cuenta
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLinkAccountModal(false)}
                    className="w-full text-slate-400 hover:text-slate-600 text-xs py-1 transition text-center"
                  >
                    Continuar como invitado sin vincular ahora
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Navegación móvil inferior fija */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-40 shadow-lg">
            {[
              { id: 'inicio', label: 'Inicio', icon: Home },
              { id: 'traslados', label: 'Padres 🚗', icon: Car },
              { id: 'citas', label: 'Médicos', icon: Activity },
              { id: 'cumples', label: 'Cumples', icon: Gift },
              { id: 'arbol', label: 'Árbol', icon: Users }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center px-1.5 ${activeTab === tab.id ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[9.5px] whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>

    </div>
  );
}
