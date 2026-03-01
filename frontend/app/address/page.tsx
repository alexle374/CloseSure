"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ADU_TYPES = [
  { id: "garage_conversion", label: "Garage conversion" },
  { id: "guest_house", label: "Guest house / casita" },
  { id: "basement_unit", label: "Basement unit" },
  { id: "above_garage", label: "Unit above garage" },
  { id: "backyard_cottage", label: "Backyard cottage" },
  { id: "junior_adu", label: "Junior ADU (JADU)" },
  { id: "other", label: "Other" },
];

export default function AddressPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [form, setForm] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    yearBuilt: "",
    hasAdu: false,
    additionalUnits: "" as "yes" | "no" | "",
    aduTypes: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleAduType(id: string) {
    setForm((f) => ({
      ...f,
      aduTypes: f.aduTypes.includes(id)
        ? f.aduTypes.filter((t) => t !== id)
        : [...f.aduTypes, id],
    }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.street.trim()) e.street = "Street address is required.";
    if (!form.city.trim()) e.city = "City is required.";
    if (!form.state.trim()) e.state = "State is required.";
    if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) e.zip = "Enter a valid ZIP code.";
    if (!form.yearBuilt.trim()) e.yearBuilt = "Year built is required.";
    if (form.yearBuilt && !/^\d{4}$/.test(form.yearBuilt.trim()))
      e.yearBuilt = "Enter a 4-digit year.";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const fullAddress = `${form.street}, ${form.city}, ${form.state} ${form.zip}`.trim();
    const params = new URLSearchParams({
      address: fullAddress,
      year_built: form.yearBuilt || "0",
      adu_claimed: form.hasAdu ? "true" : "false",
    });
    router.push(`/report?${params.toString()}`);
  }

  return (
    <div className={`relative min-h-screen overflow-hidden bg-white ${mounted ? "page-bg-shimmer" : ""}`}>
      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 lg:px-12 ${mounted ? "page-enter" : "opacity-0"}`}>
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-neutral-800"
        >
          <img src="/logo.png" alt="CloseSure logo" className="h-5 w-5" />
          CloseSure
        </Link>
        <div className="flex items-baseline gap-4">
          <Link
            href="/about"
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900"
          >
            About
          </Link>
          <Link
            href=""
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Main */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pb-16 pt-28 sm:px-6">
        <div className="w-full max-w-2xl">
          {/* Heading */}
          <div className={`mb-8 text-center ${mounted ? "page-enter-delay-1" : "opacity-0"}`}>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
              Tell us about your home
            </h1>
            <p className="mt-3 font-sans text-base text-neutral-700">
              Enter your property details and we'll generate an AI-powered inspection report.
            </p>
          </div>

          {/* Form card */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className={`rounded-3xl border border-[#a8c8e0]/60 bg-white/80 p-8 shadow-[0_8px_48px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:p-10 ${mounted ? "page-enter-delay-2" : "opacity-0"}`}
          >
            {/* ── Address ── */}
            <fieldset className="mb-8">
              <legend className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-600">
                <span className="h-px flex-1 bg-neutral-300" />
                <span>Property Address</span>
                <span className="h-px flex-1 bg-neutral-300" />
              </legend>

              <div className="space-y-4">
                {/* Street */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="street">
                    Street address
                  </label>
                  <input
                    id="street"
                    type="text"
                    placeholder="742 Evergreen Terrace"
                    value={form.street}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, street: e.target.value }));
                      setErrors((er) => ({ ...er, street: "" }));
                    }}
                    className="w-full rounded-2xl border border-neutral-300 bg-white/90 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 backdrop-blur-sm outline-none transition focus:border-[#5a8fb8] focus:ring-2 focus:ring-[#5a8fb8]/25"
                  />
                  {errors.street && <p className="mt-1.5 text-xs text-red-500">{errors.street}</p>}
                </div>

                {/* City + State */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="city">
                      City
                    </label>
                    <input
                      id="city"
                      type="text"
                      placeholder="Los Angeles"
                      value={form.city}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, city: e.target.value }));
                        setErrors((er) => ({ ...er, city: "" }));
                      }}
                      className="w-full rounded-2xl border border-neutral-300 bg-white/90 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 backdrop-blur-sm outline-none transition focus:border-[#5a8fb8] focus:ring-2 focus:ring-[#5a8fb8]/25"
                    />
                    {errors.city && <p className="mt-1.5 text-xs text-red-500">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="state">
                      State
                    </label>
                    <input
                      id="state"
                      type="text"
                      placeholder="CA"
                      maxLength={2}
                      value={form.state}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }));
                        setErrors((er) => ({ ...er, state: "" }));
                      }}
                      className="w-full rounded-2xl border border-neutral-300 bg-white/90 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 backdrop-blur-sm outline-none transition focus:border-[#5a8fb8] focus:ring-2 focus:ring-[#5a8fb8]/25"
                    />
                    {errors.state && <p className="mt-1.5 text-xs text-red-500">{errors.state}</p>}
                  </div>
                </div>

                {/* ZIP */}
                <div className="max-w-[180px]">
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="zip">
                    ZIP code
                  </label>
                  <input
                    id="zip"
                    type="text"
                    inputMode="numeric"
                    placeholder="90012"
                    maxLength={10}
                    value={form.zip}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, zip: e.target.value }));
                      setErrors((er) => ({ ...er, zip: "" }));
                    }}
                    className="w-full rounded-2xl border border-neutral-300 bg-white/90 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 backdrop-blur-sm outline-none transition focus:border-[#5a8fb8] focus:ring-2 focus:ring-[#5a8fb8]/25"
                  />
                  {errors.zip && <p className="mt-1.5 text-xs text-red-500">{errors.zip}</p>}
                </div>
              </div>
            </fieldset>

            {/* ── Year Built ── */}
            <fieldset className="mb-8">
              <legend className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-600">
                <span className="h-px flex-1 bg-neutral-300" />
                <span>Property Details</span>
                <span className="h-px flex-1 bg-neutral-300" />
              </legend>

              <div className="max-w-[180px]">
                <label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="yearBuilt">
                  Year built
                </label>
                <input
                  id="yearBuilt"
                  type="text"
                  inputMode="numeric"
                  placeholder="1949"
                  maxLength={4}
                  value={form.yearBuilt}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, yearBuilt: e.target.value }));
                    setErrors((er) => ({ ...er, yearBuilt: "" }));
                  }}
                  className="w-full rounded-2xl border border-neutral-300 bg-white/90 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 backdrop-blur-sm outline-none transition focus:border-[#5a8fb8] focus:ring-2 focus:ring-[#5a8fb8]/25"
                />
                {errors.yearBuilt && <p className="mt-1.5 text-xs text-red-500">{errors.yearBuilt}</p>}
              </div>
            </fieldset>

            {/* ── ADU ── */}
            <fieldset className="mb-8">
              <legend className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-600">
                <span className="h-px flex-1 bg-neutral-300" />
                <span>Additional Units</span>
                <span className="h-px flex-1 bg-neutral-300" />
              </legend>

              {/* Has ADU toggle */}
              <label className="mb-5 flex cursor-pointer items-start gap-3">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={form.hasAdu}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        hasAdu: e.target.checked,
                        additionalUnits: e.target.checked ? f.additionalUnits : "",
                        aduTypes: e.target.checked ? f.aduTypes : [],
                      }))
                    }
                  />
                  <div className="h-5 w-5 rounded-md border-2 border-neutral-400 bg-white transition peer-checked:border-[#4a82ae] peer-checked:bg-[#4a82ae]" />
                  <svg
                    className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-white opacity-0 transition peer-checked:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">This property has an ADU</p>
                  <p className="text-xs text-neutral-600">Accessory Dwelling Unit — a secondary housing unit on the same lot</p>
                </div>
              </label>

              {form.hasAdu && (
                <div className="space-y-5 rounded-2xl border border-[#8ab8d8]/60 bg-white/70 p-5 backdrop-blur-sm shadow-sm">
                  {/* ADU type checkboxes */}
                  <div>
                    <p className="mb-3 text-sm font-medium text-neutral-700">
                      What type of ADU? <span className="font-normal text-neutral-500">(select all that apply)</span>
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {ADU_TYPES.map(({ id, label }) => (
                        <label key={id} className="flex cursor-pointer items-center gap-3">
                          <div className="relative shrink-0">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={form.aduTypes.includes(id)}
                              onChange={() => toggleAduType(id)}
                            />
                            <div className="h-5 w-5 rounded-md border-2 border-neutral-400 bg-white transition peer-checked:border-[#4a82ae] peer-checked:bg-[#4a82ae]" />
                            <svg
                              className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-white opacity-0 transition peer-checked:opacity-100"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-neutral-800">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </fieldset>

            {/* ── Submit ── */}
            <button
              type="submit"
              className="glass-button glass-button-primary w-full py-3.5 text-base font-semibold"
            >
              Generate AI Inspection Report →
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
