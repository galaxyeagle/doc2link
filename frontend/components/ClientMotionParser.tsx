'use client';

import dynamic from 'next/dynamic';

const MotionParser = dynamic(() => import('./MotionParser'), {
  ssr: false,
});

export default function ClientMotionParser({ html }: { html: string }) {
  return <MotionParser html={html} />;
}