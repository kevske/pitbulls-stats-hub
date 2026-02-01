import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageModalProps {
    selectedImage: string | null;
    onClose: () => void;
    onNavigate: (direction: 'prev' | 'next') => void;
    currentIndex: number;
    totalImages: number;
}

export const ImageModal: React.FC<ImageModalProps> = ({
    selectedImage,
    onClose,
    onNavigate,
    currentIndex,
    totalImages
}) => {
    // Handle keyboard navigation
    useEffect(() => {
        if (!selectedImage) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowLeft') {
                onNavigate('prev');
            } else if (e.key === 'ArrowRight') {
                onNavigate('next');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImage, onClose, onNavigate]);

    if (!selectedImage) return null;

    return (
        <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Bildansicht"
        >
            {/* Left Arrow */}
            {totalImages > 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onNavigate('prev');
                    }}
                    className="absolute left-4 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors z-10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                    aria-label="Vorheriges Bild"
                >
                    <ChevronLeft size={24} />
                </button>
            )}

            {/* Right Arrow */}
            {totalImages > 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onNavigate('next');
                    }}
                    className="absolute right-4 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors z-10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                    aria-label="Nächstes Bild"
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
                        onClose();
                    }}
                    className="self-end text-white p-2 mb-2 hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none rounded-full"
                    aria-label="Schließen"
                >
                    <X size={24} />
                </button>
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                    <img
                        src={selectedImage}
                        alt={`Bild ${currentIndex + 1} von ${totalImages}`}
                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                    />
                </div>
                {totalImages > 1 && (
                    <div className="text-center text-white/90 mt-4 font-medium">
                        {currentIndex + 1} / {totalImages}
                    </div>
                )}
            </div>
        </div>
    );
};
