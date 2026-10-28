# BookLeaf Author Support & Communication Portal

A MERN app with an author portal and an admin portal. AI (Google Gemini) classifies tickets, scores their priority and drafts replies from the BookLeaf knowledge base.

## Project structure

```
bookleaf-portal/
├── server/                 Express + MongoDB API
│   └── src/
│       ├── config/         db connection
│       ├── models/         User, Book, Ticket (Mongoose)
│       ├── middleware/     auth (JWT + roles), validate (zod), errorHandler
│       ├── routes/         route table + zod schemas
│       ├── controllers/    auth, books, tickets
│       ├── services/       aiService, knowledgeBase, contextBuilder,
│       │                   keywordClassifier, ticketAutomation
│       └── seed/           data.json (provided dataset) + seed.js
└── client/                 React (Vite)
    └── src/
        ├── api/            axios client with token handling
        ├── context/        AuthContext
        ├── hooks/          usePolling
        ├── components/     Navbar, ProtectedRoute, Badge, TicketThread
        └── pages/          Login, author/*, admin/*
```

## Run locally

Requirements: Node 18+, a MongoDB database (Atlas or local), an Anthropic API key.

```bash
# 1. API
cd server
cp .env.example .env        # fill MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm install
npm run seed                # loads the 10 authors / 18 books
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

The Vite dev server proxies `/api` to port 5000. For a deployed frontend, set `VITE_API_URL` in `client/.env` (see `.env.example`).

### Test logins (created by the seed)

| Role   | Email                       | Password    |
|--------|-----------------------------|-------------|
| Admin  | admin@bookleaf.com          | admin123    |
| Author | priya.sharma@email.com      | author123   |
| Author | any email in the dataset    | author123   |

Good authors to try for edge cases:
- `ananya.reddy@email.com`, `arjun.malhotra@email.com`: royalty earned, nothing paid yet
- `sneha.kulkarni@email.com`: has a book still in production (Cover Design)
- `kavita.deshmukh@email.com`: one book in Typesetting, one live with zero payouts

## Environment variables (server/.env)

| Variable            | Purpose                                       |
|---------------------|-----------------------------------------------|
| `MONGO_URI`         | MongoDB connection string (left blank for you)|
| `JWT_SECRET`        | Signs login tokens                            |
| `GEMINI_API_KEY`    | Google AI Studio API key, server-side only   |
| `AI_MODEL`          | Defaults to `gemini-2.5-flash`               |
| `CLIENT_URL`        | Allowed CORS origin                           |

The key is read only in `aiService.js` and never sent to the browser.

## API reference

Base path `/api`. Send `Authorization: Bearer <token>` on everything except login. Errors look like `{ "error": "message", "details": [{ "field", "message" }] }`.

| Method | Endpoint                    | Role   | Description |
|--------|-----------------------------|--------|-------------|
| POST   | `/auth/login`               | public | `{ email, password }` → `{ token, user }` |
| GET    | `/auth/me`                  | any    | Current user |
| GET    | `/books`                    | any    | Author: own books. Admin: all books |
| POST   | `/tickets`                  | author | `{ bookId?, subject, description, attachmentName? }`. Returns 201 right away; AI classification runs in the background |
| GET    | `/tickets`                  | any    | Author: own tickets. Admin: all, with filters `status, category, priority, assigned (me/none), from, to, q`. Admin sort: priority, then oldest first |
| GET    | `/tickets/:id`              | any    | One ticket (authors get 404 for other people's tickets; internal notes and AI draft are stripped for authors) |
| PATCH  | `/tickets/:id`              | admin  | `{ status?, category?, priority?, assignedTo? ("me" or null) }` (overrides the AI) |
| POST   | `/tickets/:id/responses`    | admin  | `{ message, markResolved? }`. Visible to the author, status becomes In Progress (or Resolved) |
| POST   | `/tickets/:id/notes`        | admin  | `{ note }`. Internal only |
| POST   | `/tickets/:id/ai-draft`     | admin  | `{ regenerate? }` → `{ draft, cached }`. Returns 503 with a readable message if the AI is down |

Status codes used: 400 validation, 401 not logged in, 403 wrong role, 404 not found, 429 rate limit, 503 AI unavailable.

## How the AI part works

**Model choice.** Gemini Flash (`AI_MODEL`) handles classification and short replies. Change the env var to use another compatible Gemini model.

**Three AI jobs, two calls:**
1. *Classification + priority* in one call. Returns JSON `{category, priority, reason}`. The prompt has a priority rubric (e.g. ISBN errors are at least High, months without royalty is Critical). The output is validated against the allowed values before it is saved.
2. *Draft reply* when an admin opens a ticket.

**Prompt strategy for drafts.** A system prompt holds the BookLeaf tone rules, the relevant policy and a calibration example. The user message holds the author/book data and the ticket. Rules tell the model to use real numbers, never invent dates or amounts, own BookLeaf's mistakes, give a timeline, end with a next step, and not sound like an AI.

**Cost control.**
- The knowledge base is split into sections, and only the section for the ticket's category (plus company + tone) is sent, not the whole KB.
- Only the book the ticket is about is sent, not the author's whole catalogue.
- Only the last 2 messages of a thread are included for follow-ups.
- Classification sends no KB at all, `max_tokens` is 150. Drafts are capped at 500.
- Drafts are cached on the ticket, so reopening a ticket costs nothing. Changing the category discards the stale draft.
- Drafts aren't auto-generated for Resolved/Closed tickets.
- Rate limit on the draft endpoint.

**Grounding in real data.** `contextBuilder.js` turns the author's book record into plain facts (copies sold, earned/paid/pending, last payout, in-production status, below-threshold note) and works out the next payout date (quarter end + 45 days).

**Graceful degradation.**
- Ticket creation never depends on the AI.
- If classification fails, `keywordClassifier.js` assigns a category and priority from keywords (the admin sees "set by keyword rules").
- If drafting fails (no key, rate limit, timeout), the API returns 503 and the admin sees a warning but can write the reply manually.
- Admin overrides always win: a late AI result will not overwrite a manual change.

## Design decisions

- **Polling for "real time".** The author's ticket list polls every 5s (paused when the tab is hidden). It's simple, works on any host, and is enough here. SSE or WebSockets would be the next step.
- **Background classification.** The author gets an instant response, the admin queue shows "classifying..." for a moment.
- **Authors get 404, not 403,** on other people's tickets so ids can't be probed.
- **Priority is stored as a rank** (`priorityRank`) so the queue can be sorted in the database.

## Known limitations / next steps

- File attachments are UI only (file name is saved, file is not uploaded).
- Authors cannot reply to a ticket after the admin responds (would be a small addition: `POST /tickets/:id/responses` for authors).
- Polling instead of push; no pagination beyond a 200 ticket cap.
- No password reset or admin user management; users come from the seed.
- No automated tests yet. First targets would be the AI output validation and the role checks.
- Royalty figures come from the dataset, the 80/20 calculation is not recomputed.
