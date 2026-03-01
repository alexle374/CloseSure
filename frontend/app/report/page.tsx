"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import HomeIcon from "@/components/HomeIcon";

type NearbyInspector = {
  name: string;
  rating: number | null;
  distance_miles: number | null;
  address: string;
};

type ReportData = {
  status: string;
  summary: string;
  good_points: { text: string; detail?: string }[];
  bad_points: { text: string; detail?: string }[];
  questions_to_ask: string[];
  disclaimer?: string;
  nearby_inspectors?: NearbyInspector[];
  nearby_inspectors_note?: string | null;
};

function ReportContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get("address") ?? "";
  const yearBuilt = searchParams.get("year_built") ?? "0";
  const aduClaimed = searchParams.get("adu_claimed") === "true";

  const [hoveredGood, setHoveredGood] = useState<number | null>(null);
  const [hoveredBad, setHoveredBad] = useState<number | null>(null);
  const [inViewSections, setInViewSections] = useState<Set<string>>(new Set());
  const mainContentRef = useRef<HTMLDivElement>(null);

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setError("No address provided. Please go back and fill in the form.");
      setLoading(false);
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

    fetch(`${apiBase}/inspection-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_address: address,
        year_built: parseInt(yearBuilt, 10) || 0,
        adu_claimed: aduClaimed,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = (data.detail ?? data.message ?? `Server error: ${res.status}`).toString();
          throw new Error(msg);
        }
        return data;
      })
      .then((data: ReportData) => {
        if (data.status === "UNSUPPORTED_CITY") {
          setError("Sorry, this city is not supported yet. Only Los Angeles addresses are currently supported.");
        } else {
          const normalize = (pts: unknown[]) =>
            pts.map((p) => (typeof p === "string" ? { text: p } : p as { text: string; detail?: string }));
          setReport({
            ...data,
            good_points: normalize(data.good_points ?? []),
            bad_points: normalize(data.bad_points ?? []),
          });
        }
      })
      .catch((err: Error) => {
        setError(err.message || "Failed to generate report. Make sure the backend server is running.");
      })
      .finally(() => setLoading(false));
  }, [address, yearBuilt, aduClaimed]);

  useEffect(() => {
    const el = mainContentRef.current;
    if (!el || !report) return;
    const sections = el.querySelectorAll("[data-section]");
    const observer = new IntersectionObserver(
      (entries) => {
        setInViewSections((prev) => {
          const next = new Set(prev);
          entries.forEach((entry) => {
            const id = entry.target.getAttribute("data-section");
            if (id) {
              if (entry.isIntersecting) next.add(id);
              else next.delete(id);
            }
          });
          return next;
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => sections.forEach((s) => observer.unobserve(s));
  }, [report]);

  const inView = (id: string) => inViewSections.has(id);

  return (
    <div className="relative min-h-screen overflow-hidden app-flow-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 lg:px-12">
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-neutral-800"
        >
          <HomeIcon className="h-5 w-5" />
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

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">

        {/* Loading state */}
        {loading && (
          <div className="rounded-3xl border border-white/40 bg-white/60 p-12 shadow-[0_8px_48px_rgba(0,0,0,0.08)] backdrop-blur-xl text-center">
            <div className="mb-6 flex justify-center">
              <svg
                className="h-10 w-10 animate-spin text-[#7ba3c4]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-neutral-800">Generating your report…</h2>
            <p className="mt-2 text-neutral-500">Looking up permits and running AI analysis for</p>
            <p className="mt-1 font-medium text-neutral-700">{address}</p>
            <p className="mt-4 text-sm text-neutral-400">This usually takes 10–20 seconds.</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-3xl border border-red-200/60 bg-white/60 p-12 shadow-[0_8px_48px_rgba(0,0,0,0.08)] backdrop-blur-xl text-center">
            <div className="mb-4 flex justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500">
                <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </span>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-neutral-800">Something went wrong</h2>
            <p className="mt-3 text-neutral-600">{error}</p>
            <Link
              href="/address"
              className="glass-button glass-button-primary mt-8 inline-block px-8 py-3 text-sm font-medium"
            >
              Try Again
            </Link>
          </div>
        )}

        {/* Report */}
        {!loading && report && (
          <div ref={mainContentRef} className="rounded-3xl border border-white/40 bg-white/60 p-8 shadow-[0_8px_48px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-10 md:p-12">

            {/* Report Header */}
            <header className="mb-16">
              <h1 className="mb-5 font-serif text-4xl font-semibold leading-tight tracking-tight text-neutral-800 sm:text-5xl">
                Your Home Inspection Results Are Ready
              </h1>
              <div className="mb-5 flex items-center gap-2 text-neutral-700">
                <svg className="h-5 w-5 shrink-0 text-[#7ba3c4]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                </svg>
                <span className="text-base">{address}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                {yearBuilt !== "0" && (
                  <>
                    <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 backdrop-blur-sm">
                      <svg className="h-4 w-4 text-[#7ba3c4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Built {yearBuilt}
                    </span>
                    <span className="text-neutral-300">|</span>
                  </>
                )}
                {aduClaimed && (
                  <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 backdrop-blur-sm">
                    <svg className="h-4 w-4 text-[#7ba3c4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    ADU Claimed
                  </span>
                )}
              </div>
            </header>

            {/* AI Summary */}
            <section
              data-section="ai-summary"
              className={`mb-16 overflow-hidden rounded-2xl border border-white/40 bg-white/70 backdrop-blur-md transition-all duration-500 ease-out ${
                inView("ai-summary") ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <div
                className="h-1 w-full"
                style={{
                  background: "linear-gradient(90deg, #5a8ab0 0%, #7ba3c4 50%, #b8d4e8 100%)",
                }}
              />
              <div className="p-6 sm:p-8">
                <div className="mb-4 flex items-center gap-2">
                  <svg
                    className="h-5 w-5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <defs>
                      <linearGradient id="gemini-sparkle" x1="0" y1="12" x2="24" y2="12" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#5a8ab0" />
                        <stop offset="50%" stopColor="#7ba3c4" />
                        <stop offset="100%" stopColor="#b8d4e8" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M12 2L18 8L22 12L18 16L12 22L6 16L2 12L6 8Z"
                      fill="url(#gemini-sparkle)"
                    />
                  </svg>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-700">
                    AI Summary
                  </h2>
                </div>
                <p className="leading-relaxed text-neutral-700">{report.summary}</p>
              </div>
            </section>

            {/* Score Overview */}
            <section
              data-section="stats"
              className={`mb-16 grid grid-cols-1 gap-6 transition-all duration-500 ease-out sm:grid-cols-3 ${
                inView("stats") ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              {[
                {
                  count: report.good_points.length,
                  label: "Good Points",
                  iconBg: "bg-emerald-100",
                  iconColor: "text-emerald-600",
                  barColor: "bg-emerald-500",
                  icon: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />,
                  fill: true,
                },
                {
                  count: report.bad_points.length,
                  label: "Bad Points",
                  iconBg: "bg-red-100",
                  iconColor: "text-red-600",
                  barColor: "bg-red-500",
                  icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />,
                  fill: true,
                },
                {
                  count: report.questions_to_ask.length,
                  label: "Questions to Ask",
                  iconBg: "bg-sky-100",
                  iconColor: "text-sky-600",
                  barColor: "bg-sky-500",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  ),
                  fill: false,
                },
              ].map(({ count, label, iconBg, iconColor, barColor, icon, fill }) => (
                <div key={label} className="rounded-2xl border border-white/40 bg-white/70 p-6 backdrop-blur-md">
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
                    <svg className="h-6 w-6" fill={fill ? "currentColor" : "none"} stroke={fill ? undefined : "currentColor"} viewBox="0 0 24 24">
                      {icon}
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-neutral-900">{count}</p>
                  <p className="text-sm font-medium text-neutral-700">{label}</p>
                  <div className={`mt-3 h-0.5 w-12 rounded-full ${barColor}`} />
                </div>
              ))}
            </section>

            {/* Good Points */}
            <section
              data-section="good-points"
              className={`group/good mb-16 transition-all duration-500 ease-out ${
                inView("good-points") ? "in-view translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <h2 className="mb-8 flex items-center gap-3 text-xl font-bold text-neutral-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                </span>
                Good Points
              </h2>
              <ul className="space-y-5">
                {report.good_points.map((point, i) => (
                  <li
                    key={i}
                    onMouseEnter={() => setHoveredGood(i)}
                    onMouseLeave={() => setHoveredGood(null)}
                    className={`flex flex-col gap-0 rounded-2xl border border-emerald-200/60 bg-white/70 p-5 backdrop-blur-sm opacity-0 translate-y-2 transition-all duration-300 ease-out group-[.in-view]/good:opacity-100 group-[.in-view]/good:translate-y-0 ${
                      hoveredGood === i
                        ? "scale-[1.02] shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
                        : "shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                    }`}
                    style={{ transitionDelay: `${i * 75}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <p className="min-w-0 flex-1 text-neutral-700">{point.text}</p>
                    </div>
                    {point.detail && (
                      <div
                        className="grid transition-[max-height,opacity] duration-300 ease-out"
                        style={{
                          maxHeight: hoveredGood === i ? 200 : 0,
                          opacity: hoveredGood === i ? 1 : 0,
                          overflow: "hidden",
                        }}
                      >
                        <p className="mt-3 border-t border-emerald-200/40 pt-3 text-sm text-neutral-600">
                          {point.detail}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* Bad Points */}
            <section
              data-section="bad-points"
              className={`group/bad mb-16 transition-all duration-500 ease-out ${
                inView("bad-points") ? "in-view translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <h2 className="mb-8 flex items-center gap-3 text-xl font-bold text-neutral-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                </span>
                Bad Points
              </h2>
              <ul className="space-y-5">
                {report.bad_points.map((point, i) => (
                  <li
                    key={i}
                    onMouseEnter={() => setHoveredBad(i)}
                    onMouseLeave={() => setHoveredBad(null)}
                    className={`flex flex-col gap-0 rounded-2xl border border-red-200/60 bg-white/70 p-5 backdrop-blur-sm opacity-0 translate-y-2 transition-all duration-300 ease-out group-[.in-view]/bad:opacity-100 group-[.in-view]/bad:translate-y-0 ${
                      hoveredBad === i
                        ? "scale-[1.02] shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
                        : "shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                    }`}
                    style={{ transitionDelay: `${i * 75}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <p className="min-w-0 flex-1 text-neutral-700">{point.text}</p>
                    </div>
                    {point.detail && (
                      <div
                        className="grid transition-[max-height,opacity] duration-300 ease-out"
                        style={{
                          maxHeight: hoveredBad === i ? 200 : 0,
                          opacity: hoveredBad === i ? 1 : 0,
                          overflow: "hidden",
                        }}
                      >
                        <p className="mt-3 border-t border-red-200/40 pt-3 text-sm text-neutral-600">
                          {point.detail}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* Questions to Ask */}
            <section
              data-section="questions"
              className={`group/questions mb-16 transition-all duration-500 ease-out ${
                inView("questions") ? "in-view translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <h2 className="mb-8 flex items-center gap-3 text-xl font-bold text-neutral-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </span>
                Questions to Ask Your Agent
              </h2>
              <ul className="space-y-5">
                {report.questions_to_ask.map((question, i) => (
                  <li
                    key={i}
                    className="cursor-pointer rounded-2xl border border-sky-200/60 bg-white/70 p-5 backdrop-blur-sm opacity-0 translate-y-2 transition-all duration-300 ease-out group-[.in-view]/questions:opacity-100 group-[.in-view]/questions:translate-y-0 hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
                    style={{ transitionDelay: `${i * 75}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <p className="flex-1 text-neutral-700">{question}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Nearby Inspection Companies */}
            {((report.nearby_inspectors && report.nearby_inspectors.length > 0) || report.nearby_inspectors_note) && (
              <section
                data-section="nearby"
                className={`group/nearby mb-16 transition-all duration-500 ease-out ${
                  inView("nearby") ? "in-view translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
              >
                <h2 className="mb-8 flex items-center gap-3 text-xl font-bold text-neutral-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  Nearby Home Inspectors
                </h2>

                {report.nearby_inspectors_note && !report.nearby_inspectors?.length && (
                  <p className="text-sm text-neutral-500 italic">{report.nearby_inspectors_note}</p>
                )}

                {report.nearby_inspectors && report.nearby_inspectors.length > 0 && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {report.nearby_inspectors.map((inspector, i) => (
                      <div
                        key={i}
                        className="flex flex-col rounded-2xl border border-white/40 bg-white/70 p-6 backdrop-blur-md opacity-0 translate-y-2 transition-all duration-300 ease-out group-[.in-view]/nearby:opacity-100 group-[.in-view]/nearby:translate-y-0 hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
                        style={{ transitionDelay: `${i * 75}ms` }}
                      >
                        <h3 className="mb-3 font-bold text-neutral-900 leading-snug">{inspector.name}</h3>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          {inspector.rating != null && (
                            <span className="flex items-center gap-1 text-sm text-neutral-600">
                              <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              {inspector.rating.toFixed(1)}
                            </span>
                          )}
                          {inspector.distance_miles != null && (
                            <span className="flex items-center gap-1 text-sm text-neutral-600">
                              <svg className="h-4 w-4 text-[#7ba3c4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              {inspector.distance_miles} mi away
                            </span>
                          )}
                        </div>
                        {inspector.address && (
                          <p className="mb-4 text-xs text-neutral-500 leading-relaxed">{inspector.address}</p>
                        )}
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(inspector.name + " home inspector")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-button mt-auto w-full px-5 py-2.5 text-sm font-medium text-center"
                        >
                          Search on Google
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Action Buttons */}
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent("home inspectors near " + address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-medium"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find More Inspectors
              </a>
              <Link
                href="/address"
                className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/20 bg-white/60 px-8 py-3.5 text-sm font-medium text-[#5a8ab0] backdrop-blur-md transition-all duration-300 ease-in-out hover:bg-white/80"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Inspect Another Home
              </Link>
            </div>

            {/* Disclaimer */}
            <footer className="flex items-start gap-3 text-sm text-neutral-500">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <p>
                {report.disclaimer ||
                  "This report is for informational purposes only and does not replace a professional home inspection. Always consult a licensed inspector before making purchasing decisions."}
              </p>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense>
      <ReportContent />
    </Suspense>
  );
}
