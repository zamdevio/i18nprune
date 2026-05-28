export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'i18nprune Worker API',
    version: '0.1.0',
    description:
      'Read-focused API for i18nprune browser/edge workflows. Upload once to build cache, then run validate/report quickly from cached data. Write-heavy operations remain CLI/IDE-only. ' +
      'Cached projects live in a Durable Object store: each successful read of a project (metadata, validate, snapshot, etc.) bumps `lastAccessedAt` and schedules a periodic sweep. ' +
      'Rows with no access for 7 days are deleted automatically so idle uploads do not retain large JSON blobs forever, while active integrations keep their cache alive by continuing to call the API.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'system', description: 'Worker health and API docs.' },
    {
      name: 'capabilities',
      description:
        'Runtime policy contract. `supportedOperations` are available in this worker. `writeOperations` are intentionally blocked here and should be executed via CLI/IDE.',
    },
    {
      name: 'projects',
      description:
        'Upload, inspect, and delete cached project snapshots. Idle retention: project rows are evicted after 7 days without any read; each read extends that window.',
    },
    { name: 'operations', description: 'Read-only operations that execute from upload-time cached data.' },
    {
      name: 'reports',
      description:
        'Store and fetch shared report documents (`i18nprune.projectReport` JSON). Idle retention matches projects (7 days without reads).',
    },
  ],
  components: {
    schemas: {
      WorkerApiErrorItem: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', description: 'Stable machine code (e.g. PAYLOAD_TOO_LARGE, RATE_LIMITED, PROJECT_NOT_FOUND).' },
          message: { type: 'string' },
          details: { type: 'object', additionalProperties: true },
          suggestions: { type: 'array', items: { type: 'string' } },
          recoverable: { type: 'boolean' },
          action: {
            type: 'string',
            enum: ['reduce_payload', 'fix_payload', 'retry', 'reupload', 'self_host'],
          },
          retryAfterSeconds: { type: 'integer' },
        },
      },
      ApiEnvelope: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          success: { type: 'boolean' },
          data: {},
          errors: {
            type: 'array',
            items: { $ref: '#/components/schemas/WorkerApiErrorItem' },
          },
          warnings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: {},
              },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/': {
      get: {
        tags: ['system'],
        summary: 'Service root help',
        description: 'Returns quick links for health, capabilities, and docs endpoints.',
        responses: {
          '200': { description: 'Service information and route links' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['system'],
        summary: 'Health check',
        description: 'Lightweight runtime probe for local dev/monitoring checks.',
        responses: {
          '200': {
            description: 'Healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    service: { type: 'string' },
                  },
                  example: { code: 'OK', success: true, data: { service: 'i18nprune-worker' } },
                },
              },
            },
          },
        },
      },
    },
    '/v1/capabilities': {
      get: {
        tags: ['capabilities'],
        summary: 'Runtime capabilities and policy',
        description:
          'Describes which operations are available in worker mode. Use this endpoint to drive runtime-web UX (enable/disable actions and show CLI guidance for blocked write flows).',
        responses: {
          '200': {
            description: 'Capabilities',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    mode: { type: 'string' },
                    readOnly: { type: 'boolean' },
                    supportedOperations: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                    writeOperations: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                    guidance: { type: 'string' },
                  },
                  example: {
                    code: 'OK',
                    success: true,
                    data: {
                      mode: 'read-only',
                      readOnly: true,
                      supportedOperations: ['validate', 'review', 'missing', 'locales', 'doctor', 'report'],
                      writeOperations: ['sync', 'generate', 'cleanup', 'missing-apply'],
                      guidance:
                        'Use CLI/IDE extension for write-heavy operations. This worker is intentionally read-focused by default.',
                    },
                    errors: [],
                    warnings: [],
                    timestamp: '2026-01-01T00:00:00.000Z',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/projects': {
      post: {
        tags: ['projects'],
        summary: 'Ingest prepared project snapshot JSON (primary)',
        description:
          'Validates `HostedProjectIngestEnvelope` from CLI/web prepare (`schemaVersion`, `snapshot` with extraction, optional `prepareMeta`). No analysis cache on the worker.',
        parameters: [
          {
            name: 'force',
            in: 'query',
            required: false,
            schema: { type: 'boolean' },
            description: 'When true, bypass hash dedup and replace any existing row for the same content hash.',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Project cached and ready for operations',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiEnvelope' },
              },
            },
          },
          '400': {
            description: 'Ingest validation failure',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiEnvelope' },
              },
            },
          },
          '413': {
            description: 'Prepared JSON exceeds max bytes',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiEnvelope' },
              },
            },
          },
          '429': {
            description: 'Per-IP anonymous upload quota exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiEnvelope' },
              },
            },
          },
        },
      },
    },
    '/v1/projects/archive': {
      post: {
        tags: ['projects'],
        summary: 'Upload project archive (.zip) and prepare snapshot (secondary)',
        description:
          'Worker-side zip prepare via core `prepareProjectSnapshotFromArchive` (cache off). Optional `configJson` form field overrides zip-detected config.',
        parameters: [
          {
            name: 'force',
            in: 'query',
            required: false,
            schema: { type: 'boolean' },
            description: 'When true, bypass hash dedup and replace any existing row for the same content hash.',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  archive: { type: 'string', format: 'binary' },
                  configJson: { type: 'string' },
                },
                required: ['archive'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Project cached and ready for operations',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiEnvelope' },
              },
            },
          },
          '400': {
            description: 'Upload/prepare validation failure',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiEnvelope' },
              },
            },
          },
          '413': {
            description: 'Zip too large, too many files, or extraction text limit',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiEnvelope' },
              },
            },
          },
          '429': {
            description: 'Per-IP anonymous upload quota exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiEnvelope' },
              },
            },
          },
        },
      },
    },
    '/v1/projects/{id}/tree': {
      get: {
        tags: ['projects'],
        summary: 'Return full project tree metadata for an uploaded project',
        description:
          'Returns directory/file tree: each node has `path` and `meta` (`{ kind: "directory" }` or `{ kind: "file", size, ext, mimeGuess, textLike }`). Directories include `children`.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Tree payload' }, '404': { description: 'Project not found' } },
      },
    },
    '/v1/projects/{id}/snapshot': {
      get: {
        tags: ['projects'],
        summary: 'Return full project snapshot JSON blob',
        description: 'Returns cached snapshot metadata and cached extraction payloads for diagnostics/integration.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Snapshot payload' }, '404': { description: 'Project not found' } },
      },
    },
    '/v1/projects/{id}': {
      get: {
        tags: ['projects'],
        summary: 'Return lightweight project metadata',
        description:
          'Returns minimal project and extraction metadata (counts, paths, hashes) without large preview/site arrays.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Project metadata' }, '404': { description: 'Project not found' } },
      },
      delete: {
        tags: ['projects'],
        summary: 'Delete project snapshot from Durable Object storage',
        description: 'Idempotent delete. Returns `deleted: false` when project does not exist.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Delete status' } },
      },
    },
    '/v1/projects/{id}/validate': {
      post: {
        tags: ['operations'],
        summary: 'Run read-only validate from cached extraction',
        description:
          'Returns CLI-compatible validate `data` from upload-time cached extraction (`missing`, `count`, `dynamic`, `keyObservations`). Observation rows live in the project report artifact; dynamic file:lines match the CLI (`locales dynamic --json`).',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { type: 'object' },
              example: {},
            },
          },
        },
        responses: {
          '200': { description: 'Validate response' },
          '400': { description: 'Cache/config policy error (for example: CONFIG_REUPLOAD_REQUIRED)' },
          '404': { description: 'Project not found' },
        },
      },
    },
    '/v1/projects/{id}/review': {
      post: {
        tags: ['operations'],
        summary: 'Run read-only locale review from cached data',
        description:
          'Builds review payload from cached source/target locale JSON and extraction counts. Mirrors CLI review core data builders.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { type: 'object' },
              example: {},
            },
          },
        },
        responses: {
          '200': { description: 'Review response' },
          '400': { description: 'Cache/config policy error' },
          '404': { description: 'Project not found' },
        },
      },
    },
    '/v1/projects/{id}/missing': {
      post: {
        tags: ['operations'],
        summary: 'Compute read-only missing-keys plan for a locale tag',
        description:
          'Returns keys to add (`toAdd`) and skipped report paths (`skippedNotInScan`) using cached resolved keys and locale JSON.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  targetTag: { type: 'string', description: 'Locale tag to plan against (e.g. id, ar). Defaults to source tag.' },
                  reportMissingPaths: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Missing plan response' },
          '400': { description: 'Cache/config policy error' },
          '404': { description: 'Project or locale not found' },
        },
      },
    },
    '/v1/projects/{id}/locales': {
      get: {
        tags: ['operations'],
        summary: 'List cached locale tags',
        description: 'Lists locale tags cached from `localesDir` during upload-time processing.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Locales list response' }, '404': { description: 'Project not found' } },
      },
    },
    '/v1/projects/{id}/locales/{tag}': {
      get: {
        tags: ['operations'],
        summary: 'Get one cached locale JSON by tag',
        description: 'Returns a single cached locale JSON object (example tag: `en`, `id`, `ar`).',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'tag', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Locale payload' }, '404': { description: 'Project or locale not found' } },
      },
    },
    '/v1/projects/{id}/doctor': {
      get: {
        tags: ['operations'],
        summary: 'Run worker-side diagnostic checks',
        description: 'Read-only health checks for snapshot completeness and cached extraction artifacts.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Doctor response' }, '404': { description: 'Project not found' } },
      },
    },
    '/v1/projects/{id}/report': {
      post: {
        tags: ['operations'],
        summary: 'Build CLI-compatible report JSON document from cached project extraction data',
        description:
          'Returns a payload containing `document` shaped like CLI `report --json` output (schema from `@i18nprune/report`). You can manually import this JSON into [report.i18nprune.dev](https://report.i18nprune.dev) to visualize the full report UI.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { type: 'object' },
              example: {},
            },
          },
        },
        responses: {
          '200': { description: 'Report response (document payload)' },
          '400': { description: 'Cache/config policy error (for example: CONFIG_REUPLOAD_REQUIRED)' },
          '404': { description: 'Project not found' },
        },
      },
    },
    '/v1/reports': {
      post: {
        tags: ['reports'],
        summary: 'Store a shared project report document',
        description:
          'Validates `document` against `projectReportDocumentSchema` and caches it for report.i18nprune.dev share links. Max body size: REPORT_SHARE_MAX_BYTES (8 MiB).',
        parameters: [
          {
            name: 'force',
            in: 'query',
            required: false,
            schema: { type: 'boolean' },
            description: 'When true, bypass hash dedup and replace any existing row for the same content hash.',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { document: { type: 'object' } },
                required: ['document'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Report stored (`data.reportId`)' },
          '400': {
            description: 'Schema validation failure',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiEnvelope' },
              },
            },
          },
          '413': {
            description: 'Report JSON exceeds REPORT_SHARE_MAX_BYTES',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiEnvelope' },
              },
            },
          },
          '429': {
            description: 'Per-IP anonymous upload quota exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiEnvelope' },
              },
            },
          },
        },
      },
    },
    '/v1/reports/archive': {
      post: {
        tags: ['reports'],
        summary: 'Upload project zip and store derived report (secondary)',
        description:
          'Prepares report document from archive via core `prepareReportFromArchive` (no analysis cache). Same multipart shape as project archive.',
        parameters: [
          {
            name: 'force',
            in: 'query',
            required: false,
            schema: { type: 'boolean' },
            description: 'When true, bypass hash dedup and replace any existing row for the same content hash.',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  archive: { type: 'string', format: 'binary' },
                  configJson: { type: 'string' },
                },
                required: ['archive'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Report stored (`data.reportId`)' },
          '400': {
            description: 'Prepare or validation failure',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiEnvelope' },
              },
            },
          },
          '413': {
            description: 'Zip too large or extraction limits',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiEnvelope' },
              },
            },
          },
          '429': {
            description: 'Per-IP anonymous upload quota exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiEnvelope' },
              },
            },
          },
        },
      },
    },
    '/v1/reports/{id}/document': {
      get: {
        tags: ['reports'],
        summary: 'Return full stored report document',
        description: 'Returns `{ document }` for report app import. Touches idle TTL.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Full document' }, '404': { description: 'REPORT_NOT_FOUND' } },
      },
    },
    '/v1/reports/{id}': {
      get: {
        tags: ['reports'],
        summary: 'Return report metadata (no document body)',
        description:
          'Returns ids, hashes, summary counts, and project paths — same fields share `view` needs. Touches idle TTL.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Report metadata' }, '404': { description: 'REPORT_NOT_FOUND' } },
      },
      delete: {
        tags: ['reports'],
        summary: 'Delete stored report',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Delete status (`data.deleted`)' } },
      },
    },
    '/openapi.json': {
      get: {
        tags: ['system'],
        summary: 'OpenAPI document',
        responses: { '200': { description: 'OpenAPI JSON' } },
      },
    },
    '/docs': {
      get: {
        tags: ['system'],
        summary: 'Swagger UI',
        responses: { '200': { description: 'Swagger UI HTML' } },
      },
    },
  },
} as const;
