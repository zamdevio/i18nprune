import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs'

// Get default components from theme
const themeComponents = getThemeComponents()

// Merge custom components with theme components
export function useMDXComponents(components) {
  return {
    ...themeComponents,
    ...components,
    // Add custom components here if needed
  }
}
