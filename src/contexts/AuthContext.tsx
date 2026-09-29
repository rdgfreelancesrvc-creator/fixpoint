import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/auth";

type ProfileStatus = "loading" | "ready" | "missing" | "error";

type InviteHash = {
  isInvite: boolean;
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  profileStatus: ProfileStatus;
  profileError: Error | null;
  isInviteSession: boolean;
  refreshProfile: (userId: string) => Promise<Profile | null>;
  clearInviteSession: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readInviteHash(): InviteHash {
  if (typeof window === "undefined") return { isInvite: false, accessToken: null, refreshToken: null };

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return {
    isInvite: params.get("type") === "invite",
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token"),
  };
}

function removeInviteHash() {
  if (typeof window === "undefined" || !window.location.hash) return;
  window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("loading");
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [isInviteSession, setIsInviteSession] = useState(() => readInviteHash().isInvite);

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
      const inviteHash = readInviteHash();
      let data: { session: Session | null } = { session: null };
      let error: Error | null = null;

      if (inviteHash.isInvite && inviteHash.accessToken && inviteHash.refreshToken) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: inviteHash.accessToken,
          refresh_token: inviteHash.refreshToken,
        });

        if (setSessionError) {
          error = setSessionError;
        } else {
          const sessionResult = await supabase.auth.getSession();
          data = sessionResult.data;
          error = sessionResult.error;
        }
      } else if (!inviteHash.isInvite) {
        const sessionResult = await supabase.auth.getSession();
        data = sessionResult.data;
        error = sessionResult.error;
      }

      if (inviteHash.isInvite) removeInviteHash();
      if (!isMounted) return;

      if (error) {
        setSession(null);
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
    isInviteSession,
    refreshProfile,
    clearInviteSession: () => setIsInviteSession(false),
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  }), [isInviteSession, isLoading, profile, profileError, profileStatus, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export type { ProfileStatus };
