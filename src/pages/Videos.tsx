import { useState } from "react";
import Layout from "@/components/Layout";
import PasswordProtection from "@/components/PasswordProtection";

const Videos = () => {
  const [hasAccess, setHasAccess] = useState(false);

  if (!hasAccess) {
    return (
      <Layout>
        <div className="container mx-auto max-w-4xl">
          <PasswordProtection
            onSuccess={() => setHasAccess(true)}
            correctPassword="pitbulls2025"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold text-primary mb-8">Spielvideos</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-video bg-secondary rounded-lg overflow-hidden border border-primary/20">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Sample Video 1"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="aspect-video bg-secondary rounded-lg overflow-hidden border border-primary/20">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Sample Video 2"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-6 text-center">
          Weitere Videos werden in Kürze hinzugefügt
        </p>
      </div>
    </Layout>
  );
};

export default Videos;
