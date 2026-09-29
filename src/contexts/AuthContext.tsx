import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/auth";

type ProfileStatus = "loading" | "ready" | "missing" | "error";

type InviteUrl = {
  isInvite: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  errorMessage: string | null;
};

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitializingInvite: boolean;
  profileStatus: ProfileStatus;
  profileError: Error | null;
  inviteError: string | null;
  isInviteSession: boolean;
  refreshProfile: (userId: string) => Promise<Profile | null>;
  clearInviteSession: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const expiredInviteMessage = "This invitation has expired or is no longer valid. Please request a new invitation from your administrator.";

function getInviteErrorMessage(error: string | null, errorCode: string | null, errorDescription: string | null, hasOtpExpired: boolean) {
  if (hasOtpExpired || errorCode === "otp_expired" || error === "otp_expired") return "This invitation has expired. Please request a new invitation from your administrator.";
  if (error === "access_denied" || errorCode === "access_denied") return "This invitation was denied or is no longer valid. Please request a new invitation from your administrator.";
  if (errorDescription) return errorDescription;
  if (error || errorCode) return "This invitation could not be verified. Please request a new invitation from your administrator.";
  return null;
}

function readInviteUrl(): InviteUrl {
  if (typeof window === "undefined") {
    return { isInvite: false, accessToken: null, refreshToken: null, code: null, errorMessage: null };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const error = searchParams.get("error") ?? hashParams.get("error");
  const errorCode = searchParams.get("error_code") ?? hashParams.get("error_code");
  const errorDescription = searchParams.get("error_description") ?? hashParams.get("error_description");
  const hasOtpExpired = searchParams.has("otp_expired") || hashParams.has("otp_expired");
  const code = searchParams.get("code");
  const isInvite = hashParams.get("type") === "invite" || Boolean(code) || Boolean(error || errorCode || errorDescription || hasOtpExpired);

  return {
    isInvite,
    accessToken: hashParams.get("access_token"),
    refreshToken: hashParams.get("refresh_token"),
    code,
    errorMessage: getInviteErrorMessage(error, errorCode, errorDescription, hasOtpExpired),
  };
}

function removeInviteUrl() {
  if (typeof window === "undefined") return;
  if (!window.location.hash && !window.location.search) return;
  window.history.replaceState(null, document.title, window.location.pathname);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialInviteUrl = readInviteUrl();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializingInvite, setIsInitializingInvite] = useState(initialInviteUrl.isInvite);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("loading");
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(initialInviteUrl.errorMessage);
  const [isInviteSession, setIsInviteSession] = useState(initialInviteUrl.isInvite);

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
    const inviteUrl = readInviteUrl();

    const handleSessionChange = (_event: string, nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);
      if (isInitializing) return;

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
        if (inviteUrl.isInvite) {
          setIsInviteSession(true);

          if (inviteUrl.errorMessage) {
            authError = new Error(inviteUrl.errorMessage);
          } else if (inviteUrl.code) {
            const { data: codeSession, error: codeError } = await supabase.auth.exchangeCodeForSession(inviteUrl.code);
            if (codeError || !codeSession.session) {
              authError = new Error(codeError?.message || expiredInviteMessage);
            } else {
              nextSession = codeSession.session;
            }
          } else if (inviteUrl.accessToken && inviteUrl.refreshToken) {
            const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
              access_token: inviteUrl.accessToken,
              refresh_token: inviteUrl.refreshToken,
            });

            if (setSessionError || !setSessionData.session) {
              authError = new Error(setSessionError?.message || expiredInviteMessage);
            } else {
              nextSession = setSessionData.session;
            }
          } else {
            authError = new Error(expiredInviteMessage);
          }

          removeInviteUrl();

          if (!authError && nextSession) {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user) {
              authError = new Error(userError?.message || expiredInviteMessage);
            } else if (userData.user.id !== nextSession.user.id) {
              authError = new Error(expiredInviteMessage);
            } else {
              authenticatedUserId = userData.user.id;
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
          if (inviteUrl.isInvite) setInviteError(authError.message);
          return;
        }

        setSession(nextSession);
        if (!nextSession) {
          setProfile(null);
          setProfileStatus("ready");
          return;
        }

        const nextProfile = await refreshProfile(authenticatedUserId || nextSession.user.id);
        if (inviteUrl.isInvite && !nextProfile) {
          setInviteError("Your FixPoint employee profile could not be found. Please request a new invitation from your administrator.");
        }
      } catch (error) {
        if (!isMounted) return;
        const nextError = error instanceof Error ? error : new Error(expiredInviteMessage);
        setSession(null);
        setProfile(null);
        setProfileStatus("error");
        setProfileError(nextError);
        if (inviteUrl.isInvite) setInviteError(nextError.message);
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
    inviteError,
    isInviteSession,
    refreshProfile,
    clearInviteSession: () => {
      removeInviteUrl();
      setInviteError(null);
      setIsInviteSession(false);
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  }), [inviteError, isInitializingInvite, isInviteSession, isLoading, profile, profileError, profileStatus, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export type { ProfileStatus };
