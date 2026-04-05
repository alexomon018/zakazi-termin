import Link from "next/link";
import { SalonkoIcon } from "../../atoms/Icons";

export function SignupHeader() {
  return (
    <div className="text-center mb-8 animate-fade-in">
      <Link
        href="/"
        className="inline-flex items-center gap-2 mb-3 transition-transform hover:scale-105"
      >
        <SalonkoIcon className="w-8 h-8 text-primary dark:text-white" />
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
