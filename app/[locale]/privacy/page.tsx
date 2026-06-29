import type { Metadata } from "next";
import { ShieldCheck, ServerOff, Eye, FileX, Database, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - EveryFileConvert",
  description:
    "EveryFileConvert never uploads your files to any server. All processing happens inside your browser. Read our full privacy policy.",
};

const commitments = [
  {
    icon: ServerOff,
    title: "No Server Uploads — Ever",
    description:
      "We do NOT upload your files to any server. All image, audio, video, and PDF processing happens entirely inside your browser via client-side technologies. Your data never leaves your device.",
  },
  {
    icon: Eye,
    title: "No Logs, No History",
    description:
      "We maintain no server-side logs of files you convert. No file names, no file contents, no conversion history is ever stored or transmitted.",
  },
  {
    icon: FileX,
    title: "Zero Data Retention",
    description:
      "Because conversion is in-browser, there is nothing to retain. Files exist only in your browser's temporary memory and are discarded the moment you close or refresh the tab.",
  },
  {
    icon: Database,
    title: "No Third-Party File Processing",
    description:
      "Your files are never sent to third-party cloud services, AI APIs, or any external processing pipeline. The entire conversion engine runs locally on your device.",
  },
  {
    icon: Lock,
    title: "100% Security",
    description:
      "The in-browser architecture eliminates the most common attack vector for file-processing services — a data breach on a remote server. There is no remote server to breach.",
  },
  {
    icon: ShieldCheck,
    title: "GDPR-Friendly by Architecture",
    description:
      "Because we never receive or process personal data on a server, the privacy risks that GDPR and similar regulations exist to address simply do not arise with EveryFileConvert.",
  },
];

export default function PrivacyPolicyPage() {
  const lastUpdated = "June 1, 2025";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-20 max-w-4xl text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
            <ShieldCheck className="h-3.5 w-3.5" />
            Privacy-First Conversion
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Your Files Are <span className="text-emerald-400">100% Private</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Every file you convert on EveryFileConvert stays on your device. Our entire platform is engineered so
            that no file data ever reaches our — or anyone else's — servers.
          </p>
          <p className="text-sm text-slate-500 mt-6">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Core commitment */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-bold text-emerald-400 mb-3">Our Core Privacy Commitment</h2>
          <p className="text-slate-300 leading-relaxed text-lg">
            "We do NOT upload your files to any server. All image, audio, video, and PDF processing happens
            entirely inside your browser via client-side technologies. Your data never leaves your device. No
            logs, no history, and 100% security."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {commitments.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 mb-4">
                <Icon className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Full policy text */}
        <div className="space-y-10 text-slate-400">
          <PolicySection title="1. Information We Collect">
            <p>
              EveryFileConvert collects minimal information necessary to operate the website. We may collect
              anonymized, aggregated analytics data (such as page views and general geographic region) to
              understand usage patterns. This data does not identify individual users and contains no file-related
              information whatsoever.
            </p>
            <p className="mt-3">
              We do not collect, store, process, or transmit the content of any file you use with our conversion
              tools.
            </p>
          </PolicySection>

          <PolicySection title="2. How File Conversion Works">
            <p>
              All conversion operations are performed client-side using WebAssembly and JavaScript running in
              your browser. When you select a file, it is loaded into your browser's local memory (RAM). The
              conversion engine — compiled to WebAssembly — processes the file entirely within that memory
              space. The output file is then made available for download directly from your browser. At no point
              is any file data transmitted over the network to our servers or any third-party service.
            </p>
          </PolicySection>

          <PolicySection title="3. Cookies and Local Storage">
            <p>
              We may use browser local storage to preserve your preferences (such as language or theme
              settings) across sessions. We do not use tracking cookies or persistent identifiers linked to
              personal data. Any third-party advertising partners may use their own cookies subject to their
              respective privacy policies; you may opt out via standard browser controls.
            </p>
          </PolicySection>

          <PolicySection title="4. Third-Party Services">
            <p>
              EveryFileConvert may display advertisements served by third-party ad networks. These networks
              may collect standard web analytics data (IP address, browser type, referring URL) in accordance
              with their own privacy policies. We do not share file data, conversion history, or any file-related
              information with advertisers or any other third party.
            </p>
          </PolicySection>

          <PolicySection title="5. Children's Privacy">
            <p>
              EveryFileConvert is not directed at children under the age of 13. We do not knowingly collect
              personal information from children. Because our service does not require account creation or
              personal data submission, it is generally safe for users of all ages.
            </p>
          </PolicySection>

          <PolicySection title="6. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an
              updated date. Continued use of EveryFileConvert following any changes constitutes acceptance of
              the revised policy.
            </p>
          </PolicySection>

          <PolicySection title="7. Contact">
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a
                href="mailto:sponsor@everyfileconvert.com"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors"
              >
                sponsor@everyfileconvert.com
              </a>
              .
            </p>
          </PolicySection>
        </div>
      </section>
    </main>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
      <div className="leading-relaxed">{children}</div>
    </section>
  );
}
