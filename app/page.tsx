import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans overflow-hidden transition-colors duration-300">
      {/* Decorative premium background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 dark:bg-violet-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 blur-[120px] pointer-events-none" />
      
      {/* Subtle light/dark gradient over the page */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(255,255,255,0.15))] dark:bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(15,23,42,0.15))] pointer-events-none" />

      {/* Top Header / Navigation */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Logo Badge */}
          <div className="h-7 w-7 rounded bg-slate-900 dark:bg-slate-100 flex items-center justify-center shadow-md">
            <span className="text-[10px] font-extrabold text-white dark:text-slate-900 font-mono tracking-tight">
              AI
            </span>
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-950 to-slate-800 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Job Agent
          </span>
        </div>

        <nav className="flex items-center gap-6">
          <Link
            href="/signin"
            className="text-sm font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white transition-colors duration-200"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="hidden sm:inline-flex h-9 items-center justify-center bg-slate-950 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-semibold text-sm px-4 rounded-lg shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Main Landing / Hero Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          
          {/* AI Badge Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200/80 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm text-xs font-semibold text-slate-500 dark:text-slate-400 mb-8 animate-fade-in shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
            AI-powered job application assistant
          </div>

          {/* Hero Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.15] mb-6 max-w-3xl">
            Apply to jobs faster with an agent that works for you
          </h1>

          {/* Hero Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed mb-10">
            Track applications, tailor resumes, and manage your job search from one dashboard — with AI handling the repetitive parts.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 justify-center">
            <Link
              href="/signup"
              className="h-12 flex items-center justify-center bg-slate-950 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-semibold px-6 rounded-lg shadow-md shadow-slate-950/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Create free account
            </Link>
            <Link
              href="/signin"
              className="h-12 flex items-center justify-center bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold px-6 rounded-lg shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-200/50 dark:border-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-600">
        <p>© {new Date().getFullYear()} Job Agent. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-800 dark:hover:text-slate-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-800 dark:hover:text-slate-400 transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
