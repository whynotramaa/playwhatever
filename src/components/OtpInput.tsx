"use client";

import React, { useEffect, useRef, useState } from "react";

export type OtpStatus = "idle" | "verifying" | "error" | "success";

/**
 * One real text input sitting invisibly over N presentation boxes.
 *
 * Six separate inputs is the usual approach and it is the wrong one: it costs
 * a pile of focus-shuffling code and it breaks paste, iOS/Android SMS
 * autofill, and screen readers. A single input with autoComplete
 * "one-time-code" gets all of that from the platform, and the boxes become
 * pure decoration that is free to animate.
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  status = "idle",
  disabled = false,
  label = "Verification code",
}: {
  length?: number;
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  status?: OtpStatus;
  disabled?: boolean;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const completed = useRef<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (value.length === length && completed.current !== value) {
      completed.current = value;
      onComplete?.(value);
    }
    if (value.length < length) {
      completed.current = null;
    }
  }, [value, length, onComplete]);

  // Keep the caret pinned to the end so typing always appends, even if a
  // browser drops the cursor somewhere else in the invisible field.
  const pinCaret = () => {
    const el = inputRef.current;
    if (el) el.setSelectionRange(el.value.length, el.value.length);
  };

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <div className="otp" data-status={status} data-focused={focused || undefined}>
      <input
        ref={inputRef}
        className="otp-capture"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        onFocus={() => {
          setFocused(true);
          pinCaret();
        }}
        onBlur={() => setFocused(false)}
        onSelect={pinCaret}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="one-time-code"
        // pattern + numeric inputMode gives the digit keypad without the
        // spinner and scroll-wheel problems of type="number".
        pattern="[0-9]*"
        maxLength={length}
        aria-label={label}
      />

      {digits.map((digit, i) => (
        <div
          key={i}
          className="otp-box"
          style={{ "--i": i } as React.CSSProperties}
          data-filled={digit ? "" : undefined}
          data-active={focused && !digit && i === activeIndex ? "" : undefined}
          aria-hidden="true"
        >
          {digit && <span key={`${i}-${digit}`} className="otp-digit">{digit}</span>}
        </div>
      ))}
    </div>
  );
}
