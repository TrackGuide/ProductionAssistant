import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Textarea } from './Textarea';
import { Spinner } from './Spinner';
import { CloseIcon } from './icons';
import { generateAIAssistantResponse } from '../services/geminiService';
import { MarkdownRendererService } from '../services/markdownRenderer.service';
import { ContentCopyService } from '../services/contentCopy.service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ 
  isCollapsed, 
  onToggleCollapse 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: string }>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingResponse]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsGenerating(true);
    setStreamingResponse('');

    try {
      const responseStream = await generateAIAssistantResponse(inputMessage.trim());
      let fullResponse = '';
      
      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullResponse += chunk.text;
          setStreamingResponse(fullResponse);
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingResponse('');
    } catch (error) {
      console.error('AI Assistant error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setStreamingResponse('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      // Create a temporary div to render the markdown content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      const plainTextContent = ContentCopyService.getFormattedTextFromHtmlElement(tempDiv);
      const cleanHtmlContent = ContentCopyService.createCleanHtmlFromText(plainTextContent);

      if (navigator.clipboard && navigator.clipboard.write) {
        const htmlBlob = new Blob([cleanHtmlContent], { type: 'text/html' });
        const textBlob = new Blob([plainTextContent], { type: 'text/plain' });
        
        // @ts-ignore
        const clipboardItem = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
        setCopyStatus(prev => ({ ...prev, [messageId]: "Copied (Rich Format)!" }));
      } else {
        await navigator.clipboard.writeText(plainTextContent);
        setCopyStatus(prev => ({ ...prev, [messageId]: "Copied!" }));
      }
    } catch (err) {
      console.error("Failed to copy message:", err);
      setCopyStatus(prev => ({ ...prev, [messageId]: "Failed to copy" }));
    }

    setTimeout(() => {
      setCopyStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[messageId];
        return newStatus;
      });
    }, 3000);
  };

  const clearConversation = () => {
    setMessages([]);
    setStreamingResponse('');
    setCopyStatus({});
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const renderedContent = isUser 
      ? [<p key="user-message" className="whitespace-pre-wrap">{message.content}</p>]
      : MarkdownRendererService.renderMarkdown(message.content, false);

    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[80%] rounded-lg p-4 ${
          isUser 
            ? 'bg-orange-500 text-white' 
            : 'bg-gray-700 text-gray-100'
        }`}>
          <div className="flex items-start justify-between mb-2">
            <span className={`text-xs font-medium ${
              isUser ? 'text-orange-100' : 'text-gray-400'
            }`}>
              {isUser ? 'You' : 'AI Assistant'}
            </span>
            {!isUser && (
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleCopyMessage(message.id, message.content)}
                  className="text-xs text-gray-400 hover:text-gray-200 transition-colors p-1 rounded hover:bg-gray-600"
                  title="Copy message"
                >
                  📋
                </button>
                {copyStatus[message.id] && (
                  <span className="text-xs text-green-400">
                    {copyStatus[message.id]}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            {renderedContent}
          </div>
          <div className={`text-xs mt-2 ${
            isUser ? 'text-orange-200' : 'text-gray-500'
          }`}>
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={onToggleCollapse}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
          title="Open AI Assistant"
        >
          <span className="text-xl">🤖</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="absolute inset-4 bg-gray-800 rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h2 className="text-xl font-bold text-white">AI Production Coach</h2>
              <p className="text-sm text-gray-400">Ask me anything about music production</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {messages.length > 0 && (
              <Button
                onClick={clearConversation}
                variant="secondary"
                size="sm"
                className="text-xs"
              >
                Clear Chat
              </Button>
            )}
            <Button
              onClick={onToggleCollapse}
              variant="secondary"
              size="sm"
              className="p-2"
              title="Close AI Assistant"
            >
              <CloseIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !streamingResponse && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Welcome to your AI Production Coach!
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                I'm here to help with music production questions, mixing advice, 
                creative suggestions, and technical guidance. What would you like to know?
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <button
                  onClick={() => setInputMessage("How do I make my mix sound more professional?")}
                  className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left text-sm text-gray-300 transition-colors"
                >
                  💡 How do I make my mix sound more professional?
                </button>
                <button
                  onClick={() => setInputMessage("What's the best way to structure a song?")}
                  className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left text-sm text-gray-300 transition-colors"
                >
                  🎼 What's the best way to structure a song?
                </button>
                <button
                  onClick={() => setInputMessage("How do I choose the right key for my track?")}
                  className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left text-sm text-gray-300 transition-colors"
                >
                  🎹 How do I choose the right key for my track?
                </button>
                <button
                  onClick={() => setInputMessage("What are some creative arrangement ideas?")}
                  className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left text-sm text-gray-300 transition-colors"
                >
                  ✨ What are some creative arrangement ideas?
                </button>
              </div>
            </div>
          )}

          {messages.map(renderMessage)}

          {/* Streaming Response */}
          {streamingResponse && (
            <div className="flex justify-start mb-4">
              <div className="max-w-[80%] rounded-lg p-4 bg-gray-700 text-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400">
                    AI Assistant
                  </span>
                  <div className="flex items-center gap-2 ml-4">
                    <Spinner size="sm" />
                    <span className="text-xs text-gray-400">Thinking...</span>
                  </div>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  {MarkdownRendererService.renderMarkdown(streamingResponse, false)}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex space-x-3">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about music production..."
                rows={2}
                className="resize-none"
                disabled={isGenerating}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isGenerating}
              className="self-end px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600"
            >
              {isGenerating ? (
                <Spinner size="sm" />
              ) : (
                <span>Send</span>
              )}
            </Button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};
