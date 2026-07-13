const spec = {
  openapi: '3.0.3',
  info: {
    title: 'ContractDiff API',
    version: '1.0.0',
    description:
      'ContractDiff is a contract comparison API. Upload two documents, and the service uses AI to explain the differences in plain English, indicating which party each change favors and how severe it is.\n\n## Authentication\nMost endpoints require a JWT bearer token. Obtain one via `POST /api/auth/login` (or `POST /api/auth/signup`). Send it as:\n\n```\nAuthorization: Bearer <your-token>\n```\n\n## Base URL\nAll paths below are relative to the API base URL, e.g. `http://localhost:3001/api`.',
    contact: {
      name: 'ContractDiff',
    },
    license: { name: 'MIT' },
  },
  servers: [
    {
      url: process.env.API_BASE_URL || 'http://localhost:3001/api',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Human-readable error message' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          plan: { type: 'string', example: 'free' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'JWT bearer token (7-day expiry)' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      Document: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          original_name: { type: 'string' },
          doc_type: { type: 'string', example: 'application/pdf' },
          upload_date: { type: 'string' },
        },
      },
      ClauseDiff: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          clause_text_before: { type: 'string' },
          clause_text_after: { type: 'string' },
          plain_english_summary: { type: 'string' },
          favors: { type: 'string', enum: ['party_a', 'party_b', 'neutral', 'unknown'] },
          severity: { type: 'string', enum: ['high', 'medium', 'low', 'none', 'unknown'] },
        },
      },
      Analysis: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['processing', 'completed', 'failed'] },
          summary: { type: 'string', nullable: true },
          createdAt: { type: 'string' },
          docAName: { type: 'string' },
          docBName: { type: 'string' },
          docAContent: { type: 'string' },
          docBContent: { type: 'string' },
        },
      },
      AnalysisSummary: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string' },
          summary: { type: 'string', nullable: true },
          created_at: { type: 'string' },
          doc_a_name: { type: 'string' },
          doc_b_name: { type: 'string' },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Registration, login, and account management' },
    { name: 'Documents', description: 'Upload and manage contract documents' },
    { name: 'Analyses', description: 'Compare documents and retrieve AI explanations' },
    { name: 'System', description: 'Health and API metadata' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        security: [],
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string', example: 'ok' } },
                },
              },
            },
          },
        },
      },
    },
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new account',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 6, example: 'secret123' },
                  name: { type: 'string', example: 'Jane Doe' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Account created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          409: { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate and receive a JWT',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password reset link',
        security: [],
        description:
          'Generates a single-use reset token (1-hour expiry). If SMTP is configured on the server, an email with the reset link is sent. The reset link is otherwise only logged server-side; it is returned in the `devLink` field ONLY when RESET_DEV_LINK=true is set (local development).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Reset request processed (generic message returned regardless of account existence)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    devLink: { type: 'string', description: 'Present only when RESET_DEV_LINK=true is set; never in normal operation', nullable: true },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password using a token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string', description: 'Reset token from the email/dev link' },
                  password: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          400: { description: 'Invalid, expired, or used token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the current authenticated user',
        responses: {
          200: { description: 'Current user', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/key': {
      get: {
        tags: ['Auth'],
        summary: 'Check whether the user has stored an AI API key',
        responses: {
          200: { description: 'Key status', content: { 'application/json': { schema: { type: 'object', properties: { hasKey: { type: 'boolean' }, provider: { type: 'string', enum: ['gemini', 'openai', 'anthropic', 'nvidia'] } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Auth'],
        summary: 'Store (or replace) the user AI API key',
        description: 'Per-user API key + provider, required for AI analysis. Every user must supply their own key; there is no shared server fallback. Supported providers: gemini, openai, anthropic, nvidia.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['apiKey'],
                properties: {
                  apiKey: { type: 'string', description: 'Send an empty string to clear the stored key' },
                  provider: { type: 'string', enum: ['gemini', 'openai', 'anthropic', 'nvidia'], default: 'gemini' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Saved', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, provider: { type: 'string' } } } } } },
          400: { description: 'Missing key', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/documents/upload': {
      post: {
        tags: ['Documents'],
        summary: 'Upload a document file',
        description: 'Accepts PDF, DOCX, or TXT (max 20MB). Text is extracted and stored server-side.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Uploaded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    originalName: { type: 'string' },
                    docType: { type: 'string' },
                    contentLength: { type: 'integer' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid file type or no file', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/documents/paste': {
      post: {
        tags: ['Documents'],
        summary: 'Create a document from pasted text',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  title: { type: 'string', maxLength: 500, example: 'Contract A' },
                  content: { type: 'string', example: 'This Agreement is made between...' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    originalName: { type: 'string' },
                    docType: { type: 'string' },
                    contentLength: { type: 'integer' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/documents': {
      get: {
        tags: ['Documents'],
        summary: 'List the authenticated user documents',
        responses: {
          200: { description: 'List of documents', content: { 'application/json': { schema: { type: 'object', properties: { documents: { type: 'array', items: { $ref: '#/components/schemas/Document' } } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/documents/{id}': {
      'delete': {
        tags: ['Documents'],
        summary: 'Delete a document',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Document not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/analyses/create': {
      post: {
        tags: ['Analyses'],
        summary: 'Create a contract comparison analysis',
        description:
          'Starts an asynchronous analysis comparing two documents. Returns immediately with `status: processing`. Poll `GET /analyses/{id}` until `status` is `completed` or `failed`.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['docAId', 'docBId'],
                properties: {
                  docAId: { type: 'string', format: 'uuid' },
                  docBId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          202: {
            description: 'Analysis queued',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    analysisId: { type: 'string', format: 'uuid' },
                    status: { type: 'string', example: 'processing' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Document not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/analyses': {
      get: {
        tags: ['Analyses'],
        summary: 'List the authenticated user analyses',
        responses: {
          200: { description: 'List of analyses', content: { 'application/json': { schema: { type: 'object', properties: { analyses: { type: 'array', items: { $ref: '#/components/schemas/AnalysisSummary' } } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/analyses/{id}': {
      get: {
        tags: ['Analyses'],
        summary: 'Get a single analysis with its clause diffs',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'Analysis detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    analysis: { $ref: '#/components/schemas/Analysis' },
                    clauses: { type: 'array', items: { $ref: '#/components/schemas/ClauseDiff' } },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Analysis not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      'delete': {
        tags: ['Analyses'],
        summary: 'Delete an analysis',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Analysis not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};

export default spec;
