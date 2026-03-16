import { Button } from "../../atoms/Button";

type ErrorBoundaryUIProps = {
  heading: string;
  fullHeight?: boolean;
  onRetry: () => void;
};

/** Shared error boundary presentation component used by route-group error.tsx files. */
export function ErrorBoundaryUI({ heading, fullHeight = false, onRetry }: ErrorBoundaryUIProps) {
  return (
    <div
      role="alert"
      className={`${fullHeight ? "min-h-dvh bg-muted/30 dark:bg-background" : "min-h-[50vh]"} flex items-center justify-center px-4`}
    >
      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">{heading}</h2>
        <p className="text-muted-foreground mb-8">
          Nešto je pošlo po zlu. Pokušajte ponovo ili se obratite podršci ako se problem nastavi.
        </p>
        <Button onClick={onRetry} size="lg">
          Pokušajte ponovo
        </Button>
      </div>
    </div>
  );
}
