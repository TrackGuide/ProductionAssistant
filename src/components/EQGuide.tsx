import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from './Card';
import { EQ_INSTRUMENT_ADVICE } from '../constants/eqInstrumentAdvice';

// === Main Component ===
export const EQGuide: React.FC = () => {
  const [selectedInstrument, setSelectedInstrument] = useState('All');
  const [selectedZone, setSelectedZone] = useState('all');

  // --- General EQ Guidance for Default View ---
  const generalEQGuidance = [
    {
      frequencyRange: '20-60 Hz (Sub Bass)',
      action: 'High-pass filter',
      description: 'Remove subsonic rumble and unwanted low-end build-up. Most instruments don\'t need content below 40-60 Hz.',
      zoneId: 'sub'
    },
    {
      frequencyRange: '60-250 Hz (Bass)',
      action: 'Shape with care',
      description: 'Foundation of your mix. Boost for warmth and fullness, cut to reduce muddiness. Critical for kick drums and bass instruments.',
      zoneId: 'bass'
    },
    {
      frequencyRange: '250-500 Hz (Low Mids)',
      action: 'Often cut',
      description: 'Common problem area. Often causes "boxiness" or "muddiness." Light cuts here can clean up your mix significantly.',
      zoneId: 'low-mid'
    },
    {
      frequencyRange: '500 Hz-2 kHz (Mids)',
      action: 'Balance carefully',
      description: 'Core of most instruments. Cuts can make things sound distant, boosts bring instruments forward in the mix.',
      zoneId: 'mid'
    },
    {
      frequencyRange: '2-6 kHz (High Mids)',
      action: 'Clarity & presence',
      description: 'Critical for vocal clarity and instrument definition. Boost for presence, cut to reduce harshness.',
      zoneId: 'high-mid'
    },
    {
      frequencyRange: '6-12 kHz (Presence)',
      action: 'Add brightness',
      description: 'Adds clarity and attack to instruments. Boost for more "bite," cut to smooth harsh elements.',
      zoneId: 'presence'
    },
    {
      frequencyRange: '12 kHz+ (Air)',
      action: 'Gentle enhancement',
      description: 'Adds "air" and openness to your mix. Subtle high-shelf boosts can make mixes sound more polished.',
      zoneId: 'air'
    }
  ];

  // --- Filtering ---
  const showGeneralView = selectedInstrument === 'All' && selectedZone === 'all';
  
  // Filter by instrument and frequency zone for detailed view
  const filteredInstrumentAdvice = showGeneralView ? [] : EQ_INSTRUMENT_ADVICE.filter(advice => {
    const matchesInstrument = selectedInstrument === 'All' || advice.instrument === selectedInstrument;
    const matchesZone = selectedZone === 'all' || advice.frequencyRange.toLowerCase().includes(FREQUENCY_ZONES.find(z => z.id === selectedZone)?.label.split(' ')[0].toLowerCase() || '');
    return matchesInstrument && matchesZone;
  });

  // Filter general guidance by zone if needed
  const filteredGeneralGuidance = selectedZone === 'all' ? generalEQGuidance : generalEQGuidance.filter(guidance => guidance.zoneId === selectedZone);

  // --- Render ---
  return (
    <div className="max-w-6xl mx-auto w-full py-8 px-4 md:px-0">
      <div className="flex flex-wrap gap-6 mb-6 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-bold text-gray-400 mb-1">Instrument</label>
          <select
            value={selectedInstrument}
            onChange={e => setSelectedInstrument(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100"
          >
            <option disabled>Vocals</option>
            <option value="Vocals">Vocals (general)</option>
            <option value="Male vocals">Male vocals</option>
            <option value="Female vocals">Female vocals</option>
            <option disabled>Rhythm Section</option>
            <option value="Kick drum">Kick drum</option>
            <option value="Snare">Snare</option>
            <option value="Bass guitar">Bass guitar</option>
            <option value="808s">808s</option>
            <option value="Sub bass">Sub bass</option>
            <option value="Synth bass">Synth bass</option>
            <option value="Drums">Drums</option>
            <option disabled>Other Instruments</option>
            <option value="Guitar">Guitar</option>
            <option value="Acoustic guitar">Acoustic guitar</option>
            <option value="Piano">Piano</option>
            <option value="Cymbals">Cymbals</option>
            <option value="Hi-hats">Hi-hats</option>
            <option value="Horns">Horns</option>
            <option value="Strings">Strings</option>
            <option value="Room mics">Room mics</option>
            <option value="Violin">Violin</option>
            <option value="Cello">Cello</option>
            <option value="Tuba">Tuba</option>
            <option value="Saxophone">Saxophone</option>
            <option value="Trumpet">Trumpet</option>
            <option value="Brass">Brass</option>
            <option value="Woodwinds">Woodwinds</option>
            <option value="Flute">Flute</option>
            <option disabled>All/General</option>
            <option value="All">All Instruments</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-bold text-gray-400 mb-1">Frequency Range</label>
          <select
            value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100"
          >
            {FREQUENCY_ZONES.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Instrument-specific EQ advice cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {showGeneralView ? (
          // Show general EQ guidance for default view
          filteredGeneralGuidance.map((guidance, index) => {
            const frequencyZone = FREQUENCY_ZONES.find(zone => zone.id === guidance.zoneId);
            const zoneColor = frequencyZone?.color || 'bg-gray-600';
            
            return (
              <Card key={index} className="bg-gray-800/80 h-fit">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${zoneColor}`}></div>
                    <span className="text-sm font-bold text-white">{guidance.frequencyRange}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${guidance.action.toLowerCase().includes('boost') || guidance.action.toLowerCase().includes('enhance') ? 'bg-green-600 text-white' : guidance.action.toLowerCase().includes('cut') || guidance.action.toLowerCase().includes('filter') ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                      {guidance.action.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">General Guidance</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{guidance.description}</p>
                </div>
              </Card>
            );
          })
        ) : filteredInstrumentAdvice.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-gray-700/80 text-center py-16">
              <p className="text-gray-300 text-lg">No EQ advice matches your current filters.<br />Try another instrument or frequency zone.</p>
            </Card>
          </div>
        ) : (
          // Show detailed instrument-specific advice
          filteredInstrumentAdvice.map((advice, index) => {
            // Find the appropriate frequency zone color
            const frequencyZone = FREQUENCY_ZONES.find(zone => {
              if (zone.id === 'all') return false;
              const zoneKeyword = zone.label.split(' ')[0].toLowerCase();
              return advice.frequencyRange.toLowerCase().includes(zoneKeyword);
            });
            const zoneColor = frequencyZone?.color || 'bg-gray-600';
            
            return (
              <Card key={index} className="bg-gray-800/80 h-fit">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${zoneColor}`}></div>
                    <span className="text-sm font-bold text-white">{advice.frequencyRange}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${advice.action.toLowerCase().includes('boost') ? 'bg-green-600 text-white' : advice.action.toLowerCase().includes('cut') ? 'bg-red-600 text-white' : 'bg-yellow-600 text-black'}`}>
                      {advice.action.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">{advice.instrument}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{advice.description}</p>
                </div>
              </Card>
            );
          })
        )}
      </div>
      <div className="text-xs text-gray-500 mt-8 text-center px-2">
        Tip: These are general guidelines—trust your ears and reference pro mixes for your genre.
      </div>
      {/* Ear Trainer Quiz below the guide */}
      <FrequencyQuiz />
    </div>
  );
};

// === Ear Trainer (Frequency Quiz) ===
const frequencyData = [
  { frequency: 40, rangeName: "Deep Sub Bass", guidance: "Purely felt rumble. High-pass almost everything except sub-bass synths or specific kick drum tails.", reference: "The feeling in your chest from a movie theater explosion or a passing truck." },
  { frequency: 60, rangeName: "Sub Bass", guidance: "Feel the rumble. High-pass most instruments to remove mud, but boost for kick drum weight.", reference: "The deep, physical hum from a large refrigerator or a distant thunderstorm." },
  { frequency: 80, rangeName: "Low Bass", guidance: "Adds weight and body to basslines and kick drums. Can be muddy if overdone.", reference: "The 'boom' of a car stereo system." },
  { frequency: 100, rangeName: "Bass", guidance: "The core punch of the bass. Boost for warmth, but can quickly become boomy.", reference: "The fundamental 'thump' of a kick drum or the body of a bass guitar note." },
  { frequency: 200, rangeName: "Bass / Low Mid Crossover", guidance: "Fullness for guitars and snares, but also a source of mud. Cut to add clarity between kick and bass.", reference: "The 'thwack' of a snare drum's body." },
  { frequency: 250, rangeName: "Low Mids", guidance: "The 'mud' region. A common area to cut to clean up a mix and remove 'boxiness'.", reference: "The sound of speaking with cupped hands around your mouth." },
  { frequency: 350, rangeName: "Low Mids (Boxiness)", guidance: "Another primary 'boxy' or 'cardboard' sound area. Cutting here can open up the mix.", reference: "The hollow sound of a cheap acoustic guitar." },
  { frequency: 500, rangeName: "Mids", guidance: "Defines the core of many instruments. Be careful, as too much can sound 'honky' or nasal.", reference: "The fundamental tone of a landline telephone's dial tone." },
  { frequency: 750, rangeName: "Mids (Nasal)", guidance: "Can add body to bass guitars but often makes vocals and instruments sound nasal or 'honky'.", reference: "The sound quality of an old AM radio." },
  { frequency: 1000, rangeName: "Upper Mids", guidance: "Crucial for intelligibility and presence. This is where instruments cut through a mix.", reference: "The '2-pop' beep used in film/video leaders for audio sync." },
  { frequency: 2000, rangeName: "Presence", guidance: "Adds attack and definition. Boost for clarity on vocals, synths, and snare 'snap'.", reference: "The sharp attack of a drumstick hitting a snare drum or a guitar pick on a string." },
  { frequency: 3000, rangeName: "Upper Mids (Clarity/Harshness)", guidance: "Brings out vocals and instrument attack, but can quickly become piercing and fatiguing to the ear.", reference: "The sound of a baby crying or fingers on a chalkboard." },
  { frequency: 5000, rangeName: "Clarity / Sibilance", guidance: "Adds sparkle and clarity, but can also introduce harshness or vocal 's' sounds (sibilance).", reference: "The sound of sizzling bacon or the 's' and 't' consonants in speech." },
  { frequency: 7000, rangeName: "Sibilance", guidance: "Primary region for vocal 's' and 'sh' sounds. Use a de-esser here to tame harshness.", reference: "The sharp 'sss' sound in speech." },
  { frequency: 10000, rangeName: "Air / Brilliance", guidance: "Adds delicate 'air' and openness. A gentle high-shelf boost can make a mix sound polished.", reference: "The subtle shimmer of cymbals or the sound of 'crispness' in a recording." },
  { frequency: 12000, rangeName: "Air / Cymbals", guidance: "Adds sparkle and sheen, especially to cymbals and acoustic guitars. Can sound brittle if boosted too much.", reference: "The sizzle of hi-hats and crash cymbals." },
  { frequency: 15000, rangeName: "High Air", guidance: "Often beyond hearing for many adults. Adds a sense of space and ultra-high fidelity. Be very subtle.", reference: "The hiss from an old cassette tape or the sound of a CRT television being on." },
];

const QUIZ_LENGTH = 10;

type AudioRef = { context: AudioContext | null; oscillator: OscillatorNode | null; gain: GainNode | null; };
type Question = { correctAnswer: number; options: number[]; };
type Answer = { correctAnswer: number; userAnswer: number; isCorrect: boolean; };

const FrequencyQuiz: React.FC = () => {
  const [quizState, setQuizState] = useState<'idle' | 'in-progress' | 'finished'>('idle');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isQuestionAnswered, setIsQuestionAnswered] = useState(false);
  const [playingFrequency, setPlayingFrequency] = useState<number | null>(null);
  const audioRef = useRef<AudioRef>({ context: null, oscillator: null, gain: null });
  const timeoutRef = useRef<number | null>(null);

  const stopPlayback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (audioRef.current.oscillator && audioRef.current.gain && audioRef.current.context) {
      const now = audioRef.current.context.currentTime;
      audioRef.current.gain.gain.cancelScheduledValues(now);
      audioRef.current.gain.gain.setValueAtTime(audioRef.current.gain.gain.value, now);
      audioRef.current.gain.gain.linearRampToValueAtTime(0, now + 0.1);
      audioRef.current.oscillator.stop(now + 0.1);
      audioRef.current.oscillator = null;
      audioRef.current.gain = null;
      setPlayingFrequency(null);
    }
  }, []);

  const playTone = useCallback((frequency: number, duration?: number) => {
    if (audioRef.current.oscillator) {
      stopPlayback();
    }
    setTimeout(() => {
      const context = audioRef.current.context && audioRef.current.context.state !== 'closed'
        ? audioRef.current.context
        : new (window.AudioContext || (window as any).webkitAudioContext)();
      audioRef.current.context = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.05);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      audioRef.current.oscillator = oscillator;
      audioRef.current.gain = gain;
      setPlayingFrequency(frequency);
      if (duration) {
        timeoutRef.current = window.setTimeout(stopPlayback, duration * 1000);
      }
    }, 50);
  }, [stopPlayback]);

  const startQuiz = useCallback(() => {
    const allFrequencies = frequencyData.map(f => f.frequency);
    const shuffledFrequencies = [...allFrequencies].sort(() => 0.5 - Math.random());
    const newQuestions: Question[] = [];
    for (let i = 0; i < QUIZ_LENGTH; i++) {
      const correctFreq = shuffledFrequencies[i % shuffledFrequencies.length];
      const otherOptions = allFrequencies.filter(f => f !== correctFreq);
      const shuffledOthers = otherOptions.sort(() => 0.5 - Math.random());
      const finalOptions = [correctFreq, ...shuffledOthers.slice(0, 3)].sort(() => 0.5 - Math.random());
      newQuestions.push({ correctAnswer: correctFreq, options: finalOptions });
    }
    setQuestions(newQuestions);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setIsQuestionAnswered(false);
    setQuizState('in-progress');
    playTone(newQuestions[0].correctAnswer, 1.5);
  }, [playTone]);

  const handleAnswer = (selectedFreq: number) => {
    if (isQuestionAnswered) return;
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedFreq === currentQuestion.correctAnswer;
    setUserAnswers(prev => [...prev, {
      correctAnswer: currentQuestion.correctAnswer,
      userAnswer: selectedFreq,
      isCorrect: isCorrect,
    }]);
    setIsQuestionAnswered(true);
  };

  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setIsQuestionAnswered(false);
      playTone(questions[nextIndex].correctAnswer, 1.5);
    } else {
      setQuizState('finished');
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const lastAnswer = userAnswers[userAnswers.length - 1];

  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioRef.current.context && audioRef.current.context.state !== 'closed') {
        audioRef.current.context.close();
      }
    };
  }, [stopPlayback]);

  return (
    <div className="mt-16 max-w-2xl mx-auto bg-gray-900/80 rounded-lg p-6 border border-gray-700 shadow-lg">
      <h2 className="text-xl font-bold text-primary mb-2 text-center">🎧 Ear Trainer: Frequency Quiz</h2>
      <p className="text-gray-400 text-center mb-4">Test your ability to recognize key audio frequencies. Listen to the tone and select the correct frequency.</p>
      {quizState === 'idle' && (
        <div className="flex flex-col items-center gap-4">
          <button className="bg-primary text-white font-bold px-6 py-2 rounded hover:bg-primary/80" onClick={startQuiz}>Start Quiz</button>
        </div>
      )}
      {quizState === 'in-progress' && currentQuestion && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400">Question {currentQuestionIndex + 1} / {QUIZ_LENGTH}</span>
            <button className="text-primary underline" onClick={() => playTone(currentQuestion.correctAnswer, 1.5)}>Play Tone Again</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {currentQuestion.options.map(opt => (
              <button
                key={opt}
                className={`px-4 py-2 rounded font-bold border transition-colors duration-150 ${isQuestionAnswered && lastAnswer?.userAnswer === opt && !lastAnswer.isCorrect ? 'bg-red-700 text-white border-red-500' : 'bg-gray-800 text-primary border-gray-700 hover:bg-primary hover:text-black'}`}
                onClick={() => handleAnswer(opt)}
                disabled={isQuestionAnswered}
              >
                {opt} Hz
              </button>
            ))}
          </div>
          {isQuestionAnswered && (
            <div className={`text-center font-bold mb-2 ${lastAnswer.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {lastAnswer.isCorrect ? 'Correct!' : `Incorrect. The answer was ${lastAnswer.correctAnswer} Hz.`}
            </div>
          )}
          <div className="flex justify-center">
            {isQuestionAnswered && (
              <button className="bg-primary text-white font-bold px-6 py-2 rounded hover:bg-primary/80" onClick={handleNextQuestion}>
                {currentQuestionIndex === QUIZ_LENGTH - 1 ? 'Finish Quiz' : 'Next Question'}
              </button>
            )}
          </div>
        </div>
      )}
      {quizState === 'finished' && (
        <div className="text-center">
          <div className="text-lg font-bold text-primary mb-2">Quiz Complete!</div>
          <div className="mb-4 text-gray-300">Score: {userAnswers.filter(a => a.isCorrect).length} / {QUIZ_LENGTH}</div>
          <button className="bg-primary text-white font-bold px-6 py-2 rounded hover:bg-primary/80 mb-4" onClick={startQuiz}>Start New Quiz</button>
          {userAnswers.filter(a => !a.isCorrect).length > 0 && (
            <div className="mt-6 text-left">
              <div className="font-bold text-primary mb-2">Review Your Mistakes</div>
              {userAnswers.filter(a => !a.isCorrect).map((answer, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2 bg-gray-800 rounded p-2">
                  <span className="flex-1 text-gray-300">Correct: <b>{answer.correctAnswer} Hz</b>, You Guessed: <b>{answer.userAnswer} Hz</b></span>
                  <button className="bg-primary text-black px-3 py-1 rounded text-xs font-bold" onClick={() => playTone(answer.correctAnswer, 1.5)}>Play Correct</button>
                  <button className="bg-red-700 text-white px-3 py-1 rounded text-xs font-bold" onClick={() => playTone(answer.userAnswer, 1.5)}>Play Your Guess</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Add back FREQUENCY_ZONES with type
const FREQUENCY_ZONES: { id: string; label: string; color: string }[] = [
  { id: 'all', label: 'All Frequencies', color: 'bg-gray-600' },
  { id: 'sub', label: 'Sub Bass (20-60Hz)', color: 'bg-red-600' },
  { id: 'bass', label: 'Bass (60-250Hz)', color: 'bg-orange-600' },
  { id: 'low-mid', label: 'Low Mids (250-500Hz)', color: 'bg-yellow-600' },
  { id: 'mid', label: 'Mids (500-2kHz)', color: 'bg-green-600' },
  { id: 'high-mid', label: 'High Mids (2-6kHz)', color: 'bg-blue-600' },
  { id: 'presence', label: 'Presence (6-12kHz)', color: 'bg-indigo-600' },
  { id: 'air', label: 'Air (12kHz+)', color: 'bg-purple-600' },
];
