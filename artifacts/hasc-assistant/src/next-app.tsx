'use client';

import { Assistant } from './App';

export default function NextApp({ embed = false }: { embed?: boolean }) {
  return <Assistant embed={embed} />;
}