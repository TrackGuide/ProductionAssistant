import React, { useState } from 'react';
import { getDawMetadata } from '../constants/dawMetadata';
import { Card } from './Card';
import { Button } from './Button';

interface SignalChainBuilderProps {
  selectedDaw: string;
  instrumentType: 'Vocal' | 'DrumBus' | 'Synth' | 'Guitar';
  onChange?: (chain: string[]) => void;
}

const SignalChainBuilder: React.FC<SignalChainBuilderProps> = ({ 
  selectedDaw, 
  instrumentType,
  onChange
}) => {
  const dawData = getDawMetadata(selectedDaw);
  const initialChain = dawData?.suggestedSignalChains[instrumentType] || [];

  const [signalChain, setSignalChain] = useState<string[]>(initialChain);
  const [showPluginSelector, setShowPluginSelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const movePluginUp = (index: number) => {
    if (index === 0) return;
    const newChain = [...signalChain];
    const temp = newChain[index];
    newChain[index] = newChain[index - 1];
    newChain[index - 1] = temp;
    setSignalChain(newChain);
    onChange?.(newChain);
  };

  const movePluginDown = (index: number) => {
    if (index === signalChain.length - 1) return;
    const newChain = [...signalChain];
    const temp = newChain[index];
    newChain[index] = newChain[index + 1];
    newChain[index + 1] = temp;
    setSignalChain(newChain);
    onChange?.(newChain);
  };

  const removePlugin = (index: number) => {
    const newChain = [...signalChain];
    newChain.splice(index, 1);
    setSignalChain(newChain);
    onChange?.(newChain);
  };

  const addPlugin = (plugin: string) => {
    const newChain = [...signalChain, plugin];
    setSignalChain(newChain);
    setShowPluginSelector(false);
    onChange?.(newChain);
  };

  const categories = dawData ? Object.keys(dawData.stockPlugins) : [];
  
  return (
    <div>
      <h3>Signal Chain for {instrumentType}</h3>
      
      <div style={{ marginBottom: '20px' }}>
        {signalChain.map((plugin, index) => (
          <Card key={`${plugin}-${index}`} style={{ padding: '10px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>{plugin}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => movePluginUp(index)}
                  disabled={index === 0}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                    opacity: index === 0 ? 0.5 : 1
                  }}
                >
                  ↑
                </button>
                <button 
                  onClick={() => movePluginDown(index)}
                  disabled={index === signalChain.length - 1}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: index === signalChain.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: index === signalChain.length - 1 ? 0.5 : 1
                  }}
                >
                  ↓
                </button>
                <button 
                  onClick={() => removePlugin(index)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    color: 'red'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {!showPluginSelector ? (
        <Button onClick={() => setShowPluginSelector(true)}>
          Add Plugin
        </Button>
      ) : (
        <Card style={{ padding: '15px' }}>
          <div>
            <h4>Select Plugin Category</h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
              {categories.map(category => (
                <Button 
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  variant={selectedCategory === category ? 'primary' : 'secondary'}
                >
                  {category}
                </Button>
              ))}
            </div>
            
            {selectedCategory && dawData?.stockPlugins[selectedCategory as keyof typeof dawData.stockPlugins] && (
              <div>
                <h4>Select Plugin</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {dawData.stockPlugins[selectedCategory as keyof typeof dawData.stockPlugins].map((plugin: string) => (
                    <Button 
                      key={plugin}
                      onClick={() => addPlugin(plugin)}
                      variant="outline"
                    >
                      {plugin}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '15px', textAlign: 'right' }}>
              <Button 
                onClick={() => setShowPluginSelector(false)} 
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SignalChainBuilder;
