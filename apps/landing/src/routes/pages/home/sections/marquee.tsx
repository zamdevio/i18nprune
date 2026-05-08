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
  const marqueeItems = [...integrations, ...integrations, ...integrations];

  return (
    <section className="relative overflow-hidden bg-background py-16 border-y border-border/30">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50" />
      <div className="container relative z-10 mx-auto mb-10 max-w-6xl px-6 text-center">
        <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">
          Works seamlessly with your ecosystem
        </div>
      </div>

      <div className="pause-on-hover relative flex overflow-hidden group">
        <div className="animate-marquee flex whitespace-nowrap py-4">
          {marqueeItems.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="mx-3 flex items-center gap-3 rounded-full border border-border/40 bg-secondary/20 px-6 py-3 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-primary/10"
            >
              <item.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
              <span className="text-sm font-bold tracking-tight text-foreground/80 group-hover:text-foreground">
                {item.name}
              </span>
            </div>
          ))}
        </div>
        
        {/* Gradient Fades for the edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-20" />
      </div>
    </section>
  );
}
