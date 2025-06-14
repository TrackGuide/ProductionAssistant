# 🎛️ TrackGuide AI - Production Assistant

A comprehensive music production assistant that helps producers with track creation, MIDI generation, mixing guidance, and more.

## Features

- **🎵 Track Input Form**: Create detailed track guides with genre, vibe, and production information
- **🎹 MIDI Generator**: AI-powered MIDI pattern generation for chords, basslines, melodies, and drums
- **🎛️ EQ Frequency Guide**: Interactive frequency reference for mixing and EQ decisions
- **🎧 Mix Comparator**: Upload and compare different versions of your mixes
- **📚 Track Library**: Save, organize, and manage your track guides
- **🤖 AI Assistant**: Chat with an AI for production tips and guidance

## Prerequisites

- Node.js (v16 or higher)
- Modern web browser with audio support

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API Key (Optional):**
   - Copy `.env.local` and set your Gemini API key:
   ```bash
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```
   - **Note**: The app works in demo mode without an API key, using placeholder MIDI patterns

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to `http://localhost:12000`
   - The app should load with all features functional

## Building for Production

```bash
npm run build
npm run preview
```

## Usage Guide

### 1. Track Input Form
- Fill in your track details (title, genre, artist reference, etc.)
- Select multiple genres and vibes using the tag buttons
- Use advanced options for DAW, plugins, and instruments

### 2. MIDI Generator
- Click "Adjust MIDI Settings & Regenerate" to configure parameters
- Select which instruments to generate (chords, bassline, melody, drums)
- Preview individual tracks or play all together
- Download MIDI files for use in your DAW

### 3. EQ Frequency Guide
- Click on frequency ranges to see detailed information
- Learn about common instruments and mixing tips for each range
- Use as a reference while mixing

### 4. Mix Comparator
- Upload multiple versions of your mix
- Play them back at the same position for easy comparison
- Useful for A/B testing different mix decisions

### 5. Track Library
- Save your track guides for future reference
- Search and filter by genre
- Export individual guides as JSON files

### 6. AI Assistant
- Click the floating AI Assistant button
- Ask questions about production, mixing, arrangement, etc.
- Get contextual advice based on music production knowledge

## Technical Details

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Audio**: Web Audio API for MIDI playback
- **MIDI**: midi-writer-js for MIDI file generation
- **AI**: Google Gemini API (optional, with demo mode fallback)

## Demo Mode

The application works fully without an API key by providing:
- Placeholder MIDI patterns that demonstrate the interface
- Pre-built responses in the AI Assistant
- All other features work normally

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

**Note**: Audio features require user interaction to start (browser security requirement).

## Contributing

This is a production assistant tool designed to enhance creativity, not replace it. The AI features provide suggestions and starting points - your musical intuition and creativity remain the most important elements.

## License

MIT License - feel free to modify and use for your own projects.
