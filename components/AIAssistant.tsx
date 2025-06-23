import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button.tsx';
import { Input } from './Input.tsx';
import { Spinner } from './Spinner.tsx';
import { SparklesIcon } from './icons.tsx';
import { generateAIAssistantResponse } from '../services/geminiService.ts';
import { UserInputs, GuidebookEntry, ChatMessage } from '../types.ts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentGuidebook?: GuidebookEntry;
  userInputs?: UserInputs;
  onUpdateGuidebook?: (content: string) => void;
  onUpdateInputs?: (inputs: Partial<UserInputs>) => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
  // Additional context from other guides
  remixGuideContent?: string;
  mixFeedbackContent?: string;
  mixComparisonContent?: string;
  patchGuideContent?: string;
  activeView?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  currentGuidebook,
  userInputs,
  isCollapsed = false,
  onToggle,
  remixGuideContent,
  mixFeedbackContent,
  mixComparisonContent,
  patchGuideContent,
  activeView
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hi! I'm your AI music production assistant. I can help you:

• Refine your TrackGuide with specific questions
• Provide insights on your RemixGuide and remix techniques
• Analyze and discuss your Mix Feedback reports
• Offer suggestions for your Mix Comparisons
• Help with PatchGuide synth programming advice
• Answer production techniques questions
• Help adjust your genre, vibe, or arrangement ideas
• Provide detailed explanations about any aspect of your track

What would you like to work on today?`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const clearConversation = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI music production assistant. I can help you:

• Refine your TrackGuide with specific questions
• Provide insights on your RemixGuide and remix techniques
• Analyze and discuss your Mix Feedback reports
• Offer suggestions for your Mix Comparisons
• Help with PatchGuide synth programming advice
• Answer production techniques questions
• Help adjust your genre, vibe, or arrangement ideas
• Provide detailed explanations about any aspect of your track

What would you like to work on today?`,
      timestamp: new Date()
    }]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Convert our Message format to ChatMessage format
      const conversationHistory: ChatMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Add the new user message to conversation
      conversationHistory.push({
        role: 'user',
        content: userMessage.content
      });

      // Ensure we have a current guidebook, create a default one if needed
      const guidebook: GuidebookEntry = currentGuidebook || {
        id: 'temp-' + Date.now(),
        title: 'Current Project',
        genre: userInputs?.genre || ['General'],
        artistReference: userInputs?.artistReference || 'Not specified',
        vibe: userInputs?.vibe || ['Creative'],
        daw: userInputs?.daw || 'Not specified',
        plugins: userInputs?.plugins || 'Not specified',
        availableInstruments: userInputs?.availableInstruments || 'Not specified',
        content: 'Working on current project',
        createdAt: new Date().toISOString(),
        key: userInputs?.key,
        scale: userInputs?.scale,
        chords: userInputs?.chords
      };

      // Get streaming response with additional context
      const responseStream = await generateAIAssistantResponse(
        conversationHistory, 
        guidebook,
        {
          remixGuideContent,
          mixFeedbackContent,
          mixComparisonContent,
          patchGuideContent,
          activeView
        }
      );
      
      // Create assistant message with initial empty content
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Stream the response
      let fullContent = '';
      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullContent += chunk.text;
          // Update the assistant message content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: fullContent }
                : msg
            )
          );
        }
      }

    } catch (error) {
      console.error('AI Assistant Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or rephrase your question.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };



  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {isCollapsed ? (
        // Collapsed state - floating button
        <div 
          onClick={onToggle}
          className="w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full shadow-2xl cursor-pointer flex items-center justify-center hover:scale-105 transition-transform duration-200 border-2 border-white/20"
        >
          <img 
            src="/production-coach-icon.svg" 
            alt="Production Coach" 
            className="w-8 h-8"
          />
        </div>
      ) : (
        // Expanded state - full chat window
        <div className="w-96 h-[600px] max-h-[80vh] max-w-[calc(100vw-2rem)] md:max-w-96">
          <div className="h-full bg-gray-800 shadow-2xl border border-gray-700 rounded-lg flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gradient-to-r from-purple-600 to-blue-600 flex-shrink-0">
              <div className="flex items-center min-w-0 flex-1">
                <SparklesIcon className="w-5 h-5 text-white mr-2 flex-shrink-0" />
                <h2 className="text-lg font-bold text-white truncate">Production Coach</h2>
              </div>
              <div className="flex gap-1 flex-shrink-0 ml-2">
                <Button 
                  onClick={clearConversation} 
                  variant="outline" 
                  size="sm" 
                  className="text-white border-white/30 hover:bg-white/10 hidden sm:inline-flex"
                >
                  Clear
                </Button>
                <Button 
                  onClick={onToggle} 
                  variant="outline" 
                  size="sm" 
                  className="text-white border-white/30 hover:bg-white/10 flex-shrink-0"
                >
                  <span className="text-sm">−</span>
                </Button>
              </div>
            </div>

            {/* Messages Container */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-900/50"
              style={{
                scrollBehavior: 'smooth',
                overflowAnchor: 'auto'
              }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg text-sm shadow-lg ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white rounded-br-sm'
                        : 'bg-gray-700 text-gray-100 rounded-bl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</div>
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 text-gray-100 p-3 rounded-lg text-sm shadow-lg rounded-bl-sm">
                    <Spinner text="AI is thinking..." />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-700 bg-gray-800 flex-shrink-0">
              <div className="flex gap-2 mb-2">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about production techniques..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  variant="primary"
                  size="sm"
                  className="px-4"
                >
                  {isLoading ? '...' : 'Send'}
                </Button>
              </div>
              <div className="text-xs text-gray-400 text-center">
                Press Enter to send • Clear resets conversation
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
