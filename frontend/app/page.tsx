"use client";

import { useState } from "react";
import Link from "next/link";
import TypingHeadline from "@/components/TypingHeadline";
import HomeIcon from "@/components/HomeIcon";

export default function Home() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2); // -1..1
        const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2); // -1..1
        setMouse({ x, y });
      }}
      onMouseLeave={() => setMouse({ x: 0, y: 0 })}
    >
      {/* Background image (base layer, moves less) */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-200 ease-out will-change-transform"
        style={{
          backgroundImage: "url(/landingbkg.png)",
          transform: `translate3d(${mouse.x * 8}px, ${mouse.y * 8}px, 0) scale(1.03)`,
        }}
      />

      {/* Extra depth glow layer (moves more) */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] transition-transform duration-200 ease-out will-change-transform"
        style={{
          transform: `translate3d(${mouse.x * 16}px, ${mouse.y * 16}px, 0)`,
          background:
            "radial-gradient(circle at 30% 30%, rgba(122,170,206,0.22), transparent 45%), radial-gradient(circle at 75% 70%, rgba(93,149,189,0.18), transparent 45%)",
        }}
        aria-hidden
      />

      {/* Overlay for text readability */}
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
<<<<<<< HEAD
        <div className="flex items-baseline gap-4">
          <Link
            href="/about"
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900"
          >
            About
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900"
          >
            Login
=======
        <div className="flex items-center gap-2">
          <Link href="" className="glass-button px-4 py-1 text-sm font-medium">
            Log in
          </Link>
          <Link href="" className="glass-button px-4 py-1 text-sm font-medium">
            Sign in
>>>>>>> 0c9a699d5b663ff32224b99b9fc280ada1b0290d
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-[18vh] pt-[8vh] text-center">
        <TypingHeadline />
        <p className="mt-4 max-w-xl font-sans text-base text-neutral-600 sm:text-lg">
          AI-powered home risk analysis for homeowners.
        </p>
        <Link
          href="/address"
          className="glass-button glass-button-primary mt-6 px-6 py-1.5 text-base font-medium"
        >
          Start your inspection
        </Link>
      </main>
    </div>
  );
}
