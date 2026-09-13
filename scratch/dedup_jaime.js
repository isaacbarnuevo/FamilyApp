import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCPc3BTDzRFts7TJYhEbrFjZ-fre5nsmXQ",
  authDomain: "familiabarnuevoapp.firebaseapp.com",
  projectId: "familiabarnuevoapp",
  storageBucket: "familiabarnuevoapp.firebasestorage.app",
  messagingSenderId: "202440118958",
  appId: "1:202440118958:web:db654e234f9dee1861d33f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanJaime() {
  console.log("Iniciando búsqueda de duplicados de Jaime...");
  const colRef = collection(db, 'artifacts', 'family-app-cloud', 'public', 'data', 'miembros');
  const snapshot = await getDocs(colRef);
  
  const jaimes = [];
  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data();
    if (data.nombre && data.nombre.toLowerCase().includes('jaime')) {
      jaimes.push({ id: docSnap.id, data });
    }
  });

  console.log(`Encontrados ${jaimes.length} Jaimes en la base de datos:`);
  jaimes.forEach((j, index) => {
    console.log(`[${index}] ID: ${j.id}, Datos:`, JSON.stringify(j.data));
  });

  if (jaimes.length > 1) {
    // Preferir el Jaime que tenga mayor cantidad de campos completos o con asociaciones reales.
    let indexToKeep = 0;
    let maxFieldsCount = -1;

    jaimes.forEach((j, index) => {
      let fieldsCount = 0;
      for (const k in j.data) {
        if (j.data[k] !== null && j.data[k] !== undefined && j.data[k] !== '') {
          if (Array.isArray(j.data[k])) {
            if (j.data[k].length > 0) fieldsCount++;
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

    console.log(`\nDecidido mantener el Jaime en el índice [${indexToKeep}] con ID: ${jaimes[indexToKeep].id}`);

    // Eliminar los demás
    for (let i = 0; i < jaimes.length; i++) {
      if (i !== indexToKeep) {
        const idToDelete = jaimes[i].id;
        console.log(`Eliminando duplicado con ID: ${idToDelete}...`);
        await deleteDoc(doc(db, 'artifacts', 'family-app-cloud', 'public', 'data', 'miembros', idToDelete));
      }
    }
    console.log("¡Deduplicación completada con éxito!");
  } else {
    console.log("No hay duplicados de Jaime para limpiar.");
  }
}

cleanJaime().catch(console.error);
