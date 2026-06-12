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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    /*
      Mobile  → fixed to viewport bottom (full width)
      md:+    → static, sits at bottom of left flex column
    */
    <div className="
      fixed bottom-0 left-0 right-0 z-20
      md:static md:bottom-auto md:left-auto md:right-auto md:z-auto
      bg-gradient-to-t from-white dark:from-[#181817] via-white dark:via-[#181817] to-transparent
      md:bg-none md:bg-[#181817] md:border-t md:border-white/5
      pt-6 pb-[env(safe-area-inset-bottom,16px)]
      md:pt-3 md:pb-4
    ">
      <div className="max-w-2xl mx-auto px-4">
        <div className="
          bg-white dark:bg-[#1c1c1e] md:bg-[#1e1e28]
          border border-gray-200 dark:border-gray-700 md:border-white/10
          rounded-[24px] px-4 pt-4 pb-3 flex flex-col gap-3
          shadow-[0_2px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.4)]
        ">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message VoxAI..."
            rows={1}
            disabled={disabled}
            className="w-full resize-none bg-transparent text-[15px] text-black dark:text-white md:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 md:placeholder:text-gray-600 outline-none leading-relaxed max-h-[120px] disabled:opacity-50"
          />
          <div className="flex items-center justify-between">
            <button
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 md:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 md:hover:bg-white/20 transition-colors"
              aria-label="Attach"
            >
              <Plus size={18} strokeWidth={2} className="text-gray-600 dark:text-gray-300 md:text-gray-400" />
            </button>
            <div className="flex items-center gap-3">
              <button className="text-gray-400 dark:text-gray-500 md:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 md:hover:text-gray-400 transition-colors" aria-label="Voice">
                <Mic size={22} strokeWidth={1.5} />
              </button>
              <button
                onClick={handleSubmit}
                disabled={!hasText || disabled}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  hasText && !disabled
                    ? 'bg-indigo-600 hover:bg-indigo-500'
                    : 'bg-gray-100 dark:bg-gray-700 md:bg-white/10 cursor-not-allowed'
                }`}
                aria-label="Send"
              >
                <ArrowUp
                  size={18}
                  strokeWidth={2.5}
                  className={hasText && !disabled ? 'text-white' : 'text-gray-400 dark:text-gray-500 md:text-gray-600'}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
