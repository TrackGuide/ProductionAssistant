import React, { useEffect } from 'react';
import { useAppStore } from './src/store/useAppStore';
import { useAuthStore } from './src/store/useAuthStore';
import { LandingPage } from './src/components/LandingPage';
import { TrackGuideView } from './src/components/TrackGuideView';
import { MixFeedbackView } from './src/components/MixFeedbackView';
import { RemixGuideAI } from './src/components/RemixGuideAI';
import { PatchGuide } from './src/components/PatchGuide';
import { EQGuide } from './src/components/EQGuide';
import { LoginPage } from './src/components/LoginPage';
import { RegisterPage } from './src/components/RegisterPage';
import { SavePromptModal } from './src/components/SavePromptModal';
import { Button } from './src/components/Button';
import { UserIcon } from './src/components/icons';
import { APP_TITLE } from './src/constants/constants';

// Custom TrackGuide Logo Component
const TrackGuideLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} bg-orange-500 transform rotate-45 flex items-center justify-center`}>
    <div className="w-1/2 h-1/2 bg-white transform -rotate-45"></div>
  </div>
);

const App: React.FC = () => {
  const { activeView, setActiveView } = useAppStore();
  const { 
    user, 
    isAuthenticated, 
    checkAuth, 
    logout,
    saveGeneration
  } = useAuthStore();

  // Save prompt modal state
  const [showSavePrompt, setShowSavePrompt] = React.useState(false);
  const [pendingSaveData, setPendingSaveData] = React.useState<any>(null);
  const [pendingSaveType, setPendingSaveType] = React.useState<'trackGuide' | 'mixFeedback' | 'mixCompare' | 'remixGuide' | 'patchGuide' | null>(null);

  useEffect(() => {
    // Check authentication status on app load
    checkAuth();
  }, [checkAuth]);

  // Save prompt handlers
  const handleSaveToCloud = async (title: string, tags: string[]) => {
    if (!pendingSaveData || !pendingSaveType) return;

    try {
      await saveGeneration({
        type: pendingSaveType,
        title,
        content: pendingSaveData.content,
        inputs: pendingSaveData.inputs,
        tags
      });
      
      setShowSavePrompt(false);
      setPendingSaveData(null);
      setPendingSaveType(null);
      
      // Show success message (you might want to add a toast system)
      console.log('Saved to cloud library successfully!');
    } catch (error) {
      console.error('Failed to save to cloud:', error);
    }
  };

  const handleSavePrompt = (type: 'trackGuide' | 'mixFeedback' | 'mixCompare' | 'remixGuide' | 'patchGuide', data: any) => {
    if (!isAuthenticated) {
      // Show login prompt
      if (confirm('You need to be logged in to save generations. Would you like to go to the login page?')) {
        setActiveView('login');
      }
      return;
    }

    setPendingSaveType(type);
    setPendingSaveData(data);
    setShowSavePrompt(true);
  };

  const handleLogout = async () => {
    await logout();
    setActiveView('landing');
  };

  // Show login page
  if (activeView === 'login') {
    return (
      <LoginPage 
        onNavigateToRegister={() => setActiveView('register')}
        onNavigateBack={() => setActiveView('landing')}
      />
    );
  }

  // Show register page
  if (activeView === 'register') {
    return (
      <RegisterPage 
        onNavigateToLogin={() => setActiveView('login')}
        onNavigateBack={() => setActiveView('landing')}
      />
    );
  }

  // Show landing page
  if (activeView === 'landing') {
    return (
      <LandingPage 
        onGetStarted={() => {
          setActiveView('trackGuide');
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-gray-100 p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #FF5722 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      {/* Geometric Elements */}
      <div className="absolute top-10 right-10 w-32 h-32 opacity-10 pointer-events-none">
        <div className="w-full h-full border-2 border-orange-500 transform rotate-12 pointer-events-none"></div>
        <div className="absolute top-2 right-2 w-28 h-28 bg-orange-500 transform rotate-12 pointer-events-none"></div>
      </div>
      
      {/* Header */}
      <header className="text-center mb-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center justify-center space-x-3 flex-1">
            <div className="w-8 h-8 bg-orange-500 transform rotate-45 flex items-center justify-center">
              <div className="w-4 h-4 bg-white transform -rotate-45"></div>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {APP_TITLE}
              </h1>
              <p className="text-gray-400 text-lg">Your Smartest Studio Assistant</p>
            </div>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <UserIcon className="w-4 h-4" />
                  <span>{user?.username}</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleLogout}
                  className="text-xs"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setActiveView('login')}
                leftIcon={<UserIcon className="w-4 h-4" />}
                className="text-xs"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setActiveView('landing')}
          className="mt-2 text-sm text-orange-500 hover:text-orange-400 transition-colors font-medium"
        >
          ← Back to Landing
        </button>
      </header>
      
      {/* Navigation */}
      <nav className="mb-8 flex flex-col justify-center items-center md:flex-row md:justify-center gap-2 border-b border-orange-500/20 pb-3 relative z-10">
        <Button
          size="sm"
          className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
            activeView === 'trackGuide'
              ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
              : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
          }`}
          onClick={() => setActiveView('trackGuide')}
          variant={activeView === 'trackGuide' ? 'primary' : 'secondary'}
          leftIcon={<TrackGuideLogo className="w-4 h-4" />}
        >
          TrackGuide AI
        </Button>

        <Button
          size="sm"
          className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
            activeView === 'mixFeedback'
              ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
              : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
          }`}
          onClick={() => setActiveView('mixFeedback')}
          variant={activeView === 'mixFeedback' ? 'primary' : 'secondary'}
          leftIcon={<span className="w-4 h-4 text-center">🎚️</span>}
        >
          Mix Feedback AI
        </Button>

        <Button
          size="sm"
          className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
            activeView === 'remixGuide'
              ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
              : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
          }`}
          onClick={() => setActiveView('remixGuide')}
          variant={activeView === 'remixGuide' ? 'primary' : 'secondary'}
          leftIcon={<span className="w-4 h-4 text-center">🎛️</span>}
        >
          RemixGuide AI
        </Button>

        <Button
          size="sm"
          className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
            activeView === 'patchGuide'
              ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
              : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
          }`}
          onClick={() => setActiveView('patchGuide')}
          variant={activeView === 'patchGuide' ? 'primary' : 'secondary'}
          leftIcon={<span className="w-4 h-4 text-center">🎹</span>}
        >
          PatchGuide AI
        </Button>

        <Button
          size="sm"
          className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
            activeView === 'eqGuide'
              ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
              : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
          }`}
          onClick={() => setActiveView('eqGuide')}
          variant={activeView === 'eqGuide' ? 'primary' : 'secondary'}
          leftIcon={<span className="w-4 h-4 text-center">🎛️</span>}
        >
          EQ Guide
        </Button>
      </nav>

      {/* Main Content */}
      {activeView === 'trackGuide' && (
        <TrackGuideView onSavePrompt={handleSavePrompt} />
      )}
      
      {activeView === 'mixFeedback' && (
        <MixFeedbackView onSavePrompt={handleSavePrompt} />
      )}
      
      {activeView === 'remixGuide' && (
        <RemixGuideAI onSavePrompt={handleSavePrompt} />
      )}
      
      {activeView === 'patchGuide' && (
        <PatchGuide onSavePrompt={handleSavePrompt} />
      )}
      
      {activeView === 'eqGuide' && (
        <EQGuide />
      )}

      {/* Save Prompt Modal */}
      {showSavePrompt && (
        <SavePromptModal
          isOpen={showSavePrompt}
          onClose={() => {
            setShowSavePrompt(false);
            setPendingSaveData(null);
            setPendingSaveType(null);
          }}
          onSave={handleSaveToCloud}
          generationType={pendingSaveType || 'trackGuide'}
        />
      )}
    </div>
  );
};

export default App;
