import { useEffect, useState, type ChangeEvent, type DragEvent, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown, FileUp, Home, Loader2, MessageSquare, ShieldCheck, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicHeader } from "@/components/PublicHeader";
import { SectionEyebrow } from "@/components/BrandMark";
import { listActiveServices, type ServiceCatalogItem } from "@/lib/serviceCatalog";
import { submitPublicServiceRequest, type AttachmentFailure, type PublicServiceRequestResult } from "@/lib/serviceRequests";

type FormValues = {
  fullName: string;
  mobile: string;
  email: string;
  preferredContact: string;
  deviceType: string;
  brand: string;
  model: string;
  serialNumber: string;
  serviceNeeded: string;
  problem: string;
  contactPreference: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  fullName: "",
  mobile: "",
  email: "",
  preferredContact: "",
  deviceType: "",
  brand: "",
  model: "",
  serialNumber: "",
  serviceNeeded: "",
  problem: "",
  contactPreference: "",
};

const acceptedFileTypes = ["image/jpeg", "image/png", "application/pdf"];
const maxFileSize = 10 * 1024 * 1024;

const inputClass = (hasError = false) => `mt-2 h-12 w-full rounded-xl border bg-[#fcfbf9] px-4 text-sm text-[#252525] outline-none transition-colors placeholder:text-[#aaa59e] focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10 ${hasError ? "border-[#B4232C]" : "border-[#dedbd6]"}`;
const selectClass = (hasError = false) => `${inputClass(hasError)} appearance-none pr-10`;

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-xs font-semibold text-[#B4232C]" role="alert">{message}</p> : null;
}

function SectionCard({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-[#e5e1db] bg-white p-5 shadow-[0_14px_35px_rgba(37,37,37,0.04)] sm:p-8">
      <div className="flex gap-4 border-b border-[#eeeae5] pb-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0ef] font-display text-sm font-bold text-[#B4232C]">{number}</span>
        <div>
          <h2 className="font-display text-xl font-bold tracking-[-0.04em] sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#817c76]">{description}</p>
        </div>
      </div>
      <div className="mt-7">{children}</div>
    </section>
  );
}

function FieldLabel({ htmlFor, children, optional = false }: { htmlFor: string; children: ReactNode; optional?: boolean }) {
  return <label htmlFor={htmlFor} className="text-sm font-bold text-[#3e3a36]">{children}{optional ? <span className="ml-1 font-normal text-[#9a9690]">(Optional)</span> : <span className="ml-1 text-[#B4232C]">*</span>}</label>;
}

function ChoiceGroup({ name, value, onChange, options, error, legend }: { name: string; value: string; onChange: (value: string) => void; options: string[]; error?: string; legend: string }) {
  return <fieldset>
    <legend className="text-sm font-bold text-[#3e3a36]">{legend}</legend>
    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      {options.map((option) => <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-semibold transition-colors ${value === option ? "border-[#B4232C] bg-[#fff5f3] text-[#8f1f27]" : "border-[#dedbd6] bg-[#fcfbf9] text-[#5f5b57] hover:border-[#c9a3a1]"}`}>
        <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} className="h-4 w-4 accent-[#B4232C]" />
        {option}
      </label>)}
    </div>
    <FieldError message={error} />
  </fieldset>;
}

function validateAttachment(file: File) {
  if (!acceptedFileTypes.includes(file.type)) return "Only JPG, PNG, and PDF files can be attached.";
  if (file.size <= 0 || file.size > maxFileSize) return "Each attachment must be smaller than 10 MB.";
  return null;
}

export default function RequestRepair() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [serviceLoadError, setServiceLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<PublicServiceRequestResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    void listActiveServices()
      .then((activeServices) => {
        if (isMounted) setServices(activeServices);
      })
      .catch(() => {
        if (isMounted) setServiceLoadError("Services could not be loaded. Please refresh and try again.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingServices(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    if (submitError) setSubmitError(null);
  };

  const addFiles = (nextFiles: FileList | File[]) => {
    const nextErrors: string[] = [];
    const validFiles: File[] = [];

    for (const file of Array.from(nextFiles)) {
      const error = validateAttachment(file);
      if (error) nextErrors.push(`${file.name}: ${error}`);
      else validFiles.push(file);
    }

    const availableSlots = Math.max(0, 5 - files.length);
    if (validFiles.length > availableSlots) nextErrors.push("You can attach up to 5 files.");
    setFiles((current) => [...current, ...validFiles.slice(0, availableSlots)]);
    setFileErrors(nextErrors);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!values.fullName.trim()) nextErrors.fullName = "Please enter your full name.";
    if (!values.mobile.trim()) nextErrors.mobile = "Please enter your mobile number.";
    if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email.trim())) nextErrors.email = "Please enter a valid email address.";
    if (!values.preferredContact) nextErrors.preferredContact = "Please choose a preferred contact method.";
    if (!values.deviceType) nextErrors.deviceType = "Please select a device type.";
    if (!values.brand.trim()) nextErrors.brand = "Please enter the device brand.";
    if (!values.serviceNeeded) nextErrors.serviceNeeded = "Please select a service.";
    if (!values.problem.trim()) nextErrors.problem = "Please describe the problem you are experiencing.";
    if (!values.contactPreference) nextErrors.contactPreference = "Please choose a contact preference.";
    if (serviceLoadError || services.length === 0) setSubmitError("Services could not be loaded. Please refresh and try again.");
    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || serviceLoadError || services.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await submitPublicServiceRequest({
        full_name: values.fullName.trim(),
        email: values.email.trim() || null,
        phone: values.mobile.trim(),
        preferred_contact: values.preferredContact,
        device_type: values.deviceType,
        brand: values.brand.trim(),
        model: values.model.trim() || null,
        serial_number: values.serialNumber.trim() || null,
        service_id: values.serviceNeeded,
        problem_description: values.problem.trim(),
        contact_preference: values.contactPreference,
      }, files);
      setSubmittedRequest(result);
    } catch {
      setSubmitError("We couldn't submit your request. Please check your information and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedRequest) {
    const attachmentFailures: AttachmentFailure[] = submittedRequest.attachmentErrors ?? [];
    return <div className="min-h-screen bg-[#f5f4f1] text-[#252525]"><PublicHeader /><main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5 pb-20 pt-32 sm:px-8"><div className="w-full rounded-[2rem] border border-[#e1ddd7] bg-white p-7 text-center shadow-[0_22px_55px_rgba(37,37,37,0.08)] sm:p-14"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#B4232C] text-white shadow-[0_12px_25px_rgba(180,35,44,0.2)]"><Check size={30} strokeWidth={2.5} /></span><SectionEyebrow>Request received</SectionEyebrow><h1 className="font-display text-4xl font-bold tracking-[-0.06em] sm:text-5xl">Request Received</h1><p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#77736e]">Your repair request has been submitted successfully.</p><div className="mx-auto mt-8 max-w-sm rounded-2xl border border-[#ead9d6] bg-[#fff7f5] px-5 py-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a9690]">Your service request number</p><p className="mt-2 font-display text-2xl font-bold tracking-[0.04em] text-[#B4232C]">{submittedRequest.request.request_number}</p></div>{attachmentFailures.length > 0 && <div className="mx-auto mt-5 max-w-md rounded-xl border border-[#ead9d6] bg-[#fff7f5] px-4 py-3 text-left text-sm leading-6 text-[#8f1f27]" role="alert"><p className="font-bold">Your request was saved, but these attachments could not be uploaded:</p><ul className="mt-1 list-disc pl-5">{attachmentFailures.map((failure) => <li key={failure.fileName}>{failure.fileName}</li>)}</ul></div>}<p className="mt-5 text-sm text-[#77736e]">Please keep this number for tracking your repair.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link to={`/track?requestNumber=${encodeURIComponent(submittedRequest.request.request_number)}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#B4232C] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(180,35,44,0.18)] transition-transform hover:-translate-y-0.5">Track My Repair <ArrowRight size={16} /></Link><Link to="/" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dedbd6] bg-white px-6 py-3.5 text-sm font-bold text-[#4e4a46] transition-colors hover:border-[#B4232C] hover:text-[#B4232C]"><Home size={16} /> Return to Home</Link></div><div className="mt-9 flex items-center justify-center gap-2 text-xs text-[#98938c]"><ShieldCheck size={15} className="text-[#B4232C]" /> Your request is securely stored with FixPoint.</div></div></main></div>;
  }

  return <div className="min-h-screen bg-[#f5f4f1] text-[#252525]"><PublicHeader /><main className="mx-auto max-w-4xl px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40"><div className="mx-auto max-w-2xl text-center"><SectionEyebrow>Start a conversation</SectionEyebrow><h1 className="font-display text-5xl font-bold leading-[0.98] tracking-[-0.07em] sm:text-6xl">Request a <span className="text-[#B4232C]">Repair</span></h1><p className="mx-auto mt-6 max-w-xl text-base leading-7 text-[#77736e] sm:text-lg">Tell us about your device and the problem you're experiencing. We'll review your request and get back to you.</p></div><form onSubmit={handleSubmit} noValidate className="mt-12 space-y-5 sm:mt-16">
    {serviceLoadError && <div className="rounded-2xl border border-[#efc4c3] bg-[#fff4f3] px-4 py-3 text-sm font-semibold text-[#8f1f27]" role="alert">{serviceLoadError}</div>}
    {submitError && <div className="rounded-2xl border border-[#efc4c3] bg-[#fff4f3] px-4 py-3 text-sm font-semibold text-[#8f1f27]" role="alert"><p className="font-bold">{submitError.includes("couldn't") ? "We couldn't submit your request" : "We couldn't load the request form"}</p><p className="mt-1 font-normal">{submitError}</p></div>}
    <SectionCard number="01" title="Your Information" description="How can we reach you about your repair?"><div className="grid gap-5 sm:grid-cols-2"><div><FieldLabel htmlFor="fullName">Full Name</FieldLabel><input id="fullName" value={values.fullName} onChange={(e) => updateValue("fullName", e.target.value)} className={inputClass(!!errors.fullName)} placeholder="Your full name" aria-invalid={!!errors.fullName} /><FieldError message={errors.fullName} /></div><div><FieldLabel htmlFor="mobile">Mobile Number</FieldLabel><input id="mobile" type="tel" value={values.mobile} onChange={(e) => updateValue("mobile", e.target.value)} className={inputClass(!!errors.mobile)} placeholder="(000) 000-0000" aria-invalid={!!errors.mobile} /><FieldError message={errors.mobile} /></div><div><FieldLabel htmlFor="email" optional>Email Address</FieldLabel><input id="email" type="email" value={values.email} onChange={(e) => updateValue("email", e.target.value)} className={inputClass(!!errors.email)} placeholder="you@example.com" aria-invalid={!!errors.email} /><FieldError message={errors.email} /></div><div className="sm:col-span-2"><ChoiceGroup name="preferredContact" value={values.preferredContact} onChange={(value) => updateValue("preferredContact", value)} options={["SMS", "Email", "Either"]} error={errors.preferredContact} legend="Preferred Contact Method" /></div></div></SectionCard>
    <SectionCard number="02" title="Your Device" description="A few details help us prepare for your request."><div className="grid gap-5 sm:grid-cols-2"><div><FieldLabel htmlFor="deviceType">Device Type</FieldLabel><div className="relative"><select id="deviceType" value={values.deviceType} onChange={(e) => updateValue("deviceType", e.target.value)} className={selectClass(!!errors.deviceType)} aria-invalid={!!errors.deviceType}><option value="">Select device type</option><option>Laptop</option><option>Desktop PC</option><option>Mac</option><option>Other</option></select><ChevronDown className="pointer-events-none absolute right-4 top-6 h-4 w-4 text-[#77736e]" /></div><FieldError message={errors.deviceType} /></div><div><FieldLabel htmlFor="brand">Brand</FieldLabel><input id="brand" value={values.brand} onChange={(e) => updateValue("brand", e.target.value)} className={inputClass(!!errors.brand)} placeholder="e.g. Dell, Apple, Lenovo" aria-invalid={!!errors.brand} /><FieldError message={errors.brand} /></div><div><FieldLabel htmlFor="model" optional>Model</FieldLabel><input id="model" value={values.model} onChange={(e) => updateValue("model", e.target.value)} className={inputClass()} placeholder="e.g. MacBook Pro 14-inch" /></div><div><FieldLabel htmlFor="serialNumber" optional>Serial Number</FieldLabel><input id="serialNumber" value={values.serialNumber} onChange={(e) => updateValue("serialNumber", e.target.value)} className={inputClass()} placeholder="If available" /></div></div></SectionCard>
    <SectionCard number="03" title="Repair Information" description="Tell us what is happening so we can understand how to help."><div><FieldLabel htmlFor="serviceNeeded">Service Needed</FieldLabel><div className="relative"><select id="serviceNeeded" value={values.serviceNeeded} onChange={(e) => updateValue("serviceNeeded", e.target.value)} className={selectClass(!!errors.serviceNeeded)} aria-invalid={!!errors.serviceNeeded} disabled={isLoadingServices || Boolean(serviceLoadError)}><option value="">{isLoadingServices ? "Loading services..." : serviceLoadError ? "Services unavailable" : "Select a service"}</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-6 h-4 w-4 text-[#77736e]" /></div><FieldError message={errors.serviceNeeded} /></div><div className="mt-5"><FieldLabel htmlFor="problem">Describe the Problem</FieldLabel><textarea id="problem" value={values.problem} onChange={(e) => updateValue("problem", e.target.value)} className={`mt-2 min-h-36 w-full resize-y rounded-xl border bg-[#fcfbf9] px-4 py-3.5 text-sm leading-6 text-[#252525] outline-none transition-colors placeholder:text-[#aaa59e] focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10 ${errors.problem ? "border-[#B4232C]" : "border-[#dedbd6]"}`} placeholder="Please describe what is happening with your device, when the problem started, and anything you have already tried." aria-invalid={!!errors.problem} /><FieldError message={errors.problem} /></div></SectionCard>
    <SectionCard number="04" title="Photos / Files" description="Helpful context is always welcome, but files are optional."><label htmlFor="files" onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-10 text-center transition-colors ${isDragging ? "border-[#B4232C] bg-[#fff0ef]" : "border-[#d9d4cd] bg-[#fcfbf9] hover:border-[#c9a3a1] hover:bg-[#fffaf8]"}`}><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff0ef] text-[#B4232C]"><Upload size={21} /></span><span className="mt-4 text-sm font-bold">Add Photos or Files <span className="font-normal text-[#9a9690]">(Optional)</span></span><span className="mt-2 max-w-sm text-sm leading-6 text-[#817c76]">Upload photos of the device or anything that may help us understand the problem.</span><span className="mt-4 rounded-full border border-[#dedbd6] bg-white px-4 py-2 text-xs font-bold text-[#5f5b57]">Choose files</span><span className="mt-3 text-xs text-[#aaa59e]">JPG, PNG, or PDF · Files are optional</span><input id="files" type="file" accept=".jpg,.jpeg,.png,.pdf" multiple className="sr-only" onChange={handleFileChange} /></label>{fileErrors.length > 0 && <ul className="mt-3 space-y-1 text-xs font-semibold text-[#B4232C]" role="alert">{fileErrors.map((error) => <li key={error}>{error}</li>)}</ul>}{files.length > 0 && <div className="mt-4 space-y-2">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-xl border border-[#e5e1db] bg-[#fcfbf9] px-4 py-3"><div className="flex min-w-0 items-center gap-3"><FileUp size={17} className="shrink-0 text-[#B4232C]" /><span className="truncate text-sm font-semibold">{file.name}</span></div><button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Remove ${file.name}`} className="rounded-lg p-1.5 text-[#9a9690] hover:bg-[#fff0ef] hover:text-[#B4232C]"><X size={16} /></button></div>)}</div>}</SectionCard>
    <section className="rounded-[1.5rem] border border-[#e5e1db] bg-white p-5 shadow-[0_14px_35px_rgba(37,37,37,0.04)] sm:p-8"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0ef] text-[#B4232C]"><MessageSquare size={19} /></span><div><h2 className="font-display text-xl font-bold tracking-[-0.04em] sm:text-2xl">How would you like us to contact you?</h2><p className="mt-1 text-sm leading-6 text-[#817c76]">Choose the best way for us to follow up.</p></div></div><div className="mt-6"><ChoiceGroup name="contactPreference" value={values.contactPreference} onChange={(value) => updateValue("contactPreference", value)} options={["SMS", "Email", "Phone Call"]} error={errors.contactPreference} legend="Preferred service contact" /></div></section>
    <div className="flex flex-col items-center gap-4 pt-3 text-center"><button type="submit" disabled={isSubmitting || isLoadingServices || Boolean(serviceLoadError)} className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#B4232C] px-7 py-4 text-sm font-bold text-white shadow-[0_14px_28px_rgba(180,35,44,0.2)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 sm:w-auto">{isSubmitting ? <><Loader2 size={17} className="animate-spin" />Submitting...</> : <>Submit Repair Request <ArrowRight size={17} /></>}</button><p className="flex max-w-lg items-start justify-center gap-2 text-xs leading-5 text-[#89847d]"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#B4232C]" />By submitting this request, you agree that FixPoint may contact you regarding your repair request.</p></div>
  </form></main></div>;
}
