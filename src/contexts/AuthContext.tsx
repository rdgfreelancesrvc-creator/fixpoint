import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/auth";

type ProfileStatus = "loading" | "ready" | "missing" | "error";

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  profileStatus: ProfileStatus;
  profileError: Error | null;
  refreshProfile: (userId: string) => Promise<Profile | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("loading");
  const [profileError, setProfileError] = useState<Error | null>(null);

  const refreshProfile = async (userId: string) => {
    setProfileStatus("loading");
    setProfileError(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, phone, is_active, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      const nextError = new Error(error.message);
      setProfile(null);
      setProfileStatus("error");
      setProfileError(nextError);
      throw nextError;
    }

    const nextProfile = (data as Profile | null) ?? null;
    setProfile(nextProfile);
    setProfileStatus(nextProfile ? "ready" : "missing");
    return nextProfile;
  };

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (error) {
        setProfile(null);
        setProfileStatus("error");
        setProfileError(new Error(error.message));
        setIsLoading(false);
        return;
      }

      setSession(data.session);
      if (!data.session) {
        setProfile(null);
        setProfileStatus("ready");
        setIsLoading(false);
        return;
      }

      try {
        await refreshProfile(data.session.user.id);
      } catch {
        // Protected routes remain unavailable when the profile cannot be loaded.
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, nextSession) => {
      if (!isMounted) return;

      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setProfileStatus("ready");
        setProfileError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      void refreshProfile(nextSession.user.id)
        .catch(() => undefined)
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    profile,
    isLoading,
    profileStatus,
    profileError,
    refreshProfile,
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  }), [isLoading, profile, profileError, profileStatus, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export type { ProfileStatus };
