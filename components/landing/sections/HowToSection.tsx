"use client";

interface Step { label: string; desc: string }

interface Props {
  steps?: Step[];
  title?: string;
  bg?: string;
}

const DEFAULT_STEPS: Step[] = [
  { label: "Upload",   desc: "Drag & drop your file or click to browse" },
  { label: "Convert",  desc: "Your file is processed instantly in your browser" },
  { label: "Download", desc: "Save your converted file with one click" },
];

export function HowToSection({ steps = DEFAULT_STEPS, title = "How to Use", bg = "bg-white" }: Props) {
  return (
    <section className={`py-14 ${bg}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-cyan-600 to-blue-500" />
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg mb-4 shadow-lg">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.label}</h3>
                <p className="text-sm text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
