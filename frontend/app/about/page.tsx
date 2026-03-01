"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import HomeIcon from "@/components/HomeIcon";

const PERSPECTIVE = 1200;
const ANIM_DURATION = 700;
const STAGGER = 120;

const FOUNDERS = [
  { name: "Alex Le", linkedin: "https://www.linkedin.com/in/alexml23/" },
  { name: "Angelina Ly", linkedin: "https://www.linkedin.com/in/angelinawly/" },
  { name: "Conner Ng", linkedin: "https://www.linkedin.com/in/ngconnor/" },
  { name: "Christian Raya", linkedin: "https://www.linkedin.com/in/christianraya/" },
];

function useScrollVisibility(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.intersectionRatio >= threshold),
      { threshold, rootMargin: "-20px 0px -20px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function ScrollSection({
  children,
  className = "",
  threshold = 0.12,
}: {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}) {
  const { ref, visible } = useScrollVisibility(threshold);
  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-24px)",
      }}
    >
      {children}
    </div>
  );
}

export default function AboutPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/landingbkg.png)" }}
      />
      <div
        className="fixed inset-0 z-[1] bg-gradient-to-b from-white/75 via-white/40 to-white/60"
        aria-hidden
      />

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

      {/* Scrollable content */}
      <main
        className="relative z-10 mx-auto max-w-2xl px-6 pb-32 pt-32"
        style={{
          perspective: PERSPECTIVE,
          perspectiveOrigin: "50% 20%",
          opacity: ready ? 1 : 0,
          transition: "opacity 0.5s ease-out",
        }}
      >
        <h1
          className="font-serif text-3xl font-medium tracking-tight text-neutral-900 sm:text-4xl"
          style={{
            transform: ready
              ? "translateZ(0) rotateX(0deg)"
              : "translateZ(-120px) rotateX(18deg)",
            opacity: ready ? 1 : 0,
            transition: `transform ${ANIM_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${ANIM_DURATION}ms ease-out`,
            transformStyle: "preserve-3d",
          }}
        >
          About Inspector AI
        </h1>

        <ScrollSection>
          <p className="mt-6 font-sans text-base leading-relaxed text-neutral-600 sm:text-lg">
            Buying or owning a home comes with responsibility. Inspections are
            essential, but they can be costly, confusing, and sometimes intimidating,
            especially if you&apos;re a first-time buyer or a homeowner trying to stay on
            top of maintenance. That&apos;s where we come in. Our platform uses AI to give
            you a clear, easy-to-understand overview of a property&apos;s strengths,
            potential issues, and areas that may need closer attention. By combining
            property details, construction age, and public records, we help you spot
            risks, ask the right questions, and make smarter choices before investing
            in an inspection or before spending money on repairs.
          </p>
        </ScrollSection>
        <ScrollSection>
          <p className="mt-4 font-sans text-base leading-relaxed text-neutral-600 sm:text-lg">
            Whether you&apos;re searching for your next home or checking your own property,
            our tool acts as a virtual guide, flagging likely maintenance issues,
            permit concerns, and additional units such as ADUs or converted spaces.
            It&apos;s not here to replace a professional inspection, but to empower you
            with knowledge, save you time, and help you feel confident in your
            decisions. Think of it as your personal home advisor, always ready to
            help you understand what&apos;s really going on behind the walls.
          </p>
        </ScrollSection>

        {/* Founders */}
        <ScrollSection threshold={0.08}>
          <h2 className="mt-16 font-serif text-2xl font-medium tracking-tight text-neutral-900 sm:text-3xl">
            Founders
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {FOUNDERS.map((f) => (
              <ScrollSection key={f.name} threshold={0.1}>
                <a
                  href={f.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center rounded-2xl border border-neutral-200/80 bg-white/60 p-6 backdrop-blur-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:border-neutral-300 hover:bg-white/80 hover:shadow-lg hover:shadow-neutral-200/50"
                >
                  <div
                    className="h-24 w-24 shrink-0 rounded-full bg-neutral-200/90 object-cover"
                    aria-hidden
                  />
                  <p className="mt-4 font-sans font-medium text-neutral-900 group-hover:text-neutral-700">
                    {f.name}
                  </p>
                  <span className="mt-2 text-sm text-neutral-500 underline decoration-neutral-300 underline-offset-2 transition-colors group-hover:text-blue-600 group-hover:decoration-blue-400">
                    LinkedIn
                  </span>
                </a>
              </ScrollSection>
            ))}
          </div>
        </ScrollSection>

        {/* Future */}
        <ScrollSection threshold={0.08}>
          <h2 className="mt-16 font-serif text-2xl font-medium tracking-tight text-neutral-900 sm:text-3xl">
            What&apos;s next?
          </h2>
          <p className="mt-4 font-sans text-base leading-relaxed text-neutral-600 sm:text-lg">
            We&apos;re looking forward to bringing our platform to more cities, helping
            buyers and homeowners everywhere make smarter decisions about their
            properties. As we grow, we plan to expand our database, integrate more
            local permit and property records, and connect users with trusted
            inspection services nationwide. Our goal is to make reliable home
            insights accessible wherever you live, so everyone can buy, maintain, and
            enjoy their home with confidence.
          </p>
        </ScrollSection>
      </main>
    </div>
  );
}
