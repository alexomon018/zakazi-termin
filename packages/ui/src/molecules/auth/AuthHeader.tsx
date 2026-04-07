import Link from "next/link";
import { SalonkoIcon } from "../../atoms/Icons";

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
}

export function AuthHeader({ title, subtitle, showLogo = true }: AuthHeaderProps) {
  return (
    <div className="mb-8 text-center">
      {showLogo && (
        <Link
          href="/"
          className="inline-flex gap-2 justify-center items-center mb-3 transition-transform hover:scale-105"
        >
          <SalonkoIcon className="w-8 h-8 text-primary dark:text-white" />
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            Salonko
          </span>
        </Link>
      )}
      {title && <p className="font-medium text-gray-600 dark:text-gray-300">{title}</p>}
      {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
  );
}
