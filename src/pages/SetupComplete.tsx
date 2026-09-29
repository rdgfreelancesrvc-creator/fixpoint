import { CheckCircle2, KeyRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function SetupComplete() {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setIsSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setIsSaving(false);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError("Your password was saved, but we could not finish the secure sign-out. Please close this page and sign in again.");
      setIsSaving(false);
      return;
    }

    setIsComplete(true);
    setIsSaving(false);
  };

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#252525] px-5 py-8 text-[#252525] sm:px-8 sm:py-12">
      <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#B4232C]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#F3C7C6]/10 blur-3xl" />
      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col justify-center">
        <div className="mb-10"><BrandMark inverse /></div>
        <div className="rounded-[2rem] border border-white/10 bg-white p-7 shadow-[0_28px_70px_rgba(0,0,0,0.28)] sm:p-10">
          {isLoading ? <SetupCompleteMessage title="Preparing secure setup..." detail="Verifying your invitation." /> : isComplete ? <SetupCompleteMessage title="Password established" detail="Your Owner/Admin account is ready. Sign in to the FixPoint internal portal."><button type="button" onClick={() => navigate("/login")} className="mt-7 flex h-13 w-full items-center justify-center rounded-xl bg-[#B4232C] px-5 text-sm font-bold text-white hover:bg-[#8f1f27]">Go to Login</button></SetupCompleteMessage> : !session ? <SetupCompleteMessage title="Invitation link unavailable" detail="This secure invitation has expired or has already been used. Request a new invitation from the FixPoint setup page."><button type="button" onClick={() => navigate("/login")} className="mt-7 flex h-13 w-full items-center justify-center rounded-xl border border-[#dedbd6] bg-white px-5 text-sm font-bold text-[#5F5B57] hover:bg-[#f8f6f3]">Go to Login</button></SetupCompleteMessage> : <>
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3c7c6] text-[#8f1f27]"><KeyRound size={26} /></div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#B4232C]">Secure account setup</p>
            <h1 className="font-display text-3xl font-bold tracking-[-0.06em] sm:text-4xl">Establish your password</h1>
            <p className="mt-3 text-sm leading-6 text-[#77736e]">Choose a password for your FixPoint Owner/Admin account. It is handled by Supabase Auth and is never stored in your profile.</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <div><label htmlFor="setup-password" className="mb-2 block text-sm font-bold text-[#4e4a46]">Password</label><input id="setup-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="h-13 w-full rounded-xl border border-[#dedbd6] bg-[#fbfaf8] px-4 text-sm outline-none transition-colors placeholder:text-[#aaa59e] focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10" /></div>
              <div><label htmlFor="setup-password-confirmation" className="mb-2 block text-sm font-bold text-[#4e4a46]">Confirm Password</label><input id="setup-password-confirmation" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Re-enter your password" className="h-13 w-full rounded-xl border border-[#dedbd6] bg-[#fbfaf8] px-4 text-sm outline-none transition-colors placeholder:text-[#aaa59e] focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10" /></div>
              {error && <div role="alert" className="rounded-xl border border-[#efc4c3] bg-[#fff4f3] px-4 py-3 text-sm text-[#8f1f27]"><p className="font-bold">Password setup could not be completed</p><p className="mt-1 text-xs leading-5 text-[#a64a4e]">{error}</p></div>}
              <button type="submit" disabled={isSaving} className="flex h-13 w-full items-center justify-center rounded-xl bg-[#B4232C] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(180,35,44,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#8f1f27] disabled:cursor-wait disabled:opacity-75 disabled:hover:translate-y-0">{isSaving ? "Saving password..." : "Save Password"}</button>
            </form>
          </>}
        </div>
      </div>
    </main>
  );
}

function SetupCompleteMessage({ title, detail, children }: { title: string; detail: string; children?: React.ReactNode }) {
  return <div className="py-5"><div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3c7c6] text-[#8f1f27]"><CheckCircle2 size={26} /></div><h1 className="font-display text-3xl font-bold tracking-[-0.06em]">{title}</h1><p className="mt-3 text-sm leading-6 text-[#77736e]">{detail}</p>{children}</div>;
}
