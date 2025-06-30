import React from 'react';
import { ActiveView } from '../types/appTypes';
import { TrackGuideView } from './TrackGuideView';
import { MixFeedbackView } from './MixFeedbackView';
import { RemixGuideAI } from './RemixGuideAI';
import { PatchGuide } from './PatchGuide';
import { EQGuide } from './EQGuide';

interface ViewRendererProps {
  activeView: ActiveView;
}

export const ViewRenderer: React.FC<ViewRendererProps> = ({ activeView }) => {
  switch (activeView) {
    case 'trackGuide':
      return <TrackGuideView />;
    case 'mixFeedback':
      return <MixFeedbackView />;
    case 'remixGuide':
      return <RemixGuideAI />;
    case 'patchGuide':
      return <PatchGuide />;
    case 'eqGuide':
      return <EQGuide />;
    default:
      return <TrackGuideView />;
  }
};