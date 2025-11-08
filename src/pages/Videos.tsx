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
            correctPassword="Matze"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl p-4">
        <h1 className="text-4xl font-bold text-primary mb-2">Letzte Spiele</h1>
        <div className="w-20 h-1 bg-primary mb-8"></div>
        
        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Heimspiel vs Möhringen (Spieltag 3)</h2>
            <div className="aspect-video w-full bg-secondary rounded-lg overflow-hidden shadow-lg">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/videoseries?si=yV-ubstdCCUPmekk&amp;list=PLo9Gj2rLRK5xZB-MKl2i8T1gEyCti4Y71"
                title="Heimspiel vs Möhringen (Spieltag 3)"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Heimspiel vs Freiberg (Spieltag 1)</h2>
            <div className="aspect-video w-full bg-secondary rounded-lg overflow-hidden shadow-lg">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/videoseries?si=eu68_74l4tNpMo5C&amp;list=PLo9Gj2rLRK5zn_KBrt8299Fle0EVXBOaG"
                title="Heimspiel vs Freiberg (Spieltag 1)"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Testspiel vs. Heilbronn</h2>
            <div className="aspect-video w-full bg-secondary rounded-lg overflow-hidden shadow-lg">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/videoseries?si=S7NvpPvhuxt0zzWU&amp;list=PLo9Gj2rLRK5xJ3pWlQO_5III4fkIzegI_"
                title="Testspiel vs. Heilbronn"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Videos;
