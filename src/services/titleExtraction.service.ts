export class TitleExtractionService {
  static extractAiGeneratedTitleFromMarkdown(markdownText: string): string | null {
    const match = markdownText.match(/^#\s*TRACKGUIDE:\s*"?([^"\n]+)"?/im);
    return match && match[1] ? match[1].trim() : null;
  }

  static filterLyricsFromAIResponse(content: string): string {
    let filtered = content.trim();
    const headingMatch = filtered.match(/(^|\n)(##? |🎧|Audio Analysis Results)/);
    if (headingMatch && headingMatch.index !== undefined) {
      filtered = filtered.slice(headingMatch.index).trim();
    }
    return filtered;
  }

  static getTrackGuideCardTitle(
    userProvidedTitle: string | undefined,
    activeGuidebookDetails: any,
    generatedGuidebook: string,
    isLoading: boolean
  ): string {
    if (userProvidedTitle?.trim()) {
      return `TrackGuide: ${userProvidedTitle.trim()}`;
    }
    
    if (activeGuidebookDetails?.title) {
      const storedTitle = activeGuidebookDetails.title;
      if (storedTitle.startsWith('TrackGuide for ')) {
        const aiGeneratedTitle = this.extractAiGeneratedTitleFromMarkdown(activeGuidebookDetails.content);
        if (aiGeneratedTitle) {
          return `TrackGuide: ${aiGeneratedTitle}`;
        } else {
          return storedTitle;
        }
      } else {
        return `TrackGuide: ${storedTitle}`;
      }
    }
    
    if (isLoading) {
      const streamedSuggestedTitle = this.extractAiGeneratedTitleFromMarkdown(generatedGuidebook);
      if (streamedSuggestedTitle) {
        return `TrackGuide: ${streamedSuggestedTitle}`;
      } else {
        return "TrackGuide is generating...";
      }
    }
    
    if (generatedGuidebook) {
      const finalSuggestedTitle = this.extractAiGeneratedTitleFromMarkdown(generatedGuidebook);
      if (finalSuggestedTitle) {
        return `TrackGuide: ${finalSuggestedTitle}`;
      } else {
        return "Generated TrackGuide";
      }
    }
    
    return "TrackGuide";
  }
}