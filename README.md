# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

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

## Document rendering & downloads

The app builds a structured document model from AI output (headings, paragraphs, bullets) and renders that model into:

- **Word (.docx)**: a minimal OpenXML document packaged as a `.docx` file with professional typography, margins, and bullet styling.
- **PDF (.pdf)**: a standards-compliant PDF with consistent typography, section headings, and spacing.

Document rendering happens in the browser through a lightweight API wrapper in `src/lib/documentApi.ts`, which mimics:

- `POST /api/documents/render` for rendering
- `GET /api/documents/:id/download?format=pdf|docx` for downloads

The renderer validates payload size, avoids arbitrary file paths, and caches rendered output for repeat downloads. See `src/lib/documentModel.ts`, `src/lib/documentRenderer.ts`, and `src/lib/documents.ts` for the parsing, formatting, and caching logic.

## AI chat confirm mode

The AI chat now supports two modes:

- **Improve instantly** (default): applies improvements immediately after a request.
- **Confirm before applying**: summarizes proposed changes, asks for confirmation, and only applies updates after the user clicks **Proceed**. Pending actions expire after a few minutes or when a new message arrives.

The chat mode selection persists for the current session. Implementation details live in `src/components/AIChatBox.tsx` and `src/components/MainAppView.tsx`.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
