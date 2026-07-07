# Cymor Convert Bot — v1

*Convert Anything. Instantly.*

## What's in v1

**Images:** JPG ↔ PNG ↔ WEBP, image → PDF, compress, resize
**Documents:** Word/Excel/PowerPoint → PDF, PDF → JPG, PDF split, PDF rotate, OCR (image/PDF → text)
**Audio:** MP3/WAV/AAC/FLAC conversion, trim, volume boost
**Dev tools:** JSON ↔ YAML, XML → JSON, JSON formatting

**Not in v1 (see "Known v1 limitations" below):** video conversion, PDF merge, PDF password protection, background removal, archive extraction, PDF compression.

## Admin commands
(Only works for Telegram IDs listed in `ADMIN_IDS`)

- `/broadcast <message>` — message every user
- `/promote <telegram_id> [days]` — grant Premium (omit days for lifetime)
- `/demote <telegram_id>` — remove Premium
- `/createcoupon <days> <max_uses> [code]` — generate a coupon
- `/stats` — total users, premium count, banned count
- `/ban <telegram_id>` / `/unban <telegram_id>`

## User commands
- `/redeem CODE` — redeem a coupon
- `/autoconvert docx pdf` — skip menus, auto-convert a file type
- `/autoconvert clear docx` — remove an auto-convert rule
- `/myreferral` — get referral link (20 referrals = lifetime Premium)
- `/status` — check plan and daily usage

## Deploying on Render (from your phone)

1. **Push this folder to a GitHub repo.** Since you're on mobile, the easiest path is:
   - Use the GitHub mobile app or web UI to create a new repo
   - Upload these files directly through GitHub's web "Add file → Upload files" (works fine on mobile browser)

2. **On Render:**
   - New → Web Service → connect your repo
   - **Runtime: Docker** (important — this is what installs LibreOffice/Tesseract; the plain Node runtime won't have these binaries)
   - Render auto-detects the `Dockerfile`
   - Add environment variables from `.env.example`:
     - `BOT_TOKEN` (from @BotFather)
     - `ADMIN_IDS` (your Telegram numeric ID — get it from @userinfobot)
     - `MONGODB_URI` (your Atlas connection string)
     - `RENDER_EXTERNAL_URL` — set this to your Render service URL once deployed (e.g. `https://cymor-convert-bot.onrender.com`), so the keep-alive self-ping works
   - Deploy

3. **Verify it stays up:** hit `https://your-app.onrender.com/health` in a browser — should return `{"status":"ok"}`. The bot self-pings this every 10 minutes so Render's free tier doesn't spin it down from inactivity.

## Known v1 limitations (honest list, not hidden)

- **PDF merge** needs multiple files sent together — the current flow handles one file at a time. Flagged in-bot rather than faked.
- **PDF password protection** needs a native encryption tool (`qpdf`) not yet wired in.
- **Background removal** needs a paid external API (e.g. remove.bg) — no local free equivalent exists that runs well on Render's free tier.
- **Video conversion** deliberately excluded from v1 — FFmpeg video transcoding is heavy for Render's free-tier RAM/CPU and would make the bot feel slow/broken for first-time users. Recommended to add later as a Premium-only feature once you're on a paid instance.
- **PDF compression** currently reuses the office-to-pdf pipeline as a placeholder — real compression needs Ghostscript, not yet added.
- **Archive extraction** (zip/rar/7z) not implemented in v1 — straightforward to add in v1.1 with `adm-zip` for zip; rar/7z need extra system binaries.

## Architecture notes

- Files are never permanently stored — downloaded to a temp OS directory, converted, sent back, then deleted (`utils/tempFiles.js`).
- Because Telegram's callback buttons only allow 64 bytes of data, file references are stored in a short-lived in-memory token map (`utils/fileTokenStore.js`, 10 min TTL) rather than jamming the whole file ID into the button.
- Bot uses long polling (`bot.launch()`), wrapped in a retry loop (`launchWithRetry` in `bot.js`) so a dropped connection reconnects automatically instead of killing the process.
- `unhandledRejection` / `uncaughtException` are caught at the process level so one bad conversion never takes down the whole bot for all users.
