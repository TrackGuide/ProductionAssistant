import React from 'react';
import { MusicNoteIcon, AdjustmentsHorizontalIcon } from '../components/icons';

export class MarkdownRendererService {
  static renderMarkdown(
    markdownText: string,
    isMixFeedback: boolean = false
  ): React.ReactNode[] {
    const elements: React.ReactNode[] = [];
    if (!markdownText) return elements;

    const lines = markdownText.split('\n');
    let inTable = false;
    let currentTableRows: React.ReactNode[] = [];
    let tableHeaderProcessed = false;

    const processStyledLine = (lineContent: string, key: string | number) => {
      const boldLabelMatch = lineContent.match(/^\*\*(.*?):\*\*\s*(.*)/);
      if (boldLabelMatch) {
        const label = boldLabelMatch[1];
        const restOfLine = boldLabelMatch[2];
        elements.push(
          <p key={key} className="my-2.5 text-gray-300 leading-relaxed break-words">
            <strong className="text-orange-300 font-semibold mr-1.5">{label}:</strong> 
            <span dangerouslySetInnerHTML={{ 
              __html: restOfLine
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/✔\s/g, '<span class="text-green-400 mr-1">✔</span>') 
            }} /> 
          </p>
        );
        return;
      }

      let processedLine = lineContent
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/✔\s/g, '<span class="text-green-400 mr-1">✔</span>');

      if (lineContent.startsWith('# TRACKGUIDE:')) {
        const titleMatch = lineContent.match(/^#\s*TRACKGUIDE:\s*"?([^"\n]+)"?/i);
        const actualTitle = titleMatch && titleMatch[1] ? titleMatch[1].trim() : "Generated TrackGuide";
        elements.push(
          <h1 key={key} className="text-3xl font-bold mt-6 mb-4 text-orange-300 break-words flex items-center">
            <MusicNoteIcon className="w-6 h-6 mr-3 text-orange-400 opacity-80" />
            {actualTitle}
          </h1>
        );
        return;
      }

      if (lineContent.startsWith('# ')) {
        const IconComponent = isMixFeedback ? AdjustmentsHorizontalIcon : MusicNoteIcon;
        elements.push(
          <h1 key={key} className="text-3xl font-bold mt-6 mb-4 text-orange-300 break-words flex items-center">
            <IconComponent className="w-6 h-6 mr-3 text-orange-400 opacity-80" />
            {processedLine.substring(2)}
          </h1>
        );
        return;
      }
      
      if (lineContent.startsWith('## ')) { 
        const titleText = processedLine.substring(3);
        const iconColor = "text-orange-500";
        const titleColor = "text-orange-400";
        const IconComponent = isMixFeedback ? AdjustmentsHorizontalIcon : MusicNoteIcon;
        elements.push(
          <h2 key={key} className={`text-2xl font-semibold mt-10 mb-4 pt-4 border-t border-gray-700 ${titleColor} break-words flex items-center guidebook-section-break`}>
            <IconComponent className={`w-5 h-5 mr-2 ${iconColor} opacity-70`} />
            {titleText}
          </h2>
        ); 
        return; 
      }

      if (lineContent.startsWith('### ')) { 
        const sectionTitleText = processedLine.substring(4);
        elements.push(
          <h3 key={key} className="text-xl font-medium mt-6 mb-3 text-orange-300 break-words">
            {sectionTitleText}
          </h3>
        ); 
        return; 
      }
      
      if (lineContent.startsWith('* ') || lineContent.startsWith('- ')) { 
        elements.push(
          <li key={key} className="ml-7 list-disc text-gray-300 my-1.5" 
              dangerouslySetInnerHTML={{ __html: processedLine.substring(2) }} />
        ); 
        return; 
      }

      if (lineContent.trim() === '---') { 
        elements.push(<hr key={key} className="my-8 border-gray-600" />); 
        return; 
      }
      
      if (lineContent.trim()) {
        elements.push(
          <p key={key} className="my-2.5 text-gray-300 leading-relaxed break-words" 
             dangerouslySetInnerHTML={{ __html: processedLine }} />
        );
      }
    };

    const finalizeTable = (keySuffix: string | number) => {
      if (currentTableRows.length > 0) {
        let headerRow: React.ReactNode | null = null;
        let bodyRows = [...currentTableRows];

        if (tableHeaderProcessed && currentTableRows.length > 0) {
          headerRow = currentTableRows[0];
          bodyRows = currentTableRows.slice(1);
        }
        
        elements.push(
          <div key={`table-container-${keySuffix}`} className="overflow-x-auto my-5 shadow-md rounded-lg guidebook-section-break">
            <table className="w-full border-collapse border border-gray-600 bg-gray-800">
              {headerRow && <thead className="bg-gray-700">{headerRow}</thead>}
              {bodyRows.length > 0 && <tbody>{bodyRows}</tbody>}
            </table>
          </div>
        );
      }
      inTable = false;
      currentTableRows = [];
      tableHeaderProcessed = false;
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      const isTablePipeRow = trimmedLine.startsWith('|') && trimmedLine.endsWith('|');
      const isTableSeparator = isTablePipeRow && trimmedLine.includes('---') && 
                               trimmedLine.replace(/\|/g, '').replace(/-/g, '').trim() === '';

      if (inTable) {
        if (isTablePipeRow && !isTableSeparator) { 
          const cells = trimmedLine.split('|').slice(1, -1).map(cell => cell.trim());
          const rowContent = cells.map((cellContent, i) => (
            <td key={i} className="p-3 text-gray-300 border border-gray-600 text-sm" 
                dangerouslySetInnerHTML={{ 
                  __html: cellContent
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>') 
                }} />
          ));
          currentTableRows.push(
            <tr key={`row-${index}`} className="border-b border-gray-600 hover:bg-gray-700/50 transition-colors duration-150">
              {rowContent}
            </tr>
          );
        } else if (isTableSeparator) {
          if (currentTableRows.length > 0 && !tableHeaderProcessed) {
            const headerTextRowNode = currentTableRows.pop(); 
            if (React.isValidElement<React.HTMLAttributes<HTMLTableRowElement>>(headerTextRowNode)) {
              const headerTextRow = headerTextRowNode;
              const headerBaseColor = "bg-orange-800/30";
              const headerTextColor = "text-orange-200";
              const styledHeaderCells = React.Children.map(headerTextRow.props.children, (childNode: React.ReactNode) => {
                if (React.isValidElement(childNode)) {
                  const tdCell = childNode as React.ReactElement<React.TdHTMLAttributes<HTMLTableCellElement>>;
                  const currentProps = tdCell.props;
                  return React.cloneElement(tdCell, {
                    ...currentProps,
                    className: `p-3 font-semibold ${headerTextColor} text-left border border-gray-500 text-sm ${headerBaseColor}`, 
                  } as React.TdHTMLAttributes<HTMLTableCellElement>);
                }
                return childNode;
              });
              currentTableRows.unshift(
                <tr key={headerTextRow.key || `header-${index}`} className="border-b border-gray-500">
                  {styledHeaderCells}
                </tr>
              );
              tableHeaderProcessed = true;
            } else {
              if (headerTextRowNode) currentTableRows.push(headerTextRowNode);
            }
          }
        } else { 
          finalizeTable(index);
          processStyledLine(line, index); 
        }
      } else { 
        if (isTablePipeRow && !isTableSeparator) { 
          inTable = true;
          currentTableRows = [];
          tableHeaderProcessed = false;
          const cells = trimmedLine.split('|').slice(1, -1).map(cell => cell.trim());
          const rowContent = cells.map((cellContent, i) => (
            <td key={i} className="p-3 text-gray-300 border border-gray-600 text-sm" 
                dangerouslySetInnerHTML={{ 
                  __html: cellContent
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>') 
                }} />
          ));
          currentTableRows.push(
            <tr key={`row-${index}`} className="border-b border-gray-600 hover:bg-gray-700/50 transition-colors duration-150">
              {rowContent}
            </tr>
          );
        } else { 
          processStyledLine(line, index);
        }
      }
    });

    if (inTable) { 
      finalizeTable('final');
    }

    // Group list items into ul elements
    const finalElements: React.ReactNode[] = [];
    let currentListItems: React.ReactNode[] = [];
    elements.forEach((el, idx) => {
        if (React.isValidElement(el) && el.type === 'li') {
            currentListItems.push(el);
        } else {
            if (currentListItems.length > 0) {
                finalElements.push(
                  <ul key={`ul-${idx-currentListItems.length}`} className="space-y-1 my-3 ml-2">
                    {currentListItems}
                  </ul>
                );
                currentListItems = [];
            }
            finalElements.push(el);
        }
    });
    if (currentListItems.length > 0) {
        finalElements.push(
          <ul key={`ul-final`} className="space-y-1 my-3 ml-2">
            {currentListItems}
          </ul>
        );
    }

    return finalElements;
  }
}