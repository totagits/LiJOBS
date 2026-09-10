import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

import carouselOffice from "@/assets/images/carousel-office.png";
import carouselConstruction from "@/assets/images/carousel-construction.png";
import carouselEntrepreneur from "@/assets/images/carousel-entrepreneur.png";
import carouselAgriculture from "@/assets/images/carousel-agriculture.png";
import carouselHealthcare from "@/assets/images/carousel-healthcare.png";

interface CarouselImage {
  id: string;
  src: string;
  title: string;
  description: string;
  sector: string;
  jobs: string;
}

const images: CarouselImage[] = [
  {
    id: "office",
    src: carouselOffice,
    title: "Corporate & Professional Services",
    description: "Building Liberia's modern workforce through professional development and corporate excellence.",
    sector: "Private Sector",
    jobs: "124,500+ Jobs",
  },
  {
    id: "construction",
    src: carouselConstruction,
    title: "Infrastructure & Construction",
    description: "Rebuilding Liberia's future through strategic infrastructure development and skilled labor.",
    sector: "Construction",
    jobs: "89,200+ Jobs",
  },
  {
    id: "entrepreneur",
    src: carouselEntrepreneur,
    title: "Small Business & Entrepreneurship",
    description: "Empowering Liberian entrepreneurs and small business owners across all counties.",
    sector: "MSME",
    jobs: "201,300+ Jobs",
  },
  {
    id: "agriculture",
    src: carouselAgriculture,
    title: "Agriculture & Agribusiness",
    description: "Supporting sustainable farming and food security through agricultural employment.",
    sector: "Agriculture",
    jobs: "312,400+ Jobs",
  },
  {
    id: "healthcare",
    src: carouselHealthcare,
    title: "Healthcare & Medical Services",
    description: "Strengthening Liberia's healthcare system with skilled medical professionals.",
    sector: "Healthcare",
    jobs: "45,600+ Jobs",
  },
];

export function ImageCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [api, setApi] = useState<any>();

  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setActiveIndex(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section
      id="sectors"
      className="py-20"
      data-testid="carousel-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            Employment Sectors
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" data-testid="text-carousel-title">
            Empowering Every Sector
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From agriculture to technology, we track and verify job creation across all economic sectors of Liberia
          </p>
        </motion.div>

        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
            data-testid="image-carousel"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {images.map((image, index) => (
                <CarouselItem
                  key={image.id}
                  className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
                >
                  <Card
                    className="overflow-hidden group cursor-pointer hover-elevate"
                    data-testid={`carousel-item-${image.id}`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={image.src}
                        alt={image.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className="bg-primary/90 text-primary-foreground">
                          {image.sector}
                        </Badge>
                        <Badge variant="secondary" className="bg-white/90 text-foreground">
                          {image.jobs}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-xl font-bold text-white mb-2">
                          {image.title}
                        </h3>
                        <p className="text-white/80 text-sm line-clamp-2">
                          {image.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious
              className="hidden md:flex -left-4 bg-background shadow-lg border"
              data-testid="carousel-prev"
            />
            <CarouselNext
              className="hidden md:flex -right-4 bg-background shadow-lg border"
              data-testid="carousel-next"
            />
          </Carousel>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "w-8 bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                data-testid={`carousel-dot-${index}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
