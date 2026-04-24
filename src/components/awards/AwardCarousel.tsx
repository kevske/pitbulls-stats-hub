import React, { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { AwardCategory } from '@/utils/awardUtils';
import { AwardCard } from './AwardCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface AwardCarouselProps {
  categories: AwardCategory[];
}

export const AwardCarousel: React.FC<AwardCarouselProps> = ({ categories }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'center',
    skipSnaps: false
  });

  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative w-full py-6 md:py-12 px-2 md:px-4 overflow-hidden">
      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex">
          {categories.map((category) => (
            <div key={category.id} className="embla__slide flex-[0_0_100%] min-w-0 px-2 md:px-4">
              <AwardCard category={category} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4 mt-6 md:mt-12">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollPrev}
          className="p-3 md:p-4 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-colors shadow-lg"
          aria-label="Vorheriger Award"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </motion.button>
        
        <div className="flex items-center gap-2 md:gap-3">
          {categories.map((_, index) => (
            <motion.div 
              key={index} 
              initial={false}
              animate={{
                width: index === selectedIndex ? (window.innerWidth < 768 ? 16 : 24) : 8,
                backgroundColor: index === selectedIndex ? "rgb(251, 191, 36)" : "rgba(255, 255, 255, 0.3)"
              }}
              className="h-1.5 md:h-2 rounded-full cursor-pointer"
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollNext}
          className="p-3 md:p-4 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-colors shadow-lg"
          aria-label="Nächster Award"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </motion.button>
      </div>

      {/* Background Glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -ml-32 w-64 h-64 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 -mr-32 w-64 h-64 bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
};
