"use client";

import { forwardRef, useId } from "react";
import { OTPInput, REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTPSlot } from "@/components/ui/input-otp";

interface VerificationCodeInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

// One real input retains the iOS keyboard/caret instead of moving focus between
// six inputs. The slots are visual only; input-otp handles selection and editing.
export const VerificationCodeInput = forwardRef<HTMLInputElement, VerificationCodeInputProps>(
  function VerificationCodeInput({ value, onChange }, ref) {
    const id = useId();

    return (
      <div>
        <label htmlFor={id} className="mb-3 block text-center text-sm font-medium text-gray-700">
          Enter Verification Code
        </label>
        <OTPInput
          ref={ref}
          id={id}
          name="verificationCode"
          maxLength={6}
          value={value.join("")}
          onChange={(code) => onChange(Array.from({ length: 6 }, (_, index) => code[index] ?? ""))}
          inputMode="numeric"
          pattern={REGEXP_ONLY_DIGITS}
          autoComplete="one-time-code"
          spellCheck={false}
          pasteTransformer={(text) => text.replace(/\D/g, "")}
          // Safari zooms focused fields below 16px. Set the real input, not just
          // the visible slots, and keep normal pinch-to-zoom available.
          style={{ fontSize: "20px" }}
          containerClassName="relative mx-auto flex w-full max-w-[20rem] items-center"
        >
          <div className="pointer-events-none flex w-full gap-2" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="h-12 min-w-0 flex-1 rounded-lg border-2 border-gray-200 text-xl font-bold first:rounded-lg last:rounded-lg  data-[active=true]:ring-2 data-[active=true]:ring-teal-500 data-[active=true]:border-teal-500"
              />
            ))}
          </div>
        </OTPInput>
      </div>
    );
  },
);