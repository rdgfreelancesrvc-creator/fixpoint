import { Crosshair } from "lucide-react";
import type { ReactNode } from "react";

interface BrandMarkProps {
  inverse?: boolean;
  compact?: boolean;
}

export function BrandMark({ inverse = false, compact = false }: BrandMarkProps) {
  return (
    <div className={`flex items-center gap-3 ${inverse ? "text-white" : "text-[#252525]"}`}>
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#B4232C] text-white shadow-[0_8px_18px_rgba(180,35,44,0.2)]">
        <span className="absolute h-5 w-5 rounded-full border-2 border-white/90" />
        <Crosshair size={16} strokeWidth={2.5} className="relative" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.4rem] font-bold tracking-[-0.05em]">FixPoint</span>
          <span className={`mt-1 text-[0.58rem] font-semibold uppercase tracking-[0.2em] ${inverse ? "text-white/55" : "text-[#77736e]"}`}>
            PC & Laptop Repair
          </span>
        </span>
      )}
    </div>
  );
}

export function SectionEyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={`mb-4 flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.24em] ${light ? "text-[#F06B70]" : "text-[#B4232C]"}`}>
      <span className="h-px w-7 bg-current" />
      {children}
    </p>
  );
}
