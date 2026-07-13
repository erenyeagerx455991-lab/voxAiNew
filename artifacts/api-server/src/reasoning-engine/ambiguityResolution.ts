// ── V9.5 Ambiguity Resolution Engine ──────────────────────────────────────────
import type { AmbiguityReport } from './types.js';

const CONTRADICTION_MARKERS = ['but also', 'however', 'yet also', 'while also', 'on the other hand'];

export function detectAmbiguity(prompt: string): AmbiguityReport {
  const text = (prompt || '').trim();
  const lower = text.toLowerCase();

  const incompletePrompt = text.length < 25;
  const conflictingRequests = CONTRADICTION_MARKERS.some(m => lower.includes(m));
  const missingInformation = !/(for|target|audience|users?)\b/.test(lower);

  const implicitAssumptions: string[] = [];
  if (!/(color|palette|brand|style|theme)/.test(lower)) implicitAssumptions.push('No explicit visual style specified — defaulting to a neutral modern theme');
  if (!/(mobile|responsive|desktop)/.test(lower)) implicitAssumptions.push('No device target specified — assuming responsive web');
  if (!/(auth|login|account)/.test(lower)) implicitAssumptions.push('No auth requirement specified — assuming public access by default');

  const contradictoryObjectives = /(cheap|free)/.test(lower) && /(premium|enterprise|luxury)/.test(lower);

  let ambiguityScore = 0;
  if (incompletePrompt) ambiguityScore += 4;
  if (conflictingRequests) ambiguityScore += 3;
  if (missingInformation) ambiguityScore += 2;
  if (contradictoryObjectives) ambiguityScore += 3;
  ambiguityScore += Math.min(2, implicitAssumptions.length * 0.5);
  ambiguityScore = Math.min(10, ambiguityScore);

  const resolutionNotes: string[] = [];
  if (incompletePrompt) resolutionNotes.push('Prompt is short — filled gaps with sensible product defaults.');
  if (conflictingRequests) resolutionNotes.push('Detected conflicting language — prioritized the first stated objective.');
  if (missingInformation) resolutionNotes.push('No target audience stated — defaulted to a general consumer audience.');
  if (contradictoryObjectives) resolutionNotes.push('Cost and premium positioning conflict — defaulted to a balanced tier.');

  return {
    incompletePrompt,
    conflictingRequests,
    missingInformation,
    implicitAssumptions,
    contradictoryObjectives,
    ambiguityScore,
    resolved: true, // engine always resolves internally per spec — never blocks a build
    resolutionNotes,
  };
}
