import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User } from "@/types";
import type { FirestoreUser, CreateFirestoreUserDto, UserRole } from "@/types/firestore";
import { createUser } from "@/lib/firestore-helpers";
import { STORAGE_KEYS } from "@/utils/constants";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Maps FirestoreUser (camelCase) to User (snake_case) type
 */
function mapFirestoreUserToUser(firestoreUser: FirestoreUser): User {
  return {
    id: firestoreUser.id,
    first_name: firestoreUser.firstName,
    last_name: firestoreUser.lastName,
    email: firestoreUser.email,
    phone: firestoreUser.phone,
    role: firestoreUser.role,
    avatar: firestoreUser.avatar,
    specialization: firestoreUser.specialization,
    license_number: firestoreUser.licenseNumber,
    is_active: firestoreUser.isActive,
    last_login: firestoreUser.lastLogin?.toDate().toISOString(),
    created_at: firestoreUser.createdAt.toDate().toISOString(),
    updated_at: firestoreUser.updatedAt.toDate().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseAuthUser) => {
      setIsLoading(true);
      
      if (firebaseAuthUser) {
        // User is authenticated with Firebase Auth
        setFirebaseUser(firebaseAuthUser);
        
        try {
          // Fetch user document from Firestore
          const userDocRef = doc(db, "users", firebaseAuthUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const firestoreUserData = {
              id: userDocSnap.id,
              ...userDocSnap.data(),
            } as FirestoreUser;
            
            // Map FirestoreUser to User type
            const mappedUser = mapFirestoreUserToUser(firestoreUserData);
            setUser(mappedUser);
            
            // Store in localStorage for backward compatibility
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mappedUser));
          } else {
            // Firebase Auth user exists but no Firestore document - auto-create it
            try {
              console.log("User document not found. Auto-creating user document for uid:", firebaseAuthUser.uid);
              
              // Get ID token to check for custom claims (role)
              const idTokenResult = await firebaseAuthUser.getIdTokenResult();
              const roleFromClaims = idTokenResult.claims.role as string | undefined;
              
              // Determine role: use custom claim if available, otherwise default to 'nurse'
              const role: UserRole = (roleFromClaims && ['admin', 'doctor', 'nurse'].includes(roleFromClaims))
                ? (roleFromClaims as UserRole)
                : 'nurse';
              
              // Extract name from displayName if available, otherwise use defaults
              const displayName = firebaseAuthUser.displayName || '';
              const nameParts = displayName.trim().split(/\s+/);
              const firstName = nameParts[0] || 'User';
              const lastName = nameParts.slice(1).join(' ') || '';
              
              // Create user document with minimal required fields
              const defaultUserData: CreateFirestoreUserDto = {
                email: firebaseAuthUser.email || '',
                firstName: firstName,
                lastName: lastName,
                role: role,
                isActive: true,
              };
              
              await createUser(firebaseAuthUser.uid, defaultUserData);
              console.log("✓ User document created successfully");
              
              // Fetch the newly created document
              const newUserDocSnap = await getDoc(userDocRef);
              if (newUserDocSnap.exists()) {
                const firestoreUserData = {
                  id: newUserDocSnap.id,
                  ...newUserDocSnap.data(),
                } as FirestoreUser;
                
                // Map FirestoreUser to User type
                const mappedUser = mapFirestoreUserToUser(firestoreUserData);
                setUser(mappedUser);
                
                // Store in localStorage for backward compatibility
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mappedUser));
              } else {
                throw new Error("Failed to fetch newly created user document");
              }
            } catch (createError: any) {
              // Handle creation error - don't sign out, but log the error
              console.error("Error auto-creating user document:", createError);
              console.error("Error code:", createError?.code);
              console.error("Error message:", createError?.message);
              
              if (createError?.code === "permission-denied") {
                console.error("Permission denied: Unable to create user document. This may indicate a problem with Firestore security rules.");
                console.error("Please ensure the Firestore rules allow users to create their own document.");
              } else {
                console.error("Unexpected error while creating user document. The user may need to contact an administrator.");
              }
              
              // Don't sign out - keep user authenticated but without user data
              // This allows them to see an error message in the UI
              setUser(null);
              // Keep firebaseUser so they remain authenticated
            }
          }
        } catch (error: any) {
          // Distinguish between different types of errors
          if (error?.code === "permission-denied") {
            console.error("Permission denied: User document exists but cannot be read due to security rules.");
            console.error("This may indicate a problem with Firestore security rules.");
            console.error("Error details:", error);
          } else if (error?.code === "not-found") {
            console.error("User document not found in Firestore for uid:", firebaseAuthUser.uid);
            console.error("The user account exists in Firebase Auth but has no corresponding Firestore document.");
          } else {
            console.error("Error fetching user document from Firestore:", error);
            console.error("Error code:", error?.code);
            console.error("Error message:", error?.message);
          }
          
          setUser(null);
          setFirebaseUser(null);
          // Sign out on error
          await signOut(auth);
        }
      } else {
        // User is not authenticated
        setFirebaseUser(null);
        setUser(null);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle fetching the Firestore user document
    } catch (error: any) {
      setIsLoading(false);
      // Map Firebase Auth errors to user-friendly messages
      let errorMessage = "Erreur de connexion. Veuillez réessayer.";
      
      if (error.code === "auth/invalid-email") {
        errorMessage = "L'adresse email n'est pas valide.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "Ce compte a été désactivé.";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "Aucun compte trouvé avec cet email.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Le mot de passe est incorrect.";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Email ou mot de passe incorrect.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Erreur de connexion réseau. Vérifiez votre connexion internet.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Trop de tentatives de connexion. Veuillez réessayer plus tard.";
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will handle clearing state
    } catch (error) {
      console.error("Error signing out:", error);
      // Clear state even if signOut fails
      setUser(null);
      setFirebaseUser(null);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!firebaseUser && !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
