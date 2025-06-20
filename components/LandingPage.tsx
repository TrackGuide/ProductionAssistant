// LandingPage.tsx - Updated June 21 (Full User + Investor Flow)

import React from 'react';

const TrackGuideLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <div className={`${className} bg-orange-500 transform rotate-45 flex items-center justify-center`}>
    <div className="w-1/2 h-1/2 bg-white transform -rotate-45"></div>
  </div>
);

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-[#2B2B2B] relative overflow-hidden">

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 transform rotate-45 flex items-center justify-center">
              <div className="w-4 h-4 bg-white transform -rotate-45"></div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">TrackGuide AI</div>
              <div className="text-xs text-gray-400">Your Smartest Studio Assistant</div>
            </div>
          </div>
          <button
            onClick={onGetStarted}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-tight">
              <span className="text-orange-500">AI Studio Assistant:</span>
              <span className="block text-white mt-2 text-4xl md:text-5xl lg:text-6xl">
                A Partner in Production,
              </span>
              <span className="block text-white mt-2 text-4xl md:text-5xl lg:text-6xl">
                Not a Replacement.
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl leading-relaxed">
              Designed to accelerate pro-level results — empowering creativity, not automating artistry.
            </p>
          </div>

          <div className="relative h-96 lg:h-[500px] flex items-center justify-center">
            <div className="w-80 h-80 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full opacity-80" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 mt-12 lg:justify-start">
          <button
            onClick={onGetStarted}
            className="bg-orange-500 hover:bg-orange-600 text-white px-12 py-5 rounded-xl font-bold text-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-4 shadow-2xl border-2 border-orange-400"
          >
            <TrackGuideLogo className="h-8 w-8" />
            <span>Start Creating Now</span>
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">How TrackGuide Works</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">Your creative copilot — in 3 steps</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureStep number="1" title="Describe Your Vision" text="Set your genre, vibe, plugins, DAW, and notes — TrackGuide understands your intent." />
          <FeatureStep number="2" title="Get Your Blueprint" text="Receive detailed song structures, plugin settings, sound design tips, and MIDI patterns." />
          <FeatureStep number="3" title="Create & Refine" text="Generate MIDI, compare mixes, get AI-powered mix feedback, and refine your production." />
        </div>
      </section>

      {/* Features */}
      <section className="relative px-6 py-20 bg-black/10">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Production Toolkit — Now Live</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            TrackGuide helps you structure, analyze, and level up your mixes
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureTile title="TrackGuide AI" emoji="📝" text="Detailed AI production blueprints with plugin settings, instrument suggestions, and section-by-section guides." />
          <FeatureTile title="RemixGuide AI" emoji="🎛️" text="Remix-specific guidebooks: structure, genre re-interpretation, MIDI ideas, plugin tips — based on your uploaded track." />
          <FeatureTile title="MIDI Generator" emoji="♪" text="Context-aware chord, melody, bassline, and drum pattern generation — linked to your guide." />
          <FeatureTile title="Mix Feedback AI" emoji="🎚️" text="AI-driven mix feedback with audio analysis — clear next steps for your current version." />
          <FeatureTile title="Mix Compare AI" emoji="⚖️" text="Upload two mix versions — get detailed comparison, strengths/weaknesses, and next-step suggestions for version B." />
          <FeatureTile title="Live Production Coach" emoji="💬" text="In-app AI chat to answer production questions and suggest mix/arrangement ideas on demand." />
        </div>
      </section>

      {/* Pricing */}
      <section className="relative px-6 py-20 bg-black/20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Workflow?</h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Get started free — unlock premium AI features when ready
          </p>

          <div className="bg-gray-800/50 rounded-2xl p-8 max-w-md mx-auto border border-orange-500/20">
            <h3 className="text-2xl font-bold text-white mb-4">Free to Start</h3>
            <p className="text-gray-300 mb-6">Use TrackGuide AI today — no credit card required</p>
            <button
              onClick={onGetStarted}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-xl"
            >
              Start Free Now
            </button>
          </div>
        </div>
      </section>

      {/* Investor Section */}
      <section className="relative px-6 py-20 bg-black/20">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <div className="w-32 h-1 bg-orange-500 mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Investor Opportunity</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            A scalable AI platform — built for a $43B global music production market
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <InvestorTile title="SaaS Subscriptions" text="Premium AI features, high-margin B2C revenue stream" />
          <InvestorTile title="Creator Marketplace" text="New revenue from MIDI packs, templates, samples" />
          <InvestorTile title="Enterprise Licensing" text="Deals with studios, schools, publishers" />
        </div>

        <div className="mt-16 text-center">
          <a
            href="mailto:dustinspaceproductions@gmail.com?subject=Investment Inquiry - TrackGuide AI"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105 inline-flex items-center space-x-2 shadow-xl"
          >
            <span>Contact for Investor Deck</span>
          </a>
          <p className="text-gray-500 mt-4">dustinspaceproductions@gmail.com</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-orange-500/20 bg-black/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-orange-500 transform rotate-45 flex items-center justify-center">
              <div className="w-3 h-3 bg-white transform -rotate-45"></div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">TrackGuide AI</div>
              <div className="text-xs text-gray-400">Your Smartest Studio Assistant</div>
            </div>
          </div>
          <div className="text-gray-400 text-center md:text-right">
            <p>&copy; 2025 TrackGuide. Empowering creators worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Reusable subcomponents
const FeatureStep = ({ number, title, text }) => (
  <div className="text-center space-y-6">
    <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto">
      <span className="text-2xl font-bold text-white">{number}</span>
    </div>
    <h3 className="text-2xl font-bold text-white">{title}</h3>
    <p className="text-gray-300">{text}</p>
  </div>
);

const FeatureTile = ({ title, emoji, text }) => (
  <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4 text-white text-xl">{emoji}</div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-gray-300">{text}</p>
  </div>
);

const InvestorTile = ({ title, text }) => (
  <div className="bg-black/80 rounded-lg p-6 border border-orange-500/30 shadow-md space-y-4">
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-300 text-sm">{text}</p>
  </div>
);