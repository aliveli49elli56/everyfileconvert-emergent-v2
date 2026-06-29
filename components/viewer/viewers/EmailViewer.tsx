"use client";
import { useEffect, useState } from "react";

interface Email { from: string; to: string; subject: string; date: string; body: string }

export default function EmailViewer({ file }: { file: File }) {
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      const header = (key: string) => {
        const m = raw.match(new RegExp(`^${key}:\\s*(.+)`, "im"));
        return m ? m[1].trim() : "";
      };
      const bodyStart = raw.indexOf("\r\n\r\n") !== -1 ? raw.indexOf("\r\n\r\n") + 4 : raw.indexOf("\n\n") + 2;
      setEmail({
        from: header("From"),
        to: header("To"),
        subject: header("Subject"),
        date: header("Date"),
        body: raw.slice(bodyStart).replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))),
      });
      setLoading(false);
    };
    reader.readAsText(file, "utf-8");
  }, [file]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {loading && <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}
      {email && (
        <>
          <div className="mb-5 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            {[["From", email.from], ["To", email.to], ["Subject", email.subject], ["Date", email.date]].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="w-16 flex-shrink-0 font-semibold text-slate-500">{k}:</span>
                <span className="text-slate-700 break-all">{v}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-slate-100 p-5 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed max-h-[50vh] overflow-y-auto">
            {email.body}
          </div>
        </>
      )}
    </div>
  );
}
