// V6.1: Error Classification Engine + Repair Strategy Library

export type ErrorCategory =
  | 'import'
  | 'typescript'
  | 'jsx'
  | 'route'
  | 'hook'
  | 'dependency'
  | 'api'
  | 'runtime'
  | 'unknown';

export interface ClassifiedError {
  category: ErrorCategory;
  confidence: number;
  affectedFile?: string;
  hint?: string;
}

const CLASSIFICATION_RULES: Array<{
  patterns: RegExp[];
  category: ErrorCategory;
  hint: string;
}> = [
  {
    patterns: [/cannot find module/i, /failed to resolve/i, /module not found/i, /no such file/i, /could not resolve/i],
    category: 'import',
    hint: 'Fix missing import or wrong path',
  },
  {
    patterns: [/unexpected token/i, /unterminated jsx/i, /invalid jsx/i, /adjacent jsx/i, /expected corresponding/i, /jsx.*not/i],
    category: 'jsx',
    hint: 'Fix JSX syntax error',
  },
  {
    patterns: [/property.*does not exist/i, /type.*is not assignable/i, /argument.*not assignable/i, /expected.*arguments/i, /object is possibly/i],
    category: 'typescript',
    hint: 'Fix TypeScript type error',
  },
  {
    patterns: [/invalid hook call/i, /hooks can only/i, /rendered more hooks/i, /cannot call hook/i, /useeffect.*deps/i, /react hook/i],
    category: 'hook',
    hint: 'Fix React hook violation',
  },
  {
    patterns: [/no route matches/i, /route.*not found/i, /404.*route/i, /navigate.*undefined/i, /usenavigate/i],
    category: 'route',
    hint: 'Fix route configuration',
  },
  {
    patterns: [/fetch.*failed/i, /network request/i, /cors/i, /failed to fetch/i, /api.*error/i, /endpoint.*not found/i],
    category: 'api',
    hint: 'Fix API call or endpoint',
  },
  {
    patterns: [/is not defined/i, /package.*not found/i, /require.*cannot/i, /cannot find name/i],
    category: 'dependency',
    hint: 'Add missing package or fix import',
  },
  {
    patterns: [/typeerror/i, /referenceerror/i, /undefined.*null/i, /cannot read.*null/i, /undefined is not/i, /null is not/i, /cannot set prop/i],
    category: 'runtime',
    hint: 'Fix null/undefined runtime crash',
  },
];

export function classifyRuntimeError(error: { message: string; stack?: string; file?: string }): ClassifiedError {
  const msg = `${error.message} ${error.stack ?? ''}`.toLowerCase();
  for (const rule of CLASSIFICATION_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(msg)) {
        return {
          category: rule.category,
          confidence: 85,
          affectedFile: error.file,
          hint: rule.hint,
        };
      }
    }
  }
  return { category: 'unknown', confidence: 40, affectedFile: error.file, hint: 'General repair attempt' };
}

export const REPAIR_PROMPTS: Record<ErrorCategory, string> = {
  import: `Fix the import error. Check for:
- Wrong relative path (use correct ./ or ../ paths, check folder structure)
- Missing file — if a component file is missing, create a minimal stub
- Named vs default import mismatch (import X vs import { X })
- Circular imports — break cycles by restructuring`,

  jsx: `Fix the JSX syntax error. Check for:
- Unclosed JSX tags — every opening tag needs a close or self-close
- Missing parentheses around multi-line JSX return
- Invalid prop expressions — use {} for JS expressions
- Adjacent elements without Fragment wrapper (<> ... </>)
- Reserved words used as prop names (class → className, for → htmlFor)`,

  typescript: `Fix the TypeScript error. Check for:
- Missing optional chaining — use ?. for nullable property access
- Type mismatches — add type assertions or fix the value
- Missing interface properties — add required fields with sensible defaults
- Wrong prop types — correct the type annotation or add | undefined
- Object is possibly undefined — add null check before access`,

  hook: `Fix the React hook violation. Check for:
- Hooks called conditionally — move ALL hooks above any if/return statements
- Hooks in loops — refactor to use a single hook with array state
- Missing or incorrect useEffect dependency array
- State updates during render — move to useEffect with proper deps
- useCallback/useMemo with stale closure — update dependency array`,

  route: `Fix the route error. Check for:
- Missing route components — create minimal stub components for each route
- Wrong route path format — paths should start with /
- useNavigate/useParams called outside router context — wrap in Router
- Nested route outlet not rendered — add <Outlet /> to parent route`,

  api: `Fix the API error. Check for:
- Wrong fetch URL — ensure base URL is correct
- CORS issues — add credentials: 'include' or handle preflight
- Wrong request method or malformed body
- Unhandled promise rejections — add .catch() or try/catch with setState
- JSON parse errors — validate response before parsing`,

  dependency: `Fix the dependency/undefined error. Check for:
- Undefined variable — add proper initialization or null check
- Missing package — replace with browser-safe alternative or remove
- Wrong package name (spelling, casing)
- Missing default export — check if import should use { } braces`,

  runtime: `Fix the runtime crash. Apply ALL of these safe coding rules:
- Replace arr.map(…) with (Array.isArray(arr) ? arr : []).map(…)
- Replace obj.prop with obj?.prop for all nullable access
- Replace useState() with useState([]) for arrays, useState({}) for objects, useState(null) for nullable
- Add default prop values: function Comp({ items = [], title = '', data = null })
- Wrap risky operations in try/catch with fallback UI
- Replace .length on potentially undefined with ?.length ?? 0`,

  unknown: `Fix the error using defensive coding:
- Add optional chaining (?.) everywhere you access nested properties
- Add default values for all useState initializations
- Add null/undefined guards before array/object operations
- Ensure all event handlers have try/catch protection
- Add key props to all .map() rendered elements`,
};
