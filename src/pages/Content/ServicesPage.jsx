import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router";
import { Filter, Code, Palette, Brush, Building2, X } from "lucide-react";

const ServicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // Support both "filter" and "service" query parameters for flexibility
  const activeFilter = searchParams.get("filter") || searchParams.get("service") || "all";

  // Portfolio categories
  const categories = [
    { id: "all", name: "All", icon: Filter },
    { id: "software-development", name: "Software Development", icon: Code },
    { id: "graphic-design", name: "Graphic Design", icon: Palette },
    { id: "artwork-painting", name: "Artwork | Painting", icon: Brush },
    { id: "architecture", name: "Architecture", icon: Building2 },
  ];

  // Sample portfolio items - in production, this would come from an API
  const allPortfolioItems = [
    // Software Development
    {
      id: 1,
      title: "E-Commerce Platform",
      category: "software-development",
      description: "A full-stack e-commerce solution with modern UI/UX",
      image: "/placeholder-project.jpg",
    },
    {
      id: 2,
      title: "Mobile App Development",
      category: "software-development",
      description: "Cross-platform mobile application for iOS and Android",
      image: "/placeholder-project.jpg",
    },
    {
      id: 3,
      title: "Web Dashboard",
      category: "software-development",
      description: "Analytics dashboard with real-time data visualization",
      image: "/placeholder-project.jpg",
    },
    {
      id: 4,
      title: "API Integration",
      category: "software-development",
      description: "RESTful API development and third-party integrations",
      image: "/placeholder-project.jpg",
    },
    // Graphic Design
    {
      id: 5,
      title: "Brand Identity Design",
      category: "graphic-design",
      description: "Complete brand identity package with logo and guidelines",
      image: "/placeholder-project.jpg",
    },
    {
      id: 6,
      title: "Poster Design",
      category: "graphic-design",
      description: "Creative poster designs for events and campaigns",
      image: "/placeholder-project.jpg",
    },
    {
      id: 7,
      title: "Social Media Graphics",
      category: "graphic-design",
      description: "Eye-catching graphics for social media platforms",
      image: "/placeholder-project.jpg",
    },
    {
      id: 8,
      title: "Packaging Design",
      category: "graphic-design",
      description: "Innovative packaging solutions for product launches",
      image: "/placeholder-project.jpg",
    },
    // Artwork | Painting
    {
      id: 9,
      title: "Abstract Expressionism",
      category: "artwork-painting",
      description: "Contemporary abstract paintings exploring color and form",
      image: "/placeholder-project.jpg",
    },
    {
      id: 10,
      title: "Portrait Series",
      category: "artwork-painting",
      description: "Collection of expressive portrait paintings",
      image: "/placeholder-project.jpg",
    },
    {
      id: 11,
      title: "Landscape Art",
      category: "artwork-painting",
      description: "Nature-inspired landscape paintings",
      image: "/placeholder-project.jpg",
    },
    {
      id: 12,
      title: "Digital Art Collection",
      category: "artwork-painting",
      description: "Modern digital artwork blending traditional and digital techniques",
      image: "/placeholder-project.jpg",
    },
    // Architecture
    {
      id: 13,
      title: "Modern Residential Design",
      category: "architecture",
      description: "Contemporary residential architecture with sustainable features",
      image: "/placeholder-project.jpg",
    },
    {
      id: 14,
      title: "Commercial Complex",
      category: "architecture",
      description: "Large-scale commercial building design and planning",
      image: "/placeholder-project.jpg",
    },
    {
      id: 15,
      title: "Interior Architecture",
      category: "architecture",
      description: "Innovative interior space design and planning",
      image: "/placeholder-project.jpg",
    },
    {
      id: 16,
      title: "Urban Planning",
      category: "architecture",
      description: "Sustainable urban development and city planning",
      image: "/placeholder-project.jpg",
    },
  ];

  // Shuffle array function for random display
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Filter and shuffle portfolio items
  const filteredItems = useMemo(() => {
    let items =
      activeFilter === "all"
        ? allPortfolioItems
        : allPortfolioItems.filter(
            (item) => item.category === activeFilter
          );
    return shuffleArray(items);
  }, [activeFilter]);

  const handleFilterChange = (filterId) => {
    if (filterId === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ filter: filterId });
    }
  };

  // Clear filter function
  const clearFilter = () => {
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-primary/10 via-secondary/5 to-accent/10">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            Our Services
          </h1>
          <p className="text-lg md:text-xl text-base-content/80 max-w-2xl mx-auto">
            Explore our diverse collection of creative works across multiple
            disciplines
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="sticky top-20 z-40 bg-base-100/80 backdrop-blur-md border-b border-base-300 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 justify-center">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isActive = activeFilter === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => handleFilterChange(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-primary-content shadow-lg scale-105"
                      : "bg-base-200 hover:bg-base-300 text-base-content"
                  }`}
                >
                  <IconComponent size={18} />
                  <span>{category.name}</span>
                </button>
              );
            })}
            {activeFilter !== "all" && (
              <button
                onClick={clearFilter}
                className="flex items-center gap-2 px-4 py-2 rounded-full font-medium bg-error/20 hover:bg-error/30 text-error transition-all duration-300"
                aria-label="Clear filter"
              >
                <X size={18} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-base-content/60">
                No items found in this category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => {
                const categoryInfo = categories.find(
                  (cat) => cat.id === item.category
                );
                const CategoryIcon = categoryInfo?.icon || Filter;
                return (
                  <div
                    key={item.id}
                    className="group bg-base-100 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300 hover:border-primary/50"
                  >
                    <div className="relative h-48 bg-linear-to-br from-primary/20 to-secondary/20 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CategoryIcon className="w-16 h-16 text-primary/50 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-base-100/90 backdrop-blur-sm rounded-full text-xs font-medium text-base-content">
                          {categoryInfo?.name}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 space-y-3">
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-base-content/70 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
