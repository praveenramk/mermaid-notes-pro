import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const Header = () => {
  const { mode } = useApp();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-mode-border/30 bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-6 py-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <img src={logo} alt="MermaidNotes logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
              MermaidNotes
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              AI-Powered Diagram Generator
            </p>
          </div>
        </button>

        <nav className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-mode"
          >
            Home
          </button>
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: `hsl(var(--mode-primary))` }}
          />
          <span className="text-xs font-medium text-mode capitalize">
            {mode === "direct-mermaid" ? "Direct Mermaid" : "Summary Overview"}
          </span>
        </nav>
      </div>
    </header>
  );
};

export default Header;
