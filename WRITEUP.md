# Approach Write-up

**What I prioritised.** The core ticket loop and the AI integration, since that is where the product value is: an author submits a query, it is classified and prioritised automatically, an admin opens it and finds a draft reply grounded in BookLeaf's policies and the author's real book data, edits it, sends it, and the author sees it without refreshing.

**Key trade-offs.**
- *Cheap and grounded over clever.* One small model, two short calls. Only the policy section for the ticket's category and only the relevant book are sent, and drafts are cached. This keeps cost per ticket low at 1,200+ books a month of volume.
- *The AI is never on the critical path.* Tickets are created even if the AI is down. Classification falls back to keyword rules, and drafting falls back to manual writing with a clear message.
- *Humans stay in control.* Category and priority can be overridden, drafts are editable, and the UI shows who set each value (AI, rules or admin).
- *Polling over WebSockets.* Five-second polling feels responsive, needs no extra infrastructure, and is easy to explain. I'd rather spend the time on the AI behaviour.
- *Attachments are UI only,* as the brief allowed.

**How I'd take it to production.**
1. Move updates to SSE or WebSockets, and add pagination and indexes tuned to real queue sizes.
2. Real file uploads to object storage with virus scanning, so printing-quality photos can be reviewed in the ticket.
3. Let authors reply on a ticket, and add email notifications for new replies.
4. Pull live royalty and production data from the source systems instead of a seeded copy, so the draft always uses current numbers.
5. Log every AI call (tokens, latency, category, whether the admin edited the draft) to track cost and quality, and measure classification accuracy against admin overrides. Use that to refine prompts.
6. Add a review step for sensitive replies (large payouts, legal wording), prompt caching for the shared system prompt, automated tests, and proper admin user management with audit trails.
