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
        {/* White card container */}
        <div className="bg-white border border-gray-200 rounded-[24px] px-4 pt-4 pb-3 flex flex-col gap-3 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message VoxAI..."
            rows={1}
            disabled={disabled}
            className="w-full resize-none bg-transparent text-[15px] text-black placeholder:text-gray-400 outline-none leading-relaxed max-h-[120px] disabled:opacity-50"
          />

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            {/* Left: + button */}
            <button
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label="Attach"
            >
              <Plus size={18} strokeWidth={2} className="text-gray-600" />
            </button>

            {/* Right: Mic + Send */}
            <div className="flex items-center gap-3">
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Voice"
              >
                <Mic size={22} strokeWidth={1.5} />
              </button>
              <button
                onClick={handleSubmit}
                disabled={!hasText || disabled}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  hasText && !disabled
                    ? 'bg-black hover:bg-gray-800'
                    : 'bg-gray-100 cursor-not-allowed'
                }`}
                aria-label="Send"
              >
                <ArrowUp
                  size={18}
                  strokeWidth={2.5}
                  className={hasText && !disabled ? 'text-white' : 'text-gray-400'}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
