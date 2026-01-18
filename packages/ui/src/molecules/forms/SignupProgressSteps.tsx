"use client";

interface ProgressStepProps {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

function ProgressStep({ number, label, isActive, isCompleted }: ProgressStepProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300
          ${isActive ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110" : ""}
          ${isCompleted ? "bg-green-500 text-white" : ""}
          ${!isActive && !isCompleted ? "bg-gray-100 dark:bg-gray-800 text-gray-400" : ""}
        `}
      >
        {isCompleted ? (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            role="img"
            aria-label="Zavrseno"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          number
        )}
      </div>
      <span
        className={`text-xs transition-colors ${
          isActive ? "text-primary font-medium" : "text-gray-400"
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
    <div className="flex items-center justify-center gap-2 mb-6">
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
