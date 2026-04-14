import { motion } from "motion/react";
import { Github, Heart, Users } from "lucide-react";
import { LINKS } from "../../../../constants/links";
import { DISPLAY_SECTION_TITLE_LG } from "../../../../constants/typography";

export function OpenSourceSection() {
  return (
    <section className="bg-background py-24">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="rounded-3xl border border-border bg-gradient-to-b from-card/50 to-background p-8 text-center md:p-16">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-sidebar-primary/10 text-sidebar-primary">
            <Github className="h-8 w-8" />
          </div>
          <h2 className={`mb-4 ${DISPLAY_SECTION_TITLE_LG}`}>
            Built in the open
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            i18nprune is MIT licensed and built by the community. Join us on GitHub to contribute, report issues, or suggest new features.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            <a
              href={LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-base font-bold text-background transition-all hover:opacity-90"
            >
              <Github className="h-5 w-5" />
              Star on GitHub
            </a>
            <div className="flex items-center gap-8 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Community driven</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span>MIT Licensed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
