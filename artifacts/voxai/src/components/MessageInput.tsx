import { useState, useRef, useEffect } from 'react';
import { Plus, Mic, ArrowUp } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-white via-white to-white/0 pt-6 pb-[env(safe-area-inset-bottom,16px)]">
      <div className="max-w-3xl mx-auto px-4">
        {/* Dark card container */}
        <div className="bg-[#1c1c1e] rounded-[24px] px-4 pt-4 pb-3 flex flex-col gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message VoxAI..."
            rows={1}
            disabled={disabled}
            className="w-full resize-none bg-transparent text-[15px] text-white placeholder:text-[#8e8e93] outline-none leading-relaxed max-h-[120px] disabled:opacity-50"
          />

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            {/* Left: + button */}
            <button
              className="w-9 h-9 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-[#3a3a3c] transition-colors"
              aria-label="Attach"
            >
              <Plus size={18} strokeWidth={2} className="text-white" />
            </button>

            {/* Right: Mic + Send */}
            <div className="flex items-center gap-3">
              <button
                className="text-[#8e8e93] hover:text-white transition-colors"
                aria-label="Voice"
              >
                <Mic size={22} strokeWidth={1.5} />
              </button>
              <button
                onClick={handleSubmit}
                disabled={!hasText || disabled}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  hasText && !disabled
                    ? 'bg-white hover:bg-gray-200'
                    : 'bg-[#3a3a3c] cursor-not-allowed'
                }`}
                aria-label="Send"
              >
                <ArrowUp
                  size={18}
                  strokeWidth={2.5}
                  className={hasText && !disabled ? 'text-black' : 'text-[#8e8e93]'}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
