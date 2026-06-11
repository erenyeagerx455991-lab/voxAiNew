import { useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Message } from '../lib/types';

const BUILD_STEPS = [
  'Understanding Business',
  'Writing Content',
  'Building Sections',
  'Creating Layout',
  'Preparing Preview',
];

function BuildProgress({ buildStep }: { buildStep: number }) {
  if (buildStep < 0) return null;

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 dark:bg-gray-800 md:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 flex flex-col gap-2 min-w-[220px]">
        {BUILD_STEPS.map((label, i) => {
          const isDone = buildStep > i || buildStep === 5;
          const isActive = buildStep === i;
          const isPending = buildStep < i && buildStep !== 5;

          return (
            <div key={label} className="flex items-center gap-2">
              {isDone && (
                <span className="w-4 h-4 flex items-center justify-center text-emerald-500 text-sm font-bold shrink-0">✓</span>
              )}
              {isActive && (
                <span className="w-4 h-4 flex items-center justify-center shrink-0">
                  <svg className="animate-spin text-blue-500 w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                </span>
              )}
              {isPending && (
                <span className="w-4 h-4 flex items-center justify-center text-gray-300 dark:text-gray-600 text-sm shrink-0">○</span>
              )}
              <span
                className={`text-[13px] leading-snug transition-colors ${
                  isDone
                    ? 'text-gray-700 dark:text-gray-300 md:text-gray-300 font-medium'
                    : isActive
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ChatViewProps {
  messages: Message[];
  isTyping: boolean;
  streamingContent: string;
  chatError: string;
  buildStep: number;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-black text-white rounded-br-md md:bg-indigo-600'
            : 'bg-gray-100 dark:bg-gray-800 md:bg-gray-800 text-gray-900 dark:text-gray-100 md:text-gray-100 rounded-bl-md'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md bg-gray-100 dark:bg-gray-800 md:bg-gray-800 text-gray-900 dark:text-gray-100 md:text-gray-100 text-[14.5px] leading-relaxed whitespace-pre-wrap">
        {content}
        <span className="inline-block w-0.5 h-4 bg-gray-400 dark:bg-gray-500 ml-0.5 animate-pulse align-text-bottom" />
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 dark:bg-gray-800 md:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-700 dark:text-red-400 text-[14px] leading-relaxed flex items-start gap-2">
        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
        <span>{message}</span>
      </div>
    </div>
  );
}

export default function ChatView({ messages, isTyping, streamingContent, chatError, buildStep }: ChatViewProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, [messages.length, isTyping, streamingContent, chatError]);

  const showStreaming = buildStep >= 2 || buildStep === 5 || buildStep < 0;

  if (messages.length === 0 && !isTyping && !chatError && buildStep < 0) {
    return <div className="flex-1 bg-white dark:bg-gray-900 md:bg-[#111118]" />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 bg-white dark:bg-gray-900 md:bg-[#111118]">
      <div className="max-w-2xl mx-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isTyping && <BuildProgress buildStep={buildStep} />}
        {isTyping && streamingContent && showStreaming && (
          <StreamingBubble content={streamingContent} />
        )}
        {isTyping && !streamingContent && buildStep < 0 && <TypingIndicator />}
        {chatError && <ErrorBanner message={chatError} />}

        <div ref={endRef} />
      </div>
    </div>
  );
}
