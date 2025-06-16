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
              className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-3 shadow-xl"
            >
              <TrackGuideLogo className="h-6 w-6" />
              <span>Start Creating</span>
            </button>
            <button 
              onClick={() => {
                const demoSection = document.getElementById('demo-section');
                if (demoSection) {
                  demoSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="border-2 border-orange-500 hover:bg-orange-500 text-orange-500 hover:text-white px-10 py-4 rounded-lg font-bold text-lg transition-all"
            >
              Watch Demo
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

            {/* Mix Compare */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">⚖</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Mix Compare</h3>
              <p className="text-gray-300">Upload tracks for AI-powered analysis and compare different versions side-by-side.</p>
            </div>

            {/* Production Coach */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">💬</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Production Coach</h3>
              <p className="text-gray-300">Interactive chatbot providing real-time production advice and guidance.</p>
            </div>

            {/* Mix Feedback */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">🎚</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Mix Feedback</h3>
              <p className="text-gray-300">Upload tracks for AI-powered analysis and detailed mixing recommendations.</p>
            </div>

            {/* EQ Cheat Sheet */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">📊</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">EQ Cheat Sheet</h3>
              <p className="text-gray-300">Quick reference guide for EQ frequencies and their effects on different instruments and sounds.</p>
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
          As the modern production landscape fragments into countless tools and tutorials, producers struggle to maintain focus and build real skills.
        </p>

        <div className="grid gap-6">
          <div className="border-l-4 border-orange-500 pl-6">
            <p className="text-gray-300">
              Without a clear structure, many producers struggle to turn inspiration into finished tracks.
            </p>
          </div>
          <div className="border-l-4 border-orange-500 pl-6">
            <p className="text-gray-300">
              Clickbait tutorials lack context, feedback, and depth—offering tips without teaching transferable skills.
            </p>
          </div>
          <div className="border-l-4 border-orange-500 pl-6">
            <p className="text-gray-300">
              A constant stream of flashy tools distracts from understanding core production fundamentals.
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


            <div className="relative h-96">
              {/* Abstract geometric visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-80 h-80">
                  {/* Central geometric shape */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-32 h-32 bg-orange-500 transform rotate-45 flex items-center justify-center">
                      <div className="w-20 h-20 bg-gray-900 transform -rotate-45 flex items-center justify-center">
                        <div className="w-12 h-12 bg-orange-500 transform rotate-45"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating text elements */}
                  <div className="absolute top-4 right-8 text-xs text-orange-500 transform rotate-12">
                    AI innovation vs. tradition
                  </div>
                  <div className="absolute bottom-8 left-4 text-xs text-orange-500 transform -rotate-12">
                    Collaboration vs. replacement
                  </div>
                  <div className="absolute top-16 left-16 text-xs text-orange-500 transform rotate-45">
                    Human story
                  </div>
                  
                  {/* Connecting lines */}
                  <div className="absolute top-1/2 left-1/2 w-40 h-0.5 bg-orange-500 opacity-30 transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
                  <div className="absolute top-1/2 left-1/2 w-40 h-0.5 bg-orange-500 opacity-30 transform -translate-x-1/2 -translate-y-1/2 -rotate-45"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Economy Stats Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-96">
              {/* 3D Isometric Box */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64">
                  {/* Isometric cube */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                    <div className="relative">
                      {/* Front face */}
                      <div className="w-32 h-32 bg-gray-700 border-2 border-orange-500"></div>
                      {/* Top face */}
                      <div className="absolute -top-8 left-8 w-32 h-16 bg-orange-500 border-2 border-orange-600 transform skew-x-12"></div>
                      {/* Right face */}
                      <div className="absolute top-0 -right-8 w-16 h-32 bg-orange-600 border-2 border-orange-700 transform skew-y-12"></div>
                      {/* Circle inside */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-orange-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Dotted pattern overlay */}
              <div className="absolute top-0 left-0 w-full h-full opacity-30">
                <div className="grid grid-cols-8 gap-4 h-full">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-gray-400 text-lg">Understanding the rapid growth of the creator economy landscape</p>
                <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                  1.5 billion creators,
                  <span className="block text-white">global estimate</span>
                </h2>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white">
                  The explosive rise of content creators worldwide
                </h3>
                <p className="text-xl text-gray-300 leading-relaxed">
                  The creator economy is flourishing, with <span className="text-orange-500 font-bold">1.5 billion creators</span> globally. This shift highlights the need for innovative tools to support their growth and ensure sustainable success in this evolving landscape.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our Business Model Overview
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Flexible solutions designed to empower creators at every level of their journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">
                Flexible pricing tiers for individual producers
              </h3>
              <p className="text-gray-300 leading-relaxed">
                We offer customizable pricing plans tailored to meet various producer needs and budgets.
              </p>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">
                School licensing options for educational institutions
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Educational institutions can access special licensing for students and educators to enhance learning.
              </p>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">
                Exclusive features to enhance user experience
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Unique features are designed to optimize workflow and provide valuable support throughout the production process.
              </p>
            </div>
          </div>
          
          {/* Geometric accent */}
          <div className="flex justify-end mt-12">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 border-2 border-orange-500 transform rotate-45"></div>
              <div className="absolute top-2 left-2 w-28 h-28">
                <div className="w-full h-full bg-orange-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>




      {/* Business Model Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Scalable Business Model
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Multiple revenue streams with high margins and strong network effects
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800/30 rounded-lg p-8 border border-orange-500/20">
              <h3 className="text-2xl font-bold text-white mb-4">SaaS Subscriptions</h3>
              <p className="text-gray-300 mb-6">
                Recurring revenue from premium features, advanced AI models, and unlimited generations.
              </p>
              <div className="text-orange-500 font-bold text-lg">85% Gross Margin</div>
            </div>
            
            <div className="bg-gray-800/30 rounded-lg p-8 border border-orange-500/20">
              <h3 className="text-2xl font-bold text-white mb-4">Marketplace</h3>
              <p className="text-gray-300 mb-6">
                Commission from sample packs, presets, and templates created by our community.
              </p>
              <div className="text-orange-500 font-bold text-lg">30% Commission</div>
            </div>
            
            <div className="bg-gray-800/30 rounded-lg p-8 border border-orange-500/20">
              <h3 className="text-2xl font-bold text-white mb-4">Enterprise</h3>
              <p className="text-gray-300 mb-6">
                Custom solutions for record labels, music schools, and production companies.
              </p>
              <div className="text-orange-500 font-bold text-lg">$50K+ ARR</div>
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
  );
};
