# Madplan — Rema 1000 weekly meal planner

A self-hosted, mobile-friendly Danish meal-prep + discount planner.
Pulls Rema 1000's full weekly catalogue every morning via GitHub Actions, and lets you build a meal plan and shopping list around the cheapest items.

## What's in this folder

```
madplan-web/
├── index.html              ← the app (single file, no build step)
├── discounts.json          ← current week's catalogue (auto-refreshed daily)
├── scripts/
│   └── refresh.mjs         ← Node script that fetches Rema 1000's API
├── .github/
│   └── workflows/
│       └── refresh.yml     ← runs the script daily and commits the JSON
├── .gitignore
└── README.md
```

## Quick start (the easy way — GitHub Desktop, no terminal)

### 1. Create a GitHub account
If you don't have one, sign up at https://github.com (free).

### 2. Install GitHub Desktop
Download from https://desktop.github.com — open the .dmg, drag to Applications, launch, sign in.

### 3. Create a new repository in GitHub Desktop
- File → New Repository
- Name: `madplan`
- Local path: pick a folder you'll remember (e.g. `~/Documents`)
- Click Create Repository

### 4. Drop these files into the new repo
Open the `madplan-web` folder you got from Claude (it's on your Desktop).
Copy all its contents (including the hidden `.github` and `.gitignore`) into the
`madplan` folder GitHub Desktop just made. Press `⌘ + Shift + .` in Finder if
hidden files aren't showing.

### 5. Commit and publish
- Switch to GitHub Desktop. You'll see all the files listed.
- Bottom-left: type "Initial commit", click **Commit to main**
- Top: click **Publish repository** → uncheck "Keep this code private" → **Publish**

### 6. Enable GitHub Pages
- Go to your repo on github.com (your username, the `madplan` repo)
- **Settings** → **Pages** (left sidebar)
- Source: "Deploy from a branch", Branch: `main`, Folder: `/ (root)`
- Save. After ~2 minutes you'll get a URL like `https://USERNAME.github.io/madplan/`.

### 7. Run the daily refresh once now
- **Actions** tab → enable workflows if asked
- Click **Refresh Rema 1000 discounts** workflow → **Run workflow** → **Run workflow**
- This pulls the current week's full catalogue. Takes ~30 seconds.

If it fails on the commit step:
**Settings → Actions → General → Workflow permissions → Read and write permissions → Save**, then re-run.

### 8. Bookmark on your phone
Open the URL on your phone, Share → Add to Home Screen. Done.

## How daily use works

1. Open the app on your phone (homescreen bookmark).
2. Browse **Tilbud** — current and upcoming offers, filterable by department, sortable by biggest %-saving.
3. Tap **Tilføj** on the items you want this week. Watch the running total in **Valgte**.
4. When you have ~6–10 items, tap **Åbn i Claude → få madplan** on the **Valgte** tab. It opens claude.ai with a prompt pre-filled listing your selected items + your dietary preferences from **Indstillinger**.
5. Claude responds with a JSON madplan. Copy it.
6. Back in the app, **Måltider** tab → **Importér madplan** → paste → Import.
7. The **Indkøbsliste** tab now shows everything aggregated by department, with checkboxes for the actual shopping run.

Everything except the AI step works offline once the page has loaded — `localStorage` stores your selections, meals, and checked items.

## Local development

```bash
node scripts/refresh.mjs        # test the fetcher
python3 -m http.server 8000     # serve the folder locally
# → open http://localhost:8000
```

`fetch()` of a local JSON file fails when opening `index.html` via `file://` (browser security) — you need a local server.

## Adding more stores

The app is wired for Rema 1000 right now. To add Netto / Lidl / Føtex:

1. Write a fetcher in `scripts/refresh.mjs` that hits the new store's API and returns slim products.
2. Combine all stores' products into `data.products` with a `store` field on each.
3. Update `index.html` to show the store name on each card and group the shopping list by store.

Salling Group (Netto / Føtex / Bilka) has an internal API at `shop.salling.dk/api/v1/`, and Lidl publishes weekly catalogues via JSON endpoints.

## Privacy and data

- Runs entirely client-side. localStorage on your device.
- Repo is public but only contains Rema's already-public discount data — no personal info.
- AI prompt is sent to claude.ai when you click "Åbn i Claude". Anthropic's privacy policy applies.

## Credits

- Discount data: Rema 1000's public app API (`api.digital.rema1000.dk`).
- Product photos: Rema's CDN (`rema-product-images.digital.rema1000.dk`).
- Personal project — not affiliated with Rema 1000.
