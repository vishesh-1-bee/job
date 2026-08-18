export default function ApplicationStatusPage() {
  return (
    <div className="w-full min-h-[400px] bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col items-center justify-center p-8 select-none">
      <div className="text-center space-y-3">
        <div className="inline-flex h-12 w-12 rounded-full bg-slate-50 items-center justify-center text-slate-400 border border-slate-100">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800">Application Status coming soon.</h2>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">Track the status of all your job applications in one place.</p>
      </div>
    </div>
  );
}
