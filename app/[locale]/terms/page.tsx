import type { Metadata } from "next";
import { Scale, MonitorSmartphone, Smartphone, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service - EveryFileConvert",
  description:
    "Read the Terms of Service for EveryFileConvert. Free online file converter with up to 500 MB on desktop and 200 MB on mobile.",
};

const rules = [
  "Use the service only for lawful purposes and in compliance with applicable laws.",
  "Do not attempt to reverse-engineer, decompile, or exploit any part of the platform.",
  "Do not use automated scripts or bots to flood the service with requests.",
  "Do not upload or attempt to process files containing malware or malicious code.",
  "Respect intellectual property rights — only convert files you have the right to process.",
  "Do not use the service to process files that violate third-party privacy rights.",
];

export default function TermsOfServicePage() {
  const lastUpdated = "June 1, 2025";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-20 max-w-4xl text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <Scale className="h-3.5 w-3.5" />
            Terms of Service
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Simple, Fair <span className="text-blue-400">Terms</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            EveryFileConvert is a free online tool provided as-is. By using this service, you agree to the
            following terms.
          </p>
          <p className="text-sm text-slate-500 mt-6">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-4xl">
        {/* File size limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
              <MonitorSmartphone className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Desktop File Limit</h3>
              <p className="text-3xl font-bold text-blue-400 mb-1">500 MB</p>
              <p className="text-slate-400 text-sm">per conversion on desktop browsers</p>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10">
              <Smartphone className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Mobile File Limit</h3>
              <p className="text-3xl font-bold text-cyan-400 mb-1">200 MB</p>
              <p className="text-slate-400 text-sm">per conversion on mobile devices</p>
            </div>
          </div>
        </div>

        <div className="space-y-10 text-slate-400">
          <TermsSection title="1. Acceptance of Terms">
            <p>
              By accessing or using EveryFileConvert (the "Service"), you agree to be bound by these Terms of
              Service. If you do not agree to these terms, please do not use the Service. We reserve the right
              to update these terms at any time; continued use of the Service constitutes acceptance of any
              revised terms.
            </p>
          </TermsSection>

          <TermsSection title="2. Description of Service">
            <p>
              EveryFileConvert is a free online file conversion platform. Users can convert files across video,
              audio, image, document, PDF, and e-book formats directly in their web browser. The service is
              provided "as is" without any server-side restrictions. All file processing occurs client-side;
              no files are uploaded to our servers.
            </p>
          </TermsSection>

          <TermsSection title="3. File Size Limits">
            <p className="mb-3">
              To ensure a reliable experience across device types, the following per-conversion file size limits
              apply:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <span>
                  <strong className="text-slate-200">Desktop browsers:</strong> up to 500 MB per file
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                <span>
                  <strong className="text-slate-200">Mobile devices:</strong> up to 200 MB per file
                </span>
              </li>
            </ul>
            <p className="mt-3">
              These limits exist because conversions run in-browser and are constrained by your device's
              available RAM and processing capacity, not by a server queue.
            </p>
          </TermsSection>

          <TermsSection title="4. Permitted and Prohibited Use">
            <p className="mb-3">You agree to:</p>
            <ul className="space-y-2 ml-4">
              {rules.map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </TermsSection>

          <TermsSection title="5. Intellectual Property">
            <p>
              The EveryFileConvert name, logo, and website design are proprietary. The underlying open-source
              libraries (FFmpeg, etc.) used for conversion are subject to their respective licenses (LGPL, MIT,
              etc.). EveryFileConvert does not claim ownership over any files you convert.
            </p>
          </TermsSection>

          <TermsSection title="6. Disclaimer of Warranties">
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind, express or
              implied, including but not limited to merchantability, fitness for a particular purpose, or
              non-infringement. We do not guarantee that the Service will be uninterrupted, error-free, or
              produce a specific conversion result.
            </p>
          </TermsSection>

          <TermsSection title="7. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable law, EveryFileConvert shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising out of or relating to
              your use of the Service, even if advised of the possibility of such damages. Our total liability
              to you for any claims arising from the Service shall not exceed USD $0 (as the Service is
              provided free of charge).
            </p>
          </TermsSection>

          <TermsSection title="8. Governing Law">
            <p>
              These Terms shall be governed by and construed in accordance with generally applicable
              international law principles. Any disputes arising under these Terms shall first be attempted to
              be resolved amicably by contacting us at{" "}
              <a
                href="mailto:sponsor@everyfileconvert.com"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors"
              >
                sponsor@everyfileconvert.com
              </a>
              .
            </p>
          </TermsSection>

          <TermsSection title="9. Contact">
            <p>
              For any questions regarding these Terms, please reach out at{" "}
              <a
                href="mailto:sponsor@everyfileconvert.com"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors"
              >
                sponsor@everyfileconvert.com
              </a>
              .
            </p>
          </TermsSection>
        </div>
      </section>
    </main>
  );
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
      <div className="leading-relaxed">{children}</div>
    </section>
  );
}
