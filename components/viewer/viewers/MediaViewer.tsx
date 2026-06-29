"use client";
import { useEffect, useState } from "react";

export default function MediaViewer({ file, engine }: { file: File; engine: "video" | "audio" }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[250px]">
      {engine === "video" ? (
        <video
          src={url}
          controls
          className="w-full max-w-3xl rounded-xl shadow"
          style={{ maxHeight: "60vh" }}
        />
      ) : (
        <div className="w-full max-w-xl rounded-2xl bg-gradient-to-br from-violet-100 to-blue-50 p-8 flex flex-col items-center gap-4">
          <p className="text-sm font-medium text-slate-600 truncate max-w-full">{file.name}</p>
          <audio src={url} controls className="w-full" />
        </div>
      )}
    </div>
  );
}
