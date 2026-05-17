import { ThemeProvider } from './hooks/useTheme';
import { MetaProvider } from './context/MetaContext';
import Header from './components/Header';
import Footer from './components/Footer';
import PageRail from './components/PageRail';
import CommandPalette from './components/CommandPalette';
import Hero from './sections/Hero';
import Doctor from './sections/Doctor';
import TerminalDemo from './sections/TerminalDemo';
import Architecture from './sections/Architecture';
import CodeIntelligence from './sections/CodeIntelligence';
import Features from './sections/Features';
import Commands from './sections/Commands';
import CIIntegration from './sections/CIIntegration';
import Install from './sections/Install';
import RuntimeEcosystem from './sections/RuntimeEcosystem';
import ExtractionFlow from './sections/ExtractionFlow';
import Pruning from './sections/Pruning';
import OpenSource from './sections/OpenSource';
import BuiltBy from './sections/BuiltBy';

export default function App() {
  return (
    <ThemeProvider>
      <MetaProvider>
        <div className="relative min-h-screen bg-background text-foreground antialiased">
        <div className="noise-overlay fixed inset-0 z-[60]" aria-hidden="true" />
        <Header />
        <PageRail />
        <CommandPalette />
        <main>
          <Hero />
          <Doctor />
          <TerminalDemo />
          <Architecture />
          <CodeIntelligence />
          <Features />
          <Commands />
          <CIIntegration />
          <Install />
          <RuntimeEcosystem />
          <ExtractionFlow />
          <Pruning />
          <OpenSource />
          <BuiltBy />
        </main>
        <Footer />
        </div>
      </MetaProvider>
    </ThemeProvider>
  );
}
