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

  for (const chunk of diffs) {
    if (chunk.type === 'equal') {
      if (inChange) {
        if (currentBefore || currentAfter) {
          sections.push({
            before: currentBefore.trim(),
            after: currentAfter.trim(),
            startLine: Math.max(0, lineOffset - 1),
            endLine: lineOffset + 1,
          })
        }
        currentBefore = ''
        currentAfter = ''
        inChange = false
      }
      lineOffset += chunk.textBefore.split('\n').length - 1
    } else {
      inChange = true
      if (chunk.type === 'delete') currentBefore += chunk.textBefore
      if (chunk.type === 'insert') currentAfter += chunk.textAfter
    }
  }

  if (inChange && (currentBefore || currentAfter)) {
    sections.push({
      before: currentBefore.trim(),
      after: currentAfter.trim(),
      startLine: Math.max(0, lineOffset - 1),
      endLine: lineOffset + 1,
    })
  }

  return sections
}
