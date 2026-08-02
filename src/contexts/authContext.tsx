import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth, firebase } from "../core/config/firebase";
import { AuthContextType, UserType } from "../shared/types";


const AuthContext = createContext<AuthContextType | null>(null);

const getAuthErrorMessage = (error: unknown) => {
    const message = error instanceof Error ? error.message : "Ocurrió un error inesperado";

    if (message.includes("auth/invalid-credential")) return "Correo o contraseña inválidos";
    if (message.includes("auth/invalid-email")) return "Correo electrónico inválido";
    if (message.includes("auth/email-already-in-use")) return "El correo electrónico ya está en uso";
    if (message.includes("auth/weak-password")) return "La contraseña debe tener al menos 6 caracteres";

    return "No fue posible completar la solicitud. Intenta de nuevo";
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserType>(null);
    const router = useRouter();

    const updateUserData = useCallback(async (uid: string) => {
        try {
            const docSnap = await getDoc(doc(firebase, "users", uid));

            if (docSnap.exists()) {
                const data = docSnap.data();
                setUser({
                    uid: data.uid ?? uid,
                    email: data.email ?? null,
                    name: data.name ?? null,
                    image: data.image ?? null,
                });
            }
        } catch {
            // Firebase Auth remains the source of truth if the optional profile cannot load.
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName,
                });
                void updateUserData(firebaseUser.uid);
                router.replace("/(tabs)");
                return;
            }

            setUser(null);
            router.replace("/(auth)/welcome");
        });

        return unsubscribe;
    }, [router, updateUserData]);

    const login = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);                        
            return { success: true };
        } catch (error: unknown) {
            return { success: false, msg: getAuthErrorMessage(error) };
        }
    };

    const register = async (email: string, password: string, name:string) => {
        try {
            const response = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(firebase, "users", response.user.uid), {
                name,
                email,
                uid: response.user.uid,
            });
            return { success: true };
        } catch (error: unknown) {
            return { success: false, msg: getAuthErrorMessage(error) };
        }
    };

    const contextValue = useMemo<AuthContextType>(() => ({
        user, 
        setUser,
        login,
        register,
        updateUserData,
    }), [user, updateUserData]);
    return (
         <AuthContext.Provider value={contextValue}>
            {children}
         </AuthContext.Provider>
    )

};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if(!context){
        throw new Error("userAuth must be wrapper inside AuthProvider");
    }
    return context;
};
