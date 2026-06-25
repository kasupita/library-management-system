# LMS

## Project info

**URL**: (add your deployed URL here)

## How can I edit this code?

There are several ways of editing your application.

**Use LMS**

Simply visit your project and start prompting.

Changes made via the app tooling will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

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

## Logo

The sidebar currently loads the logo from this URL:

- `https://siba.edu.lk/publication/iris.journal/images/SIBALOGO.png`

If you prefer a local file instead, change the logo `<img>` in `src/components/layout/Sidebar.tsx` to use `/logo.png` and place your image at `public/logo.png` (relative to `library-hub-main/library-hub-main/`).

## How can I deploy this project?

Publish the app using your hosting/deployment workflow.

## Custom domain

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Configure this in your hosting provider (Vercel/Netlify/etc.) or your DNS.
