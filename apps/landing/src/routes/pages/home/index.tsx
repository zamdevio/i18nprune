import { HeroSection } from "./sections/hero";
import { TerminalSection } from "./sections/terminal";
import { AutomationSection } from "./sections/automation";
import { WorkflowSection } from "./sections/workflow";
import { FeaturesSection } from "./sections/features";
import { CommandsSection } from "./sections/commands";
import { MarqueeSection } from "./sections/marquee";
import { InstallSection } from "./sections/install";
import { OpenSourceSection } from "./sections/opensource";
import { StorySection } from "./sections/story";

import { useRevealOnPage } from "../../../hooks/useRevealOnPage";

export default function HomePage() {
  useRevealOnPage("home");

  return (
    <>
      <HeroSection />
      <TerminalSection />
      <AutomationSection />
      <WorkflowSection />
      <FeaturesSection />
      <CommandsSection />
      <MarqueeSection />
      <InstallSection />
      <OpenSourceSection />
      <StorySection />
    </>
  );
}
