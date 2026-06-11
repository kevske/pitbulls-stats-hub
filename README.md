**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment & Security

This project uses Supabase Edge Functions for secure operations.

### Deploying the Admin Function
To enable secure video management, you must deploy the `admin-manage-videos` function and set the admin password:

```bash
# Deploy the function
npx supabase functions deploy admin-manage-videos

# Set the secure password (must match the one you use in the UI)
npx supabase secrets set ADMIN_PASSWORD=your_secure_password
```

### Applying Security Migrations
Ensure your database RLS policies are up to date:

```bash
npx supabase db push
```

## Saisons

Das Datenmodell ist saisonfähig: Die Tabelle `seasons` definiert pro
Spielzeit die basketball-bund.net-Liga-ID und die Pitbulls-Team-ID. Der
Crawler liest seine Konfiguration von dort, alle Statistiken sind pro
Saison getrennt, und das Frontend bietet einen Saison-Switcher in der
Sidebar.

**Saisonwechsel:** siehe [docs/SEASON_HANDOVER.md](docs/SEASON_HANDOVER.md)
— eine neue Zeile in `seasons` genügt.

## Monitoring

Der Crawler läuft jede zweite Nacht per GitHub Actions. Bei Fehlschlägen
oder wenn 72h keine Daten ankommen, wird ein Webhook benachrichtigt —
dafür das Repo-Secret `ALERT_WEBHOOK_URL` auf einen Discord-/Slack-
kompatiblen Webhook setzen.

## Entwicklung

```bash
npm run dev        # Dev-Server
npm run typecheck  # TypeScript prüfen (läuft auch im Deploy als Gate)
npm run test       # Vitest (läuft auch im Deploy als Gate)
npm run lint       # ESLint
```
