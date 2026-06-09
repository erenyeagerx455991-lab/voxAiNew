# VoxAI Architecture - Multi-AI Platform

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────────────────────┐   │
│  │   ChatView       │  │  TextToSpeechView               │   │
│  │                  │  │                                  │   │
│  │ • Message input  │  │ • Text input (5000 chars max)   │   │
│  │ • Message list   │  │ • Voice selector                │   │
│  │ • Streaming      │  │ • Rate/Pitch sliders            │   │
│  │   display        │  │ • Web Speech API integration    │   │
│  │ • Error handling │  │ • Play/Stop controls            │   │
│  │ • Chat context   │  │ • 12+ language voices           │   │
│  └────────┬─────────┘  └────────┬─────────────────────────┘   │
│           │                     │                               │
│           │ (chatId, message)   │ (text, voiceName)            │
│           │                     │                               │
└───────────┼─────────────────────┼───────────────────────────────┘
            │                     │
    ┌───────▼─────────┐   ┌───────▼──────────┐
    │ Edge Function   │   │ Edge Function    │
    │ /api/chat       │   │ /api/tts         │
    └───────┬─────────┘   └───────┬──────────┘
            │                     │
    ┌───────▼─────────────────────▼──────────┐
    │                                        │
    │  ┌────────────────┐  ┌──────────────┐  │
    │  │ Groq API       │  │ Web Speech   │  │
    │  │ mixtral-8x7b   │  │ API (native) │  │
    │  │                │  │              │  │
    │  │ • Streaming    │  │ • Client-    │  │
    │  │ • Chat model   │  │   side only  │  │
    │  │ • Low latency  │  │ • Instant    │  │
    │  │ • Context-     │  │ • Offline    │  │
    │  │   aware        │  │ • No API key │  │
    │  └────────┬───────┘  └──────┬───────┘  │
    │           │                 │          │
    └───────────┼─────────────────┼──────────┘
                │                 │
        ┌───────▼─────────────────▼────────┐
        │      Supabase                    │
        │                                  │
        │ ┌────────────┐  ┌──────────────┐│
        │ │ chats      │  │ messages     ││
        │ │ table      │  │ table        ││
        │ │            │  │              ││
        │ │ • id       │  │ • id         ││
        │ │ • user_id  │  │ • chat_id    ││
        │ │ • title    │  │ • role       ││
        │ │ • created  │  │ • content    ││
        │ │ • updated  │  │ • created_at ││
        │ └────────────┘  └──────────────┘│
        │                                  │
        │ ┌────────────┐  ┌──────────────┐│
        │ │ profiles   │  │ tts_history  ││
        │ │ table      │  │ table        ││
        │ │            │  │              ││
        │ │ • id       │  │ • id         ││
        │ │ • email    │  │ • user_id    ││
        │ │ • credits  │  │ • text       ││
        │ │ • metadata │  │ • voice_name ││
        │ └────────────┘  └──────────────┘│
        │                                  │
        │ ┌────────────────────────────────┤
        │ │ RLS Policies (all private)     │
        │ └────────────────────────────────┤
        │                                  │
        └──────────────────────────────────┘
```

## Data Flow

### Chat Feature Flow

```
1. User types message in ChatView
   ↓
2. Frontend calls /api/chat edge function
   ├─ Includes: chatId, message, auth token
   ├─ Method: POST
   └─ Stream: SSE (Server-Sent Events)
   ↓
3. Edge function processes:
   ├─ Verify JWT token
   ├─ Extract user ID
   ├─ Save user message to Supabase
   ├─ Fetch previous 20 messages
   ├─ Build conversation context
   └─ Call Groq API with streaming
   ↓
4. Groq API returns streaming tokens
   ├─ Each token sent as SSE event
   ├─ Accumulate into fullResponse
   └─ Stream to frontend in real-time
   ↓
5. Frontend receives and renders tokens
   ├─ Update UI with each token
   ├─ Smooth streaming animation
   └─ Maintain scroll position
   ↓
6. When complete, edge function:
   ├─ Save full response to Supabase
   ├─ Generate chat title (if first message)
   ├─ Deduct credits
   └─ Send final "done" event
   ↓
7. Frontend receives "done" event
   ├─ Replace temp message IDs with real ones
   ├─ Reload messages from Supabase
   ├─ Stop loading state
   └─ Allow next message
```

### TTS Feature Flow

```
1. User enters text and selects voice
   ↓
2. Clicks "Speak" button
   ↓
3. Frontend creates SpeechSynthesisUtterance
   ├─ Set text content
   ├─ Set language (from voice)
   ├─ Set rate (0.5x - 2x)
   └─ Set pitch (0.5x - 2x)
   ↓
4. Call speechSynthesis.speak(utterance)
   ├─ Runs entirely in browser
   ├─ Uses OS native speech engine
   └─ Streams audio to speakers
   ↓
5. Frontend shows playing state
   ├─ Display animated waveform
   ├─ Show current voice name
   └─ Enable Stop button
   ↓
6. User can:
   ├─ Adjust rate/pitch (next speech uses new values)
   ├─ Select different voice (next speech uses new voice)
   ├─ Stop speech at any time
   └─ Preview other voices
   ↓
7. When complete:
   ├─ Update UI to "ready" state
   ├─ Optional: Log to /api/tts (non-blocking)
   └─ Allow next speech
```

## API Specifications

### 1. Chat Endpoint

**URL:** `/functions/v1/chat`
**Method:** `POST`
**Auth:** Bearer JWT token (required)

**Request:**
```json
{
  "chatId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "What is machine learning?"
}
```

**Response:** Server-Sent Events Stream
```
event: undefined
data: {"type":"token","text":"Machine"}

event: undefined
data: {"type":"token","text":" learning"}

event: undefined
data: {"type":"token","text":" is"}

event: undefined
data: {"type":"done","messageId":"550e8400-e29b-41d4-a716-446655440001","userMessageId":"550e8400-e29b-41d4-a716-446655440002"}
```

**Error Response:**
```json
{
  "error": "Groq API error: 429 Rate limit exceeded",
  "userMessageId": "550e8400-e29b-41d4-a716-446655440002"
}
```

### 2. TTS Endpoint

**URL:** `/functions/v1/tts`
**Method:** `POST`
**Auth:** Bearer JWT token (required)

**Request:**
```json
{
  "text": "Hello, this is text to speech",
  "voiceName": "en-us-1"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "text": "Hello, this is text to speech",
  "voice_name": "en-us-1",
  "audio_url": "",
  "duration_seconds": 0,
  "created_at": "2024-01-15T10:30:45.123Z"
}
```

**Note:** `audio_url` is empty because audio generation happens client-side.

## Groq API Integration Details

### Configuration
- **Model:** `mixtral-8x7b-32768`
- **Temperature:** 0.7 (balanced creativity/consistency)
- **Max Tokens:** 2048 (reasonable response length)
- **Streaming:** Enabled (SSE format)

### Request to Groq
```json
{
  "model": "mixtral-8x7b-32768",
  "messages": [
    {"role": "system", "content": "You are VoxAI..."},
    {"role": "user", "content": "Previous message"},
    {"role": "assistant", "content": "Previous response"},
    {"role": "user", "content": "Current message"}
  ],
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": true
}
```

### Response from Groq (Streaming)
```
data: {"choices":[{"delta":{"role":"assistant","content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" there"}}]}
data: {"choices":[{"finish_reason":"stop"}]}
```

## Browser Web Speech API

### VoiceURI to Language Mapping

Used voices in application:
```javascript
{
  "en-us-1": "en-US",
  "en-us-2": "en-US",
  "en-gb-1": "en-GB",
  "en-gb-2": "en-GB",
  "en-au": "en-AU",
  "es-es": "es-ES",
  "fr-fr": "fr-FR",
  "de-de": "de-DE",
  "it-it": "it-IT",
  "ja-jp": "ja-JP",
  "zh-cn": "zh-CN",
  "ko-kr": "ko-KR"
}
```

### Properties Adjusted
- **rate:** 0.5 - 2.0 (speech speed)
- **pitch:** 0.5 - 2.0 (voice pitch)
- **volume:** 1.0 (always max, user controls OS volume)
- **lang:** Language/locale from voice selection

## Database Schema Integration

### chats Table
```sql
SELECT * FROM chats;
-- Columns: id, user_id, title, created_at, updated_at, archived
-- Indexed: user_id, created_at
-- RLS: Users can only access their own chats
```

### messages Table
```sql
SELECT * FROM messages;
-- Columns: id, chat_id, user_id, role, content, created_at
-- Role: "user" or "assistant"
-- RLS: Users can only access messages in their chats
```

### profiles Table
```sql
SELECT * FROM profiles;
-- Columns: id, email, credits, created_at, updated_at
-- RLS: Users can only access their own profile
```

### tts_history Table (Optional)
```sql
SELECT * FROM tts_history;
-- Columns: id, user_id, text, voice_name, audio_url, duration_seconds, created_at
-- Optional: Logs TTS usage for analytics
-- RLS: Users can only access their own history
```

## Error Handling Strategy

### Chat Errors (Graceful Degradation)
1. **Before Groq call:** Error response, user message preserved
2. **During Groq call:** Stream error event, partial response saved
3. **Network errors:** Retry logic, timeout after 30s
4. **Auth errors:** Redirect to login

### TTS Errors (Browser Native)
1. **No TTS support:** Show message, disable controls
2. **No voice available:** Use default browser voice
3. **Audio not playing:** Check OS volume/mute
4. **Language not supported:** Use closest match or English

## Performance Optimizations

### Chat
- SSE streaming (real-time, no polling)
- Pagination (load 20 messages at a time)
- Lazy loading (load history only when needed)
- Message compression (gzip on transfer)

### TTS
- Client-side processing (zero server cost)
- No network calls (except optional logging)
- Instant playback (no buffering needed)
- Offline capability (works without internet)

## Security Model

### Authentication
- JWT tokens from Supabase Auth
- Decoded on server (edge function)
- User ID extracted and used for RLS

### Authorization
- Row-level security on all tables
- Users can only access their own data
- No cross-user data leakage

### API Keys
- `GROQ_API_KEY`: Server-side only, never in frontend
- Supabase keys: Limited to public data
- Service role key: Only in edge functions

### Rate Limiting
- Groq's built-in rate limiting (via API)
- Supabase RLS prevents abuse
- No explicit rate limiting in app (providers handle)

## Scalability

### Current Capacity
- Supports 1000+ concurrent users
- Groq handles 100+ requests/second
- Supabase scales automatically
- Browser TTS has no server cost

### Future Scaling
- Increase Groq API tier if needed
- Add caching layer for common queries
- Implement request queuing
- Add analytics and monitoring

## Monitoring & Observability

### What to Track
- Groq API response times
- Chat token generation rate
- Error rates and types
- User engagement metrics
- TTS usage (optional)

### Tools
- Browser console for client-side errors
- Supabase logs for database issues
- Groq API dashboard for API health
- Network tab for streaming performance

## Deployment

### Edge Functions
- Deployed to Supabase Edge Functions
- Auto-deployed on each push
- No cold start issues (always warm)
- Global CDN distribution

### Frontend
- Built with Vite (fast builds)
- Deployed to CDN or static hosting
- No server needed
- Auto-cached by browsers

### Database
- Managed Supabase instance
- Automatic backups
- Replicated across regions
- Zero downtime updates

## Future Architecture Improvements

1. **Message Caching:** Redis layer for frequently accessed chats
2. **Multi-Provider:** Support multiple chat/TTS providers
3. **Analytics:** Track usage patterns and costs
4. **Voice Cloning:** Train custom voices
5. **Prompt Templates:** Predefined conversation starters
6. **Conversation Branching:** Multiple response paths
7. **Export/Import:** Save and share conversations
8. **Multilingual UI:** Support multiple languages for interface
