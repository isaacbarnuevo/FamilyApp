import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function queryMembers() {
  const colRef = collection(db, 'artifacts', 'family-app-cloud', 'public', 'data', 'miembros');
  const snapshot = await getDocs(colRef);
  
  console.log("=== LISTADO DE INTEGRANTES EN FIRESTORE ===");
  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data();
    const name = data.nombre || '';
    if (name.toLowerCase().includes('bartek') || name.toLowerCase().includes('rebeca') || name.toLowerCase().includes('maría') || name.toLowerCase().includes('maria')) {
      console.log(`ID: ${docSnap.id} | Nombre: ${data.nombre} | Rol: ${data.rol} | ParejaDe: ${data.parejaDe}`);
    }
  });
}

queryMembers().catch(console.error);
