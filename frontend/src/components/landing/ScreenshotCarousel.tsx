import { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DeviceMockup } from "./DeviceMockup";
import { Lightbox } from "./Lightbox";
import { cn } from "@/lib/utils";

interface Screenshot {
  src: string;
  alt: string;
  type: "iphone" | "android" | "desktop";
  title: string;
}

interface ScreenshotCarouselProps {
  screenshots: Screenshot[];
}

export function ScreenshotCarousel({ screenshots }: ScreenshotCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  if (screenshots.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucune capture d'écran disponible
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-8">
            {screenshots.map((screenshot, index) => (
              <div
                key={index}
                className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0"
              >
                <div
                  className="cursor-pointer group"
                  onClick={() => openLightbox(index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openLightbox(index);
                    }
                  }}
                  aria-label={`Voir ${screenshot.title} en grand`}
                >
                  <DeviceMockup type={screenshot.type} className="group-hover:scale-105 transition-transform duration-300">
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      <div className="text-center p-4">
                        <div className="text-4xl mb-2">📱</div>
                        <p className="text-xs text-muted-foreground">{screenshot.title}</p>
                      </div>
                    </div>
                  </DeviceMockup>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        {screenshots.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10"
              onClick={scrollPrev}
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10"
              onClick={scrollNext}
              aria-label="Image suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <Lightbox
          images={screenshots.map((s) => s.src)}
          currentIndex={selectedIndex}
          isOpen={selectedIndex !== null}
          onClose={closeLightbox}
        />
      )}
    </>
  );
}
