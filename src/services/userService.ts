import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User } from '../types';

export const userService = {
  // Get all users (admin only)
  async getAllUsers(lastDoc?: DocumentSnapshot, limitCount = 10): Promise<{
    users: User[];
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
  }> {
    let q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    })) as User[];

    return {
      users,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === limitCount,
    };
  },

  // Get users by role
  async getUsersByRole(role: 'customer' | 'admin'): Promise<User[]> {
    const q = query(
      collection(db, 'users'),
      where('role', '==', role),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    })) as User[];
  },

  // Get user by ID
  async getUserById(uid: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      return null;
    }

    return {
      uid: userDoc.id,
      ...userDoc.data(),
    } as User;
  },

  // Update user (admin only)
  async updateUser(uid: string, data: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  // Delete user (admin only)
  async deleteUser(uid: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid));
  },

  // Search users by name or email
  async searchUsers(searchTerm: string): Promise<User[]> {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation - consider using Algolia or similar for production
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    })) as User[];

    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },

  // Get user stats
  async getUserStats(): Promise<{
    totalUsers: number;
    totalCustomers: number;
    totalAdmins: number;
    newUsersThisMonth: number;
  }> {
    // Get all users
    const allUsersSnapshot = await getDocs(collection(db, 'users'));
    const allUsers = allUsersSnapshot.docs.map(doc => doc.data()) as User[];

    // Get customers
    const customersSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'customer'))
    );

    // Get admins
    const adminsSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'admin'))
    );

    // Get new users this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = allUsers.filter(user => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= thisMonth;
    }).length;

    return {
      totalUsers: allUsers.length,
      totalCustomers: customersSnapshot.size,
      totalAdmins: adminsSnapshot.size,
      newUsersThisMonth,
    };
  },
};
