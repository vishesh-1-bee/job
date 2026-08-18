export default function BillingPage() {
  return (
    <div className="w-full min-h-[400px] bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col items-center justify-center p-8 select-none">
      <div className="text-center space-y-3">
        <div className="inline-flex h-12 w-12 rounded-full bg-slate-50 items-center justify-center text-slate-400 border border-slate-100">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800">Billing / Credits coming soon.</h2>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">Manage your subscription, credits, and billing information.</p>
      </div>
    </div>
  );
}
