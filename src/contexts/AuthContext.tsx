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
  isInitializingInvite: boolean;
  profileStatus: ProfileStatus;
  profileError: Error | null;
  isInviteSession: boolean;
  refreshProfile: (userId: string) => Promise<Profile | null>;
  clearInviteSession: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const expiredInviteMessage = "This invitation has expired or is no longer valid. Please contact your administrator.";

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
  const [isInitializingInvite, setIsInitializingInvite] = useState(() => readInviteHash().isInvite);
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
    let isInitializing = true;
    const inviteHash = readInviteHash();

    const handleSessionChange = (_event: string, nextSession: Session | null) => {
      if (!isMounted || isInitializing) return;

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
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(handleSessionChange);

    const loadSession = async () => {
      let nextSession: Session | null = null;
      let authenticatedUserId: string | null = null;
      let authError: Error | null = null;

      try {
        if (inviteHash.isInvite) {
          if (!inviteHash.accessToken || !inviteHash.refreshToken) {
            removeInviteHash();
            authError = new Error(expiredInviteMessage);
          } else {
            const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
              access_token: inviteHash.accessToken,
              refresh_token: inviteHash.refreshToken,
            });

            if (setSessionError || !setSessionData.session) {
              removeInviteHash();
              authError = new Error(setSessionError?.message || expiredInviteMessage);
            } else {
              nextSession = setSessionData.session;
              removeInviteHash();

              const { data: userData, error: userError } = await supabase.auth.getUser();
              if (userError || !userData.user) {
                authError = new Error(userError?.message || expiredInviteMessage);
              } else if (userData.user.id !== nextSession.user.id) {
                authError = new Error(expiredInviteMessage);
              } else {
                authenticatedUserId = userData.user.id;
              }
            }
          }
        } else {
          const sessionResult = await supabase.auth.getSession();
          nextSession = sessionResult.data.session;
          authError = sessionResult.error;
        }

        if (!isMounted) return;

        if (authError) {
          setSession(null);
          setProfile(null);
          setProfileStatus("error");
          setProfileError(authError);
          return;
        }

        setSession(nextSession);
        if (!nextSession) {
          setProfile(null);
          setProfileStatus("ready");
          return;
        }

        const nextProfile = await refreshProfile(authenticatedUserId || nextSession.user.id);
        if (inviteHash.isInvite && (!nextProfile || nextProfile.id !== authenticatedUserId)) {
          setProfile(null);
          setProfileStatus("missing");
          setProfileError(new Error(expiredInviteMessage));
        }
      } catch (error) {
        if (!isMounted) return;
        setSession(null);
        setProfile(null);
        setProfileStatus("error");
        setProfileError(error instanceof Error ? error : new Error(expiredInviteMessage));
      } finally {
        isInitializing = false;
        if (isMounted) {
          setIsInitializingInvite(false);
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    profile,
    isLoading,
    isInitializingInvite,
    profileStatus,
    profileError,
    isInviteSession,
    refreshProfile,
    clearInviteSession: () => {
      removeInviteHash();
      setIsInviteSession(false);
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  }), [isInitializingInvite, isInviteSession, isLoading, profile, profileError, profileStatus, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export type { ProfileStatus };
