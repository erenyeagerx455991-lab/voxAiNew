import { useState, useRef } from 'react';
import { Upload, Mic, Play, Check, AlertCircle, Loader2 } from 'lucide-react';
import { createVoiceModel } from '../services/voiceService';

type Step = 'upload' | 'record' | 'configure' | 'done';

interface CreateVoiceViewProps {
  onCreditsChange?: () => void;
}

export default function CreateVoiceView({ onCreditsChange }: CreateVoiceViewProps) {
  const [step, setStep] = useState<Step>('upload');
  const [voiceName, setVoiceName] = useState('');
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps: { id: Step; label: string; num: number }[] = [
    { id: 'upload', label: 'Upload Sample', num: 1 },
    { id: 'record', label: 'Record Voice', num: 2 },
    { id: 'configure', label: 'Configure', num: 3 },
    { id: 'done', label: 'Complete', num: 4 },
  ];

  const currentIdx = steps.findIndex((s) => s.id === step);

  const handleSubmit = async () => {
    if (!voiceName.trim()) return;
    setError('');
    setIsSubmitting(true);

    try {
      await createVoiceModel(voiceName, description, uploadedFile || undefined);
      setStep('done');
      onCreditsChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create voice model');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('upload');
    setVoiceName('');
    setDescription('');
    setUploadedFile(null);
    setError('');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-black mb-1">Create Your Own AI Voice</h2>
          <p className="text-sm text-gray-400">
            Clone your voice or create a unique AI voice from samples.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center gap-1 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex items-center gap-2 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    i <= currentIdx
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i < currentIdx ? <Check size={14} /> : s.num}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    i <= currentIdx ? 'text-black' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-px flex-1 mx-2 ${
                    i < currentIdx ? 'bg-black' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div>
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                uploadedFile ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {uploadedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center">
                    <Check size={24} className="text-white" />
                  </div>
                  <p className="text-sm font-medium text-black">{uploadedFile.name}</p>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div
                  className="cursor-pointer flex flex-col items-center gap-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Upload size={24} className="text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-black">
                    Drop an audio file or click to upload
                  </p>
                  <p className="text-xs text-gray-400">MP3, WAV, M4A up to 25MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setUploadedFile(f);
                }}
              />
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep('record')}
                className="px-6 py-3 rounded-2xl bg-black text-white text-[15px] font-medium hover:bg-gray-800 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step: Record */}
        {step === 'record' && (
          <div>
            <div className="border border-gray-200 rounded-2xl p-8 text-center">
              <div
                className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-black animate-pulse'
                    : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                }`}
                onClick={() => setIsRecording(!isRecording)}
              >
                <Mic
                  size={28}
                  className={isRecording ? 'text-white' : 'text-gray-600'}
                />
              </div>
              <p className="text-sm font-medium text-black mb-1">
                {isRecording ? 'Recording...' : 'Tap to record your voice'}
              </p>
              <p className="text-xs text-gray-400">
                {isRecording
                  ? 'Speak naturally for at least 30 seconds'
                  : 'Record a clear sample of your voice for the best results'}
              </p>
              {isRecording && (
                <div className="mt-4 flex items-center justify-center gap-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-black rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 32 + 8}px`,
                        animationDelay: `${i * 80}ms`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep('upload')}
                className="px-6 py-3 rounded-2xl border border-gray-200 text-[15px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setIsRecording(false);
                  setStep('configure');
                }}
                className="px-6 py-3 rounded-2xl bg-black text-white text-[15px] font-medium hover:bg-gray-800 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step: Configure */}
        {step === 'configure' && (
          <div>
            <div className="space-y-5">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  Voice Name
                </label>
                <input
                  type="text"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  placeholder="e.g., My Custom Voice"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-[15px] text-black placeholder:text-gray-400 outline-none focus:border-gray-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the voice characteristics..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-[15px] text-black placeholder:text-gray-400 outline-none resize-none focus:border-gray-400 transition-colors"
                />
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    For best results, provide at least 30 seconds of clear audio without background
                    noise. The more data you provide, the more accurate the voice clone will be.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep('record')}
                className="px-6 py-3 rounded-2xl border border-gray-200 text-[15px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!voiceName.trim() || isSubmitting}
                className={`px-6 py-3 rounded-2xl text-[15px] font-medium transition-colors flex items-center gap-2 ${
                  voiceName.trim() && !isSubmitting
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create Voice'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mx-auto mb-5">
              <Check size={32} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Voice Created!</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
              Your custom voice &ldquo;{voiceName}&rdquo; is being processed and will be ready soon.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={resetForm}
                className="px-5 py-3 rounded-2xl border border-gray-200 text-[15px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Create Another
              </button>
              <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-black text-white text-[15px] font-medium hover:bg-gray-800 transition-colors">
                <Play size={16} strokeWidth={2} />
                Try It Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
