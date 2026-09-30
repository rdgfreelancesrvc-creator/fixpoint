import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Cpu,
  FileCheck2,
  Laptop,
  Monitor,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark, SectionEyebrow } from "@/components/BrandMark";
import { PublicHeader } from "@/components/PublicHeader";
import { listActiveServices, type ServiceCatalogItem } from "@/lib/serviceCatalog";

const processSteps = [
  { number: "01", title: "Submit a Request", text: "Tell us what is happening and share the details that help us get started." },
  { number: "02", title: "We Diagnose", text: "A technician inspects your device and identifies the issue carefully." },
  { number: "03", title: "Receive Your Quotation", text: "Review a clear recommendation and quotation before work begins." },
  { number: "04", title: "Approve the Repair", text: "Give us the go-ahead when the repair plan feels right for you." },
  { number: "05", title: "We Fix It", text: "Our team completes the approved work with care and attention." },
  { number: "06", title: "Ready for Pickup", text: "We let you know when your device is ready for its way home." },
];

const trustItems = [
  { icon: Search, label: "Professional Diagnostics" },
  { icon: FileCheck2, label: "Transparent Quotations" },
  { icon: Clock3, label: "Repair Tracking" },
  { icon: ClipboardCheck, label: "Customer Approval" },
];

function serviceIcon(name: string): LucideIcon {
  if (name.includes("Laptop Diagnostic")) return Laptop;
  if (name.includes("Desktop")) return Monitor;
  if (name.includes("Cleaning")) return Sparkles;
  if (name.includes("Operating System")) return Wrench;
  return Cpu;
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[650px] lg:mx-0 lg:justify-self-end">
      <div className="absolute -right-4 -top-7 h-28 w-28 border border-[#c9bbb2] bg-[#e8e2dc] sm:right-8" />
      <div className="relative overflow-hidden border-[8px] border-white bg-[#262624] shadow-[0_28px_70px_rgba(29,29,27,0.22)] sm:border-[12px]">
        <img
          src="https://images.unsplash.com/photo-1593642532744-d377ab507dc8?auto=format&fit=crop&w=1400&q=88"
          alt="Technician repairing a laptop at a clean professional workbench"
          className="aspect-[1.04] w-full object-cover sm:aspect-[1.14]"
        />
        <div className="absolute inset-0 bg-[#171715]/10" />
        <div className="absolute bottom-5 left-5 right-5 border border-white/20 bg-[#1d1d1b]/90 p-4 text-white shadow-2xl backdrop-blur-sm sm:bottom-7 sm:left-7 sm:right-7 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/55">FixPoint workshop</p>
              <p className="mt-1 font-display text-lg font-bold tracking-[-0.03em]">Careful work, clearly explained.</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#B4232C] text-white"><ShieldCheck size={17} /></span>
          </div>
        </div>
      </div>
      <div className="motion-safe:animate-fade-up absolute -bottom-8 -left-3 w-[220px] border border-[#d8d0c8] bg-white p-4 shadow-[0_18px_36px_rgba(29,29,27,0.14)] sm:-left-8 sm:w-[250px] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#88817a]">Repair Status</p>
            <p className="mt-1 font-display text-base font-bold text-[#242422]">SR-2026-00125</p>
          </div>
          <span className="motion-safe:animate-pulse mt-1 h-2 w-2 rounded-full bg-[#B4232C]" />
        </div>
        <div className="mt-4 flex items-center justify-between text-xs font-bold">
          <span className="text-[#B4232C]">Diagnosing</span>
          <span className="text-[#938c84]">2 of 6 steps</span>
        </div>
        <div className="mt-2 h-1.5 bg-[#eee9e3]"><div className="h-1.5 w-1/3 bg-[#B4232C]" /></div>
      </div>
    </div>
  );
}

function ServiceCard({ service, index }: { service: ServiceCatalogItem; index: number }) {
  const Icon = serviceIcon(service.name);
  return (
    <article className="group border border-[#ded9d2] bg-[#fbfaf8] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#b4232c]/50 hover:bg-white hover:shadow-[0_16px_30px_rgba(29,29,27,0.07)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 items-center justify-center bg-[#f7e7e5] text-[#B4232C]"><Icon size={21} strokeWidth={1.8} /></span>
        <span className="font-display text-2xl font-bold text-[#d6d0c9]">0{index + 1}</span>
      </div>
      <h3 className="mt-7 min-h-[3.25rem] font-display text-lg font-bold leading-tight tracking-[-0.035em] text-[#252523]">{service.name}</h3>
      <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-[#77716a]">{service.description || "Professional service from the FixPoint team."}</p>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#e8e3dc] pt-4 text-xs">
        <div>
          <span className="block font-bold text-[#403c37]">From ₱{service.starting_price.toLocaleString()}</span>
          <span className="mt-1 block text-[#958e86]">{service.estimated_time || "Timing varies"}</span>
        </div>
        <Link to="/about" className="inline-flex items-center gap-1 font-bold text-[#B4232C] transition-colors hover:text-[#8f1f27]">
          Learn more <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}

function TrackingCard() {
  const timeline = ["Request Received", "Diagnosing", "Quotation", "Repair", "Ready for Pickup"];
  return (
    <div className="border border-[#dcd6ce] bg-white p-5 shadow-[0_24px_55px_rgba(29,29,27,0.1)] sm:p-7">
      <div className="flex items-start justify-between gap-5 border-b border-[#eeeae5] pb-5">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#8d867e]">Service Request</p>
          <p className="mt-2 font-display text-xl font-bold tracking-[-0.03em] text-[#252523]">SR-2026-00125</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center bg-[#f7e7e5] text-[#B4232C]"><Laptop size={19} /></span>
      </div>
      <div className="flex items-center justify-between gap-4 py-5">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#99928a]">Device service</p><p className="mt-1 font-bold text-[#403c37]">Laptop Diagnostic</p></div>
        <span className="border border-[#efc7c5] bg-[#fff5f3] px-3 py-1.5 text-xs font-bold text-[#B4232C]">Diagnosing</span>
      </div>
      <div className="space-y-0">
        {timeline.map((item, index) => (
          <div key={item} className="relative flex items-center gap-4 pb-5 last:pb-0">
            {index < timeline.length - 1 && <span className="absolute left-[9px] top-5 h-[calc(100%-5px)] w-px bg-[#e1dbd4]" aria-hidden="true" />}
            <span className={`relative z-10 h-[19px] w-[19px] shrink-0 border-4 ${index < 2 ? "border-[#f3d0ce] bg-[#B4232C]" : "border-[#e9e4de] bg-white"}`} />
            <span className={`text-sm ${index === 1 ? "font-bold text-[#252523]" : index === 0 ? "font-semibold text-[#5f5952]" : "text-[#a39c94]"}`}>{item}</span>
            {index === 1 && <span className="ml-auto text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#B4232C]">Current</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Index() {
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);

  useEffect(() => {
    listActiveServices().then(setServices);
  }, []);

  return (
    <div id="top" className="overflow-hidden bg-[#fbfaf8] text-[#252523]">
      <section className="relative bg-[#eeebe6]">
        <PublicHeader />
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-28 pt-32 sm:px-8 sm:pb-32 sm:pt-36 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20 lg:px-10 lg:pb-40 lg:pt-44">
          <div className="motion-safe:animate-fade-up">
            <SectionEyebrow>PC & Laptop Repair Services</SectionEyebrow>
            <h1 className="max-w-xl font-display text-[3.85rem] font-bold leading-[0.92] tracking-[-0.075em] text-[#1f1f1d] sm:text-7xl lg:text-[5.8rem]">Your Device.<br /><span className="text-[#B4232C]">Fixed Right.</span></h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#625d57] sm:text-lg">Request a repair online, follow the diagnosis, review your quotation, and approve the work digitally. FixPoint keeps every important step clear.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/request" className="group inline-flex items-center gap-3 bg-[#B4232C] px-6 py-4 text-sm font-bold text-white shadow-[0_13px_25px_rgba(180,35,44,0.22)] transition-all hover:-translate-y-1 hover:bg-[#972029]">Request a Repair <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></Link>
              <Link to="/track" className="inline-flex items-center gap-2 border border-[#cfc8c0] bg-[#f8f6f2] px-6 py-4 text-sm font-bold text-[#3e3a36] transition-all hover:-translate-y-0.5 hover:border-[#B4232C] hover:text-[#B4232C]">Track My Repair</Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[#777068]">
              <span className="flex items-center gap-2"><Check size={14} className="text-[#B4232C]" />Professional diagnostics</span>
              <span className="hidden h-4 w-px bg-[#cfc8c0] sm:block" />
              <span className="flex items-center gap-2"><Check size={14} className="text-[#B4232C]" />Transparent quotations</span>
              <span className="hidden h-4 w-px bg-[#cfc8c0] sm:block" />
              <span className="flex items-center gap-2"><Check size={14} className="text-[#B4232C]" />Repair tracking</span>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section className="border-y border-[#ddd7d0] bg-white px-5 sm:px-8 lg:px-10" aria-label="FixPoint service benefits">
        <div className="mx-auto grid max-w-7xl divide-y divide-[#e6e1db] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {trustItems.map(({ icon: Icon, label }) => <div key={label} className="flex items-center gap-3 py-5 sm:px-6 lg:justify-center lg:px-4"><span className="flex h-9 w-9 items-center justify-center bg-[#f7e7e5] text-[#B4232C]"><Icon size={17} /></span><span className="text-sm font-bold text-[#48433d]">{label}</span></div>)}
        </div>
      </section>

      <section id="services" className="scroll-mt-10 bg-[#fbfaf8] px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><SectionEyebrow>What we repair</SectionEyebrow><h2 className="max-w-2xl font-display text-4xl font-bold leading-[1] tracking-[-0.06em] sm:text-5xl">Reliable solutions for the devices you <span className="text-[#B4232C]">depend on.</span></h2></div><p className="max-w-sm text-sm leading-6 text-[#77716a]">A focused service catalog for the everyday PC and laptop problems that need an expert set of hands.</p></div>
          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{services.map((service, index) => <ServiceCard key={service.id} service={service} index={index} />)}</div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-10 bg-[#242422] px-5 py-24 text-white sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl"><div className="max-w-2xl"><SectionEyebrow light>How it works</SectionEyebrow><h2 className="font-display text-4xl font-bold leading-[1] tracking-[-0.06em] sm:text-5xl">A clear path from <span className="text-[#F06B70]">problem to pickup.</span></h2><p className="mt-6 max-w-xl text-base leading-7 text-white/55">No black box. Each request moves through a simple sequence, with a clear decision point before any approved repair begins.</p></div>
          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-6 lg:gap-0">{processSteps.map((step, index) => <div key={step.number} className="relative border-l border-white/15 pl-5 lg:border-l-0 lg:border-t lg:px-5 lg:pl-5 first:lg:pl-0"><div className="absolute -left-px top-0 h-2 w-2 -translate-x-1/2 bg-[#F06B70] lg:left-5 lg:top-[-5px] lg:translate-x-0 first:lg:left-0" /><span className="font-display text-3xl font-bold text-[#F06B70]">{step.number}</span><h3 className="mt-5 max-w-[150px] font-display text-lg font-bold leading-tight">{step.title}</h3><p className="mt-3 max-w-[165px] text-sm leading-6 text-white/45">{step.text}</p>{index < processSteps.length - 1 && <span className="absolute right-0 top-[-1px] hidden h-px w-5 bg-white/15 lg:block" />}</div>)}</div>
        </div>
      </section>

      <section className="bg-[#e9e4de] px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.86fr_1.14fr] lg:gap-20"><div><SectionEyebrow>Repair tracking</SectionEyebrow><h2 className="max-w-xl font-display text-4xl font-bold leading-[1] tracking-[-0.06em] sm:text-5xl">Know what's happening with your <span className="text-[#B4232C]">repair.</span></h2><p className="mt-7 max-w-lg text-base leading-7 text-[#655f58]">Your repair reference gives you a simple view of the latest status, from the first request through the moment your device is ready for pickup.</p><Link to="/track" className="mt-8 inline-flex items-center gap-3 bg-[#242422] px-6 py-4 text-sm font-bold text-white transition-all hover:-translate-y-1 hover:bg-[#B4232C]">Track My Repair <ArrowRight size={17} /></Link></div><TrackingCard /></div>
      </section>

      <section className="bg-white px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1fr_0.92fr] lg:gap-24"><div className="relative order-2 lg:order-1"><div className="border-[10px] border-[#eeebe6] bg-[#242422] p-6 shadow-[0_25px_55px_rgba(29,29,27,0.15)] sm:p-9"><div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#F06B70]">The FixPoint standard</p><p className="mt-2 font-display text-2xl font-bold text-white">Repair without uncertainty.</p></div><ShieldCheck className="text-[#F06B70]" size={25} /></div><div className="grid gap-4 pt-6 sm:grid-cols-2">{["Clear diagnosis", "Transparent quotations", "Approval before repair", "Status tracking"].map((item, index) => <div key={item} className="flex items-center gap-3 border border-white/10 p-4"><span className="flex h-7 w-7 items-center justify-center bg-[#B4232C] text-white"><Check size={15} /></span><span className="text-sm font-semibold text-white/80">{item}</span><span className="ml-auto text-xs text-white/30">0{index + 1}</span></div>)}</div></div><span className="absolute -bottom-5 -right-3 hidden border border-[#d9d1c8] bg-[#f7f4ef] px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-[#635d55] shadow-lg sm:block">Straight-talking support</span></div><div className="order-1 lg:order-2"><SectionEyebrow>Why FixPoint</SectionEyebrow><h2 className="max-w-xl font-display text-4xl font-bold leading-[1] tracking-[-0.06em] sm:text-5xl">Repair service, without the <span className="text-[#B4232C]">uncertainty.</span></h2><p className="mt-7 max-w-xl text-base leading-7 text-[#6a645d]">FixPoint keeps the important moments visible: a clear diagnosis, a transparent quotation, your approval before repair, and a repair status you can check when you need it.</p><Link to="/about" className="mt-8 inline-flex items-center gap-2 border-b-2 border-[#B4232C] pb-2 text-sm font-bold text-[#B4232C] transition-colors hover:text-[#8f1f27]">Learn More <ArrowRight size={16} /></Link></div></div>
      </section>

      <section id="contact" className="scroll-mt-10 bg-[#fbfaf8] px-5 py-24 sm:px-8 lg:px-10 lg:py-28"><div className="mx-auto max-w-7xl border-t border-[#dfd9d2] pt-10"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><SectionEyebrow>Come say hello</SectionEyebrow><h2 className="font-display text-4xl font-bold tracking-[-0.06em] sm:text-5xl">Have a question?<br /><span className="text-[#B4232C]">We are here.</span></h2></div><div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a938a]">Call us</p><p className="mt-3 font-bold text-[#3e3a36]">(000) 000-0000</p><p className="mt-1 text-sm text-[#817a72]">Mon–Fri, 9am–5pm</p></div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a938a]">Visit us</p><p className="mt-3 font-bold text-[#3e3a36]">123 Repair Street</p><p className="mt-1 text-sm text-[#817a72]">Your town, ST 00000</p></div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a938a]">Email</p><p className="mt-3 break-all font-bold text-[#3e3a36]">hello@fixpoint.local</p><p className="mt-1 text-sm text-[#817a72]">We reply within a day</p></div></div></div></div></section>

      <section className="bg-[#B4232C] px-5 py-20 text-white sm:px-8 lg:px-10 lg:py-24"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-9 lg:flex-row lg:items-center"><div><p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#ffd9d7]">Start your repair</p><h2 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-[1] tracking-[-0.06em] sm:text-5xl">Need your PC or laptop fixed?</h2><p className="mt-5 max-w-xl text-base leading-7 text-white/75">Start your repair request online and let FixPoint take care of the rest.</p></div><div className="flex shrink-0 flex-wrap gap-3"><Link to="/request" className="inline-flex items-center gap-3 bg-white px-6 py-4 text-sm font-bold text-[#8f1f27] transition-all hover:-translate-y-1">Request a Repair <ArrowRight size={17} /></Link><Link to="/track" className="inline-flex items-center gap-3 border border-white/45 px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-white/10">Track a Repair</Link></div></div></section>

      <footer className="bg-[#242422] px-5 py-10 text-white sm:px-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row sm:items-center"><div><Link to="/" aria-label="FixPoint home"><BrandMark inverse /></Link><p className="mt-4 text-xs text-white/40">PC & Laptop Repair Services</p></div><div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/50"><a href="/#services" className="transition-colors hover:text-white">Services</a><Link to="/about" className="transition-colors hover:text-white">About</Link><a href="/#contact" className="transition-colors hover:text-white">Contact</a><Link to="/track" className="transition-colors hover:text-white">Track My Repair</Link><Link to="/login" className="font-bold text-[#F06B70]">Staff Login ↗</Link></div></div><div className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-5 text-xs text-white/30">© 2025 FixPoint. A temporary prototype brand.</div></footer>
    </div>
  );
}
