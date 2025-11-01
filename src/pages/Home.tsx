import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-8 mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-primary">
            Willkommen bei den Pitbulls
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Verfolgen Sie unsere Mannschaft, Statistiken und Videos aus der aktuellen Saison.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Button
            variant="outline"
            className="h-32 text-lg border-primary hover:bg-accent"
            onClick={() => navigate("/stats")}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="font-bold">Statistiken</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-32 text-lg border-primary hover:bg-accent"
            onClick={() => navigate("/players")}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">🏀</div>
              <div className="font-bold">Spieler</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-32 text-lg border-primary hover:bg-accent"
            onClick={() => navigate("/videos")}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">🎥</div>
              <div className="font-bold">Videos</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-32 text-lg border-primary hover:bg-accent"
            onClick={() => navigate("/upload-game")}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">➕</div>
              <div className="font-bold">Spiel hochladen</div>
            </div>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
