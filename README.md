# PicScreen - Ref & Palette Extractor 🎨

A lightweight Google Chrome extension designed for 3D artists, developers, and designers. PicScreen allows users to instantly extract HEX color palettes (both CSS-based and image-based) and batch-download visual references directly into a `.zip` file.

[📥 Install from the Chrome Web Store](https://chromewebstore.google.com/detail/picscreen-ref-palette-ext/khhbokhoiaahdhbjlaegafmcjndlhblo)

## Core Features

- **Dual Color Extraction:** Automatically generates HEX palettes from DOM elements and loaded images via Canvas API.
- **Native Eyedropper:** Integrated with the `window.EyeDropper` API for pixel-perfect color picking.
- **Batch Export:** Bypasses CORS restrictions using Manifest V3 `declarativeNetRequest` to package all page images into a single `.zip` file using JSZip.
- **Local Processing:** 100% client-side processing ensuring user privacy and speed.

## Tech Stack

- HTML5, CSS3, JavaScript (ES6+)
- Chrome Extensions API (Manifest V3)
- JSZip for client-side archiving

## Local Installation (Developer Mode)

1. Clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the cloned folder.
