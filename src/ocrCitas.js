// Helper para OCR y extracción inteligente de volantes médicos y calendarios

const MESES_MAP = {
  enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
  julio: '07', agosto: '08', septiembre: '09', setiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
};

const ESPECIALIDADES_KNOWN = [
  { match: /pod[oó]log/i, name: 'Podólogo' },
  { match: /oftalm[oó]log|ojos|vista/i, name: 'Oftalmología' },
  { match: /dent|odont[oó]log/i, name: 'Odontólogo / Dentista' },
  { match: /an[aá]lisis|sangre|laboratorio/i, name: 'Análisis de Sangre' },
  { match: /cabecera|familia|general/i, name: 'Médico de Cabecera' },
  { match: /cardio/i, name: 'Cardiología' },
  { match: /trauma/i, name: 'Traumatología' },
  { match: /dermat/i, name: 'Dermatología' },
  { match: /o[íi]do|otorrino/i, name: 'Otorrino / Oídos' },
  { match: /digestiv|gastro/i, name: 'Aparato Digestivo' },
  { match: /fisio|rehab/i, name: 'Fisioterapia / Rehabilitación' },
  { match: /neuro/i, name: 'Neurología' },
  { match: /urolog/i, name: 'Urología' },
  { match: /radiolog|[rR]ayos|ecograf/i, name: 'Radiología / Pruebas' },
];

const CENTROS_KNOWN = [
  { match: /jim[eé]nez\s*d[ií]az|fjd/i, name: 'Fundación Jiménez Díaz (Madrid)', ciudad: 'madrid' },
  { match: /cl[ií]nico|san\s*carlos/i, name: 'Hospital Clínico San Carlos (Madrid)', ciudad: 'madrid' },
  { match: /la\s*paz/i, name: 'Hospital Universitario La Paz (Madrid)', ciudad: 'madrid' },
  { match: /ram[oó]n\s*y\s*cajal/i, name: 'Hospital Ramón y Cajal (Madrid)', ciudad: 'madrid' },
  { match: /mara[ñn][oó]n/i, name: 'Hospital Gregorio Marañón (Madrid)', ciudad: 'madrid' },
  { match: /pr[ií]ncipe\s*de\s*asturias/i, name: 'Hospital Univ. Príncipe de Asturias (Alcalá)', ciudad: 'alcala' },
  { match: /juan\s*de\s*austria/i, name: 'C.S. Juan de Austria (Alcalá)', ciudad: 'alcala' },
  { match: /alcarria/i, name: 'C.S. La Alcarria (Alcalá)', ciudad: 'alcala' },
  { match: /manuel\s*merino/i, name: 'C.S. Manuel Merino (Alcalá)', ciudad: 'alcala' },
  { match: /esga|esgaravita/i, name: 'Alcalá (Esgaravita)', ciudad: 'alcala' }
];

export async function extraerDatosCitaDesdeFoto(imageFileOrBlob, onProgress = () => {}) {
  try {
    onProgress('Cargando motor de reconocimiento óptico (OCR)...');
    const { createWorker } = await import('tesseract.js');
    
    // Iniciar worker de Tesseract configurado en español
    const worker = await createWorker('spa', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          onProgress(`Reconociendo texto: ${Math.round((m.progress || 0) * 100)}%`);
        }
      }
    });

    onProgress('Analizando volante o calendario...');
    const result = await worker.recognize(imageFileOrBlob);
    const rawText = result.data?.text || '';
    await worker.terminate();

    return parsearTextoCita(rawText);
  } catch (error) {
    console.error('Error en OCR de cita:', error);
    throw error;
  }
}

export function parsearTextoCita(rawText) {
  const t = rawText || '';
  const clean = t.replace(/\r\n/g, '\n');

  let fecha = '';
  let hora = '';
  let paciente = 'Mamá (Encarnación)';
  let especialidad = '';
  let centro = '';
  let ciudad = 'madrid';
  let medico = '';

  // 1. Detectar Paciente
  const lower = clean.toLowerCase();
  if (lower.includes('jaime') || lower.includes('papá') || lower.includes('papa')) {
    paciente = 'Papá (Jaime)';
  } else if (lower.includes('encarn') || lower.includes('mamá') || lower.includes('mama')) {
    paciente = 'Mamá (Encarnación)';
  }

  // 2. Detectar Fecha
  // Patrón dd/mm/yyyy o dd-mm-yyyy
  const matchFecha1 = clean.match(/\b([0-3]?[0-9])[\/\-\.]([0-1]?[0-9])[\/\-\.](20\d{2}|\d{2})\b/);
  if (matchFecha1) {
    let d = matchFecha1[1].padStart(2, '0');
    let m = matchFecha1[2].padStart(2, '0');
    let y = matchFecha1[3];
    if (y.length === 2) y = '20' + y;
    fecha = `${y}-${m}-${d}`;
  } else {
    // Patrón "15 de noviembre de 2026"
    const matchFecha2 = lower.match(/\b([0-3]?[0-9])\s+de\s+([a-z]+)(?:\s+de\s+(20\d{2}))?\b/);
    if (matchFecha2 && MESES_MAP[matchFecha2[2]]) {
      const d = matchFecha2[1].padStart(2, '0');
      const m = MESES_MAP[matchFecha2[2]];
      const y = matchFecha2[3] || String(new Date().getFullYear());
      fecha = `${y}-${m}-${d}`;
    }
  }

  // 3. Detectar Hora
  const matchHora = clean.match(/\b([0-2]?[0-9])[:\.]([0-5][0-9])(?:\s*(?:h|hrs|horas|am|pm))?\b/i);
  if (matchHora) {
    const h = matchHora[1].padStart(2, '0');
    const min = matchHora[2];
    if (parseInt(h, 10) < 24) {
      hora = `${h}:${min}`;
    }
  }

  // 4. Detectar Especialidad
  for (const esp of ESPECIALIDADES_KNOWN) {
    if (esp.match.test(lower)) {
      especialidad = esp.name;
      break;
    }
  }

  // 5. Detectar Centro Médico y Ciudad
  for (const c of CENTROS_KNOWN) {
    if (c.match.test(lower)) {
      centro = c.name;
      ciudad = c.ciudad;
      break;
    }
  }

  // Si no se detectó centro pero menciona Alcalá o Madrid
  if (!centro) {
    if (lower.includes('alcalá') || lower.includes('alcala')) {
      centro = 'Hospital Univ. Príncipe de Asturias (Alcalá)';
      ciudad = 'alcala';
    } else if (lower.includes('madrid')) {
      centro = 'Fundación Jiménez Díaz (Madrid)';
      ciudad = 'madrid';
    }
  }

  // 6. Detectar Doctor/a
  const matchDoctor = clean.match(/(?:Dr\.|Dra\.|Doctor\s+|Doctora\s+)([A-ZÁÉÍÓÚa-záéíóú\s]{3,30})/i);
  if (matchDoctor && matchDoctor[1]) {
    medico = matchDoctor[0].trim();
  }

  return {
    rawText,
    fecha,
    hora,
    paciente,
    especialidad,
    centro,
    ciudad,
    medico
  };
}
