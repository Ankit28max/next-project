'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Leaflet needs the browser's `window`, so the map is loaded only on the client
// and its JavaScript is not part of the first page load.
const ComplaintMap = dynamic(() => import('./ComplaintMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-56 w-full" />,
});

export function ComplaintMapLazy(props: { latitude: number; longitude: number }) {
  return <ComplaintMap {...props} />;
}
