import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Knob } from '../components/Knob';

describe('Knob Component', () => {
  it('should render with default props', () => {
    const { container } = render(<Knob value={0.5} />);
    
    expect(container.querySelector('div')).toBeInTheDocument();
    expect(container.querySelector('span')).toHaveTextContent('50');
  });

  it('should display correct percentage value', () => {
    const { container } = render(<Knob value={0.75} />);
    
    expect(container.querySelector('span')).toHaveTextContent('75');
  });

  it('should render with custom label', () => {
    const { getByText } = render(<Knob value={0.3} label="Cutoff" />);
    
    expect(getByText('Cutoff')).toBeInTheDocument();
  });

  it('should handle min/max values correctly', () => {
    const { container } = render(<Knob value={50} min={0} max={100} />);
    
    expect(container.querySelector('span')).toHaveTextContent('50');
  });

  it('should clamp values outside range', () => {
    const { container } = render(<Knob value={1.5} min={0} max={1} />);
    
    expect(container.querySelector('span')).toHaveTextContent('100');
  });

  it('should apply correct rotation based on value', () => {
    const { container } = render(<Knob value={0.5} />);
    
    const indicator = container.querySelector('[style*="rotate"]');
    expect(indicator).toBeInTheDocument();
  });
});