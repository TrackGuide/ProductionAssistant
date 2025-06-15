import React, { useState, useRef, useEffect } from 'react';
import { Card } from './Card.tsx';
import { Button } from './Button.tsx';
import { Input } from './Input.tsx';
import { Spinner } from './Spinner.tsx';
import { SparklesIcon, CloseIcon } from './icons.tsx';
import { generateAIAssistantResponse } from '../services/geminiService.ts';
import { UserInputs, GuidebookEntry } from '../types.ts';

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
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  currentGuidebook,
  userInputs
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI music production assistant. I can help you:

• Refine your TrackGuide with specific questions
• Suggest improvements to your current project
• Answer production techniques questions
• Help adjust your genre, vibe, or arrangement ideas
• Provide detailed explanations about any aspect of your track

What would you like to work on today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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
      const context = {
        currentGuidebook: currentGuidebook?.content || '',
        userInputs: userInputs || {},
        conversationHistory: messages.slice(-6) // Last 6 messages for context
      };

      const assistantContent = await generateAIAssistantResponse(userMessage.content, context);

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

  const clearConversation = () => {
    setMessages([messages[0]]); // Keep the initial greeting
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[80vh] bg-gray-800 shadow-xl border border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <SparklesIcon className="w-6 h-6 text-purple-400 mr-2" />
            <h2 className="text-xl font-bold text-white">AI Production Assistant</h2>
            {currentGuidebook && (
              <span className="ml-3 px-2 py-1 bg-purple-600 text-white text-xs rounded">
                Working on: {currentGuidebook.title}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={clearConversation} variant="outline" size="sm">
              Clear Chat
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              <CloseIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-gray-100 p-3 rounded-lg">
                <Spinner text="AI is thinking..." />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Ask me anything about your track, production techniques, or improvements..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              variant="primary"
            >
              Send
            </Button>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </Card>
    </div>
  );
};