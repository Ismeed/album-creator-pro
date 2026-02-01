import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Camera, Users, Download, ChevronRight } from "lucide-react";
import heroImage from "@/assets/hero-graduation.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Graduation celebration"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-gradient opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 mobile-container text-center py-20 safe-top">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Logo/Brand */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20"
          >
            <span className="text-accent font-bold text-xl">OLEX</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-hero md:text-hero-lg text-primary-foreground text-balance"
          >
            Capture Every{" "}
            <span className="text-accent">Memory</span>
            <br />
            Together
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg md:text-xl text-primary-foreground/80 max-w-md mx-auto text-balance"
          >
            Create beautiful digital photo albums for graduations, cohorts, and celebrations. 
            Collect photos from everyone, generate stunning albums.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Button asChild variant="hero" size="lg" className="w-full sm:w-auto">
              <Link to="/login">
                Get Started
                <ChevronRight className="ml-1" />
              </Link>
            </Button>
            <Button asChild variant="hero-outline" size="lg" className="w-full sm:w-auto">
              <Link to="/demo">
                See How It Works
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay, duration: 0.5 }}
    className="card-gradient rounded-2xl p-6 shadow-card border border-border/50 hover:shadow-elevated transition-shadow duration-300"
  >
    <div className="w-12 h-12 rounded-xl accent-gradient flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-accent-foreground" />
    </div>
    <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const Features = () => {
  const features = [
    {
      icon: Camera,
      title: "Collect Photos",
      description: "Share a simple link with participants. They upload their photo and details in seconds—no account needed.",
    },
    {
      icon: Users,
      title: "Manage Submissions",
      description: "Review all submissions in one place. Approve, organize, and curate your album with ease.",
    },
    {
      icon: Download,
      title: "Generate Albums",
      description: "Create stunning downloadable albums ready for print or digital sharing with your group.",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="mobile-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Create collaborative photo albums in three simple steps
          </p>
        </motion.div>

        <div className="grid gap-4">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const UseCases = () => {
  const cases = [
    "Graduations",
    "Bootcamps",
    "Training Programs",
    "School Classes",
    "Departments",
    "Cohorts",
  ];

  return (
    <section className="py-16 hero-gradient">
      <div className="mobile-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-bold text-primary-foreground mb-4">
            Perfect For
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {cases.map((item, index) => (
            <motion.span
              key={item}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 + 0.3 }}
              className="px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground text-sm font-medium"
            >
              {item}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const CTA = () => (
  <section className="py-20 bg-background">
    <div className="mobile-container text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Ready to Create Your Album?
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Start collecting photos from your group today. No credit card required.
        </p>
        <Button asChild variant="accent" size="lg" className="w-full sm:w-auto">
          <Link to="/login">
            Create Your First Album
            <ChevronRight className="ml-1" />
          </Link>
        </Button>
      </motion.div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-8 border-t border-border bg-muted/30 safe-bottom">
    <div className="mobile-container">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-accent font-bold text-xl">OLEX</span>
        <p className="text-sm text-muted-foreground">
          Create beautiful photo albums together.
        </p>
        <p className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} OLEX. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export const LandingPage = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <UseCases />
      <CTA />
      <Footer />
    </main>
  );
};

export default LandingPage;
