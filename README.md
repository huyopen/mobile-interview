# Mobile Interview

Expo Managed recreation of the `khoảnh khắc đáng nhớ` section from the ZIM homepage.

## Setup

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm start
```

Open targets:

- `npm run ios`
- `npm run android`
- `npm run web`

## Build Notes

For this phase, the project focuses on recreating the section in Expo and does not include APK or iOS release packaging yet. The recommended demo path is Expo development flow.

## Solution Summary

- Built with Expo Managed and React Native.
- Recreated the `khoảnh khắc đáng nhớ` block as a standalone Expo screen.
- Reused the real thumbnail URLs, count, section copy, and card text structure from the public homepage markup.
- Split the UI into focused components:
  - `MemorableMomentsSection`
  - `MomentCard`
- Added a horizontal snapping carousel with centered active card, dark overlays, and caption treatment to match the source layout direction.
