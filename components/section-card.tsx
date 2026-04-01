import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="rounded-[28px] border border-sky-100 bg-white/90 p-6 shadow-[0_18px_50px_rgba(125,166,210,0.18)] backdrop-blur">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}
