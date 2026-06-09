import { useState, useRef, useEffect } from 'react';
import { Plus, Mic, ArrowUp } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-3xl px-3 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <button
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Attach"
          >
            <Plus size={20} strokeWidth={1.5} className="text-gray-500" />
          </button>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message VoxAI..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-[15px] text-black placeholder:text-gray-400 outline-none py-2 leading-snug max-h-[120px]"
          />
          <button
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Voice input"
          >
            <Mic size={20} strokeWidth={1.5} className="text-gray-500" />
          </button>
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className={`p-2 rounded-xl transition-all flex-shrink-0 ${
              value.trim()
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-100 text-gray-400'
            }`}
            aria-label="Send"
          >
            <ArrowUp size={20} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
