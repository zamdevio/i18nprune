import { 
  Cpu, 
  Globe, 
  Layout, 
  Share2, 
  Bot, 
  Github, 
  Terminal, 
  Layers, 
  Zap, 
  Cloud, 
  Code 
} from "lucide-react";
import { DISPLAY_SECTION_TITLE_LG } from "../../../../constants/typography";

const integrations = [
  { name: "GitHub Actions", icon: Github },
  { name: "Vercel", icon: Globe },
  { name: "Netlify", icon: Layout },
  { name: "Slack", icon: Share2 },
  { name: "Discord", icon: Zap },
  { name: "AWS", icon: Cloud },
  { name: "Google Cloud", icon: Cpu },
  { name: "Azure", icon: Layers },
  { name: "Custom Agents", icon: Bot },
  { name: "CLI", icon: Terminal },
  { name: "Webhooks", icon: Code },
];

export function MarqueeSection() {
  // Duplicate the list to create a seamless loop
  const marqueeItems = [...integrations, ...integrations];

  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-background py-16">
      {/* Grid texture for consistency */}
      <div className="grid-texture absolute inset-0 z-0 opacity-[0.2]" />
      
      <div className="container relative z-10 mx-auto mb-12 max-w-7xl px-4 text-center">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-sidebar-primary">
          Ecosystem
        </div>
        <h2 className={DISPLAY_SECTION_TITLE_LG}>
          Automate & Integrate
        </h2>
        <p className="mt-2 text-muted-foreground">
          Works with your favorite tools and platforms
        </p>
      </div>

      <div className="pause-on-hover relative flex overflow-hidden">
        <div className="animate-marquee flex whitespace-nowrap py-4">
          {marqueeItems.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="mx-4 flex items-center gap-3 rounded-full border border-border bg-card/50 px-6 py-3 backdrop-blur-sm transition-all hover:border-sidebar-primary/50 hover:bg-secondary"
            >
              <item.icon className="h-5 w-5 text-sidebar-primary" />
              <span className="text-sm font-bold tracking-tight text-foreground">
                {item.name}
              </span>
            </div>
          ))}
        </div>
        
        {/* Gradient Fades for the edges - using background color for seamless blending */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-20" />
      </div>
    </section>
  );
}
