import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./layout";
import HomePage from "./pages/home";
import ApiPage from "./pages/api";
import CommandsPage from "./pages/commands";
import FeaturesPage from "./pages/features";
import WorkflowPage from "./pages/workflow";
import OpenSourcePage from "./pages/opensource";
import StoryPage from "./pages/story";
import ExamplesPage from "./pages/examples";
import BenchmarkPage from "./pages/benchmark";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/workflow" element={<WorkflowPage />} />
        <Route path="/commands" element={<CommandsPage />} />
        <Route path="/examples" element={<ExamplesPage />} />
        <Route path="/benchmark" element={<BenchmarkPage />} />
        <Route path="/api" element={<ApiPage />} />
        <Route path="/opensource" element={<OpenSourcePage />} />
        <Route path="/story" element={<StoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
