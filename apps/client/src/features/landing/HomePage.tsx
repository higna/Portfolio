import CTA from "./CTA";
import HeroSection from "./HeroSection";
import MetricsCounter from "./MetricsCounter";
import SkillsScroller from "./SkillsScroller";
import { createLogger } from "../../lib/logger";
import FeaturedProjects from "./FeaturedProjects";
import ExperienceTimeline from "./ExperienceTimeline";

const logger = createLogger("HomePage");

export default function HomePage() {
  logger.log("HomePage rendered");
  return (
    <div>
      <HeroSection />
      <MetricsCounter />
      <ExperienceTimeline />
      <SkillsScroller />
      <FeaturedProjects />
      <CTA />
    </div>
  );
}
