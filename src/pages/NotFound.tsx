import { Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";

export default function NotFound() { return <div className="flex min-h-screen items-center justify-center bg-[#f5f4f1] px-5 text-center"><div><BrandMark /><p className="mt-16 text-sm font-bold uppercase tracking-[0.2em] text-[#B4232C]">404</p><h1 className="mt-3 font-display text-5xl font-bold tracking-[-0.06em]">Page not found.</h1><p className="mt-4 text-[#77736e]">That FixPoint page has not been built yet.</p><Link to="/" className="mt-8 inline-flex rounded-full bg-[#B4232C] px-6 py-3.5 text-sm font-bold text-white">Back to homepage</Link></div></div>; }
