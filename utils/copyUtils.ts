export const copyToClipboard = async (content: string): Promise<{ success: boolean; message: string }> => {
  if (!content) {
    return { success: false, message: "No content to copy" };
  }

  try {
    // Create styled HTML content with black text on white/transparent background
    const styledHtml = `
      <div style="color: #000000; font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; background: transparent;">
        ${content.split('\n').map(line => {
          if (line.startsWith('# ')) {
            return `<h1 style="color: #000000; font-size: 1.5rem; font-weight: bold; margin: 1.5rem 0 1rem 0;">${line.replace('# ', '')}</h1>`;
          } else if (line.startsWith('## ')) {
            return `<h2 style="color: #000000; font-size: 1.25rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">${line.replace('## ', '')}</h2>`;
          } else if (line.startsWith('### ')) {
            return `<h3 style="color: #000000; font-size: 1.1rem; font-weight: bold; margin: 0.75rem 0 0.25rem 0;">${line.replace('### ', '')}</h3>`;
          } else if (line.startsWith('#### ')) {
            return `<h4 style="color: #000000; font-size: 1rem; font-weight: bold; margin: 0.5rem 0 0.25rem 0;">${line.replace('#### ', '')}</h4>`;
          } else if (line.startsWith('- **')) {
            const match = line.match(/- \*\*(.*?)\*\*:\s*(.*)/);
            if (match) {
              return `<p style="margin: 0.25rem 0; color: #000000;"><strong style="color: #000000;">${match[1]}:</strong> ${match[2]}</p>`;
            }
          } else if (line.startsWith('- ')) {
            return `<p style="margin: 0.25rem 0; padding-left: 1rem; color: #000000;">• ${line.replace('- ', '')}</p>`;
          } else if (line.match(/^\d+\./)) {
            return `<p style="margin: 0.25rem 0; padding-left: 1rem; color: #000000;">${line}</p>`;
          } else if (line.startsWith('**') && line.endsWith('**')) {
            return `<p style="margin: 0.5rem 0; color: #000000; font-weight: bold;">${line.replace(/\*\*/g, '')}</p>`;
          } else if (line.trim()) {
            return `<p style="margin: 0.5rem 0; color: #000000;">${line}</p>`;
          }
          return '<br>';
        }).join('')}
      </div>
    `;

    // Create clean plain text version without markdown formatting
    const cleanText = content.split('\n').map(line => {
      if (line.startsWith('# ')) {
        return line.replace('# ', '');
      } else if (line.startsWith('## ')) {
        return line.replace('## ', '');
      } else if (line.startsWith('### ')) {
        return line.replace('### ', '');
      } else if (line.startsWith('#### ')) {
        return line.replace('#### ', '');
      } else if (line.startsWith('- **')) {
        const match = line.match(/- \*\*(.*?)\*\*:\s*(.*)/);
        if (match) {
          return `${match[1]}: ${match[2]}`;
        }
      } else if (line.startsWith('- ')) {
        return `• ${line.replace('- ', '')}`;
      } else if (line.startsWith('**') && line.endsWith('**')) {
        return line.replace(/\*\*/g, '');
      }
      return line;
    }).join('\n');

    if (navigator.clipboard && navigator.clipboard.write) {
      const htmlBlob = new Blob([styledHtml], { type: 'text/html' });
      const textBlob = new Blob([cleanText], { type: 'text/plain' });
      
      // @ts-ignore
      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });
      await navigator.clipboard.write([clipboardItem]);
      return { success: true, message: "Content copied (Rich Format)!" };
    } else {
      await navigator.clipboard.writeText(cleanText);
      return { success: true, message: "Content copied (Plain Text)!" };
    }
  } catch (err) {
    console.error("Failed to copy content:", err);
    return { success: false, message: "Failed to copy. Please try manually." };
  }
};