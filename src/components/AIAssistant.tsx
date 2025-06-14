import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { CloseIcon, SparklesIcon } from './icons';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI production assistant. I can help you with music production questions, mixing tips, arrangement ideas, and more. What would you like to know?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response (in a real app, this would call your AI service)
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputText);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('eq') || input.includes('equalizer')) {
      return "For EQ, remember the golden rule: cut before you boost! Start by identifying problematic frequencies and cutting them, then add gentle boosts where needed. Low-mids (200-500Hz) often need cutting to reduce muddiness, while presence (2-5kHz) can add clarity to vocals.";
    }
    
    if (input.includes('mix') || input.includes('mixing')) {
      return "Great mixing starts with good arrangement and recording. Use reference tracks, mix at low volumes, and take breaks to keep your ears fresh. Focus on balance first, then EQ, compression, and effects. Remember: if it sounds good, it is good!";
    }
    
    if (input.includes('bass') || input.includes('low end')) {
      return "For tight low end: high-pass everything that doesn't need bass content, use sidechain compression on bass with kick, and consider mono-ing frequencies below 100Hz. A good bass sound sits perfectly with the kick drum without fighting for space.";
    }
    
    if (input.includes('vocal') || input.includes('voice')) {
      return "Vocal mixing tips: Start with a good recording in a treated space. Use gentle compression (3:1 ratio), de-ess if needed, and EQ to enhance clarity around 2-5kHz. Add reverb and delay tastefully, and always check mono compatibility.";
    }
    
    if (input.includes('master') || input.includes('mastering')) {
      return "Mastering is about enhancing what's already there, not fixing mix problems. Use gentle EQ moves, light compression for glue, and ensure your mix translates well across different playback systems. Aim for consistency and competitive loudness without sacrificing dynamics.";
    }
    
    if (input.includes('chord') || input.includes('harmony')) {
      return "Try experimenting with chord extensions and inversions! Add 7ths, 9ths, or sus chords for more color. Voice leading is key - move between chords with the smallest possible movements. Consider the bass note movement to create smooth progressions.";
    }
    
    if (input.includes('drum') || input.includes('rhythm')) {
      return "Great drums start with good samples and tight timing. Layer different samples for fuller sounds, use parallel compression for punch, and don't forget about the importance of the snare-kick relationship. Groove is more important than perfection!";
    }
    
    if (input.includes('stereo') || input.includes('width') || input.includes('pan')) {
      return "Stereo imaging: Keep bass and kick centered, pan instruments to create space, and use stereo widening effects carefully. The LCR (Left-Center-Right) panning technique can create clear, punchy mixes. Always check your mix in mono!";
    }
    
    if (input.includes('compressor') || input.includes('compression')) {
      return "Compression controls dynamics. Start with a medium attack (10-30ms), medium release (100-300ms), and gentle ratio (2-4:1). Listen for the 'breathing' of the compressor and adjust to taste. Parallel compression can add punch while maintaining dynamics.";
    }
    
    if (input.includes('reverb') || input.includes('space') || input.includes('ambience')) {
      return "Reverb creates space and depth. Use shorter reverbs for intimacy, longer for drama. Pre-delay (20-100ms) can help separate the dry signal from the reverb tail. High-cut the reverb to avoid muddiness, and consider using sends rather than inserts.";
    }
    
    // Default responses for general questions
    const defaultResponses = [
      "That's an interesting question! Could you be more specific about what aspect of music production you'd like help with?",
      "I'd be happy to help! Are you working on mixing, arrangement, sound design, or something else?",
      "Great question! Music production has so many facets. What's your current challenge or goal?",
      "I'm here to help with your production journey! What specific technique or concept would you like to explore?",
      "Every producer faces unique challenges. Tell me more about what you're working on and I'll do my best to assist!"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
        title="AI Assistant"
      >
        <SparklesIcon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-6 w-80 h-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-purple-400" />
          <h3 className="font-medium text-white">AI Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-2 rounded-lg text-sm ${
                message.isUser
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 p-2 rounded-lg text-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about production, mixing, etc..."
            className="flex-1 text-sm"
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            size="sm"
            variant="primary"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};