"use client";
import { useEffect, useState } from "react";

export default function ImageViewer({ file }: { file: File }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[300px]">
      {url && (
        <img
          src={url}
          alt={file.name}
          className="max-w-full max-h-[70vh] rounded-xl shadow object-contain"
        />
      )}
    </div>
  );
}
