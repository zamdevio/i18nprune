import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DISPLAY_SECTION_TITLE_LG } from "../../../../constants/typography";

export function StorySection() {
  return (
    <section className="bg-background py-24">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center">
          <h2 className={`mb-8 ${DISPLAY_SECTION_TITLE_LG}`}>
            The Story
          </h2>
          <div className="space-y-6 text-left text-lg leading-relaxed text-muted-foreground">
            <p>
              i18nprune is a solo-built CLI and library — created from scratch to turn messy locale files into something
              you can validate, sync, and ship with confidence. It was born while working on a large product (
              <strong className="text-foreground/90">CepatEdge</strong>
              ) where hundreds of frontend files and ~1,200 keys made “small” i18n issues expensive.
            </p>
            <p>
              The tool is battle-tested by its own test suite and by real usage on that codebase — so edge cases show up
              early, not in production.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mt-10 flex justify-center"
          >
            <Link
              to="/story"
              className="btn-glow inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold text-foreground transition-all hover:border-sidebar-primary"
            >
              Read the full story
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
