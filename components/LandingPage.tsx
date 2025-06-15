import React from 'react';
import { SparklesIcon, MusicNoteIcon, BookOpenIcon, AdjustmentsHorizontalIcon, PlayIcon, ChartBarIcon, UserGroupIcon, LightBulbIcon } from './icons.tsx';

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
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                AI Studio Assistant:
                <span className="block text-white mt-2">
                  A Complement to
                </span>
                <span className="block text-white mt-2">
                  Creativity,
                </span>
                <span className="block text-orange-500 mt-2">
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
              <SparklesIcon className="h-6 w-6" />
              <span>Start Creating</span>
            </button>
            <button className="border-2 border-orange-500 hover:bg-orange-500 text-orange-500 hover:text-white px-10 py-4 rounded-lg font-bold text-lg transition-all">
              Watch Demo
            </button>
          </div>

        </div>
      </section>
      
      {/* DAW Challenge Section */}
      <section className="relative px-6 py-20 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Navigating the
                <span className="block text-white">DAW Challenge</span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Too many tools. Not enough direction.
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
            
            {/* Right side geometric elements */}
            <div className="relative h-96">
              <div className="absolute top-0 right-0 w-48 h-48">
                <div className="w-full h-full border-2 border-orange-500 transform rotate-45"></div>
                <div className="absolute top-4 right-4 w-40 h-40 bg-orange-500 transform rotate-45"></div>
              </div>
              <div className="absolute bottom-0 left-0 w-32 h-32">
                <div className="w-full h-full border-2 border-orange-500"></div>
                <div className="absolute top-2 left-2 w-28 h-28 bg-orange-500"></div>
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
      
      {/* Core Features Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Everything You Need to Create
              </h2>
              <p className="text-xl text-gray-300">
                From initial inspiration to final mix, TrackGuide provides intelligent assistance at every stage of your music production journey.
              </p>
              
              <div className="space-y-6">
                <div className="border-l-4 border-orange-500 pl-6">
                  <h4 className="text-xl font-semibold text-white mb-2">TrackGuide AI</h4>
                  <p className="text-gray-300">Generate comprehensive, custom how-to guides based on your genre, vibe, and reference artists.</p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-6">
                  <h4 className="text-xl font-semibold text-white mb-2">Integrated MIDI Generator</h4>
                  <p className="text-gray-300">Create intelligent chord progressions, basslines, melodies, and drum patterns that match your track's context.</p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-6">
                  <h4 className="text-xl font-semibold text-white mb-2">Mix Feedback with Comparator</h4>
                  <p className="text-gray-300">Upload tracks for AI-powered analysis and compare different versions side-by-side.</p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-6">
                  <h4 className="text-xl font-semibold text-white mb-2">Live Production Coach</h4>
                  <p className="text-gray-300">Interactive chatbot providing real-time production advice and guidance.</p>
                </div>
              </div>
            </div>

            <div className="relative h-96">
              {/* Demo preview with geometric elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border-2 border-orange-500/30 p-8">
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-semibold text-white mb-2">Live Demo Preview</h4>
                    <p className="text-gray-400 text-sm">See TrackGuide in action</p>
                  </div>

                  <div className="bg-black/30 rounded-lg p-4 border-l-4 border-orange-500">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-white font-medium">TrackGuide Generated</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      ✓ Genre: Future Bass + Melodic Dubstep<br/>
                      ✓ Key: F# Minor, BPM: 140<br/>
                      ✓ Structure: Intro → Build → Drop → Break<br/>
                      ✓ Production techniques & mixing tips
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-lg p-4 border-l-4 border-orange-500">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-white font-medium">MIDI Patterns Generated</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      ✓ Chord progression: i-VI-III-VII<br/>
                      ✓ Bassline, melody & drum patterns<br/>
                      ✓ Ready for DAW export
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Geometric accent */}
              <div className="absolute -top-4 -right-4 w-16 h-16 border-2 border-orange-500 transform rotate-45"></div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-orange-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-20 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by Music Creators Worldwide
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Join thousands of producers, beatmakers, and artists who are already using TrackGuide to elevate their music production.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-orange-500 mb-2">5K+</div>
              <div className="text-gray-400">TrackGuides Created</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-orange-500 mb-2">30+</div>
              <div className="text-gray-400">Music Genres</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-orange-500 mb-2">10K+</div>
              <div className="text-gray-400">MIDI Patterns Generated</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-orange-500 mb-2">24/7</div>
              <div className="text-gray-400">AI Production Coach</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Music Production?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of producers who are already using TrackGuide to create better music faster.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-orange-500 hover:bg-orange-600 text-white px-12 py-4 rounded-lg font-bold text-xl transition-all transform hover:scale-105 inline-flex items-center space-x-3 shadow-xl"
          >
            <SparklesIcon className="h-6 w-6" />
            <span>Start Creating Now</span>
          </button>
          <p className="text-gray-500 mt-4">Free to start • No credit card required</p>
          
          {/* Geometric accents */}
          <div className="absolute -top-8 -left-8 w-16 h-16 border-2 border-orange-500 transform rotate-45 opacity-30"></div>
          <div className="absolute -bottom-8 -right-8 w-12 h-12 bg-orange-500 rounded-full opacity-30"></div>
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
              <p>&copy; 2024 TrackGuide. Empowering music creators worldwide.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};