import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { firebaseService } from './FirebaseService';

class AuthService {
    constructor() {
        this.setupGoogleSignin();
    }

    setupGoogleSignin() {
        GoogleSignin.configure({
            webClientId: '369507394696-akhljn57uv0860iet2dg1en92deu4ul7.apps.googleusercontent.com',
            offlineAccess: true,
        });
    }

    /**
     * Listen to auth state changes
     */
    onAuthStateChanged(callback) {
        return auth().onAuthStateChanged(callback);
    }

    /**
     * Sign Up with Email
     */
    async signUp(email, password, fullName) {
        try {
            const userCredential = await auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update Display Name
            await user.updateProfile({
                displayName: fullName
            });

            // Send Verification Email
            await user.sendEmailVerification();

            return user;
        } catch (error) {
            console.error('SignUp Error:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Sign In with Email
     */
    async signIn(email, password) {
        try {
            const userCredential = await auth().signInWithEmailAndPassword(email, password);
            return userCredential.user;
        } catch (error) {
            console.error('SignIn Error:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Google Sign In
     */
    async signInWithGoogle() {
        try {
            console.log('👤 [AUTH] Google Sign-In Started...');
            // Check if your device supports Google Play
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            
            // Get the users ID token
            const { idToken } = await GoogleSignin.signIn();

            // Create a Google credential with the token
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);

            // Sign-in the user with the credential
            const userCredential = await auth().signInWithCredential(googleCredential);
            console.log('✅ [AUTH] Google User Signed In:', userCredential.user.email);
            return userCredential.user;
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            throw error;
        }
    }

    /**
     * Sign Out
     */
    async signOut() {
        try {
            await GoogleSignin.signOut(); // If signed in with Google
            await auth().signOut();
        } catch (error) {
            console.error('SignOut Error:', error);
        }
    }

    /**
     * Password Reset
     */
    async sendPasswordReset(email) {
        try {
            await auth().sendPasswordResetEmail(email);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    getCurrentUser() {
        return auth().currentUser;
    }

    handleError(error) {
        let message = 'حدث خطأ غير متوقع';
        if (error.code === 'auth/email-already-in-use') message = 'البريد الإلكتروني مستخدم بالفعل';
        if (error.code === 'auth/invalid-email') message = 'البريد الإلكتروني غير صحيح';
        if (error.code === 'auth/weak-password') message = 'كلمة المرور ضعيفة جداً';
        if (error.code === 'auth/user-not-found') message = 'لا يوجد حساب بهذا البريد';
        if (error.code === 'auth/wrong-password') message = 'كلمة المرور غير صحيحة';
        return { message, code: error.code };
    }
}

export const authService = new AuthService();
