import { motion } from "motion/react";
import { Github, Menu, X, Sun, Moon, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { LINKS, getDocsUrl } from "../../constants/links";
import { PRIMARY_NAV } from "../../constants/navigation";
import { useTheme } from "../../hooks/useTheme";
import VersionBadge from "../version";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const close = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [isMobileMenuOpen]);

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 z-50 w-full transition-all duration-500 border-b ${
        isScrolled
          ? "border-border/40 bg-background/70 backdrop-blur-xl h-16 shadow-sm"
          : "border-transparent bg-transparent h-20"
      }`}
    >
      <div className="container mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 group relative z-10">
          <img
            src="/i18nprune.svg"
            alt="i18nprune logo"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-display text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            i18nprune
          </span>
          <VersionBadge className="hidden sm:inline-flex opacity-80" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 rounded-full border border-border/40 bg-card/30 px-2 py-1 backdrop-blur-md shadow-sm">
          {PRIMARY_NAV.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-full ${
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 rounded-full bg-primary/10 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all hover:scale-105"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all hover:scale-105"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>

          <a 
            href={getDocsUrl("README")}
            target="_blank"
            rel="noopener noreferrer"
            className="group hidden sm:flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] hover:-translate-y-[1px]"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>

          <button 
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-secondary/30 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={isMobileMenuOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        className="overflow-hidden bg-background/95 backdrop-blur-xl lg:hidden border-b border-border/40"
      >
        <nav className="flex flex-col gap-1 p-6">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                location.pathname === item.to
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-foreground hover:bg-secondary/50"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="my-4 h-px w-full bg-border/50" />
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Github className="h-5 w-5" />
            <span>GitHub Repository</span>
          </a>
        </nav>
      </motion.div>
    </header>
  );
}
