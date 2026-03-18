import Link from 'next/link';

// City Fleet brand colors (match tailwind.config) — used for inline fallback so branding always shows
const BRAND = {
  navy: '#002147',
  navyLight: '#003366',
  gold: '#F4B020',
  goldLight: '#F5C050',
};

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-br from-cityfleet-navy to-cityfleet-navy-light"
      style={{ background: `linear-gradient(to bottom right, ${BRAND.navy}, ${BRAND.navyLight})` }}
    >
      {/* Header Bar - Gold */}
      <div
        className="w-full py-3 px-6 flex justify-between items-center bg-cityfleet-gold"
        style={{ backgroundColor: BRAND.gold }}
      >
        <span className="text-sm font-semibold text-black">CITY FLEET</span>
        <div className="flex items-center gap-4">
          <a href="tel:(07)30637722" className="text-sm text-black hover:underline">
            (07) 3063 7722
          </a>
          <a href="mailto:info@cityfleet.com.au" className="text-sm text-black hover:underline">
            info@cityfleet.com.au
          </a>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-lg">
          {/* Logo / Brand */}
          <div className="bg-white rounded-lg p-8 inline-block mb-6 shadow-lg">
            <h1
              className="text-4xl font-bold tracking-tight text-cityfleet-navy"
              style={{ color: BRAND.navy }}
            >
              CITY FLEET
            </h1>
            <p className="text-sm text-gray-600 mt-2 tracking-wider">
              TRANSPORT MAINTENANCE
            </p>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Workshop Manager
          </h2>
          <p className="text-white/90 mb-8">
            Internal workshop management for City Fleet
          </p>

          <Link
            href="/login"
            className="inline-block font-semibold px-8 py-3 rounded-md shadow-lg bg-cityfleet-gold text-black hover:opacity-90 transition"
            style={{ backgroundColor: BRAND.gold }}
          >
            Sign in
          </Link>
        </div>
      </main>
    </div>
  );
}
