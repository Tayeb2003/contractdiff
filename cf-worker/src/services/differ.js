import { diff_match_patch } from 'diff-match-patch'

const dmp = new diff_match_patch()

export function computeDiff(textA, textB) {
  const diffs = dmp.diff_main(textA, textB)
  dmp.diff_cleanupSemantic(diffs)
  return diffs.map(([op, text]) => ({
    textBefore: op === -1 || op === 0 ? text : '',
    textAfter: op === 1 || op === 0 ? text : '',
    type: op === 0 ? 'equal' : op === 1 ? 'insert' : 'delete',
  }))
}

export function extractChangedSections(textA, textB) {
  const diffs = computeDiff(textA, textB)
  const sections = []
  let currentBefore = ''
  let currentAfter = ''
  let inChange = false
  let lineOffset = 0
  let changeStartLine = 0

  for (const chunk of diffs) {
    // Every chunk carries `textBefore` for the "before" document (inserts
    // carry an empty one). We advance the before-document line counter for
    // all chunk types so reported line numbers stay accurate across edits.
    const beforeLines = chunk.textBefore.split('\n').length - 1
    if (chunk.type === 'equal') {
      if (inChange) {
        if (currentBefore || currentAfter) {
          sections.push({
            before: currentBefore.trim(),
            after: currentAfter.trim(),
            startLine: changeStartLine,
            endLine: lineOffset,
          })
        }
        currentBefore = ''
        currentAfter = ''
        inChange = false
      }
      lineOffset += beforeLines
    } else {
      if (!inChange) {
        inChange = true
        changeStartLine = lineOffset
      }
      if (chunk.type === 'delete') currentBefore += chunk.textBefore
      if (chunk.type === 'insert') currentAfter += chunk.textAfter
    }
  }

  if (inChange && (currentBefore || currentAfter)) {
    sections.push({
      before: currentBefore.trim(),
      after: currentAfter.trim(),
      startLine: changeStartLine,
      endLine: lineOffset,
    })
  }

  return sections
}
