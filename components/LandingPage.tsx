import React, { useState } from 'react';

// Custom TrackGuide Logo Component
const TrackGuideLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <div className={`${className} bg-orange-500 transform rotate-45 flex items-center justify-center`}>
    <div className="w-1/2 h-1/2 bg-white transform -rotate-45"></div>
  </div>
);

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const links = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Problems We Solve", href: "#problems-we-solve" },
    { label: "Investment Levels", href: "#investment-levels" },
  ];

  return (
    <div className="min-h-screen bg-[#2B2B2B] relative overflow-hidden scroll-smooth">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #FF5722 1px, transparent 0)`,
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      {/* Sticky Nav */}
      <nav className="sticky top-0 z-20 bg-[#2B2B2B]/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <TrackGuideLogo className="w-8 h-8" />
            <div>
              <div className="text-xl font-bold text-white">TrackGuide AI</div>
              <div className="text-xs text-gray-400">Your Smartest Studio Assistant</div>
            </div>
          </div>

          {/* Centered Desktop Links */}
          <div className="hidden md:flex items-center space-x-10 absolute left-1/2 transform -translate-x-1/2">
            {links.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-white hover:text-orange-400 font-semibold text-lg transition-colors pb-1 border-b-2 border-transparent hover:border-orange-400"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Desktop Launch Button */}
          <div className="hidden md:block">
            <button
              onClick={onGetStarted}
              className="bg-black hover:bg-gray-900 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-3 shadow-2xl border-2 border-orange-400 hover:border-orange-300"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-sm"></div>
                <TrackGuideLogo className="h-6 w-6 relative z-10" />
              </div>
              <span>Launch App</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileNavOpen(open => !open)}
            className="md:hidden text-gray-300 hover:text-white focus:outline-none"
          >
            {/* simple hamburger / close icon */}
          {mobileNavOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        </div>
      </nav>

      {/* Mobile Nav Panel */}
      {mobileNavOpen && (
        <div className="md:hidden bg-[#2B2B2B]/90 backdrop-blur-sm px-6 py-4 space-y-4">
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-white font-medium hover:text-orange-400"
            >
              {label}
            </a>
          ))}
          <button
            onClick={() => {
              setMobileNavOpen(false);
              onGetStarted();
            }}
            className="w-full bg-black hover:bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-3 shadow-2xl border-2 border-orange-400 hover:border-orange-300 mt-4"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-sm"></div>
              <TrackGuideLogo className="h-6 w-6 relative z-10" />
            </div>
            <span>Launch App</span>
          </button>
        </div>
      )}

      {/* Hero */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          {/* Headline */}
         <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-8">
  <span className="text-orange-500">AI Studio Assistant:</span><br/>
  <span className="block text-3xl md:text-5xl">
    A Complement to Creativity,<br/>
    Not a Substitute.
  </span>
</h1>

          {/* Subtext */}
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12">
            Empowering modern producers with
            <span className="text-orange-500 font-semibold"> structure</span>,
            <span className="text-orange-500 font-semibold"> speed</span>, and
            <span className="text-orange-500 font-semibold"> support</span>.
          </p>

          {/* Mobile Launch Button (only shown when nav is closed) */}
          <div className="md:hidden">
            {!mobileNavOpen && (
              <button
                onClick={onGetStarted}
                className="bg-black hover:bg-gray-900 text-white px-12 py-5 rounded-xl font-bold text-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-4 shadow-2xl border-2 border-orange-400 hover:border-orange-300 mx-auto"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-sm"></div>
                  <TrackGuideLogo className="h-7 w-7 relative z-10" />
                </div>
                <span>Launch App</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How TrackGuide Works
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From concept to creation in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Describe Your Vision</h3>
              <p className="text-gray-300">
                Define your genre, vibe, creative goals — and your available plugins & DAW. Our AI understands your intent.
              </p>
            </div>

            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Get Your Guide & Tools</h3>
              <p className="text-gray-300">
                Generate a TrackGuide Blueprint, MIDI patterns, and AI recommendations — including plugin parameter suggestions.
              </p>
            </div>

            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Iterate & Refine</h3>
              <p className="text-gray-300">
                Upload mixes for feedback, compare revisions, and update your production with AI-assisted insights.
              </p>
            </div>
          </div>
        </div>
      </section>

{/* Complete Production Toolkit Section */}
      <section className="relative px-6 py-20 bg-black/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Complete Production Toolkit
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need — from first idea to final mix
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* TrackGuide AI */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <TrackGuideLogo className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">TrackGuide AI</h3>
              <p className="text-gray-300">
                Generate detailed TrackGuide blueprints — structure, instrumentation, plugin parameters, and mix guidance tailored to your tools.
              </p>
            </div>

            {/* MIDI Generator */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">♪</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Integrated MIDI Generator</h3>
              <p className="text-gray-300">
                Auto-generate melodic, harmonic, bass, and drum MIDI patterns — matched to your genre and style — exportable to your DAW.
              </p>
            </div>

            {/* RemixGuide AI */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">🎛️</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">RemixGuide AI</h3>
              <p className="text-gray-300">
                Upload any track and generate an intelligent remix plan — new structure, sound design tips, and remix-ready MIDI.
              </p>
            </div>

            {/* PatchGuide AI */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-2xl">🎹</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">PatchGuide AI</h3>
              <p className="text-gray-300">
                Generate detailed synth patch blueprints — choose your synth, describe your sound, and get step-by-step parameter and modulation tips.
              </p>
            </div>

            {/* Mix Feedback */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-2xl">🎚</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Mix Feedback</h3>
              <p className="text-gray-300">
                Get instant mix advice — AI analyzes one or two versions of your mix to highlight strengths, fix weaknesses, compare refinements, and guide your next steps.
              </p>
            </div>

            {/* EQ Guide */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">📊</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">EQ Guide</h3>
              <p className="text-gray-300">
                Quick-reference EQ guide: instrument-by-instrument — learn how to shape sound and resolve common mix problems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative px-6 py-20 bg-black/20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Music Production?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            TrackGuide helps producers of all skill levels — from bedroom creators to pros — finish more tracks, faster.
          </p>

          <div className="bg-gray-800/50 rounded-2xl p-8 max-w-md mx-auto border border-orange-500/20">
            <h3 className="text-2xl font-bold text-white mb-4">Free to Start</h3>
            <p className="text-gray-300 mb-6">
              Get started with TrackGuide AI for free. Upgrade when you're ready to unlock unlimited generations and advanced tools.
            </p>
            <button 
              onClick={onGetStarted}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-xl"
            >
              Start Creating Free
            </button>
            <p className="text-gray-500 text-sm mt-4">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Divider Section - Transition to Investor Content */}
      <section className="px-6 py-16 bg-black/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-32 h-1 bg-orange-500 mx-auto mb-8"></div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            The Investment Opportunity
          </h2>
          <p className="text-xl text-gray-300">
            Helping producers finish better music, faster — in a $43B market.
          </p>
        </div>
      </section>

      {/* Modern Era of Production Section */}
      <section id="problems-we-solve" className="relative px-6 py-20 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: text content */}
            <div className="space-y-8">
             <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
Too Many Tools. <span className="text-orange-500 block">Not Enough Direction.</span>
</h2>
              <div className="grid gap-6">
               <div className="border-l-4 border-orange-500 pl-6">
  <p className="text-gray-300">
    <strong>Clickbait content lacks depth —</strong> TrackGuide guides creativity with real-world skills — not more noise.
  </p>
</div>
<div className="border-l-4 border-orange-500 pl-6">
  <p className="text-gray-300">
    <strong>Clarity over clutter —</strong> Cuts through “plugin paralysis” and endless tutorial-hopping.
  </p>
</div>
<div className="border-l-4 border-orange-500 pl-6">
  <p className="text-gray-300">
    <strong>Skills that scale —</strong> Builds lasting production knowledge across tools & styles.
  </p>
</div>
              </div>
            </div>

            {/* Right: geometric accents */}
            <div className="relative h-96">
              <div className="absolute top-0 right-0 w-48 h-48">
                <div className="w-full h-full border-2 border-orange-500 transform rotate-45" />
                <div className="absolute top-4 right-4 w-40 h-40 bg-orange-500 transform rotate-45" />
              </div>
              <div className="absolute bottom-0 left-0 w-32 h-32">
                <div className="w-full h-full border-2 border-orange-500" />
                <div className="absolute top-2 left-2 w-28 h-28 bg-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigating the AI Challenge Section */}
      <section id="ai-challenge" className="px-6 py-20 bg-black">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Graphic */}
          <div className="relative h-80 hidden lg:block">
            <div className="absolute top-0 left-0 w-40 h-40">
              <div className="w-full h-full border-2 border-orange-500 transform rotate-45" />
              <div className="absolute top-4 left-4 w-32 h-32 bg-orange-500 transform rotate-45" />
            </div>
          </div>

          {/* Right: Text */}
          <div className="space-y-8">
            <h2 className="text-5xl font-bold text-white leading-tight">
              AI That Teaches. <span className="text-orange-500 block">Not Just Automates.</span>
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              A human-first approach — empowering the artist, respecting the craft.
            </p>
            <div className="grid gap-6">
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-lg font-bold text-white mb-2">Avoiding “One-Click” solutions</h3>
                <p className="text-gray-400">Our AI augments the creative process — producers stay in control.</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-lg font-bold text-white mb-2">Encouraging Innovation</h3>
                <p className="text-gray-400">Current AI tools focus on regurgitating “old hit” formulas — ours help creators define new sounds.</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-lg font-bold text-white mb-2">Clear IP & ethical AI</h3>
                <p className="text-gray-400">Built with transparent usage — your creativity stays yours.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

{/* Business Model */}
<section className="relative px-6 py-20 bg-black/20">
  <div className="max-w-5xl mx-auto">
    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
      Scalable <span className="text-orange-500">Business Model</span>
    </h2>
    <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
      Modular SaaS for creators, pros, educators, and studios.
    </p>

    <div className="grid md:grid-cols-3 gap-8">
      <div className="bg-gray-800/30 rounded-lg p-8 border border-orange-500/10 space-y-2">
        <h3 className="text-2xl font-bold text-white">SaaS Subscriptions</h3>
        <p className="text-gray-300">Premium AI tools, pro workflows, unlimited usage — high-margin recurring revenue.</p>
        <div className="text-orange-500 font-semibold text-lg">85% Gross Margin</div>
      </div>

      <div className="bg-gray-800/30 rounded-lg p-8 border border-orange-500/10 space-y-2">
        <h3 className="text-2xl font-bold text-white">Community Marketplace</h3>
        <p className="text-gray-300">Revenue from user-generated templates, MIDI packs, remix packs, stems, and presets.</p>
        <div className="text-orange-500 font-semibold text-lg">30% Commission</div>
      </div>

      <div className="bg-gray-800/30 rounded-lg p-8 border border-orange-500/10 space-y-2">
        <h3 className="text-2xl font-bold text-white">Enterprise / Education Licensing</h3>
        <p className="text-gray-300">Annual contracts for labels, studios, and music education institutions.</p>
        <div className="text-orange-500 font-semibold text-lg">$50K+ ARR</div>
      </div>
    </div>
  </div>
</section>

{/* Investment Levels */}
<section id="investment-levels" className="px-6 py-20 bg-black">
  <div className="max-w-5xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Investment Levels</h2>
      <p className="text-lg text-gray-300 max-w-2xl mx-auto">
        We’re raising capital to scale TrackGuide AI — deepen core features, grow early users, and prepare for market launch.
      </p>
      <p className="text-md text-gray-400 mt-4 max-w-xl mx-auto">
        All investments are via SAFE notes with valuation cap. Larger tiers include additional benefits and advisory access.
      </p>
    </div>

    <div className="grid md:grid-cols-4 gap-6">
      <div className="bg-black/80 rounded-lg p-6 border border-orange-500/30 shadow-md flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Seed Loop</h3>
          <p className="text-gray-300 text-sm mb-2">$10K–$25K</p>
          <p className="text-gray-400 text-sm mb-4">
            AI refinement, UX polish, early traction testing.
          </p>
        </div>
        <p className="text-orange-400 text-sm mt-4">Return: SAFE @ $5M cap + quarterly updates</p>
      </div>

      <div className="bg-black/80 rounded-lg p-6 border border-orange-500/30 shadow-md flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Creator Tier</h3>
          <p className="text-gray-300 text-sm mb-2">$25K–$50K</p>
          <p className="text-gray-400 text-sm mb-4">
            Monetization rollout, user acquisition, affiliate & referral systems.
          </p>
        </div>
        <p className="text-orange-400 text-sm mt-4">Return: SAFE + 1% revenue share pilot + early feature access</p>
      </div>

      <div className="bg-black/80 rounded-lg p-6 border border-orange-500/30 shadow-md flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Full Stack</h3>
          <p className="text-gray-300 text-sm mb-2">$50K–$75K</p>
          <p className="text-gray-400 text-sm mb-4">
            Strategic hires (PMM / full-stack dev), expanded GTM partnerships.
          </p>
        </div>
        <p className="text-orange-400 text-sm mt-4">Return: SAFE + advisory board seat + product roadmap input</p>
      </div>

      <div className="bg-black/80 rounded-lg p-6 border border-orange-500/30 shadow-md flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Vision Tier</h3>
          <p className="text-gray-300 text-sm mb-2">$150K+</p>
          <p className="text-gray-400 text-sm mb-4">
            Full-scale AI model tuning, GTM campaign, international expansion.
          </p>
        </div>
        <p className="text-orange-400 text-sm mt-4">Return: Discounted SAFE cap + 2% revenue share + strategic board seat</p>
      </div>
    </div>

    <div className="text-center mt-12">
      <a
        href="mailto:dustinspaceproductions@gmail.com?subject=Investment Inquiry - TrackGuide AI"
        className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 inline-flex items-center space-x-2 shadow-xl"
      >
        <span>Contact for Full Investor Deck</span>
      </a>
    </div>
  </div>
</section>


<section className="px-6 py-20 bg-black/30">
  <div className="max-w-4xl mx-auto text-center">
    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
      Interested in Investing?
    </h2>
    <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
      Revolutionizing music production with human-first AI. Join us.
    </p>
    <a
      href="mailto:dustinspaceproductions@gmail.com?subject=Investment Inquiry - TrackGuide AI"
      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105 inline-flex items-center space-x-2 shadow-xl"
    >
      <span>Contact for Investment Opportunities</span>
    </a>
  </div>
</section>


{/* Footer */}
<footer className="px-6 py-12 border-t border-orange-500/20 bg-black/20">
  <div className="max-w-7xl mx-auto">
    <div className="flex flex-col md:flex-row items-center justify-between">
      <div className="flex items-center space-x-3 mb-4 md:mb-0">
        <div className="w-6 h-6 bg-orange-500 transform rotate-45 flex items-center justify-center">
          <div className="w-3 h-3 bg-white transform -rotate-45"></div>
        </div>
        <div>
          <div className="text-lg font-bold text-white">TrackGuide AI</div>
          <div className="text-xs text-gray-400">AI Studio Assistant for Music Creators</div>
        </div>
      </div>
      <div className="text-gray-400 text-center md:text-right text-sm space-y-1">
        <p>&copy; 2025 TrackGuide. Empowering music creators worldwide.</p>
        <p>
          <a href="#" className="hover:text-orange-400 mr-4">Privacy Policy</a>
          <a href="#" className="hover:text-orange-400">Terms of Service</a>
        </p>
      </div>
    </div>
  </div>
</footer>

</div> /* closes main wrapper div */
);
};

export default LandingPage;
