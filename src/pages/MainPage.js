import React from 'react';
import BlueprintYourSound from '../components/BlueprintYourSound';
import TrackGuide from '../components/TrackGuide';
import MidiGenerator from '../components/MidiGenerator';
import './MainPage.css';

const MainPage = () => (
  <div className="main-grid">
    <BlueprintYourSound />
    <TrackGuide />
    <MidiGenerator />
  </div>
);

export default MainPage;
