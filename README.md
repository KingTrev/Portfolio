# Trevor King Portfolio

Your portfolio website, with an admin panel at `/admin` where you can edit every part of it from anywhere.

## What's in this folder

| Folder / file | What it is |
|---|---|
| `index.html` | The website. It reads your content and builds the page. |
| `assets/` | The design (`style.css`) and the code that builds the page (`site.js`). You won't need to touch these. |
| `content/` | Your text and project lists. The admin panel edits these for you. |
| `uploads/` | Your images, 3D models (`uploads/models/`), photos and résumé. New uploads from the admin go here. |
| `admin/` | The admin panel (Decap CMS). `config.yml` defines what you can edit. |
| `netlify.toml` | Netlify settings. No build step is needed. |

## How it works

You edit in the admin panel → it saves the change to your GitHub repository → Netlify sees the change and republishes the site, usually within a minute. Only people with access to your GitHub repository can log in to the admin.

---

## One-time setup (about 20–30 minutes)

### 1. Put the site on GitHub
1. Create a free account at [github.com](https://github.com) if you don't have one.
2. Click **New repository**. Name it `trevor-portfolio`. Public or private both work. Don't add a README.
3. On the new, empty repository page, click **uploading an existing file**.
4. Drag in **everything inside this folder** (the files and folders, not the folder itself), then click **Commit changes**.
   - Make sure `admin`, `assets`, `content` and `uploads` all appear at the top level of the repository.

### 2. Point the admin at your repository
1. In GitHub, open `admin/config.yml` and click the pencil icon to edit it.
2. Change `YOUR-GITHUB-USERNAME/trevor-portfolio` to your real username, for example `trevorking/trevor-portfolio`.
3. Click **Commit changes**.

### 3. Publish on Netlify
1. Log in at [app.netlify.com](https://app.netlify.com) (you can sign up with your GitHub account).
2. Click **Add new project → Import an existing project → GitHub**, and pick `trevor-portfolio`.
3. Leave the build command empty and the publish directory as `.`, then click **Deploy**.
4. Optional: under **Project configuration → General → Project name**, pick a nicer name, such as `trevorking-viz`. Your site will be at `https://trevorking-viz.netlify.app`.
5. Back in GitHub, edit `admin/config.yml` again and replace both `https://YOUR-SITE.netlify.app` lines with your real site address.

### 4. Turn on the admin login (GitHub through Netlify)
1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**.
   - **Application name:** Portfolio Admin
   - **Homepage URL:** your Netlify site address
   - **Authorization callback URL:** `https://api.netlify.com/auth/done`
2. Click **Register application**. Copy the **Client ID**, then click **Generate a new client secret** and copy that too. GitHub only shows the secret once.
3. In Netlify, open your project → **Project configuration → Security → OAuth** → **Install provider** → **GitHub**, paste the Client ID and Client Secret, and save.

### 5. Log in
Go to `https://your-site.netlify.app/admin`, click **Login with GitHub**, and approve. You're in.

---

## Using the admin panel

The admin has three pages under **Portfolio**:

- **Projects:** add, edit, delete and drag to reorder projects. Each project can have:
  - a full-width main image
  - a gallery of extra images
  - "Photo vs. render" pairs
  - interactive 3D models (.glb)
  - quick facts and a description

  Turn off **Show on site** to hide a project without deleting it.
- **Photography:** add, remove and reorder photos, or hide the whole section.
- **Site text & settings:** everything else. That includes the top of the page, About me and the timeline, How I work, the Work intro, Skills, Contact, the résumé PDF, and the accent color.

Click **Publish → Publish now** to save. The live site updates about a minute later.

### Tips
- **Images:** export JPGs about 2000 px wide and under about 1 MB each, so the site stays fast.
- **3D models:** export from SketchUp as FBX with **Triangulate all faces** checked, convert to .glb, and keep each file under about 10 MB.
- **Descriptions:** fill in the image description fields. They help screen readers and search engines.
- **Résumé:** upload a new PDF in **Site text & settings → Contact → Résumé** whenever you update it.

## Optional: edit on your own computer first
If you have [Node.js](https://nodejs.org) installed, you can try changes locally before publishing:
1. In this folder, run `npx decap-server`.
2. In a second window, run `npx serve .`.
3. Open `http://localhost:3000/admin`. Changes save straight to the files in this folder.

## Optional: custom domain
In Netlify, open **Domain management → Add a domain** to use something like `trevorking.design`. Netlify sets up HTTPS automatically.
