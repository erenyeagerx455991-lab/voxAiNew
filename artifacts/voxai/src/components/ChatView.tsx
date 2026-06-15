import { useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Message } from '../lib/types';
import type { EditDiff } from '../services/builderService';

// ── Build pipeline (10 steps) ────────────────────────────────────────────────
const BUILD_STEPS = [
  { label: 'Planner Agent',       colors: 'from-violet-500 to-purple-600' },
  { label: 'Architecture Agent',  colors: 'from-fuchsia-500 to-pink-600' },
  { label: 'Design Agent',        colors: 'from-pink-500 to-rose-500' },
  { label: 'Frontend Agent',      colors: 'from-blue-500 to-cyan-500' },
  { label: 'Code Fix Agent',      colors: 'from-emerald-500 to-teal-500' },
  { label: 'Backend Agent',       colors: 'from-indigo-500 to-blue-600' },
  { label: 'Database Agent',      colors: 'from-cyan-500 to-sky-600' },
  { label: 'Auth Agent',          colors: 'from-lime-500 to-green-600' },
  { label: 'Scaffold Agent',      colors: 'from-orange-500 to-amber-400' },
  { label: 'Preparing Preview',   colors: 'from-amber-500 to-orange-500' },
];

// ── Edit pipeline (5 steps) ──────────────────────────────────────────────────
const EDIT_STEPS = [
  { label: 'Intent Detector',  colors: 'from-violet-500 to-purple-600' },
  { label: 'File Resolver',    colors: 'from-blue-500 to-cyan-500' },
  { label: 'Patch Generator',  colors: 'from-orange-500 to-amber-400' },
  { label: 'Quality Gate',     colors: 'from-emerald-500 to-teal-500' },
  { label: 'Merge Engine',     colors: 'from-indigo-500 to-blue-600' },
];

function AgentIcon({ isActive, isDone, colors }: { isActive: boolean; isDone: boolean; colors: string }) {
  if (isDone) {
    return (
      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${colors} flex items-center justify-center shrink-0`}>
        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (isActive) {
    return (
      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${colors} flex items-center justify-center shrink-0`}>
        <svg className="animate-spin text-white w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-gray-700/40 border border-gray-600/40 flex items-center justify-center shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
    </div>
  );
}

function AgentPipeline({ buildStep, isEditMode }: { buildStep: number; isEditMode: boolean }) {
  if (buildStep < 0) return null;

  if (isEditMode) {
    const steps = EDIT_STEPS;
    const activeStep = buildStep <= 4 ? buildStep : 4;
    const isDone = buildStep >= 9;

    return (
      <div className="flex justify-start mb-3">
        <div className="bg-gray-900/90 border border-gray-700/50 backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-3.5 flex flex-col gap-2.5 min-w-[220px]">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Edit Pipeline V5</span>
          </div>
          {steps.map(({ label, colors }, i) => {
            const stepDone = isDone || activeStep > i;
            const stepActive = !isDone && activeStep === i;
            return (
              <div key={label} className={`flex items-center gap-2.5 transition-all duration-300 ${activeStep < i && !isDone ? 'opacity-35' : 'opacity-100'}`}>
                <AgentIcon isActive={stepActive} isDone={stepDone} colors={colors} />
                <span className={`text-[13px] font-semibold leading-none ${stepDone ? 'text-gray-300' : stepActive ? 'text-white' : 'text-gray-500'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="bg-gray-900/90 border border-gray-700/50 backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-3.5 flex flex-col gap-2.5 min-w-[240px]">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Multi-Agent Pipeline</span>
        </div>
        {BUILD_STEPS.map(({ label, colors }, i) => {
          const isDone = buildStep > i;
          const isActive = buildStep === i;
          return (
            <div key={label} className={`flex items-center gap-2.5 transition-all duration-300 ${buildStep < i ? 'opacity-35' : 'opacity-100'}`}>
              <AgentIcon isActive={isActive} isDone={isDone} colors={colors} />
              <span className={`text-[13px] font-semibold leading-none ${isDone ? 'text-gray-300' : isActive ? 'text-white' : 'text-gray-500'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditDiffPanel({ diff }: { diff: EditDiff }) {
  const total = diff.changedFiles.length + diff.createdFiles.length + diff.deletedFiles.length;
  if (total === 0) return null;

  return (
    <div className="flex justify-start mb-3">
      <div className="bg-gray-900/90 border border-gray-700/50 rounded-2xl rounded-bl-md px-4 py-3.5 flex flex-col gap-2 min-w-[240px] max-w-[320px]">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Changes Applied</span>
        </div>
        {diff.changedFiles.map((f) => (
          <div key={f} className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-yellow-400 w-3">~</span>
            <span className="text-[12px] text-gray-300 truncate">{f.split('/').pop()}</span>
          </div>
        ))}
        {diff.createdFiles.map((f) => (
          <div key={f} className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-400 w-3">+</span>
            <span className="text-[12px] text-gray-300 truncate">{f.split('/').pop()}</span>
          </div>
        ))}
        {diff.deletedFiles.map((f) => (
          <div key={f} className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-red-400 w-3">−</span>
            <span className="text-[12px] text-gray-400 line-through truncate">{f.split('/').pop()}</span>
          </div>
        ))}
        <div className="mt-1 pt-1.5 border-t border-gray-700/50">
          <span className="text-[11px] text-gray-500">
            {total} file{total !== 1 ? 's' : ''} affected — no other files touched
          </span>
        </div>
      </div>
    </div>
  );
}

function parsePlanItems(text: string): string[] {
  const items: string[] = [];
  const lines = text.split('\n');
  let inPlanSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('✅ Plan') || trimmed.startsWith('✅Plan')) {
      inPlanSection = true;
      continue;
    }
    if (inPlanSection) {
      if (/^[📋📄⚙️]/.test(trimmed) || trimmed.startsWith('---')) break;
      const item = trimmed.replace(/^[•\-\*]\s*/, '').trim();
      if (item.length > 5) items.push(item);
    }
  }
  return items;
}

function PlanChecklist({ content, isComplete }: { content: string; isComplete: boolean }) {
  const items = parsePlanItems(content);
  if (items.length === 0) return null;

  return (
    <div className="flex justify-start mb-3">
      <div className="flex flex-col gap-2 max-w-[85%]">
        {items.map((item, i) => {
          const isLast = i === items.length - 1 && !isComplete;
          const done = !isLast;
          return (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                done
                  ? 'bg-emerald-500/15 border-emerald-500/70'
                  : 'border-gray-600'
              }`}>
                {done && (
                  <svg className="w-2.5 h-2.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={`text-[13px] leading-snug ${done ? 'text-gray-200' : 'text-gray-500'}`}>
                {item}
              </span>
            </div>
          );
        })}
        {isComplete && (
          <div className="flex items-center gap-1.5 mt-1">
            <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M2 12l5 5L15 7M8 12l5 5L23 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-emerald-400 text-[12px] font-medium">Plan completed</span>
          </div>
        )}
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
  isEditMode?: boolean;
  lastEditDiff?: EditDiff | null;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-black text-white rounded-br-md md:bg-indigo-600'
          : 'bg-gray-100 dark:bg-gray-800 md:bg-gray-800 text-gray-900 dark:text-gray-100 md:text-gray-100 rounded-bl-md'
      }`}>
        {message.content}
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

export default function ChatView({ messages, isTyping, streamingContent, chatError, buildStep, isEditMode, lastEditDiff }: ChatViewProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, [messages.length, isTyping, streamingContent, chatError, buildStep]);

  if (messages.length === 0 && !isTyping && !chatError && buildStep < 0) {
    return <div className="flex-1 bg-white dark:bg-[#181817] md:bg-[#181817]" />;
  }

  const hasPlanItems = parsePlanItems(streamingContent).length > 0;
  const planIsComplete = buildStep > 0 && hasPlanItems;

  // Find the last assistant message to know where to show the diff
  const lastAssistantIdx = [...messages].reverse().findIndex(m => m.role === 'assistant');
  const lastAssistantId = lastAssistantIdx >= 0 ? messages[messages.length - 1 - lastAssistantIdx]?.id : null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 bg-white dark:bg-[#181817] md:bg-[#181817]">
      <div className="max-w-2xl mx-auto">
        {messages.map((msg, idx) => (
          <div key={msg.id}>
            <MessageBubble message={msg} />
            {/* Show diff panel right after the last assistant message (only when not still typing) */}
            {!isTyping && lastEditDiff && msg.id === lastAssistantId && idx === messages.length - 1 && (
              <EditDiffPanel diff={lastEditDiff} />
            )}
          </div>
        ))}

        {isTyping && isEditMode && buildStep >= 0 && buildStep < 9 && (
          <AgentPipeline buildStep={buildStep} isEditMode={true} />
        )}

        {isTyping && !isEditMode && buildStep >= 0 && (
          <AgentPipeline buildStep={buildStep} isEditMode={false} />
        )}

        {isTyping && hasPlanItems && !isEditMode && (
          <PlanChecklist content={streamingContent} isComplete={planIsComplete} />
        )}

        {isTyping && !streamingContent && buildStep < 0 && <TypingIndicator />}

        {chatError && <ErrorBanner message={chatError} />}
        <div ref={endRef} />
      </div>
    </div>
  );
}
