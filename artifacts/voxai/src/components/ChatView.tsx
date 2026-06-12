import { useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Message } from '../lib/types';

const AGENT_STEPS = [
  { label: 'Planner Agent', desc: 'Understanding & planning your website' },
  { label: 'Design Agent', desc: 'Choosing colors, fonts & layout style' },
  { label: 'Code Generation Agent', desc: 'Writing React + Tailwind code' },
  { label: 'Code Fix Agent', desc: 'Reviewing & fixing errors automatically' },
  { label: 'Preparing Preview', desc: 'Rendering your website' },
];

function AgentIcon({ step, isActive, isDone }: { step: number; isActive: boolean; isDone: boolean }) {
  const icons = ['🧠', '🎨', '⚡', '🔧', '✨'];
  const colors = [
    'from-violet-500 to-purple-600',
    'from-pink-500 to-rose-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
  ];

  if (isDone) {
    return (
      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${colors[step]} flex items-center justify-center shrink-0`}>
        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (isActive) {
    return (
      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${colors[step]} flex items-center justify-center shrink-0 animate-pulse`}>
        <svg className="animate-spin text-white w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-7 h-7 rounded-full bg-gray-700/50 border border-gray-600/50 flex items-center justify-center shrink-0">
      <span className="text-[10px] text-gray-500">{icons[step]}</span>
    </div>
  );
}

function BuildProgress({ buildStep }: { buildStep: number }) {
  if (buildStep < 0) return null;

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-900/80 border border-gray-700/50 backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-3.5 flex flex-col gap-3 min-w-[270px] max-w-[320px]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider">Multi-Agent Pipeline</span>
        </div>
        {AGENT_STEPS.map(({ label, desc }, i) => {
          const isDone = buildStep > i;
          const isActive = buildStep === i;
          const isPending = buildStep < i;

          return (
            <div key={label} className={`flex items-start gap-3 transition-all duration-300 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
              <AgentIcon step={i} isActive={isActive} isDone={isDone} />
              <div className="flex flex-col min-w-0">
                <span
                  className={`text-[13px] leading-snug font-semibold ${
                    isDone
                      ? 'text-gray-300'
                      : isActive
                      ? 'text-white'
                      : 'text-gray-500'
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <span className="text-[11px] text-gray-400 mt-0.5 leading-snug">{desc}</span>
                )}
              </div>
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
  }, [messages.length, isTyping, streamingContent, chatError, buildStep]);

  const showStreaming = buildStep === 0 || buildStep >= 4;

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
