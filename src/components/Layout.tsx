import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Decorative crosses top-left */}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
        {[...Array(4)].map((_, i) => (
          <svg
            key={`top-${i}`}
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <path
              d="M16 0L19.5 12.5L32 16L19.5 19.5L16 32L12.5 19.5L0 16L12.5 12.5L16 0Z"
              fill="currentColor"
              opacity="0.8"
            />
          </svg>
        ))}
      </div>

      {/* Decorative crosses bottom-right */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {[...Array(4)].map((_, i) => (
          <svg
            key={`bottom-${i}`}
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <path
              d="M16 0L19.5 12.5L32 16L19.5 19.5L16 32L12.5 19.5L0 16L12.5 12.5L16 0Z"
              fill="currentColor"
              opacity="0.8"
            />
          </svg>
        ))}
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
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
