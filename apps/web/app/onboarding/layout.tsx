export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary orb - top right */}
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-30 dark:opacity-20"
          style={{
            background:
              "radial-gradient(circle, hsl(221.2 83.2% 53.3% / 0.4) 0%, hsl(221.2 83.2% 53.3% / 0.1) 50%, transparent 70%)",
          }}
        />

        {/* Secondary orb - bottom left */}
        <div
          className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full opacity-25 dark:opacity-15"
          style={{
            background:
              "radial-gradient(circle, hsl(221.2 83.2% 53.3% / 0.3) 0%, hsl(217 91% 60% / 0.1) 50%, transparent 70%)",
          }}
        />

        {/* Accent orb - center right (mobile hidden) */}
        <div
          className="hidden sm:block absolute top-1/2 -right-24 w-[300px] h-[300px] rounded-full opacity-20 dark:opacity-10 -translate-y-1/2"
          style={{
            background: "radial-gradient(circle, hsl(217 91% 60% / 0.4) 0%, transparent 60%)",
          }}
        />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content container */}
      <div className="relative min-h-dvh flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        {/* Main content area */}
        <div className="w-full max-w-2xl">{children}</div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Salonko. Sva prava zadržana.
          </p>
        </div>
      </div>
    </div>
  );
}
