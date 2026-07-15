import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

 firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

window.signup = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Account Created Successfully");
  } catch (e) {
    alert(e.message);
  }
};

window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login Successful");
  } catch (e) {
    alert(e.message);
  }
};

window.logout = async () => {
  try {
    await signOut(auth);
    alert("Logged Out");
  } catch (e) {
    alert(e.message);
  }
};

window.saveAnalysis = async (resumeText, aiResult) => {
  const user = auth.currentUser;

  if (!user) {
    alert("Please login first");
    return;
  }

  await addDoc(collection(db, "resume_analysis"), {
    uid: user.uid,
    email: user.email,
    resume: resumeText,
    analysis: aiResult,
    createdAt: serverTimestamp()
  });

  alert("Analysis Saved");
};

window.loadHistory = async () => {
  const user = auth.currentUser;

  if (!user) {
    alert("Please login first");
    return;
  }

  const q = query(
    collection(db, "resume_analysis"),
    where("uid", "==", user.uid)
  );

  const snapshot = await getDocs(q);

  const history = document.getElementById("history");

  history.innerHTML = "";

  snapshot.forEach((doc) => {
    const data = doc.data();

    history.innerHTML += `
      <div class="history-card">
        <h3>${data.email}</h3>
        <pre>${data.analysis}</pre>
      </div>
    `;
  });
};
