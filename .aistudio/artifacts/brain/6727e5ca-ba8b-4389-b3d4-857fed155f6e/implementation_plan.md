# Implementation Plan - Fixing Live Call Repetition Issue

## Problem Analysis
The live call screen ("Canlı Görüşme") repeats canned or similar responses because:
1. Microphone speech recognition sometimes captures the AI's own audio output (speaker feedback), triggering a loop of self-repetition.
2. The server-side `/api/live-call-turn` endpoint in `server.ts` relies on fallback strings when network calls are brief or fail.
3. Speech recognition transcript events lack deduplication for rapid repeated speech fragments.

## Proposed Changes

### 1. Server-Side Live Call Turn (`server.ts`)
- Optimize `/api/live-call-turn` to prioritize Gemini (`aiClient`) with full conversation history.
- Ensure varied, context-aware responses rather than repetitive fallback strings.

### 2. Live Call Frontend Component (`src/components/LiveCall.tsx`)
- Enforce strict microphone muting while the AI is speaking (`callStatus === 'speaking'` or `isSpeakingRef.current = true`).
- Add a debounce and last-spoken check to prevent processing duplicate or echoed transcripts.
- Ensure smooth transitions between `listening`, `thinking`, and `speaking` states.

## Verification Plan
- Test compilation and linter (`compile_applet`, `lint_applet`).
- Verify live call voice interaction handles dynamic turns without looping.
