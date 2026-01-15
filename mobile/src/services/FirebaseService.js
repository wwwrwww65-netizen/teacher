import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

class FirebaseService {
    constructor() {
        this.collection = firestore().collection('students');
    }

    // Get a unique ID for the device/user (ID الجهاز أو المستخدم)
    async getUserId() {
        try {
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
}

export const firebaseService = new FirebaseService();
