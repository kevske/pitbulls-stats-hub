import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { BASE_PATH } from '@/config';

interface TeamImage {
  src: string;
  alt: string;
  filename: string;
}

const TeamGallery: React.FC = () => {
  const [teamImages, setTeamImages] = useState<TeamImage[]>([]);
  const [loadedImages, setLoadedImages] = useState<TeamImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  useEffect(() => {
    // Load team images from the photos directory
    const images: TeamImage[] = [];
    for (let i = 1; i <= 16; i++) {
      const num = i.toString().padStart(2, '0');
      images.push({
        src: `${BASE_PATH}/photos/Team-${num}.jpeg`,
        alt: `Team Photo ${num}`,
        filename: `Team-${num}.jpeg`
      });
    }
    setTeamImages(images);
    setLoadedImages(images); // Initially assume all images will load
  }, []);

  // Gallery navigation functions
  const openImageAtIndex = useCallback((index: number) => {
    if (loadedImages.length === 0) return;
    const safeIndex = Math.min(index, loadedImages.length - 1);
    setCurrentGalleryIndex(safeIndex);
    setSelectedImage(loadedImages[safeIndex].src);
  }, [loadedImages]);

  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    if (loadedImages.length === 0) return;

    let newIndex;
    if (direction === 'prev') {
      newIndex = currentGalleryIndex === 0 ? loadedImages.length - 1 : currentGalleryIndex - 1;
    } else {
      newIndex = currentGalleryIndex === loadedImages.length - 1 ? 0 : currentGalleryIndex + 1;
    }

    setCurrentGalleryIndex(newIndex);
    setSelectedImage(loadedImages[newIndex].src);
  }, [currentGalleryIndex, loadedImages]);

  const handleImageError = (failedImageSrc: string) => {
    setLoadedImages(prev => prev.filter(img => img.src !== failedImageSrc));
    // If current image fails, navigate to next available
    if (selectedImage === failedImageSrc && loadedImages.length > 1) {
      navigateImage('next');
    }
  };

  // Keyboard navigation for modal
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      } else if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, navigateImage]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Team Galerie</h2>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {loadedImages.length > 0 ? (
          loadedImages.map((image, index) => (
            <div key={index} className="aspect-square">
              <div
                role="button"
                tabIndex={0}
                className="w-full h-full rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => openImageAtIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openImageAtIndex(index);
                  }
                }}
                aria-label={`View ${image.alt}`}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(image.src)}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 bg-muted/50 rounded-lg">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Keine Teamfotos gefunden.
            </p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          {/* Left Arrow */}
          {loadedImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                navigateImage('prev');
              }}
              className="absolute left-4 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Right Arrow */}
          {loadedImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                navigateImage('next');
              }}
              className="absolute right-4 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          )}

          <div
            className="max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              className="self-end text-white text-2xl mb-2 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
              aria-label="Close"
            >
              &times;
            </button>
            <div className="flex-1 flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Enlarged view"
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
            {loadedImages.length > 1 && (
              <div className="text-center text-white mt-2">
                {currentGalleryIndex + 1} / {loadedImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamGallery;
