import { Sparkles, AlertCircle } from 'lucide-react';
import type { Message } from '../lib/types';

interface ChatViewProps {
  messages: Message[];
  isTyping: boolean;
  streamingContent: string;
  chatError: string;
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mb-5">
        <Sparkles size={24} className="text-white" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-semibold text-black mb-2">How can I help you today?</h2>
      <p className="text-sm text-gray-400 text-center max-w-xs leading-relaxed">
        Ask me anything. I can chat, convert text to speech, or help you create a custom AI voice.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-2.5 w-full max-w-sm">
        {[
          'Explain quantum computing',
          'Write a poem about rain',
          'Summarize a long article',
          'Help me brainstorm',
        ].map((suggestion) => (
          <div
            key={suggestion}
            className="px-3.5 py-3 rounded-2xl border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer leading-snug"
          >
            {suggestion}
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-black text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
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
      <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md bg-gray-100 text-gray-900 text-[14.5px] leading-relaxed whitespace-pre-wrap">
        {content}
        <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 animate-pulse align-text-bottom" />
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md bg-red-50 border border-red-100 text-red-700 text-[14px] leading-relaxed flex items-start gap-2">
        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
        <span>{message}</span>
      </div>
    </div>
  );
}

export default function ChatView({ messages, isTyping, streamingContent, chatError }: ChatViewProps) {
  if (messages.length === 0 && !isTyping && !chatError) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && streamingContent && <StreamingBubble content={streamingContent} />}
        {isTyping && !streamingContent && <TypingIndicator />}
        {chatError && <ErrorBanner message={chatError} />}
      </div>
    </div>
  );
}
