import React from 'react';
import { SparklesIcon, MusicNoteIcon, BookOpenIcon, AdjustmentsHorizontalIcon, PlayIcon, ChartBarIcon, UserGroupIcon, LightBulbIcon } from './icons.tsx';

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
  return (
    <div className="min-h-screen bg-[#2B2B2B] relative overflow-hidden">
      {/* Background Pattern - Dotted pattern like in slides */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #FF5722 1px, transparent 0)`,
          backgroundSize: '30px 30px'
        }}></div>
      </div>
      
      {/* Geometric Elements */}
      <div className="absolute top-20 right-10 w-64 h-64 opacity-20">
        <div className="relative w-full h-full">
          {/* 3D Cube-like shape */}
          <div className="absolute top-0 right-0 w-32 h-32 border-2 border-orange-500 transform rotate-12"></div>
          <div className="absolute top-8 right-8 w-32 h-32 bg-orange-500 transform rotate-12"></div>
          <div className="absolute top-16 right-16 w-16 h-16 bg-white rounded-full"></div>
        </div>
      </div>
      
      <div className="absolute bottom-20 left-10 w-48 h-48 opacity-15">
        <div className="relative w-full h-full">
          {/* Abstract geometric shapes */}
          <div className="absolute bottom-0 left-0 w-24 h-24 border-2 border-orange-500 transform -rotate-45"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-orange-500 transform -rotate-45"></div>
        </div>
      </div>
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
            Launch App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-tight">
                <span className="text-orange-500">AI Studio Assistant:</span>
                <span className="block text-white mt-2 text-4xl md:text-5xl lg:text-6xl">
                  A Complement to Creativity,
                </span>
                <span className="block text-white mt-2 text-4xl md:text-5xl lg:text-6xl">
                  Not a Substitute.
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl leading-relaxed">
                Empowering modern producers with <span className="text-orange-500 font-semibold">structure</span>, <span className="text-orange-500 font-semibold">speed</span>, and <span className="text-orange-500 font-semibold">support</span> in their creative workflow.
              </p>
            </div>
            
            {/* Right side geometric elements */}
            <div className="relative h-96 lg:h-[500px]">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Large circle */}
                <div className="w-80 h-80 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full opacity-80"></div>
              </div>
              
              {/* Geometric overlay elements */}
              <div className="absolute top-0 right-0 w-32 h-32">
                <div className="w-full h-full border-2 border-orange-500 transform rotate-12"></div>
                <div className="absolute top-2 right-2 w-28 h-28 bg-orange-500 transform rotate-12"></div>
              </div>
              
              <div className="absolute bottom-0 right-8 w-24 h-24">
                <div className="w-full h-full border-2 border-orange-500"></div>
                <div className="absolute top-2 left-2 w-20 h-20 bg-orange-500"></div>
              </div>
              
              <div className="absolute top-1/2 right-0 w-16 h-16 bg-orange-500 rounded-full transform translate-x-8"></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 mt-12 lg:justify-start">
         <button
  onClick={onGetStarted}
  className="bg-black hover:bg-gray-800 text-white px-10 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-3 shadow-xl">
  <TrackGuideLogo className="h-6 w-6" />
  <span>Start Creating</span>
</button>

           
          </div>

        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="relative px-6 py-20">
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
                Tell us your genre, vibe, and creative goals. Our AI understands your artistic intent.
              </p>
            </div>
            
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Get Your Blueprint</h3>
              <p className="text-gray-300">
                Receive a detailed production guide with arrangement tips, sound design, and MIDI foundations.
              </p>
            </div>
            
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Create & Refine</h3>
              <p className="text-gray-300">
                Use our tools to generate MIDI, get mix feedback, and bring your vision to life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Features Section */}
      <section className="relative px-6 py-20 bg-black/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Complete Production Toolkit
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Every tool you need to take your music from idea to finished track
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* TrackGuide AI */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">AI</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">TrackGuide AI</h3>
              <p className="text-gray-300">Generate comprehensive, custom how-to guides based on your genre, vibe, and reference artists.</p>
            </div>

            {/* MIDI Generator */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">♪</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Integrated MIDI Generator</h3>
              <p className="text-gray-300">Create intelligent chord progressions, basslines, melodies, and drum patterns that match your track's context.</p>
            </div>

            {/* Mix Feedback */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">🎚</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Mix Feedback</h3>
              <p className="text-gray-300">Upload tracks for AI-powered analysis and detailed mixing recommendations.</p>
            </div>
            
            {/* Mix Compare */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">⚖</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Mix Compare</h3>
              <p className="text-gray-300">Upload multiple tracks for AI-powered analysis that compares different versions side-by-side.</p>
            </div>

                 {/* Production Coach */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">💬</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Production Coach</h3>
              <p className="text-gray-300">Interactive chatbot providing real-time production advice and guidance.</p>
            </div>
            
            {/* EQ Cheat Sheet */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">📊</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">EQ Cheat Sheet</h3>
              <p className="text-gray-300">Quick reference guide for EQ frequencies and their effects on different instruments.</p>
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
            From initial inspiration to final mix, TrackGuide provides intelligent assistance at every stage of your music production journey.
          </p>
          
          <div className="bg-gray-800/50 rounded-2xl p-8 max-w-md mx-auto border border-orange-500/20">
            <h3 className="text-2xl font-bold text-white mb-4">Free to Start</h3>
            <p className="text-gray-300 mb-6">
              Get started with TrackGuide AI at no cost. Upgrade when you're ready for more.
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
      <section className="relative px-6 py-16 bg-gradient-to-b from-black/20 to-black/40">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-32 h-1 bg-orange-500 mx-auto mb-8"></div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            The Investment Opportunity
          </h2>
          <p className="text-xl text-gray-300">
            Transforming the $43B music production industry
          </p>
        </div>
      </section>

{/* Modern Era of Production Section */}
<section className="relative px-6 py-20 bg-black/20">
  <div className="max-w-7xl mx-auto">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      {/* Left: text content */}
      <div className="space-y-8">
        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
          Too Many Tools:
          <span className="block text-orange-500">Not Enough Direction</span>
        </h2>
        <p className="text-xl text-gray-300 leading-relaxed">
          As the modern production landscape fragments into countless tools and tutorials, producers struggle to maintain <strong>focus</strong> and build <strong>real skills</strong>.
        </p>

        <div className="grid gap-6">
          <div className="border-l-4 border-orange-500 pl-6">
            <p className="text-gray-300">
              <strong>Without a clear structure</strong>, many producers struggle to turn inspiration into finished tracks.
            </p>
          </div>
          <div className="border-l-4 border-orange-500 pl-6">
            <p className="text-gray-300">
            <strong>  Clickbait tutorials lack context, feedback, and depth</strong>—offering tips without teaching transferable skills.
            </p>
          </div>
          <div className="border-l-4 border-orange-500 pl-6">
            <p className="text-gray-300">
            <strong>  A constant stream of flashy tools</strong> distracts from understanding core production fundamentals.
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

{/* Navigating the AI Challenge Section (graphic left on desktop, below on mobile) */}
<section className="relative px-6 py-20 bg-black/20">
  {/* Mobile Layout */}
  <div className="block lg:hidden space-y-12">
    <div className="space-y-8">
      <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
        Navigating the
        <span className="block text-orange-500">AI Challenge</span>
      </h2>
      <p className="text-xl text-gray-300 leading-relaxed">
        Empowering the artist vs. replacing the craft
      </p>
      <div className="grid gap-6">
        <div className="border-l-4 border-orange-500 pl-6">
          <h3 className="text-lg font-bold text-white mb-2">One-click generation’s lure</h3>
          <p className="text-gray-400">threatens to bypass traditional songwriting and production craftsmanship.</p>
        </div>
        <div className="border-l-4 border-orange-500 pl-6">
          <h3 className="text-lg font-bold text-white mb-2">Training on old hits risks</h3>
          <p className="text-gray-400">reinforcing trends rather than innovating new sonic directions.</p>
        </div>
        <div className="border-l-4 border-orange-500 pl-6">
          <h3 className="text-lg font-bold text-white mb-2">Ethical & legal questions</h3>
          <p className="text-gray-400">around authorship, royalties, and intellectual property multiply.</p>
        </div>
      </div>
    </div>
  </div>

  {/* Desktop Layout */}
  <div className="hidden lg:grid max-w-7xl mx-auto grid-cols-2 gap-12 items-center pt-16">
    {/* Left: Graphic */}
    <div className="relative h-80">
      <div className="absolute top-0 left-0 w-40 h-40">
        <div className="w-full h-full border-2 border-orange-500 transform rotate-45" />
        <div className="absolute top-4 left-4 w-32 h-32 bg-orange-500 transform rotate-45" />
      </div>
    </div>

    {/* Right: Text */}
    <div className="space-y-8">
      <h2 className="text-5xl font-bold text-white leading-tight">
        Navigating the <span className="text-orange-500 block">AI Challenge</span>
      </h2>
      <p className="text-xl text-gray-300 leading-relaxed">
        Empowering the artist vs. replacing the craft
      </p>
      <div className="grid gap-6">
        <div className="border-l-4 border-orange-500 pl-6">
          <h3 className="text-lg font-bold text-white mb-2">One-click generation’s lure</h3>
          <p className="text-gray-400">threatens to bypass traditional songwriting and production craftsmanship.</p>
        </div>
        <div className="border-l-4 border-orange-500 pl-6">
          <h3 className="text-lg font-bold text-white mb-2">Training on old hits risks</h3>
          <p className="text-gray-400">reinforcing trends rather than innovating new sonic directions.</p>
        </div>
        <div className="border-l-4 border-orange-500 pl-6">
          <h3 className="text-lg font-bold text-white mb-2">Ethical & legal questions</h3>
          <p className="text-gray-400">around authorship, royalties, and intellectual property multiply.</p>
        </div>
      </div>
    </div>
  </div>
</section>



  {/* Scalable Business Model Section (graphic top-right on desktop, stacked on mobile) */}
<section className="relative px-6 py-20 bg-black/20">
  {/* Mobile Layout */}
  <div className="block lg:hidden space-y-12">
    {/* Header */}
    <div className="space-y-8 text-center">
      <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
        Scalable <span className="block text-orange-500">Business Model</span>
      </h2>
      <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
        Serving creators of all kinds — from indie artists to institutions — with high-margin, modular tools.
      </p>
    </div>

    {/* Row 1: Who We Serve */}
    <div className="grid gap-8">
      <div className="bg-gray-800/30 rounded-lg p-6 border border-orange-500/10">
        <h3 className="text-xl font-bold text-white mb-2">Producers & Indie Artists</h3>
        <p className="text-gray-300">Flexible pricing tiers to empower individual workflows and creativity.</p>
      </div>
      <div className="bg-gray-800/30 rounded-lg p-6 border border-orange-500/10">
        <h3 className="text-xl font-bold text-white mb-2">Educational Institutions</h3>
        <p className="text-gray-300">Licensing packages built for music schools, colleges, and training programs.</p>
      </div>
      <div className="bg-gray-800/30 rounded-lg p-6 border border-orange-500/10">
        <h3 className="text-xl font-bold text-white mb-2">Enterprise Clients</h3>
        <p className="text-gray-300">Custom solutions for labels, production teams, and enterprise use cases.</p>
      </div>
    </div>

    {/* Row 2: Revenue Streams */}
    <div className="grid gap-8">
      <div className="bg-gray-800/30 rounded-lg p-6 border border-orange-500/20">
        <h3 className="text-xl font-bold text-white mb-2">SaaS Subscriptions</h3>
        <p className="text-gray-300 mb-2">Premium features, AI workflows, and unlimited generations.</p>
        <div className="text-orange-500 font-semibold text-base">85% Gross Margin</div>
      </div>
      <div className="bg-gray-800/30 rounded-lg p-6 border border-orange-500/20">
        <h3 className="text-xl font-bold text-white mb-2">Community Marketplace</h3>
        <p className="text-gray-300 mb-2">Commissions from samples, templates, and sound packs by creators.</p>
        <div className="text-orange-500 font-semibold text-base">30% Commission</div>
      </div>
      <div className="bg-gray-800/30 rounded-lg p-6 border border-orange-500/20">
        <h3 className="text-xl font-bold text-white mb-2">Enterprise Licensing</h3>
        <p className="text-gray-300 mb-2">Annual contracts for studios, labels, and academic partners.</p>
        <div className="text-orange-500 font-semibold text-base">$50K+ ARR</div>
      </div>
    </div>
  </div>

  {/* Desktop Layout */}
  <div className="hidden lg:grid max-w-7xl mx-auto gap-24">
    {/* Header */}
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-5xl font-bold text-white mb-4">
          Scalable <span className="text-orange-500">Business Model</span>
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl">
          Serving creators of all kinds — from indie artists to institutions — with high-margin, modular tools.
        </p>
      </div>

      {/* Geometric accent */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-2 border-orange-500 transform rotate-45"></div>
        <div className="absolute top-2 left-2 w-20 h-20">
          <div className="w-full h-full bg-orange-500 rounded-full"></div>
        </div>
      </div>
    </div>

    {/* Row 1: Who We Serve */}
    <div className="grid grid-cols-3 gap-8">
      <div className="bg-gray-800/30 rounded-lg p-8 border border-orange-500/10 space-y-2">
        <h3 className="text-2xl font-bold text-white">Producers & Indie Artists</h3>
        <p className="text-gray-300">Flexible pricing tiers to empower individual workflows and creativity.</p>
      </div>
      <div className="bg-gray-800/30 rounded-lg p-8 border border-orange-500/10 space-y-2">
        <h3 className="text-2xl font-bold text-white">Educational Institutions</h3>
        <p className="text-gray-300">Licensing packages built for music schools, colleges, and training programs.</p>
      </div>
      <div className="bg-gray-800/30 rounded-lg p-8 border border-orange-500/10 space-y-2">
        <h3 className="text-2xl font-bold text-white">Enterprise Clients</h3>
        <p className="text-gray-300">Custom solutions for labels, production teams, and enterprise use cases.</p>
      </div>
    </div>

    {/* Row 2: Revenue Streams */}
    <div className="grid grid-cols-3 gap-8">
      <div className="bg-gray-800/30 rounded-lg p-8 border border-orange-500/20 space-y-4">
        <h3 className="text-2xl font-bold text-white">SaaS Subscriptions</h3>
        <p className="text-gray-300">Premium features, AI workflows, and unlimited generations.</p>
        <div className="text-orange-500 font-semibold text-lg">85% Gross Margin</div>
      </div>
      <div className="bg-gray-800/30 rounded-lg p-8 border border-orange-500/20 space-y-4">
        <h3 className="text-2xl font-bold text-white">Community Marketplace</h3>
        <p className="text-gray-300">Commissions from samples, templates, and sound packs by creators.</p>
        <div className="text-orange-500 font-semibold text-lg">30% Commission</div>
      </div>
      <div className="bg-gray-800/30 rounded-lg p-8 border border-orange-500/20 space-y-4">
        <h3 className="text-2xl font-bold text-white">Enterprise Licensing</h3>
        <p className="text-gray-300">Annual contracts for studios, labels, and academic partners.</p>
        <div className="text-orange-500 font-semibold text-lg">$50K+ ARR</div>
      </div>
    </div>
  </div>
</section>


{/* Investment Levels Section */}
<section className="px-6 py-20 bg-black">
  <div className="max-w-5xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Investment Levels</h2>
      <p className="text-lg text-gray-300 max-w-2xl mx-auto">
        We're raising capital to finalize our MVP, build out our go-to-market strategy, and scale our team.
      </p>
    </div>
    <div className="grid md:grid-cols-4 gap-6">
      <div className="bg-black/80 rounded-lg p-6 border border-orange-500/30 shadow-md">
        <h3 className="text-xl font-bold text-white mb-2">Seed Loop</h3>
        <p className="text-gray-300 text-sm mb-2">$10K–$25K</p>
        <p className="text-gray-400 text-sm mb-2">
          Product polish, UI/UX refinement, performance tuning.
        </p>
        <p className="text-orange-400 text-sm">Return: SAFE note @ $5M cap + quarterly updates</p>
      </div>
      <div className="bg-black/80 rounded-lg p-6 border border-orange-500/30 shadow-md">
        <h3 className="text-xl font-bold text-white mb-2">Creator Tier</h3>
        <p className="text-gray-300 text-sm mb-2">$25K–$50K</p>
        <p className="text-gray-400 text-sm mb-2">
          Monetization rollout, user acquisition, referral systems.
        </p>
        <p className="text-orange-400 text-sm">Return: SAFE + 1% revenue share pilot + feedback seat</p>
      </div>
      <div className="bg-black/80 rounded-lg p-6 border border-orange-500/30 shadow-md">
        <h3 className="text-xl font-bold text-white mb-2">Full Stack</h3>
        <p className="text-gray-300 text-sm mb-2">$50K–$75K</p>
        <p className="text-gray-400 text-sm mb-2">
          Strategic hires (PMM/dev), professional business consulting.
        </p>
        <p className="text-orange-400 text-sm">Return: SAFE + advisory board access + product roadmap input</p>
      </div>
      <div className="bg-black/80 rounded-lg p-6 border border-orange-500/30 shadow-md">
        <h3 className="text-xl font-bold text-white mb-2">Vision Tier</h3>
        <p className="text-gray-300 text-sm mb-2">$150K+</p>
        <p className="text-gray-400 text-sm mb-2">
          Full-scale GTM campaign, AI model tuning, global launch.
        </p>
        <p className="text-orange-400 text-sm">Return: Discounted SAFE cap, 2% revenue share pilot, strategic board seat</p>
      </div>
    </div>
  </div>
</section>


  {/* Investor CTA Section */}
  <section className="px-6 py-20 bg-black/30">
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
        Interested in Investing?
      </h2>
      <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
        TrackGuide is revolutionizing music production with AI-powered assistance. Join us in empowering the next generation of creators.
      </p>
      <a
        href="mailto:dustinspaceproductions@gmail.com?subject=Investment Inquiry - TrackGuide AI"
        className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105 inline-flex items-center space-x-2 shadow-xl"
      >
        <span>Contact for Investment Opportunities</span>
      </a>
      <p className="text-gray-500 mt-4">dustinspaceproductions@gmail.com</p>
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
            <div className="text-xs text-gray-400">Your Smartest Studio Assistant</div>
          </div>
        </div>
        <div className="text-gray-400 text-center md:text-right">
          <p>&copy; 2025 TrackGuide. Empowering music creators worldwide.</p>
        </div>
      </div>
    </div>
  </footer>
</div>

); };



