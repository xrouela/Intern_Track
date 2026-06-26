import React, { useState, useEffect, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

export default function ErrorBoundary({ children }: Props) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleReset = () => {
    window.location.reload();
  };

  if (hasError) {
    let errorMessage = 'An unexpected error occurred.';
    let isPermissionError = false;

    try {
      if (error?.message) {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.error.includes('Missing or insufficient permissions')) {
          errorMessage = `Access Denied: You don't have permission to perform this ${parsed.operationType} operation on ${parsed.path}.`;
          isPermissionError = true;
        }
      }
    } catch (e) {
      if (error?.message.includes('permission')) {
        errorMessage = 'You do not have permission to view this content.';
        isPermissionError = true;
      }
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            {isPermissionError ? (
              <ShieldAlert className="text-red-600" size={32} />
            ) : (
              <AlertCircle className="text-red-600" size={32} />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {isPermissionError ? 'Access Restricted' : 'Something went wrong'}
          </h1>
          <p className="text-slate-600 mb-8">{errorMessage}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition"
            >
              <RefreshCw size={20} />
              Refresh Page
            </button>
            <a href="/" className="text-slate-500 hover:text-slate-700 font-medium text-sm">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

