"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{ maxWidth: '448px', width: '100%', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                height: '80px',
                width: '80px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                marginBottom: '1.5rem',
              }}
            >
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f43f5e' }}>!</span>
            </div>

            <h2
              style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '0.75rem',
                marginTop: 0,
              }}
            >
              Something went wrong
            </h2>
            <p style={{ color: '#475569', marginBottom: '2rem', fontSize: '1rem', marginTop: 0 }}>
              A critical error occurred. Please refresh the page.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={reset}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(to right, #2563eb, #06b6d4)',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '1rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontWeight: '600',
                  fontSize: '1rem',
                  textDecoration: 'none',
                  display: 'block',
                  boxSizing: 'border-box',
                }}
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
