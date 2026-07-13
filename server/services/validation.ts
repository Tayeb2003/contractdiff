export class ValidationError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

type Rule = { required?: boolean; min?: number; max?: number; pattern?: RegExp; email?: boolean; message?: string };

function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

export function validate(body: Record<string, unknown>, rules: Record<string, Rule>): void {
  for (const [field, rule] of Object.entries(rules)) {
    const value = body[field];
    if (rule.required && !isPresent(value)) {
      throw new ValidationError(rule.message || `${field} is required`);
    }
    if (isPresent(value)) {
      // min/max apply to string/array length or numeric value.
      const numeric = typeof value === 'number' ? value : null;
      const measurable =
        typeof value === 'string' || Array.isArray(value)
          ? (value as string | unknown[]).length
          : numeric;
      if (rule.min !== undefined) {
        if (measurable === null) {
          throw new ValidationError(rule.message || `${field} must be at least ${rule.min}`);
        }
        if (measurable < rule.min) {
          throw new ValidationError(rule.message || `${field} must be at least ${rule.min}`);
        }
      }
      if (rule.max !== undefined) {
        if (measurable === null) {
          throw new ValidationError(rule.message || `${field} must be at most ${rule.max}`);
        }
        if (measurable > rule.max) {
          throw new ValidationError(rule.message || `${field} must be at most ${rule.max}`);
        }
      }
      if (typeof value === 'string') {
        if (rule.pattern && !rule.pattern.test(value)) {
          throw new ValidationError(rule.message || `${field} format is invalid`);
        }
        if (rule.email) {
          const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRe.test(value)) {
            throw new ValidationError(rule.message || 'Invalid email format');
          }
        }
      }
    }
  }
}

export function validateDocIds(reqBody: Record<string, unknown>): { docAId: string; docBId: string } {
  validate(reqBody, {
    docAId: { required: true, message: 'Original document ID (docAId) is required' },
    docBId: { required: true, message: 'New document ID (docBId) is required' },
  });
  return { docAId: reqBody.docAId as string, docBId: reqBody.docBId as string };
}
