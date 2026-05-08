import { motion } from "motion/react";
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { DISPLAY_SECTION_TITLE_LG } from "../../../../constants/typography";

export function StorySection() {
  return (
    <section className="bg-background py-32 relative">
      <div className="container relative mx-auto max-w-3xl px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center md:text-left"
        >
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary md:mx-0 mx-auto">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className={`${DISPLAY_SECTION_TITLE_LG} mb-8`}>
            The Story
          </h2>
          <div className="space-y-8 text-lg md:text-xl font-medium leading-relaxed text-muted-foreground">
            <p>
              i18nprune is a solo-built CLI and library — created from scratch to turn messy locale files into something
              you can validate, sync, and ship with confidence. 
            </p>
            <p>
              It was born while working on a large product (
              <strong className="text-foreground">CepatEdge</strong>
              ) where hundreds of frontend files and ~1,200 keys made “small” i18n issues expensive and frustrating to trace.
            </p>
            <p>
              The tool is battle-tested by its own test suite and by real usage on that codebase — so edge cases show up
              early, not in production. It solves the 2am headache of tracking down a missing translation key.
            </p>
          </div>
          <div className="mt-12 flex justify-center md:justify-start">
            <Link
              to="/story"
              className="group inline-flex items-center gap-3 rounded-full border border-border/50 bg-secondary/30 px-8 py-4 text-base font-bold text-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            >
              Read the full story
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
