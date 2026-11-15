'use client';

import { useEffect } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page max-w-xl">
      <h1>Something went wrong</h1>
      <Alert variant="error" className="mt-4">
        The page could not be loaded. Your data has not been changed. Please try again.
        {error.digest && <span className="mt-1 block text-xs">Error reference: {error.digest}</span>}
      </Alert>
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
