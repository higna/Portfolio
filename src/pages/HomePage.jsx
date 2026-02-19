import {
  Building,
  Code2,
  ImageIcon,
  Mail,
  Palette,
  Sparkles,
  Users,
  Award,
  TrendingUp,
  ArrowRight,
  Star,
  Zap,
  Heart,
  Target,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link } from "react-router";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/Hero.png"
            alt="Hero Background"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/50 to-black/70"></div>
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 text-primary animate-[slideInLeft_0.8s_ease-out_both]">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white font-semibold text-sm border border-white/30">
                  <Sparkles size={16} />
                  <span>JaynStan Espire Enclave</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
                  A{" "}
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-white">
                    Creative Hub for Visionaries
                  </span>{" "}
                </h1>
                <p className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-xl">
                  Designs | Arts | Tech | Management | Fashion | Lifestyle
                </p>
              </div>
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/about"
                  className="btn btn-primary btn-lg rounded-full gap-2"
                >
                  Learn More
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/services"
                  className="btn btn-outline btn-lg rounded-full gap-2 text-white border-white/30 hover:bg-white/10"
                >
                  <Mail size={18} />
                  Our Services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Services*/}
      <section className="py-16 md:py-16 bg-base-300">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12 animate-[fallIn_0.6s_ease-out_0.1s_both]">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Core Services
            </h2>
            <p className="text-base-content/70 max-w-2xl mx-auto">
              We bring your vision to life with our comprehensive range of
              creative and technical services
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Software Development Card */}
            <Link
              to="/services?filter=software-development"
              className="card bg-base-200 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer animate-[fallIn_0.6s_ease-out_0.1s_both] group"
            >
              <div className="card-body items-center text-center">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4 group-hover:bg-success/30 transition-colors">
                  <Code2 size={24} className="text-success" />
                </div>
                <h3 className="card-title text-xl mb-2 group-hover:text-success transition-colors">
                  Software Development
                </h3>
                <p className="text-base-content/70">
                  Custom software solutions tailored to your business needs with
                  cutting-edge technology
                </p>
              </div>
            </Link>

            {/* Graphic Design Card */}
            <Link
              to="/services?filter=graphic-design"
              className="card bg-base-200 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer animate-[fallIn_0.6s_ease-out_0.2s_both] group"
            >
              <div className="card-body items-center text-center">
                <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mb-4 group-hover:bg-warning/30 transition-colors">
                  <ImageIcon size={24} className="text-warning" />
                </div>
                <h3 className="card-title text-xl mb-2 group-hover:text-warning transition-colors">
                  Graphic Design
                </h3>
                <p className="text-base-content/70">
                  Eye-catching visual designs that communicate your brand's
                  message effectively
                </p>
              </div>
            </Link>

            {/* Painting Card */}
            <Link
              to="/services?filter=artwork-painting"
              className="card bg-base-200 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer animate-[fallIn_0.6s_ease-out_0.3s_both] group"
            >
              <div className="card-body items-center text-center">
                <div className="w-16 h-16 rounded-full bg-info/20 flex items-center justify-center mb-4 group-hover:bg-info/30 transition-colors">
                  <Palette size={24} className="text-info" />
                </div>
                <h3 className="card-title text-xl mb-2 group-hover:text-info transition-colors">
                  Artwork | Painting
                </h3>
                <p className="text-base-content/70">
                  Professional painting services that transform spaces with
                  color and creativity
                </p>
              </div>
            </Link>

            {/* Architecture Card */}
            <Link
              to="/services?filter=architecture"
              className="card bg-base-200 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer animate-[fallIn_0.6s_ease-out_0.4s_both] group"
            >
              <div className="card-body items-center text-center">
                <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mb-4 group-hover:bg-error/30 transition-colors">
                  <Building size={24} className="text-error" />
                </div>
                <h3 className="card-title text-xl mb-2 group-hover:text-error transition-colors">
                  Architecture
                </h3>
                <p className="text-base-content/70">
                  Innovative architectural designs that blend functionality with
                  aesthetic appeal
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-base-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Award className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-primary">
                500+
              </div>
              <div className="text-sm md:text-base text-base-content/70">
                Projects Completed
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-secondary" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-secondary">
                200+
              </div>
              <div className="text-sm md:text-base text-base-content/70">
                Happy Clients
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-accent" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-accent">
                10+
              </div>
              <div className="text-sm md:text-base text-base-content/70">
                Years Experience
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                  <Star className="w-8 h-8 text-success" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-success">
                98%
              </div>
              <div className="text-sm md:text-base text-base-content/70">
                Client Satisfaction
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto">
        <div className="border-t border" />
      </div>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-base-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Why Choose Us
            </h2>
            <p className="text-lg text-base-content/80 max-w-2xl mx-auto">
              We combine creativity, innovation, and expertise to deliver
              exceptional results
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-base-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Innovation First</h3>
              <p className="text-base-content/70 leading-relaxed">
                We stay ahead of trends and leverage cutting-edge technologies
                to deliver forward-thinking solutions that set you apart from
                the competition.
              </p>
            </div>
            <div className="bg-base-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300">
              <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
                <Heart className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Client-Centric</h3>
              <p className="text-base-content/70 leading-relaxed">
                Your vision is our priority. We work closely with you throughout
                the process, ensuring every project reflects your unique brand
                and goals.
              </p>
            </div>
            <div className="bg-base-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300">
              <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Excellence Guaranteed</h3>
              <p className="text-base-content/70 leading-relaxed">
                Quality is never compromised. We maintain the highest standards
                in every project, from concept to completion, ensuring
                outstanding results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Portfolio Preview - Sliding Carousel */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-base-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Featured Work
            </h2>
            <p className="text-lg text-base-content/80 max-w-2xl mx-auto">
              Explore some of our recent projects across different creative
              disciplines
            </p>
          </div>

          {/* Carousel Container */}
          <div className="relative overflow-hidden mb-8">
            <div className="flex gap-6 carousel-track">
              {/* Duplicate items for seamless loop - 6 items duplicated */}
              {[
                ...Array.from({ length: 6 }, (_, i) => ({
                  id: i + 1,
                  title: `Featured Project ${i + 1}`,
                  category: [
                    "Software",
                    "Design",
                    "Art",
                    "Architecture",
                    "Tech",
                    "Creative",
                  ][i],
                })),
                ...Array.from({ length: 6 }, (_, i) => ({
                  id: i + 7,
                  title: `Featured Project ${i + 1}`,
                  category: [
                    "Software",
                    "Design",
                    "Art",
                    "Architecture",
                    "Tech",
                    "Creative",
                  ][i],
                })),
              ].map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="group relative shrink-0 carousel-card h-64 rounded-2xl overflow-hidden bg-linear-to-br from-primary/20 to-secondary/20 hover:shadow-xl transition-all duration-300 cursor-pointer border border-base-300"
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                    <div className="text-center space-y-3">
                      <Sparkles className="w-12 h-12 mx-auto text-primary/50 group-hover:scale-110 transition-transform" />
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-base-content/60 italic">
                        {item.category}
                      </p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/services"
              className="btn btn-primary btn-lg rounded-full gap-2"
            >
              View Full Portfolio
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .carousel-track {
          animation: slide 30s linear infinite;
          display: flex;
        }
        .carousel-track:hover {
          animation-play-state: paused;
        }
        .carousel-card {
          width: calc(100vw - 2rem);
          min-width: calc(100vw - 2rem);
        }
        @media (min-width: 768px) {
          .carousel-card {
            width: calc((100% - 3rem) / 3);
            min-width: calc((100% - 3rem) / 3);
          }
        }
        @keyframes slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-50% - 1.5rem));
          }
        }
        @media (max-width: 768px) {
          .carousel-track {
            animation-duration: 20s;
          }
        }
      `}</style>

      {/* Divider Section */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-secondary/5 to-accent/10"></div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div>
          <img
            src="/Group.png"
            alt="Divider Background"
            className="absolute inset-0 h-full w-full object-cover object-[50%_50%]"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/30 to-black/40"></div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-base-100">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Ready to Bring Your Vision to Life?
            </h2>
            <p className="text-lg text-base-content/80 max-w-2xl mx-auto">
              Let's collaborate and create something extraordinary together. Get
              in touch with us today to discuss your project.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/about#contact"
              className="btn btn-primary btn-lg rounded-full gap-2"
            >
              <Mail size={18} />
              Contact Us
            </Link>
            <Link
              to="/services"
              className="btn btn-outline btn-lg rounded-full gap-2"
            >
              Explore Services
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
