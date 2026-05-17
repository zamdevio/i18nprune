/**
 * OpenAPI 3.0 — keep in sync with `types/index.ts` and route handlers.
 * Serves at `GET /openapi.json`.
 */
export const OPENAPI_SPEC = {
  openapi: "3.0.3",
  info: {
    title: "i18nprune meta API",
    version: "1.0.0",
    description:
      "Cached GitHub repo stats, npm package versions (cli + core), and VS Code Marketplace extension metadata. Canonical read: GET /v1/meta.",
  },
  servers: [{ url: "https://meta.i18nprune.dev", description: "production" }],
  paths: {
    "/v1/meta": {
      get: {
        summary: "Full snapshot",
        parameters: [{ name: "force", in: "query", schema: { type: "string", enum: ["1"] } }],
        responses: {
          "200": {
            description: "Meta document",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MetaV1" } } },
          },
        },
      },
    },
    "/v1/github": {
      get: {
        summary: "GitHub slice",
        responses: { "200": { description: "GitHub + cache.github" } },
      },
    },
    "/v1/npm": {
      get: {
        summary: "npm slice",
        responses: { "200": { description: "npm + cache.npm" } },
      },
    },
    "/v1/extension": {
      get: {
        summary: "VS Code Marketplace extension slice",
        responses: { "200": { description: "extension + cache.extension" } },
      },
    },
    "/v1/health": {
      get: {
        summary: "API liveness",
        responses: { "200": { description: "ok" } },
      },
    },
  },
  components: {
    schemas: {
      CacheSliceV1: {
        type: "object",
        required: ["stale", "updatedAtUnix", "expiresAtUnix"],
        properties: {
          stale: { type: "boolean" },
          updatedAtUnix: { type: "integer" },
          expiresAtUnix: { type: "integer" },
        },
      },
      NpmRowV1: {
        type: "object",
        required: ["name", "version", "lastPublishUnix", "error"],
        properties: {
          name: { type: "string" },
          version: { type: "string", nullable: true },
          lastPublishUnix: { type: "integer", nullable: true },
          error: { type: "string", nullable: true },
        },
      },
      ExtensionRowV1: {
        type: "object",
        required: ["publisher", "name", "version", "lastPublishUnix", "error"],
        properties: {
          publisher: { type: "string" },
          name: { type: "string" },
          version: { type: "string", nullable: true },
          lastPublishUnix: { type: "integer", nullable: true },
          error: { type: "string", nullable: true },
        },
      },
      GitHubRepoV1: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          stars: { type: "integer", nullable: true },
          forks: { type: "integer", nullable: true },
          openIssues: { type: "integer", nullable: true },
          watchers: { type: "integer", nullable: true },
          contributors: { type: "integer", nullable: true },
          error: { type: "string", nullable: true },
        },
      },
      MetaV1: {
        type: "object",
        required: ["ok", "version", "generatedAtUnix", "cache", "links", "github", "npm", "extension"],
        properties: {
          ok: { const: true },
          version: { type: "integer", enum: [1] },
          generatedAtUnix: { type: "integer" },
          cache: {
            type: "object",
            properties: {
              github: { $ref: "#/components/schemas/CacheSliceV1" },
              npm: { $ref: "#/components/schemas/CacheSliceV1" },
              extension: { $ref: "#/components/schemas/CacheSliceV1" },
            },
          },
          links: { type: "object", additionalProperties: { type: "string" } },
          github: { $ref: "#/components/schemas/GitHubRepoV1" },
          npm: {
            type: "object",
            properties: {
              cli: { $ref: "#/components/schemas/NpmRowV1" },
              core: { $ref: "#/components/schemas/NpmRowV1" },
            },
          },
          extension: { $ref: "#/components/schemas/ExtensionRowV1" },
        },
      },
    },
  },
} as const;
