"use client";
import { useEffect, useState } from "react";

export default function TextViewer({ file }: { file: File }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => {
      setContent(reader.result as string);
      setLoading(false);
    };
    reader.readAsText(file, "utf-8");
  }, [file]);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  return (
    <div className="p-4 h-full">
      {loading && <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}
      {!loading && (
        <pre
          className="text-xs leading-relaxed font-mono text-slate-700 overflow-auto whitespace-pre-wrap break-words"
          style={{ maxHeight: "70vh" }}
        >
          {content}
        </pre>
      )}
    </div>
  );
}
