/**
 * Player gallery hook - manages gallery images, navigation, and modal state
 */
import { useState, useEffect, useCallback } from 'react';
import { BASE_PATH } from '@/config';
import playerImagesData from '@/data/playerImages.json';

export interface GalleryImage {
    src: string;
    alt: string;
    date?: string;
}

interface PlayerImagesData {
    [playerSlug: string]: {
        src: string;
        alt: string;
        filename: string;
    }[];
}

interface UsePlayerGalleryProps {
    playerSlug: string | undefined;
}

interface UsePlayerGalleryReturn {
    /** All gallery images for the player */
    galleryImages: GalleryImage[];
    /** Successfully loaded images */
    loadedImages: GalleryImage[];
    /** Currently selected image URL (for modal) */
    selectedImage: string | null;
    /** Current index in the gallery */
    currentGalleryIndex: number;
    /** Randomized stream for banner animation */
    randomImageStream: GalleryImage[];
    /** Open image modal at specific index */
    openImageAtIndex: (index: number) => void;
    /** Navigate to prev/next image in modal */
    navigateImage: (direction: 'prev' | 'next') => void;
    /** Handle image load error */
    handleImageError: (failedImageSrc: string) => void;
    /** Close the image modal */
    closeModal: () => void;
    /** Scroll to gallery section */
    scrollToGallery: () => void;
}

/**
 * Hook for managing player gallery state and navigation
 */
export function usePlayerGallery({ playerSlug }: UsePlayerGalleryProps): UsePlayerGalleryReturn {
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [loadedImages, setLoadedImages] = useState<GalleryImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
    const [randomImageStream, setRandomImageStream] = useState<GalleryImage[]>([]);

    // Load gallery images when player slug changes
    useEffect(() => {
        if (!playerSlug) {
            setGalleryImages([]);
            setLoadedImages([]);
            return;
        }

        console.log('Loading gallery images for player:', playerSlug);

        // Use the pre-generated image data
        const images = (playerImagesData as PlayerImagesData)[playerSlug];

        if (images && images.length > 0) {
            console.log(`Found ${images.length} images for ${playerSlug}`);
            const processedImages = images.map(img => {
                // Strip the hardcoded /pitbulls-stats-hub prefix from JSON paths and use dynamic BASE_PATH
                const relativePath = img.src.replace('/pitbulls-stats-hub', '');
                return {
                    src: `${BASE_PATH}${relativePath}`,
                    alt: img.alt
                };
            });
            setGalleryImages(processedImages);
            setLoadedImages(processedImages);
        } else {
            console.log(`No gallery images found for ${playerSlug}`);
            setGalleryImages([]);
            setLoadedImages([]);
        }
    }, [playerSlug]);

    // Create random stream of images for banner animation
    const createRandomImageStream = useCallback((images: GalleryImage[]): GalleryImage[] => {
        if (images.length === 0) return [];

        // Create a shuffled array and repeat it for continuous scrolling
        const shuffled = [...images].sort(() => Math.random() - 0.5);
        const stream: GalleryImage[] = [];

        // Repeat 2 times for seamless scrolling
        for (let i = 0; i < 2; i++) {
            stream.push(...shuffled);
        }

        return stream;
    }, []);

    // Update random stream when loaded images change
    useEffect(() => {
        if (loadedImages.length > 0) {
            setRandomImageStream(createRandomImageStream(loadedImages));
        }
    }, [loadedImages, createRandomImageStream]);

    // Gallery navigation functions
    const openImageAtIndex = useCallback((index: number) => {
        if (loadedImages.length === 0) return;
        const safeIndex = Math.min(index, loadedImages.length - 1);
        setCurrentGalleryIndex(safeIndex);
        setSelectedImage(loadedImages[safeIndex].src);
    }, [loadedImages]);

    const navigateImage = useCallback((direction: 'prev' | 'next') => {
        if (loadedImages.length === 0) return;

        let newIndex: number;
        if (direction === 'prev') {
            newIndex = currentGalleryIndex === 0 ? loadedImages.length - 1 : currentGalleryIndex - 1;
        } else {
            newIndex = currentGalleryIndex === loadedImages.length - 1 ? 0 : currentGalleryIndex + 1;
        }

        setCurrentGalleryIndex(newIndex);
        setSelectedImage(loadedImages[newIndex].src);
    }, [loadedImages, currentGalleryIndex]);

    const handleImageError = useCallback((failedImageSrc: string) => {
        setLoadedImages(prev => prev.filter(img => img.src !== failedImageSrc));
        // If current image fails, navigate to next available
        if (selectedImage === failedImageSrc && loadedImages.length > 1) {
            navigateImage('next');
        }
    }, [selectedImage, loadedImages.length, navigateImage]);

    const closeModal = useCallback(() => {
        setSelectedImage(null);
    }, []);

    const scrollToGallery = useCallback(() => {
        const galleryElement = document.getElementById('photo-gallery');
        if (galleryElement) {
            galleryElement.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    return {
        galleryImages,
        loadedImages,
        selectedImage,
        currentGalleryIndex,
        randomImageStream,
        openImageAtIndex,
        navigateImage,
        handleImageError,
        closeModal,
        scrollToGallery
    };
}
