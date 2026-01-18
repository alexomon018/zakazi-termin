"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";

export function SignupHeader() {
  return (
    <div className="text-center mb-8 animate-fade-in">
      <Link
        href="/"
        className="inline-flex items-center gap-2 mb-3 transition-transform hover:scale-105"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <span
          data-testid="signup-title"
          className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
        >
          Salonko
        </span>
      </Link>
      <p data-testid="signup-subtitle" className="text-gray-500 dark:text-gray-400 text-sm">
        Registrujte vas salon za besplatno
      </p>
    </div>
  );
}
