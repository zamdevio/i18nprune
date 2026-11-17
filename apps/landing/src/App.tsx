import { ThemeProvider } from './hooks/useTheme';
import { MetaProvider } from './context/MetaContext';
import Header from './components/Header';
import Footer from './components/Footer';
import PageRail from './components/PageRail';
import CommandPalette from './components/CommandPalette';
import Hero from './sections/Hero';
import Install from './sections/Install';
import RuntimeEcosystem from './sections/RuntimeEcosystem';
import UsedBy from './sections/UsedBy';
import Architecture from './sections/Architecture';
import Features from './sections/Features';
import Commands from './sections/Commands';
import Doctor from './sections/Doctor';
import TerminalDemo from './sections/TerminalDemo';
import ExtractionFlow from './sections/ExtractionFlow';
import Pruning from './sections/Pruning';
import CodeIntelligence from './sections/CodeIntelligence';
import LocaleLayouts from './sections/LocaleLayouts';
import CIIntegration from './sections/CIIntegration';
import OpenSource from './sections/OpenSource';
import BuiltBy from './sections/BuiltBy';

export default function App() {
  return (
    <ThemeProvider>
      <MetaProvider>
        <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
        <div className="noise-overlay fixed inset-0 z-[60]" aria-hidden="true" />
        <Header />
        <PageRail />
        <CommandPalette />
        <main>
          <Hero />
          <Install />
          <RuntimeEcosystem />
          <UsedBy />
          <Architecture />
          <Features />
          <Commands />
          <Doctor />
          <TerminalDemo />
          <ExtractionFlow />
          <Pruning />
          <CodeIntelligence />
          <LocaleLayouts />
          <CIIntegration />
          <OpenSource />
          <BuiltBy />
        </main>
        <Footer />
        </div>
      </MetaProvider>
    </ThemeProvider>
  );
}
