type BillingPageHeaderProps = {
  title?: string;
  description?: string;
};

export function BillingPageHeader({
  title = "Naplata",
  description = "Upravljajte svojom pretplatom",
}: BillingPageHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
