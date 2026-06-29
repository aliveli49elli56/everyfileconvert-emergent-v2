import type { Metadata } from "next";
import { Mail, MessageSquare, Handshake, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact - EveryFileConvert",
  description:
    "Get in touch with the EveryFileConvert team for support, sponsorship, or general inquiries at sponsor@everyfileconvert.com.",
};

const reasons = [
  {
    icon: HelpCircle,
    title: "Support",
    description: "Having trouble with a conversion? Let us know the file types involved and what went wrong.",
  },
  {
    icon: MessageSquare,
    title: "Feedback",
    description: "Suggestions for new formats, features, or improvements to the platform are always welcome.",
  },
  {
    icon: Handshake,
    title: "Sponsorship & Partnerships",
    description: "Interested in advertising or partnering with EveryFileConvert? Reach out to discuss opportunities.",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-20 max-w-3xl text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
            <Mail className="h-3.5 w-3.5" />
            Get in Touch
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            We Would Love to <span className="text-cyan-400">Hear from You</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Whether you have a question, feedback, or a sponsorship inquiry, send us an email and we will get
            back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Reasons */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {reasons.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 mb-4">
                <Icon className="h-5 w-5 text-cyan-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Main contact card */}
        <div className="max-w-xl mx-auto">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 mx-auto mb-6">
              <Mail className="h-8 w-8 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Email Us Directly</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              For support, feedback, or sponsorship inquiries, reach us at the address below. We read every email
              and aim to respond within one business day.
            </p>
            <a
              href="mailto:sponsor@everyfileconvert.com"
              className="inline-flex items-center gap-3 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl transition-all hover:scale-105 text-lg"
            >
              <Mail className="h-5 w-5" />
              sponsor@everyfileconvert.com
            </a>
            <p className="text-slate-500 text-sm mt-6">
              Please include relevant details (format, file size, browser) when reporting a conversion issue.
            </p>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <section className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-10 max-w-4xl text-center">
          <p className="text-slate-500 text-sm">
            EveryFileConvert is a free service maintained by a small team. We appreciate your patience and every
            piece of feedback that helps us improve.
          </p>
        </div>
      </section>
    </main>
  );
}
