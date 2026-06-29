'use client';
/**
 * EbookConverterClient — E-Book format converter with pre-selectable format state
 * Reads ?from=epub&to=pdf URL params to pre-select formats
 */
import { useEffect, useState } from 'react';
import UniversalDropzone from '@/components/UniversalDropzone';

interface Props {
  initialFrom?: string;
  initialTo?: string;
}

export default function EbookConverterClient({ initialFrom, initialTo }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return (
    <div className="h-60 flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  );

  return (
    <UniversalDropzone
      mode="all"
      allowedTypes={['.epub', '.mobi', '.azw3', '.fb2', '.pdf', '.txt', '.html', '.azw', 'application/epub+zip']}
      defaultSourceExt={initialFrom}
      defaultTargetFormat={initialTo}
    />
  );
}
