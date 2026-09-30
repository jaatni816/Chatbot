import { readFileSync } from 'node:fs';
import path from 'node:path';

let cachedKnowledge: string | undefined;

export function getKnowledgeBase() {
  if (!cachedKnowledge) {
    cachedKnowledge = readFileSync(
      path.join(process.cwd(), 'data', 'knowledge.md'),
      'utf8',
    );
  }

  return cachedKnowledge;
}