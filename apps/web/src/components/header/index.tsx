import { motion } from "motion/react";
import { Github, Menu, X, Sun, Moon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { LINKS, docsUrl } from "../../constants/links";
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
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        isScrolled
          ? "border-border/80 bg-background/80 backdrop-blur-xl h-14"
          : "border-transparent bg-transparent h-16"
      }`}
    >
      <div className="container mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="/favicon.svg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-lg transition-transform group-hover:scale-105"
          />
          <span className="font-display text-xl font-bold tracking-tight">
            i18nprune
          </span>
          <VersionBadge className="hidden sm:inline-flex" />
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`link-underline text-sm font-medium transition-colors ${
                location.pathname === item.to
                  ? "text-sidebar-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>

          <a 
            href={docsUrl("README")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glow hidden sm:block rounded-full bg-sidebar-primary px-5 py-2 text-sm font-semibold text-sidebar-primary-foreground"
          >
            Get Started
          </a>

          <button 
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/50 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 w-full bg-background border-b border-border p-4 lg:hidden max-h-[80vh] overflow-y-auto"
        >
          <nav className="flex flex-col gap-2">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  location.pathname === item.to
                    ? "bg-sidebar-primary/10 text-sidebar-primary"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <hr className="my-2 border-border" />
            <a
              href={LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Github className="h-5 w-5" />
              <span>GitHub</span>
            </a>
          </nav>
        </motion.div>
      )}
    </header>
  );
}
