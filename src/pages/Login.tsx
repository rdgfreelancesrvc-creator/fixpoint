import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { DEMO_CREDENTIALS } from "@/config/demoAuth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasError(false);

    const credential = DEMO_CREDENTIALS.find(
      (item) => item.email === email.trim().toLowerCase() && item.password === password,
    );

    if (!credential) {
      setHasError(true);
      return;
    }

    setIsSigningIn(true);
    window.setTimeout(() => navigate(credential.destination), 650);
  };

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#252525] px-5 py-8 text-[#252525] sm:px-8 sm:py-12">
      <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#B4232C]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#F3C7C6]/10 blur-3xl" />
      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <section className="hidden text-white lg:block">
          <BrandMark inverse />
          <div className="mt-20 max-w-md">
            <p className="mb-5 flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#F06B70]">
              <span className="h-px w-7 bg-current" />
              Internal workspace
            </p>
            <h1 className="font-display text-6xl font-bold leading-[0.96] tracking-[-0.07em]">
              Keep every repair moving forward.
            </h1>
            <p className="mt-7 max-w-sm text-base leading-7 text-white/55">
              A focused workspace for the people who keep FixPoint helpful, responsive, and on time.
            </p>
          </div>
          <div className="mt-20 flex items-center gap-3 text-sm text-white/45">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5">
              <ShieldCheck size={17} className="text-[#F06B70]" />
            </span>
            Private workspace access
          </div>
        </section>

        <section className="mx-auto w-full max-w-[480px] animate-fade-up lg:mx-0 lg:justify-self-end">
          <div className="rounded-[2rem] border border-white/10 bg-white p-7 shadow-[0_28px_70px_rgba(0,0,0,0.28)] sm:p-10">
            <div className="mb-9 lg:hidden">
              <BrandMark />
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#B4232C]">FixPoint workspace</p>
              <h2 className="font-display text-3xl font-bold tracking-[-0.06em] sm:text-4xl">Welcome back</h2>
              <p className="mt-3 text-sm leading-6 text-[#77736e]">Sign in to your FixPoint workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-bold text-[#4e4a46]">Email</label>
                <div className="relative">
                  <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9690]" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => { setEmail(event.target.value); setHasError(false); }}
                    className="h-13 w-full rounded-xl border border-[#dedbd6] bg-[#fbfaf8] pl-11 pr-4 text-sm text-[#252525] outline-none transition-colors placeholder:text-[#aaa59e] focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-bold text-[#4e4a46]">Password</label>
                <div className="relative">
                  <LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9690]" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); setHasError(false); }}
                    className="h-13 w-full rounded-xl border border-[#dedbd6] bg-[#fbfaf8] pl-11 pr-12 text-sm text-[#252525] outline-none transition-colors placeholder:text-[#aaa59e] focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#89847d] transition-colors hover:bg-[#f1efeb] hover:text-[#252525]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {hasError && (
                <div role="alert" className="rounded-xl border border-[#efc4c3] bg-[#fff4f3] px-4 py-3 text-sm text-[#8f1f27]">
                  <p className="font-bold">Invalid email or password</p>
                  <p className="mt-1 text-xs leading-5 text-[#a64a4e]">Please check your credentials and try again.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSigningIn}
                className="flex h-13 w-full items-center justify-center rounded-xl bg-[#B4232C] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(180,35,44,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#8f1f27] disabled:cursor-wait disabled:opacity-75 disabled:hover:translate-y-0"
              >
                {isSigningIn ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <button type="button" className="mx-auto mt-6 block text-sm font-bold text-[#B4232C] transition-colors hover:text-[#8f1f27]">
              Forgot your password?
            </button>
          </div>
          <p className="mt-6 text-center text-xs leading-5 text-white/35">For FixPoint team members only</p>
        </section>
      </div>
    </main>
  );
}
