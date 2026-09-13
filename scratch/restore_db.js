import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, deleteDoc, addDoc } from 'firebase/firestore';

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

const INTEGRANTES_PREDEFINIDOS = [
  { nombre: 'Encarnación', rol: 'Padres', santo: 'No especificado', email: null },
  { nombre: 'Jaime', rol: 'Padres', santo: 'No especificado', email: null },
  { nombre: 'Rebeca', rol: 'Hermanos', parejaDe: 'Bartek', santo: '30 de Agosto (Santa Rebeca)', email: null },
  { nombre: 'Isaac (Isik)', rol: 'Hermanos', parejaDe: 'Mónica', santo: '3 de Junio (San Isaac)', email: 'isaacbarnuevo@gmail.com' },
  { nombre: 'Mónica', rol: 'Cuñados', parejaDe: 'Isaac (Isik)', santo: '27 de Agosto (Santa Mónica)', email: null },
  { nombre: 'María', rol: 'Hermanos', parejaDe: 'Bartek', santo: '12 de Septiembre (Dulce Nombre de María)', email: null },
  { nombre: 'Bartek', rol: 'Cuñados', parejaDe: 'María', santo: '24 de Agosto (San Bartolomé)', email: null },
  { nombre: 'Juan', rol: 'Hermanos', parejaDe: null, santo: '24 de junio', email: null, fechaNacimiento: '1985-06-25' },
  { nombre: 'Ana', rol: 'Hermanos', parejaDe: 'Javier', santo: 'No especificado', email: null },
  { nombre: 'Javier', rol: 'Cuñados', parejaDe: 'Ana', santo: '3 de Diciembre (San Francisco Javier)', email: null },
  { nombre: 'Cristina', rol: 'Hermanos', parejaDe: null, santo: 'No especificado', email: null },
  { nombre: 'Teresa', rol: 'Hermanos', parejaDe: null, santo: 'No especificado', email: null },
  { nombre: 'Laura', rol: 'Cuñados', parejaDe: null, santo: '1 de Junio (Santa Laura)', email: null },
  { nombre: 'Jorge', rol: 'Cuñados', parejaDe: null, santo: 'No especificado', email: null },
  { nombre: 'Paulino', rol: 'Padres', parejaDe: null, santo: 'No especificado', email: null, fechaNacimiento: '1920-10-12' },
  { nombre: 'Lucas', rol: 'Hijos', padres: ['Isaac (Isik)', 'Mónica'], padrinos: ['Rebeca'], santo: '18 de Octubre (San Lucas)', email: null },
  { nombre: 'Elena', rol: 'Hijos', padres: ['Rebeca', 'Bartek'], padrinos: ['Isaac (Isik)'], santo: '18 de Agosto (Santa Elena)', email: null },
  { nombre: 'David', rol: 'Hijos', padres: ['Ana', 'Javier'], padrinos: [], santo: 'No especificado', email: null, fechaNacimiento: '2020-01-02' },
  { nombre: 'Carmen', rol: 'Hijos', padres: ['Ana', 'Javier'], padrinos: [], santo: 'No especificado', email: null, fechaNacimiento: '2023-03-25' },
  { nombre: 'Nieves', rol: 'Hijos', padres: ['Ana', 'Javier'], padrinos: [], santo: '5 Agosto', email: null, fechaNacimiento: '2012-01-25' },
  { nombre: 'Miriam', rol: 'Hijos', padres: ['Ana', 'Javier'], padrinos: [], santo: '12 de Septiembre', email: null, fechaNacimiento: '2014-11-19' },
  { nombre: 'Jaime (Hijo)', rol: 'Hijos', padres: ['Ana', 'Javier'], padrinos: [], santo: '25 de Julio', email: null, fechaNacimiento: '2013-07-04' },
  { nombre: 'Francisco', rol: 'Hijos', padres: ['Ana', 'Javier'], padrinos: [], santo: 'No especificado', email: null, fechaNacimiento: '2016-12-01' }
];

const CUMPLEANOS_PREDEFINIDOS = [
  { nombre: 'Encarnación', fecha: '10-05', parentesco: 'Padres', santo: 'No especificado' },
  { nombre: 'Jaime', fecha: '05-19', parentesco: 'Padres', santo: 'No especificado' },
  { nombre: 'Rebeca', fecha: '09-15', parentesco: 'Hermana', santo: '30 de Agosto (Santa Rebeca)' },
  { nombre: 'Isaac', fecha: '06-21', parentesco: 'Hermano', santo: '3 de Junio (San Isaac)' },
  { nombre: 'Mónica', fecha: '10-20', parentesco: 'Cuñada', santo: '27 de Agosto (Santa Mónica)' },
  { nombre: 'María', fecha: '10-22', parentesco: 'Hermana', santo: '12 de Septiembre (Dulce Nombre de María)' },
  { nombre: 'Bartek', fecha: '01-15', parentesco: 'Cuñado', santo: '24 de Agosto (San Bartolomé)' },
  { nombre: 'Juan', fecha: '06-25', parentesco: 'Hermano/a', santo: '24 de junio' },
  { nombre: 'Ana', fecha: '04-05', parentesco: 'Hermano/a', santo: 'No especificado' },
  { nombre: 'Javier', fecha: '12-03', parentesco: 'Cuñado/a', santo: '3 de Diciembre (San Francisco Javier)' },
  { nombre: 'Cristina', fecha: '08-15', parentesco: 'Hermano/a', santo: 'No especificado' },
  { nombre: 'Teresa', fecha: '03-12', parentesco: 'Hermano/a', santo: 'No especificado' },
  { nombre: 'Laura', fecha: '06-01', parentesco: 'Cuñado/a', santo: '1 de Junio (Santa Laura)' },
  { nombre: 'Lucas', fecha: '05-12', parentesco: 'Sobrino/Hijo', santo: '18 de Octubre (San Lucas)' },
  { nombre: 'Elena', fecha: '08-20', parentesco: 'Sobrino/Hijo', santo: '18 de Agosto (Santa Elena)' },
  { nombre: 'David', fecha: '01-02', parentesco: 'Sobrino/Hijo', santo: 'No especificado' },
  { nombre: 'Carmen', fecha: '03-25', parentesco: 'Sobrino/Hijo', santo: 'No especificado' },
  { nombre: 'Nieves', fecha: '01-25', parentesco: 'Sobrino/Hijo', santo: '5 Agosto' },
  { nombre: 'Miriam', fecha: '11-19', parentesco: 'Sobrino/Hijo', santo: '12 de Septiembre' },
  { nombre: 'Jaime (Hijo)', fecha: '07-04', parentesco: 'Sobrino/Hijo', santo: '25 de Julio' },
  { nombre: 'Francisco', fecha: '12-01', parentesco: 'Sobrino/Hijo', santo: 'No especificado' },
  { nombre: 'Paulino', fecha: '10-12', parentesco: 'Abuelos', santo: 'No especificado' }
];

async function restoreDatabase() {
  console.log("Signing in anonymously...");
  await signInAnonymously(auth);
  console.log("Signed in successfully!");

  const colMembers = collection(db, 'artifacts', 'family-app-cloud', 'public', 'data', 'miembros');
  const snapMembers = await getDocs(colMembers);
  console.log(`Found ${snapMembers.size} current members. Deleting them...`);
  
  const deleteMemberPromises = snapMembers.docs.map(docSnap => {
    console.log(`Deleting member: ${docSnap.data().nombre} (${docSnap.id})`);
    return deleteDoc(doc(db, 'artifacts', 'family-app-cloud', 'public', 'data', 'miembros', docSnap.id));
  });
  await Promise.all(deleteMemberPromises);
  console.log("All current members deleted!");

  const colCumples = collection(db, 'artifacts', 'family-app-cloud', 'public', 'data', 'cumpleanos');
  const snapCumples = await getDocs(colCumples);
  console.log(`Found ${snapCumples.size} current birthdays. Deleting them...`);

  const deleteCumplePromises = snapCumples.docs.map(docSnap => {
    console.log(`Deleting birthday: ${docSnap.data().nombre} (${docSnap.id})`);
    return deleteDoc(doc(db, 'artifacts', 'family-app-cloud', 'public', 'data', 'cumpleanos', docSnap.id));
  });
  await Promise.all(deleteCumplePromises);
  console.log("All current birthdays deleted!");

  console.log("\nSeeding members...");
  for (const m of INTEGRANTES_PREDEFINIDOS) {
    const docRef = await addDoc(colMembers, m);
    console.log(`Added member: ${m.nombre} with ID: ${docRef.id}`);
  }

  console.log("\nSeeding birthdays...");
  for (const c of CUMPLEANOS_PREDEFINIDOS) {
    const docRef = await addDoc(colCumples, c);
    console.log(`Added birthday: ${c.nombre} with ID: ${docRef.id}`);
  }

  console.log("\nDatabase restoration complete!");
}

restoreDatabase().catch(console.error);
