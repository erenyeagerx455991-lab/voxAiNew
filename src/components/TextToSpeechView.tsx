import { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Square, Volume2, ChevronDown, Settings, Search, Filter, MoreVertical, Pause } from 'lucide-react';

interface VoiceCharacter {
  id: string;
  name: string;
  lang: string;
  description: string;
  avatar: string;
  category: string;
  gender: string;
  accent: string;
  age: string;
}

const browserVoices: VoiceCharacter[] = [
  { id: 'en-us-1', name: 'Google US English 1', lang: 'en-US', description: 'Clear male voice, natural', avatar: 'bg-gradient-to-br from-slate-700 to-slate-900', category: 'Narration', gender: 'Male', accent: 'American', age: 'Young' },
  { id: 'en-us-2', name: 'Google US English 2', lang: 'en-US', description: 'Warm female voice, friendly', avatar: 'bg-gradient-to-br from-purple-400 to-purple-600', category: 'Conversation', gender: 'Female', accent: 'American', age: 'Young' },
  { id: 'en-gb-1', name: 'Google UK English 1', lang: 'en-GB', description: 'Clear male voice, British', avatar: 'bg-gradient-to-br from-blue-500 to-blue-700', category: 'Business', gender: 'Male', accent: 'British', age: 'Mature' },
  { id: 'en-gb-2', name: 'Google UK English 2', lang: 'en-GB', description: 'Soft female voice, British', avatar: 'bg-gradient-to-br from-rose-300 to-rose-500', category: 'Storytelling', gender: 'Female', accent: 'British', age: 'Young' },
  { id: 'en-au', name: 'Google Australian', lang: 'en-AU', description: 'Friendly male voice', avatar: 'bg-gradient-to-br from-amber-600 to-amber-800', category: 'Conversation', gender: 'Male', accent: 'Australian', age: 'Young' },
  { id: 'es-es', name: 'Google Spanish', lang: 'es-ES', description: 'Clear Spanish voice', avatar: 'bg-gradient-to-br from-teal-400 to-teal-600', category: 'Business', gender: 'Female', accent: 'Spanish', age: 'Mature' },
  { id: 'fr-fr', name: 'Google French', lang: 'fr-FR', description: 'Smooth French voice', avatar: 'bg-gradient-to-br from-gray-600 to-gray-800', category: 'Narration', gender: 'Male', accent: 'French', age: 'Mature' },
  { id: 'de-de', name: 'Google German', lang: 'de-DE', description: 'Clear German voice', avatar: 'bg-gradient-to-br from-pink-300 to-pink-500', category: 'Business', gender: 'Female', accent: 'German', age: 'Young' },
  { id: 'it-it', name: 'Google Italian', lang: 'it-IT', description: 'Warm Italian voice', avatar: 'bg-gradient-to-br from-indigo-700 to-indigo-900', category: 'Conversation', gender: 'Male', accent: 'Italian', age: 'Mature' },
  { id: 'ja-jp', name: 'Google Japanese', lang: 'ja-JP', description: 'Clear Japanese voice', avatar: 'bg-gradient-to-br from-violet-400 to-violet-600', category: 'Narration', gender: 'Female', accent: 'Japanese', age: 'Young' },
  { id: 'zh-cn', name: 'Google Mandarin', lang: 'zh-CN', description: 'Clear Mandarin voice', avatar: 'bg-gradient-to-br from-cyan-500 to-cyan-700', category: 'Business', gender: 'Female', accent: 'Mandarin', age: 'Young' },
  { id: 'ko-kr', name: 'Google Korean', lang: 'ko-KR', description: 'Natural Korean voice', avatar: 'bg-gradient-to-br from-orange-300 to-orange-500', category: 'Conversation', gender: 'Male', accent: 'Korean', age: 'Young' },
];

const MAX_CHARS = 5000;

interface TextToSpeechViewProps {
  onCreditsChange?: () => void;
}

export default function TextToSpeechView({ onCreditsChange: _onCreditsChange }: TextToSpeechViewProps) {
  const [text, setText] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('en-us-1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const [voiceBrowserOpen, setVoiceBrowserOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'explore' | 'my-voices'>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const voiceBrowserRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const selectedVoice = browserVoices.find((v) => v.id === selectedVoiceId) ?? browserVoices[0];

  const filteredVoices = useMemo(() => {
    if (!searchQuery.trim()) return browserVoices;
    const query = searchQuery.toLowerCase();
    return browserVoices.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.lang.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query) ||
        v.category.toLowerCase().includes(query) ||
        v.gender.toLowerCase().includes(query) ||
        v.accent.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (voiceBrowserRef.current && !voiceBrowserRef.current.contains(e.target as Node)) {
        setVoiceBrowserOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerate = () => {
    if (!text.trim()) return;
    setError('');

    if (!('speechSynthesis' in window)) {
      setError('Browser TTS not supported in your browser');
      return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.lang = selectedVoice.lang;

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = (e) => {
      setError(`Speech error: ${e.error}`);
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const handlePreview = (voiceId: string) => {
    if (previewingId === voiceId) {
      speechSynthesis.cancel();
      setPreviewingId(null);
      return;
    }

    speechSynthesis.cancel();
    const voice = browserVoices.find((v) => v.id === voiceId);
    if (!voice) return;

    const utterance = new SpeechSynthesisUtterance(`This is ${voice.name}`);
    utterance.lang = voice.lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onend = () => {
      setPreviewingId(null);
    };

    setPreviewingId(voiceId);
    speechSynthesis.speak(utterance);
  };

  const handleSelectVoice = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    setVoiceBrowserOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Header section */}
        <div className="px-4 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="max-w-2xl mx-auto">
            <div>
              <h2 className="text-xl font-semibold text-black mb-1">Text to Speech</h2>
              <p className="text-sm text-gray-400">Convert your text into natural-sounding AI speech.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Main content */}
        <div className="px-4 py-6 pb-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Text Input */}
            <div>
              <textarea
                value={text}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) setText(e.target.value);
                }}
                placeholder="Type or paste your text here..."
                rows={6}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-[15px] text-black placeholder:text-gray-400 outline-none resize-none focus:border-gray-400 transition-colors leading-relaxed"
              />
            </div>

            {/* Audio Player */}
            {isPlaying && (
              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                    <Volume2 size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black">{selectedVoice.name}</p>
                    <p className="text-xs text-gray-400">Playing audio...</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-black rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 24 + 8}px`,
                          animationDelay: `${i * 50}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Panel */}
            {settingsOpen && (
              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-black mb-3">Voice Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Speech Rate</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={rate}
                      onChange={(e) => setRate(parseFloat(e.target.value))}
                      className="w-full accent-black"
                    />
                    <span className="text-xs text-gray-400">{rate.toFixed(1)}x</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Pitch</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={pitch}
                      onChange={(e) => setPitch(parseFloat(e.target.value))}
                      className="w-full accent-black"
                    />
                    <span className="text-xs text-gray-400">{pitch.toFixed(1)}x</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom-anchored control panel */}
      <div className="border-t border-gray-100 bg-white flex-shrink-0" ref={voiceBrowserRef}>
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-4">
          {/* Voice Selector Row */}
          <div className="flex items-center gap-2 mb-3">
            {/* Voice Selector Pill — toggles the voice browser */}
            <button
              onClick={() => {
                setVoiceBrowserOpen(!voiceBrowserOpen);
                setSettingsOpen(false);
              }}
              className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left"
            >
              <div className={`w-7 h-7 rounded-full ${selectedVoice.avatar} flex items-center justify-center flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-black truncate block">
                  {selectedVoice.name}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${voiceBrowserOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Settings Button */}
            <button
              onClick={() => {
                setSettingsOpen(!settingsOpen);
                setVoiceBrowserOpen(false);
              }}
              className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-colors flex-shrink-0 ${
                settingsOpen
                  ? 'bg-black border-black text-white'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
              aria-label="Settings"
            >
              <Settings size={17} strokeWidth={1.5} />
            </button>
          </div>

          {/* Expandable Voice Browser Panel */}
          {voiceBrowserOpen && (
            <div className="mb-3 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Tab Header */}
              <div className="border-b border-gray-100 px-4 flex items-center gap-6">
                <button
                  onClick={() => setActiveTab('explore')}
                  className={`py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'explore'
                      ? 'text-black border-black'
                      : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  Explore
                </button>
                <button
                  onClick={() => setActiveTab('my-voices')}
                  className={`py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'my-voices'
                      ? 'text-black border-black'
                      : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  My Voices
                </button>
              </div>

              {activeTab === 'explore' ? (
                <div className="p-4 space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Start typing to search..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[14px] text-black placeholder:text-gray-400 outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>

                  {/* Filter Chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                      + Languages
                    </button>
                    <button className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                      + Accent
                    </button>
                    <button className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                      + Category
                    </button>
                    <button className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                      + Gender
                    </button>
                    <button className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                      + Age
                    </button>
                    <button className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-600">
                      <Filter size={13} />
                    </button>
                  </div>

                  {/* Voice List */}
                  <div className="max-h-72 overflow-y-auto space-y-1.5">
                    {filteredVoices.length > 0 ? (
                      filteredVoices.map((voice) => (
                        <div
                          key={voice.id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                            selectedVoiceId === voice.id
                              ? 'bg-black/5 border border-black/10'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                          onClick={() => handleSelectVoice(voice.id)}
                        >
                          {/* Avatar */}
                          <div className={`w-9 h-9 rounded-full flex-shrink-0 ${voice.avatar}`} />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-black truncate">{voice.name}</p>
                            <p className="text-xs text-gray-500 truncate">{voice.description}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreview(voice.id);
                              }}
                              className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-600"
                            >
                              {previewingId === voice.id ? (
                                <Pause size={13} strokeWidth={2} />
                              ) : (
                                <Play size={13} strokeWidth={2} />
                              )}
                            </button>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-600"
                            >
                              <MoreVertical size={13} />
                            </button>
                          </div>

                          {/* Selected indicator */}
                          {selectedVoiceId === voice.id && (
                            <div className="w-2 h-2 rounded-full bg-black flex-shrink-0" />
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-6 text-gray-400 text-sm">No voices found. Try a different search.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-400 text-sm">You haven't created any voices yet.</p>
                  <p className="text-gray-300 text-xs mt-1">Create your own voice to get started.</p>
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          {!isPlaying ? (
            <button
              onClick={handleGenerate}
              disabled={!text.trim()}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-semibold transition-all ${
                text.trim()
                  ? 'bg-black text-white hover:bg-gray-800 active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Play size={18} strokeWidth={2} />
              Speak
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-semibold bg-black text-white hover:bg-gray-800 active:scale-[0.98] transition-all"
            >
              <Square size={16} strokeWidth={2} />
              Stop
            </button>
          )}

          {/* Character Count */}
          <div className="flex items-center justify-between mt-2.5 px-0.5">
            <span className="text-xs text-gray-400">
              Browser built-in TTS
            </span>
            <span className="text-xs text-gray-400">
              {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
