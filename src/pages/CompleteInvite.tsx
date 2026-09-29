import { CheckCircle2, KeyRound, Mail, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getRolePath, isProfileRole } from "@/lib/auth";

const expiredInviteMessage = "This invitation has expired or is no longer valid. Please request a new invitation from your administrator.";

function requestNewInvitation(email?: string | null) {
  const subject = encodeURIComponent("Request a new FixPoint invitation");
  const body = encodeURIComponent(`Please send a new FixPoint invitation to ${email || "my email address"}.`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

export default function CompleteInvite() {
  const navigate = useNavigate();
  const { session, profile, isLoading, isInitializingInvite, profileStatus, inviteError, isInviteSession, refreshProfile, clearInviteSession } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!password) {
      setError("Password is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!confirmation) {
      setError("Please confirm your password.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setIsSaving(true);
    try {
      const { data: currentSession, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !currentSession.session || !session) {
        throw new Error(expiredInviteMessage);
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);

      const { data: verifiedSession, error: verificationError } = await supabase.auth.getSession();
      if (verificationError || !verifiedSession.session) {
        throw new Error("Your password could not be verified. Please request a new invitation from your administrator.");
      }

      const nextProfile = await refreshProfile(verifiedSession.session.user.id);
      if (!nextProfile || !isProfileRole(nextProfile.role)) {
        throw new Error("Your FixPoint employee profile could not be found. Please contact your administrator.");
      }

      clearInviteSession();
      navigate(getRolePath(nextProfile.role), { replace: true });
    } catch (completionError) {
      setError(completionError instanceof Error ? completionError.message : "Account setup could not be completed.");
    } finally {
      setIsSaving(false);
    }
  };

  const isPreparing = isInitializingInvite || isLoading || profileStatus === "loading";
  const hasInvalidInvite = !isInviteSession || !session;
  const hasMissingProfile = Boolean(session && !isPreparing && !profile);
  const email = profile?.email || session?.user.email || null;
  const fullName = profile?.full_name || session?.user.user_metadata?.full_name || "Not provided";
  const displayedInviteError = inviteError || expiredInviteMessage;

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#252525] px-5 py-8 text-[#252525] sm:px-8 sm:py-12">
      <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#B4232C]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#F3C7C6]/10 blur-3xl" />
      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col justify-center">
        <div className="mb-10"><BrandMark inverse /></div>
        <div className="rounded-[2rem] border border-white/10 bg-white p-7 shadow-[0_28px_70px_rgba(0,0,0,0.28)] sm:p-10">
          {isPreparing ? (
            <InviteMessage title="Preparing secure setup..." detail="Verifying your FixPoint invitation." />
          ) : hasInvalidInvite ? (
            <InviteMessage title="Invitation unavailable" detail={displayedInviteError} error>
              <button type="button" onClick={() => requestNewInvitation(email)} className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#B4232C] px-5 text-sm font-bold text-white hover:bg-[#8f1f27]">Request a new invitation</button>
              <button type="button" onClick={() => navigate("/login")} className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-[#dedbd6] bg-white px-5 text-sm font-bold text-[#5F5B57] hover:bg-[#f8f6f3]">Return to sign in</button>
            </InviteMessage>
          ) : hasMissingProfile ? (
            <InviteMessage title="Employee profile unavailable" detail="Your FixPoint employee profile could not be found. Please request a new invitation from your administrator." error>
              <button type="button" onClick={() => requestNewInvitation(email)} className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#B4232C] px-5 text-sm font-bold text-white hover:bg-[#8f1f27]">Request a new invitation</button>
            </InviteMessage>
          ) : (
            <>
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3c7c6] text-[#8f1f27]"><KeyRound size={26} /></div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#B4232C]">FixPoint</p>
              <h1 className="font-display text-3xl font-bold tracking-[-0.06em] sm:text-4xl">Complete Your Account</h1>
              <p className="mt-3 text-sm leading-6 text-[#77736e]">Your administrator created this employee account. Choose a password to finish setup and open your assigned workspace.</p>

              <div className="mt-7 grid gap-3 rounded-2xl border border-[#eeeae5] bg-[#fbfaf8] p-4 sm:grid-cols-2">
                <div className="flex items-start gap-3"><UserRound size={17} className="mt-0.5 shrink-0 text-[#B4232C]" /><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#9a9690]">Full name</p><p className="mt-1 text-sm font-bold text-[#34312e]">{fullName}</p></div></div>
                <div className="flex items-start gap-3"><Mail size={17} className="mt-0.5 shrink-0 text-[#B4232C]" /><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#9a9690]">Employee email</p><p className="mt-1 break-all text-sm font-bold text-[#34312e]">{email || "Not available"}</p></div></div>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                <div><label htmlFor="invite-password" className="mb-2 block text-sm font-bold text-[#4e4a46]">New Password</label><input id="invite-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="h-13 w-full rounded-xl border border-[#dedbd6] bg-[#fbfaf8] px-4 text-sm outline-none transition-colors placeholder:text-[#aaa59e] focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10" /></div>
                <div><label htmlFor="invite-password-confirmation" className="mb-2 block text-sm font-bold text-[#4e4a46]">Confirm Password</label><input id="invite-password-confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Re-enter your password" className="h-13 w-full rounded-xl border border-[#dedbd6] bg-[#fbfaf8] px-4 text-sm outline-none transition-colors placeholder:text-[#aaa59e] focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10" /></div>
                <p className="text-xs leading-5 text-[#77736e]">Your administrator assigned your FixPoint access. Account setup does not change your role.</p>
                {error && <div role="alert" className="rounded-xl border border-[#efc4c3] bg-[#fff4f3] px-4 py-3 text-sm text-[#8f1f27]"><p className="font-bold">Account setup could not be completed</p><p className="mt-1 text-xs leading-5 text-[#a64a4e]">{error}</p></div>}
                <button type="submit" disabled={isSaving} className="flex h-13 w-full items-center justify-center rounded-xl bg-[#B4232C] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(180,35,44,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#8f1f27] disabled:cursor-wait disabled:opacity-75 disabled:hover:translate-y-0">{isSaving ? "Completing setup..." : "Complete Account Setup"}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function InviteMessage({ title, detail, error = false, children }: { title: string; detail: string; error?: boolean; children?: React.ReactNode }) {
  return <div className="py-5"><div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${error ? "bg-[#fff0ef] text-[#B4232C]" : "bg-[#f3c7c6] text-[#8f1f27]"}`}><CheckCircle2 size={26} /></div><h1 className="font-display text-3xl font-bold tracking-[-0.06em]">{title}</h1><p className="mt-3 text-sm leading-6 text-[#77736e]">{detail}</p>{children}</div>;
}
