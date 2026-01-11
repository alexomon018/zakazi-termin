interface StatusBadgeProps {
  status: "PENDING" | "ACCEPTED" | "CANCELLED" | "REJECTED";
  labels?: {
    PENDING?: string;
    ACCEPTED?: string;
    CANCELLED?: string;
    REJECTED?: string;
  };
}

const defaultLabels = {
  PENDING: "Na čekanju",
  ACCEPTED: "Potvrđeno",
  CANCELLED: "Otkazano",
  REJECTED: "Odbijeno",
};

export function StatusBadge({ status, labels }: StatusBadgeProps) {
  const displayLabels = { ...defaultLabels, ...labels };

  const variants = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    ACCEPTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[status]}`}
    >
      {displayLabels[status]}
    </span>
  );
}
