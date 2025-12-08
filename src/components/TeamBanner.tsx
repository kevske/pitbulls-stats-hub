import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TeamImage {
  src: string;
  alt: string;
  filename: string;
}

const TeamBanner: React.FC = () => {
  const [teamImages, setTeamImages] = useState<TeamImage[]>([]);
  const [randomImageStream, setRandomImageStream] = useState<TeamImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Load team images from the photos directory
    const images: TeamImage[] = [];
    for (let i = 1; i <= 16; i++) {
      const num = i.toString().padStart(2, '0');
      images.push({
        src: `/pitbulls-stats-hub/photos/Team-${num}.jpeg`,
        alt: `Team Photo ${num}`,
        filename: `Team-${num}.jpeg`
      });
    }
    setTeamImages(images);
  }, []);

  // Create random stream of images for banner
  const createRandomImageStream = (images: TeamImage[]) => {
    if (images.length === 0) return [];
    
    // Create a shuffled array and repeat it multiple times for continuous scrolling
    const shuffled = [...images].sort(() => Math.random() - 0.5);
    const stream = [];
    
    // Repeat the shuffled array 3 times for seamless scrolling
    for (let i = 0; i < 3; i++) {
      stream.push(...shuffled);
    }
    
    return stream;
  };

  // Update random stream when team images change
  useEffect(() => {
    if (teamImages.length > 0) {
      setRandomImageStream(createRandomImageStream(teamImages));
    }
  }, [teamImages]);

  const navigateImage = (direction: 'prev' | 'next') => {
    if (teamImages.length === 0) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentImageIndex === 0 ? teamImages.length - 1 : currentImageIndex - 1;
    } else {
      newIndex = currentImageIndex === teamImages.length - 1 ? 0 : currentImageIndex + 1;
    }
    
    setCurrentImageIndex(newIndex);
  };

  return (
    <div className="relative h-64 md:h-80 overflow-hidden">
      {randomImageStream.length > 0 ? (
        <>
          <div className="absolute inset-0 flex">
            <div className="flex animate-scroll">
              {/* Use the random stream of different images */}
              {randomImageStream.map((image, index) => (
                <img
                  key={`${image.filename}-${index}`}
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover object-center flex-shrink-0"
                  style={{ minWidth: '100%' }}
                  onError={(e) => {
                    console.error('Failed to load banner image:', image.src);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Navigation arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateImage('prev');
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors z-10"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateImage('next');
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors z-10"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </>
      ) : (
        // Fallback to light blue background
        <div className="absolute inset-0 bg-accent" />
      )}
      
      {/* Team info overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-background rounded-full overflow-hidden border-4 border-background shadow-elegant mx-auto mb-4">
            <img
              src="/pitbulls-stats-hub/photos/profile.jpg"
              alt="Team Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/pitbulls-stats-hub/placeholder-player.png';
              }}
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Pitbulls <span className="text-primary">Blaufelden</span>
          </h1>
          <div className="flex flex-wrap justify-center gap-4 text-white/90">
            <span className="font-medium">Basketball Team</span>
            <span className="font-medium">2024/2025 Season</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamBanner;
