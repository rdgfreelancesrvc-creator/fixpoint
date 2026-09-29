import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { createInitialAdmin, getInitialAdminSetupStatus } from "@/lib/initialAdminSetup";

type SetupState = "loading" | "available" | "complete" | "created" | "error";

export default function Setup() {
  const navigate = useNavigate();
  const [state, setState] = useState<SetupState>("loading");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void getInitialAdminSetupStatus()
      .then((available) => {
        if (isMounted) setState(available ? "available" : "complete");
      })
      .catch((statusError) => {
        if (!isMounted) return;
        setError(statusError instanceof Error ? statusError.message : "The setup status could not be checked.");
        setState("error");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      await createInitialAdmin(fullName.trim(), email.trim());
      setState("created");
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "The Owner/Admin account could not be created.";
      if (message.toLowerCase().includes("setup already complete")) {
        setState("complete");
      } else {
        setError(message);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#f5f4f1] px-5 py-8 text-[#252525] sm:px-8 sm:py-12">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#f3c7c6]/55 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#e9ded4]/70 blur-3xl" />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col">
        <BrandMark />
        <div className="mx-auto grid w-full max-w-4xl flex-1 items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-16">
          <section className="animate-fade-up">
            <p className="mb-5 flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#B4232C]"><span className="h-px w-7 bg-current" />Private installation</p>
            <h1 className="max-w-lg font-display text-5xl font-bold leading-[0.98] tracking-[-0.07em] sm:text-6xl">Set up your FixPoint workspace.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#77736e]">Create the first Owner/Admin account. FixPoint will send a secure invitation so the administrator can establish a password privately.</p>
            <div className="mt-9 flex items-start gap-3 text-sm font-semibold text-[#5f5b57]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#B4232C] shadow-sm"><ShieldCheck size={17} /></span><span>No password is entered or stored on this setup page.</span></div>
          </section>

          <section className="w-full animate-fade-up lg:justify-self-end" style={{ animationDelay: "90ms" }}>
            <div className="rounded-[2rem] border border-[#e5e2dd] bg-white p-7 shadow-[0_24px_60px_rgba(37,37,37,0.08)] sm:p-10">
              {state === "loading" && <SetupMessage title="Checking setup status..." detail="Verifying whether this FixPoint workspace still needs its first administrator." />}
              {state === "error" && <SetupMessage title="Setup is unavailable" detail={error ?? "The setup status could not be checked."} error><button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-[#B4232C] px-5 py-3 text-sm font-bold text-white hover:bg-[#8f1f27]">Try again</button></SetupMessage>}
              {state === "complete" && <SetupMessage title="Setup Already Complete" detail="An Owner/Admin account already exists. Please sign in to the FixPoint portal."><button type="button" onClick={() => navigate("/login")} className="mt-7 flex h-13 w-full items-center justify-center rounded-xl bg-[#B4232C] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(180,35,44,0.18)] hover:bg-[#8f1f27]">Go to Login</button></SetupMessage>}
              {state === "created" && <SetupMessage title="Owner/Admin account created" detail="Your FixPoint administrator account is ready. You can now sign in to the internal portal."><p className="mt-4 rounded-xl border border-[#d9eadc] bg-[#f3fbf4] px-4 py-3 text-sm leading-6 text-[#267342]">A secure invitation was sent to the email address provided. Use it to establish your password before signing in.</p><button type="button" onClick={() => navigate("/login")} className="mt-7 flex h-13 w-full items-center justify-center rounded-xl bg-[#B4232C] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(180,35,44,0.18)] hover:bg-[#8f1f27]">Go to Login</button></SetupMessage>}
              {state === "available" && <>
                <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#B4232C]">FixPoint Initial Setup</p><h2 className="font-display text-3xl font-bold tracking-[-0.06em] sm:text-4xl">Create the first Owner/Admin account</h2><p className="mt-3 text-sm leading-6 text-[#77736e]">Enter the administrator’s details. A secure invitation will be sent to establish their password.</p></div>
                <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                  <div><label htmlFor="setup-full-name" className="mb-2 block text-sm font-bold text-[#4e4a46]">Full Name</label><div className="relative"><UserRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9690]" /><input id="setup-full-name" name="full_name" required maxLength={160} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Alex Morgan" className="h-13 w-full rounded-xl border border-[#dedbd6] bg-[#fbfaf8] pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-[#aaa59e] focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10" /></div></div>
                  <div><label htmlFor="setup-email" className="mb-2 block text-sm font-bold text-[#4e4a46]">Email</label><div className="relative"><Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9690]" /><input id="setup-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-13 w-full rounded-xl border border-[#dedbd6] bg-[#fbfaf8] pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-[#aaa59e] focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10" /></div></div>
                  {error && <div role="alert" className="rounded-xl border border-[#efc4c3] bg-[#fff4f3] px-4 py-3 text-sm text-[#8f1f27]"><p className="font-bold">Account setup could not be completed</p><p className="mt-1 text-xs leading-5 text-[#a64a4e]">{error}</p></div>}
                  <button type="submit" disabled={isCreating} className="flex h-13 w-full items-center justify-center rounded-xl bg-[#B4232C] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(180,35,44,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#8f1f27] disabled:cursor-wait disabled:opacity-75 disabled:hover:translate-y-0">{isCreating ? "Creating account..." : "Create Owner/Admin Account"}</button>
                </form>
              </>}
            </div>
            <p className="mt-6 text-center text-xs leading-5 text-[#9a9690]">This private setup page is available only until the first active Admin account is created.</p>
          </section>
        </div>
      </div>
    </main>
  );
}

function SetupMessage({ title, detail, error = false, children }: { title: string; detail: string; error?: boolean; children?: React.ReactNode }) {
  return <div className="py-5"><div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${error ? "bg-[#fff0ef] text-[#B4232C]" : "bg-[#f3c7c6] text-[#8f1f27]"}`}><ShieldCheck size={26} /></div><h2 className="font-display text-3xl font-bold tracking-[-0.06em]">{title}</h2><p className="mt-3 text-sm leading-6 text-[#77736e]">{detail}</p>{children}</div>;
}
