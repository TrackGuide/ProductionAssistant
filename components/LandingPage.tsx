import React from 'react';
import {
  SparklesIcon,
  MusicNoteIcon,
  BookOpenIcon,
  AdjustmentsHorizontalIcon,
  PlayIcon,
  ChartBarIcon,
  UserGroupIcon,
  LightBulbIcon
} from './icons.tsx';

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
      {/* Background Pattern - Dotted pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #FF5722 1px, transparent 0)`,
          backgroundSize: '30px 30px'
        }} />
      </div>

      {/* Geometric Elements */}
      <div className="absolute top-20 right-10 w-64 h-64 opacity-20">
        <div className="relative w-full h-full">
          <div className="absolute top-0 right-0 w-32 h-32 border-2 border-orange-500 transform rotate-12" />
          <div className="absolute top-8 right-8 w-32 h-32 bg-orange-500 transform rotate-12" />
          <div className="absolute top-16 right-16 w-16 h-16 bg-white rounded-full" />
        </div>
      </div>
      <div className="absolute bottom-20 left-10 w-48 h-48 opacity-15">
        <div className="relative w-full h-full">
          <div className="absolute bottom-0 left-0 w-24 h-24 border-2 border-orange-500 transform -rotate-45" />
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-orange-500 transform -rotate-45" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 transform rotate-45 flex items-center justify-center">
              <div className="w-4 h-4 bg-white transform -rotate-45" />
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
            <div className="relative h-96 lg:h-[500px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 h-80 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full opacity-80" />
              </div>
              <div className="absolute top-0 right-0 w-32 h-32">
                <div className="w-full h-full border-2 border-orange-500 transform rotate-12" />
                <div className="absolute top-2 right-2 w-28 h-28 bg-orange-500 transform rotate-12" />
              </div>
              <div className="absolute bottom-0 right-8 w-24 h-24">
                <div className="w-full h-full border-2 border-orange-500" />
                <div className="absolute top-2 left-2 w-20 h-20 bg-orange-500" />
              </div>
              <div className="absolute top-1/2 right-0 w-16 h-16 bg-orange-500 rounded-full transform translate-x-8" />
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
            {[1,2,3].map((step) => (
              <div key={step} className="text-center space-y-6">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-white">{step}</span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {step === 1 && 'Describe Your Vision'}
                  {step === 2 && 'Get Your Blueprint'}
                  {step === 3 && 'Create & Refine'}
                </h3>
                <p className="text-gray-300">
                  {step === 1 && 'Tell us your genre, vibe, and creative goals. Our AI understands your artistic intent.'}
                  {step === 2 && 'Receive a detailed production guide with arrangement tips, sound design, and MIDI foundations.'}
                  {step === 3 && 'Use our tools to generate MIDI, get mix feedback, and bring your vision to life.'}
                </p>
              </div>
            ))}
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
              Every tool you need to take your music from idea to finished track
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: 'AI', title: 'TrackGuide AI', desc: 'Generate comprehensive, custom how-to guides based on your genre, vibe, and reference artists.' },
              { icon: '♪', title: 'Integrated MIDI Generator', desc: 'Create intelligent chord progressions, basslines, melodies, and drum patterns.' },
              { icon: '⚖', title: 'Mix Compare', desc: 'Upload tracks for AI-powered analysis and compare different versions side-by-side.' },
              { icon: '💬', title: 'Live Production Coach', desc: 'Interactive chatbot providing real-time production advice and guidance.' },
              { icon: '🎚', title: 'Mix Feedback', desc: 'Upload tracks for AI-powered analysis and detailed mixing recommendations.' },
              { icon: '📊', title: 'EQ Cheat Sheet', desc: 'Quick reference guide for EQ frequencies and their effects on different instruments.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white font-bold">{icon}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-gray-300">{desc}</p>
              </div>
            ))}
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
            From initial inspiration to final mix, TrackGuide provides intelligent assistance at every stage.
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

      {/* Divider to Investor Content */}
      <section className="relative px-6 py-16 bg-gradient-to-b from-black/20 to-black/40">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-32 h-1 bg-orange-500 mx-auto mb-8" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            The Investment Opportunity
          </h2>
          <p className="text-xl text-gray-300">
            Transforming the $43B music production industry
          </p>
        </div>
      </section>

   {/* Navigating the AI Challenge Section (text on LEFT, shapes on RIGHT) */}
<section className="relative px-6 py-20 bg-black/30">
  <div className="max-w-7xl mx-auto">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      {/* Left‐side content */}
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

      {/* Right‐side geometric accents */}
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

{/* From Clutter to Clarity Section (shapes on LEFT, text on RIGHT) */}
<section className="relative px-6 py-20 bg-black/20">
  <div className="max-w-7xl mx-auto">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      {/* Left‐side geometric accents */}
      <div className="relative h-96">
        <div className="absolute top-0 left-0 w-48 h-48">
          <div className="w-full h-full border-2 border-orange-500 transform rotate-45" />
          <div className="absolute top-4 left-4 w-40 h-40 bg-orange-500 transform rotate-45" />
        </div>
        <div className="absolute bottom-0 right-0 w-32 h-32">
          <div className="w-full h-full border-2 border-orange-500" />
          <div className="absolute top-2 right-2 w-28 h-28 bg-orange-500" />
        </div>
      </div>

      {/* Right‐side content */}
      <div className="space-y-8">
        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
          From Clutter to Clarity:
          <span className="block text-orange-500">Your Creative Compass</span>
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
    </div>
  </div>
</section>



      {/* Creator Economy Stats Section */}
      <section className="px-6 py-20">
        {/* ...omitted for brevity (unchanged) */}
      </section>

      {/* Business Model Overview */}
      <section className="px-6 py-20 bg-black/20">
        {/* ...omitted for brevity (unchanged) */}
      </section>

      {/* Scalable Business Model */}
      <section className="px-6 py-20">
        {/* ...omitted for brevity (unchanged) */}
      </section>

      {/* Investor CTA Section */}
      <section className="px-6 py-20 bg-black/30">
        {/* ...omitted for brevity (unchanged) */}
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-orange-500/20 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-orange-500 transform rotate-45 flex items-center justify-center">
                <div className="w-3 h-3 bg-white transform -rotate-45" />
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

export default LandingPage;
