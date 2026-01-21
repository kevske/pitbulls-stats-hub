import React from 'react';
import { BASE_PATH } from '@/config';
import { calculateAge } from '@/utils/dateUtils';
import { PlayerStats } from '@/types/stats';
import { GalleryImage } from '../hooks/usePlayerGallery';

interface PlayerHeaderProps {
    player: PlayerStats;
    randomImageStream: GalleryImage[];
    loadedImages: GalleryImage[];
    scrollToGallery: () => void;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
    player,
    randomImageStream,
    loadedImages,
    scrollToGallery
}) => {
    return (
        <div className="relative h-64 md:h-80 overflow-hidden cursor-pointer" onClick={scrollToGallery}>
            {randomImageStream.length > 0 ? (
                <>
                    <div className="absolute inset-0 flex">
                        <div
                            className="flex animate-scroll hover:pause"
                            style={{
                                '--scroll-duration': `${loadedImages.length * 15}s`
                            } as React.CSSProperties}
                        >
                            {/* Use the random stream of different images */}
                            {randomImageStream.map((image, index) => (
                                <img
                                    key={`${image.src}-${index}`}
                                    src={image.src}
                                    alt={image.alt}
                                    className="h-full w-auto max-w-none object-cover flex-shrink-0"
                                    onError={(e) => {
                                        console.error('Failed to load banner image:', image.src);
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 bg-white/20 backdrop-blur-sm text-white rounded-full p-2 text-sm font-medium">
                        Zur Galerie
                    </div>
                </>
            ) : (
                // Fallback to light blue background
                <div className="absolute inset-0 bg-accent" />
            )}

            {/* Player info overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-background rounded-full overflow-hidden border-4 border-background shadow-elegant mx-auto mb-4">
                        <img
                            src={player.imageUrl || `${BASE_PATH}/placeholder-player.png`}
                            alt={`${player.firstName} ${player.lastName}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `${BASE_PATH}/placeholder-player.png`;
                            }}
                        />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                        {player.firstName} <span className="text-primary">{player.lastName}</span>
                    </h1>
                    <div className="flex flex-wrap justify-center gap-4 text-white/90">
                        {player.jerseyNumber && (
                            <span>
                                <span className="font-medium">#</span>{player.jerseyNumber}
                            </span>
                        )}
                        {player.position && (
                            <span>
                                <span className="font-medium">Position:</span> {player.position}
                            </span>
                        )}
                        {(player.age || calculateAge(player.birthDate)) && (
                            <span>
                                <span className="font-medium">Alter:</span> {player.age || calculateAge(player.birthDate)}
                            </span>
                        )}
                        {player.height && (
                            <span>
                                <span className="font-medium">Größe:</span> {player.height}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
