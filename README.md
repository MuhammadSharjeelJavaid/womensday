# International Women's Day Tribute Website

A premium 3-page static tribute website built with HTML, CSS, and vanilla JavaScript.

## Files

- `index.html` - home page
- `mother.html` - mother tribute page
- `sister.html` - sister tribute page
- `style.css` - shared styling
- `script.js` - interactions, music logic, transitions, animations
- `Mama.jpg` - mother photo
- `Sis.jpg` - sister photo
- `assets/womens-day-theme.mp3` - optional local background track

## Image Placement

`Mama.jpg` and `Sis.jpg` should stay in the project root (same folder as `index.html`).

If you replace them, keep the same filenames or update image paths inside `mother.html` and `sister.html`.

## Background Music (Add/Replace)

The pages are already wired to play this file path:

- `assets/womens-day-theme.mp3`

To add or replace music:

1. Create an `assets` folder if it does not exist.
2. Put your royalty-free instrumental track there.
3. Rename it to `womens-day-theme.mp3`.

Or keep your own filename and update this line on all 3 pages:

```html
<source src="assets/womens-day-theme.mp3" type="audio/mpeg">
```

Notes:

- Browsers may block autoplay until user interaction.
- The site handles this with a "Tap to enable music" overlay.
- Music mute/unmute state and playback position are preserved across pages when possible.

## Deploy to GitHub Pages

1. Create a new GitHub repository (public).
2. Upload all project files and folders.
3. Go to `Settings` -> `Pages`.
4. Under `Build and deployment`:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Click `Save`.
6. Wait for deployment and copy the URL shown in Pages settings.

Your site URL will look like:

`https://<username>.github.io/<repository-name>/`
