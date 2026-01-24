import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

class FirebaseService {
    constructor() {
        this.collection = firestore().collection('students');
    }

    // Get a unique ID for the device/user (ID الجهاز أو المستخدم)
    async getUserId() {
        try {
            // Priority 1: Auth User
            const currentUser = auth().currentUser;
            if (currentUser) {
                return currentUser.uid;
            }
            
            // Priority 2: Local Guest ID
            let userId = await AsyncStorage.getItem('user_id');
            if (!userId) {
                userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                await AsyncStorage.setItem('user_id', userId);
            }
            return userId;
        } catch (error) {
            console.error('❌ [Firebase] Error getting user ID:', error);
            return 'unknown_user';
        }
    }

    /**
     * حفظ بيانات الطالب
     * Saves student profile and progress to Firestore
     */
    async saveStudentData(data) {
        try {
            const userId = await this.getUserId();
            await this.collection.doc(userId).set({
                ...data,
                updatedAt: firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log('✅ [Firebase] Student data saved successfully');
        } catch (error) {
            console.error('❌ [Firebase] Error saving student data:', error);
        }
    }

    /**
     * استرجاع بيانات الطالب
     * Retrieves student profile and progress from Firestore
     */
    async getStudentData() {
        try {
            const userId = await this.getUserId();
            const doc = await this.collection.doc(userId).get();
            if (doc.exists) {
                console.log('✅ [Firebase] Student data retrieved');
                return doc.data();
            }
            return null;
        } catch (error) {
            console.error('❌ [Firebase] Error getting student data:', error);
            return null;
        }
    }

    /**
     * تحديث مستوى الطالب
     * Updates specific student level fields
     */
    async updateStudentLevel(level, grade) {
        try {
            const userId = await this.getUserId();
            await this.collection.doc(userId).update({
                level: level,
                grade: grade,
                updatedAt: firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ [Firebase] Student level updated');
        } catch (error) {
            console.error('❌ [Firebase] Error updating student level:', error);
        }
    }

    /**
     * استرجاع إعدادات التطبيق (المفاتيح، التعليمات، التوجيهات)
     * Retrieves global app configuration (API keys, System Prompts)
     */
    async getAppConfig() {
        try {
            const doc = await firestore().collection('app_config').doc('global_settings').get();
            if (doc.exists) {
                const data = doc.data();
                console.log('✅ [Firebase] App config QUERY SUCCESS!');
                console.log('📋 [Firebase] Loaded API Keys for:', Object.keys(data.api_keys || {}));
                console.log('🧠 [Firebase] AI Model set to:', data.ai_settings?.model_name);
                return data;
            } else {
                console.log('⚠️ [Firebase] No remote config found, using defaults.');
                return null;
            }
        } catch (error) {
            console.error('❌ [Firebase] Error getting app config:', error);
            return null;
        }
    }

    /**
     * حذف بيانات الطالب
     * Deletes student data from Firestore
     */
    async deleteStudentData() {
        try {
            const userId = await this.getUserId();
            await this.collection.doc(userId).delete();
            console.log('✅ [Firebase] Student data deleted successfully');
        } catch (error) {
            console.error('❌ [Firebase] Error deleting student data:', error);
            throw error;
        }
    }

    async ensureAuthenticated() {
        if (!auth().currentUser) {
            console.log('⚠️ [Firebase] No user signed in, signing in anonymously for support ticket...');
            await auth().signInAnonymously();
        }
        return auth().currentUser;
    }

    /**
     * إرسال تذكرة دعم فني
     * Submits a support ticket to Firestore
     */
    async submitSupportTicket(ticketData) {
        try {
            // 1. Ensure we have a valid Firebase User (Auth)
            const user = await this.ensureAuthenticated();
            const userId = user.uid;

            // 2. Write to the Main Student Document using arrayUnion
            // This guarantees success if the user can save their own profile
            const ticketEntry = {
                ...ticketData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(), // Use string for array storage
                status: 'new'
            };

            await this.collection.doc(userId).update({
                supportRequests: firestore.FieldValue.arrayUnion(ticketEntry),
                hasPendingSupportRequest: true,
                lastSupportRequestDate: firestore.FieldValue.serverTimestamp()
            });

            console.log('✅ [Firebase] Support ticket appended to profile successfully');
            return true;
        } catch (error) {
            console.error('❌ [Firebase] Error submitting ticket:', error);

            // Fallback: If document doesn't exist yet, create it with merge
            if (error.code === 'firestore/not-found' || error.message.includes('not found')) {
                const user = await this.ensureAuthenticated();
                await this.collection.doc(user.uid).set({
                    supportRequests: [{
                        ...ticketData,
                        id: Date.now().toString(),
                        createdAt: new Date().toISOString(),
                        status: 'new'
                    }],
                    hasPendingSupportRequest: true
                }, { merge: true });
                return true;
            }

            throw error;
        }
    }
}

export const firebaseService = new FirebaseService();
