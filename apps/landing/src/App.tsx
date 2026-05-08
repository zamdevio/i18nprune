import { ToolVersionProvider } from "./contexts/version";
import { ThemeProvider } from "./hooks/useTheme";
import AppRoutes from "./routes";

export default function App() {
  return (
    <ThemeProvider>
      <ToolVersionProvider>
        <AppRoutes />
      </ToolVersionProvider>
    </ThemeProvider>
  );
}
