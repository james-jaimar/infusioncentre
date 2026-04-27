import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "nurse" | "patient" | "doctor";


interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  is_approved: boolean;
  tenant_id: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  mustChangePassword: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  clearMustChangePassword: () => void;
  isAdmin: boolean;
  isNurse: boolean;
  isPatient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  function clearUserData() {
    setProfile(null);
    setRole(null);
    setMustChangePassword(false);
  }

  useEffect(() => {
    const queueUserDataFetch = (userId: string) => {
      setTimeout(() => {
        void fetchUserData(userId);
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          const shouldBlockUi = !initialLoadDone.current;

          if (shouldBlockUi) {
            setLoading(true);
            initialLoadDone.current = true;
          }

          queueUserDataFetch(nextSession.user.id);
        } else {
          clearUserData();
          setLoading(false);
          initialLoadDone.current = true;
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (initialLoadDone.current) {
        return;
      }

      initialLoadDone.current = true;
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        setLoading(true);
        void fetchUserData(existingSession.user.id);
      } else {
        clearUserData();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserData(userId: string) {
    try {
      // Fetch profile and role in parallel
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      if (profileResult.data) {
        setProfile(profileResult.data as Profile);
        if ((profileResult.data as any).must_change_password === true) {
          setMustChangePassword(true);
        }
      }

      if (roleResult.data) {
        const userRole = roleResult.data.role as AppRole;
        setRole(userRole);

        // If doctor, also check doctors.must_change_password
        if (userRole === "doctor") {
          const { data: docData } = await supabase
            .from("doctors")
            .select("must_change_password")
            .eq("user_id", userId)
            .maybeSingle();
          if (docData?.must_change_password === true) {
            setMustChangePassword(true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }

  async function signUp(
    email: string,
    password: string,
    metadata?: { first_name?: string; last_name?: string }
  ) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata,
      },
    });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    clearUserData();
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    role,
    loading,
    mustChangePassword,
    signIn,
    signUp,
    signOut,
    clearMustChangePassword: () => setMustChangePassword(false),
    isAdmin: role === "admin",
    isNurse: role === "nurse",
    isPatient: role === "patient",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
