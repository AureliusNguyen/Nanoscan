# NeuroScan.AI - Frontend (Next.js 15)

Uses **pnpm** (content-addressable store -> faster installs, less disk).

## Local development

```
cd web
pnpm install
copy .env.example .env.local      # PowerShell: cp .env.example .env.local
# edit .env.local and point API_URL at the backend
pnpm dev
# -> http://localhost:3000
```

The page calls `/api/predict` and `/api/explain` (Next.js route handlers),
which proxy to the FastAPI backend at `API_URL`. Proxying through Next
keeps the backend URL out of the browser and avoids CORS headaches.

## Sample images

Drop four MRI images into `public/samples/` named `glioma.jpg`,
`meningioma.jpg`, `notumor.jpg`, `pituitary.jpg`. See
`public/samples/README.md` for details.

## Other useful commands

```
pnpm build       # production build
pnpm typecheck   # tsc --noEmit
pnpm lint        # next lint
```

## Deploy to Vercel

```
pnpm dlx vercel link
pnpm dlx vercel env add API_URL production
# paste your HF Spaces URL when prompted
pnpm dlx vercel --prod
```

Or import the repo at https://vercel.com/new, set the project root to
`web/`, and add `API_URL` to the project's env vars.

## WSL vs Windows note

If you mix `pnpm install` from WSL with `pnpm dev` from PowerShell (or
vice versa), you'll hit "next is not recognized" because the bin shims
differ between platforms. Pick one shell and stick to it.
