"use client";

import { useState, useEffect } from "react";

const FULL_TEXT =
  "Your personal home inspector\nright at your fingertips.";
const TYPING_SPEED = 45;
const CURSOR_BLINK_SPEED = 530;

export default function TypingHeadline() {
  const [text, setText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    const type = () => {
      if (i < FULL_TEXT.length) {
        setText(FULL_TEXT.slice(0, i + 1));
        i++;
        setTimeout(type, TYPING_SPEED);
      }
    };
    type();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setShowCursor((s) => !s), CURSOR_BLINK_SPEED);
    return () => clearInterval(interval);
  }, []);

  return (
    <h1 className="relative whitespace-pre-line font-serif text-3xl font-medium leading-tight tracking-tight text-neutral-900 sm:text-4xl md:text-5xl lg:text-6xl">
      {/* Invisible placeholder reserves space so layout doesn't shift */}
      <span className="invisible" aria-hidden>
        {FULL_TEXT}
      </span>
      {/* Typing text overlaid in same position */}
      <span className="absolute left-0 right-0 top-0 text-center">
        {text}
        <span
          className={`inline-block w-0.5 align-middle transition-opacity ${
            showCursor ? "opacity-100" : "opacity-0"
          }`}
          style={{ height: "0.9em", backgroundColor: "currentColor", marginLeft: "2px" }}
          aria-hidden
        />
      </span>
    </h1>
  );
}
