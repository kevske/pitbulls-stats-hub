import React from 'react';
import { ImageIcon } from "lucide-react";
import { GalleryImage } from "../hooks/usePlayerGallery";

interface PhotoGalleryProps {
    images: GalleryImage[];
    isLoading: boolean;
    onImageClick: (index: number) => void;
    onImageError: (src: string) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
    images,
    isLoading,
    onImageClick,
    onImageError
}) => {
    return (
        <div id="photo-gallery" className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Galerie</h2>
            {!isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.length > 0 ? (
                        images.map((image, index) => (
                            <button
                                key={index}
                                type="button"
                                className="aspect-square w-full p-0 overflow-hidden rounded-lg border border-border hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
                                onClick={() => onImageClick(index)}
                                aria-label={`Bild ${index + 1} von ${images.length} anzeigen`}
                            >
                                <img
                                    src={image.src}
                                    alt={image.alt || `Galeriebild ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={() => onImageError(image.src)}
                                />
                            </button>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-8 bg-muted/50 rounded-lg">
                            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                                Keine Galeriebilder für diesen Spieler gefunden.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">
                        Lade Spielerdaten...
                    </p>
                </div>
            )}
        </div>
    );
};
