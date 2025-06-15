import { useState, useEffect, useRef } from 'react'
import './pages/MainPage.css'
import { 
  parseKeyFromGuidebook, 
  parseBpmFromGuidebook, 
  parseChordProgressionFromGuidebook 
} from './utils/guidebookParser.ts'

// Use consistent import paths - avoid mixing relative paths
import BlueprintYourSound from './components/BlueprintYourSound';  // without .tsx
import TrackGuide from './components/TrackGuide';  // without .tsx
import MidiGeneratorComponent from './components/MidiGeneratorComponent';  // without .tsx

// Loading fallback component
const LoadingComponent = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
)

const App: React.FC = () => {
  // Your state variables and hooks
  
  // Add console logs to debug rendering
  useEffect(() => {
    console.log('App rendered, activeView:', activeView)
    console.log('activeGuidebookDetails available:', !!activeGuidebookDetails)
  }, [activeView, activeGuidebookDetails])
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow">
        {/* Your header content */}
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Navigation tabs or other UI elements */}
        
        {activeView === 'trackGuide' && (
          <div className="main-grid">
            <BlueprintYourSound />
            <TrackGuide />
            {activeGuidebookDetails && (
              <MidiGeneratorComponent
                currentGuidebookEntry={activeGuidebookDetails}
                mainAppInputs={inputs}
                onUpdateGuidebookEntryMidi={handleUpdateGuidebookEntryMidi}
                parsedGuidebookBpm={parseBpmFromGuidebook(activeGuidebookDetails?.content || '')}
                parsedGuidebookKey={parseKeyFromGuidebook(activeGuidebookDetails?.content || '')}
                parsedGuidebookChordProg={parseChordProgressionFromGuidebook(activeGuidebookDetails?.content || '')}
              />
            )}
          </div>
        )}
        
        {/* Other views and modals */}
      </main>
    </div>
  )
}

export default App