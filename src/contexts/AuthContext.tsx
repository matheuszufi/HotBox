import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { 
  AuthContextType, 
  User, 
  LoginCredentials, 
  RegisterData 
} from '../types';
import { authService } from '../services';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User | null; firebaseUser: FirebaseUser | null } }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  firebaseUser: null,
  loading: true,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        firebaseUser: action.payload.firebaseUser,
        isAuthenticated: !!action.payload.user,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        firebaseUser: null,
        isAuthenticated: false,
        loading: false,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await authService.getCurrentUser();
          dispatch({ 
            type: 'SET_USER', 
            payload: { user, firebaseUser } 
          });
        } catch (error) {
          console.error('Error getting user data:', error);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { user, firebaseUser } = await authService.login(credentials);
      dispatch({ 
        type: 'SET_USER', 
        payload: { user, firebaseUser } 
      });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { user, firebaseUser } = await authService.register(data);
      dispatch({ 
        type: 'SET_USER', 
        payload: { user, firebaseUser } 
      });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    // The onAuthStateChanged listener will handle the state update
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authService.updateUserProfile(data);
      dispatch({ 
        type: 'SET_USER', 
        payload: { user: updatedUser, firebaseUser: state.firebaseUser } 
      });
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user: state.user,
    firebaseUser: state.firebaseUser,
    login,
    register,
    logout,
    updateProfile,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
