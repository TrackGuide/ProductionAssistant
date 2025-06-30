import React from 'react';
import { MusicNoteIcon, AdjustmentsHorizontalIcon } from '../components/icons';
import { parseSuggestedTitleFromMarkdownStream } from '../utils/guidebookUtils';
import { GuidebookEntry } from '../types/appTypes';
import { useAppStore } from '../store/useAppStore';

export const useContentProcessing = () => {
  const { setCopyStatus } = useAppStore();

  const getFormattedTextFromHtmlElement = (element: HTMLElement): string => {
    let text = '';
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null);
    let currentNode;
    let currentLine = '';
    let listLevel = 0;
  
    const appendLine = (line: string) => {
      text += line + '\n';
      currentLine = '';
    };
  
    const appendToCurrentLine = (str: string) => {
      currentLine += str;
    };
  
    while (currentNode = walker.nextNode()) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        appendToCurrentLine(currentNode.textContent || '');
      } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const el = currentNode as HTMLElement;
        const tagName = el.tagName.toLowerCase();
  
        const blockElements = ['h1', 'h2', 'h3', 'p', 'div', 'ul', 'li', 'table', 'hr', 'tr', 'td', 'th'];
        if (blockElements.includes(tagName) && currentLine.trim() !== '') {
          appendLine(currentLine);
        }
  
        switch (tagName) {
          case 'h1': appendToCurrentLine('# '); break;
          case 'h2': appendToCurrentLine('## '); break;
          case 'h3': appendToCurrentLine('### '); break;
          case 'p': if(text.length > 0 && !text.endsWith('\n\n') && !text.endsWith('\n')) appendLine(''); break; 
          case 'strong': case 'b': appendToCurrentLine('**'); break;
          case 'em': case 'i': appendToCurrentLine('*'); break;
          case 'ul': listLevel++; break;
          case 'li': appendToCurrentLine('  '.repeat(listLevel -1) + '- '); break;
          case 'hr': appendLine('---'); break;
          case 'br': appendLine(currentLine); break; 
          case 'tr': if(currentLine.trim() !== '') appendLine(currentLine); break;
          case 'td': case 'th': appendToCurrentLine('| '); break;
        }
  
        switch (tagName) {
          case 'h1': case 'h2': case 'h3': case 'p':
            appendLine(currentLine);
            appendLine(''); 
            break;
          case 'strong': case 'b': appendToCurrentLine('**'); break;
          case 'em': case 'i': appendToCurrentLine('*'); break;
          case 'ul': listLevel--; if (!text.endsWith('\n')) appendLine(currentLine); break;
          case 'li': appendLine(currentLine); break;
          case 'tr': appendToCurrentLine(' |'); appendLine(currentLine); break; 
          case 'table': if (!text.endsWith('\n')) appendLine(''); break; 
        }
      }
    }
    if (currentLine.trim() !== '') {
      appendLine(currentLine); 
    }
    return text.replace(/\n\s*\n/g, '\n\n').trim();
  };

  const createCleanHtmlFromText = (text: string): string => {
    const lines = text.split('\n');
    let html = '<div style="color: #000000; font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; background: transparent;">';
    
    for (const line of lines) {
      if (line.trim() === '') {
        html += '<br>';
      } else if (line.startsWith('## ')) {
        html += `<h2 style="color: #000000; font-size: 1.25rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">${line.replace('## ', '')}</h2>`;
      } else if (line.startsWith('### ')) {
        html += `<h3 style="color: #000000; font-size: 1.1rem; font-weight: bold; margin: 0.75rem 0 0.25rem 0;">${line.replace('### ', '')}</h3>`;
      } else if (line.startsWith('#### ')) {
        html += `<h4 style="color: #000000; font-size: 1rem; font-weight: bold; margin: 0.5rem 0 0.25rem 0;">${line.replace('#### ', '')}</h4>`;
      } else if (line.match(/^\d+\./)) {
        html += `<p style="margin: 0.25rem 0; padding-left: 1rem; color: #000000;">${line}</p>`;
      } else if (line.startsWith('• ') || line.startsWith('- ')) {
        html += `<p style="margin: 0.25rem 0; padding-left: 1rem; color: #000000;">${line}</p>`;
      } else if (line.includes(': ')) {
        const colonIndex = line.indexOf(': ');
        const key = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 2);
        html += `<p style="margin: 0.25rem 0; color: #000000;"><strong style="color: #000000;">${key}:</strong> ${value}</p>`;
      } else {
        html += `<p style="margin: 0.5rem 0; color: #000000;">${line}</p>`;
      }
    }
    
    html += '</div>';
    return html;
  };

  const handleCopyFormattedContent = async (elementId: string) => {
    const contentDisplayElement = document.getElementById(elementId);
    if (!contentDisplayElement) {
      setCopyStatus("Content area not found.");
      setTimeout(() => setCopyStatus(''), 3000);
      return;
    }

    const plainTextContent = getFormattedTextFromHtmlElement(contentDisplayElement.cloneNode(true) as HTMLElement);
    const cleanHtmlContent = createCleanHtmlFromText(plainTextContent);

    try {
      if (navigator.clipboard && navigator.clipboard.write) {
        const htmlBlob = new Blob([cleanHtmlContent], { type: 'text/html' });
        const textBlob = new Blob([plainTextContent], { type: 'text/plain' });
        
        // @ts-ignore
        const clipboardItem = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
        setCopyStatus("Content Copied (Rich Format)!");
      } else { 
        await navigator.clipboard.writeText(plainTextContent);
        setCopyStatus("Content Copied (Plain Text)!");
      }
    } catch (err) {
      console.error("Failed to copy content using modern Clipboard API:", err);
      try {
        const textArea = document.createElement("textarea");