import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Decorative X marks top-left */}
      <div className="fixed top-4 left-4 z-0 flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={`top-${i}`} className="text-primary text-4xl font-bold opacity-60">×</div>
        ))}
      </div>

      {/* Decorative X marks bottom-right */}
      <div className="fixed bottom-4 right-4 z-0 flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={`bottom-${i}`} className="text-primary text-4xl font-bold opacity-60">×</div>
        ))}
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 md:px-8 lg:px-20 py-6">
          <h1 className="text-4xl md:text-5xl font-bold text-primary text-center md:text-left">
            Pitbulls Neuenstadt
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-28 pb-20 px-4">
        {children}
      </main>
    </div>
  );
};

export default Layout;
