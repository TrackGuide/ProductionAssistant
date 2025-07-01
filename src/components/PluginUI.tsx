import React from 'react';

interface PluginUIProps {
  data: any;
}

/**
 * Plugin UI visualization component
 * Renders a simplified synth interface based on provided data
 */
export const PluginUI: React.FC<PluginUIProps> = ({ data }) => {
  if (!data) return null;
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-medium text-gray-300 mb-2">Plugin UI</h3>
      <canvas 
        width={800} 
        height={400} 
        className="w-full h-auto rounded border border-gray-600"
        ref={ref => {
          if (!ref || !data) return;
          
          const ctx = ref.getContext('2d');
          if (!ctx) return;
          
          // Draw background
          ctx.fillStyle = '#111827'; // gray-900
          ctx.fillRect(0, 0, 800, 400);
          
          // Draw title
          ctx.fillStyle = '#34d399'; // emerald-400
          ctx.font = '20px sans-serif';
          ctx.fillText(data.title || 'Synth UI', 20, 40);
          
          // Draw controls if available
          if (data.controls && Array.isArray(data.controls)) {
            data.controls.forEach((control: any) => {
              if (control.type === 'knob') {
                drawKnob(ctx, control);
              } else if (control.type === 'slider') {
                drawSlider(ctx, control);
              } else if (control.type === 'button') {
                drawButton(ctx, control);
              } else if (control.type === 'switch') {
                drawSwitch(ctx, control);
              } else if (control.type === 'display') {
                drawDisplay(ctx, control);
              }
            });
          }
          
          // Draw sections/panels
          if (data.sections && Array.isArray(data.sections)) {
            data.sections.forEach((section: any) => {
              drawSection(ctx, section.x, section.y, section.width, section.height, section.title);
            });
          }
        }}
      />
    </div>
  );
};

// Helper functions for drawing UI elements
function drawSynthInterface(ctx: CanvasRenderingContext2D, width: number, height: number, data: any, synthName: string, patchName: string) {
  // Background
  ctx.fillStyle = '#1f2937'; // gray-800
  ctx.fillRect(0, 0, width, height);
  
  // Header
  drawHeader(ctx, synthName, patchName, width);
  
  // Main sections
  const sectionHeight = 100;
  const sectionWidth = width - 40;
  const startX = 20;
  let startY = 70;
  
  // Oscillator section
  drawOscillatorSection(ctx, data, startX, startY, sectionWidth, sectionHeight);
  startY += sectionHeight + 10;
  
  // Filter section
  drawFilterSection(ctx, data, startX, startY, sectionWidth, sectionHeight);
  startY += sectionHeight + 10;
  
  // Envelope section
  drawEnvelopeSection(ctx, data, startX, startY, sectionWidth, sectionHeight);
  startY += sectionHeight + 10;
  
  // Modulation section
  drawModulationSection(ctx, data, startX, startY, sectionWidth, sectionHeight);
  startY += sectionHeight + 10;
  
  // Effects section
  drawEffectsSection(ctx, data, startX, startY, sectionWidth, sectionHeight);
  startY += sectionHeight + 10;
  
  // Keyboard
  drawKeyboardSection(ctx, startX, startY, sectionWidth, 60);
}

function drawHeader(ctx: CanvasRenderingContext2D, synthName: string, patchName: string, width: number) {
  // Header background
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#4f46e5'); // indigo-600
  gradient.addColorStop(1, '#7c3aed'); // purple-600
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, 50);
  
  // Synth name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(synthName, 20, 30);
  
  // Patch name
  ctx.fillStyle = '#e5e7eb'; // gray-200
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(patchName, width - 20, 30);
}

function drawOscillatorSection(ctx: CanvasRenderingContext2D, data: any, x: number, y: number, w: number, h: number) {
  drawSection(ctx, x, y, w, h, 'OSCILLATOR');
  
  // Draw waveform selector
  drawWaveformSelector(ctx, x + 20, y + 40, data.waveform || 'sine');
  
  // Draw oscillator knobs
  if (data.knobs) {
    const knobX = x + w - 200;
    const knobY = y + 40;
    const spacing = 70;
    
    if (data.knobs.detune !== undefined) {
      drawKnob(ctx, { x: knobX, y: knobY, name: 'Detune', value: data.knobs.detune });
    }
    
    if (data.knobs.octave !== undefined) {
      drawKnob(ctx, { x: knobX + spacing, y: knobY, name: 'Octave', value: data.knobs.octave });
    }
  }
}

function drawFilterSection(ctx: CanvasRenderingContext2D, data: any, x: number, y: number, w: number, h: number) {
  drawSection(ctx, x, y, w, h, 'FILTER');
  
  // Draw filter type selector
  drawFilterTypeSelector(ctx, x + 20, y + 40);
  
  // Draw filter knobs
  if (data.knobs) {
    const knobX = x + w - 280;
    const knobY = y + 40;
    const spacing = 70;
    
    if (data.knobs.cutoff !== undefined) {
      drawKnob(ctx, { x: knobX, y: knobY, name: 'Cutoff', value: data.knobs.cutoff });
    }
    
    if (data.knobs.resonance !== undefined) {
      drawKnob(ctx, { x: knobX + spacing, y: knobY, name: 'Resonance', value: data.knobs.resonance });
    }
    
    if (data.knobs.drive !== undefined) {
      drawKnob(ctx, { x: knobX + spacing * 2, y: knobY, name: 'Drive', value: data.knobs.drive });
    }
  }
}

function drawEnvelopeSection(ctx: CanvasRenderingContext2D, data: any, x: number, y: number, w: number, h: number) {
  drawSection(ctx, x, y, w, h, 'ENVELOPE');
  
  // Draw ADSR visualization
  if (data.adsr) {
    drawMiniADSR(ctx, x + 20, y + 30, 200, 60, data.adsr);
  }
  
  // Draw envelope knobs
  if (data.adsr) {
    const knobX = x + w - 280;
    const knobY = y + 40;
    const spacing = 70;
    
    drawKnob(ctx, { x: knobX, y: knobY, name: 'Attack', value: data.adsr.attack });
    drawKnob(ctx, { x: knobX + spacing, y: knobY, name: 'Decay', value: data.adsr.decay });
    drawKnob(ctx, { x: knobX + spacing * 2, y: knobY, name: 'Sustain', value: data.adsr.sustain });
    drawKnob(ctx, { x: knobX + spacing * 3, y: knobY, name: 'Release', value: data.adsr.release });
  }
}

function drawModulationSection(ctx: CanvasRenderingContext2D, data: any, x: number, y: number, w: number, h: number) {
  drawSection(ctx, x, y, w, h, 'MODULATION');
  
  // Draw modulation matrix
  if (data.modMatrix && Array.isArray(data.modMatrix)) {
    drawModMatrix(ctx, x + 20, y + 30, w - 40, h - 40, data.modMatrix);
  }
}

function drawEffectsSection(ctx: CanvasRenderingContext2D, data: any, x: number, y: number, w: number, h: number) {
  drawSection(ctx, x, y, w, h, 'EFFECTS');
  
  // Draw effect knobs
  if (data.knobs) {
    const knobX = x + 20;
    const knobY = y + 40;
    const spacing = 70;
    let i = 0;
    
    for (const [name, value] of Object.entries(data.knobs)) {
      if (!['cutoff', 'resonance', 'drive', 'detune', 'octave'].includes(name)) {
        drawKnob(ctx, { x: knobX + spacing * i, y: knobY, name, value: value as number });
        i++;
        if (i >= 6) break; // Limit to 6 effect knobs
      }
    }
  }
}

function drawKeyboardSection(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Keyboard background
  ctx.fillStyle = '#111827'; // gray-900
  ctx.fillRect(x, y, w, h);
  
  // White keys
  const numWhiteKeys = 14;
  const whiteKeyWidth = w / numWhiteKeys;
  
  ctx.fillStyle = '#f3f4f6'; // gray-100
  for (let i = 0; i < numWhiteKeys; i++) {
    ctx.fillRect(x + i * whiteKeyWidth, y, whiteKeyWidth - 1, h);
    ctx.strokeRect(x + i * whiteKeyWidth, y, whiteKeyWidth, h);
  }
  
  // Black keys
  ctx.fillStyle = '#111827'; // gray-900
  const blackKeyWidth = whiteKeyWidth * 0.6;
  const blackKeyHeight = h * 0.6;
  
  const blackKeyPositions = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12]; // Relative positions
  for (const pos of blackKeyPositions) {
    ctx.fillRect(
      x + pos * whiteKeyWidth + whiteKeyWidth * 0.7,
      y,
      blackKeyWidth,
      blackKeyHeight
    );
  }
}

function drawSection(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string) {
  // Section background with gradient
  const gradient = ctx.createLinearGradient(x, y, x, y + h);
  gradient.addColorStop(0, '#374151'); // gray-700
  gradient.addColorStop(1, '#1f2937'); // gray-800
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);
  
  // Section border
  ctx.strokeStyle = '#6b7280'; // gray-500
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  
  // Section title
  ctx.fillStyle = '#d1d5db'; // gray-300
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, x + 10, y + 20);
}

function drawWaveformSelector(ctx: CanvasRenderingContext2D, x: number, y: number, selectedWaveform: string) {
  const waveforms = ['sine', 'square', 'saw', 'triangle', 'noise'];
  const buttonWidth = 60;
  const buttonHeight = 25;
  const spacing = 5;
  
  waveforms.forEach((waveform, index) => {
    const buttonX = x + (buttonWidth + spacing) * index;
    
    // Button background
    ctx.fillStyle = waveform === selectedWaveform ? '#f97316' : '#4b5563'; // orange-500 or gray-600
    ctx.fillRect(buttonX, y, buttonWidth, buttonHeight);
    
    // Button border
    ctx.strokeStyle = '#9ca3af'; // gray-400
    ctx.lineWidth = 1;
    ctx.strokeRect(buttonX, y, buttonWidth, buttonHeight);
    
    // Button text
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(waveform, buttonX + buttonWidth / 2, y + buttonHeight / 2);
  });
}

function drawFilterTypeSelector(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const filterTypes = ['LP', 'HP', 'BP', 'Notch'];
  const buttonWidth = 50;
  const buttonHeight = 25;
  const spacing = 5;
  
  filterTypes.forEach((type, index) => {
    const buttonX = x + (buttonWidth + spacing) * index;
    
    // Button background
    ctx.fillStyle = index === 0 ? '#f97316' : '#4b5563'; // orange-500 or gray-600
    ctx.fillRect(buttonX, y, buttonWidth, buttonHeight);
    
    // Button border
    ctx.strokeStyle = '#9ca3af'; // gray-400
    ctx.lineWidth = 1;
    ctx.strokeRect(buttonX, y, buttonWidth, buttonHeight);
    
    // Button text
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type, buttonX + buttonWidth / 2, y + buttonHeight / 2);
  });
}

function drawMiniADSR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, adsr: any) {
  // Background
  ctx.fillStyle = '#111827'; // gray-900
  ctx.fillRect(x, y, w, h);
  
  // ADSR curve
  const { attack = 0.1, decay = 0.5, sustain = 0.8, release = 0.5 } = adsr;
  
  // Normalize values
  const totalTime = attack + decay + 0.3 + release; // 0.3 for sustain hold
  const attackWidth = (attack / totalTime) * w * 0.8;
  const decayWidth = (decay / totalTime) * w * 0.8;
  const sustainWidth = (0.3 / totalTime) * w * 0.8;
  const releaseWidth = (release / totalTime) * w * 0.8;
  
  const maxY = h * 0.9;
  const minY = h * 0.1;
  const sustainY = minY + (1 - sustain) * (maxY - minY);
  
  // Draw curve
  ctx.beginPath();
  ctx.moveTo(x, maxY);
  ctx.lineTo(x + attackWidth, minY);
  ctx.lineTo(x + attackWidth + decayWidth, sustainY);
  ctx.lineTo(x + attackWidth + decayWidth + sustainWidth, sustainY);
  ctx.lineTo(x + attackWidth + decayWidth + sustainWidth + releaseWidth, maxY);
  
  ctx.strokeStyle = '#f97316'; // orange-500
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawModMatrix(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, modMatrix: any[]) {
  if (!modMatrix || modMatrix.length === 0) return;
  
  // Extract unique sources and targets
  const sources = Array.from(new Set(modMatrix.map(m => m.source)));
  const targets = Array.from(new Set(modMatrix.map(m => m.target)));
  
  const cellSize = Math.min(30, w / (targets.length + 1), h / (sources.length + 1));
  const headerHeight = 20;
  
  // Draw headers
  ctx.fillStyle = '#d1d5db'; // gray-300
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  
  // Target headers (top)
  targets.forEach((target, i) => {
    const targetX = x + (i + 1) * cellSize;
    ctx.save();
    ctx.translate(targetX + cellSize / 2, y + headerHeight / 2);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(target.substring(0, 8), 0, 0);
    ctx.restore();
  });
  
  // Source headers (left)
  sources.forEach((source, i) => {
    const sourceY = y + headerHeight + (i + 0.5) * cellSize;
    ctx.textAlign = 'right';
    ctx.fillText(source.substring(0, 8), x + cellSize - 5, sourceY + 3);
  });
  
  // Draw grid
  ctx.strokeStyle = '#4b5563'; // gray-600
  ctx.lineWidth = 1;
  
  // Draw cells
  for (let i = 0; i < sources.length; i++) {
    for (let j = 0; j < targets.length; j++) {
      const cellX = x + (j + 1) * cellSize;
      const cellY = y + headerHeight + i * cellSize;
      
      // Find if there's a connection
      const connection = modMatrix.find(m => 
        m.source === sources[i] && m.target === targets[j]
      );
      
      // Cell background
      ctx.fillStyle = connection ? '#f97316' : '#374151'; // orange-500 or gray-700
      ctx.globalAlpha = connection ? 0.8 : 0.3;
      ctx.fillRect(cellX, cellY, cellSize, cellSize);
      ctx.globalAlpha = 1;
      
      // Cell border
      ctx.strokeRect(cellX, cellY, cellSize, cellSize);
      
      // Connection amount
      if (connection) {
        const amount = connection.amount || 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = '9px sans-serif';
        ctx.fillText(Math.round(amount * 100).toString(), cellX + cellSize / 2, cellY + cellSize / 2 + 3);
      }
    }
  }
  
  // Draw LED indicators
  sources.forEach((source, i) => {
    drawLED(ctx, x + cellSize / 4, y + headerHeight + i * cellSize + cellSize / 2, true, '#10b981'); // emerald-500
  });
}

function drawLED(ctx: CanvasRenderingContext2D, x: number, y: number, isOn: boolean, color: string) {
  const radius = 4;
  
  // LED background
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = isOn ? color : '#4b5563'; // gray-600
  ctx.fill();
  
  // LED highlight
  ctx.beginPath();
  ctx.arc(x - radius / 3, y - radius / 3, radius / 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawKnob(ctx: CanvasRenderingContext2D, control: any) {
  const { x, y, name, value = 0.5 } = control;
  const size = control.size || 50;
  const radius = size / 2;
  
  // Draw knob body
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#4b5563'; // gray-600
  ctx.fill();
  ctx.strokeStyle = '#9ca3af'; // gray-400
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw indicator line
  const angle = (-140 + value * 280) * Math.PI / 180;
  const indicatorLength = radius * 0.7;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x + Math.cos(angle) * indicatorLength,
    y + Math.sin(angle) * indicatorLength
  );
  ctx.strokeStyle = '#f97316'; // orange-500
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Draw label
  ctx.fillStyle = '#d1d5db'; // gray-300
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y + radius + 15);
  
  // Draw value
  ctx.fillStyle = '#9ca3af'; // gray-400
  ctx.font = '10px sans-serif';
  ctx.fillText(Math.round(value * 100).toString(), x, y + 4);
}

function drawSlider(ctx: CanvasRenderingContext2D, control: any) {
  const { x, y, name, value = 0.5, width = 120, height = 20, orientation = 'horizontal' } = control;
  
  // Draw slider track
  ctx.fillStyle = '#374151'; // gray-700
  
  if (orientation === 'horizontal') {
    ctx.fillRect(x, y, width, height);
    
    // Draw slider handle
    const handlePos = x + width * value;
    ctx.fillStyle = '#f97316'; // orange-500
    ctx.fillRect(handlePos - 5, y - 5, 10, height + 10);
    
    // Draw label
    ctx.fillStyle = '#d1d5db'; // gray-300
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, x + width / 2, y + height + 15);
  } else {
    // Vertical slider
    ctx.fillRect(x, y, height, width);
    
    // Draw slider handle
    const handlePos = y + width * (1 - value);
    ctx.fillStyle = '#f97316'; // orange-500
    ctx.fillRect(x - 5, handlePos - 5, height + 10, 10);
    
    // Draw label
    ctx.fillStyle = '#d1d5db'; // gray-300
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, x + height / 2, y + width + 15);
  }
}

function drawButton(ctx: CanvasRenderingContext2D, control: any) {
  const { x, y, name, active = false, width = 80, height = 30 } = control;
  
  // Draw button background
  ctx.fillStyle = active ? '#f97316' : '#4b5563'; // orange-500 or gray-600
  ctx.fillRect(x, y, width, height);
  
  // Draw button border
  ctx.strokeStyle = '#9ca3af'; // gray-400
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  
  // Draw button label
  ctx.fillStyle = '#ffffff'; // white
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x + width / 2, y + height / 2);
}

function drawSwitch(ctx: CanvasRenderingContext2D, control: any) {
  const { x, y, name, active = false, width = 40, height = 20 } = control;
  
  // Draw switch track
  ctx.fillStyle = active ? '#059669' : '#4b5563'; // emerald-600 or gray-600
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = '#9ca3af'; // gray-400
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  
  // Draw switch handle
  const handlePos = active ? x + width - height : x;
  ctx.fillStyle = '#f3f4f6'; // gray-100
  ctx.fillRect(handlePos, y, height, height);
  
  // Draw label
  ctx.fillStyle = '#d1d5db'; // gray-300
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, x + width / 2, y + height + 15);
}

function drawDisplay(ctx: CanvasRenderingContext2D, control: any) {
  const { x, y, name, value = '', width = 150, height = 40 } = control;
  
  // Draw display background
  ctx.fillStyle = '#1f2937'; // gray-800
  ctx.fillRect(x, y, width, height);
  
  // Draw display border
  ctx.strokeStyle = '#6b7280'; // gray-500
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  
  // Draw display value
  ctx.fillStyle = '#34d399'; // emerald-400
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value.toString(), x + width / 2, y + height / 2);
  
  // Draw label
  ctx.fillStyle = '#d1d5db'; // gray-300
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, x + width / 2, y + height + 15);
}