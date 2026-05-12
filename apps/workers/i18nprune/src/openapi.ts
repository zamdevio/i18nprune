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
  ],
  components: {
    schemas: {
      ApiEnvelope: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          success: { type: 'boolean' },
          data: {},
          errors: {
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
        summary: 'Upload project archive (.zip only) and create/reuse a project snapshot',
        description:
          'Builds upload-time cache (source locale parse + extraction outputs). Optional `configJson` overrides zip-detected config. Required config fields: `source` (project-relative path to the source locale JSON), `src`, `localesDir`, `functions`.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  archive: { type: 'string', format: 'binary' },
                  configJson: {
                    type: 'string',
                    description:
                      'Optional JSON string override for config. If provided, this takes precedence over zip-detected config files.',
                  },
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
            description: 'Upload/config validation failure',
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
