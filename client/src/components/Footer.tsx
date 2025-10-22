import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            Built with{" "}
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />{" "}
            by{" "}
            <a
              href="https://x.com/xtestnet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
              data-testid="link-xtestnet"
            >
              xtestnet
            </a>
          </div>
          <div className="text-muted-foreground" data-testid="text-copyright">
            © 2025
          </div>
          <div className="text-muted-foreground">
            Powered by{" "}
            <a
              href="https://drosera.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
              data-testid="link-drosera"
            >
              Drosera Network
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
