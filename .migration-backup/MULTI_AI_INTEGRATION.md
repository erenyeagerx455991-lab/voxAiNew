# VoxAI - Multi-AI Platform Integration Guide

## Overview
VoxAI has been upgraded from a single-AI system to a **modular multi-AI platform** with clear separation of concerns:

- **Groq API** → Chat intelligence (fast, low-latency conversation)
- **Browser Web Speech API** → Text-to-speech (client-side native synthesis)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                       │
├─────────────────────────────────────────────────────────────┤
│  ChatView                          TextToSpeechView         │
│  (streaming Groq responses)        (Web Speech API)         │
└─────────────┬──────────────────────┬──────────────────────┘
              │                      │
       ┌──────▼──────┐      ┌────────▼─────────┐
       │ /api/chat   │      │ /api/tts         │
       │ (Groq API)  │      │ (Logging only)   │
       └──────┬──────┘      └────────┬─────────┘
              │                      │
       ┌──────▼──────────────────────▼──────┐
       │      Supabase                      │
       │  - Chat history storage            │
       │  - Messages table                  │
       │  - User auth & profiles            │
       │  - TTS history (optional)          │
       └─────────────────────────────────────┘
```

## Integration Details

### 1. Chat System (Groq API)

**Location:** `/supabase/functions/chat/index.ts`

**How it works:**
1. User sends a message in ChatView
2. Frontend calls `/api/chat` edge function with message and chat ID
3. Edge function:
   - Authenticates user via JWT
   - Saves user message to Supabase
   - Fetches previous conversation history
   - Sends to Groq API with system prompt
   - Streams response back to frontend via Server-Sent Events (SSE)
   - Saves assistant response to Supabase
   - Deducts credits

**Configuration:**
```bash
# In .env
GROQ_API_KEY=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
```

**Model Used:** `mixtral-8x7b-32768` (fast, efficient)

**Key features:**
- Streaming responses for real-time user feedback
- Context-aware conversations using message history
- Automatic credit deduction
- Chat title auto-generation
- Error handling with user-friendly messages

### 2. Text-to-Speech (Browser Web Speech API)

**Location:** `/src/components/TextToSpeechView.tsx`

**How it works:**
1. User enters text and selects a browser voice
2. Clicks "Speak" button
3. Uses browser's native Web Speech API (`SpeechSynthesis`)
4. Voice options include:
   - English (US, UK, Australian)
   - Spanish, French, German, Italian
   - Japanese, Mandarin, Korean
   - More based on browser/OS support
5. Optional: Speech rate and pitch adjustment
6. Optional: Endpoint `/api/tts` logs usage for analytics (non-critical)

**Features:**
- **No external API calls** (purely client-side)
- **No credit deduction** (uses browser resources)
- Multiple language support
- Voice preview capability
- Rate control (0.5x - 2x)
- Pitch control (0.5x - 2x)
- Play/Stop controls

**Browser Compatibility:**
- Chrome, Edge, Safari (all modern versions)
- Firefox (with limitations)
- Mobile browsers (varies)

### 3. Supabase Integration

Both systems use Supabase for data persistence:

**Chat System:**
- Saves user messages to `messages` table
- Saves assistant responses to `messages` table
- Updates `chats` table with title (auto-generated from first message)
- Deducts credits via `deduct_credits()` RPC function
- Uses Supabase auth for user identification

**TTS System:**
- Optional logging to `tts_history` table (non-blocking)
- No credit system (uses browser TTS)
- User context via JWT auth

## API Routes

### POST `/api/chat`
**Purpose:** Stream Groq chat responses

**Request:**
```json
{
  "chatId": "uuid",
  "message": "Your message here"
}
```

**Response:** Server-Sent Events (SSE)
```
data: {"type":"token","text":"Hello"}
data: {"type":"token","text":" there"}
data: {"type":"done","messageId":"uuid","userMessageId":"uuid"}
```

**Errors:**
```json
{"error":"Groq API key not configured","userMessageId":"uuid"}
```

### POST `/api/tts`
**Purpose:** Log TTS usage (optional)

**Request:**
```json
{
  "text": "Text to synthesize",
  "voiceName": "en-us-1"
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "text": "Text to synthesize",
  "voice_name": "en-us-1",
  "audio_url": "",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Feature Isolation

### Chat Feature USES:
- ✅ Groq API
- ✅ Supabase for message storage
- ✅ Chat history context
- ✅ Credit system

### Chat Feature DOES NOT USE:
- ❌ Browser TTS
- ❌ Voice cloning
- ❌ TTS endpoint
- ❌ Audio playback

### TTS Feature USES:
- ✅ Browser Web Speech API
- ✅ No external services
- ✅ Browser resources

### TTS Feature DOES NOT USE:
- ❌ Groq API
- ❌ Chat history
- ❌ Credit system
- ❌ External TTS services

## Extending the Platform

To add more AI providers in the future:

### Adding a new Chat Provider (e.g., OpenAI, Claude)
1. Create new edge function: `/supabase/functions/chat-{provider}/index.ts`
2. Implement the same streaming pattern
3. Keep the same SSE response format
4. Update `chatService.ts` to route to the new provider
5. No UI changes needed

### Adding a new TTS Provider (e.g., ElevenLabs)
1. Create new edge function: `/supabase/functions/tts-{provider}/index.ts`
2. Implement API call to external TTS service
3. Return audio URL in response
4. Update `TextToSpeechView.tsx` to use new endpoint
5. Add option to switch providers in UI

## Environment Variables

Required `.env` file:
```bash
# Supabase (public, can be in .env)
VITE_SUPABASE_URL=https://okppsowuaesxheggehfx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Groq API (private, server-side only in edge functions)
GROQ_API_KEY=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
```

**Security Note:** The `GROQ_API_KEY` is NEVER exposed to the frontend. It's only used in the edge function which runs server-side.

## Error Handling

### Chat Errors
- **Rate limit (429):** User sees "Service busy, please try again"
- **Auth errors (401):** User redirected to login
- **Network errors:** User sees error message, user message is preserved
- **Groq API down:** Clear error message, partial response saved if available

### TTS Errors
- **Browser doesn't support:** Graceful error message
- **Voice not available:** Uses browser default voice
- **Speech interrupted:** Stop button cancels immediately

## Performance Considerations

### Chat Streaming
- Uses Server-Sent Events for efficient real-time streaming
- Chunks responses as they arrive from Groq
- No polling, pure push-based architecture
- Typical latency: 2-5 seconds for first token

### TTS Performance
- **Zero network latency:** Runs in browser
- **Instant playback:** No download/wait time
- **Memory efficient:** Uses browser's native synthesis
- Works offline (no internet required)

## Security Features

✅ **Chat:**
- JWT authentication on all endpoints
- GROQ_API_KEY never exposed to frontend
- User can only access their own chat history (RLS)
- Rate limiting via Groq (built-in)

✅ **TTS:**
- Web Speech API is sandboxed by browser
- No API keys exposed
- Works entirely client-side
- No network requests (except optional logging)

## Testing

### Chat System
```bash
# Send a test message and verify:
# 1. Message appears in chat
# 2. Groq responds with streaming tokens
# 3. Response is saved to database
# 4. Credits are deducted
# 5. Chat title is auto-generated
```

### TTS System
```bash
# Test voice synthesis:
# 1. Select a voice
# 2. Enter text
# 3. Click "Speak"
# 4. Verify audio plays in browser
# 5. Adjust rate/pitch
# 6. Verify preview works
```

## Future Improvements

- [ ] Add OpenAI API as alternative chat provider
- [ ] Add Claude API as alternative chat provider
- [ ] Add ElevenLabs as premium TTS provider
- [ ] Add voice clone training
- [ ] Add audio file download for TTS
- [ ] Add conversation branching
- [ ] Add prompt templates
- [ ] Add conversation export/import

## Troubleshooting

**Chat not working?**
- Check `GROQ_API_KEY` is set in `.env`
- Verify user is authenticated
- Check browser console for errors
- Verify Supabase connection

**TTS not working?**
- Check browser supports Web Speech API (should in all modern browsers)
- Verify audio output is not muted
- Try a different voice/language
- Check browser console for errors

**Messages disappearing?**
- Old issue, now fixed. Messages stay even if Groq fails.
- User message always preserved in DB
- Error shown to user clearly

## Support

For issues or questions about the multi-AI integration:
1. Check the error message in the browser console
2. Verify all environment variables are set
3. Test individual providers in isolation
4. Check Supabase dashboard for data/logs
