export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Zakazi Termin
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Jednostavno zakazivanje termina za vaše poslovanje
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="/login"
            className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Prijavi se
          </a>
          <a
            href="/signup"
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            Registruj se <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </main>
  );
}
