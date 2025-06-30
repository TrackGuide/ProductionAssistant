import React from 'react';
import { APP_TITLE } from '../constants/constants';

export const AppFooter: React.FC = () => {
  return (
    <footer className="text-center mt-16 py-8 border-t border-gray-700/60">
      <p className="text-sm text-gray-500">{APP_TITLE} - AI Production Assistant</p>
    </footer>
  );
};