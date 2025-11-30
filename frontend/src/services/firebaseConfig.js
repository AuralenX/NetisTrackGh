// Import Firebase modules using CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBperUb2lwgzAj21izWQqqAVKF9tgP3jbM",
    authDomain: "netistrackgh.firebaseapp.com",
    projectId: "netistrackgh",
    storageBucket: "netistrackgh.firebasestorage.app",
    messagingSenderId: "701158642294",
    appId: "1:701158642294:web:1f5eed9c227c3e4cc18557",
    measurementId: "G-BLRYP2K2Q0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { app, auth, db };