import React, { useState, useRef, useEffect } from 'react';
import { Card } from './Card.tsx';
import { Button } from './Button.tsx';
import { Input } from './Input.tsx';
import { Spinner } from './Spinner.tsx';
import { SparklesIcon, CloseIcon } from './icons.tsx';
import { 
  generateAIAssistantResponseSimple,
  regenerateTrackGuide,
  regenerateMixFeedback,
  regenerateRemixGuide,
  regenerateMixCompare
} from '../services/geminiService.ts';
import { UserInputs, GuidebookEntry } from '../types.ts';

// Make sure this type is exported if it's used in geminiService.ts
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
  contextLabel?: string;
  onUpdateDocument?: (content: string, documentType: string) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  currentGuidebook,
  userInputs,
  onUpdateGuidebook,
  onUpdateInputs,
  isCollapsed = false,
  onToggle,
  contextLabel
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  

  // Reset messages when context changes
  useEffect(() => {
    if (contextLabel) {
      clearConversation();
    }
  }, [contextLabel]);

  // Initialize with welcome message when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      clearConversation();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isCollapsed && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isCollapsed]);

  const clearConversation = () => {
    const defaultWelcome = contextLabel
      ? `Hi! You're chatting about: "${contextLabel}". You can ask to revise, clarify, or expand.`
      : `Hi! I'm your AI music production assistant. I can help you:
• Refine your TrackGuide with specific questions
• Suggest improvements to your current project
• Answer production techniques questions
• Help adjust your genre, vibe, or arrangement ideas
• Provide detailed explanations about any aspect of your track

What would you like to work on today?`;
    
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: defaultWelcome,
      timestamp: new Date(),
    }]);
  };

  // Add after your existing state declarations, around line 20-30
const handleRegenerateDocument = async (modificationType: string) => {
  setIsLoading(true);
  try {
    // Find the most recent user and assistant messages
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    const latestUserMessage = userMessages.length > 0 
      ? userMessages[userMessages.length - 1].content 
      : '';
      
    const latestAIResponse = assistantMessages.length > 0 
      ? assistantMessages[assistantMessages.length - 1].content 
      : '';
    
    // Combine them to create context for the regeneration
    const modificationContext = {
      userRequest: latestUserMessage,
      aiSuggestion: latestAIResponse,
      currentGuidebook: currentGuidebook,
      userInputs: userInputs
    };
    
    // Call the appropriate regeneration function based on type
    let newContent = '';
    switch(modificationType) {
      case 'trackguide':
        newContent = await regenerateTrackGuide(modificationContext);
        break;
      case 'mixfeedback':
        newContent = await regenerateMixFeedback(modificationContext);
        break;
      case 'remixguide':
        newContent = await regenerateRemixGuide(modificationContext);
        break;
      case 'mixcompare':
        newContent = await regenerateMixCompare(modificationContext);
        break;
      default:
        throw new Error(`Unknown document type: ${modificationType}`);
    }
    
    // Update the document content
    if (onUpdateDocument) {
      onUpdateDocument(newContent, modificationType);
    }
    
    // Add a confirmation message to the chat
    addMessage({
      role: 'assistant',
      content: `I've updated the ${modificationType === 'trackguide' ? 'TrackGuide' : 
                modificationType === 'mixfeedback' ? 'Mix Feedback' : 
                modificationType === 'remixguide' ? 'Remix Guide' : 
                'Mix Comparison'} with the requested changes.`
    });
  } catch (error) {
    console.error("Error regenerating document:", error);
    addMessage({
      role: 'assistant',
      content: `Sorry, I encountered an error while trying to update the document: ${error instanceof Error ? error.message : "Unknown error"}`
    });
  } finally {
    setIsLoading(false);
  }
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
      // Create context object for the AI service
      const context = {
        currentGuidebook: currentGuidebook,
        userInputs: userInputs,

        conversationHistory: messages.slice(-6), // Last 6 messages for context
        contextLabel: contextLabel
      };
      
      console.log('Sending request with context:', {
        message: userMessage.content,
        guidebookTitle: currentGuidebook?.title || 'None',
        contextLabel: contextLabel || 'None'
      });
      
      // Use the simple non-streaming version for easier implementation
      const assistantContent = await generateAIAssistantResponseSimple(
        userMessage.content,
        context
      );
      
      // Check if response is valid
      if (!assistantContent || typeof assistantContent !== 'string') {
        throw new Error('Invalid response from AI service');
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Assistant Error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. This might be due to the AI service being unavailable or the request format. Please try again in a moment.',
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

  // If not open, don't render anything
  if (!isOpen) return null;

  // Add this helper function
  const addMessage = (message: { role: 'user' | 'assistant', content: string }) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: message.role,
      content: message.content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Example implementation for a page component
  const handleUpdateDocument = (content: string, documentType: string) => {
    if (documentType === 'trackguide' && currentGuidebook) {
      // Update the guidebook with new content
      const updatedGuidebook = {
        ...currentGuidebook,
        content: content
      };
      setCurrentGuidebook
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {isCollapsed ? (
        // Collapsed state - floating button
        <button 
          onClick={onToggle}
          className="w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full shadow-2xl cursor-pointer flex items-center justify-center hover:scale-105 transition-transform duration-200 border-2 border-white/20"
          aria-label="Open Production Coach"
        >
          <img 
            src="/production-coach-icon.svg" 
            alt="Production Coach" 
            className="w-8 h-8" 
          />
        </button>
      ) : (
        // Expanded state - full chat window
        <div className="w-96 h-[600px] max-h-[80vh] max-w-[calc(100vw-2rem)] md:max-w-96">
          <div className="h-full bg-gray-800 shadow-2xl border border-gray-700 rounded-lg flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gradient-to-r from-purple-600 to-blue-600 flex-shrink-0">
              <div className="flex items-center min-w-0 flex-1">
                <SparklesIcon className="w-5 h-5 text-white mr-2 flex-shrink-0" />
                <h2 className="text-lg font-bold text-white truncate">
                  {contextLabel ? `Chat: ${contextLabel}` : 'Production Coach'}
                </h2>
              </div>
              <div className="flex gap-1 flex-shrink-0 ml-2">
                <Button 
                  onClick={clearConversation} 
                  variant="outline" 
                  size="sm" 
                  className="text-white border-white/30 hover:bg-white/10 hidden sm:inline-flex"
                  aria-label="Clear conversation"
                >
                  Clear
                </Button>
                <Button 
                  onClick={onToggle || onClose} 
                  variant="outline" 
                  size="sm" 
                  className="text-white border-white/30 hover:bg-white/10 flex-shrink-0"
                  aria-label={contextLabel ? "Close assistant" : "Minimize assistant"}
                >
                  <span className="text-sm">{contextLabel ? "✕" : "−"}</span>
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
                  placeholder={contextLabel 
                    ? `Ask about ${contextLabel}...` 
                    : "Ask about production techniques..."
                  }
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
