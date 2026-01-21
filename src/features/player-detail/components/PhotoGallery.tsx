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
                            <div key={index} className="aspect-square">
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-border"
                                    onClick={() => onImageClick(index)}
                                    onError={() => onImageError(image.src)}
                                />
                            </div>
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
