# TabMeter

A developer-oriented dashboard for your Chrome new tab page. Like Rainmeter, but for the browser you actually use.

## What It Does

TabMeter transforms your new tab page into a customizable dashboard of widgets. Weather, system stats, quick links, or whatever you can build—all displayed cleanly without ads or bloat.

You see your new tab page thousands of times a day. Make it useful.

## Features

- **Simple Widget API** - Drop in a JavaScript file, get a widget
- **Flexible Layout** - Drag, resize, and align widgets however you want
- **Sandboxed Execution** - Widgets can't interfere with each other
- **Zero Friction** - Right-click to add widgets, start configuring immediately

## Installation

TabMeter isn't on the Chrome Web Store. Install via developer mode:

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the TabMeter directory
5. Open a new tab and start building

## Usage

Right-click anywhere on your new tab page to add a widget. That's it.

Widgets are configured through simple JavaScript files. Move them around, resize them, delete them. The interface gets out of your way.

## Building Widgets

Widget development is straightforward JavaScript. Each widget is a self-contained file that defines its behavior, appearance, and configuration options.

Documentation and examples coming soon.

## Technical Details

Built with vanilla JavaScript, HTML, and CSS. No frameworks, no build process, no complexity.

**Permissions:**
- `storage` - Save your widget configurations
- `geolocation` (optional) - For location-based widgets like weather

## Contributing

Contributions are welcome. File an issue first if you're planning something significant.

No formal guidelines—and I'm happy to help if you need.

## Privacy

TabMeter itself collects no data. However, widgets you install may access external services or APIs. Review widget code before installation, especially from third parties.

## Support

- **Issues:** File them on GitHub
- **Questions and feedback:** mac@ezm.ac
- **Feature requests:** GitHub issues

## License

MIT

---

*Built because seeing your new tab page 10,000 times a day should be useful, not annoying.*