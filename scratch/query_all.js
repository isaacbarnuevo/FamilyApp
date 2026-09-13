import { initializeApp } from 'firebase/app';
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function queryAll() {
  console.log("Signing in anonymously...");
  await signInAnonymously(auth);
  console.log("Signed in successfully!");

  const colMembers = collection(db, 'artifacts', 'family-app-cloud', 'public', 'data', 'miembros');
  const snapMembers = await getDocs(colMembers);
  console.log("\n=== MEMBERS IN FIRESTORE ===");
  snapMembers.docs.forEach(docSnap => {
    const data = docSnap.data();
    console.log(`ID: ${docSnap.id} | Nombre: ${data.nombre} | Rol: ${data.rol} | ParejaDe: ${data.parejaDe} | FechaNacimiento: ${data.fechaNacimiento} | Santo: ${data.santo}`);
  });

  const colCumples = collection(db, 'artifacts', 'family-app-cloud', 'public', 'data', 'cumpleanos');
  const snapCumples = await getDocs(colCumples);
  console.log("\n=== BIRTHDAYS IN FIRESTORE ===");
  snapCumples.docs.forEach(docSnap => {
    const data = docSnap.data();
    console.log(`ID: ${docSnap.id} | Nombre: ${data.nombre} | Fecha: ${data.fecha} | Parentesco: ${data.parentesco} | Santo: ${data.santo}`);
  });
}

queryAll().catch(console.error);
