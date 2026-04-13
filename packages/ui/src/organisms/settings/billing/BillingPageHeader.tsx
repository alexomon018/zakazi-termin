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
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-1 text-muted-foreground">{description}</p>
    </div>
  );
}
