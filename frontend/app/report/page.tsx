"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import HomeIcon from "@/components/HomeIcon";

const REPORT_DATA = {
  status: "OK",
  summary:
    "This 1949 home has undergone several permitted updates, including structural, roofing, and some plumbing/electrical work, primarily between 2014 and 2019.",
  good_points: [
    {
      text: "Foundation/cripple wall reinforcement permitted on 2014-08-29 suggests structural improvements.",
      detail: "Permit records show approved structural work; recommend verifying scope with seller and any engineer reports.",
    },
    {
      text: "A re-roof permit from 2014-08-21 indicates a newer roof system was installed.",
      detail: "Roof permit suggests full or partial replacement; confirm remaining life and underlayment with a licensed roofer.",
    },
    {
      text: "Interior bathroom remodel/repair permitted on 2014-08-26 suggests updated finishes.",
      detail: "Bathroom updates may include fixtures and waterproofing; check for current code compliance and moisture issues.",
    },
    {
      text: "Recent plumbing work permitted on 2019-10-31 and 2014-12-18 could mean some updated piping.",
      detail: "Plumbing permits indicate targeted updates; original supply/drain lines may remain elsewhere in the home.",
    },
    {
      text: "Electrical permits from 2015-01-20 and 2014-12-18 suggest some system upgrades.",
      detail: "Electrical permits suggest panel or circuit updates; full rewire not guaranteed—have an electrician assess.",
    },
  ],
  bad_points: [
    {
      text: "Original plumbing (based on age) may still be present in some areas, potentially lead or galvanized.",
      detail: "Request a sewer scope and plumbing inspection to identify material, condition, and any polybutylene or lead.",
    },
    {
      text: "Original electrical wiring (based on age) could exist, possibly knob-and-tube or ungrounded circuits.",
      detail: "Have an electrician assess for knob-and-tube, aluminum, or ungrounded circuits and capacity for modern loads.",
    },
    {
      text: "HVAC system (based on age) may be original or outdated, requiring inspection for efficiency and safety.",
      detail: "Get HVAC age and service history; consider efficiency, duct condition, and replacement cost in your budget.",
    },
    {
      text: "Sewer lines (based on age) could be cast iron or clay, prone to root intrusion or collapse.",
      detail: "Sewer scope strongly recommended; cast iron and clay are common in older homes and can fail without warning.",
    },
    {
      text: "The ADU claim for a detached garage should be verified for proper permitting and habitability.",
      detail: "Confirm ADU permits and current code compliance with the city before relying on rental or accessory income.",
    },
  ],
  questions_to_ask: [
    "Can you provide details of the scope of the 2014 structural and roofing work?",
    "What specific plumbing components were updated with the 2019 and 2014 permits?",
    "Are there any records of the last full electrical system upgrade beyond the 2014/2015 permits?",
    "What is the age and service history of the HVAC system and water heater?",
    "Is the detached garage ADU fully permitted and up to current code for occupancy?",
  ],
};

const NEARBY_INSPECTORS = [
  { name: "ABC Home Inspections", phone: "(555) 123-4567", rating: "4.5" },
  { name: "SoCal Inspect Pro", phone: "(555) 987-6543", rating: "4.5" },
];

const GOOD_POINT_CATEGORIES = [
  "STRUCTURAL",
  "ROOFING",
  "INTERIOR",
  "PLUMBING",
  "ELECTRICAL",
];

const BAD_POINT_CATEGORIES = [
  "PLUMBING",
  "ELECTRICAL",
  "HVAC",
  "SEWER",
  "PERMIT",
];

export default function ReportPage() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hoveredGood, setHoveredGood] = useState<number | null>(null);
  const [hoveredBad, setHoveredBad] = useState<number | null>(null);
  const [inViewSections, setInViewSections] = useState<Set<string>>(new Set());
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mainContentRef.current;
    if (!el) return;
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
  }, []);

  const inView = (id: string) => inViewSections.has(id);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        setMouse({ x, y });
      }}
      onMouseLeave={() => setMouse({ x: 0, y: 0 })}
    >
      {/* Background image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-200 ease-out will-change-transform"
        style={{
          backgroundImage: "url(/landingbkg.png)",
          transform: `translate3d(${mouse.x * 8}px, ${mouse.y * 8}px, 0) scale(1.03)`,
        }}
      />

      {/* Depth glow layer */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] transition-transform duration-200 ease-out will-change-transform"
        style={{
          transform: `translate3d(${mouse.x * 16}px, ${mouse.y * 16}px, 0)`,
          background:
            "radial-gradient(circle at 30% 30%, rgba(122,170,206,0.22), transparent 45%), radial-gradient(circle at 75% 70%, rgba(93,149,189,0.18), transparent 45%)",
        }}
        aria-hidden
      />

      {/* Overlay for readability */}
      <div
        className="fixed inset-0 z-[2] bg-gradient-to-b from-white/75 via-white/35 to-transparent"
        aria-hidden
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 lg:px-12">
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-neutral-800"
        >
          <HomeIcon className="h-5 w-5" />
          Inspector AI
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="glass-button px-4 py-1 text-sm font-medium">
            Log in
          </Link>
          <Link href="/address" className="glass-button px-4 py-1 text-sm font-medium">
            New Inspection
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        {/* Glassmorphism card wrapping all report content */}
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
              <span className="text-base">742 Evergreen Terrace, Los Angeles, CA 90012</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
              <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 backdrop-blur-sm">
                <svg className="h-4 w-4 text-[#7ba3c4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Built 1949
              </span>
              <span className="text-neutral-300">|</span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 backdrop-blur-sm">
                <svg className="h-4 w-4 text-[#7ba3c4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Permits: 2014–2019
              </span>
              <span className="text-neutral-300">|</span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 backdrop-blur-sm">
                <svg className="h-4 w-4 text-[#7ba3c4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                ADU Claimed
              </span>
            </div>
          </header>

          {/* AI Summary */}
          <section
            data-section="ai-summary"
            className={`mb-16 overflow-hidden rounded-2xl border border-white/40 bg-white/70 backdrop-blur-md transition-all duration-500 ease-out ${
              inView("ai-summary") ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            {/* Same gradient as Gemini icon for consistent branding */}
            <div
              className="h-1 w-full"
              style={{
                background: "linear-gradient(90deg, #5a8ab0 0%, #7ba3c4 50%, #b8d4e8 100%)",
              }}
            />
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                {/* Gemini-style four-point sparkle, same gradient as bar */}
                <svg
                  className="h-5 w-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <defs>
                    {/* Matches bar gradient: 90deg #5a8ab0 → #7ba3c4 → #b8d4e8 */}
                    <linearGradient id="gemini-sparkle" x1="0" y1="12" x2="24" y2="12" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#5a8ab0" />
                      <stop offset="50%" stopColor="#7ba3c4" />
                      <stop offset="100%" stopColor="#b8d4e8" />
                    </linearGradient>
                  </defs>
                  {/* Four-point star sparkle (Gemini AI icon shape) */}
                  <path
                    d="M12 2L18 8L22 12L18 16L12 22L6 16L2 12L6 8Z"
                    fill="url(#gemini-sparkle)"
                  />
                </svg>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-700">
                  AI Summary
                </h2>
              </div>
              <p className="leading-relaxed text-neutral-700">{REPORT_DATA.summary}</p>
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
                count: REPORT_DATA.good_points.length,
                label: "Good Points",
                iconBg: "bg-emerald-100",
                iconColor: "text-emerald-600",
                barColor: "bg-emerald-500",
                icon: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />,
                fill: true,
              },
              {
                count: REPORT_DATA.bad_points.length,
                label: "Bad Points",
                iconBg: "bg-red-100",
                iconColor: "text-red-600",
                barColor: "bg-red-500",
                icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />,
                fill: true,
              },
              {
                count: REPORT_DATA.questions_to_ask.length,
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
              {REPORT_DATA.good_points.map((point, i) => (
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
                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all duration-200 hover:scale-105 hover:brightness-110">
                      {GOOD_POINT_CATEGORIES[i]}
                    </span>
                  </div>
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
              {REPORT_DATA.bad_points.map((point, i) => (
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
                    <span className="shrink-0 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition-all duration-200 hover:scale-105 hover:brightness-110">
                      {BAD_POINT_CATEGORIES[i]}
                    </span>
                  </div>
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
              {REPORT_DATA.questions_to_ask.map((question, i) => (
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
                    {i === 0 && (
                      <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                        {REPORT_DATA.questions_to_ask.length} questions
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Nearby Inspection Companies */}
          <section
            data-section="nearby"
            className={`group/nearby mb-16 transition-all duration-500 ease-out ${
              inView("nearby") ? "in-view translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            <h2 className="mb-8 flex items-center gap-3 text-xl font-bold text-neutral-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              Nearby Inspection Companies
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {NEARBY_INSPECTORS.map((company, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/40 bg-white/70 p-6 backdrop-blur-md opacity-0 translate-y-2 transition-all duration-300 ease-out group-[.in-view]/nearby:opacity-100 group-[.in-view]/nearby:translate-y-0 hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
                  style={{ transitionDelay: `${i * 75}ms` }}
                >
                  <h3 className="mb-2 font-bold text-neutral-900">{company.name}</h3>
                  <p className="mb-2 text-sm text-neutral-600">{company.phone}</p>
                  <p className="mb-5 flex items-center gap-1.5 text-sm text-neutral-600">
                    <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {company.rating} rating
                  </p>
                  <button
                    type="button"
                    className="glass-button w-full px-5 py-2.5 text-sm font-medium"
                  >
                    Contact Company
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Action Buttons */}
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <button
              type="button"
              className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-medium"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find More Inspectors
            </button>
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
              This report is for informational purposes only and does not replace a professional home inspection. Always consult a licensed inspector before making purchasing decisions.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
