import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Compass, Rss, MessageSquare, Bot, MapPin, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'setx360_onboarded_v1';

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  highlight?: string;
}

const steps: Step[] = [
  {
    icon: <Compass size={48} />,
    title: 'Welcome to SETX 360',
    description: 'Your all-in-one hub for Southeast Texas — news, community, businesses, faith, events, and more. Everything local, in one place.',
    color: '#c084fc',
    highlight: 'The #1 platform for Southeast Texas',
  },
  {
    icon: <MapPin size={48} />,
    title: 'Your Community, Your Feed',
    description: 'Use the dots at the top to zoom between your City view and your County view. Swipe left/right on the feed to switch scopes.',
    color: '#38bdf8',
    highlight: '🏙️ City  ·  🗺️ County',
  },
  {
    icon: <Rss size={48} />,
    title: 'The Social Feed',
    description: 'Post updates, share local news, join discussions, and discover what your neighbors are talking about. Tap Social in the menu to get started.',
    color: '#3b82f6',
    highlight: 'Like · Comment · Share · Repost',
  },
  {
    icon: <MessageSquare size={48} />,
    title: 'Direct Messages',
    description: 'Chat privately with anyone in the community. Look for the floating photo bubbles at the bottom of your screen — tap one to open a conversation.',
    color: '#22c55e',
    highlight: 'Real-time private messaging',
  },
  {
    icon: <Bot size={48} />,
    title: 'Meet Tevis, Your AI Guide',
    description: 'Tap the SETX 360 logo in the center of the header to open Tevis — your personal Southeast Texas AI. Ask him anything about the platform, local officials, weather, businesses, or civic services.',
    color: '#f59e0b',
    highlight: '💡 Tip: Type @tevis in any comment to summon him!',
  },
  {
    icon: <Sparkles size={48} />,
    title: "You're All Set!",
    description: "Explore Discover, Social, Market, Events, News, and Faith using the menu at the bottom. Everything is built for you and your community.",
    color: '#a855f7',
    highlight: "Welcome to the SETX 360 family! 🤝",
  },
];

interface OnboardingOverlayProps {
  onComplete: () => void;
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const goNext = () => {
    if (isLast) {
      localStorage.setItem(STORAGE_KEY, 'true');
      onComplete();
      return;
    }
    setDirection(1);
    setCurrentStep(s => s + 1);
  };

  const goPrev = () => {
    if (currentStep === 0) return;
    setDirection(-1);
    setCurrentStep(s => s - 1);
  };

  const skip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onComplete();
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(20,20,40,0.98), rgba(10,10,25,0.98))',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '420px',
          padding: '32px 28px',
          position: 'relative',
          boxShadow: `0 0 80px ${step.color}33, 0 32px 64px rgba(0,0,0,0.6)`,
          transition: 'box-shadow 0.5s ease',
          overflow: 'hidden',
        }}
      >
        {/* Ambient background glow */}
        <div
          style={{
            position: 'absolute',
            top: -60, right: -60,
            width: 200, height: 200,
            borderRadius: '50%',
            background: `${step.color}22`,
            filter: 'blur(40px)',
            transition: 'background 0.5s ease',
            pointerEvents: 'none',
          }}
        />

        {/* Skip button */}
        <button
          onClick={skip}
          style={{
            position: 'absolute', top: 20, right: 20,
            background: 'rgba(255,255,255,0.08)',
            border: 'none', borderRadius: '50%',
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
            transition: 'background 0.2s ease',
          }}
          title="Skip onboarding"
        >
          <X size={18} />
        </button>

        {/* Step counter dots */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', justifyContent: 'center' }}>
          {steps.map((_, i) => (
            <div
              key={i}
              onClick={() => { setDirection(i > currentStep ? 1 : -1); setCurrentStep(i); }}
              style={{
                width: i === currentStep ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === currentStep ? step.color : 'rgba(255,255,255,0.15)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>

        {/* Animated step content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            style={{ textAlign: 'center' }}
          >
            {/* Icon */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 96, height: 96,
                borderRadius: '50%',
                background: `${step.color}18`,
                border: `2px solid ${step.color}44`,
                color: step.color,
                marginBottom: '24px',
                boxShadow: `0 0 30px ${step.color}33`,
              }}
            >
              {step.icon}
            </div>

            {/* Title */}
            <h2
              style={{
                margin: '0 0 12px',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.2,
              }}
            >
              {step.title}
            </h2>

            {/* Description */}
            <p
              style={{
                margin: '0 0 20px',
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6,
              }}
            >
              {step.description}
            </p>

            {/* Highlight pill */}
            {step.highlight && (
              <div
                style={{
                  display: 'inline-block',
                  background: `${step.color}18`,
                  border: `1px solid ${step.color}44`,
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: step.color,
                  marginBottom: '8px',
                }}
              >
                {step.highlight}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
          {currentStep > 0 && (
            <button
              onClick={goPrev}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <ChevronLeft size={18} /> Back
            </button>
          )}
          <button
            onClick={goNext}
            style={{
              flex: 2,
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)`,
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: `0 4px 20px ${step.color}44`,
              transition: 'all 0.2s ease',
            }}
          >
            {isLast ? "Let's Go! 🚀" : <>Next <ChevronRight size={18} /></>}
          </button>
        </div>

        {/* Step fraction label */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '16px',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          {currentStep + 1} of {steps.length}
        </div>
      </div>
    </div>
  );
};

/** Returns true if this user has NOT been onboarded yet */
export const shouldShowOnboarding = (): boolean => {
  return !localStorage.getItem(STORAGE_KEY);
};
