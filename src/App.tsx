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