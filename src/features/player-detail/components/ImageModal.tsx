import React from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    if (!selectedImage) return null;

    return (
        <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Left Arrow */}
            {totalImages > 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onNavigate('prev');
                    }}
                    className="absolute left-4 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors z-10"
                    aria-label="Previous image"
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
                    className="absolute right-4 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors z-10"
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
                        onClose();
                    }}
                    className="self-end text-white text-2xl mb-2 hover:text-primary transition-colors"
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
                {totalImages > 1 && (
                    <div className="text-center text-white mt-2">
                        {currentIndex + 1} / {totalImages}
                    </div>
                )}
            </div>
        </div>
    );
};
