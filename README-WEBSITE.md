# Sheety Tools Website

Free productivity tools. Simple, beautiful, and built for focus.

## File Structure

```
sheety.tools/
├── index.html              # Homepage (landing page)
├── homepage.css            # Homepage styles
├── focus-budget.html       # Focus Budget app
├── styles.css              # Focus Budget styles
├── app.js                  # Focus Budget logic
├── utils.js                # Focus Budget utilities
├── storage.js              # Focus Budget storage
├── Sheety_Logo.png         # Logo
└── Sparkle_mug.gif         # Ko-fi button
```

## Current Products

### Focus Budget
- **File**: `focus-budget.html`
- **Description**: Visualize priorities with a pie chart where each item is worth 2× the next
- **Status**: ✅ Live

## License

**Proprietary Software**  
© 2026 Sheety Tools. All rights reserved.

All code, design, and functionality are proprietary. You may use the tools freely, but you may not copy, modify, redistribute, or sell the software.

## Deployment

### Custom Domain
Point your domain to your hosting provider's nameservers.

For `sheety.tools`:
- Set up DNS A records
- Enable HTTPS/SSL

### GitHub Pages
1. Push to a GitHub repository (set to private if desired)
2. Enable GitHub Pages in repository settings
3. Set source to `main` branch, root folder

### Netlify
1. Connect your repository
2. Build command: (none)
3. Publish directory: `/`

## Customization

### Update Links
Search for these placeholders and replace:
- `https://twitter.com/yourusername` - Your Twitter
- `https://ko-fi.com/sheetytools` - Your Ko-fi page

### Colors
Edit CSS variables in `homepage.css`:

```css
:root {
  --bg: #0b0d12;           /* Background */
  --accent: #6ae3b4;       /* Primary accent */
  --accent-hover: #7ff0c4; /* Accent hover */
  /* ... */
}
```

### Logo
Replace `Sheety_Logo.png` with your own logo (recommended: 512×512px PNG)

## Support

If you find these tools useful, consider supporting development:
- Ko-fi: https://ko-fi.com/sheetytools

## Contact

- Website: https://sheety.tools
- Twitter: https://twitter.com/yourusername

---

Built with ❤️ by Sheety Tools
