# Noxtary — A Premium Digital Platform

A world-class web platform bringing apps, ebooks, mods, audio, and services together with an elegant, fast experience.

## 📁 Project Structure

```
Noxtary_Web/
├── index.html              # Landing page
├── home.html               # Main catalog/browse page
├── product.html            # Individual product detail view
│
├── css/
│   └── style.css          # Main stylesheet (responsive design system)
│
├── js/
│   └── script.js          # Frontend logic, Supabase integration, interactions
│
├── pages/                 # Additional pages (future expansion)
│   
├── assets/
│   ├── images/            # Product images, logos, backgrounds
│   └── icons/             # SVG icons and UI elements
│
└── README.md              # This file
```

## 🎨 Design Features

- **Theme System**: 5 premium themes with instant toggle
  - Cyber Dark (default)
  - Neon Purple
  - Emerald Green
  - Sunset Orange
  - Neo Light

- **Responsive Design**: Mobile-first approach, optimized for all screen sizes
- **Typography**: Orbitron (titles), Cairo (body), Share Tech Mono (code)
- **Animations**: Smooth transitions, glow effects, fade-up entrance animations

## 🚀 Getting Started

1. Open `index.html` in your browser
2. Click "Get Started" to explore the catalog
3. Use the theme button to switch between color schemes
4. Select language (English/العربية) from the top-right dropdown

## 📱 Mobile Optimization

- Optimized navbar buttons (smaller, better spacing on mobile)
- Responsive grid layouts (1-column on mobile, multi-column on desktop)
- Touch-friendly interface with appropriate padding and sizes
- Adaptive catalog hero section

## 🔌 Supabase Integration

Data is fetched from Supabase (`apps` table):
- Apps, Books, Articles, Mods, Audio, Services
- Filterable by category
- Search functionality
- Product details with screenshots

## 📄 Pages

### `index.html` — Landing Page
- Brand hero section with logo and title
- Feature overview
- CTA buttons to catalog

### `home.html` — Catalog Page
- Category tabs (All, Apps, Books, Mods, Audio, Services)
- Search bar
- Product grid with type-specific card layouts
- Instant theme switcher

### `product.html` — Product Detail
- Product information and screenshots
- Download/action buttons
- PDF viewer integration option

## ⚙️ Technologies

- **HTML5** — Semantic structure
- **CSS3** — Custom properties, Flexbox, Grid, animations
- **JavaScript (Vanilla)** — No frameworks
- **Supabase** — Data backend
- **Responsive Design** — Mobile-first

## 🎯 Features

✅ Instant theme switching  
✅ Multi-language support (EN/AR)  
✅ Mobile-responsive navigation  
✅ Product filtering and search  
✅ Smooth animations and transitions  
✅ Premium visual design system  
✅ Optimized performance  

## 📝 Notes

- All files use absolute paths to the new directory structure
- CSS variables enable easy theme customization
- JavaScript is modular and maintainable
- No build tools required — works out of the box

---

**Version**: 4.0  
**Last Updated**: 2026  
**Status**: Production Ready
