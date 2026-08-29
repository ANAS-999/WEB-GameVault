<div align="center">

# 🎮 GameVault

**A minimalist, high-performance video game discovery engine and personal backlog tracker.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-angamev.vercel.app-white?style=for-the-badge&logo=vercel&logoColor=black)](https://angamev.vercel.app/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

---

[**Explore Live Application ➔**](https://angamev.vercel.app/)

</div>

<br/>

## 📖 Overview

**GameVault** is an ultra-fast, modern web application designed for gamers and collectors. It combines real-time video game metadata powered by the **IGDB API v4** with a cloud-synchronized personal vault backed by **Firebase Auth & Firestore**. 

Whether you want to explore new releases, track your backlog progress, or trace the exact chronological storyline release order of iconic franchises (like *God of War*, *The Witcher*, *Grand Theft Auto*, or *Dark Souls*), GameVault delivers a seamless, cinema-grade experience.

---

## ✨ Key Features

### 🔍 Interactive Game Discovery
* **Instant Search & Genre Filtering**: Search thousands of titles with instantaneous filtering across popular genres (RPG, Adventure, Shooter, Strategy, Racing, Sports, Indie).
* **Infinite Scroll**: Effortlessly browse large catalogs with optimized intersection observers and skeleton loaders.

### 🚆 Subway-Style Franchise Storyline Timelines
* **Chronological Milestone Track**: Horizontal sequence timeline showing franchise prequels, main entries, and sequels in chronological storyline order.
* **Instant Switching**: Browse games within the same franchise without redundant API reloading.
* **Smart Matching**: Uses release year and title reconciliation to distinguish original releases from remakes/reboots.
* **Smooth Auto-Centering**: Smooth scrolling controls (`<` / `>`) with automatic centering on the active game.

### 🎬 Cinema 16:9 Media Showcase
* **Ambient Glow Player**: Widescreen media frame with dynamic ambient backlight blur matching the active screenshot or cover art.
* **Auto-Scrolling Thumbnail Strip**: Visual thumbnail strip with auto-centering on selection.
* **Fullscreen Lightbox**: High-definition screenshot viewer.
* **Direct Store Links**: One-click circular store icons for **Steam** and **Epic Games Store**.

### 🔒 Cloud-Synced Personal Vault
* **Authentication**: Seamless email/password and guest-friendly authentication via Firebase.
* **Backlog Categorization**: Track games across statuses: `Playing`, `Completed`, `Want to Play`, and `Dropped`.
* **Personal Notes & Rating**: Save private notes, strategies, and personal ratings synced in real time to Cloud Firestore.

### ⚡ Serverless API & Performance
* **Vercel Serverless Proxy**: Secure backend serverless functions handling Twitch/IGDB authentication, rate limiting, and CORS headers.
* **Cross-Browser Scrollbar Suppression**: Custom `.no-scrollbar` utility classes for smooth mousewheel and touch navigation without visual scrollbars.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology |
|---|---|
| **Frontend Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Styling & Design System** | [Tailwind CSS](https://tailwindcss.com/) + Custom Dark Luxury Theme |
| **Motion & Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Build Tool** | [Vite](https://vitejs.dev/) |
| **Database & Auth** | [Firebase Authentication](https://firebase.google.com/docs/auth) & [Cloud Firestore](https://firebase.google.com/docs/firestore) |
| **Metadata Provider** | [IGDB API v4](https://api-docs.igdb.com/) (Twitch Developer) |
| **Deployment & Serverless** | [Vercel](https://vercel.com/) (Edge Serverless Functions) |

---

## 🚀 Getting Started

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (version 18 or higher)
* `npm` or `yarn` or `pnpm`

### 2. Clone the Repository
```bash
git clone https://github.com/ANAS-999/WEB-GameVault.git
cd WEB-GameVault/game-vault
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory:

```env
# IGDB / Twitch API Credentials
VITE_GAMES_CLIENT_ID=your_twitch_client_id
VITE_GAMES_AUTHORIZATION=Bearer your_twitch_app_access_token

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### 5. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production
```bash
npm run build
```

---

## 🌐 Deployment on Vercel

GameVault is configured for instant deployment on [Vercel](https://vercel.com/):

1. Import the repository into your Vercel Dashboard.
2. In **Project Settings > Environment Variables**, add:
   - `VITE_GAMES_CLIENT_ID`
   - `VITE_GAMES_AUTHORIZATION`
   - (Optional) Firebase environment variables.
3. Deploy! Vercel will automatically build the client and deploy the serverless proxy handlers in [`api/games.ts`](./api/games.ts) and [`api/igdb.ts`](./api/igdb.ts).

---

## 👨‍💻 Creator & Contact

Built with ❤️ by **Anas**

* **Live App**: [https://angamev.vercel.app/](https://angamev.vercel.app/)
* **GitHub**: [@ANAS-999](https://github.com/ANAS-999)
* **LinkedIn**: [Anas Bencheikh](https://www.linkedin.com/in/anas-bencheikh-dev/)
* **Email**: [anas.dev.999@gmail.com](mailto:anas.dev.999@gmail.com)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
