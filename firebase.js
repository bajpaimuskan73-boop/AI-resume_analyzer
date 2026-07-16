import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
    sendPasswordResetEmail,
    deleteUser,
    reauthenticateWithPopup,
    reauthenticateWithCredential,
    GoogleAuthProvider,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js";

const firebaseConfig = {
    apiKey: "AIzaSyDRukXBa4Ed4v2Q7KcsWvB8sc--y6B0pzI",
    authDomain: "ai-resume-analyzer-b94ed.firebaseapp.com",
    projectId: "ai-resume-analyzer-b94ed",
    storageBucket: "ai-resume-analyzer-b94ed.firebasestorage.app",
    messagingSenderId: "1058125482474",
    appId: "1:1058125482474:web:357016c5c532acd1ec8a93"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Monitor auth state
onAuthStateChanged(auth, (user) => {
    const statusElement = document.getElementById("authStatus");
    if (statusElement) {
        statusElement.textContent = user ? `✅ Logged in: ${user.email}` : "🔒 Not logged in";
    }
});

// Sign Up
window.signup = async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Validation
    if (!email) {
        alert("❌ Please enter an email");
        return;
    }
    if (!email.includes("@")) {
        alert("❌ Please enter a valid email");
        return;
    }
    if (!password || password.length < 6) {
        alert("❌ Password must be at least 6 characters");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        alert("✅ Account created successfully!");
        document.getElementById("email").value = "";
        document.getElementById("password").value = "";
    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
            alert("❌ This email is already registered");
        } else if (error.code === "auth/invalid-email") {
            alert("❌ Invalid email address");
        } else if (error.code === "auth/weak-password") {
            alert("❌ Password is too weak. Use at least 6 characters");
        } else {
            alert(`❌ Signup failed: ${error.message}`);
        }
        console.error("Signup error:", error);
    }
};

// Login
window.login = async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("❌ Please enter both email and password");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        alert("✅ Login successful!");
        document.getElementById("email").value = "";
        document.getElementById("password").value = "";
    } catch (error) {
        if (error.code === "auth/user-not-found") {
            alert("❌ User not found. Please sign up first");
        } else if (error.code === "auth/wrong-password") {
            alert("❌ Invalid password");
        } else if (error.code === "auth/invalid-email") {
            alert("❌ Invalid email address");
        } else {
            alert(`❌ Login failed: ${error.message}`);
        }
        console.error("Login error:", error);
    }
};

// Logout
window.logout = async () => {
    try {
        await signOut(auth);
        alert("✅ Logged out successfully");
    } catch (error) {
        alert(`❌ Logout failed: ${error.message}`);
        console.error("Logout error:", error);
    }
};

// Save Analysis
window.saveAnalysis = async (resumeText, aiResult) => {
    const user = auth.currentUser;

    if (!user) {
        console.warn("User not logged in - analysis not saved to Firestore");
        return;
    }

    try {
        await addDoc(collection(db, "resume_analysis"), {
            uid: user.uid,
            email: user.email,
            resume: resumeText.substring(0, 1000), // Store first 1000 chars to save space
            analysis: aiResult,
            createdAt: serverTimestamp()
        });
        console.log("✅ Analysis saved successfully");
    } catch (error) {
        console.error("❌ Error saving analysis:", error);
        alert(`Error saving to history: ${error.message}`);
    }
};

// Load History
window.loadHistory = async () => {
    const user = auth.currentUser;

    if (!user) {
        alert("❌ Please login first to view history");
        return;
    }

    try {
        const q = query(
            collection(db, "resume_analysis"),
            where("uid", "==", user.uid)
        );

        const snapshot = await getDocs(q);
        const history = document.getElementById("history");

        if (snapshot.empty) {
            history.innerHTML = "<p>📭 No analysis history found</p>";
            return;
        }

        history.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            const date = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : "Unknown date";
            
            history.innerHTML += `  
                <div class="history-card">  
                    <h4>📅 ${date}</h4>  
                    <p><strong>Email:</strong> ${data.email}</p>
                    <pre>${data.analysis.substring(0, 500)}...</pre>  
                    <button onclick="showFullAnalysis('${data.analysis.replace(/'/g, "\\'")}')">View Full</button>
                </div>  
            `;
        });
    } catch (error) {
        console.error("❌ Error loading history:", error);
        alert(`Error loading history: ${error.message}`);
    }
};

window.showFullAnalysis = (analysis) => {
    alert(analysis);
};

// Password reset (email/password users)
window.sendPasswordReset = async () => {
    const email = document.getElementById('email').value.trim();
    if (!email) return alert('❌ Please enter your email to receive a reset link');
    try {
        await sendPasswordResetEmail(auth, email);
        alert('✅ Password reset email sent. Check your inbox.');
    } catch (error) {
        console.error('Password reset error:', error);
        alert(`❌ Could not send reset email: ${error.message}`);
    }
};

// Delete account and user's Firestore data (client-side)
window.deleteAccountAndData = async () => {
    const user = auth.currentUser;
    if (!user) return alert('❌ Please login first');

    if (!confirm('This will permanently delete your account and all saved analyses. Continue?')) return;

    try {
        // Re-authenticate depending on provider
        const providerIds = (user.providerData || []).map(p => p.providerId);
        if (providerIds.includes('google.com')) {
            const provider = new GoogleAuthProvider();
            await reauthenticateWithPopup(user, provider);
        } else {
            // Email/password
            const pwd = prompt('Re-enter your password to confirm deletion:');
            if (!pwd) throw new Error('Password required to re-authenticate');
            const credential = EmailAuthProvider.credential(user.email, pwd);
            await reauthenticateWithCredential(user, credential);
        }

        // Delete Firestore documents in resume_analysis for this user
        const q = query(collection(db, 'resume_analysis'), where('uid', '==', user.uid));
        const snapshot = await getDocs(q);
        for (const docSnap of snapshot.docs) {
            await deleteDoc(doc(db, 'resume_analysis', docSnap.id));
        }

        // Finally delete auth user
        await deleteUser(user);
        alert('✅ Account and data deleted successfully');
    } catch (error) {
        console.error('Delete account error:', error);
        if (error.code === 'auth/requires-recent-login') {
            alert('❗ Please sign in again and retry deletion (recent authentication required).');
        } else {
            alert(`❌ Delete failed: ${error.message}`);
        }
    }
};

// Request server-side deletion via Cloud Function (recommended)
window.requestServerSideDeletion = async () => {
    const user = auth.currentUser;
    if (!user) return alert('❌ Please login first');
    if (!confirm('This will request a server-side permanent deletion of your account and data. Continue?')) return;

    try {
        const functions = getFunctions();
        const deleteFn = httpsCallable(functions, 'deleteUserAccount');
        const res = await deleteFn({ uid: user.uid });
        if (res.data && res.data.success) {
            alert('✅ Server-side deletion completed. Your account has been removed.');
        } else {
            alert('❌ Server-side deletion returned unexpected response.');
        }
    } catch (error) {
        console.error('Server-side deletion error:', error);
        alert('❌ Deletion failed: ' + (error.message || error));
    }
};
