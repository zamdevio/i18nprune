import { LINKS } from "./links";

export const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "/features", external: false },
    { label: "Workflow", href: "/workflow", external: false },
    { label: "Commands", href: "/commands", external: false },
    { label: "API & JSON", href: "/api", external: false },
  ],
  Resources: [
    { label: "Documentation", href: LINKS.docs, external: true },
    { label: "Examples", href: "/examples", external: false },
    { label: "Benchmark", href: "/benchmark", external: false },
    { label: "NPM Package", href: LINKS.npm, external: true },
  ],
  Community: [
    { label: "Our Story", href: "/story", external: false },
    { label: "Open Source", href: "/opensource", external: false },
    { label: "GitHub", href: LINKS.github, external: true },
    { label: "License", href: LINKS.license, external: true },
  ],
} as const;
