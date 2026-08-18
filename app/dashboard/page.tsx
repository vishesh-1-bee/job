import React from "react";

function PlaceholderCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="w-full min-h-[400px] bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col items-center justify-center p-8 select-none">
      <div className="text-center space-y-3">
        <div className="inline-flex h-12 w-12 rounded-full bg-slate-50 items-center justify-center text-slate-400 border border-slate-100">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PlaceholderCard
      title="Jobs coming soon."
      description="Browse and apply to jobs tailored to your resume and preferences."
      icon={
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      }
    />
  );
}
