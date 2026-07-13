export class ValidationError extends Error {
  statusCode = 400
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

function isPresent(value) {
  return value !== undefined && value !== null && value !== ''
}

export function validate(body, rules) {
  for (const [field, rule] of Object.entries(rules)) {
    const value = body[field]
    if (rule.required && !isPresent(value)) {
      throw new ValidationError(rule.message || `${field} is required`)
    }
    if (isPresent(value) && typeof value === 'string') {
      if (rule.min !== undefined && value.length < rule.min) {
        throw new ValidationError(rule.message || `${field} must be at least ${rule.min} characters`)
      }
      if (rule.max !== undefined && value.length > rule.max) {
        throw new ValidationError(rule.message || `${field} must be at most ${rule.max} characters`)
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        throw new ValidationError(rule.message || `${field} format is invalid`)
      }
      if (rule.email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new ValidationError(rule.message || 'Invalid email format')
        }
      }
    }
  }
}

export function validateDocIds(reqBody) {
  validate(reqBody, {
    docAId: { required: true, message: 'Original document ID (docAId) is required' },
    docBId: { required: true, message: 'New document ID (docBId) is required' },
  })
  return { docAId: reqBody.docAId, docBId: reqBody.docBId }
}
