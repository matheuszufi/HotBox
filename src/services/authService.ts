import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as firebaseUpdateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { 
  User, 
  LoginCredentials, 
  RegisterData 
} from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; firebaseUser: FirebaseUser }> {
    const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    const firebaseUser = userCredential.user;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Dados do usuário não encontrados');
    }
    
    const userData = userDoc.data() as User;
    
    return { 
      user: {
        ...userData,
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        emailVerified: firebaseUser.emailVerified,
        photoURL: firebaseUser.photoURL || null,
      }, 
      firebaseUser 
    };
  },

  async register(data: RegisterData): Promise<{ user: User; firebaseUser: FirebaseUser }> {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const firebaseUser = userCredential.user;
    
    // Update Firebase Auth profile
    await firebaseUpdateProfile(firebaseUser, {
      displayName: data.name,
    });
    
    // Create user document in Firestore
    const userData: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      name: data.name,
      role: data.role || 'customer',
      phone: data.phone,
      address: data.address,
      photoURL: firebaseUser.photoURL || null,
      emailVerified: firebaseUser.emailVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Remove undefined values before saving to Firestore
    const firestoreData = Object.fromEntries(
      Object.entries({
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).filter(([_, value]) => value !== undefined)
    );
    
    await setDoc(doc(db, 'users', firebaseUser.uid), firestoreData);
    
    return { user: userData, firebaseUser };
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) return null;
    
    const userData = userDoc.data() as User;
    
    return {
      ...userData,
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      emailVerified: firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL || null,
    };
  },

  async updateUserProfile(data: Partial<User>): Promise<User> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      throw new Error('Usuário não autenticado');
    }
    
    // Update Firebase Auth profile if name or photo changed
    if (data.name || data.photoURL !== undefined) {
      await firebaseUpdateProfile(firebaseUser, {
        displayName: data.name,
        photoURL: data.photoURL || null,
      });
    }
    
    // Remove undefined values before updating Firestore
    const updateData = Object.fromEntries(
      Object.entries({
        ...data,
        updatedAt: serverTimestamp(),
      }).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(doc(db, 'users', firebaseUser.uid), updateData);
    
    // Return updated user
    return await this.getCurrentUser() as User;
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return auth.onAuthStateChanged(callback);
  },
};
