// EQ instrument-specific advice for use in EQGuide
// Source: user research and pro references

export interface EQInstrumentAdvice {
  instrument: string;
  frequencyRange: string;
  action: string;
  description: string;
  source?: string;
}

export const EQ_INSTRUMENT_ADVICE: EQInstrumentAdvice[] = [
  // Vocals (General)
  {
    instrument: 'Vocals',
    frequencyRange: '20–250 Hz (Bass/Body)',
    action: 'Boost slightly if needed',
    description: 'Adds weight and fullness to vocals. Careful not to over-boost, as excessive gain here causes muddiness; use a gentle boost or high-pass filter to tame subsonic rumble.',
    source: 'unison.audio'
  },
  {
    instrument: 'Vocals',
    frequencyRange: '300–500 Hz (Low-Mids)',
    action: 'Cut if boxy',
    description: 'Reduces “mud” or boxiness. A moderate cut around 300–500 Hz can clear up a congested vocal without thinning it excessively.',
    source: 'unison.audio'
  },
  {
    instrument: 'Vocals',
    frequencyRange: '2–4 kHz (Presence)',
    action: 'Boost (gentle)',
    description: 'Enhances vocal clarity and intelligibility, helping it cut through the mix. Boost in this range makes the vocal stand out, but use precision to avoid emphasizing sibilance.',
    source: 'unison.audio'
  },
  {
    instrument: 'Vocals',
    frequencyRange: '5–8 kHz (High Presence/Sibilance)',
    action: 'Cut (soft, if harsh)',
    description: 'Tames harsh “s” and “t” sounds and high-frequency hiss. A gentle dip here smooths the vocal tone and prevents shrillness.',
    source: 'izotope.com'
  },
  {
    instrument: 'Vocals',
    frequencyRange: '10 kHz and above (Air)',
    action: 'Boost (high-shelf)',
    description: 'Adds airiness and sparkle to the vocal. A subtle high-shelf boost in this range imparts a sense of openness and breathiness.',
    source: 'izotope.com'
  },
  // Male Vocals
  {
    instrument: 'Male vocals',
    frequencyRange: '100–200 Hz (Bass/Low)',
    action: 'Boost (~120 Hz)',
    description: 'Increases warmth and fullness of a male voice. A modest boost around 100–120 Hz adds body without causing boominess.',
    source: 'unison.audio'
  },
  {
    instrument: 'Male vocals',
    frequencyRange: '300–500 Hz (Low-Mids)',
    action: 'Cut if boxy',
    description: 'Clears up muddiness. Cutting a small band around 300–500 Hz can reduce a boxy or “muffled” tone.',
    source: 'unison.audio'
  },
  {
    instrument: 'Male vocals',
    frequencyRange: '3–5 kHz (Presence)',
    action: 'Boost gently',
    description: 'Brings the vocal forward in the mix. A slight boost in this region increases intelligibility, though watch for sibilance.',
    source: 'unison.audio'
  },
  // Female Vocals
  {
    instrument: 'Female vocals',
    frequencyRange: '200–400 Hz (Low-Mids)',
    action: 'Boost slightly',
    description: 'Adds warmth and richness. A gentle boost in the 200–400 Hz range gives a female vocal more body and fullness.',
    source: 'unison.audio'
  },
  {
    instrument: 'Female vocals',
    frequencyRange: '3–6 kHz (Presence/High-Mids)',
    action: 'Boost near 3 kHz; Cut 3–6 kHz if too bright',
    description: 'Enhances clarity and presence. Boosting around 3 kHz helps the voice cut through, while trimming 3–6 kHz can soften harshness if the vocal is too piercing.',
    source: 'unison.audio'
  },
  {
    instrument: 'Female vocals',
    frequencyRange: '10 kHz and above (Air)',
    action: 'Boost (high-shelf)',
    description: 'Adds sparkle and “air.” A shelf boost above 10 kHz introduces breathiness and openness to the vocal tone.',
    source: 'unison.audio'
  },
  // Kick Drum
  {
    instrument: 'Kick drum',
    frequencyRange: '60–80 Hz (Low-End/Sub-Bass)',
    action: 'Boost (gentle)',
    description: 'Emphasizes the kick’s fundamental thump. A moderate boost here adds punch and weight to the kick drum.',
    source: 'izotope.com'
  },
  {
    instrument: 'Kick drum',
    frequencyRange: '100–200 Hz (Bass/Body)',
    action: 'Boost (if needed)',
    description: 'Enhances warmth and fullness. Boosting this band adds weight, giving the kick a beefier sound.',
    source: 'izotope.com'
  },
  {
    instrument: 'Kick drum',
    frequencyRange: '200–500 Hz (Low-Mids/Boxiness)',
    action: 'Cut',
    description: 'Tightens the sound by reducing “boxy” resonance. A cut in this range cleans up muddiness, making the kick sound more defined.',
    source: 'izotope.com'
  },
  {
    instrument: 'Kick drum',
    frequencyRange: '1–5 kHz (Highs/Attack)',
    action: 'Boost',
    description: 'Brings out the beater click and attack. A boost here adds snap and presence to the kick’s transient.',
    source: 'izotope.com'
  },
  // Snare Drum
  {
    instrument: 'Snare',
    frequencyRange: '150–250 Hz (Body)',
    action: 'Boost',
    description: 'Increases the snare’s weight and fullness. A moderate boost around the fundamental adds thickness to the snare tone.',
    source: 'izotope.com'
  },
  {
    instrument: 'Snare',
    frequencyRange: '400–700 Hz (Midrange Ring)',
    action: 'Cut',
    description: 'Reduces hollow or ringing tones. Attenuating a narrow band in this range helps remove an undesirable “ring” and makes the snare sound tighter.',
    source: 'izotope.com'
  },
  {
    instrument: 'Snare',
    frequencyRange: '2–3.5 kHz (Attack)',
    action: 'Boost',
    description: 'Enhances snap and attack. Boosting here makes the snare crisp and cutting, emphasizing the stick hit.',
    source: 'izotope.com'
  },
  {
    instrument: 'Snare',
    frequencyRange: '900 Hz–1.5 kHz (Papery Tone)',
    action: 'Cut (if present)',
    description: 'Removes thin, paper-like snare sounds. Cutting around this range eliminates unwanted high-mid resonance (like a box hit).',
    source: 'izotope.com'
  },
  // Bass Guitar
  {
    instrument: 'Bass guitar',
    frequencyRange: '40–120 Hz (Sub/Lows)',
    action: 'Usually leave or slight boost if needed',
    description: 'Adds weight and rumble. Most bass tracks already have strong low end; use a gentle boost for extra punch or a high-pass filter to clean up unnecessary subsonics.',
    source: 'izotope.com'
  },
  {
    instrument: 'Bass guitar',
    frequencyRange: '200–400 Hz (Low-Mids/Mud)',
    action: 'Cut',
    description: 'Cleans up muddiness. A trim in this band clarifies the bass\'s tone, preventing it from sounding boomy or cluttered.',
    source: 'izotope.com'
  },
  {
    instrument: 'Bass guitar',
    frequencyRange: '800–1000 Hz (High-Mids/Definition)',
    action: 'Boost',
    description: 'Enhances note articulation. A slight boost around 800 Hz–1 kHz brings out string attack and clarity, helping the bass cut through.',
    source: 'izotope.com'
  },
  // Guitar (Electric)
  {
    instrument: 'Guitar',
    frequencyRange: '150–300 Hz (Body)',
    action: 'Boost',
    description: 'Adds thickness and fullness. Boosting this range gives the guitar a beefy, warm tone.',
    source: 'izotope.com'
  },
  {
    instrument: 'Guitar',
    frequencyRange: '200–300 Hz (Tubbiness)',
    action: 'Cut (narrow)',
    description: 'Reduces muddiness or "boxiness." A targeted cut here tightens the guitar sound without losing body.',
    source: 'izotope.com'
  },
  {
    instrument: 'Guitar',
    frequencyRange: '3–6 kHz (Presence/Harshness)',
    action: 'Cut if harsh; boost around 3 kHz if more attack is needed',
    description: 'Shapes brightness and attack. Lower mids (3–6 kHz) often contain harsh overtones; cutting them smooths the tone, whereas a smaller boost near 3 kHz can make solos pop.',
    source: 'izotope.com'
  },
  {
    instrument: 'Guitar',
    frequencyRange: '300–1500 Hz (Midrange "Meat")',
    action: 'Usually leave or adjust gently',
    description: 'Controls the core tone. This broad range contains much of the guitar\'s character; use broad Q adjustments rather than sharp boosts to shape it subtly.',
    source: 'izotope.com'
  },
  // Acoustic Guitar
  {
    instrument: 'Acoustic guitar',
    frequencyRange: 'Below 70–100 Hz',
    action: 'High-pass filter',
    description: 'Removes unnecessary rumble. Cutting subsonic and very low frequencies prevents boominess and leaves headroom in the mix.',
    source: 'izotope.com'
  },
  {
    instrument: 'Acoustic guitar',
    frequencyRange: '200–400 Hz (Body/Wood)',
    action: 'Boost or Cut as needed',
    description: 'Controls warmth and fullness. Boosting in this range can fatten up the guitar\'s body, while cutting (around 200–300 Hz) can remove boxiness if the tone is too muddy.',
    source: 'izotope.com'
  },
  {
    instrument: 'Acoustic guitar',
    frequencyRange: '1.5–2.5 kHz (Presence)',
    action: 'Boost',
    description: 'Enhances clarity. A boost here helps the acoustic guitar cut through by adding definition to string attack.',
    source: 'izotope.com'
  },
  {
    instrument: 'Acoustic guitar',
    frequencyRange: '8–12 kHz (Air)',
    action: 'Boost',
    description: 'Adds sparkle and brightness. A gentle shelf boost in the high end brings out string detail and "shine" in the acoustic sound.',
    source: 'izotope.com'
  },
  // Piano
  {
    instrument: 'Piano',
    frequencyRange: '20–60 Hz (Sub)',
    action: 'High-pass filter',
    description: 'Removes inaudible rumble. Cutting below ~40–50 Hz prevents unnecessary sub content from muddying the mix.',
    source: 'izotope.com'
  },
  {
    instrument: 'Piano',
    frequencyRange: '60–200 Hz (Low-End Body)',
    action: 'Boost (moderately)',
    description: 'Adds warmth and fullness. A slight boost around 80–150 Hz can make the piano sound fuller and more present.',
    source: 'izotope.com'
  },
  {
    instrument: 'Piano',
    frequencyRange: '200–500 Hz (Low-Mids/Mud)',
    action: 'Cut',
    description: 'Cleans up muddiness. Trimming this range (e.g. 200–300 Hz) reduces boxiness and frees space for other instruments.',
    source: 'izotope.com'
  },
  {
    instrument: 'Piano',
    frequencyRange: '2–4 kHz (High-Mids/Harshness)',
    action: 'Cut (if harsh)',
    description: 'Softens attack. A small cut in 2–4 kHz removes harshness from hard piano tones, yielding a smoother timbre.',
    source: 'izotope.com'
  },
  // Cymbals
  {
    instrument: 'Cymbals',
    frequencyRange: '0–200 Hz',
    action: 'Cut (high-pass)',
    description: 'Removes sub-bass rumble. Cymbals typically lack useful energy below ~200 Hz, so filtering here cleans mud without affecting cymbal tone.',
    source: 'abletunes.com'
  },
  {
    instrument: 'Cymbals',
    frequencyRange: '200–400 Hz',
    action: 'Cut or sweep',
    description: 'Reduces "gong" or boxiness. Attenuating this range prevents low-mid clank that can make cymbals sound muddy.',
    source: 'abletunes.com'
  },
  {
    instrument: 'Cymbals',
    frequencyRange: '6–15 kHz (Air/Brightness)',
    action: 'Boost',
    description: 'Increases brilliance. A boost in the high end (especially 8–12 kHz) adds shimmer and definition to cymbals; cutting above ~12 kHz can also tame excessive shrillness.',
    source: 'abletunes.com'
  },
  // Hi-Hats
  {
    instrument: 'Hi-hats',
    frequencyRange: '3–7 kHz',
    action: 'Cut (gentle)',
    description: 'Reduces piercing high-frequency content. A minor dip here can soften the sharp "tsss" sound of hats if they become harsh.',
    source: 'izotope.com'
  },
  {
    instrument: 'Hi-hats',
    frequencyRange: 'Low end',
    action: 'High-pass filter',
    description: 'Remove anything below ~200–300 Hz to eliminate bleed from other drums, since hats have little useful low-frequency content.',
    source: 'izotope.com'
  },
  // Sub Bass
  {
    instrument: 'Sub bass',
    frequencyRange: '20–60 Hz (Sub-Bass)',
    action: 'Boost (if the mix allows)',
    description: 'Adds deep, chest-rattling weight. Emphasizing this range gives "feel" to 808s and sub-bass instruments, but use sparingly to avoid overwhelming the mix.',
    source: 'unison.audio'
  },
  {
    instrument: 'Sub bass',
    frequencyRange: '60–120 Hz',
    action: 'Maintain or boost gently',
    description: 'Covers the bass fundamental and body. If additional warmth is needed, slight boosts near 60–80 Hz can reinforce the sub\'s punch.',
    source: 'unison.audio'
  },
  // 808s
  {
    instrument: '808s',
    frequencyRange: '30–60 Hz',
    action: 'Boost',
    description: 'Accentuates the very low "thump." Boosting in this sub range gives the 808 its characteristic weight and power that you feel as well as hear.',
    source: 'unison.audio'
  },
  {
    instrument: '808s',
    frequencyRange: '80–200 Hz',
    action: 'Occasional boost',
    description: 'Adds mid-punch. Some 808 samples have harmonics or fundamentals in the ~100–200 Hz area; a small boost here can bring out a richer tone. However, be cautious of clashing with the kick.',
    source: 'unison.audio'
  },
  // Synth Bass
  {
    instrument: 'Synth bass',
    frequencyRange: '40–120 Hz (Low-End)',
    action: 'Boost (if needed)',
    description: 'Reinforces subby depth. Giving some emphasis here adds fullness to synth bass lines.',
    source: 'izotope.com'
  },
  {
    instrument: 'Synth bass',
    frequencyRange: '200–500 Hz (Low-Mids/Mud)',
    action: 'Cut',
    description: 'Cleans up muddiness. Trimming a band around 300–400 Hz prevents synth bass from sounding too boxy or cluttered.',
    source: 'izotope.com'
  },
  {
    instrument: 'Synth bass',
    frequencyRange: '800–1000 Hz',
    action: 'Boost',
    description: 'Enhances articulation. Boosting around 800 Hz–1 kHz brings out the character and punch of synth bass, aiding definition.',
    source: 'izotope.com'
  },
  // Violin
  {
    instrument: 'Violin',
    frequencyRange: 'Below ~100 Hz',
    action: 'High-pass filter',
    description: 'Removes rumble. Cutting out subsonic frequencies cleans up unnecessary low end.',
    source: 'abletunes.com'
  },
  {
    instrument: 'Violin',
    frequencyRange: '100–250 Hz (Mud/Fundamentals)',
    action: 'Cut/Boost carefully',
    description: 'Balances fullness. A gentle boost around 200–350 Hz can add warmth, while cutting 150–250 Hz removes muddiness.',
    source: 'abletunes.com'
  },
  {
    instrument: 'Violin',
    frequencyRange: '2–10 kHz (Body/String Noise)',
    action: 'Boost (small peaks)',
    description: 'Enhances presence. Boosting around 2–4 kHz brings out string articulation, and a wider lift into 7–10 kHz adds bite; use moderate Q to avoid harshness.',
    source: 'abletunes.com'
  },
  // Flute
  {
    instrument: 'Flute',
    frequencyRange: '0–250 Hz',
    action: 'High-pass filter (up to ~200–250 Hz)',
    description: 'Removes rumble and wind noise. Cutting below ~200 Hz prevents unwanted low-frequency noise.',
    source: 'abletunes.com'
  },
  {
    instrument: 'Flute',
    frequencyRange: '250–400 Hz (Body/Mud)',
    action: 'Cut',
    description: 'Reduces "muddiness." A slight cut in this range cleans up any boxy tone in the flute.',
    source: 'abletunes.com'
  },
  {
    instrument: 'Flute',
    frequencyRange: '2–4 kHz',
    action: 'Cut for softness',
    description: 'Controls honkiness. Attenuating 2–4 kHz softens an overly bright or piercing flute tone.',
    source: 'abletunes.com'
  },
  {
    instrument: 'Flute',
    frequencyRange: '10–12 kHz (Air/Brightness)',
    action: 'Boost',
    description: 'Adds sparkle. A shelf boost in the 10–12 kHz range brings out the airy, delicate overtones of the flute.',
    source: 'abletunes.com'
  },
  // Cello
  {
    instrument: 'Cello',
    frequencyRange: '65–260 Hz (Fundamental)',
    action: 'Boost carefully',
    description: 'Enhances warmth and richness. The cello\'s fundamental frequencies provide its characteristic woody tone.',
    source: 'iZotope'
  },
  {
    instrument: 'Cello',
    frequencyRange: '250–500 Hz (Body)',
    action: 'Cut if muddy',
    description: 'Controls boxiness. A gentle cut here can clean up muddy or congested cello recordings.',
    source: 'iZotope'
  },
  {
    instrument: 'Cello',
    frequencyRange: '1–3 kHz (Presence)',
    action: 'Boost for clarity',
    description: 'Brings out bow articulation and string texture. Gentle boost helps cello cut through the mix.',
    source: 'iZotope'
  },
  {
    instrument: 'Cello',
    frequencyRange: '5–8 kHz (Brightness)',
    action: 'Boost for air',
    description: 'Adds sparkle and detail to string harmonics. Use sparingly to avoid harshness.',
    source: 'iZotope'
  },
  // Tuba
  {
    instrument: 'Tuba',
    frequencyRange: '29–87 Hz (Fundamental)',
    action: 'Boost for power',
    description: 'Enhances the foundation. The tuba\'s fundamental range provides its powerful low-end presence.',
    source: 'Brass techniques'
  },
  {
    instrument: 'Tuba',
    frequencyRange: '100–200 Hz (Warmth)',
    action: 'Boost for fullness',
    description: 'Adds body and warmth. Gentle boost here fills out the tuba\'s rich harmonic content.',
    source: 'Brass techniques'
  },
  {
    instrument: 'Tuba',
    frequencyRange: '300–500 Hz',
    action: 'Cut if muddy',
    description: 'Prevents muddiness. Cut here if the tuba sounds unclear or interferes with other instruments.',
    source: 'Brass techniques'
  },
  {
    instrument: 'Tuba',
    frequencyRange: '2–4 kHz (Attack)',
    action: 'Boost for definition',
    description: 'Enhances note attack and articulation. Helps the tuba cut through dense arrangements.',
    source: 'Brass techniques'
  },
  // Saxophone
  {
    instrument: 'Saxophone',
    frequencyRange: '100–300 Hz (Body)',
    action: 'Boost for warmth',
    description: 'Adds fullness and body. This range contains the saxophone\'s fundamental warmth.',
    source: 'Woodwind recording'
  },
  {
    instrument: 'Saxophone',
    frequencyRange: '300–800 Hz',
    action: 'Cut if honky',
    description: 'Reduces nasal honking. Cut here if the saxophone sounds too aggressive or nasal.',
    source: 'Woodwind recording'
  },
  {
    instrument: 'Saxophone',
    frequencyRange: '1–3 kHz (Presence)',
    action: 'Boost for clarity',
    description: 'Brings out reed articulation and breath sounds. Essential for saxophone presence in the mix.',
    source: 'Woodwind recording'
  },
  {
    instrument: 'Saxophone',
    frequencyRange: '8–12 kHz (Brightness)',
    action: 'Boost for air',
    description: 'Adds sparkle and harmonic content. Gentle boost brings out the saxophone\'s natural brightness.',
    source: 'Woodwind recording'
  },
  // Trumpet
  {
    instrument: 'Trumpet',
    frequencyRange: '100–250 Hz (Body)',
    action: 'Boost for fullness',
    description: 'Adds warmth and body. The trumpet\'s lower harmonics provide fullness without muddiness.',
    source: 'Brass recording'
  },
  {
    instrument: 'Trumpet',
    frequencyRange: '1–3 kHz (Core)',
    action: 'Boost for presence',
    description: 'Enhances the trumpet\'s characteristic brightness and cut. This is where the trumpet lives in the mix.',
    source: 'Brass recording'
  },
  {
    instrument: 'Trumpet',
    frequencyRange: '3–6 kHz (Attack)',
    action: 'Boost for bite',
    description: 'Brings out valve attacks and articulation. Helps trumpet punch through the mix.',
    source: 'Brass recording'
  },
  {
    instrument: 'Trumpet',
    frequencyRange: '8–12 kHz (Harmonics)',
    action: 'Boost for brilliance',
    description: 'Adds harmonic sparkle and air. Use carefully to avoid harshness, especially with muted trumpets.',
    source: 'Brass recording'
  },
  // Brass (General)
  {
    instrument: 'Brass',
    frequencyRange: '80–200 Hz (Foundation)',
    action: 'Boost for power',
    description: 'Provides the brass section\'s foundational weight and impact. Essential for full brass sound.',
    source: 'Orchestral recording'
  },
  {
    instrument: 'Brass',
    frequencyRange: '200–500 Hz',
    action: 'Cut if muddy',
    description: 'Prevents section muddiness. Cut here when brass sounds unclear or conflicts with other instruments.',
    source: 'Orchestral recording'
  },
  {
    instrument: 'Brass',
    frequencyRange: '1–4 kHz (Presence)',
    action: 'Boost for clarity',
    description: 'Brings out brass articulation and bite. This range is crucial for brass section definition.',
    source: 'Orchestral recording'
  },
  {
    instrument: 'Brass',
    frequencyRange: '6–10 kHz (Brilliance)',
    action: 'Boost for sparkle',
    description: 'Adds harmonic content and air. Gentle boost brings out the natural brass shimmer.',
    source: 'Orchestral recording'
  },
  // Woodwinds (General)
  {
    instrument: 'Woodwinds',
    frequencyRange: 'Below 100 Hz',
    action: 'High-pass filter',
    description: 'Removes rumble and breath noise. Clean up unnecessary low-frequency content.',
    source: 'Woodwind recording'
  },
  {
    instrument: 'Woodwinds',
    frequencyRange: '200–500 Hz (Body)',
    action: 'Boost for warmth',
    description: 'Enhances the woody, reedy character. This range provides the natural woodwind timbre.',
    source: 'Woodwind recording'
  },
  {
    instrument: 'Woodwinds',
    frequencyRange: '2–6 kHz (Articulation)',
    action: 'Boost for clarity',
    description: 'Brings out reed/embouchure attacks and finger noise. Essential for woodwind definition.',
    source: 'Woodwind recording'
  },
  {
    instrument: 'Woodwinds',
    frequencyRange: '8–15 kHz (Air)',
    action: 'Boost for breath',
    description: 'Adds natural breath sounds and harmonic content. Creates realistic woodwind presence.',
    source: 'Woodwind recording'
  },
  // Horns (French Horn)
  {
    instrument: 'Horns',
    frequencyRange: '80–200 Hz (Foundation)',
    action: 'Boost for fullness',
    description: 'Provides the horn\'s characteristic warm, round tone. Essential for proper horn weight.',
    source: 'Orchestral recording'
  },
  {
    instrument: 'Horns',
    frequencyRange: '300–600 Hz',
    action: 'Cut if muddy',
    description: 'Prevents honkiness and muddiness. Cut here if horns sound unclear or too nasal.',
    source: 'Orchestral recording'
  },
  {
    instrument: 'Horns',
    frequencyRange: '1–3 kHz (Core)',
    action: 'Boost for presence',
    description: 'Brings out the horn\'s natural brightness and projection. Key range for horn clarity.',
    source: 'Orchestral recording'
  },
  {
    instrument: 'Horns',
    frequencyRange: '6–10 kHz (Harmonics)',
    action: 'Boost gently for air',
    description: 'Adds harmonic content and natural horn sparkle. Use subtly to maintain warmth.',
    source: 'Orchestral recording'
  },
  // Strings (General/Section)
  {
    instrument: 'Strings',
    frequencyRange: '80–250 Hz (Body)',
    action: 'Boost for richness',
    description: 'Enhances the string section\'s foundational warmth and body. Essential for full orchestral sound.',
    source: 'Orchestral recording'
  },
  {
    instrument: 'Strings',
    frequencyRange: '250–500 Hz',
    action: 'Cut if muddy',
    description: 'Cleans up section muddiness. Cut here when strings sound unclear or congested.',
    source: 'Orchestral recording'
  },
  {
    instrument: 'Strings',
    frequencyRange: '2–6 kHz (Bow noise)',
    action: 'Boost for detail',
    description: 'Brings out bow articulation and string texture. Adds realism and presence to string sections.',
    source: 'Orchestral recording'
  },
  {
    instrument: 'Strings',
    frequencyRange: '8–15 kHz (Air)',
    action: 'Boost for sparkle',
    description: 'Adds harmonic content and natural string shimmer. Creates open, airy string sound.',
    source: 'Orchestral recording'
  },
  // Room mics
  {
    instrument: 'Room mics',
    frequencyRange: 'Below 80 Hz',
    action: 'High-pass filter',
    description: 'Removes rumble and HVAC noise. Clean up unnecessary subsonic content from room ambience.',
    source: 'Recording techniques'
  },
  {
    instrument: 'Room mics',
    frequencyRange: '200–500 Hz',
    action: 'Cut for clarity',
    description: 'Reduces room muddiness. Cut here to prevent the room from making the mix unclear.',
    source: 'Recording techniques'
  },
  {
    instrument: 'Room mics',
    frequencyRange: '2–8 kHz (Ambience)',
    action: 'Boost for liveliness',
    description: 'Enhances room character and spatial information. This range contains the room\'s acoustic signature.',
    source: 'Recording techniques'
  },
  {
    instrument: 'Room mics',
    frequencyRange: '10–15 kHz (Air)',
    action: 'Boost for space',
    description: 'Adds natural room reverb and spatial depth. Creates sense of space and ambience.',
    source: 'Recording techniques'
  },
  // Drums (General kit)
  {
    instrument: 'Drums',
    frequencyRange: '50–100 Hz (Kick fundamentals)',
    action: 'Boost for punch',
    description: 'Enhances kick drum impact and low-end power. Essential for drum kit foundation.',
    source: 'Drum recording'
  },
  {
    instrument: 'Drums',
    frequencyRange: '200–400 Hz',
    action: 'Cut if muddy',
    description: 'Cleans up kit muddiness. Cut here when drums sound unclear or too boomy.',
    source: 'Drum recording'
  },
  {
    instrument: 'Drums',
    frequencyRange: '2–6 kHz (Attack)',
    action: 'Boost for punch',
    description: 'Brings out stick attacks and drum transients. Essential for drum clarity and definition.',
    source: 'Drum recording'
  },
  {
    instrument: 'Drums',
    frequencyRange: '8–15 kHz (Cymbals/Air)',
    action: 'Boost for sparkle',
    description: 'Enhances cymbal shimmer and kit brightness. Adds natural drum room sound.',
    source: 'Drum recording'
  }
];
