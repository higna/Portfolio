import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Sparkles,
  Users,
  Heart,
  Globe,
  ArrowRight,
  Mail,
  Send,
  MessageSquare,
  User,
  PaletteIcon,
  ImageIcon,
  Code2,
} from "lucide-react";
import toast from "react-hot-toast";

const AboutPage = () => {
  /* Navigate to contact section */
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [location]);

  const teamMembers = [
    {
      role: "Creative Director",
      description:
        "Leading the charge in artistic direction, our Creative Director combines a keen sense of style with an innovative approach to projects, ensuring each concept resonates with our brand's essence.",
      image: "/Creative Director.png",
    },
    {
      role: "Art & Architectural Design Director",
      description:
        "Shaping spaces and experiences, our Art & Architectural Design Director combines visionary artistry with structural insight, delivering designs that are both inspiring and functional.",
      image: "/Art Director.png",
    },
    {
      role: "Chief Technical Director",
      description:
        "Leading innovation and technical excellence, our Chief Technical Director ensures every project runs seamlessly, merging cutting-edge solutions with strategic oversight.",
      image: "/Technical Director.png",
    },
  ];

  const culturalPosts = [
    {
      title: "Designs That Speak, Stories That Stick",
      filter: "graphic-design",
      icon: ImageIcon,
    },
    {
      title: "Where Vision Meets Structure.",
      filter: "artwork-painting",
      icon: PaletteIcon,
    },
    {
      title: "Building Digital Experiences That Connect",
      filter: "graphic-design",
      icon: Code2,
    },
  ];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Thank you for your message! We'll get back to you soon.");
    setFormData({
      name: "",
      email: "",
      message: "",
    });
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section - The Genesis */}
      <section className="relative min-h-[56vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/Group.png"
            alt="Hero Background"
            className="absolute inset-0 h-full w-full object-cover object-[50%_50%]"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/50 to-black/70"></div>
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/30 backdrop-blur-md rounded-full text-white font-semibold text-sm border border-primary/40 shadow-lg">
              <Sparkles size={16} className="drop-shadow-glow" />
              <span className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                The Genesis of Jaynstan Espire Enclave
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
              <span className="inline-block bg-black/40 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-2xl border border-white/10">
                Where art meets ambition—our creative journey begins.
              </span>
            </h1>
          </div>
        </div>
      </section>

      {/* A Vision Realized Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full text-primary font-semibold text-sm">
                <Heart size={16} />
                <span>A Vision Realized</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                Founded on a passion for creativity
              </h2>
              <p className="text-lg text-base-content/80 leading-relaxed">
                Jaynstan Espire Enclave emerged from the collective dreams of
                artists and innovators who sought to redefine the boundaries of
                arts, tech, visuals and fashion. Our journey is one of
                perseverance and inspiration, reflecting a vibrant tapestry of
                cultural influences.
              </p>
            </div>
            <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <img
                  src="/Founders.png"
                  alt="Hero Background"
                  className="absolute inset-0 h-full w-full object-cover object-[50%_10%]"
                />

                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-linear-to-b from-black/20 to-black/15"></div>
                  <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Creative Minds */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-base-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full text-primary font-semibold text-sm">
              <Users size={16} />
              <span>Our Creative Minds</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Meet the visionaries shaping our brand's future.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="group bg-base-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300 hover:border-primary/50"
              >
                <div className="relative h-48 rounded-xl overflow-hidden bg-linear-to-br from-primary/10 to-secondary/10 mb-6 flex items-center justify-center">
                  <img
                    src={member.image}
                    alt={member.role}
                    className="absolute inset-0 h-full w-full object-cover object-[50%_15%] origin-center"
                  />
                  <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/15 to-black/10"></div>
                </div>
                <h3 className="text-xl font-bold mb-3">{member.role}</h3>
                <p className="text-base-content/70 leading-relaxed">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivered Works */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-base-300/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-info/20 rounded-full text-info/90 font-semibold text-sm">
              <Globe size={16} />
              <span>Delivered works</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Ideas Realized, Excellence Delivered
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {culturalPosts.map((post, index) => {
              const IconComponent = post.icon; // Remove the array brackets
              return (
                <Link
                  key={index}
                  to={`/services?filter=${post.filter}`}
                  className="group bg-base-100 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-base-300 hover:border-accent/50 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-info/20 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-info" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-lg group-hover:text-accent transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-sm font-medium">Read more</span>
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-base-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left Column - Jaynstan Info and Connect */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Jaynstan
                </h2>
                <p className="text-lg text-base-content/80 leading-relaxed">
                  We are a creative hub dedicated to pushing the boundaries of
                  art, fashion, and innovation.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">Connect</h3>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base-content/80 hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <span>Instagram</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base-content/80 hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <span>Facebook</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base-content/80 hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <span>Twitter</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base-content/80 hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <span>Linkedin</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="bg-base-200 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold">Contact</h3>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium mb-2"
                  >
                    Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-base-100 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-2"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-base-100 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Your message here..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full btn btn-primary gap-2 btn-outline "
                >
                  <Send size={18} />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
