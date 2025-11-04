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
        <div className="max-w-4xl mx-auto">
          <div className="aspect-video w-full bg-secondary rounded-lg overflow-hidden shadow-lg">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/videoseries?si=yV-ubstdCCUPmekk&amp;list=PLo9Gj2rLRK5xZB-MKl2i8T1gEyCti4Y71"
              title="TSV Neuenstadt Pitbulls Spiele"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <h3 className="text-2xl font-semibold mt-6 mb-4">Saison 2024/2025</h3>
          <p className="text-muted-foreground">
            Schaut euch hier die Spiele der Saison 2024/2025 an. Weitere Videos werden nach den Spielen hinzugefügt.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Videos;
