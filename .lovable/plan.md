

## Persist AI chatbot conversation across page navigation

Right now the `HelpChatbot` component stores messages in local React state (`useState<Msg[]>([])`). When you navigate between admin pages (Dashboard → Academic Years), the component unmounts and remounts, wiping the conversation. You want the chat history to survive navigation and only clear on logout.

### Fix

Persist messages to `sessionStorage` (cleared automatically on logout/tab close) and rehydrate on mount.

**File: `src/components/admin/HelpChatbot.tsx`**

1. Initialize `messages` state from `sessionStorage` on first render:
   ```ts
   const [messages, setMessages] = useState<Msg[]>(() => {
     try {
       const saved = sessionStorage.getItem("edzen_chat_history");
       return saved ? JSON.parse(saved) : [];
     } catch { return []; }
   });
   ```
2. Add a `useEffect` that writes `messages` to `sessionStorage` whenever it changes.
3. Persist `open` state the same way (key `edzen_chat_open`) so the panel stays open across navigation if the user left it open.
4. Add a small "Clear chat" (trash) icon button in the chat header next to the close button so users can reset the conversation manually if they want.

**File: `src/contexts/AuthContext.tsx`**

In the sign-out handler, clear the chat keys so a fresh login starts with an empty chatbot:
```ts
sessionStorage.removeItem("edzen_chat_history");
sessionStorage.removeItem("edzen_chat_open");
```

### Why sessionStorage (not localStorage)

- Auto-clears when the browser tab closes → matches "until user logs out" intent
- Survives in-app navigation (Dashboard → Academic Years → Students etc.)
- No backend cost, no DB schema changes
- Per-tab isolation — opening the app in two tabs gives two independent chat sessions, which is the expected behavior for a help assistant

### Acceptance

- Ask a question on Dashboard → navigate to Academic Years → reopen chatbot → previous Q&A still visible
- Continue the conversation; new replies append to existing history
- Click "Clear chat" → history wipes, suggestion chips reappear
- Sign out and sign back in → chatbot starts fresh

