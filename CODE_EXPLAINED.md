# VoxAI — Code Explained, Line-by-Line (Learning Document)

Ye file tumhare liye ek **living course** hai — mai isme part-by-part poore project ka
code detail me explain karta rahunga (har file, har logic, har concept). Har baar jab
naya part ready hoga, mai isi file me neeche add karunga. Isko upar se niche padhte jao,
sequence important hai (baad wale parts pehle wale concepts use karte hain).

**Kaise padhna hai:** Har code-block ke baad, uska explanation hai. Jahan bhi koi naya
programming concept (state, hook, async, etc.) pehli baar aayega, use **bold** karke
poora samjhaya gaya hai — agar bhool jao to Ctrl+F se wapas dhoondh sakte ho.

---

# PART 1 — Frontend Start-up

## 1.1 `artifacts/voxai/src/main.tsx` — App ka entry point

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
```

Ye sabse pehli file hai jo browser me chalti hai jab koi voxai website kholta hai.

- **`import`** — JavaScript/TypeScript me kisi doosri file se code "udhaar" lene ka tareeka.
  `import { StrictMode } from 'react'` ka matlab: `react` naam ki library se `StrictMode`
  naam ki cheez nikaal ke le aao.
- **`StrictMode`** — React ka dev-mode-only safety-net. Ye har component ko **do baar**
  render karta hai taaki agar tumne koi "impure" code likha ho (jaise render ke andar
  seedha kisi variable ko modify karna) to turant dikh jaaye. Production build me iska
  koi effect nahi padta, performance same rehti hai.
- **`createRoot(document.getElementById('root')!)`** —
  - `document.getElementById('root')` — Browser ka built-in function, HTML file
    (`index.html`) ke andar `<div id="root"></div>` dhoondta hai.
  - `!` — TypeScript ka "non-null assertion". `getElementById` normally `Element | null`
    return karta hai (ho sakta hai element na mile). `!` lagakar hum TypeScript se keh
    rahe hain "trust me, ye null nahi hoga" — agar galti se null hua to runtime crash
    hoga, but yahan hum jaante hain `index.html` me ye div guaranteed hai.
  - `createRoot(...)` — React ka function jo us div ko "React se control hone wala area"
    bana deta hai.
- **`.render(<StrictMode>...</StrictMode>)`** — Jo bhi JSX ismein diya, wahi us div ke
  andar draw ho jaata hai.
- **JSX** — `<ThemeProvider><App /></ThemeProvider>` dikhne me HTML jaisa hai lekin ye
  actually JavaScript hai (Babel/TypeScript compiler ise `React.createElement(...)` calls
  me convert kar deta hai). Isse UI likhna aasan ho jaata hai.
- **`ThemeProvider`** — Ek "Context Provider" (neeche Context concept detail me aayega
  jab hum `useAuth` padhenge). Iska kaam hai poore app ko dark/light-mode ki info dena
  bina har component me manually pass kiye.

**One-liner summary:** Browser page load hota hai → React `#root` div ke andar poora
`<App />` UI draw kar deta hai, ThemeProvider ke andar wrap karke.

---

## 1.2 `artifacts/voxai/src/App.tsx` — Traffic controller (kaunsa screen dikhana hai)

Ye 372-line file hai. Iska ek hi kaam hai: **decide karna user ko is waqt kaunsa screen
dikhana hai** — loading, login/signup, landing page, chat/workspace, projects list, ya
admin panel. Saath hi ye chat-panel aur preview-panel ke beech ka resizable divider bhi
handle karta hai.

### Imports (lines 1-15)
Sab child components import ho rahe hain (`Sidebar`, `Header`, `ChatView`, etc.) — inhe
Part 3 me detail se dekhenge. `useAppStore` aur `useAuth` do **custom hooks** hain jo
app ka poora data manage karte hain (Part 2 me poora explain hoga).

```tsx
type AuthMode = 'login' | 'signup' | null;
```
**TypeScript "union type"** — ek custom type banaya jo sirf teen values le sakta hai:
`'login'`, `'signup'`, ya `null`. Agar kisi variable ko `AuthMode` type diya jaaye aur
koi `'signout'` assign kare, TypeScript **compile-time par hi error** dega — runtime
tak wait nahi karna padta bug pakadne ke liye. Yehi TypeScript ka fayda hai JavaScript
ke muqable.

### State setup (lines 19-33)

```tsx
function AppContent() {
  const { user, loading, signOut, refreshProfile, isAuthenticated } = useAuth();
  const store = useAppStore(isAuthenticated, refreshProfile);
  const [landingShown, setLandingShown] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [pendingMessage, setPendingMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const pendingSentRef = useRef(false);
```

- **`useAuth()`** — Login-related data nikaalte hain (kaun user hai, loading, sign-out).
- **`useAppStore(...)`** — Poora app-data (chats, messages, generated code, files) ek
  object (`store`) me milta hai.
- **`useState(initialValue)`** — React ka sabse core concept: **"state"**. Ye ek array
  return karta hai `[currentValue, setterFunction]`. Jab bhi `setterFunction` call hota
  hai, React **automatically us component ko phir se render** kar deta hai naye value
  ke saath. `useState(true)` likhne ka matlab: `landingShown` naam ka box banao jiski
  starting value `true` ho.
  - `landingShown` — Landing page dikh rahi hai ya nahi
  - `authMode` — Login form khula hai, signup khula hai, ya kuch nahi
  - `pendingMessage` — Agar user login karne se pehle hi prompt type kar de, to wo yahan
    "hold" ho jaata hai, login ke baad automatically send ho jaata hai
  - `showSettings`, `showPreviewModal` — Overlay screens dikhane/chhupane ke flags
- **`useRef(false)`** — `useState` jaisa hi ek box, lekin **iski value change hone par
  component re-render NAHI hota**. Isliye ye "silent memory" jaisa hai — data store karo
  jo screen update nahi karwana. `pendingSentRef` yahan track karta hai ki pending
  message already send ho chuka hai ya nahi (taaki duplicate na ho).

### Resizable split-panel — lines 29-118 (chat aur preview panel ke beech ka drag-handle)

```tsx
const [splitPos, setSplitPos] = useState(40); // % width for chat panel
const [isMd, setIsMd] = useState(() => window.innerWidth >= 768);
const containerRef = useRef<HTMLDivElement>(null);
const overlayRef = useRef<HTMLDivElement>(null);

const gestureRef = useRef({
  active: false,
  startX: 0,
  startY: 0,
  mode: 'idle' as 'idle' | 'detecting' | 'resize' | 'scroll',
  source: null as 'chat' | 'preview' | 'divider' | null,
});
```

Desktop (`md` size, 768px+ width) par screen do panels me bant-i hai: chat (left) +
preview (right), aur beech me ek draggable line hoti hai jise pakad ke width adjust kar
sakte ho.

- `splitPos` — Chat panel ki current width, percentage me (default 40%).
- `isMd` — Screen "medium" size ya usse bada hai ya nahi (`window.innerWidth >= 768`).
  `useState(() => ...)` — jab initial value calculate karne me thoda kaam ho (function
  call), to `useState` ko **function** do (lazy initializer), taaki wo function sirf
  **ek baar** chale (pehli render par), har render par nahi.
- `containerRef`, `overlayRef` — **DOM element references**. `useRef<HTMLDivElement>(null)`
  se hum ek asli `<div>` HTML element ko "pakad" sakte hain code se (jaise
  `containerRef.current.getBoundingClientRect()` — us div ki position/size nikalna).
- `gestureRef` — Ek complex object jo current drag-gesture ki state track karta hai:
  active hai ya nahi, drag kaha se shuru hua (`startX`, `startY`), kya mode hai
  (`'idle'` = kuch nahi ho raha, `'detecting'` = abhi decide ho raha hai user horizontal
  drag kar raha hai ya vertical scroll, `'resize'` = panel resize ho raha hai,
  `'scroll'` = normal page scroll), aur source (`'chat'`, `'preview'`, ya `'divider'` —
  drag kahan se shuru hua).

```tsx
useEffect(() => {
  const check = () => setIsMd(window.innerWidth >= 768);
  window.addEventListener('resize', check);
  return () => window.removeEventListener('resize', check);
}, []);
```

**`useEffect(fn, deps)`** — React ka teesra core concept: **"side effect"**. Iska matlab
hai "aisa code jo render hone ke *baad* chalna chahiye, aur jo bahar ki duniya
(browser APIs, network, timers) se interact kare." `fn` render ke baad chalta hai.
`deps` (dependency array) batata hai kab dobara chalna hai:
- `[]` (khaali array) — sirf **ek baar** chale, jab component pehli baar screen par aaye
  ("mount" ho)
- `[x, y]` — jab bhi `x` ya `y` badle, dobara chale
- deps hi na do — **har render** par chale (rare use-case)

Yahan: window resize hone par `isMd` update karo. `return () => ...` — ye "**cleanup
function**" hai, jo component hatne (unmount hone) par ya agla effect chalne se pehle
chalta hai — yahan listener hataya jaa raha hai taaki memory leak na ho (agar cleanup na
karo, to purane listeners jamā hote rahenge har baar component re-mount hone par).

```tsx
const clamp = (v: number) => Math.min(75, Math.max(20, v));

const applyResize = useCallback((clientX: number) => {
  if (!containerRef.current) return;
  const rect = containerRef.current.getBoundingClientRect();
  setSplitPos(clamp(((clientX - rect.left) / rect.width) * 100));
}, []);
```

- `clamp` — Ek simple helper function jo value ko 20 aur 75 ke beech "band" kar deta hai
  (chat panel kabhi 20% se kam ya 75% se zyada na ho).
- **`useCallback(fn, deps)`** — React ka function-memoization tool. Normally, har render
  par saare functions **naye sire se banaye jaate hain** (JavaScript me function ek
  value hai). Agar ye function kisi child component ko prop ke roop me diya jaa raha ho,
  to har render par "naya" function milne se child bhi unnecessarily re-render hota hai.
  `useCallback` us function ko "yaad" rakhta hai — jab tak `deps` na badle, wahi purana
  function reference wapas milta hai. `applyResize`: mouse ki current X-position lekar,
  container ki width ke hisaab se percentage nikal ke `splitPos` set karta hai.

```tsx
const startPanelGesture = useCallback((clientX: number, clientY: number, source: 'chat' | 'preview' | 'divider') => {
  if (!isMd) return;
  const mode = source === 'divider' ? 'resize' : 'detecting';
  gestureRef.current = { active: true, startX: clientX, startY: clientY, mode, source };
  if (source === 'divider') {
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }
}, [isMd]);
```
Jab user mouse-down / touch-start kare kisi panel ya divider par: agar mobile hai to
kuch mat karo (`!isMd`). Agar seedha divider par drag shuru hua, mode turant `'resize'`
set karo. Warna (`'chat'`/`'preview'` panel par) mode `'detecting'` rakho — abhi pata
nahi user resize karna chahta hai ya sirf scroll.

```tsx
const onGestureMove = useCallback((clientX: number, clientY: number) => {
  const g = gestureRef.current;
  if (!g.active) return;
  const dx = clientX - g.startX;
  const dy = clientY - g.startY;
  if (g.mode === 'detecting' && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
    g.mode = Math.abs(dx) >= Math.abs(dy) ? 'resize' : 'scroll';
    ...
  }
  if (g.mode === 'resize') applyResize(clientX);
}, [applyResize]);
```
Jab mouse/finger move ho: horizontal (`dx`) aur vertical (`dy`) distance nikaalo starting
point se. Jab tak movement 8px se kam hai, kuch decide mat karo (chhoti jitter ignore).
Jaise hi 8px se zyada move ho: agar horizontal movement zyada hai to `'resize'` mode
(panel resize karo), agar vertical zyada hai to `'scroll'` mode (normal scroll hone do,
resize mat karo). Ye ek **common mobile-UX pattern** hai — "direction lock" — taaki
scroll karte waqt galti se panel resize na ho jaaye.

```tsx
const onGestureEnd = useCallback((_clientX: number, _clientY: number) => {
  const g = gestureRef.current;
  if (g.source === 'preview' && g.mode !== 'resize' && overlayRef.current) {
    overlayRef.current.style.pointerEvents = 'none';
    setTimeout(() => {
      if (overlayRef.current) overlayRef.current.style.pointerEvents = 'auto';
    }, 200);
  }
  gestureRef.current = { active: false, startX: 0, startY: 0, mode: 'idle', source: null };
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}, []);
```
Jab drag khatam ho: agar user ne sirf preview panel par **tap** kiya (resize nahi kiya),
to preview ke upar wala transparent overlay 200ms ke liye "pointer-events: none" kar do
— taaki wo click seedha neeche wale iframe (generated website preview) tak pahunche.
Fir gesture state reset kar do.

`_clientX`/`_clientY` (underscore prefix) — convention hai ye batane ke liye "ye
parameter liya hai lekin use nahi ho raha" (TypeScript/ESLint ki unused-variable warning
avoid karne ke liye).

```tsx
useEffect(() => {
  const onMouseMove = (e: MouseEvent) => onGestureMove(e.clientX, e.clientY);
  const onTouchMove = (e: TouchEvent) => {
    onGestureMove(e.touches[0].clientX, e.touches[0].clientY);
    if (gestureRef.current.mode === 'resize') e.preventDefault();
  };
  const onMouseUp = (e: MouseEvent) => onGestureEnd(e.clientX, e.clientY);
  const onTouchEnd = (e: TouchEvent) => onGestureEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd);
  return () => { /* sab hata do */ };
}, [onGestureMove, onGestureEnd]);
```
Poore `window` par mouse-move/up aur touch-move/end listeners lagaye — kyunki drag
kabhi bhi panel ke bahar bhi ja sakta hai, isliye sirf ek component par listener kaafi
nahi. `{ passive: false }` — browser ko batata hai ki hum `preventDefault()` call kar
sakte hain (taaki resize karte waqt page scroll na ho).

### Authenticated + pending-message flow (lines 121-137)

```tsx
useEffect(() => {
  if (
    isAuthenticated &&
    store.initialized &&
    pendingMessage &&
    !pendingSentRef.current
  ) {
    pendingSentRef.current = true;
    setLandingShown(false);
    setAuthMode(null);
    store.setView('chat');
    store.handleSend(pendingMessage).finally(() => {
      setPendingMessage('');
      pendingSentRef.current = false;
    });
  }
}, [isAuthenticated, store.initialized, pendingMessage, store.handleSend, store.setView]);
```
Ye scenario handle karta hai: user landing page par prompt type karta hai **login se
pehle**. Jaise hi wo login/signup kar leta hai (`isAuthenticated` true ho jaata hai), aur
store initialize ho chuka ho, aur ek `pendingMessage` mojood ho, aur wo message pehle se
send nahi hua ho (`pendingSentRef.current` false) — to landing page hatao, chat view
kholo, aur wo pending message automatically bhej do. `.finally(...)` — **Promise** ka
method jo success ya failure dono cases me chalta hai (yahan message clear karne ke liye).

### Navigation handlers (lines 139-166)
Simple functions — bas state variables set karte hain, koi complex logic nahi:
- `handleLandingSubmit(text)` — landing page se prompt aaya: agar login nahi hai to
  signup form kholo (message `pendingMessage` me save karke), agar login hai to seedha
  chat view me chale jao.
- `handleCreateProject()` — landing page wapas dikhao (naya project banane ke liye)
- `handleOpenProjectsFromLanding()` — agar logged in ho to projects list dikhao, warna
  login form
- `handleOpenProject(chatId)` — us specific chat/project ko active karke chat view kholo

### Rendering logic (lines 169-364) — "kya dikhana hai" ka decision tree

```tsx
if (loading || !store.initialized) {
  return ( /* spinner UI */ );
}
if (showSettings) {
  return <SettingsPage onClose={() => setShowSettings(false)} />;
}
if (landingShown) {
  if (!isAuthenticated && authMode) {
    return <AuthView initialMode={authMode} onBack={() => setAuthMode(null)} />;
  }
  return <LandingPage ... />;
}
// ... warna: main workspace (Sidebar + Header + Chat/Preview ya Projects/Admin)
```

Ye pattern **"conditional (early-return) rendering"** kehlaata hai — React component me
function ke andar hi `if` statements se decide karo kaunsa JSX return karna hai. Jaise hi
koi condition match ho, wahi return ho jaata hai, neeche wala code chalta hi nahi.

Priority order (upar se neeche): **loading spinner > settings overlay > landing/auth >
main workspace**. Matlab agar `loading` true hai, to chahe `landingShown` bhi true ho, to
bhi loading spinner hi dikhega (kyunki uska check pehle aata hai aur `return` kar deta
hai function ko).

### Main workspace layout (lines 210-353)

```tsx
const activeChat = store.chats.find((c) => c.id === store.activeChatId);
const headerTitle = store.view === 'chat' ? (activeChat?.title || '') : ...;
const isWorkspaceView = store.view === 'chat';
```
- `.find(...)` — JavaScript Array method jo array me se pehla matching element dhoondta
  hai (yahan: current active chat ka object uske ID se).
- `?.` — **Optional chaining**. `activeChat?.title` ka matlab "agar `activeChat` mojood
  hai to uska `.title` lo, warna crash mat karo, `undefined` de do." Isse "cannot read
  property of null/undefined" errors se bacha jaata hai.

Baaki JSX Sidebar, Header, aur teen possible views render karta hai
(`store.view === 'chat' | 'projects' | 'admin'`) — chat view me dono panels
(chat + preview) hote hain, jinke beech wahi resize-divider hai jo upar explain kiya.

---

# PART 2 — App ka Data Layer (`useAppStore` aur `useAuth`)

Ye do files sabse zyaada important hain samajhne ke liye — inme poora app ka **"brain"**
hai (data kahan store hai, kaise change hota hai, backend se kaise baat hoti hai).

## 2.1 `artifacts/voxai/src/hooks/useAuth.tsx` (95 lines) — Login/User management

Ye ek **React Context** banata hai. Context React ka wo feature hai jisse tumhe data
har component me manually "prop drilling" (parent se child, child se grandchild...)
nahi karna padta — ek baar top par "provide" karo, kahin bhi neeche "consume" kar lo.

```tsx
interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}
```
**`interface`** — TypeScript me ek "shape" define karna: koi bhi object jo `AuthContextType`
type ka ho, usme exactly ye 5 properties honi chahiye is type ke saath. Ye runtime check
nahi hai — sirf **compile-time** par TypeScript check karta hai ki tum galat shape ka
object to nahi bana rahe.

```tsx
const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, signOut: async () => {}, refreshProfile: async () => {}, isAuthenticated: false,
});
```
`createContext(defaultValue)` — ek Context object banata hai jisme default value hai
(agar koi component Provider ke bahar `useContext` call kare, to yahi default milega).

```tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
```
`AuthProvider` ek **component** hai jo `children` prop leta hai (`ReactNode` type —
matlab "kuch bhi jo React render kar sake": text, JSX, arrays, etc.). `App.tsx` me hum
dekh chuke: `<AuthProvider><AppContent /></AuthProvider>` — matlab `AppContent` hi yahan
`children` hai.

```tsx
const fetchProfile = useCallback(async () => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) { setUser(null); setIsAuthenticated(false); return; }
  setIsAuthenticated(true);
  const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
  if (error) { setUser(null); return; }
  setUser(data);
}, []);
```
- **`async function`** — Ek function jiske andar `await` use kar sakte ho (matlab: "yahan
  ruk jao jab tak ye Promise complete na ho jaaye, phir aage badho" — bina poore program
  ko freeze kiye, sirf is function ke andar ka execution pause hota hai).
- **`await`** — Kisi async operation (jaise network call) ka result aane tak wait karo.
- **Destructuring** — `const { data: { user: authUser } } = await ...` — ye ek shortcut
  hai. Agar result `{ data: { user: {...} } }` jaisa object hai, to seedha usme se nested
  `user` nikal ke `authUser` naam de rahe hain, sab ek line me.
- **`supabase`** — Ek external service (Supabase) jo authentication + database dono
  provide karta hai. `supabase.auth.getUser()` — current logged-in user nikaalta hai.
  `supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()` — ek SQL
  query jaisa hai: "profiles table se wo row lao jiska id match kare, agar na mile to
  crash mat karo (`maybeSingle`), sirf `null` do."
- **Logic:** Pehle current logged-in user check karo. Agar koi login nahi hai, `user` ko
  null karo aur `isAuthenticated` false. Agar hai, to `isAuthenticated` true karo aur us
  user ki extra profile-info (jaise naam, avatar) database se fetch karo.

```tsx
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      setIsAuthenticated(true);
      fetchProfile().finally(() => setLoading(false));
    } else {
      setUser(null); setIsAuthenticated(false); setLoading(false);
    }
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      setIsAuthenticated(true);
      (async () => { await fetchProfile(); })();
    } else if (event === 'SIGNED_OUT') {
      setUser(null); setIsAuthenticated(false);
    }
  });

  return () => subscription.unsubscribe();
}, [fetchProfile]);
```
Component pehli baar load hone par (deps me `fetchProfile` hai, jo `useCallback` se
memoized hai, isliye practically ye effect sirf ek baar chalta hai):
1. `supabase.auth.getSession()` se check karo pehle se koi session (login) exist karta
   hai (jaise browser refresh hone par). Agar haan, profile fetch karo aur `loading` ko
   false karo (loading khatam, ab UI dikhao).
2. **`onAuthStateChange`** — Ek **"subscription" / "listener"** register karta hai jo
   future me hone wale auth events (login/logout/token-refresh) par automatically chalta
   hai. Ye **"event-driven programming"** ka example hai — hum function likhte hain jo
   "kabhi bhi ye event ho, tab chalna" — hume manually poll (baar-baar check) karne ki
   zaroorat nahi.
3. `return () => subscription.unsubscribe()` — cleanup, component hatne par listener
   band kar do.

```tsx
const signOut = async () => {
  await supabase.auth.signOut();
  setUser(null);
  setIsAuthenticated(false);
};

const refreshProfile = useCallback(async () => { await fetchProfile(); }, [fetchProfile]);

return (
  <AuthContext.Provider value={{ user, loading, signOut, refreshProfile, isAuthenticated }}>
    {children}
  </AuthContext.Provider>
);
```
`AuthContext.Provider` — Ye JSX element hai jo Context ki value **"neeche wale sab
children ke liye available"** kar deta hai. Jo bhi component neeche `useContext(AuthContext)`
call karega, use ye `value` object milega.

```tsx
export function useAuth() {
  return useContext(AuthContext);
}
```
Ye ek chhota **custom hook** hai — `useContext(AuthContext)` ko wrap kar diya taaki
baaki files me `useAuth()` likhna aasan ho (aur agar kabhi Context ka naam badalna ho,
sirf yahan change karna padega).

**Summary:** `useAuth` poore app ko batata hai "kaun login hai, uska profile kya hai,
loading ho raha hai ya nahi" — aur Supabase ke real-time events sunkar khud-b-khud
update karta rehta hai.

---

## 2.2 `artifacts/voxai/src/hooks/useAppStore.ts` (910 lines) — Poore app ka "state machine"

Ye sabse badi aur sabse important frontend file hai. Isse samajhna matlab samajhna ki
**chat kaise kaam karta hai, build kaise trigger hota hai, edit kaise hota hai**.

### Top-level imports aur helper functions (lines 1-139)

```ts
import { createChat, getChats, getMessages, updateChatTitle, deleteChat, addMessage } from '../services/chatService';
import { mockStreamResponse, mockEditResponse, runtimeRepair } from '../services/mockAiService';
```
- `chatService` — Supabase database ke saath baat karne ke functions (chat banana, list
  lena, messages lena/save karna).
- `mockAiService` — **Naam "mock" hai lekin ye asli backend ko call karta hai** (naam
  legacy hai, purane dev phase se reh gaya — cheezein aage badalte gayi lekin file-naam
  wahi rahe). `mockStreamResponse` naye project build ke liye backend `/api/agents/build`
  ko call karta hai; `mockEditResponse` existing project ko edit karne ke liye
  `/api/agents/edit` ko call karta hai.

```ts
const CODE_KEY  = (id: string) => `voxai_code_${id}`;
const FILES_KEY = (id: string) => `voxai_files_${id}`;
const LOCAL_CHATS_KEY = 'voxai_local_chats';
const LOCAL_MSGS_KEY = (id: string) => `voxai_msgs_${id}`;
```
Ye **"key generator" functions** hain — browser ke `localStorage` (ek chhota
key-value database jo browser me hi save rehta hai, page-refresh survive karta hai) me
data save karne ke liye unique keys banate hain, har chat-id ke hisaab se alag.

```ts
function getLocalChats(): Chat[] {
  try {
    const raw = localStorage.getItem(LOCAL_CHATS_KEY);
    return raw ? (JSON.parse(raw) as Chat[]) : [];
  } catch {
    return [];
  }
}
function saveLocalChats(chats: Chat[]) {
  try { localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(chats)); } catch {}
}
```
- `localStorage.getItem/setItem` — browser storage read/write karta hai, lekin ye sirf
  **string** store kar sakta hai. Isliye `JSON.stringify(obj)` se object ko text me
  convert karke save karte hain, aur `JSON.parse(text)` se wapas object banate hain.
- **`try { ... } catch { ... }`** — Error-handling. Agar `localStorage` full ho ya
  disabled ho (kuch browsers/privacy modes me hota hai), crash hone ke bajaye khaali
  array/kuch nahi return kar do.

Baaki helper functions (`addLocalChat`, `removeLocalChat`, `updateLocalChatTitle`,
`getLocalMessages`, `addLocalMessage`) isi pattern ko follow karte hain — Supabase ke
sath-sath ek **local fallback copy** rakhte hain, taaki agar Supabase down ho ya user
offline ho, app phir bhi kaam kare (**"offline-first" design pattern** ka halka version).

### `useAppStore` function — state declarations (lines 141-186)

```ts
export function useAppStore(isAuthenticated: boolean, onCreditsChange?: () => void): AppState {
  const [view, setView] = useState<View>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [chatError, setChatError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [buildStep, setBuildStep] = useState(-1);
  // ... (aur 30+ aise state variables)
```

Ye function ek **custom hook** hai — matlab `useState`/`useEffect` jaise built-in React
hooks ko use karke apna khud ka reusable "state bundle" banaya hai. Har state variable
ek specific cheez track karta hai:
- `view` — abhi kaunsa tab khula hai: `'chat'`, `'projects'`, ya `'admin'`
- `chats` — user ke saare saved projects/conversations ki list
- `activeChatId` — abhi kaunsa chat/project khula hai
- `activeChatMessages` — us chat ke saare messages (user ke prompts + AI ke replies)
- `isTyping` — AI abhi type/build kar raha hai (loading indicator ke liye)
- `streamingContent` — AI ka jawab jo **live streaming** me aa raha hai (jaise ChatGPT
  me letter-by-letter text aata hai)
- `generatedCode` — final generated website ka code (HTML/preview string)
- `buildStep` — build pipeline abhi kaunse step (0-13) par hai, taaki UI progress
  dikha sake ("Planning...", "Generating...", "Validating...")
- Baaki bahut saare (`dnaComposition`, `themeTokens`, `knowledgeGraph`,
  `registrySelection`, `runtimeState`, etc.) backend ke advanced pipeline features
  (jo hum Part 4+ me backend explain karte waqt cover karenge) ka data frontend me
  dikhane ke liye hain — jaise "design DNA breakdown panel", "component registry lock
  panel", "runtime health score panel".

```ts
const undoStackRef = useRef<ProjectFile[][]>([]);
const redoStackRef = useRef<ProjectFile[][]>([]);
```
**Undo/Redo implementation** — Ek classic Computer Science pattern: do "stacks" (last-in-
first-out lists). Har baar jab edit hota hai, purani files ka snapshot `undoStackRef` me
push ho jaata hai. Undo dabane par, us stack se latest snapshot nikaal ke wapas apply
karte hain, aur current state ko `redoStackRef` me daal dete hain (taaki redo bhi kaam
kare). `useRef` isliye use hua hai (na ki `useState`) kyunki ye stacks har render par UI
update trigger nahi karne chahiye — sirf backend logic ke liye internal memory hain.

### Loading chats aur real-time subscription (lines 254-336)

```ts
const loadChats = useCallback(async () => {
  try {
    const data = await getChats();
    const localChats = getLocalChats();
    const supabaseIds = new Set(data.map((c) => c.id));
    const localOnly = localChats.filter((c) => !supabaseIds.has(c.id));
    setChats([...data, ...localOnly].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ));
  } catch {
    setChats(getLocalChats());
  }
}, []);
```
- `Set` — JavaScript ka data-structure jo sirf **unique values** rakhta hai. Yahan
  Supabase se aaye chat-IDs ka ek Set banaya (fast "kya ye ID pehle se hai" check ke
  liye — `O(1)` lookup, array `.includes()` se fast).
  - **`.map((c) => c.id)`** — Array method: har item ko transform karke naya array
    banata hai (yahan: chat-objects ki list ko sirf unke IDs ki list me convert kiya).
  - **`.filter((c) => !supabaseIds.has(c.id))`** — Array method: sirf wo items rakhta
    hai jo condition pass karein (yahan: sirf wo local chats jo Supabase me nahi hain).
- `.sort((a, b) => ...)` — Array ko sort karta hai, yahan **latest-updated-first** order
  me.
- **Logic ka matlab:** Supabase se chats lao. Jo chats sirf locally save hain (Supabase
  me nahi — jaise jab user login nahi tha), unhe bhi list me jodo. Duplicate na ho isliye
  Set-based filtering. Agar Supabase call hi fail ho jaaye (network issue), poori list
  localStorage se le lo.

```ts
useEffect(() => {
  if (!activeChatId || !isAuthenticated) { setActiveChatMessages([]); return; }
  loadMessages(activeChatId);
  if (channelRef.current) { supabase.removeChannel(channelRef.current); }
  const channel = supabase
    .channel(`messages:${activeChatId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${activeChatId}` },
      (payload) => {
        const newMsg = payload.new as Message;
        setActiveChatMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      }
    )
    .subscribe();
  channelRef.current = channel;
  return () => { supabase.removeChannel(channel); channelRef.current = null; };
}, [activeChatId, isAuthenticated, loadMessages]);
```
Ye **Supabase Realtime** use kar raha hai — matlab jab bhi database ki `messages` table
me current chat ke liye ek naya row **INSERT** ho, ye code turant notify ho jaata hai
(bina baar-baar poll/refresh kiye) aur us naye message ko UI me add kar deta hai.
- `setActiveChatMessages((prev) => ...)` — **Functional state update**. `useState` ke
  setter ko function bhi diya jaa sakta hai jo "purani value" (`prev`) leke "nayi value"
  return kare. Ye zaroori hai jab naya value purani value par depend kare — isse React
  guarantee deta hai ki tumhe sahi "latest" purani value milegi (agar seedha
  `activeChatMessages` variable use karte, to kabhi-kabhi purana/stale value mil sakta
  tha "closures" ki wajah se — ye ek common React gotcha hai).
- `.some((m) => m.id === newMsg.id)` — Check karo ye message already list me hai ya
  nahi (duplicate na ho, kyunki hum apna khud ka message pehle se locally add kar chuke
  hote hain).

### `handleSend` — Sabse important function (lines 407-670+)

Ye function tab chalta hai jab user Message-box me kuch type karke send kare. Iska kaam:
1. Agar koi chat active nahi hai, naya chat banao
2. User ka message database/localStorage me save karo aur UI me turant dikhao
3. Decide karo — **naya build** karna hai ya **existing project ko edit** karna hai
   (`isEditMode = currentFiles.length > 0` — agar pehle se files hain, matlab edit mode)
4. Backend ko call karo (streaming response ke saath)
5. Jab backend ka result aaye, sab kuch (code, files, memory, knowledge-graph) state me
   save karo

```ts
const handleSend = useCallback(async (content: string) => {
  if (loadingRef.current) return;
  loadingRef.current = true;
  try {
    setChatError('');
    let chatId = activeChatId;
    if (!chatId) {
      // naya chat banao (Supabase try karo, fail ho to local UUID generate karo)
      ...
    }
    // user ka message save + turant UI me dikhao
    ...
    setIsTyping(true);
    setStreamingContent('');
    const currentFiles  = projectFilesRef.current;
    const currentMemory = projectMemoryRef.current;
    const isEditMode    = currentFiles.length > 0;
```
- `loadingRef.current` — Ek guard/lock: agar pehle se koi build/edit chal raha hai, naya
  request ignore kar do (duplicate submissions rokne ke liye).
- **Kyun `projectFilesRef.current` (ref) use kiya, `projectFiles` (state) nahi?** —
  Isse "**stale closure**" problem se bacha jaata hai. `handleSend` khud `useCallback`
  se banaya function hai jo lambe time tak zinda reh sakta hai (async operation ke
  andar). Agar seedha `projectFiles` state variable use karte, to us waqt ki "snapshot"
  value use hoti jab function **banaya** gaya tha, na ki jab wo **chal** raha hai. Ref
  hamesha "latest" value deta hai kyunki wo ek mutable box hai, state jaisa "frozen
  snapshot per render" nahi.

```ts
const handleDone = async (fullText, code, pb?, so?, serverFiles?, diff?) => {
  // assistant ka reply message save karo
  // generatedCode set karo
  // agar serverFiles aaye hain to undo-stack me snapshot push karo, phir naye files set karo
  // knowledge graph rebuild karo (edit mode me)
  // ProjectMemory update karo (project ka summary: type, pages, entities, features, edit history)
  setBuildStep(9);
  loadingRef.current = false;
  onCreditsChange?.();
  // V6.2: Autonomous Runtime Builder ko background me trigger karo
  if (serverFiles && serverFiles.length > 0 && chatId) {
    ...
    const resp = await fetch('/api/agents/autonomous-build', { method: 'POST', ... });
    const reader = resp.body.getReader();
    // SSE-jaisa manual stream-parsing
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // event parse karke autonomousBuildState update karo
    }
  }
};
```
`handleDone` ek **callback function** hai jo backend service (`mockStreamResponse` ya
`mockEditResponse`) ko diya jaata hai — jab backend ka kaam poora ho jaaye, ye function
call hota hai poore result ke saath. Ye pattern **"callback-based API"** kehlaata hai.

Yahan ek dilchasp cheez hai: `fetch('/api/agents/autonomous-build', ...)` ke response ko
manually stream karke padha jaa raha hai (`resp.body.getReader()`, `TextDecoder`) — ye
Server-Sent Events (SSE) ka low-level tareeka hai. Backend chunks me `data: {...}\n\n`
format me events bhejta rehta hai, frontend unhe split karke (`buf.split('\n\n')`) parse
karta hai. Ye tab use hota hai jab tumhe ek `EventSource` object use karne ki jagah zyaada
control chahiye (jaise POST request ke saath streaming — `EventSource` sirf GET
support karta hai).

```ts
const handleError = (err: string) => {
  setChatError(err);
  setStreamingContent('');
  setIsTyping(false);
  setBuildStep(-1);
  loadingRef.current = false;
};
const handleStep = (step: number) => setBuildStep(step);
```
Do simple callbacks — error aane par UI ko reset karke error message dikhao; step-change
hone par progress bar update karo.

```ts
if (isEditMode) {
  await mockEditResponse(content, currentFiles, currentMemory, (token) => setStreamingContent((prev) => prev + token), handleDone, handleError, handleStep, ...);
} else {
  await mockStreamResponse(content, (token) => setStreamingContent((prev) => prev + token), handleDone, handleError, handleStep, ...);
}
```
(Full build wala branch neeche hai, file me truncate ho gaya tha — lekin pattern same
hai.) Yahi hai wo decision point: **agar pehle se files hain to edit-API call hoga, warna
build-API call hoga.** `(token) => setStreamingContent((prev) => prev + token)` — jab bhi
backend se ek chhota text-chunk aaye, use `streamingContent` string me jodte jao — isi se
ChatGPT-jaisa "typing effect" dikhta hai UI me.

**Summary of `useAppStore`:** Ye hook poore app ka "single source of truth" hai. Isme:
saare chats/messages, current build/edit ka progress, generated code/files, aur dusre
20+ advanced-feature data (DNA, registry, runtime health) store hote hain. `App.tsx` isi
`store` object ko saare child components me prop ke through pass karta hai.

---

---

# PART 3 — Chat UI (`MessageInput.tsx` aur `ChatView.tsx`)

Ye do components mil ke wo screen banate hain jaha user type karta hai aur AI ka jawab
dikhta hai — jaise ChatGPT ka interface.

## 3.1 `artifacts/voxai/src/components/MessageInput.tsx` (99 lines) — Text-box + Send button

```tsx
interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;
```

- **`interface MessageInputProps`** — Ye component "kya-kya props leta hai" define karta
  hai. `onSend` ek function hai jo parent (`App.tsx` → `store.handleSend`) se aata hai —
  ye pattern **"lifting state up"** kehlaata hai: khud is component ke paas koi network-
  call logic nahi hai, ye sirf text collect karta hai aur jab user submit kare, parent
  ke diye function ko call kar deta hai. `disabled?` — `?` ka matlab ye prop **optional**
  hai (dena zaroori nahi).
- `value` — Textbox ka current text (**"controlled input"** pattern — React state hi
  textbox ki value control karta hai, HTML khud apni state nahi rakhta).
- `hasText` — Ek derived boolean: text khaali nahi hai (trim karke — sirf spaces wala
  text bhi "khaali" mana jaata hai).

```tsx
useEffect(() => {
  if (textareaRef.current) {
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
  }
}, [value]);
```
Ye **"auto-growing textarea"** ka trick hai. Jab bhi `value` badle (user type kare):
1. Height ko `'auto'` kar do (taaki purani height ka effect na rahe)
2. `scrollHeight` — browser batata hai text ko poora dikhane ke liye kitni height
   chahiye. Us height ko naye se set karo, lekin **120px se zyada nahi** (`Math.min`) —
   isse textbox 3-4 lines ke baad scroll karne lagta hai, infinite badhta nahi.

```tsx
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
```
- `handleSubmit` — Agar text khaali hai ya component `disabled` hai (jab AI already
  type/build kar raha ho), kuch mat karo. Warna parent ka `onSend` call karo, textbox
  khaali kar do.
- `handleKeyDown` — Keyboard events sunta hai. Agar sirf **Enter** dabaya (Shift nahi),
  message send karo. Agar **Shift+Enter** dabaya, normal behavior hone do (naya line
  daalo — ChatGPT jaisa hi behavior). `e.preventDefault()` — browser ka default action
  rokta hai (jo warna textarea me ek naya-line daal deta Enter par).

Baaki JSX Tailwind classes se UI bana raha hai: rounded textbox, ek "Plus" button (file
attach ke liye — abhi functional nahi lagta, sirf UI hai), "Mic" button (voice input —
ye bhi abhi sirf UI), aur "Send" (`ArrowUp`) button jo `hasText && !disabled` hone par hi
active (colored) dikhta hai, warna disabled/grey rehta hai.

---

## 3.2 `artifacts/voxai/src/components/ChatView.tsx` (312 lines) — Messages + Build Progress dikhaane wala panel

Is file me **4 chhote helper components** hain jo `ChatView` (main export) use karta hai.
Chalo ek-ek karke dekhte hain.

### Build/Edit pipeline ke labels (lines 7-27)

```tsx
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

const EDIT_STEPS = [
  { label: 'Intent Detector',  colors: 'from-violet-500 to-purple-600' },
  { label: 'File Resolver',    colors: 'from-blue-500 to-cyan-500' },
  { label: 'Patch Generator',  colors: 'from-orange-500 to-amber-400' },
  { label: 'Quality Gate',     colors: 'from-emerald-500 to-teal-500' },
  { label: 'Merge Engine',     colors: 'from-indigo-500 to-blue-600' },
];
```
Ye do arrays sirf **UI-display ke labels** hain — backend actually 25+ internal steps
chalata hai (jaise memory-notes me dekha: QAArchitect, DevOpsArchitect, RuntimeIntelligence,
etc.), lekin user ko confuse na karne ke liye frontend sirf **10 simplified naam**
(naye build ke liye) ya **5 naam** (edit ke liye) dikhata hai. `buildStep` (jo
`useAppStore` se aata hai, ek number 0-9) batata hai abhi kaunsa step highlight karna hai.
`colors` — Tailwind gradient classes, har step ka apna alag color-theme.

### `AgentIcon` — Chhota status-icon (lines 29-54)

```tsx
function AgentIcon({ isActive, isDone, colors }: { isActive: boolean; isDone: boolean; colors: string }) {
  if (isDone) {
    return ( /* green checkmark circle, gradient background */ );
  }
  if (isActive) {
    return ( /* spinning loader circle, gradient background */ );
  }
  return ( /* grey empty circle — "abhi tak nahi pahuncha" */ );
}
```
Ek chhota **presentational component** — sirf 3 props leta hai (`isActive`, `isDone`,
`colors`) aur unke hisaab se ek chhota circle icon banata hai: **done** (✓ checkmark),
**active** (spinning loader — CSS class `animate-spin`), ya **pending** (khaali grey
dot). Aisa component jo sirf UI dikhata hai, koi apna state/logic nahi rakhta, use
**"presentational" ya "dumb" component** kehte hain.

### `AgentPipeline` — Poora progress-card (lines 56-110)

```tsx
function AgentPipeline({ buildStep, isEditMode }: { buildStep: number; isEditMode: boolean }) {
  if (buildStep < 0) return null;

  if (isEditMode) {
    const steps = EDIT_STEPS;
    const activeStep = buildStep <= 4 ? buildStep : 4;
    const isDone = buildStep >= 9;
    return ( /* card with EDIT_STEPS list, checkmarks/spinner based on activeStep */ );
  }

  return ( /* card with BUILD_STEPS list, checkmarks/spinner based on buildStep */ );
}
```
- `buildStep < 0` — Matlab koi build/edit chal hi nahi raha, kuch mat dikhao
  (`return null` — React me ye valid hai, "kuch bhi render mat karo").
- Edit-mode me: `buildStep` backend se 0-9 tak aa sakta hai, lekin UI me sirf 5 edit-steps
  hain, isliye `Math.min`-jaisa clamp: `buildStep <= 4 ? buildStep : 4` (5 se zyada hua
  to 5th step par hi "active" dikhao, jab tak `isDone` na ho jaaye).
- `.map(({ label, colors }, i) => ...)` — Har step ke liye ek row banao. `stepDone`
  (pichhle steps ya sab-done), `stepActive` (current step), baaki grey/dim.

### `EditDiffPanel` — Edit ke baad "kya-kya file badli" dikhane wala card (lines 112-149)

```tsx
function EditDiffPanel({ diff }: { diff: EditDiff }) {
  const total = diff.changedFiles.length + diff.createdFiles.length + diff.deletedFiles.length;
  if (total === 0) return null;
  return (
    /* changed files: "~" yellow, created: "+" green, deleted: "−" red-strikethrough */
  );
}
```
Jab koi edit request complete ho, backend batata hai konsi files **change** hui, konsi
**nayi bani**, konsi **delete** hui (`EditDiff` type). Ye card unhe git-diff jaisi style
me dikhata hai (`~ filename.tsx`, `+ newfile.tsx`, `− oldfile.tsx`) — taaki user ko pata
chale sirf zaroori files hi touch hui, bina wajah poora project rewrite nahi hua.

### `parsePlanItems` aur `PlanChecklist` — AI ke text-reply se "plan" nikaal ke checklist dikhana (lines 151-210)

```tsx
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
```
Ye ek **text-parsing function** hai — AI jo streaming text bhejta hai usme kahin
`"✅ Plan"` heading hoti hai, uske neeche bullet points (`•`, `-`, `*` se shuru hone
wali lines) hote hain jo "plan items" hain. Ye function:
1. Poore text ko lines me todta hai (`.split('\n')`)
2. Jab tak `"✅ Plan"` line na mile, kuch mat karo
3. Uske baad wali lines me se bullet-points nikaalo, jab tak agla section-heading
   (`📋`/`📄`/`⚙️` emoji se shuru, ya `---` divider) na aa jaaye
4. **`/^[📋📄⚙️]/.test(trimmed)`** — Ye **regular expression (regex)** hai — ek pattern-
   matching syntax. `^[📋📄⚙️]` ka matlab "line ki shuruaat me in teen emoji me se koi ek
   ho". `.test(...)` check karta hai match hua ya nahi.
5. `trimmed.replace(/^[•\-\*]\s*/, '')` — Line ke shuru se bullet-marker aur uske baad
   ka space hata do, sirf actual text bacha lo.

`PlanChecklist` is parsed list ko ek visual checklist me render karta hai — "purane"
items par green checkmark (already generated, "done" maan liya jaata hai kyunki AI ne
unhe likh diya text me), sabse **last** item spinner/pending dikhata hai jab tak
`isComplete` na ho.

**Kyun ye approach?** — Backend structured JSON ki jagah kabhi-kabhi plain text me plan
bhejta hai (jaise `"✅ Plan\n• Homepage\n• Pricing page\n..."`). Frontend ko usse **UI-
friendly checklist** banana hai, isliye ye halka-sa "text-scraping" logic likha gaya hai
— thoda fragile hai (agar AI ka text-format thoda badal jaaye to parsing fail ho sakti
hai), lekin kaam chala leta hai kyunki prompt me AI ko exact format follow karne ko kaha
jaata hai (backend prompt-engineering side par).

### Main `ChatView` component (lines 260-312)

```tsx
export default function ChatView({ messages, isTyping, streamingContent, chatError, buildStep, isEditMode, lastEditDiff }: ChatViewProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, [messages.length, isTyping, streamingContent, chatError, buildStep]);
```
- `endRef` — Ek invisible `<div>` (line 308: `<div ref={endRef} />`) jo hamesha list ke
  **bilkul aakhir** me rehta hai.
- Har baar jab naya message aaye, ya typing-status/streaming-text/error/buildStep badle,
  `endRef.current?.scrollIntoView({ behavior: 'smooth' })` call hota hai — matlab chat
  automatically **neeche scroll** ho jaata hai (jaise WhatsApp/ChatGPT me hota hai).
  `setTimeout(..., 50)` — 50 milliseconds ka chhota delay taaki naye DOM elements pehle
  render ho jaayein, uske baad scroll ho (warna scroll thoda "peeche" reh sakta tha).

```tsx
if (messages.length === 0 && !isTyping && !chatError && buildStep < 0) {
  return <div className="flex-1 bg-white dark:bg-[#181817] md:bg-[#181817]" />;
}
```
Agar bilkul kuch nahi hai dikhane ke liye (naya chat, koi message nahi, koi loading
nahi), sirf ek khaali background-colored div dikhao (poori list render karne se
performance/flash-of-content bachta hai).

```tsx
const lastAssistantIdx = [...messages].reverse().findIndex(m => m.role === 'assistant');
const lastAssistantId = lastAssistantIdx >= 0 ? messages[messages.length - 1 - lastAssistantIdx]?.id : null;
```
- `[...messages]` — **Spread operator** se messages array ki ek **copy** banayi (taaki
  `.reverse()` original array ko mutate na kare — React me states ko directly modify
  karna **mana** hai, hamesha naya array/object banao).
- `.reverse().findIndex(...)` — Ulta karke pehla assistant-message dhoondo (matlab
  original array me **last** assistant message). Ye thoda "clever" tareeka hai last-match
  dhoondhne ka jab JavaScript me seedha `findLastIndex` available na ho (purane
  environments me).
- Isse "last assistant message ke turant baad `EditDiffPanel` dikhao" wala logic possible
  hota hai (line 287-289).

```tsx
return (
  <div className="flex-1 overflow-y-auto px-4 py-6 ...">
    <div className="max-w-2xl mx-auto">
      {messages.map((msg, idx) => (
        <div key={msg.id}>
          <MessageBubble message={msg} />
          {!isTyping && lastEditDiff && msg.id === lastAssistantId && idx === messages.length - 1 && (
            <EditDiffPanel diff={lastEditDiff} />
          )}
        </div>
      ))}
      {isTyping && isEditMode && buildStep >= 0 && buildStep < 9 && <AgentPipeline buildStep={buildStep} isEditMode={true} />}
      {isTyping && !isEditMode && buildStep >= 0 && <AgentPipeline buildStep={buildStep} isEditMode={false} />}
      {isTyping && hasPlanItems && !isEditMode && <PlanChecklist content={streamingContent} isComplete={planIsComplete} />}
      {isTyping && !streamingContent && buildStep < 0 && <TypingIndicator />}
      {chatError && <ErrorBanner message={chatError} />}
      <div ref={endRef} />
    </div>
  </div>
);
```
- `.map((msg, idx) => ...)` — Har message ko `MessageBubble` me render karo. `key={msg.id}`
  — React ko **har list-item ka unique identity** chahiye hota hai taaki wo efficiently
  pata laga sake kaunsa item add/remove/reorder hua (isके bina React confuse ho sakta hai
  aur galat item update kar sakta hai — ye ek **common React rule** hai: list render
  karte waqt hamesha stable, unique `key` do, index kabhi mat do agar list reorder ho
  sakti ho).
- Neeche wali sari lines **conditional rendering** hain (`&&` operator ka trick —
  `condition && <Component />` ka matlab "agar condition true hai to Component render
  karo, warna kuch nahi" kyunki `false && anything` JavaScript me `false` deta hai aur
  React `false`/`null`/`undefined` ko kuch render nahi karta):
  - Typing ho raha hai + edit-mode + step abhi 9 se kam → `AgentPipeline` (edit wala)
  - Typing ho raha hai + naya build-mode → `AgentPipeline` (build wala)
  - Typing ho raha hai + AI ke text me plan-items mile + build-mode → `PlanChecklist`
  - Typing ho raha hai lekin abhi tak koi text/step nahi aaya → simple 3-dot
    `TypingIndicator`
  - Koi error hai → `ErrorBanner`

**Summary Part 3:** `MessageInput` sirf ek controlled-textbox hai jo `onSend` call karta
hai. `ChatView` messages ki list dikhata hai, aur jab build/edit chal raha ho to ek
"live status card" (`AgentPipeline`) dikhata hai jo `buildStep` number ke hisaab se
progress-steps highlight karta hai — ye number seedha backend se SSE ke through aata hai
(jise hum backend-part me dekhenge).

---

---

# PART 4 — Backend Entry: `routes/agents.ts` aur `buildPipeline.ts`

Ab hum frontend chhod ke backend (`artifacts/api-server`) me chalte hain — ye Express.js
server hai jo saare AI-calls aur code-generation ka kaam karta hai.

**Naya concept: Backend kya hota hai?** Frontend (`voxai`) sirf UI dikhata hai —
browser me chalta hai, user dekh sakta hai. Backend (`api-server`) ek alag server hai
(Node.js par chalta hai, user seedha nahi dekh sakta) jo **heavy/secret kaam** karta hai:
AI models ko call karna (kyunki API-keys frontend me expose nahi kar sakte — koi bhi
browser dev-tools khol ke chura lega), database se baat karna, file-generation, etc.
Frontend `fetch('/api/agents/build', ...)` jaisi HTTP request bhejta hai, backend usse
process karke jawab deta hai.

## 4.1 `artifacts/api-server/src/routes/agents.ts` — HTTP Routes (563 lines)

File ke top comment me hi clearly likha hai iska design-principle:
> "This file is intentionally minimal. Each route: 1) Validates request 2) Sets SSE
> headers 3) Delegates to agent module 4) Closes response. All business logic lives
> elsewhere."

Ye ek **achi software-engineering practice** hai jise "**thin controller**" pattern
kehte hain — HTTP-handling layer ko simple rakho, asli logic alag files/modules me
rakho. Isse code **testable** aur **maintainable** rehta hai.

### Imports — ye file kis-kis module ko "jodti" hai (lines 17-56)

```ts
import { Router } from "express";
import { strToU8, zipSync } from "fflate";
import { orchestrateBuild } from "../orchestrator/orchestrator.js";
import { createBuildContext } from "../context/contextBuilder.js";
import { executeEdit } from "../agents/edit/editAgent.js";
import { executeAudit } from "../agents/audit/auditAgent.js";
import { executeRuntimeRepair } from "../runtime/runtimeRepairAgent.js";
import { callAI } from "../agents/llm/aiService.js";
import { validateFiles } from "../runtime/runtimeValidator.js";
import * as runtimeManager from "../runtime/runtimeManager.js";
import { buildRuntimeDependencyGraph, resolveImports, resolveComponents, resolveRoutes, resolvePackages } from "../runtime/dependencyResolverV2.js";
import { TEMPLATE_LIBRARY_SERVER, TEMPLATE_MATCH_KEYWORDS, serverMatchTemplate, buildTemplateContextServer } from "../agents/templates/templateAgent.js";
import { sse } from "../agents/streaming/sseManager.js";
import { checkBuildLimit, extractUserId, recordBuildStarted, recordBuildCompleted } from "../limits/userLimits.js";
import { checkTokenBudget } from "../cost/tokenBudget.js";
import { createLogger } from "../lib/structuredLogger.js";
```
- **`Router` (Express)** — Express.js ek popular Node.js web-framework hai. `Router()`
  se ek "mini-app" banate hain jisme routes (`GET`/`POST` URLs) define karte hain, phir
  ise main app me "mount" kar dete hain.
- `fflate` — Ek library jo ZIP files banata hai (project export/download feature ke
  liye — `/agents/export` route).
- Baaki imports alag-alag "specialist" modules hain — orchestrator (poora build-flow),
  edit agent, audit agent, runtime-repair agent, dependency-resolver, template-marketplace,
  user-limits (rate-limiting), token-budget (cost-control), logger.

```ts
const log = createLogger("AgentsRoute");
const router: Router = Router();
```
`createLogger("AgentsRoute")` — Ek "named" logger banaya, taaki jab bhi is file se koi
log-line print ho, wo `"AgentsRoute"` tag ke saath ho (debugging me pata chal jaaye log
kis file se aaya).

### Guard helpers — repeated safety-checks (lines 59-75)

```ts
function guardLimits(req, res): string | null {
  const userId = extractUserId(req);
  const limitCheck = checkBuildLimit(userId);
  if (!limitCheck.allowed) { res.status(429).json({ error: limitCheck.reason }); return null; }
  const budgetCheck = checkTokenBudget();
  if (!budgetCheck.allowed) { res.status(503).json({ error: budgetCheck.reason }); return null; }
  return userId;
}
```
Ye function har route me repeat hone wale 2 checks ko ek jagah rakhta hai:
1. **Rate-limit check** (`checkBuildLimit`) — Kya ye user aaj/is-ghante bahut zyaada
   builds already kar chuka hai? (Spam/abuse rokne ke liye.) Agar limit cross ho gaya,
   HTTP status **429** ("Too Many Requests") bhejo.
2. **Token-budget check** (`checkTokenBudget`) — Kya poore server ka AI-usage budget
   (paise/tokens) khatam ho gaya hai? Agar haan, **503** ("Service Unavailable") bhejo.

Agar dono pass ho jaayein, `userId` return karo. Agar koi fail ho, `null` return karta
hai — jo call karne wala route dekh ke turant `return` kar deta hai (kyunki response
already bheja jaa chuka hai — Express me ek request ka **sirf ek** response bhej sakte
ho, dobara bhejne se crash hota hai).

```ts
function openSse(res): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}
```
**SSE (Server-Sent Events)** — Ye ek web-standard hai jisse server, ek **single HTTP
connection ko khula rakh ke**, time-time par chhote-chhote "events" bhej sakta hai
(bina connection band kiye) — jaise ek "live news ticker". Isse hi "typing effect" aur
"build-progress steps" possible hote hain: server har step complete hone par ek event
bhejta hai, frontend use turant UI me dikha deta hai.
- `Content-Type: text/event-stream` — Browser ko batata hai "ye normal JSON response
  nahi hai, ye ek stream hai."
- `Cache-Control: no-cache` — Browser/proxy ise cache na kare.
- `Connection: keep-alive` — Connection band mat karo, khula rakho.
- `res.flushHeaders()` — Headers turant bhej do (data se pehle), taaki client turant
  samajh jaaye stream shuru ho gaya.

### `POST /agents/build` — Naya website generate karne ka main endpoint (lines 79-104)

```ts
router.post("/agents/build", async (req, res) => {
  const openrouterKey = process.env["OPENROUTER_API_KEY"];
  if (!openrouterKey) { res.status(500).json({ error: "OPENROUTER_API_KEY not set" }); return; }

  const { prompt, chatId: reqChatId } = req.body as { prompt: string; chatId?: string };
  if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }

  const userId = extractUserId(req);
  const limitCheck = checkBuildLimit(userId);
  if (!limitCheck.allowed) { res.status(429).json({ error: limitCheck.reason }); return; }
  const budgetCheck = checkTokenBudget();
  if (!budgetCheck.allowed) { res.status(503).json({ error: budgetCheck.reason }); return; }

  const chatId = reqChatId ?? `build-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ctx = createBuildContext({ prompt, chatId, userId, keys: { openrouterKey, groqKey: "" } });

  recordBuildStarted(userId);
  openSse(res);

  try {
    await orchestrateBuild(ctx, res);
  } finally {
    recordBuildCompleted(userId);
    res.end();
  }
});
```
**Yehi wo route hai jo tumhare `OPENROUTER_API_KEY` na hone ki wajah se abhi 500 error
deta hai** — pehli hi line check karti hai ki key hai ya nahi (jaisa maine pehle bataya
tha, is secret ke bina koi bhi build nahi ban sakta).

Line-by-line:
1. Key check — agar `OPENROUTER_API_KEY` environment-variable set nahi hai, turant error.
2. `req.body` se `prompt` (user ka message, jaise "ek bakery ki website banao") aur
   optional `chatId` nikalo. `as { prompt: string; chatId?: string }` — TypeScript ko
   batate hain request-body ka expected "shape".
3. Prompt khaali ho to `400` ("Bad Request").
4. Rate-limit aur budget check (jo `guardLimits` bhi karta, yahan manually inline likha
   hai — thoda duplicate code hai, lekin functionally same).
5. `chatId` na diya ho to naya random ID banao: `build-${timestamp}-${random-chars}`.
6. **`createBuildContext(...)`** — Ek "context object" banata hai jisme prompt, chatId,
   userId, aur API-keys sab ikattha hote hain — ye object aage poori pipeline me pass
   hota rehta hai (isse baar-baar wahi parameters alag-alag functions me pass nahi karne
   padte).
7. `recordBuildStarted(userId)` — Analytics/rate-limit counter badhao.
8. `openSse(res)` — SSE stream khol do.
9. **`await orchestrateBuild(ctx, res)`** — Yahi asli kaam hai! Ye function (dusri file
   me) poori 25-step AI pipeline chalata hai aur seedha `res` (response) me events likhta
   rehta hai jab tak build complete na ho.
10. `finally { recordBuildCompleted(userId); res.end(); }` — **`try/finally`** ka matlab:
    chahe pipeline safal ho ya error aaye, ye block **hamesha** chalega — counter update
    karo aur connection band karo (`res.end()`).

### Baaki routes (summary, in-depth nahi kar rahe kyunki pattern same hai)

- **`POST /agents/audit`** — Ek prompt lekar sirf ek quality-report deta hai (bina
  poora website banaye) — normal JSON response, SSE nahi.
- **`POST /agents/export`** — Frontend se project-files lekar unhe ek **ZIP file** me
  bandh ke download karwata hai (`fflate` library se). `zipData[key] = strToU8(content)`
  — string ko binary format (`Uint8Array`) me convert karke zip me daalta hai.
- **`POST /agents/edit`** — Existing project me changes karne ka route — same guard-
  pattern, phir `executeEdit(...)` ko delegate.
- **`POST /agents/runtime-repair`** — Agar generated website me runtime-error aaye
  (browser me crash ho), ye route AI se sirf us specific error ko fix karwata hai.
  Interesting check: `if (repairAttempt >= 3) { ...max attempts reached...}` — infinite
  repair-loops se bachne ke liye ek **hard cap** (max 3 tries).
- **`GET /agents/repair-history/:chatId`** — Kisi chat ki repair-history/metrics nikalta
  hai (`runtimeManager` in-memory store se).
- **Template routes** (`/agents/templates`, `/match`, `/preview`, `/merge`) — Ek
  "template marketplace" feature: pre-made project-templates ki list, prompt ke hisaab
  se best-match template dhoondhna, do templates ko "merge" karna (weighted-average se
  DNA-percentage nikalna) — ye Part 2 me dekhe `TEMPLATE_LIBRARY`/`templateMarketplace`
  se connect hota hai frontend side par.
- **`POST /agents/autonomous-build`** (lines 356-556) — Ye wahi endpoint hai jo
  `useAppStore.ts` ke `handleDone` me build complete hone ke baad **background me**
  automatically call hota hai (V6.2 Autonomous Runtime Builder — memory-notes me tha).
  Iske 10 phases hain, sabko SSE events se report kiya jaata hai:
  1. **Dependency Intelligence** — Files ke beech imports/dependencies ka graph banao
  2. **Import Resolver** — Missing imports auto-detect/inject karo
  3. **Component Resolver** — Kya sab referenced components exist karte hain?
  4. **Route Resolver** — Kya sab routes sahi hain?
  5. **Package Resolver** — Kya sab npm-packages `package.json` me hain?
  6. **Runtime Sandbox** — Static validation chalao (syntax/JSX errors dhoondo)
  7. **Autonomous Build Loop** (max 5 passes) — Jab tak health-score ≥95 na ho ya
     failures khatam na ho jaayein, failing files ko AI se **repair** karwate raho
     (`callAI(...)` — ek chhota, targeted prompt: "sirf ye issues fix karo, poori file
     wapas do")
  8. **Runtime Health V3** — Final health-score calculate karo (kai factors ka weighted
     average)
  9. **Runtime Timeline** — Poore process ka ek "timeline" record banao (audit-trail)
  10. **Preview Gate** — Agar health ≥90 nahi hai, ek aakhri "critical repair" try karo
      un files par jo abhi bhi fail ho rahi hain, phir gate pass/fail decide karo

  Ye poora "self-healing" system hai — matlab AI khud apni banayi hui galtiyaan pakad ke
  khud hi theek karne ki koshish karta hai, bina user ko dobara prompt likhna pade.

**`sseAB((data) => res.write(\`data: ${JSON.stringify(data)}\\n\\n\`))`** — Ye SSE ka
raw format hai: har event `"data: "` se shuru hoke `\n\n` (do newlines) se khatam hota
hai. Frontend (jaisa humne `useAppStore.ts` me dekha) isi format ko `split('\n\n')` se
wapas todta hai.

---

## 4.2 `artifacts/api-server/src/agents/pipeline/buildPipeline.ts` (460 lines) — Poori AI pipeline ka "conductor"

Ye file, `orchestrateBuild` ke andar se call hoke, **poori 25-step generation pipeline**
chalati hai. File ke top comment me pura naksha diya hai:

```
0    ProductManager         — static product strategy
0.5  FrontendArchitect      — static frontend blueprint
0.6  BackendArchitect       — static backend blueprint (+ security)
0.7  DevOpsArchitect        — static devops blueprint
0.8  QAArchitect            — static QA/reliability blueprint
0.9  RuntimeIntelligence    — generation strategy brain (no LLM)
0.92 Orchestrator           — adaptive execution planning (no LLM)
0.95 ModelOrchestrator      — model/resource routing (no LLM)
0.97 KnowledgeEngine        — knowledge intelligence (no LLM)
0.99 ReasoningEngine        — reasoning/decision brain (no LLM)
1    Planner                — intent analysis, blueprint, DNA composition
2    Architecture           — project blueprint, tech stack
3    ComponentTree          — full page tree (deterministic, inline)
4    Frontend               — React/Tailwind code generation
5    CandidateSelection     — A/B/C candidates, evaluator picks best
6    Repair                 — code-fix / quality gate
7    DesignEvaluator        — 15-dimension quality scoring
8    DesignCritic           — senior-designer review + repair
9    ConversionIntelligence — CRO (conversion-rate) analysis + repair
10   Accessibility          — WCAG 2.1 AA evaluation + repair
11   Optimization           — bundle + render efficiency
12   Backend (Scaffold)     — API routes, DB schema, auth files
13   RuntimeValidation      — real npm install + Vite build + self-healing
```

**Naya concept: "no LLM" wale steps kya hote hain?** Har step AI (LLM = Large Language
Model) ko call nahi karta. Kai steps (`ProductManager` se le kar `ReasoningEngine` tak,
aur `ComponentTree`) sirf **JavaScript ka deterministic logic** chalate hain — rules,
scoring-formulas, static templates — bina kisi AI-API-call ke. Ye 2 wajah se accha hai:
1. **Fast** — AI call me seconds lagte hain, plain code me milliseconds
2. **Free** — koi token/cost nahi lagta
3. **Predictable** — same input par hamesha same output (AI thoda random/unpredictable
   ho sakta hai)

Jo steps waaki bacha ke rakhte hain AI-calls ke liye — jaise `Planner`, `Frontend`,
`Repair`, `DesignCritic` — wahi asli "creative" kaam karte hain jaha AI ki zaroorat
padti hai (jaise poori website ka React code likhna).

### `runBuildPipeline` function ka structure

```ts
export async function runBuildPipeline(input: BuildPipelineInput, res: Response): Promise<void> {
  const { prompt, chatId, keys } = input;
  const buildId = chatId;

  const trace = withBuildId(createTraceContext({ requestId: chatId }), buildId);
  setLogContext({ traceId: trace.traceId, requestId: trace.requestId, buildId });
  recordBuildStart(buildId, trace, prompt);

  try {
    // ... 20+ steps, ek ke baad ek, `await` se ...
  } catch (err) {
    const e = err as Error;
    recordBuildFailure(buildId, e?.message);
    throw err;
  } finally {
    clearLogContext();
  }
}
```
- **`createTraceContext` / `withBuildId` / `setLogContext`** — Ye **"observability"**
  (system ko monitor karne) ka setup hai. Har build ko ek unique "trace ID" milta hai,
  jo saare logs me attach ho jaata hai — isse agar kabhi debug karna pade "is specific
  build me kya hua", saare related logs ek saath dhoondh sakte ho.
- **`try { ... } catch { ... } finally { ... }`** — Poori pipeline ek bade try-block me
  hai. Agar kahin bhi koi step fail ho (`throw` kare), turant `catch` me chala jaata hai
  — jaha failure record hoti hai aur error **dobara throw** ki jaati hai (`throw err`) —
  taaki caller (yani `orchestrateBuild`/route) ko bhi pata chale aur wo user ko error
  dikha sake. `finally` hamesha chalta hai — log-context clear karna, chahe success ho
  ya fail.

### Har step ka common pattern

```ts
const productManagerOutput = await withAgentMetrics("ProductManager", () =>
  runProductManagerStep(prompt, buildId, res),
);
```
- **`withAgentMetrics(name, fn)`** — Ek "wrapper" function jo `fn()` ko chalata hai aur
  saath-saath uska **time kitna laga, kya result mila, koi error aaya** — sab measure
  karke telemetry (monitoring-system) me record karta hai. Isse baad me pata chal sakta
  hai "Frontend step average kitna time leta hai", "kaunsa step sabse zyada fail hota
  hai", etc. Ye ek **"decorator" / "higher-order function" pattern** hai — ek function
  jo doosre function ko "wrap" karke usme extra behavior (yahan: metrics) jod deta hai.
- Har step **agle step ka input** banata hai — jaise ek factory ki assembly-line. Isliye
  sequence important hai: `Architecture` ko `plan` chahiye (Planner ka output),
  `Frontend` ko `architecture` chahiye, etc.

### "Skip-gating" — Orchestrator kuch steps ko skip kar sakta hai (line 150 onwards)

```ts
const executionBlueprint = await runOrchestratorStep(buildId, res, runtimeIntelligenceOutput);
const skipped = new Set(executionBlueprint.skippedAgents);
...
const uxFrontend = skipped.has("UXIntelligence")
  ? repairedFrontend
  : await withAgentMetrics("UXIntelligence", () => runUXIntelligenceStep(repairedFrontend, buildId, res));
```
Step 0.92 (`Orchestrator`) decide karta hai — prompt ki complexity dekh ke — ki kaunse
"enrichment" steps (jaise `UXIntelligence`, `DesignCritic`, `ConversionIntelligence`,
`Accessibility`, `Optimization`, `DesignDirector`) **zaroori hain aur kaunse skip kiye jaa
sakte hain**. Agar user ne ek bahut simple website maangi hai (jaise "ek page ka landing
page"), to shayad `Accessibility` ka poora deep-analysis step overkill ho — usse skip
karke time/cost bachaya jaata hai. `Set` (JavaScript data-structure) me skip-list rakhi
hai, `.has(name)` se fast check hota hai.

Har skip ke saath ye **ternary pattern** hai: `condition ? valueIfTrue : valueIfFalse`
— agar step skip hua hai to previous step ka output hi seedha aage bhej do
("pass-through"), warna step ko chalao.

### Component Tree — deterministic step (lines 202-210)

```ts
const componentTree = buildComponentTree({ plan, architecture, buildId: chatId });
const treeValidation = validateTree(componentTree);
recordTreeBuild(componentTree, treeValidation.score, treeValidation.errors.length, treeValidation.warnings.length);
```
Ye **`await` nahi hai** — kyunki `buildComponentTree` ek plain synchronous function hai
(no LLM call, jaisa upar bataya). Ye page ka poora **component-hierarchy** decide karta
hai (jaise: Navbar → Hero → Features → Pricing → Footer, kaunsa component kaunse
"catalog" se aayega) — is tree ke hisaab se hi Step 4 (`Frontend`) actual code likhta
hai.

### Multi-candidate generation aur repair (lines 217-226)

```ts
const { winner } = await withAgentMetrics("CandidateSelection", () =>
  runCandidateSelectionStep(frontend, prompt, keys, res, buildId, runtimeIntelligenceOutput.blueprint),
);
const repairedFrontend = await withAgentMetrics("Repair", () =>
  runRepairStep(winner, keys, res, runtimeIntelligenceOutput.blueprint),
);
```
Memory-notes ke hisaab se (V7.2.0): AI **3 alag versions** (A/B/C) generate karta hai
website ke, phir ek "evaluator" (Step 7 ka precursor) unme se **best wala chunta hai**
(`winner`) — jaise 3 designers se kaam karwa ke best design choose karna. Fir us winner
ko `Repair` step me bheja jaata hai jaha syntax-errors/bugs fix hote hain.

### Final "done" event — poora result frontend ko bhejna (lines 343-396)

```ts
sse(res, {
  type: "done",
  code: directedFrontend.fixedCode,
  plan: cleanPlan,
  blueprint,
  files: runtimeResult.allFiles,
  dnaComposition, sectionOwnership: dnaOwnership, themeTokens: dnaTheme, motionProfile: dnaMotion,
  knowledgeGraph: backend.knowledgeGraph,
  accessibilityScore: accessibilityScore81, optimizationScore: optimizationScore81,
  directorScore: directorScore83,
  productPlan: productManagerOutput.productPlan, productScore: productManagerOutput.productScore,
  architectureBlueprint: frontendArchitectOutput.blueprint, architectureScore: frontendArchitectOutput.overallScore,
  backendBlueprint: backendArchitectOutput.blueprint, backendArchitectureScore: backendArchitectOutput.overallScore,
  devopsBlueprint: devopsArchitectOutput.blueprint, devopsArchitectureScore: devopsArchitectOutput.overallScore,
  qaBlueprint: qaArchitectOutput.blueprint, qaArchitectureScore: qaArchitectOutput.overallScore,
  securityBlueprint: backendArchitectOutput.blueprint.securityIntelligence, ...
  runtimeBlueprint: runtimeIntelligenceOutput.blueprint, runtimeScore: runtimeIntelligenceOutput.overallScore,
  executionBlueprint, orchestratorComplexity: executionBlueprint.complexity, orchestratorSkippedAgents: executionBlueprint.skippedAgents,
  modelBlueprint, modelOrchestratorBudget: modelBlueprint.totalTokenBudget, ...
  knowledgeBundleTargets: Object.keys(knowledgeStepOutput.bundles),
  reasoningBlueprint: reasoningStepOutput.blueprint, ...
});
```
Jab **saare 20+ steps** complete ho jaayein, ek aakhri **`"done"` type ka SSE event**
bheja jaata hai jisme **har step ka output** ikattha hota hai — final code, files,
design-DNA, aur har architecture-planner (product/frontend/backend/devops/QA/security/
runtime/orchestrator/model/knowledge/reasoning) ka blueprint aur score. Frontend
(`useAppStore.ts` ka `mockStreamResponse`/`mockEditResponse` — jo hum agle part me
dekhenge) is event ko sunkar `handleDone(...)` call karta hai jo humne Part 2 me dekha
tha.

### Fire-and-forget learning (lines 398-452)

```ts
finalizeOrchestratorExecution(res, executionBlueprint, evalRes?.overallScore ?? directorScore83, Date.now() - pipelineStart);
finalizeModelOrchestratorExecution(res, modelBlueprint, ...);
finalizeKnowledgeEngineExecution(res, buildId, ...);
finalizeReasoningEngineExecution(res, buildId, reasoningStepOutput.blueprint, ...);

setImmediate(() => {
  try {
    learnFromBuild({ dnaId: primaryBrand81, evaluatorScore: ..., accessibilityScore: ..., ... , success: true });
  } catch { /* DNA learning must never throw into the pipeline */ }
});
```
Ye response bhej dene ke **baad** chalte hain — inka result user ko turant nahi chahiye,
ye sirf system ko "seekhne" ke liye hain (kaunse design-patterns achhe score karte hain,
future builds me unhe zyaada use karo). **`setImmediate(fn)`** — Node.js ka ek function
jo `fn` ko "jitni jaldi ho sake, lekin abhi chal rahe code ke baad" chalata hai — taaki
ye learning-logic user ke response ko **delay na kare** (fire-and-forget pattern). Andar
`try/catch` bhi laga hai taaki agar learning-code me koi bug ho, to bhi poori pipeline
crash na ho — comment khud kehta hai *"must never throw into the pipeline"*.

**Summary Part 4:** `routes/agents.ts` HTTP requests leta hai, safety-checks karta hai,
SSE stream khol ke `buildPipeline.ts` (ya edit/audit/repair agents) ko kaam de deta hai.
`buildPipeline.ts` 20+ steps ko **ek fixed sequence me chalata hai**, kuch steps
LLM-based hain (creative kaam), kuch "no-LLM" static-logic hain (planning/scoring/
routing), aur beech-beech me Orchestrator decide karta hai kaunse "extra polish" steps
zaroori hain is specific project ke liye. Aakhir me sab kuch ek `"done"` SSE event me
frontend ko bhej diya jaata hai.

---

---

# PART 5 — Teen sabse important pipeline-steps: Planner, Frontend, Design Evaluator

Ab hum Part 4 me dekhe `buildPipeline.ts` ke teen sabse "meaty" (heavyweight) steps ke
andar jhaankte hain — ye teeno hi asli "AI ka kaam" hai.

## 5.1 `plannerStep.ts` (182 lines) — Step 1: User ka prompt samajh ke "plan" banana

Iska kaam: user ne jo bhi likha (jaise "ek coffee shop ki website banao, Stripe jaisa
design chahiye"), usse ek **structured plan** me convert karna — kaunse sections
chahiye, kaunse design-references use karne hain, kaunse brands ka "DNA" mix karna hai.

```ts
export async function runPlannerStep(prompt: string, keys: PipelineKeys, res: Response): Promise<PlannerOutput> {
  const { openrouterKey } = keys;
  sse(res, { type: "step", step: 0, agent: "Planner Agent", status: "active" });

  const dnaHints = buildDNAOptimizationHints();
  const enrichedPrompt = dnaHints ? `${prompt}\n\n${dnaHints}` : prompt;

  let planText = "";
  await callAI(
    openrouterKey,
    [{ role: "system", content: PLANNER_SYSTEM }, { role: "user", content: enrichedPrompt }],
    { label: "planner", maxTokens: 1800, stream: true, onToken: (token) => {
        planText += token;
        if (!planText.includes("---DESIGN_BRIEF---")) sse(res, { type: "token", token });
      },
    }
  );
```
- **`sse(res, { type: "step", step: 0, agent: "Planner Agent", status: "active" })`** —
  Yehi wo event hai jo frontend ke `ChatView.tsx` me `AgentPipeline` component dekhta hai
  aur "Planner Agent" ko spinning-icon ke saath highlight karta hai (Part 3 yaad karo —
  `BUILD_STEPS[0] = 'Planner Agent'`).
- **`callAI(key, messages, options)`** — Ye function (`aiService.ts` me define, memory-
  notes ke "Unified AI Service" ke hisaab se) OpenRouter ko HTTP call karta hai —
  `messages` ek array hai jisme **"system" message** (AI ko instructions: "tum ek
  website-planner ho, is format me jawab do") aur **"user" message** (actual prompt)
  hota hai. Ye **"chat completion" API** ka standard format hai jo saare bade LLMs
  (GPT, Claude, Gemini, etc.) use karte hain.
- `PLANNER_SYSTEM` — Ek bahut lamba text (`prompts.ts` file me) jo AI ko sikhata hai
  **exactly kis format me plan likhna hai** — jaise `"---DESIGN_BRIEF---"` aur
  `"---PAGE_BLUEPRINT---"` jaisi special markers use karne ko kaha jaata hai (taaki
  baad me code se easily parse ho sake).
- `stream: true, onToken: (token) => { planText += token; ... }` — Jaisa Part 4 me
  bataya, AI ka jawab **token-by-token** (chhote text-pieces) streaming me aata hai.
  Har token `planText` string me jodte jaate hain, aur agar abhi tak `"---DESIGN_BRIEF---"`
  marker nahi aaya, to wo token frontend ko bhi bhej dete hain (`sse(res, {type: "token"...})`)
  — isse user ko real-time me AI ka "plan text" type hota dikhta hai. Lekin **DESIGN_BRIEF
  ke baad ka hissa user ko nahi dikhaya jaata** (wo internal data hai, "raw JSON/config"
  jaisa, user-friendly nahi).

### AI ke text-jawab se data "nikaalna" (parsing) — lines 48-89

```ts
let briefText = "";
const briefMatch = planText.match(/---DESIGN_BRIEF---([\s\S]*?)---END_BRIEF---/);
if (briefMatch) briefText = briefMatch[1].trim();
```
- **`.match(regex)`** — String method jo regex-pattern dhoondta hai. `[\s\S]*?` — "koi
  bhi character (whitespace ya non-whitespace), jitne kam ho utna better (`*?` = non-
  greedy)". Poora pattern: "`---DESIGN_BRIEF---` se `---END_BRIEF---` ke beech jo bhi ho,
  wo `group 1` me capture karo." Ye ek common technique hai jab AI ka jawab **plain text
  hai lekin usme structured sections hain** — inhe custom delimiters se "carve out" kiya
  jaata hai.

```ts
let referenceSites = "none";
const refMatch = briefText.match(/referenceSites:\s*(.+)/);
if (refMatch) referenceSites = refMatch[1].trim();

let primaryReference = "none";
const primaryRefMatch = briefText.match(/primaryReference:\s*(.+)/);
if (primaryRefMatch) primaryReference = primaryRefMatch[1].trim();
if (primaryReference === "none" && referenceSites !== "none") {
  primaryReference = referenceSites.split(',')[0].trim();
}
```
Brief ke andar se `referenceSites: stripe, linear` jaisi lines dhoondi ja rahi hain
(regex `referenceSites:\s*(.+)` — "referenceSites: ke baad jo bhi text ho, capture
karo"). Agar AI ne `primaryReference` explicitly nahi diya, to `referenceSites` list ka
**pehla naam** hi primary maan liya jaata hai (fallback logic).

```ts
let blueprint: PageBlueprint = { websiteType: "Generic", sectionOrder: [...] };
const blueprintMatch = planText.match(/---PAGE_BLUEPRINT---([\s\S]*?)---END_BLUEPRINT---/);
if (blueprintMatch) {
  try {
    const raw = blueprintMatch[1].trim();
    const parsed = JSON.parse(raw);
    if (parsed.sectionOrder && Array.isArray(parsed.sectionOrder) && parsed.sectionOrder.length >= 3) {
      blueprint = parsed as PageBlueprint;
    }
  } catch (e) {
    log.error("BLUEPRINT_PARSE_FAILED", { error: String(e) });
  }
}
```
`PAGE_BLUEPRINT` section me AI **asli JSON** deta hai (na ki `key: value` text-lines
jaisa upar wala). `JSON.parse(raw)` se ise object me convert karte hain. Notice:
`try/catch` — agar AI ne invalid JSON de diya (LLMs kabhi-kabhi galti karte hain), crash
hone ke bajaye **default blueprint** (`websiteType: "Generic"`, generic 6 sections) use
ho jaata hai — ye **graceful degradation** ka example hai: AI-output par 100% bharosa
mat karo, hamesha ek safe fallback rakho. Extra safety-check: `parsed.sectionOrder.length
>= 3` — agar AI ne bahut kam sections diye (jaise sirf 1), wo bhi reject karke default
use karte hain.

### DNA Composition — "Design ka mix" (lines 95-122)

```ts
let dnaComposition = { ...EMPTY_DNA };
try {
  dnaComposition = await extractDNAComposition(prompt, referenceSites, primaryReference, secondaryReferences, openrouterKey);
  const activeBrands = DNA_BRAND_KEYS.filter(k => dnaComposition[k] > 0);
  if (activeBrands.length > 0) {
    dnaOwnership = resolveSectionOwnershipServer(dnaComposition, sectionList);
    dnaTheme = generateThemeTokensServer(dnaComposition);
    dnaMotion = generateMotionProfileServer(dnaComposition);
    sse(res, { type: "dna_composition", composition: dnaComposition, sectionOwnership: dnaOwnership, themeTokens: dnaTheme, motionProfile: dnaMotion });
  }
} catch (e) { log.error("DNA_MIXER_FAILED", { error: String(e) }); }
```
**"DNA Composition" concept** (memory-notes ke V4.5 se) — Yaha idea ye hai ki agar user
"Stripe jaisa design, thoda Linear ka bhi touch chahiye" bole, to AI sirf ek brand copy
nahi karta — balki **percentages me mix** karta hai (jaise "Stripe: 70%, Linear: 30%").
`dnaComposition` object me har known-brand (`DNA_BRAND_KEYS` — stripe, linear, vercel,
notion, etc.) ka ek number (0-100) hota hai. `activeBrands` — jo brands 0% se zyaada
hain, unhi ko "active" mana jaata hai.
- `resolveSectionOwnershipServer` — Decide karta hai **kaunsa section kis brand ki
  style follow karega** (jaise Hero-section Stripe-style, Pricing-section Linear-style
  — isse ek hi website me multiple "flavors" mix ho sakte hain lekin har section
  consistent rahe).
- `generateThemeTokensServer` — Colors/fonts/spacing generate karta hai us DNA-mix ke
  hisaab se.
- `generateMotionProfileServer` — Animation-style decide karta hai (subtle vs expressive).

Ye sab `try/catch` ke andar hai — agar DNA-mixing fail ho jaaye (koi bug ya AI-error), to
`dnaComposition` khaali (`EMPTY_DNA`) hi reh jaata hai aur baaki pipeline **normally
chalti rehti hai** — ek optional "enhancement" feature hai, core-flow ko block nahi karta.

### Template matching aur Auth-state classification (lines 124-155)

```ts
const tplMatch = serverMatchTemplate(prompt);
sse(res, { type: "template_selected", templateId: tplMatch.templateId, ... });

const authClassification = classifyAuthState(prompt, dnaComposition as unknown as Record<string, number>);
recordAuthRouting(authClassification);
sse(res, { type: "auth_state_classified", authState: authClassification.authState, navbarVariant: authClassification.navbarVariant, ... });
```
- `serverMatchTemplate(prompt)` — Prompt ko dekh ke best-matching **pre-built template**
  dhoondta hai (jaise agar prompt me "SaaS dashboard" ho, to "SaaS Dashboard" template
  match hoga) — ye template baad me `Frontend` step ko context deta hai.
- **`classifyAuthState`** — Ek **classifier function** jo decide karta hai website
  "guest" (koi login nahi, sirf marketing page), "authenticated" (user login karke andar
  aata hai), "dashboard", ya "admin" type ki hai. Isi ke hisaab se Frontend-step
  navbar-type decide karta hai (Part 3-jaisi memory-note yaad karo — "auth-aware
  navigation"). `recordAuthRouting(...)` — telemetry me record karta hai, taaki baad me
  dekha jaa sake classifier kitna accurate hai.

### Return value (lines 157-181)
Function ke aakhir me ek **bada object** return hota hai jisme sab kuch hai jo aage ke
steps (`Architecture`, `Frontend`) ko chahiye: `cleanPlan` (user-facing plan text),
`blueprint` (sections list), `dnaComposition`+`dnaOwnership`+`dnaTheme`+`dnaMotion`
(design-mix data), `templateContext`, `authState`+`navbarVariant`. Ye pattern poore
pipeline me repeat hota hai: **har step apna output ek typed object me deta hai, jo agle
step ka input banta hai** — jaise ek assembly-line jaha har station product me kuch
jodta jaata hai.

---

## 5.2 `frontendStep.ts` (323 lines) — Step 3-4: Asli website ka code likhna

Ye woh step hai jaha **actual React/Tailwind code generate hota hai**. Isme khud 3 mini-
agents hain: **Design Agent** (visual DNA JSON), **Frontend Agent** (code likhna), **Code
Fix Agent** (bugs theek karna).

### Reference-site "verification" system (lines 24-52)

```ts
const REFERENCE_VERIFIERS: Record<string, (d: DesignDNA) => boolean> = {
  stripe: (d) => d.designLanguage === "premium-gradient" && d.heroStyle === "centered-gradient" && d.colorSystem.background !== "#0a0a0a",
  linear: (d) => d.designLanguage === "minimal-flat" && d.heroStyle === "editorial-large" && d.decorationLevel === "none",
  vercel: (d) => d.designLanguage === "monochrome" && d.heroStyle === "split-layout",
  ...
};
```
Ye ek **object jiski values functions hain** — JavaScript me functions "first-class
citizens" hote hain, matlab unhe variables/object-values ki tarah treat kar sakte ho.
Har key (`stripe`, `linear`, etc.) ek **validator function** hai: "agar Design-DNA object
diya jaaye, check karo ki uski properties Stripe/Linear/etc. ke expected style se match
karti hain ya nahi." Ye isliye zaroori hai kyunki **AI kabhi-kabhi "Stripe jaisa design
do" bolne ke bawajood generic/galat DNA generate kar deta hai** — ye code us mistake ko
**pakadta** hai.

```ts
function detectKnownRefs(refs: string): string[] {
  const lower = refs.toLowerCase();
  return Object.keys(REFERENCE_VERIFIERS).filter(r => lower.includes(r));
}

function verifyDNA(design: DesignDNA, refs: string): { passed: boolean; failedRefs: string[] } {
  const known = detectKnownRefs(refs);
  if (known.length === 0) return { passed: true, failedRefs: [] };
  const failedRefs = known.filter(r => !REFERENCE_VERIFIERS[r](design));
  return { passed: failedRefs.length === 0, failedRefs };
}
```
`detectKnownRefs` — User ke diye reference-string (`"stripe, linear"`) me se konse
brands humare `REFERENCE_VERIFIERS` list me hain, wo nikaalta hai. `verifyDNA` — un sab
brands ke liye unka validator-function chalata hai; jo bhi **fail** ho, unhe
`failedRefs` list me daal deta hai.

### `runDesignAgent` — Design DNA generate karna, retry-logic ke saath (lines 67-146)

```ts
const attempt1 = await runDesignAgent(openrouterKey, designPrompt);
if (attempt1.parsed) {
  const verify = verifyDNA(attempt1.parsed, referenceSites);
  if (verify.passed) {
    design = attempt1.parsed;
    designAgentStatus = "success";
  } else {
    sse(res, { type: "design_retry", reason: `DNA verification failed for: [${verify.failedRefs.join(", ")}]`, ... });
    const req = REFERENCE_DNA_REQUIREMENTS[primaryReference.toLowerCase()];
    const retryUserPrompt = req
      ? [`CRITICAL: ... You MUST output EXACTLY: designLanguage: "${req.designLanguage}" ...`, designPrompt].join('\n')
      : [`IMPORTANT: ... Apply its DNA EXACTLY.`, designPrompt].join('\n');
    const attempt2 = await runDesignAgent(openrouterKey, designPrompt, retryUserPrompt);
    ...
  }
} else {
  designAgentError = attempt1.error ?? "Design Agent returned unparseable output";
}
```
Ye **"self-correcting AI" pattern** hai:
1. Pehli baar AI se Design-DNA maango (`attempt1`).
2. Agar AI ka jawab parse hi nahi ho paya (invalid JSON), error record karo, default
   design use karo.
3. Agar parse ho gaya lekin `verifyDNA` fail ho gaya (jaise user ne "Stripe" maanga tha
   par AI ne kuch aur diya) — **dobara try karo**, is baar **zyaada strict/explicit
   instructions** ke saath (`REFERENCE_DNA_REQUIREMENTS` se exact values force karo:
   "designLanguage EXACTLY 'premium-gradient' hona chahiye").
4. Dusri attempt ka result chahe pass ho ya fail, wahi final use kar lete hain (aur aage
   nahi retry karte — cost/time ki wajah se sirf **1 retry** allowed hai).

Ye pattern isliye important hai kyunki LLMs **deterministic nahi hote** — ek hi prompt
do baar dene par thoda alag jawab aa sakta hai. Critical requirements (jaise "brand ka
naam match hona chahiye") ke liye **verify-then-retry** ek practical solution hai.

### Design Tokens, RAG (Retrieval), Motion context — "extra context AI ko dena" (lines 148-238)

```ts
tokenSet = resolveFromDNAComposition(dnaComposition, industryGuess, authRoleGuess);
tokenCtx = buildTokenCodegenContext(tokenSet);
```
`resolveFromDNAComposition` — DNA-mix aur website-ke-industry (health/ecommerce/fintech/
etc. — ek chhota inline function `wt.includes(...)` se guess kiya jaata hai) aur auth-role
(guest/admin/dashboard) ke hisaab se ek poora **design-token-set** (colors, radius,
shadows — memory-note V7.3.3 "8 themes") resolve karta hai. `buildTokenCodegenContext`
ise ek text-context me convert karta hai jo AI-prompt me diya jaayega (taaki AI CSS
variables use kare, hardcoded colors na likhe).

```ts
const selectedTemplates = selectTemplatesForPrompt(prompt, blueprint.sectionOrder, design, referenceSites, primaryReference);
const componentContext = buildContextFromTemplates(selectedTemplates);
```
`selectTemplatesForPrompt` — Component-registry (memory V7.1.2 shadcn-migration, V5.4
registry) se relevant **pre-written component-code-snippets** chunta hai (jaise agar
"pricing" section chahiye, to ek achha pricing-component-template dega) — isse AI ko
**example code** milta hai jisse copy/adapt kar sake, poora scratch se likhne ke bajaye.

```ts
retrievalCtx = buildSectionRetrievalContext(sectionResult); // Design RAG (V7.1.8/V7.2.2)
motionCtx = buildMotionContext(design.designLanguage, blueprint.sectionOrder); // Motion RAG (V7.2.9)
treeCtx = buildTreeContextString(tree); // Component Tree (V7.3.2)
```
**"RAG" (Retrieval-Augmented Generation)** — Ek AI-technique jaha, LLM ko seedha call
karne se pehle, ek **database/corpus se relevant examples "retrieve"** (dhoondh) karke
unhe prompt me shaamil kar dete hain — isse AI "better quality reference" dekh ke likhta
hai, bina apni training-data par hi bharosa kiye. Yaha 3 alag RAG-systems hain:
1. **Design RAG** — 100+ high-quality real section-designs ka corpus, jinme se
   sectionType/DNA-language ke hisaab se best-matches nikaale jaate hain
2. **Motion RAG** — Animation-patterns ka corpus (156 references, memory-note se)
3. **Component Tree context** — Poore page ka pehle-se-decided structure (Part 4 me
   dekha `buildComponentTree`) text-format me AI ko diya jaata hai taaki wo usi structure
   follow kare

### Auth-aware navbar instruction (lines 245-256)

```ts
const authNavbarInstruction = authState !== 'guest'
  ? `\n\nNAVBAR REQUIREMENT (auth-routing): Auth state detected as "${authState}". Use navbar variant "${navbarVariant}". This means:${
      authState === 'admin' ? ' Include <Command> palette (⌘K), <Avatar>+<DropdownMenu> ..., <Sheet> ...' :
      authState === 'dashboard' ? ' Include <Avatar>+<DropdownMenu> ..., <Sheet> ...' :
      ' Include <Avatar>+<DropdownMenu> for user profile menu ...'
    } Do NOT generate a plain marketing navbar ...`
  : '';
```
**Nested ternary** (`condition ? a : condition2 ? b : c`) — ek chhota decision-tree
JavaScript expression ke roop me. Agar auth-state `'admin'` hai, ek instruction; agar
`'dashboard'`, doosra; warna teesra generic wala. Ye poora text final AI-prompt me
inject hota hai — taaki jab bhi website "logged-in-user" jaisi ho, AI **sahi type ka
navbar** banaye, plain marketing-navbar nahi (jo galat lagta agar user pehle se login
hai).

### Asli code-generation call (lines 271-288)

```ts
const codegenSystemParts = [buildCodeSystem(design, blueprint, componentContext, projectBlueprint, registrySelection)];
if (retrievalCtx) codegenSystemParts.push(retrievalCtx);
if (motionCtx) codegenSystemParts.push(motionCtx);
if (treeCtx) codegenSystemParts.push(treeCtx);
if (tokenCtx) codegenSystemParts.push(tokenCtx);

generatedCode = await callAI(
  openrouterKey,
  [{ role: "system", content: codegenSystemParts.join('\n\n') }, { role: "user", content: codegenUserPrompt }],
  { label: "codegen", maxTokens: 8000, stream: true, onToken: (t) => sse(res, { type: "codegen_token", token: t }) }
);
```
Ye poore step ka **climax** hai. Notice **kitne saare context-pieces ek saath jode jaate
hain** system-message me: design-DNA-based-instructions + component-examples + RAG-
retrieved-section-references + motion-guidance + component-tree-structure + design-
tokens. Ye sab **ek hi bade prompt** me combine karke AI ko diya jaata hai — isliye AI
ka jawab (final website-code) itna context-aware/consistent hota hai. `maxTokens: 8000`
— sabse zyaada tokens is call ko diye gaye hain (kyunki poori website ka code likhna hai,
sabse bada output).

```ts
generatedCode = generatedCode.replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
```
**"Markdown-fence stripping"** — LLMs aksar apna code-jawab \`\`\`jsx ... \`\`\` jaisi
markdown-fences me wrap kar dete hain (jaise ChatGPT ka reply). Ye regex un fences ko
hata deta hai taaki sirf **plain code** bache (`^` = shuru se, `# VoxAI — Code Explained, Line-by-Line (Learning Document)

Ye file tumhare liye ek **living course** hai — mai isme part-by-part poore project ka
code detail me explain karta rahunga (har file, har logic, har concept). Har baar jab
naya part ready hoga, mai isi file me neeche add karunga. Isko upar se niche padhte jao,
sequence important hai (baad wale parts pehle wale concepts use karte hain).

**Kaise padhna hai:** Har code-block ke baad, uska explanation hai. Jahan bhi koi naya
programming concept (state, hook, async, etc.) pehli baar aayega, use **bold** karke
poora samjhaya gaya hai — agar bhool jao to Ctrl+F se wapas dhoondh sakte ho.

---

# PART 1 — Frontend Start-up

## 1.1 `artifacts/voxai/src/main.tsx` — App ka entry point

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
```

Ye sabse pehli file hai jo browser me chalti hai jab koi voxai website kholta hai.

- **`import`** — JavaScript/TypeScript me kisi doosri file se code "udhaar" lene ka tareeka.
  `import { StrictMode } from 'react'` ka matlab: `react` naam ki library se `StrictMode`
  naam ki cheez nikaal ke le aao.
- **`StrictMode`** — React ka dev-mode-only safety-net. Ye har component ko **do baar**
  render karta hai taaki agar tumne koi "impure" code likha ho (jaise render ke andar
  seedha kisi variable ko modify karna) to turant dikh jaaye. Production build me iska
  koi effect nahi padta, performance same rehti hai.
- **`createRoot(document.getElementById('root')!)`** —
  - `document.getElementById('root')` — Browser ka built-in function, HTML file
    (`index.html`) ke andar `<div id="root"></div>` dhoondta hai.
  - `!` — TypeScript ka "non-null assertion". `getElementById` normally `Element | null`
    return karta hai (ho sakta hai element na mile). `!` lagakar hum TypeScript se keh
    rahe hain "trust me, ye null nahi hoga" — agar galti se null hua to runtime crash
    hoga, but yahan hum jaante hain `index.html` me ye div guaranteed hai.
  - `createRoot(...)` — React ka function jo us div ko "React se control hone wala area"
    bana deta hai.
- **`.render(<StrictMode>...</StrictMode>)`** — Jo bhi JSX ismein diya, wahi us div ke
  andar draw ho jaata hai.
- **JSX** — `<ThemeProvider><App /></ThemeProvider>` dikhne me HTML jaisa hai lekin ye
  actually JavaScript hai (Babel/TypeScript compiler ise `React.createElement(...)` calls
  me convert kar deta hai). Isse UI likhna aasan ho jaata hai.
- **`ThemeProvider`** — Ek "Context Provider" (neeche Context concept detail me aayega
  jab hum `useAuth` padhenge). Iska kaam hai poore app ko dark/light-mode ki info dena
  bina har component me manually pass kiye.

**One-liner summary:** Browser page load hota hai → React `#root` div ke andar poora
`<App />` UI draw kar deta hai, ThemeProvider ke andar wrap karke.

---

## 1.2 `artifacts/voxai/src/App.tsx` — Traffic controller (kaunsa screen dikhana hai)

Ye 372-line file hai. Iska ek hi kaam hai: **decide karna user ko is waqt kaunsa screen
dikhana hai** — loading, login/signup, landing page, chat/workspace, projects list, ya
admin panel. Saath hi ye chat-panel aur preview-panel ke beech ka resizable divider bhi
handle karta hai.

### Imports (lines 1-15)
Sab child components import ho rahe hain (`Sidebar`, `Header`, `ChatView`, etc.) — inhe
Part 3 me detail se dekhenge. `useAppStore` aur `useAuth` do **custom hooks** hain jo
app ka poora data manage karte hain (Part 2 me poora explain hoga).

```tsx
type AuthMode = 'login' | 'signup' | null;
```
**TypeScript "union type"** — ek custom type banaya jo sirf teen values le sakta hai:
`'login'`, `'signup'`, ya `null`. Agar kisi variable ko `AuthMode` type diya jaaye aur
koi `'signout'` assign kare, TypeScript **compile-time par hi error** dega — runtime
tak wait nahi karna padta bug pakadne ke liye. Yehi TypeScript ka fayda hai JavaScript
ke muqable.

### State setup (lines 19-33)

```tsx
function AppContent() {
  const { user, loading, signOut, refreshProfile, isAuthenticated } = useAuth();
  const store = useAppStore(isAuthenticated, refreshProfile);
  const [landingShown, setLandingShown] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [pendingMessage, setPendingMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const pendingSentRef = useRef(false);
```

- **`useAuth()`** — Login-related data nikaalte hain (kaun user hai, loading, sign-out).
- **`useAppStore(...)`** — Poora app-data (chats, messages, generated code, files) ek
  object (`store`) me milta hai.
- **`useState(initialValue)`** — React ka sabse core concept: **"state"**. Ye ek array
  return karta hai `[currentValue, setterFunction]`. Jab bhi `setterFunction` call hota
  hai, React **automatically us component ko phir se render** kar deta hai naye value
  ke saath. `useState(true)` likhne ka matlab: `landingShown` naam ka box banao jiski
  starting value `true` ho.
  - `landingShown` — Landing page dikh rahi hai ya nahi
  - `authMode` — Login form khula hai, signup khula hai, ya kuch nahi
  - `pendingMessage` — Agar user login karne se pehle hi prompt type kar de, to wo yahan
    "hold" ho jaata hai, login ke baad automatically send ho jaata hai
  - `showSettings`, `showPreviewModal` — Overlay screens dikhane/chhupane ke flags
- **`useRef(false)`** — `useState` jaisa hi ek box, lekin **iski value change hone par
  component re-render NAHI hota**. Isliye ye "silent memory" jaisa hai — data store karo
  jo screen update nahi karwana. `pendingSentRef` yahan track karta hai ki pending
  message already send ho chuka hai ya nahi (taaki duplicate na ho).

### Resizable split-panel — lines 29-118 (chat aur preview panel ke beech ka drag-handle)

```tsx
const [splitPos, setSplitPos] = useState(40); // % width for chat panel
const [isMd, setIsMd] = useState(() => window.innerWidth >= 768);
const containerRef = useRef<HTMLDivElement>(null);
const overlayRef = useRef<HTMLDivElement>(null);

const gestureRef = useRef({
  active: false,
  startX: 0,
  startY: 0,
  mode: 'idle' as 'idle' | 'detecting' | 'resize' | 'scroll',
  source: null as 'chat' | 'preview' | 'divider' | null,
});
```

Desktop (`md` size, 768px+ width) par screen do panels me bant-i hai: chat (left) +
preview (right), aur beech me ek draggable line hoti hai jise pakad ke width adjust kar
sakte ho.

- `splitPos` — Chat panel ki current width, percentage me (default 40%).
- `isMd` — Screen "medium" size ya usse bada hai ya nahi (`window.innerWidth >= 768`).
  `useState(() => ...)` — jab initial value calculate karne me thoda kaam ho (function
  call), to `useState` ko **function** do (lazy initializer), taaki wo function sirf
  **ek baar** chale (pehli render par), har render par nahi.
- `containerRef`, `overlayRef` — **DOM element references**. `useRef<HTMLDivElement>(null)`
  se hum ek asli `<div>` HTML element ko "pakad" sakte hain code se (jaise
  `containerRef.current.getBoundingClientRect()` — us div ki position/size nikalna).
- `gestureRef` — Ek complex object jo current drag-gesture ki state track karta hai:
  active hai ya nahi, drag kaha se shuru hua (`startX`, `startY`), kya mode hai
  (`'idle'` = kuch nahi ho raha, `'detecting'` = abhi decide ho raha hai user horizontal
  drag kar raha hai ya vertical scroll, `'resize'` = panel resize ho raha hai,
  `'scroll'` = normal page scroll), aur source (`'chat'`, `'preview'`, ya `'divider'` —
  drag kahan se shuru hua).

```tsx
useEffect(() => {
  const check = () => setIsMd(window.innerWidth >= 768);
  window.addEventListener('resize', check);
  return () => window.removeEventListener('resize', check);
}, []);
```

**`useEffect(fn, deps)`** — React ka teesra core concept: **"side effect"**. Iska matlab
hai "aisa code jo render hone ke *baad* chalna chahiye, aur jo bahar ki duniya
(browser APIs, network, timers) se interact kare." `fn` render ke baad chalta hai.
`deps` (dependency array) batata hai kab dobara chalna hai:
- `[]` (khaali array) — sirf **ek baar** chale, jab component pehli baar screen par aaye
  ("mount" ho)
- `[x, y]` — jab bhi `x` ya `y` badle, dobara chale
- deps hi na do — **har render** par chale (rare use-case)

Yahan: window resize hone par `isMd` update karo. `return () => ...` — ye "**cleanup
function**" hai, jo component hatne (unmount hone) par ya agla effect chalne se pehle
chalta hai — yahan listener hataya jaa raha hai taaki memory leak na ho (agar cleanup na
karo, to purane listeners jamā hote rahenge har baar component re-mount hone par).

```tsx
const clamp = (v: number) => Math.min(75, Math.max(20, v));

const applyResize = useCallback((clientX: number) => {
  if (!containerRef.current) return;
  const rect = containerRef.current.getBoundingClientRect();
  setSplitPos(clamp(((clientX - rect.left) / rect.width) * 100));
}, []);
```

- `clamp` — Ek simple helper function jo value ko 20 aur 75 ke beech "band" kar deta hai
  (chat panel kabhi 20% se kam ya 75% se zyada na ho).
- **`useCallback(fn, deps)`** — React ka function-memoization tool. Normally, har render
  par saare functions **naye sire se banaye jaate hain** (JavaScript me function ek
  value hai). Agar ye function kisi child component ko prop ke roop me diya jaa raha ho,
  to har render par "naya" function milne se child bhi unnecessarily re-render hota hai.
  `useCallback` us function ko "yaad" rakhta hai — jab tak `deps` na badle, wahi purana
  function reference wapas milta hai. `applyResize`: mouse ki current X-position lekar,
  container ki width ke hisaab se percentage nikal ke `splitPos` set karta hai.

```tsx
const startPanelGesture = useCallback((clientX: number, clientY: number, source: 'chat' | 'preview' | 'divider') => {
  if (!isMd) return;
  const mode = source === 'divider' ? 'resize' : 'detecting';
  gestureRef.current = { active: true, startX: clientX, startY: clientY, mode, source };
  if (source === 'divider') {
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }
}, [isMd]);
```
Jab user mouse-down / touch-start kare kisi panel ya divider par: agar mobile hai to
kuch mat karo (`!isMd`). Agar seedha divider par drag shuru hua, mode turant `'resize'`
set karo. Warna (`'chat'`/`'preview'` panel par) mode `'detecting'` rakho — abhi pata
nahi user resize karna chahta hai ya sirf scroll.

```tsx
const onGestureMove = useCallback((clientX: number, clientY: number) => {
  const g = gestureRef.current;
  if (!g.active) return;
  const dx = clientX - g.startX;
  const dy = clientY - g.startY;
  if (g.mode === 'detecting' && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
    g.mode = Math.abs(dx) >= Math.abs(dy) ? 'resize' : 'scroll';
    ...
  }
  if (g.mode === 'resize') applyResize(clientX);
}, [applyResize]);
```
Jab mouse/finger move ho: horizontal (`dx`) aur vertical (`dy`) distance nikaalo starting
point se. Jab tak movement 8px se kam hai, kuch decide mat karo (chhoti jitter ignore).
Jaise hi 8px se zyada move ho: agar horizontal movement zyada hai to `'resize'` mode
(panel resize karo), agar vertical zyada hai to `'scroll'` mode (normal scroll hone do,
resize mat karo). Ye ek **common mobile-UX pattern** hai — "direction lock" — taaki
scroll karte waqt galti se panel resize na ho jaaye.

```tsx
const onGestureEnd = useCallback((_clientX: number, _clientY: number) => {
  const g = gestureRef.current;
  if (g.source === 'preview' && g.mode !== 'resize' && overlayRef.current) {
    overlayRef.current.style.pointerEvents = 'none';
    setTimeout(() => {
      if (overlayRef.current) overlayRef.current.style.pointerEvents = 'auto';
    }, 200);
  }
  gestureRef.current = { active: false, startX: 0, startY: 0, mode: 'idle', source: null };
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}, []);
```
Jab drag khatam ho: agar user ne sirf preview panel par **tap** kiya (resize nahi kiya),
to preview ke upar wala transparent overlay 200ms ke liye "pointer-events: none" kar do
— taaki wo click seedha neeche wale iframe (generated website preview) tak pahunche.
Fir gesture state reset kar do.

`_clientX`/`_clientY` (underscore prefix) — convention hai ye batane ke liye "ye
parameter liya hai lekin use nahi ho raha" (TypeScript/ESLint ki unused-variable warning
avoid karne ke liye).

```tsx
useEffect(() => {
  const onMouseMove = (e: MouseEvent) => onGestureMove(e.clientX, e.clientY);
  const onTouchMove = (e: TouchEvent) => {
    onGestureMove(e.touches[0].clientX, e.touches[0].clientY);
    if (gestureRef.current.mode === 'resize') e.preventDefault();
  };
  const onMouseUp = (e: MouseEvent) => onGestureEnd(e.clientX, e.clientY);
  const onTouchEnd = (e: TouchEvent) => onGestureEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd);
  return () => { /* sab hata do */ };
}, [onGestureMove, onGestureEnd]);
```
Poore `window` par mouse-move/up aur touch-move/end listeners lagaye — kyunki drag
kabhi bhi panel ke bahar bhi ja sakta hai, isliye sirf ek component par listener kaafi
nahi. `{ passive: false }` — browser ko batata hai ki hum `preventDefault()` call kar
sakte hain (taaki resize karte waqt page scroll na ho).

### Authenticated + pending-message flow (lines 121-137)

```tsx
useEffect(() => {
  if (
    isAuthenticated &&
    store.initialized &&
    pendingMessage &&
    !pendingSentRef.current
  ) {
    pendingSentRef.current = true;
    setLandingShown(false);
    setAuthMode(null);
    store.setView('chat');
    store.handleSend(pendingMessage).finally(() => {
      setPendingMessage('');
      pendingSentRef.current = false;
    });
  }
}, [isAuthenticated, store.initialized, pendingMessage, store.handleSend, store.setView]);
```
Ye scenario handle karta hai: user landing page par prompt type karta hai **login se
pehle**. Jaise hi wo login/signup kar leta hai (`isAuthenticated` true ho jaata hai), aur
store initialize ho chuka ho, aur ek `pendingMessage` mojood ho, aur wo message pehle se
send nahi hua ho (`pendingSentRef.current` false) — to landing page hatao, chat view
kholo, aur wo pending message automatically bhej do. `.finally(...)` — **Promise** ka
method jo success ya failure dono cases me chalta hai (yahan message clear karne ke liye).

### Navigation handlers (lines 139-166)
Simple functions — bas state variables set karte hain, koi complex logic nahi:
- `handleLandingSubmit(text)` — landing page se prompt aaya: agar login nahi hai to
  signup form kholo (message `pendingMessage` me save karke), agar login hai to seedha
  chat view me chale jao.
- `handleCreateProject()` — landing page wapas dikhao (naya project banane ke liye)
- `handleOpenProjectsFromLanding()` — agar logged in ho to projects list dikhao, warna
  login form
- `handleOpenProject(chatId)` — us specific chat/project ko active karke chat view kholo

### Rendering logic (lines 169-364) — "kya dikhana hai" ka decision tree

```tsx
if (loading || !store.initialized) {
  return ( /* spinner UI */ );
}
if (showSettings) {
  return <SettingsPage onClose={() => setShowSettings(false)} />;
}
if (landingShown) {
  if (!isAuthenticated && authMode) {
    return <AuthView initialMode={authMode} onBack={() => setAuthMode(null)} />;
  }
  return <LandingPage ... />;
}
// ... warna: main workspace (Sidebar + Header + Chat/Preview ya Projects/Admin)
```

Ye pattern **"conditional (early-return) rendering"** kehlaata hai — React component me
function ke andar hi `if` statements se decide karo kaunsa JSX return karna hai. Jaise hi
koi condition match ho, wahi return ho jaata hai, neeche wala code chalta hi nahi.

Priority order (upar se neeche): **loading spinner > settings overlay > landing/auth >
main workspace**. Matlab agar `loading` true hai, to chahe `landingShown` bhi true ho, to
bhi loading spinner hi dikhega (kyunki uska check pehle aata hai aur `return` kar deta
hai function ko).

### Main workspace layout (lines 210-353)

```tsx
const activeChat = store.chats.find((c) => c.id === store.activeChatId);
const headerTitle = store.view === 'chat' ? (activeChat?.title || '') : ...;
const isWorkspaceView = store.view === 'chat';
```
- `.find(...)` — JavaScript Array method jo array me se pehla matching element dhoondta
  hai (yahan: current active chat ka object uske ID se).
- `?.` — **Optional chaining**. `activeChat?.title` ka matlab "agar `activeChat` mojood
  hai to uska `.title` lo, warna crash mat karo, `undefined` de do." Isse "cannot read
  property of null/undefined" errors se bacha jaata hai.

Baaki JSX Sidebar, Header, aur teen possible views render karta hai
(`store.view === 'chat' | 'projects' | 'admin'`) — chat view me dono panels
(chat + preview) hote hain, jinke beech wahi resize-divider hai jo upar explain kiya.

---

# PART 2 — App ka Data Layer (`useAppStore` aur `useAuth`)

Ye do files sabse zyaada important hain samajhne ke liye — inme poora app ka **"brain"**
hai (data kahan store hai, kaise change hota hai, backend se kaise baat hoti hai).

## 2.1 `artifacts/voxai/src/hooks/useAuth.tsx` (95 lines) — Login/User management

Ye ek **React Context** banata hai. Context React ka wo feature hai jisse tumhe data
har component me manually "prop drilling" (parent se child, child se grandchild...)
nahi karna padta — ek baar top par "provide" karo, kahin bhi neeche "consume" kar lo.

```tsx
interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}
```
**`interface`** — TypeScript me ek "shape" define karna: koi bhi object jo `AuthContextType`
type ka ho, usme exactly ye 5 properties honi chahiye is type ke saath. Ye runtime check
nahi hai — sirf **compile-time** par TypeScript check karta hai ki tum galat shape ka
object to nahi bana rahe.

```tsx
const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, signOut: async () => {}, refreshProfile: async () => {}, isAuthenticated: false,
});
```
`createContext(defaultValue)` — ek Context object banata hai jisme default value hai
(agar koi component Provider ke bahar `useContext` call kare, to yahi default milega).

```tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
```
`AuthProvider` ek **component** hai jo `children` prop leta hai (`ReactNode` type —
matlab "kuch bhi jo React render kar sake": text, JSX, arrays, etc.). `App.tsx` me hum
dekh chuke: `<AuthProvider><AppContent /></AuthProvider>` — matlab `AppContent` hi yahan
`children` hai.

```tsx
const fetchProfile = useCallback(async () => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) { setUser(null); setIsAuthenticated(false); return; }
  setIsAuthenticated(true);
  const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
  if (error) { setUser(null); return; }
  setUser(data);
}, []);
```
- **`async function`** — Ek function jiske andar `await` use kar sakte ho (matlab: "yahan
  ruk jao jab tak ye Promise complete na ho jaaye, phir aage badho" — bina poore program
  ko freeze kiye, sirf is function ke andar ka execution pause hota hai).
- **`await`** — Kisi async operation (jaise network call) ka result aane tak wait karo.
- **Destructuring** — `const { data: { user: authUser } } = await ...` — ye ek shortcut
  hai. Agar result `{ data: { user: {...} } }` jaisa object hai, to seedha usme se nested
  `user` nikal ke `authUser` naam de rahe hain, sab ek line me.
- **`supabase`** — Ek external service (Supabase) jo authentication + database dono
  provide karta hai. `supabase.auth.getUser()` — current logged-in user nikaalta hai.
  `supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()` — ek SQL
  query jaisa hai: "profiles table se wo row lao jiska id match kare, agar na mile to
  crash mat karo (`maybeSingle`), sirf `null` do."
- **Logic:** Pehle current logged-in user check karo. Agar koi login nahi hai, `user` ko
  null karo aur `isAuthenticated` false. Agar hai, to `isAuthenticated` true karo aur us
  user ki extra profile-info (jaise naam, avatar) database se fetch karo.

```tsx
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      setIsAuthenticated(true);
      fetchProfile().finally(() => setLoading(false));
    } else {
      setUser(null); setIsAuthenticated(false); setLoading(false);
    }
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      setIsAuthenticated(true);
      (async () => { await fetchProfile(); })();
    } else if (event === 'SIGNED_OUT') {
      setUser(null); setIsAuthenticated(false);
    }
  });

  return () => subscription.unsubscribe();
}, [fetchProfile]);
```
Component pehli baar load hone par (deps me `fetchProfile` hai, jo `useCallback` se
memoized hai, isliye practically ye effect sirf ek baar chalta hai):
1. `supabase.auth.getSession()` se check karo pehle se koi session (login) exist karta
   hai (jaise browser refresh hone par). Agar haan, profile fetch karo aur `loading` ko
   false karo (loading khatam, ab UI dikhao).
2. **`onAuthStateChange`** — Ek **"subscription" / "listener"** register karta hai jo
   future me hone wale auth events (login/logout/token-refresh) par automatically chalta
   hai. Ye **"event-driven programming"** ka example hai — hum function likhte hain jo
   "kabhi bhi ye event ho, tab chalna" — hume manually poll (baar-baar check) karne ki
   zaroorat nahi.
3. `return () => subscription.unsubscribe()` — cleanup, component hatne par listener
   band kar do.

```tsx
const signOut = async () => {
  await supabase.auth.signOut();
  setUser(null);
  setIsAuthenticated(false);
};

const refreshProfile = useCallback(async () => { await fetchProfile(); }, [fetchProfile]);

return (
  <AuthContext.Provider value={{ user, loading, signOut, refreshProfile, isAuthenticated }}>
    {children}
  </AuthContext.Provider>
);
```
`AuthContext.Provider` — Ye JSX element hai jo Context ki value **"neeche wale sab
children ke liye available"** kar deta hai. Jo bhi component neeche `useContext(AuthContext)`
call karega, use ye `value` object milega.

```tsx
export function useAuth() {
  return useContext(AuthContext);
}
```
Ye ek chhota **custom hook** hai — `useContext(AuthContext)` ko wrap kar diya taaki
baaki files me `useAuth()` likhna aasan ho (aur agar kabhi Context ka naam badalna ho,
sirf yahan change karna padega).

**Summary:** `useAuth` poore app ko batata hai "kaun login hai, uska profile kya hai,
loading ho raha hai ya nahi" — aur Supabase ke real-time events sunkar khud-b-khud
update karta rehta hai.

---

## 2.2 `artifacts/voxai/src/hooks/useAppStore.ts` (910 lines) — Poore app ka "state machine"

Ye sabse badi aur sabse important frontend file hai. Isse samajhna matlab samajhna ki
**chat kaise kaam karta hai, build kaise trigger hota hai, edit kaise hota hai**.

### Top-level imports aur helper functions (lines 1-139)

```ts
import { createChat, getChats, getMessages, updateChatTitle, deleteChat, addMessage } from '../services/chatService';
import { mockStreamResponse, mockEditResponse, runtimeRepair } from '../services/mockAiService';
```
- `chatService` — Supabase database ke saath baat karne ke functions (chat banana, list
  lena, messages lena/save karna).
- `mockAiService` — **Naam "mock" hai lekin ye asli backend ko call karta hai** (naam
  legacy hai, purane dev phase se reh gaya — cheezein aage badalte gayi lekin file-naam
  wahi rahe). `mockStreamResponse` naye project build ke liye backend `/api/agents/build`
  ko call karta hai; `mockEditResponse` existing project ko edit karne ke liye
  `/api/agents/edit` ko call karta hai.

```ts
const CODE_KEY  = (id: string) => `voxai_code_${id}`;
const FILES_KEY = (id: string) => `voxai_files_${id}`;
const LOCAL_CHATS_KEY = 'voxai_local_chats';
const LOCAL_MSGS_KEY = (id: string) => `voxai_msgs_${id}`;
```
Ye **"key generator" functions** hain — browser ke `localStorage` (ek chhota
key-value database jo browser me hi save rehta hai, page-refresh survive karta hai) me
data save karne ke liye unique keys banate hain, har chat-id ke hisaab se alag.

```ts
function getLocalChats(): Chat[] {
  try {
    const raw = localStorage.getItem(LOCAL_CHATS_KEY);
    return raw ? (JSON.parse(raw) as Chat[]) : [];
  } catch {
    return [];
  }
}
function saveLocalChats(chats: Chat[]) {
  try { localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(chats)); } catch {}
}
```
- `localStorage.getItem/setItem` — browser storage read/write karta hai, lekin ye sirf
  **string** store kar sakta hai. Isliye `JSON.stringify(obj)` se object ko text me
  convert karke save karte hain, aur `JSON.parse(text)` se wapas object banate hain.
- **`try { ... } catch { ... }`** — Error-handling. Agar `localStorage` full ho ya
  disabled ho (kuch browsers/privacy modes me hota hai), crash hone ke bajaye khaali
  array/kuch nahi return kar do.

Baaki helper functions (`addLocalChat`, `removeLocalChat`, `updateLocalChatTitle`,
`getLocalMessages`, `addLocalMessage`) isi pattern ko follow karte hain — Supabase ke
sath-sath ek **local fallback copy** rakhte hain, taaki agar Supabase down ho ya user
offline ho, app phir bhi kaam kare (**"offline-first" design pattern** ka halka version).

### `useAppStore` function — state declarations (lines 141-186)

```ts
export function useAppStore(isAuthenticated: boolean, onCreditsChange?: () => void): AppState {
  const [view, setView] = useState<View>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [chatError, setChatError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [buildStep, setBuildStep] = useState(-1);
  // ... (aur 30+ aise state variables)
```

Ye function ek **custom hook** hai — matlab `useState`/`useEffect` jaise built-in React
hooks ko use karke apna khud ka reusable "state bundle" banaya hai. Har state variable
ek specific cheez track karta hai:
- `view` — abhi kaunsa tab khula hai: `'chat'`, `'projects'`, ya `'admin'`
- `chats` — user ke saare saved projects/conversations ki list
- `activeChatId` — abhi kaunsa chat/project khula hai
- `activeChatMessages` — us chat ke saare messages (user ke prompts + AI ke replies)
- `isTyping` — AI abhi type/build kar raha hai (loading indicator ke liye)
- `streamingContent` — AI ka jawab jo **live streaming** me aa raha hai (jaise ChatGPT
  me letter-by-letter text aata hai)
- `generatedCode` — final generated website ka code (HTML/preview string)
- `buildStep` — build pipeline abhi kaunse step (0-13) par hai, taaki UI progress
  dikha sake ("Planning...", "Generating...", "Validating...")
- Baaki bahut saare (`dnaComposition`, `themeTokens`, `knowledgeGraph`,
  `registrySelection`, `runtimeState`, etc.) backend ke advanced pipeline features
  (jo hum Part 4+ me backend explain karte waqt cover karenge) ka data frontend me
  dikhane ke liye hain — jaise "design DNA breakdown panel", "component registry lock
  panel", "runtime health score panel".

```ts
const undoStackRef = useRef<ProjectFile[][]>([]);
const redoStackRef = useRef<ProjectFile[][]>([]);
```
**Undo/Redo implementation** — Ek classic Computer Science pattern: do "stacks" (last-in-
first-out lists). Har baar jab edit hota hai, purani files ka snapshot `undoStackRef` me
push ho jaata hai. Undo dabane par, us stack se latest snapshot nikaal ke wapas apply
karte hain, aur current state ko `redoStackRef` me daal dete hain (taaki redo bhi kaam
kare). `useRef` isliye use hua hai (na ki `useState`) kyunki ye stacks har render par UI
update trigger nahi karne chahiye — sirf backend logic ke liye internal memory hain.

### Loading chats aur real-time subscription (lines 254-336)

```ts
const loadChats = useCallback(async () => {
  try {
    const data = await getChats();
    const localChats = getLocalChats();
    const supabaseIds = new Set(data.map((c) => c.id));
    const localOnly = localChats.filter((c) => !supabaseIds.has(c.id));
    setChats([...data, ...localOnly].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ));
  } catch {
    setChats(getLocalChats());
  }
}, []);
```
- `Set` — JavaScript ka data-structure jo sirf **unique values** rakhta hai. Yahan
  Supabase se aaye chat-IDs ka ek Set banaya (fast "kya ye ID pehle se hai" check ke
  liye — `O(1)` lookup, array `.includes()` se fast).
  - **`.map((c) => c.id)`** — Array method: har item ko transform karke naya array
    banata hai (yahan: chat-objects ki list ko sirf unke IDs ki list me convert kiya).
  - **`.filter((c) => !supabaseIds.has(c.id))`** — Array method: sirf wo items rakhta
    hai jo condition pass karein (yahan: sirf wo local chats jo Supabase me nahi hain).
- `.sort((a, b) => ...)` — Array ko sort karta hai, yahan **latest-updated-first** order
  me.
- **Logic ka matlab:** Supabase se chats lao. Jo chats sirf locally save hain (Supabase
  me nahi — jaise jab user login nahi tha), unhe bhi list me jodo. Duplicate na ho isliye
  Set-based filtering. Agar Supabase call hi fail ho jaaye (network issue), poori list
  localStorage se le lo.

```ts
useEffect(() => {
  if (!activeChatId || !isAuthenticated) { setActiveChatMessages([]); return; }
  loadMessages(activeChatId);
  if (channelRef.current) { supabase.removeChannel(channelRef.current); }
  const channel = supabase
    .channel(`messages:${activeChatId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${activeChatId}` },
      (payload) => {
        const newMsg = payload.new as Message;
        setActiveChatMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      }
    )
    .subscribe();
  channelRef.current = channel;
  return () => { supabase.removeChannel(channel); channelRef.current = null; };
}, [activeChatId, isAuthenticated, loadMessages]);
```
Ye **Supabase Realtime** use kar raha hai — matlab jab bhi database ki `messages` table
me current chat ke liye ek naya row **INSERT** ho, ye code turant notify ho jaata hai
(bina baar-baar poll/refresh kiye) aur us naye message ko UI me add kar deta hai.
- `setActiveChatMessages((prev) => ...)` — **Functional state update**. `useState` ke
  setter ko function bhi diya jaa sakta hai jo "purani value" (`prev`) leke "nayi value"
  return kare. Ye zaroori hai jab naya value purani value par depend kare — isse React
  guarantee deta hai ki tumhe sahi "latest" purani value milegi (agar seedha
  `activeChatMessages` variable use karte, to kabhi-kabhi purana/stale value mil sakta
  tha "closures" ki wajah se — ye ek common React gotcha hai).
- `.some((m) => m.id === newMsg.id)` — Check karo ye message already list me hai ya
  nahi (duplicate na ho, kyunki hum apna khud ka message pehle se locally add kar chuke
  hote hain).

### `handleSend` — Sabse important function (lines 407-670+)

Ye function tab chalta hai jab user Message-box me kuch type karke send kare. Iska kaam:
1. Agar koi chat active nahi hai, naya chat banao
2. User ka message database/localStorage me save karo aur UI me turant dikhao
3. Decide karo — **naya build** karna hai ya **existing project ko edit** karna hai
   (`isEditMode = currentFiles.length > 0` — agar pehle se files hain, matlab edit mode)
4. Backend ko call karo (streaming response ke saath)
5. Jab backend ka result aaye, sab kuch (code, files, memory, knowledge-graph) state me
   save karo

```ts
const handleSend = useCallback(async (content: string) => {
  if (loadingRef.current) return;
  loadingRef.current = true;
  try {
    setChatError('');
    let chatId = activeChatId;
    if (!chatId) {
      // naya chat banao (Supabase try karo, fail ho to local UUID generate karo)
      ...
    }
    // user ka message save + turant UI me dikhao
    ...
    setIsTyping(true);
    setStreamingContent('');
    const currentFiles  = projectFilesRef.current;
    const currentMemory = projectMemoryRef.current;
    const isEditMode    = currentFiles.length > 0;
```
- `loadingRef.current` — Ek guard/lock: agar pehle se koi build/edit chal raha hai, naya
  request ignore kar do (duplicate submissions rokne ke liye).
- **Kyun `projectFilesRef.current` (ref) use kiya, `projectFiles` (state) nahi?** —
  Isse "**stale closure**" problem se bacha jaata hai. `handleSend` khud `useCallback`
  se banaya function hai jo lambe time tak zinda reh sakta hai (async operation ke
  andar). Agar seedha `projectFiles` state variable use karte, to us waqt ki "snapshot"
  value use hoti jab function **banaya** gaya tha, na ki jab wo **chal** raha hai. Ref
  hamesha "latest" value deta hai kyunki wo ek mutable box hai, state jaisa "frozen
  snapshot per render" nahi.

```ts
const handleDone = async (fullText, code, pb?, so?, serverFiles?, diff?) => {
  // assistant ka reply message save karo
  // generatedCode set karo
  // agar serverFiles aaye hain to undo-stack me snapshot push karo, phir naye files set karo
  // knowledge graph rebuild karo (edit mode me)
  // ProjectMemory update karo (project ka summary: type, pages, entities, features, edit history)
  setBuildStep(9);
  loadingRef.current = false;
  onCreditsChange?.();
  // V6.2: Autonomous Runtime Builder ko background me trigger karo
  if (serverFiles && serverFiles.length > 0 && chatId) {
    ...
    const resp = await fetch('/api/agents/autonomous-build', { method: 'POST', ... });
    const reader = resp.body.getReader();
    // SSE-jaisa manual stream-parsing
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // event parse karke autonomousBuildState update karo
    }
  }
};
```
`handleDone` ek **callback function** hai jo backend service (`mockStreamResponse` ya
`mockEditResponse`) ko diya jaata hai — jab backend ka kaam poora ho jaaye, ye function
call hota hai poore result ke saath. Ye pattern **"callback-based API"** kehlaata hai.

Yahan ek dilchasp cheez hai: `fetch('/api/agents/autonomous-build', ...)` ke response ko
manually stream karke padha jaa raha hai (`resp.body.getReader()`, `TextDecoder`) — ye
Server-Sent Events (SSE) ka low-level tareeka hai. Backend chunks me `data: {...}\n\n`
format me events bhejta rehta hai, frontend unhe split karke (`buf.split('\n\n')`) parse
karta hai. Ye tab use hota hai jab tumhe ek `EventSource` object use karne ki jagah zyaada
control chahiye (jaise POST request ke saath streaming — `EventSource` sirf GET
support karta hai).

```ts
const handleError = (err: string) => {
  setChatError(err);
  setStreamingContent('');
  setIsTyping(false);
  setBuildStep(-1);
  loadingRef.current = false;
};
const handleStep = (step: number) => setBuildStep(step);
```
Do simple callbacks — error aane par UI ko reset karke error message dikhao; step-change
hone par progress bar update karo.

```ts
if (isEditMode) {
  await mockEditResponse(content, currentFiles, currentMemory, (token) => setStreamingContent((prev) => prev + token), handleDone, handleError, handleStep, ...);
} else {
  await mockStreamResponse(content, (token) => setStreamingContent((prev) => prev + token), handleDone, handleError, handleStep, ...);
}
```
(Full build wala branch neeche hai, file me truncate ho gaya tha — lekin pattern same
hai.) Yahi hai wo decision point: **agar pehle se files hain to edit-API call hoga, warna
build-API call hoga.** `(token) => setStreamingContent((prev) => prev + token)` — jab bhi
backend se ek chhota text-chunk aaye, use `streamingContent` string me jodte jao — isi se
ChatGPT-jaisa "typing effect" dikhta hai UI me.

**Summary of `useAppStore`:** Ye hook poore app ka "single source of truth" hai. Isme:
saare chats/messages, current build/edit ka progress, generated code/files, aur dusre
20+ advanced-feature data (DNA, registry, runtime health) store hote hain. `App.tsx` isi
`store` object ko saare child components me prop ke through pass karta hai.

---

---

# PART 3 — Chat UI (`MessageInput.tsx` aur `ChatView.tsx`)

Ye do components mil ke wo screen banate hain jaha user type karta hai aur AI ka jawab
dikhta hai — jaise ChatGPT ka interface.

## 3.1 `artifacts/voxai/src/components/MessageInput.tsx` (99 lines) — Text-box + Send button

```tsx
interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;
```

- **`interface MessageInputProps`** — Ye component "kya-kya props leta hai" define karta
  hai. `onSend` ek function hai jo parent (`App.tsx` → `store.handleSend`) se aata hai —
  ye pattern **"lifting state up"** kehlaata hai: khud is component ke paas koi network-
  call logic nahi hai, ye sirf text collect karta hai aur jab user submit kare, parent
  ke diye function ko call kar deta hai. `disabled?` — `?` ka matlab ye prop **optional**
  hai (dena zaroori nahi).
- `value` — Textbox ka current text (**"controlled input"** pattern — React state hi
  textbox ki value control karta hai, HTML khud apni state nahi rakhta).
- `hasText` — Ek derived boolean: text khaali nahi hai (trim karke — sirf spaces wala
  text bhi "khaali" mana jaata hai).

```tsx
useEffect(() => {
  if (textareaRef.current) {
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
  }
}, [value]);
```
Ye **"auto-growing textarea"** ka trick hai. Jab bhi `value` badle (user type kare):
1. Height ko `'auto'` kar do (taaki purani height ka effect na rahe)
2. `scrollHeight` — browser batata hai text ko poora dikhane ke liye kitni height
   chahiye. Us height ko naye se set karo, lekin **120px se zyada nahi** (`Math.min`) —
   isse textbox 3-4 lines ke baad scroll karne lagta hai, infinite badhta nahi.

```tsx
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
```
- `handleSubmit` — Agar text khaali hai ya component `disabled` hai (jab AI already
  type/build kar raha ho), kuch mat karo. Warna parent ka `onSend` call karo, textbox
  khaali kar do.
- `handleKeyDown` — Keyboard events sunta hai. Agar sirf **Enter** dabaya (Shift nahi),
  message send karo. Agar **Shift+Enter** dabaya, normal behavior hone do (naya line
  daalo — ChatGPT jaisa hi behavior). `e.preventDefault()` — browser ka default action
  rokta hai (jo warna textarea me ek naya-line daal deta Enter par).

Baaki JSX Tailwind classes se UI bana raha hai: rounded textbox, ek "Plus" button (file
attach ke liye — abhi functional nahi lagta, sirf UI hai), "Mic" button (voice input —
ye bhi abhi sirf UI), aur "Send" (`ArrowUp`) button jo `hasText && !disabled` hone par hi
active (colored) dikhta hai, warna disabled/grey rehta hai.

---

## 3.2 `artifacts/voxai/src/components/ChatView.tsx` (312 lines) — Messages + Build Progress dikhaane wala panel

Is file me **4 chhote helper components** hain jo `ChatView` (main export) use karta hai.
Chalo ek-ek karke dekhte hain.

### Build/Edit pipeline ke labels (lines 7-27)

```tsx
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

const EDIT_STEPS = [
  { label: 'Intent Detector',  colors: 'from-violet-500 to-purple-600' },
  { label: 'File Resolver',    colors: 'from-blue-500 to-cyan-500' },
  { label: 'Patch Generator',  colors: 'from-orange-500 to-amber-400' },
  { label: 'Quality Gate',     colors: 'from-emerald-500 to-teal-500' },
  { label: 'Merge Engine',     colors: 'from-indigo-500 to-blue-600' },
];
```
Ye do arrays sirf **UI-display ke labels** hain — backend actually 25+ internal steps
chalata hai (jaise memory-notes me dekha: QAArchitect, DevOpsArchitect, RuntimeIntelligence,
etc.), lekin user ko confuse na karne ke liye frontend sirf **10 simplified naam**
(naye build ke liye) ya **5 naam** (edit ke liye) dikhata hai. `buildStep` (jo
`useAppStore` se aata hai, ek number 0-9) batata hai abhi kaunsa step highlight karna hai.
`colors` — Tailwind gradient classes, har step ka apna alag color-theme.

### `AgentIcon` — Chhota status-icon (lines 29-54)

```tsx
function AgentIcon({ isActive, isDone, colors }: { isActive: boolean; isDone: boolean; colors: string }) {
  if (isDone) {
    return ( /* green checkmark circle, gradient background */ );
  }
  if (isActive) {
    return ( /* spinning loader circle, gradient background */ );
  }
  return ( /* grey empty circle — "abhi tak nahi pahuncha" */ );
}
```
Ek chhota **presentational component** — sirf 3 props leta hai (`isActive`, `isDone`,
`colors`) aur unke hisaab se ek chhota circle icon banata hai: **done** (✓ checkmark),
**active** (spinning loader — CSS class `animate-spin`), ya **pending** (khaali grey
dot). Aisa component jo sirf UI dikhata hai, koi apna state/logic nahi rakhta, use
**"presentational" ya "dumb" component** kehte hain.

### `AgentPipeline` — Poora progress-card (lines 56-110)

```tsx
function AgentPipeline({ buildStep, isEditMode }: { buildStep: number; isEditMode: boolean }) {
  if (buildStep < 0) return null;

  if (isEditMode) {
    const steps = EDIT_STEPS;
    const activeStep = buildStep <= 4 ? buildStep : 4;
    const isDone = buildStep >= 9;
    return ( /* card with EDIT_STEPS list, checkmarks/spinner based on activeStep */ );
  }

  return ( /* card with BUILD_STEPS list, checkmarks/spinner based on buildStep */ );
}
```
- `buildStep < 0` — Matlab koi build/edit chal hi nahi raha, kuch mat dikhao
  (`return null` — React me ye valid hai, "kuch bhi render mat karo").
- Edit-mode me: `buildStep` backend se 0-9 tak aa sakta hai, lekin UI me sirf 5 edit-steps
  hain, isliye `Math.min`-jaisa clamp: `buildStep <= 4 ? buildStep : 4` (5 se zyada hua
  to 5th step par hi "active" dikhao, jab tak `isDone` na ho jaaye).
- `.map(({ label, colors }, i) => ...)` — Har step ke liye ek row banao. `stepDone`
  (pichhle steps ya sab-done), `stepActive` (current step), baaki grey/dim.

### `EditDiffPanel` — Edit ke baad "kya-kya file badli" dikhane wala card (lines 112-149)

```tsx
function EditDiffPanel({ diff }: { diff: EditDiff }) {
  const total = diff.changedFiles.length + diff.createdFiles.length + diff.deletedFiles.length;
  if (total === 0) return null;
  return (
    /* changed files: "~" yellow, created: "+" green, deleted: "−" red-strikethrough */
  );
}
```
Jab koi edit request complete ho, backend batata hai konsi files **change** hui, konsi
**nayi bani**, konsi **delete** hui (`EditDiff` type). Ye card unhe git-diff jaisi style
me dikhata hai (`~ filename.tsx`, `+ newfile.tsx`, `− oldfile.tsx`) — taaki user ko pata
chale sirf zaroori files hi touch hui, bina wajah poora project rewrite nahi hua.

### `parsePlanItems` aur `PlanChecklist` — AI ke text-reply se "plan" nikaal ke checklist dikhana (lines 151-210)

```tsx
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
```
Ye ek **text-parsing function** hai — AI jo streaming text bhejta hai usme kahin
`"✅ Plan"` heading hoti hai, uske neeche bullet points (`•`, `-`, `*` se shuru hone
wali lines) hote hain jo "plan items" hain. Ye function:
1. Poore text ko lines me todta hai (`.split('\n')`)
2. Jab tak `"✅ Plan"` line na mile, kuch mat karo
3. Uske baad wali lines me se bullet-points nikaalo, jab tak agla section-heading
   (`📋`/`📄`/`⚙️` emoji se shuru, ya `---` divider) na aa jaaye
4. **`/^[📋📄⚙️]/.test(trimmed)`** — Ye **regular expression (regex)** hai — ek pattern-
   matching syntax. `^[📋📄⚙️]` ka matlab "line ki shuruaat me in teen emoji me se koi ek
   ho". `.test(...)` check karta hai match hua ya nahi.
5. `trimmed.replace(/^[•\-\*]\s*/, '')` — Line ke shuru se bullet-marker aur uske baad
   ka space hata do, sirf actual text bacha lo.

`PlanChecklist` is parsed list ko ek visual checklist me render karta hai — "purane"
items par green checkmark (already generated, "done" maan liya jaata hai kyunki AI ne
unhe likh diya text me), sabse **last** item spinner/pending dikhata hai jab tak
`isComplete` na ho.

**Kyun ye approach?** — Backend structured JSON ki jagah kabhi-kabhi plain text me plan
bhejta hai (jaise `"✅ Plan\n• Homepage\n• Pricing page\n..."`). Frontend ko usse **UI-
friendly checklist** banana hai, isliye ye halka-sa "text-scraping" logic likha gaya hai
— thoda fragile hai (agar AI ka text-format thoda badal jaaye to parsing fail ho sakti
hai), lekin kaam chala leta hai kyunki prompt me AI ko exact format follow karne ko kaha
jaata hai (backend prompt-engineering side par).

### Main `ChatView` component (lines 260-312)

```tsx
export default function ChatView({ messages, isTyping, streamingContent, chatError, buildStep, isEditMode, lastEditDiff }: ChatViewProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, [messages.length, isTyping, streamingContent, chatError, buildStep]);
```
- `endRef` — Ek invisible `<div>` (line 308: `<div ref={endRef} />`) jo hamesha list ke
  **bilkul aakhir** me rehta hai.
- Har baar jab naya message aaye, ya typing-status/streaming-text/error/buildStep badle,
  `endRef.current?.scrollIntoView({ behavior: 'smooth' })` call hota hai — matlab chat
  automatically **neeche scroll** ho jaata hai (jaise WhatsApp/ChatGPT me hota hai).
  `setTimeout(..., 50)` — 50 milliseconds ka chhota delay taaki naye DOM elements pehle
  render ho jaayein, uske baad scroll ho (warna scroll thoda "peeche" reh sakta tha).

```tsx
if (messages.length === 0 && !isTyping && !chatError && buildStep < 0) {
  return <div className="flex-1 bg-white dark:bg-[#181817] md:bg-[#181817]" />;
}
```
Agar bilkul kuch nahi hai dikhane ke liye (naya chat, koi message nahi, koi loading
nahi), sirf ek khaali background-colored div dikhao (poori list render karne se
performance/flash-of-content bachta hai).

```tsx
const lastAssistantIdx = [...messages].reverse().findIndex(m => m.role === 'assistant');
const lastAssistantId = lastAssistantIdx >= 0 ? messages[messages.length - 1 - lastAssistantIdx]?.id : null;
```
- `[...messages]` — **Spread operator** se messages array ki ek **copy** banayi (taaki
  `.reverse()` original array ko mutate na kare — React me states ko directly modify
  karna **mana** hai, hamesha naya array/object banao).
- `.reverse().findIndex(...)` — Ulta karke pehla assistant-message dhoondo (matlab
  original array me **last** assistant message). Ye thoda "clever" tareeka hai last-match
  dhoondhne ka jab JavaScript me seedha `findLastIndex` available na ho (purane
  environments me).
- Isse "last assistant message ke turant baad `EditDiffPanel` dikhao" wala logic possible
  hota hai (line 287-289).

```tsx
return (
  <div className="flex-1 overflow-y-auto px-4 py-6 ...">
    <div className="max-w-2xl mx-auto">
      {messages.map((msg, idx) => (
        <div key={msg.id}>
          <MessageBubble message={msg} />
          {!isTyping && lastEditDiff && msg.id === lastAssistantId && idx === messages.length - 1 && (
            <EditDiffPanel diff={lastEditDiff} />
          )}
        </div>
      ))}
      {isTyping && isEditMode && buildStep >= 0 && buildStep < 9 && <AgentPipeline buildStep={buildStep} isEditMode={true} />}
      {isTyping && !isEditMode && buildStep >= 0 && <AgentPipeline buildStep={buildStep} isEditMode={false} />}
      {isTyping && hasPlanItems && !isEditMode && <PlanChecklist content={streamingContent} isComplete={planIsComplete} />}
      {isTyping && !streamingContent && buildStep < 0 && <TypingIndicator />}
      {chatError && <ErrorBanner message={chatError} />}
      <div ref={endRef} />
    </div>
  </div>
);
```
- `.map((msg, idx) => ...)` — Har message ko `MessageBubble` me render karo. `key={msg.id}`
  — React ko **har list-item ka unique identity** chahiye hota hai taaki wo efficiently
  pata laga sake kaunsa item add/remove/reorder hua (isके bina React confuse ho sakta hai
  aur galat item update kar sakta hai — ye ek **common React rule** hai: list render
  karte waqt hamesha stable, unique `key` do, index kabhi mat do agar list reorder ho
  sakti ho).
- Neeche wali sari lines **conditional rendering** hain (`&&` operator ka trick —
  `condition && <Component />` ka matlab "agar condition true hai to Component render
  karo, warna kuch nahi" kyunki `false && anything` JavaScript me `false` deta hai aur
  React `false`/`null`/`undefined` ko kuch render nahi karta):
  - Typing ho raha hai + edit-mode + step abhi 9 se kam → `AgentPipeline` (edit wala)
  - Typing ho raha hai + naya build-mode → `AgentPipeline` (build wala)
  - Typing ho raha hai + AI ke text me plan-items mile + build-mode → `PlanChecklist`
  - Typing ho raha hai lekin abhi tak koi text/step nahi aaya → simple 3-dot
    `TypingIndicator`
  - Koi error hai → `ErrorBanner`

**Summary Part 3:** `MessageInput` sirf ek controlled-textbox hai jo `onSend` call karta
hai. `ChatView` messages ki list dikhata hai, aur jab build/edit chal raha ho to ek
"live status card" (`AgentPipeline`) dikhata hai jo `buildStep` number ke hisaab se
progress-steps highlight karta hai — ye number seedha backend se SSE ke through aata hai
(jise hum backend-part me dekhenge).

---

---

# PART 4 — Backend Entry: `routes/agents.ts` aur `buildPipeline.ts`

Ab hum frontend chhod ke backend (`artifacts/api-server`) me chalte hain — ye Express.js
server hai jo saare AI-calls aur code-generation ka kaam karta hai.

**Naya concept: Backend kya hota hai?** Frontend (`voxai`) sirf UI dikhata hai —
browser me chalta hai, user dekh sakta hai. Backend (`api-server`) ek alag server hai
(Node.js par chalta hai, user seedha nahi dekh sakta) jo **heavy/secret kaam** karta hai:
AI models ko call karna (kyunki API-keys frontend me expose nahi kar sakte — koi bhi
browser dev-tools khol ke chura lega), database se baat karna, file-generation, etc.
Frontend `fetch('/api/agents/build', ...)` jaisi HTTP request bhejta hai, backend usse
process karke jawab deta hai.

## 4.1 `artifacts/api-server/src/routes/agents.ts` — HTTP Routes (563 lines)

File ke top comment me hi clearly likha hai iska design-principle:
> "This file is intentionally minimal. Each route: 1) Validates request 2) Sets SSE
> headers 3) Delegates to agent module 4) Closes response. All business logic lives
> elsewhere."

Ye ek **achi software-engineering practice** hai jise "**thin controller**" pattern
kehte hain — HTTP-handling layer ko simple rakho, asli logic alag files/modules me
rakho. Isse code **testable** aur **maintainable** rehta hai.

### Imports — ye file kis-kis module ko "jodti" hai (lines 17-56)

```ts
import { Router } from "express";
import { strToU8, zipSync } from "fflate";
import { orchestrateBuild } from "../orchestrator/orchestrator.js";
import { createBuildContext } from "../context/contextBuilder.js";
import { executeEdit } from "../agents/edit/editAgent.js";
import { executeAudit } from "../agents/audit/auditAgent.js";
import { executeRuntimeRepair } from "../runtime/runtimeRepairAgent.js";
import { callAI } from "../agents/llm/aiService.js";
import { validateFiles } from "../runtime/runtimeValidator.js";
import * as runtimeManager from "../runtime/runtimeManager.js";
import { buildRuntimeDependencyGraph, resolveImports, resolveComponents, resolveRoutes, resolvePackages } from "../runtime/dependencyResolverV2.js";
import { TEMPLATE_LIBRARY_SERVER, TEMPLATE_MATCH_KEYWORDS, serverMatchTemplate, buildTemplateContextServer } from "../agents/templates/templateAgent.js";
import { sse } from "../agents/streaming/sseManager.js";
import { checkBuildLimit, extractUserId, recordBuildStarted, recordBuildCompleted } from "../limits/userLimits.js";
import { checkTokenBudget } from "../cost/tokenBudget.js";
import { createLogger } from "../lib/structuredLogger.js";
```
- **`Router` (Express)** — Express.js ek popular Node.js web-framework hai. `Router()`
  se ek "mini-app" banate hain jisme routes (`GET`/`POST` URLs) define karte hain, phir
  ise main app me "mount" kar dete hain.
- `fflate` — Ek library jo ZIP files banata hai (project export/download feature ke
  liye — `/agents/export` route).
- Baaki imports alag-alag "specialist" modules hain — orchestrator (poora build-flow),
  edit agent, audit agent, runtime-repair agent, dependency-resolver, template-marketplace,
  user-limits (rate-limiting), token-budget (cost-control), logger.

```ts
const log = createLogger("AgentsRoute");
const router: Router = Router();
```
`createLogger("AgentsRoute")` — Ek "named" logger banaya, taaki jab bhi is file se koi
log-line print ho, wo `"AgentsRoute"` tag ke saath ho (debugging me pata chal jaaye log
kis file se aaya).

### Guard helpers — repeated safety-checks (lines 59-75)

```ts
function guardLimits(req, res): string | null {
  const userId = extractUserId(req);
  const limitCheck = checkBuildLimit(userId);
  if (!limitCheck.allowed) { res.status(429).json({ error: limitCheck.reason }); return null; }
  const budgetCheck = checkTokenBudget();
  if (!budgetCheck.allowed) { res.status(503).json({ error: budgetCheck.reason }); return null; }
  return userId;
}
```
Ye function har route me repeat hone wale 2 checks ko ek jagah rakhta hai:
1. **Rate-limit check** (`checkBuildLimit`) — Kya ye user aaj/is-ghante bahut zyaada
   builds already kar chuka hai? (Spam/abuse rokne ke liye.) Agar limit cross ho gaya,
   HTTP status **429** ("Too Many Requests") bhejo.
2. **Token-budget check** (`checkTokenBudget`) — Kya poore server ka AI-usage budget
   (paise/tokens) khatam ho gaya hai? Agar haan, **503** ("Service Unavailable") bhejo.

Agar dono pass ho jaayein, `userId` return karo. Agar koi fail ho, `null` return karta
hai — jo call karne wala route dekh ke turant `return` kar deta hai (kyunki response
already bheja jaa chuka hai — Express me ek request ka **sirf ek** response bhej sakte
ho, dobara bhejne se crash hota hai).

```ts
function openSse(res): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}
```
**SSE (Server-Sent Events)** — Ye ek web-standard hai jisse server, ek **single HTTP
connection ko khula rakh ke**, time-time par chhote-chhote "events" bhej sakta hai
(bina connection band kiye) — jaise ek "live news ticker". Isse hi "typing effect" aur
"build-progress steps" possible hote hain: server har step complete hone par ek event
bhejta hai, frontend use turant UI me dikha deta hai.
- `Content-Type: text/event-stream` — Browser ko batata hai "ye normal JSON response
  nahi hai, ye ek stream hai."
- `Cache-Control: no-cache` — Browser/proxy ise cache na kare.
- `Connection: keep-alive` — Connection band mat karo, khula rakho.
- `res.flushHeaders()` — Headers turant bhej do (data se pehle), taaki client turant
  samajh jaaye stream shuru ho gaya.

### `POST /agents/build` — Naya website generate karne ka main endpoint (lines 79-104)

```ts
router.post("/agents/build", async (req, res) => {
  const openrouterKey = process.env["OPENROUTER_API_KEY"];
  if (!openrouterKey) { res.status(500).json({ error: "OPENROUTER_API_KEY not set" }); return; }

  const { prompt, chatId: reqChatId } = req.body as { prompt: string; chatId?: string };
  if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }

  const userId = extractUserId(req);
  const limitCheck = checkBuildLimit(userId);
  if (!limitCheck.allowed) { res.status(429).json({ error: limitCheck.reason }); return; }
  const budgetCheck = checkTokenBudget();
  if (!budgetCheck.allowed) { res.status(503).json({ error: budgetCheck.reason }); return; }

  const chatId = reqChatId ?? `build-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ctx = createBuildContext({ prompt, chatId, userId, keys: { openrouterKey, groqKey: "" } });

  recordBuildStarted(userId);
  openSse(res);

  try {
    await orchestrateBuild(ctx, res);
  } finally {
    recordBuildCompleted(userId);
    res.end();
  }
});
```
**Yehi wo route hai jo tumhare `OPENROUTER_API_KEY` na hone ki wajah se abhi 500 error
deta hai** — pehli hi line check karti hai ki key hai ya nahi (jaisa maine pehle bataya
tha, is secret ke bina koi bhi build nahi ban sakta).

Line-by-line:
1. Key check — agar `OPENROUTER_API_KEY` environment-variable set nahi hai, turant error.
2. `req.body` se `prompt` (user ka message, jaise "ek bakery ki website banao") aur
   optional `chatId` nikalo. `as { prompt: string; chatId?: string }` — TypeScript ko
   batate hain request-body ka expected "shape".
3. Prompt khaali ho to `400` ("Bad Request").
4. Rate-limit aur budget check (jo `guardLimits` bhi karta, yahan manually inline likha
   hai — thoda duplicate code hai, lekin functionally same).
5. `chatId` na diya ho to naya random ID banao: `build-${timestamp}-${random-chars}`.
6. **`createBuildContext(...)`** — Ek "context object" banata hai jisme prompt, chatId,
   userId, aur API-keys sab ikattha hote hain — ye object aage poori pipeline me pass
   hota rehta hai (isse baar-baar wahi parameters alag-alag functions me pass nahi karne
   padte).
7. `recordBuildStarted(userId)` — Analytics/rate-limit counter badhao.
8. `openSse(res)` — SSE stream khol do.
9. **`await orchestrateBuild(ctx, res)`** — Yahi asli kaam hai! Ye function (dusri file
   me) poori 25-step AI pipeline chalata hai aur seedha `res` (response) me events likhta
   rehta hai jab tak build complete na ho.
10. `finally { recordBuildCompleted(userId); res.end(); }` — **`try/finally`** ka matlab:
    chahe pipeline safal ho ya error aaye, ye block **hamesha** chalega — counter update
    karo aur connection band karo (`res.end()`).

### Baaki routes (summary, in-depth nahi kar rahe kyunki pattern same hai)

- **`POST /agents/audit`** — Ek prompt lekar sirf ek quality-report deta hai (bina
  poora website banaye) — normal JSON response, SSE nahi.
- **`POST /agents/export`** — Frontend se project-files lekar unhe ek **ZIP file** me
  bandh ke download karwata hai (`fflate` library se). `zipData[key] = strToU8(content)`
  — string ko binary format (`Uint8Array`) me convert karke zip me daalta hai.
- **`POST /agents/edit`** — Existing project me changes karne ka route — same guard-
  pattern, phir `executeEdit(...)` ko delegate.
- **`POST /agents/runtime-repair`** — Agar generated website me runtime-error aaye
  (browser me crash ho), ye route AI se sirf us specific error ko fix karwata hai.
  Interesting check: `if (repairAttempt >= 3) { ...max attempts reached...}` — infinite
  repair-loops se bachne ke liye ek **hard cap** (max 3 tries).
- **`GET /agents/repair-history/:chatId`** — Kisi chat ki repair-history/metrics nikalta
  hai (`runtimeManager` in-memory store se).
- **Template routes** (`/agents/templates`, `/match`, `/preview`, `/merge`) — Ek
  "template marketplace" feature: pre-made project-templates ki list, prompt ke hisaab
  se best-match template dhoondhna, do templates ko "merge" karna (weighted-average se
  DNA-percentage nikalna) — ye Part 2 me dekhe `TEMPLATE_LIBRARY`/`templateMarketplace`
  se connect hota hai frontend side par.
- **`POST /agents/autonomous-build`** (lines 356-556) — Ye wahi endpoint hai jo
  `useAppStore.ts` ke `handleDone` me build complete hone ke baad **background me**
  automatically call hota hai (V6.2 Autonomous Runtime Builder — memory-notes me tha).
  Iske 10 phases hain, sabko SSE events se report kiya jaata hai:
  1. **Dependency Intelligence** — Files ke beech imports/dependencies ka graph banao
  2. **Import Resolver** — Missing imports auto-detect/inject karo
  3. **Component Resolver** — Kya sab referenced components exist karte hain?
  4. **Route Resolver** — Kya sab routes sahi hain?
  5. **Package Resolver** — Kya sab npm-packages `package.json` me hain?
  6. **Runtime Sandbox** — Static validation chalao (syntax/JSX errors dhoondo)
  7. **Autonomous Build Loop** (max 5 passes) — Jab tak health-score ≥95 na ho ya
     failures khatam na ho jaayein, failing files ko AI se **repair** karwate raho
     (`callAI(...)` — ek chhota, targeted prompt: "sirf ye issues fix karo, poori file
     wapas do")
  8. **Runtime Health V3** — Final health-score calculate karo (kai factors ka weighted
     average)
  9. **Runtime Timeline** — Poore process ka ek "timeline" record banao (audit-trail)
  10. **Preview Gate** — Agar health ≥90 nahi hai, ek aakhri "critical repair" try karo
      un files par jo abhi bhi fail ho rahi hain, phir gate pass/fail decide karo

  Ye poora "self-healing" system hai — matlab AI khud apni banayi hui galtiyaan pakad ke
  khud hi theek karne ki koshish karta hai, bina user ko dobara prompt likhna pade.

**`sseAB((data) => res.write(\`data: ${JSON.stringify(data)}\\n\\n\`))`** — Ye SSE ka
raw format hai: har event `"data: "` se shuru hoke `\n\n` (do newlines) se khatam hota
hai. Frontend (jaisa humne `useAppStore.ts` me dekha) isi format ko `split('\n\n')` se
wapas todta hai.

---

## 4.2 `artifacts/api-server/src/agents/pipeline/buildPipeline.ts` (460 lines) — Poori AI pipeline ka "conductor"

Ye file, `orchestrateBuild` ke andar se call hoke, **poori 25-step generation pipeline**
chalati hai. File ke top comment me pura naksha diya hai:

```
0    ProductManager         — static product strategy
0.5  FrontendArchitect      — static frontend blueprint
0.6  BackendArchitect       — static backend blueprint (+ security)
0.7  DevOpsArchitect        — static devops blueprint
0.8  QAArchitect            — static QA/reliability blueprint
0.9  RuntimeIntelligence    — generation strategy brain (no LLM)
0.92 Orchestrator           — adaptive execution planning (no LLM)
0.95 ModelOrchestrator      — model/resource routing (no LLM)
0.97 KnowledgeEngine        — knowledge intelligence (no LLM)
0.99 ReasoningEngine        — reasoning/decision brain (no LLM)
1    Planner                — intent analysis, blueprint, DNA composition
2    Architecture           — project blueprint, tech stack
3    ComponentTree          — full page tree (deterministic, inline)
4    Frontend               — React/Tailwind code generation
5    CandidateSelection     — A/B/C candidates, evaluator picks best
6    Repair                 — code-fix / quality gate
7    DesignEvaluator        — 15-dimension quality scoring
8    DesignCritic           — senior-designer review + repair
9    ConversionIntelligence — CRO (conversion-rate) analysis + repair
10   Accessibility          — WCAG 2.1 AA evaluation + repair
11   Optimization           — bundle + render efficiency
12   Backend (Scaffold)     — API routes, DB schema, auth files
13   RuntimeValidation      — real npm install + Vite build + self-healing
```

**Naya concept: "no LLM" wale steps kya hote hain?** Har step AI (LLM = Large Language
Model) ko call nahi karta. Kai steps (`ProductManager` se le kar `ReasoningEngine` tak,
aur `ComponentTree`) sirf **JavaScript ka deterministic logic** chalate hain — rules,
scoring-formulas, static templates — bina kisi AI-API-call ke. Ye 2 wajah se accha hai:
1. **Fast** — AI call me seconds lagte hain, plain code me milliseconds
2. **Free** — koi token/cost nahi lagta
3. **Predictable** — same input par hamesha same output (AI thoda random/unpredictable
   ho sakta hai)

Jo steps waaki bacha ke rakhte hain AI-calls ke liye — jaise `Planner`, `Frontend`,
`Repair`, `DesignCritic` — wahi asli "creative" kaam karte hain jaha AI ki zaroorat
padti hai (jaise poori website ka React code likhna).

### `runBuildPipeline` function ka structure

```ts
export async function runBuildPipeline(input: BuildPipelineInput, res: Response): Promise<void> {
  const { prompt, chatId, keys } = input;
  const buildId = chatId;

  const trace = withBuildId(createTraceContext({ requestId: chatId }), buildId);
  setLogContext({ traceId: trace.traceId, requestId: trace.requestId, buildId });
  recordBuildStart(buildId, trace, prompt);

  try {
    // ... 20+ steps, ek ke baad ek, `await` se ...
  } catch (err) {
    const e = err as Error;
    recordBuildFailure(buildId, e?.message);
    throw err;
  } finally {
    clearLogContext();
  }
}
```
- **`createTraceContext` / `withBuildId` / `setLogContext`** — Ye **"observability"**
  (system ko monitor karne) ka setup hai. Har build ko ek unique "trace ID" milta hai,
  jo saare logs me attach ho jaata hai — isse agar kabhi debug karna pade "is specific
  build me kya hua", saare related logs ek saath dhoondh sakte ho.
- **`try { ... } catch { ... } finally { ... }`** — Poori pipeline ek bade try-block me
  hai. Agar kahin bhi koi step fail ho (`throw` kare), turant `catch` me chala jaata hai
  — jaha failure record hoti hai aur error **dobara throw** ki jaati hai (`throw err`) —
  taaki caller (yani `orchestrateBuild`/route) ko bhi pata chale aur wo user ko error
  dikha sake. `finally` hamesha chalta hai — log-context clear karna, chahe success ho
  ya fail.

### Har step ka common pattern

```ts
const productManagerOutput = await withAgentMetrics("ProductManager", () =>
  runProductManagerStep(prompt, buildId, res),
);
```
- **`withAgentMetrics(name, fn)`** — Ek "wrapper" function jo `fn()` ko chalata hai aur
  saath-saath uska **time kitna laga, kya result mila, koi error aaya** — sab measure
  karke telemetry (monitoring-system) me record karta hai. Isse baad me pata chal sakta
  hai "Frontend step average kitna time leta hai", "kaunsa step sabse zyada fail hota
  hai", etc. Ye ek **"decorator" / "higher-order function" pattern** hai — ek function
  jo doosre function ko "wrap" karke usme extra behavior (yahan: metrics) jod deta hai.
- Har step **agle step ka input** banata hai — jaise ek factory ki assembly-line. Isliye
  sequence important hai: `Architecture` ko `plan` chahiye (Planner ka output),
  `Frontend` ko `architecture` chahiye, etc.

### "Skip-gating" — Orchestrator kuch steps ko skip kar sakta hai (line 150 onwards)

```ts
const executionBlueprint = await runOrchestratorStep(buildId, res, runtimeIntelligenceOutput);
const skipped = new Set(executionBlueprint.skippedAgents);
...
const uxFrontend = skipped.has("UXIntelligence")
  ? repairedFrontend
  : await withAgentMetrics("UXIntelligence", () => runUXIntelligenceStep(repairedFrontend, buildId, res));
```
Step 0.92 (`Orchestrator`) decide karta hai — prompt ki complexity dekh ke — ki kaunse
"enrichment" steps (jaise `UXIntelligence`, `DesignCritic`, `ConversionIntelligence`,
`Accessibility`, `Optimization`, `DesignDirector`) **zaroori hain aur kaunse skip kiye jaa
sakte hain**. Agar user ne ek bahut simple website maangi hai (jaise "ek page ka landing
page"), to shayad `Accessibility` ka poora deep-analysis step overkill ho — usse skip
karke time/cost bachaya jaata hai. `Set` (JavaScript data-structure) me skip-list rakhi
hai, `.has(name)` se fast check hota hai.

Har skip ke saath ye **ternary pattern** hai: `condition ? valueIfTrue : valueIfFalse`
— agar step skip hua hai to previous step ka output hi seedha aage bhej do
("pass-through"), warna step ko chalao.

### Component Tree — deterministic step (lines 202-210)

```ts
const componentTree = buildComponentTree({ plan, architecture, buildId: chatId });
const treeValidation = validateTree(componentTree);
recordTreeBuild(componentTree, treeValidation.score, treeValidation.errors.length, treeValidation.warnings.length);
```
Ye **`await` nahi hai** — kyunki `buildComponentTree` ek plain synchronous function hai
(no LLM call, jaisa upar bataya). Ye page ka poora **component-hierarchy** decide karta
hai (jaise: Navbar → Hero → Features → Pricing → Footer, kaunsa component kaunse
"catalog" se aayega) — is tree ke hisaab se hi Step 4 (`Frontend`) actual code likhta
hai.

### Multi-candidate generation aur repair (lines 217-226)

```ts
const { winner } = await withAgentMetrics("CandidateSelection", () =>
  runCandidateSelectionStep(frontend, prompt, keys, res, buildId, runtimeIntelligenceOutput.blueprint),
);
const repairedFrontend = await withAgentMetrics("Repair", () =>
  runRepairStep(winner, keys, res, runtimeIntelligenceOutput.blueprint),
);
```
Memory-notes ke hisaab se (V7.2.0): AI **3 alag versions** (A/B/C) generate karta hai
website ke, phir ek "evaluator" (Step 7 ka precursor) unme se **best wala chunta hai**
(`winner`) — jaise 3 designers se kaam karwa ke best design choose karna. Fir us winner
ko `Repair` step me bheja jaata hai jaha syntax-errors/bugs fix hote hain.

### Final "done" event — poora result frontend ko bhejna (lines 343-396)

```ts
sse(res, {
  type: "done",
  code: directedFrontend.fixedCode,
  plan: cleanPlan,
  blueprint,
  files: runtimeResult.allFiles,
  dnaComposition, sectionOwnership: dnaOwnership, themeTokens: dnaTheme, motionProfile: dnaMotion,
  knowledgeGraph: backend.knowledgeGraph,
  accessibilityScore: accessibilityScore81, optimizationScore: optimizationScore81,
  directorScore: directorScore83,
  productPlan: productManagerOutput.productPlan, productScore: productManagerOutput.productScore,
  architectureBlueprint: frontendArchitectOutput.blueprint, architectureScore: frontendArchitectOutput.overallScore,
  backendBlueprint: backendArchitectOutput.blueprint, backendArchitectureScore: backendArchitectOutput.overallScore,
  devopsBlueprint: devopsArchitectOutput.blueprint, devopsArchitectureScore: devopsArchitectOutput.overallScore,
  qaBlueprint: qaArchitectOutput.blueprint, qaArchitectureScore: qaArchitectOutput.overallScore,
  securityBlueprint: backendArchitectOutput.blueprint.securityIntelligence, ...
  runtimeBlueprint: runtimeIntelligenceOutput.blueprint, runtimeScore: runtimeIntelligenceOutput.overallScore,
  executionBlueprint, orchestratorComplexity: executionBlueprint.complexity, orchestratorSkippedAgents: executionBlueprint.skippedAgents,
  modelBlueprint, modelOrchestratorBudget: modelBlueprint.totalTokenBudget, ...
  knowledgeBundleTargets: Object.keys(knowledgeStepOutput.bundles),
  reasoningBlueprint: reasoningStepOutput.blueprint, ...
});
```
Jab **saare 20+ steps** complete ho jaayein, ek aakhri **`"done"` type ka SSE event**
bheja jaata hai jisme **har step ka output** ikattha hota hai — final code, files,
design-DNA, aur har architecture-planner (product/frontend/backend/devops/QA/security/
runtime/orchestrator/model/knowledge/reasoning) ka blueprint aur score. Frontend
(`useAppStore.ts` ka `mockStreamResponse`/`mockEditResponse` — jo hum agle part me
dekhenge) is event ko sunkar `handleDone(...)` call karta hai jo humne Part 2 me dekha
tha.

### Fire-and-forget learning (lines 398-452)

```ts
finalizeOrchestratorExecution(res, executionBlueprint, evalRes?.overallScore ?? directorScore83, Date.now() - pipelineStart);
finalizeModelOrchestratorExecution(res, modelBlueprint, ...);
finalizeKnowledgeEngineExecution(res, buildId, ...);
finalizeReasoningEngineExecution(res, buildId, reasoningStepOutput.blueprint, ...);

setImmediate(() => {
  try {
    learnFromBuild({ dnaId: primaryBrand81, evaluatorScore: ..., accessibilityScore: ..., ... , success: true });
  } catch { /* DNA learning must never throw into the pipeline */ }
});
```
Ye response bhej dene ke **baad** chalte hain — inka result user ko turant nahi chahiye,
ye sirf system ko "seekhne" ke liye hain (kaunse design-patterns achhe score karte hain,
future builds me unhe zyaada use karo). **`setImmediate(fn)`** — Node.js ka ek function
jo `fn` ko "jitni jaldi ho sake, lekin abhi chal rahe code ke baad" chalata hai — taaki
ye learning-logic user ke response ko **delay na kare** (fire-and-forget pattern). Andar
`try/catch` bhi laga hai taaki agar learning-code me koi bug ho, to bhi poori pipeline
crash na ho — comment khud kehta hai *"must never throw into the pipeline"*.

**Summary Part 4:** `routes/agents.ts` HTTP requests leta hai, safety-checks karta hai,
SSE stream khol ke `buildPipeline.ts` (ya edit/audit/repair agents) ko kaam de deta hai.
`buildPipeline.ts` 20+ steps ko **ek fixed sequence me chalata hai**, kuch steps
LLM-based hain (creative kaam), kuch "no-LLM" static-logic hain (planning/scoring/
routing), aur beech-beech me Orchestrator decide karta hai kaunse "extra polish" steps
zaroori hain is specific project ke liye. Aakhir me sab kuch ek `"done"` SSE event me
frontend ko bhej diya jaata hai.

---

 = ant tak, `i` flag =
case-insensitive).

### Code Fix Agent (lines 290-304)

```ts
sse(res, { type: "step", step: 4, agent: "Code Fix Agent", status: "active" });
let fixedCode = generatedCode;
try {
  const codeFix_userRaw = `Fix this React website code (keep all ${sectionCount} sections intact — do NOT add or remove any sections):\n\n${generatedCode}`;
  const { system: cfSystem, user: cfUser } = truncateForGroq(CODEFIX_SYSTEM, codeFix_userRaw, 5_000);
  const fixed = await callAI(openrouterKey, [...], { label: "codefix", maxTokens: 5_000 });
  if (fixed && fixed.length > 200) {
    fixedCode = fixed.replace(/^```.../, "").replace(/\n?```\s*$/i, "").trim();
  }
} catch (e) { log.error("CODEFIX_AGENT_FAILED", { error: String(e) }); }
```
Ek **doosri AI-call** hoti hai jiska sirf ek kaam hai — jo pehli call se code aaya, usme
**syntax-errors/bugs dhoondh ke fix** karo (bina naye sections jodhe/hataye — explicit
instruction diya gaya hai). `truncateForGroq(...)` — agar code bahut bada ho (token-limit
se zyaada), ise "truncate" (kaat) kiya jaata hai taaki AI-call fail na ho.
- `if (fixed && fixed.length > 200)` — **safety check**: agar AI ka jawab bahut chhota
  hai (jaise sirf "Sorry I can't help"), to use ignore karo aur **original code hi
  rakho** (better to keep flawed-but-complete code than replace it with garbage).

### Final step — files banana (lines 306-322)

```ts
const projectFiles = buildServerProjectFiles(fixedCode, projectBlueprint, blueprint.sectionOrder);
return { architecture: arch, design, designAgentStatus, designAgentError, projectFiles, fixedCode, ..., registrySelection, retrievalContext: retrievalCtx, retrievalReferenceIds, componentTree: tree, tokenSet };
```
`buildServerProjectFiles` — Ek bada single-file-code (`fixedCode`) ko **multiple project
files** (jaise `App.tsx`, `components/Hero.tsx`, `components/Pricing.tsx`) me split
karta hai (Multi-File Foundation, memory-note V-multifile). Ye poora bada object return
hota hai jo agle steps (`CandidateSelection` → `Repair` → `DesignEvaluator`) ko chahiye.

---

## 5.3 `designEvaluatorStep.ts` (422 lines) — Step 7: "Quality inspector" jo score deta hai aur khud repair bhi karwata hai

Ye step generated website ko **15-dimension score** deta hai (0-10 scale par), aur agar
score kam ho to **automatically repair-loop** chalata hai jab tak achha score na aa
jaaye (ya max attempts khatam na ho jaayein).

### `EvaluatorResult` — Sab dimensions ki list (lines 30-67)

```ts
export interface EvaluatorResult {
  overallScore: number;
  heroScore: number; layoutScore: number; ctaScore: number; accessibilityScore: number;
  shadcnScore: number; consistencyScore: number; navigationScore: number; accountMenuScore: number;
  authNavbarAlignmentScore: number; dashboardScore: number; formScore: number; motionScore: number;
  dnaQualityScore: number; treeQualityScore: number; tokenQualityScore: number; visualQualityScore: number;
  uxPredictionScore: number;
  coverageScore: number; coveragePercent: number;
  componentUsage: Record<string, number>;
  issues: EvaluationIssue[];
  repairCount: number; repairApplied: boolean;
  componentsUsed: Array<{ componentId: string; category: string }>;
  referencesUsed: string[];
  scoreBeforeRepair: number; scoreAfterRepair: number; retrievalImpactScore: number;
  weightsApplied: Record<string, number>; dynamicWeightsUsed: boolean;
}
```
Ye interface saara evaluator-history dikhata hai — memory-notes se pata chalta hai ye
saare dimensions alag-alag versions me add hote gaye (hero/layout/cta/accessibility/
shadcn/consistency V7.1.4 me, navigation V7.2.5, accountMenu V7.2.6, dashboard V7.2.7,
form V7.2.8, motion V7.2.9, tree V7.3.2, token V7.3.3, visual V7.3.4, ux V8.2). Ye
"**incremental feature-growth**" ka accha example hai — system dheere-dheere zyaada
sophisticated hota gaya, har naya score-dimension apni file/module me implement hoke
yahan jod diya gaya.

### `runDesignEvaluatorStep` — Adaptive threshold/passes (lines 91-119)

```ts
const evalThreshold  = runtimeBlueprint?.evaluationStrategy.threshold ?? REPAIR_THRESHOLD;
const maxRepairPasses = runtimeBlueprint?.repairStrategy.policy === 'skip'
  ? 0
  : (runtimeBlueprint?.evaluationStrategy.isStrict ? MAX_DESIGN_REPAIR_PASSES + 1 : MAX_DESIGN_REPAIR_PASSES);
const runtimeWeights = runtimeBlueprint?.evaluationStrategy.weights;
```
Yahan **Part 4 me dekha `RuntimeIntelligence` step** (0.9) ka output use ho raha hai —
`runtimeBlueprint`. Ye ek "smart brain" hai jo build-request ki complexity dekh ke decide
karta hai:
- `threshold` — Is build ko kitna score chahiye pass hone ke liye (default `8.0`, lekin
  simple builds ke liye kam, enterprise-grade builds ke liye zyaada strict ho sakta hai)
- `maxRepairPasses` — Agar policy `'skip'` hai (jaise bahut simple prompt), koi repair
  bilkul mat karo (`0`); agar "strict" mode hai, ek extra pass do (`MAX + 1`)
- `weights` — Kaunsa dimension zyaada important hai is specific project-type ke liye
  (jaise ek e-commerce site ke liye "cta score" zyaada weight, ek dashboard ke liye
  "navigation score" zyaada weight) — **weighted average** se `overallScore` calculate
  hota hai, static-fixed-weights ki jagah dynamic.

`??` (**nullish coalescing operator**) — `a ?? b` ka matlab "agar `a` `null`/`undefined`
hai to `b` use karo, warna `a`". `?.` (optional chaining, hum pehle dekh chuke) ke saath
mil ke ye safe access dete hain jab `runtimeBlueprint` khud `undefined` ho sakta hai.

### Repair loop — "jab tak achha na ho, sudharte raho" (lines 153-223)

```ts
while (evalResult.overallScore < evalThreshold && repairCount < maxRepairPasses) {
  repairCount++;
  sse(res, { type: "design_repair_start", pass: repairCount, ... });

  const repairResult = await runDesignRepair({
    code: currentCode, issues: evalResult.issues, scores: evalResult, openrouterKey, designDNA: design, pass: repairCount,
  });

  if (repairResult.attempted && !repairResult.error) {
    const prevScore = evalResult.overallScore;
    currentCode = repairResult.code;
    repairApplied = true;
    evalResult = evaluateDesign({ code: currentCode, sectionOrder: blueprint.sectionOrder, designDNA: design, authState, runtimeWeights });
    const improvement = Math.round((evalResult.overallScore - prevScore) * 10) / 10;
    sse(res, { type: "design_repair_done", pass: repairCount, prevScore, newScore: evalResult.overallScore, improvement, ... });
  } else {
    sse(res, { type: "design_repair_done", pass: repairCount, ..., error: repairResult.error, ... });
    break;
  }
}
```
**`while` loop** — Ek loop jo tab tak chalta rehta hai jab tak condition true rahe. Yahan
condition: "score threshold se kam hai **AND** abhi tak max-passes khatam nahi hue." Har
iteration me:
1. `evaluateDesign(...)` (pure function, no LLM — sirf code ko "parse/scan" karke
   heuristics se score deta hai — jaise "kya `<Button>` component use hua", "kya
   accessibility attributes hain", etc.) — pehle se chal chuka hota hai loop se pehle bhi.
2. `runDesignRepair(...)` (ye AI-call karta hai — issues ki list leke AI se bolta hai
   "in specific problems ko fix karo") — naya `code` deta hai.
3. Naye code par **dobara** `evaluateDesign(...)` chalao — dekho score sudhra ya nahi.
4. Agar repair "attempt" hi nahi ho paya (error aaya), `break` kar do loop se bahar
   (aage try karne ka koi fayda nahi).

Ye ek **classic "improve-and-recheck" loop pattern** hai — jaise ek teacher jo essay
check karke feedback deta hai, student sudhaarta hai, teacher dobara check karta hai,
jab tak grade achha na aa jaaye ya attempts khatam na ho jaayein.

### Telemetry recording — "system khud se seekhta hai" (lines 225-328)

Is section me bahut saare `record*(...)` function-calls hain: `recordEvaluatorScore`,
`recordDashboardScore`, `recordFormScore`, `recordBuildOutcome`, `recordSectionOutcome`,
`recordComponentBuildResult`. Ye sab **analytics/learning-loop** ke liye data save karte
hain — jaise:
```ts
const referencesUsedIds = frontend.retrievalReferenceIds ?? [];
if (referencesUsedIds.length > 0) {
  recordBuildOutcome(referencesUsedIds, initialScore, evalResult.overallScore, repairApplied);
  for (const refId of referencesUsedIds) {
    const sectionType = normalizeSectionType(refId);
    if (sectionType) recordSectionOutcome({ referenceId: refId, sectionType, overallScore: evalResult.overallScore, ... });
  }
}
```
Jo Design-RAG references is build me use hue the (Part 5.2 me dekha `retrievalReferenceIds`),
unka **outcome record** kiya jaata hai — "is reference ko use karke jo build bana, uska
final score kya tha." Memory-note V7.1.9 ("RAG Feedback Loop") ke hisaab se, ye data
future me use hota hai — jo references baar-baar **achhe scores** dete hain, unhe
"promote" kiya jaata hai (zyaada priority milti hai future selections me), jo baar-baar
kharab result dete hain unhe "demote" (kam priority). Ye ek **self-improving system**
hai — jitna zyaada log VoxAI use karte hain, utna hi system apni-khud ki library
improve karta jaata hai kaunse design-patterns kaam karte hain.

### Multiple quality-dimensions ko combine karna (lines 337-421)

```ts
const treeQualityScore = scoreTree(frontend.componentTree);
const tokenValidation = validateTokenUsage(currentCode);
const tokenQualityScore = tokenValidation.tokenQualityScore;
const visualAnalysis = analyzeVisuals(currentCode, blueprint.sectionOrder, buildId, buildId);
const visualQualityScore = visualAnalysis.visualScore;

const uxReport = (frontend as unknown as { uxReport?: UXReport }).uxReport;
const uxPredictionScore = uxReport?.overallUXScore ?? 5.0;
const UX_BLEND_WEIGHT = 0.04;
const blendedOverallScore = uxReport
  ? Math.round((evalResult.overallScore * (1 - UX_BLEND_WEIGHT) + uxPredictionScore * UX_BLEND_WEIGHT) * 10) / 10
  : evalResult.overallScore;
```
Yahan **teen alag-alag scoring-systems** (Component Tree quality, Design Token usage,
Visual/code-structure analysis) ke scores nikaal ke ek final `evaluationResult` me jode
jaate hain. Aakhri me **UX Intelligence** ka score bhi (agar wo step chala tha, skip
nahi hua) ek **weighted blend** se `overallScore` me mix kiya jaata hai:
`(mainScore × 0.96) + (uxScore × 0.04)` — matlab UX-score ka sirf **4% asar** hota hai
final number par, baaki 96% wahi `evaluateDesign()` ka result hai. Ye ek design-decision
hai: UX-prediction ko "consider karo lekin dominate mat karne do."

```ts
const updatedFrontend: FrontendOutput = repairApplied ? { ...frontend, fixedCode: currentCode } : frontend;
return { ...updatedFrontend, evaluationResult };
```
**Spread operator (`{ ...frontend, fixedCode: currentCode }`)** — Ek naya object banaya
jo `frontend` ke saare fields copy karta hai, lekin `fixedCode` ko naye (repaired) code
se overwrite kar deta hai. Agar repair hua hi nahi tha (`repairApplied` false), to
original `frontend` object hi wapas use ho jaata hai (koi unnecessary copy nahi). Ye
**immutability pattern** hai — React/modern-JS me states/objects ko directly modify
karne ke bajaye hamesha "naya version" banate hain.

**Summary Part 5:** `Planner` AI se ek text-plan mangwata hai, usme se regex/JSON-parsing
se structured data nikaalta hai, DNA-mixing aur auth-classification karta hai. `Frontend`
step teen mini-AI-calls karta hai (Design-DNA → verify/retry → poora website-code → bug-
fix), aur poora "context injection" karta hai (RAG, tree, tokens, motion) taaki AI ka
output high-quality ho. `DesignEvaluator` code ko scan karke 15+ dimensions par score
deta hai, kam-score hone par khud AI se repair karwata hai loop me, aur har outcome ko
telemetry me record karta hai taaki system time ke saath aur behtar hota jaaye.

---

*(Ab tak 5 parts complete: Frontend startup, App data-layer, Chat UI, Backend
entry+orchestration, aur teen core pipeline-steps (Planner/Frontend/DesignEvaluator).
Agla natural step ho sakta hai: baaki pipeline-steps — Architecture, CandidateSelection,
Repair, DesignCritic, ConversionIntelligence, Accessibility, Optimization, Backend-
scaffold, RuntimeValidation — ya phir frontend ke baaki components, ya database/auth.
Jab ready ho "agla part karo" bol dena.)*
