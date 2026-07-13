import { diff_match_patch } from 'diff-match-patch';

const dmp = new diff_match_patch();

// A blank line marks the boundary between clauses. When we cross one
// mid-change we flush the current section so each changed clause is
// reported on its own.
const GAP_RE = /\n\s*\n/;

export interface DiffChunk {
  textBefore: string;
  textAfter: string;
  type: 'equal' | 'insert' | 'delete' | 'replace';
}

export interface ChangedSection {
  before: string;
  after: string;
  startLine: number;
  endLine: number;
}

export function computeDiff(textA: string, textB: string): DiffChunk[] {
  const diffs = dmp.diff_main(textA || '', textB || '');
  dmp.diff_cleanupSemantic(diffs);

  return diffs.map(([op, text]) => {
    let type: DiffChunk['type'];
    if (op === 0) type = 'equal';
    else if (op === 1) type = 'insert';
    else if (op === -1) type = 'delete';
    else type = 'equal';

    return {
      textBefore: op === -1 || op === 0 ? text : '',
      textAfter: op === 1 || op === 0 ? text : '',
      type,
    };
  });
}

export function extractChangedSections(textA: string, textB: string): ChangedSection[] {
  const diffs = computeDiff(textA || '', textB || '');
  const sections: ChangedSection[] = [];
  let beforeParts: string[] = [];
  let afterParts: string[] = [];
  let pendingContextParts: string[] = [];
  let inChange = false;
  let lineOffset = 0;
  let changeStartLine = 0;

  const flush = () => {
    const before = beforeParts.join('').trim();
    const after = afterParts.join('').trim();
    if (before || after) {
      sections.push({ before, after, startLine: changeStartLine, endLine: lineOffset });
    }
    beforeParts = [];
    afterParts = [];
    inChange = false;
  };

  for (const chunk of diffs) {
    const beforeLines = chunk.textBefore.split('\n').length - 1;
    if (chunk.type === 'equal') {
      if (inChange) {
        // Include equal text as context on BOTH sides so each clause shows its
        // full surrounding text, not just the bare delta.
        beforeParts.push(chunk.textBefore);
        afterParts.push(chunk.textBefore);
        if (GAP_RE.test(chunk.textBefore)) flush();
      } else {
        pendingContextParts.push(chunk.textBefore);
      }
      lineOffset += beforeLines;
    } else {
      if (!inChange) {
        inChange = true;
        changeStartLine = lineOffset;
        beforeParts = pendingContextParts.slice();
        afterParts = pendingContextParts.slice();
        pendingContextParts = [];
      }
      if (chunk.type === 'delete' || chunk.type === 'replace') {
        beforeParts.push(chunk.textBefore);
      }
      if (chunk.type === 'insert' || chunk.type === 'replace') {
        afterParts.push(chunk.textAfter);
      }
      lineOffset += beforeLines;
    }
  }

  flush();
  return sections;
}
