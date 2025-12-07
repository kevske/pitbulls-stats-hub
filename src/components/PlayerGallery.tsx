import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface GalleryImage {
  path: string;
  date: string;
  formattedDate: string;
}

interface PlayerGalleryProps {
  playerName: string;
}

// Helper function to format date
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const PlayerGallery = ({ playerName }: PlayerGalleryProps) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // This would be replaced with an actual API call in production
    // For now, we'll use a placeholder that will be replaced with actual images
    
    // In a real implementation, you would have an API endpoint that returns the list of images
    // Example: const response = await fetch(`/api/players/${playerName}/images`);
    // const imageFiles = await response.json();
    
    // For now, we'll use an empty array and the component will show "Keine Bilder verfügbar"
    const imageFiles: string[] = [];
    
    const processedImages = imageFiles
      .map(path => {
        // Extract date from filename (format: YYYY-MM-DD-playername-XX.extension)
        const dateMatch = path.match(/^(\d{4}-\d{2}-\d{2})/);
        if (!dateMatch) return null;
        
        const dateStr = dateMatch[1];
        
        return {
          path: `/players/${playerName}/${path}`,
          date: dateStr,
          formattedDate: formatDate(dateStr)
        };
      })
      .filter((img): img is GalleryImage => img !== null)
      .sort((a, b) => b.date.localeCompare(a.date));
      
    setImages(processedImages);
    setIsLoading(false);
  }, [playerName]);

  if (isLoading) {
    return <div className="mt-8">Lade Bilder...</div>;
  }

  if (images.length === 0) {
    return <div className="mt-8">Keine Bilder verfügbar.</div>;
  }

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold mb-4">Galerie</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((img, index) => (
          <motion.div 
            key={index}
            className="group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedImage(img)}
          >
            <div className="relative aspect-square overflow-hidden rounded-lg mb-2">
              <LazyLoadImage
                src={img.path}
                alt={`${playerName} - ${img.date}`}
                effect="blur"
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                placeholderSrc="/placeholder.jpg"
              />
            </div>
            <div className="text-center text-sm text-gray-600">
              {img.formattedDate}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="absolute -top-12 right-0 flex items-center gap-4">
              <span className="text-white text-lg">
                {selectedImage.formattedDate}
              </span>
              <button 
                className="text-white text-2xl hover:text-gray-300 transition-colors"
                onClick={() => setSelectedImage(null)}
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>
            <div className="bg-white p-1 rounded-lg shadow-2xl">
              <LazyLoadImage
                src={selectedImage.path}
                alt={`${playerName} - ${selectedImage.date}`}
                className="max-w-full max-h-[80vh] mx-auto rounded"
                effect="blur"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerGallery;
