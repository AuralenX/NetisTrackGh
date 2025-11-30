import { 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { auth } from './firebaseConfig.js';

export const authService = {
    // Login user
    async login(email, password) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Store login timestamp
        localStorage.setItem('lastLogin', new Date().toISOString());
        
        return userCredential.user;
    },

    // Send password reset email
    async sendPasswordResetEmail(email) {
        await sendPasswordResetEmail(auth, email);
    },

    // Logout user
    async logout() {
        // Clear any stored data
        localStorage.removeItem('lastLogin');
        sessionStorage.clear();
        
        await signOut(auth);
        
        // Redirect to login
        window.location.hash = 'login';
    },

    // Get current user
    getCurrentUser() {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                resolve(user);
            });
        });
    },

    // Redirect based on user role
    async redirectBasedOnRole(user) {
        try {
            // For now, redirect to dashboard
            // Later, you'll check user role from Firestore and redirect accordingly
            window.location.hash = 'dashboard';
            
            // Show welcome message
            const lastLogin = localStorage.getItem('lastLogin');
            if (!lastLogin) {
                console.log('First login or welcome back!');
            }
            
        } catch (error) {
            console.error('Role redirect error:', error);
            window.location.hash = 'dashboard'; // Fallback
        }
    },

    // Check if user is authenticated
    isAuthenticated() {
        return new Promise((resolve) => {
            onAuthStateChanged(auth, (user) => {
                resolve(!!user);
            });
        });
    },

    // Get user token (for API calls to your backend)
    async getToken() {
        const user = auth.currentUser;
        if (user) {
            return await user.getIdToken();
        }
        return null;
    },

    // Check if token is expired (basic implementation)
    isTokenExpired() {
        // You can implement token expiration check if needed
        return false;
    }
};