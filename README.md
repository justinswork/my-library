# My Library

A personal book inventory PWA. Scan a barcode to know if you already own a book, manage multiple collections, keep a wishlist, and find duplicates. Installs to the home screen on iOS and Android.

Built with React, Vite, Firebase (Auth + Firestore), `html5-qrcode`, and the Open Library API.

## Setup

1. Create a Firebase project at https://console.firebase.google.com.
   - Enable **Authentication → Google** as a sign-in method.
   - Create a **Firestore Database** in production mode.
   - Register a web app and copy the `firebaseConfig` values.
2. Copy `.env.example` to `.env` and paste the config values.
3. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
4. Deploy the Firestore security rules so each user can only access their own data:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   firebase deploy --only firestore:rules
   ```

## Scripts

- `npm run dev` — local dev server with hot reload
- `npm run build` — production build into `dist/`
- `npm run preview` — preview the production build locally
- `npm run deploy` — bump patch version, build, and deploy to Firebase Hosting

Camera access requires HTTPS in production; Firebase Hosting provides this automatically. `localhost` is exempt for local dev.

## PWA icons (optional)

Generate home-screen icons from a source SVG with [`pwa-asset-generator`](https://github.com/elegantapp/pwa-asset-generator):

```bash
npx pwa-asset-generator public/favicon.svg public --opaque true --background "#C8839C" --type png --padding "0%"
```

## Data model

```
users/{uid}/
  books/{bookId}
    isbn, title, subtitle, authors[], publisher, publishedYear,
    pageCount, cover, description, notes, collectionIds[], copies, addedAt
  collections/{collectionId}
    name, isWishlist, createdAt
```

A book can belong to many collections via `collectionIds`. Duplicate adds increment `copies` on the existing entry instead of creating a new doc; matches are by ISBN, falling back to title + first author.
