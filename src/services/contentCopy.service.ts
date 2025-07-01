export class ContentCopyService {
  static getFormattedTextFromHtmlElement(element: HTMLElement): string {
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
  }

  static createCleanHtmlFromText(text: string): string {
    const lines = text.split('\n');
    let html = '<div style="color: #000000; font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; background: transparent;">';
    
    for (const line of lines) {
      if (line.trim() === '') {
        html += '<br>';
      } else if (line.startsWith('### ')) {
        html += `<h3>${line.substring(4)}</h3>`;
      } else if (line.startsWith('## ')) {
        html += `<h2>${line.substring(3)}</h2>`;
      } else if (line.startsWith('# ')) {
        html += `<h1>${line.substring(2)}</h1>`;
      } else {
        html += `<p>${line}</p>`;
      }
    }
    html += '</div>';
    return html;
  }
}