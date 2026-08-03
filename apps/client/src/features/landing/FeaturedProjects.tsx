import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, ArrowRight, Send } from 'lucide-react';
import { FiGithub } from 'react-icons/fi';
import api from '../../lib/api';

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  techStack: string[];
  liveUrl: string | null;
  githubUrl: string | null;
  imageUrl: string | null;
}

const quickPrompts = [
  'I need his CV',
  'Tell me about his projects',
  'I need a service',
  'What technologies does he use?',
];

function SkeletonProjectCard() {
  return (
    <div className="shrink-0 w-75 sm:w-[320px] card bg-base-100 shadow-md border border-base-content/5 p-5 animate-pulse">
      <div className="h-48 bg-base-300 rounded-lg mb-4" />
      <div className="h-5 w-3/4 bg-base-300 rounded mb-2" />
      <div className="h-4 w-full bg-base-300 rounded mb-2" />
      <div className="h-4 w-5/6 bg-base-300 rounded mb-4" />
      <div className="flex gap-1 mb-4">
        <div className="h-4 w-12 bg-base-300 rounded" />
        <div className="h-4 w-12 bg-base-300 rounded" />
        <div className="h-4 w-12 bg-base-300 rounded" />
      </div>
      <div className="flex justify-end gap-2">
        <div className="h-8 w-16 bg-base-300 rounded" />
        <div className="h-8 w-16 bg-base-300 rounded" />
      </div>
    </div>
  );
}

export default function FeaturedProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/portfolio/projects')
      .then((res) => setProjects(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChatSubmit = (text: string) => {
    if (!text.trim()) return;
    navigate(`/chat?message=${encodeURIComponent(text)}`);
  };

  const duration = Math.max((projects.length || 5) * 5, 20);

  return (
    <section className="py-16 bg-base-200 relative overflow-hidden" id="projects">
      <div className="relative w-screen left-1/2 -translate-x-1/2">
        {/* Chat prompt – always visible */}
        <div className="max-w-3xl mx-auto px-4 text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Cormorant_Garamond'] text-base-content">
            Ask Me Anything
          </h2>
          <p className="text-base-content/60 mb-8 max-w-xl mx-auto">
            Chat with my AI assistant to learn more about me, my work, or request a tailored CV.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleChatSubmit(prompt)}
                className="btn btn-sm btn-outline"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-xl mx-auto">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit(message)}
              placeholder="Type a question..."
              className="input input-bordered flex-1"
            />
            <button
              onClick={() => handleChatSubmit(message)}
              className="btn btn-primary"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Skeleton or real projects carousel */}
        {loading ? (
          <div className="relative group overflow-hidden">
            <div className="flex gap-6 w-max px-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonProjectCard key={i} />
              ))}
            </div>
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="relative group">
              <div className="overflow-hidden">
                <div
                  className="flex gap-6 w-max animate-infinite-scroll pause-on-hover px-4"
                  style={{ animationDuration: `${duration}s` }}
                >
                  {[...projects, ...projects].map((project, index) => (
                    <div
                      key={`${project.id}-${index}`}
                      className="shrink-0 w-75 sm:w-[320px] card bg-base-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-base-content/5 hover:border-primary/20 group/card"
                    >
                      <figure className="h-48 bg-base-300 flex items-center justify-center relative overflow-hidden">
                        {project.imageUrl ? (
                          <img
                            src={project.imageUrl}
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                          />
                        ) : (
                          <span className="text-base-content/30 text-lg">No Image</span>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-base-100/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                      </figure>

                      <div className="card-body p-5">
                        <h3 className="card-title text-base md:text-lg">{project.title}</h3>
                        <p className="text-sm text-base-content/70 line-clamp-2">{project.description}</p>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.techStack.slice(0, 3).map((tech) => (
                            <span key={tech} className="badge badge-outline badge-xs">{tech}</span>
                          ))}
                          {project.techStack.length > 3 && (
                            <span className="badge badge-outline badge-xs">+{project.techStack.length - 3}</span>
                          )}
                        </div>

                        <div className="card-actions justify-end mt-3">
                          {project.liveUrl && (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-primary gap-1.5"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Live
                            </a>
                          )}
                          {project.githubUrl && (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-ghost gap-1.5"
                            >
                              <FiGithub className="w-4 h-4" />
                              Code
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <Link
                to="/projects"
                className="btn btn-outline btn-primary gap-2 group/view"
              >
                View More Projects
                <ArrowRight className="w-4 h-4 transition-transform group-hover/view:translate-x-1" />
              </Link>
            </div>

            <p className="text-center text-xs text-base-content/40 mt-3 px-4">
              Hover to pause the scroll
            </p>
          </>
        ) : (
          <div className="text-center py-12 text-base-content/50">
            No projects found.
          </div>
        )}
      </div>
    </section>
  );
}