"use client";

import { CheckCircle } from "lucide-react";

interface ProgressStepProps {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

function ProgressStep({ number, label, isActive, isCompleted }: ProgressStepProps) {
  return (
    <div className="flex flex-col gap-1 items-center">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300
          ${isActive ? "text-white shadow-lg scale-110 bg-primary shadow-primary/30" : ""}
          ${isCompleted ? "text-white bg-green-500" : ""}
          ${!isActive && !isCompleted ? "bg-gray-100 dark:bg-gray-800 text-gray-400" : ""}
        `}
      >
        {isCompleted ? (
          <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
        ) : (
          number
        )}
      </div>
      <span
        className={`text-xs transition-colors ${
          isActive ? "font-medium text-primary" : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

interface SignupProgressStepsProps {
  activeSection: "google" | "salon" | "owner";
}

export function SignupProgressSteps({ activeSection }: SignupProgressStepsProps) {
  return (
    <div className="flex gap-2 justify-center items-center mb-6">
      <ProgressStep
        number={1}
        label="Pronadji"
        isActive={activeSection === "google"}
        isCompleted={activeSection !== "google"}
      />
      <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />
      <ProgressStep
        number={2}
        label="Salon"
        isActive={activeSection === "salon"}
        isCompleted={activeSection === "owner"}
      />
      <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />
      <ProgressStep
        number={3}
        label="Nalog"
        isActive={activeSection === "owner"}
        isCompleted={false}
      />
    </div>
  );
}
