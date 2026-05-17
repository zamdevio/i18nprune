/** Swagger UI — loads spec from same-origin `/openapi.json`. */
export function swaggerDocsHtml(openapiUrl: string): string {
  const specUrl = JSON.stringify(openapiUrl);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>i18nprune meta API — docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" crossorigin="anonymous" />
  <style>body { margin: 0; } #swagger-ui { max-width: 1200px; margin: 0 auto; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin="anonymous"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: ${specUrl},
      dom_id: "#swagger-ui",
      deepLinking: true,
      tryItOutEnabled: true,
    });
  </script>
</body>
</html>`;
}
