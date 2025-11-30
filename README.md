# VideoCharts Web

Generate animated chart videos directly in your browser - no server, no installation, works offline!

## Features

- 100% client-side - everything runs in your browser
- No server required - completely stateless
- Works offline - PWA ready
- Drag & drop data files (JSON)
- Real-time preview
- Customizable colors, fonts, and duration
- Export to WebM video format
- Lightweight (~300KB total)

## Quick Start

### 1. Open the Application

Simply open `index.html` in a modern web browser (Chrome, Firefox, Edge, or Safari).

Or use a local web server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx http-server -p 8000
```

Then navigate to `http://localhost:8000`

### 2. Load Your Data

**Option A: Use Example Data**
- Click "Carica Esempio" to load sample data

**Option B: Upload Your Own JSON**
- Drag and drop a JSON file, or
- Click "Sfoglia File" to select a file

**Data Format:**

```json
{
  "countries": ["USA", "Germany", "Italy"],
  "gdp": [80000, 70000, 35000]
}
```

### 3. Customize

Configure your chart:
- **Title**: Chart title text
- **Colors**: Bar color and background
- **Font Size**: Adjust text size
- **Duration**: Video length (3-10 seconds)
- **Resolution**: 480p, 720p, or 1080p

### 4. Generate Video

Click "Genera Video" and wait for the animation to render. When complete, the video will be available for preview and download.

## Project Structure

```
videocharts-web/
├── index.html              # Main HTML file
├── css/
│   ├── main.css           # Base styles
│   ├── controls.css       # Form controls
│   └── chart-preview.css  # Preview area
├── js/
│   ├── app.js            # Main application
│   └── modules/
│       ├── DataLoader.js     # Data loading & validation
│       ├── ChartRenderer.js  # Chart.js rendering
│       ├── VideoRecorder.js  # MediaRecorder video generation
│       ├── Animator.js       # GSAP animation timeline
│       └── ConfigManager.js  # Configuration management
├── lib/
│   ├── chart.min.js      # Chart.js library
│   └── gsap.min.js       # GSAP animation library
├── assets/
│   ├── fonts/
│   │   ├── xkcd-script.ttf
│   │   └── fonts.css
│   └── examples/
│       └── video-data.json
└── README.md
```

## Browser Compatibility

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome  | 87+            | ✅ Full support |
| Firefox | 85+            | ✅ Full support |
| Edge    | 87+            | ✅ Full support |
| Safari  | 14.1+          | ⚠️  Limited (MP4 codec) |

## Technical Details

### Technologies Used

- **Chart.js** (~200KB) - Chart rendering
- **GSAP** (~50KB) - Smooth animations
- **MediaRecorder API** (native) - Video recording
- **Vanilla JavaScript** - No heavy frameworks

### Video Format

- **Default**: WebM with VP9 codec (Chrome, Firefox, Edge)
- **Safari**: MP4 with H.264 codec
- **Bitrate**: 5 Mbps
- **Frame Rate**: 30 fps

### Limitations

- Maximum video duration: ~5 minutes (memory constraints)
- Maximum resolution: 1920x1080 (performance)
- Video codec: WebM (not MP4) on most browsers
- File size: ~5-20MB for a 5-second video

## Data Format Specification

Your JSON file must follow this structure:

```json
{
  "countries": ["Country1", "Country2", "Country3"],
  "gdp": [value1, value2, value3]
}
```

**Requirements:**
- Both arrays must have the same length
- `gdp` values must be valid numbers
- At least one data point required
- Maximum recommended: 10-12 bars for best visibility

## Offline Usage

This app works completely offline once loaded:

1. Open the app once while online
2. Browser will cache all resources
3. Close browser or disconnect internet
4. App continues to work offline

For full offline support, consider hosting as a PWA (Progressive Web App).

## Development

### Adding New Chart Types

1. Create rendering logic in `ChartRenderer.js`
2. Add animation timeline in `Animator.js`
3. Update data validation in `DataLoader.js`
4. Update UI in `index.html`

### Modifying Animations

Edit the timeline in `Animator.js`:

```javascript
// Example: Change animation timing
const titleDuration = this.duration * 0.3; // 30% for title
const barsDuration = this.duration * 0.5; // 50% for bars
```

## Troubleshooting

### Video not generating
- Check browser console for errors
- Ensure MediaRecorder is supported
- Try a different browser
- Reduce resolution or duration

### Preview not showing
- Check that data is valid JSON
- Verify array lengths match
- Check browser console

### Font not loading
- Ensure `assets/fonts/xkcd-script.ttf` exists
- Check browser console for font errors
- Fallback: Comic Sans MS will be used

## Credits

- **xkcd Font**: [ipython/xkcd-font](https://github.com/ipython/xkcd-font) (CC BY-NC 3.0)
- **Chart.js**: [chartjs.org](https://www.chartjs.org/)
- **GSAP**: [greensock.com](https://greensock.com/)

## License

This project is based on the original VideoCharts Python/Manim project.

## Migration from Python Version

This web app replicates the core functionality of the Python/Manim version:

| Python/Manim | Web App |
|--------------|---------|
| `manim render` | Click "Genera Video" |
| JSON data files | Same format supported |
| FFmpeg encoding | MediaRecorder API |
| 60fps | 30fps |
| MP4 output | WebM output (MP4 on Safari) |

**Advantages over Python:**
- No installation required
- Instant preview
- Accessible to non-technical users
- Works on any device with a browser

**Trade-offs:**
- WebM instead of MP4 (convertible after if needed)
- 30fps instead of 60fps
- Slightly lower video quality
- Limited to simpler animations
