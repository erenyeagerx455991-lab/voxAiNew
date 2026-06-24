// ── V7.2.8 Form Quality Metrics ───────────────────────────────────────────────
// Tracks react-hook-form, Zod, Label, error-state, loading-state usage per build.
// Feeds into GET /api/telemetry/quality → formQuality.

export interface FormBuildRecord {
  score:              number;
  hasForm:            boolean;
  reactHookFormUsage: boolean;
  zodUsage:           boolean;
  labelUsage:         boolean;
  errorStateUsage:    boolean;
  loadingStateUsage:  boolean;
  multiStepUsage:     boolean;
  crudUsage:          boolean;
  recordedAt:         number;
}

const _formHistory: FormBuildRecord[] = [];

export function recordFormScore(record: Omit<FormBuildRecord, 'recordedAt'>): void {
  _formHistory.push({ ...record, recordedAt: Date.now() });
  if (_formHistory.length > 100) _formHistory.shift();
}

export function getFormQualityMetrics() {
  const recent  = _formHistory.slice(-20);
  const total   = recent.length;
  const forms   = recent.filter(r => r.hasForm);
  const fTotal  = forms.length;

  const avgScore = total > 0
    ? Math.round(recent.reduce((s, r) => s + r.score, 0) / total * 10) / 10
    : 0;

  const avgFormScore = fTotal > 0
    ? Math.round(forms.reduce((s, r) => s + r.score, 0) / fTotal * 10) / 10
    : 0;

  const pct = (key: keyof FormBuildRecord) =>
    fTotal > 0 ? Math.round(forms.filter(r => r[key]).length / fTotal * 100) : 0;

  return {
    averageFormScore:     avgFormScore,
    averageAllBuildsScore: avgScore,
    formBuildsTracked:    fTotal,
    totalBuildsTracked:   total,
    validation: {
      reactHookFormUsage: pct('reactHookFormUsage'),
      zodUsage:           pct('zodUsage'),
      labelUsage:         pct('labelUsage'),
      errorStateUsage:    pct('errorStateUsage'),
      loadingStateUsage:  pct('loadingStateUsage'),
    },
    workflow: {
      multiStepUsage: pct('multiStepUsage'),
      crudUsage:      pct('crudUsage'),
    },
    recentScores: recent.slice(-5).map(r => ({ score: r.score, hasForm: r.hasForm })),
  };
}

export function resetFormQualityMetrics(): void {
  _formHistory.length = 0;
}
