The purpose of this documetn is to provide directives to AI agents on how to generate layouts and stylesheets consistent with the intended visual style.

First: Go into and read ./src/styles/variables.css and ./src/styles/widget-default.css

These styles are made available by default for all widgets and explain what you should be using.

Do NOT introduce new values where applicable variables can be used. Do NOT introduce new fonts, ever.
Use the fonts specified in these files entirely, either by using the --font-family-base variable or inheriting from widget-default.css by default.

Do NOT introduce new spacing values. Rely first on using the --line-height-base variable, and second on using the spacing variables made available to you.

The intended visual style is entirely monochromatic. Do NOT introduce new colors without exceptional justification (e.g., a button or input in settings, color coded elements where necessary to understand the information like the github contribution heatmap).

Likewise, ALL FONTS in the application WITHOUT EXCEPTION will be one of three sizes: --font-size-base, --font-size-small, and --font-size-large. Do NOT use --font-size-large except in EXCEPTIONAL circumstances. Do NOT use --font-size-large for headings. Do NOT use --font-size-large for emphasis.

Likewise, do NOT use italics or bold for emphasis. Likewise, do NOT use color for emphasis. All text will be the default color (--color-text).

The design is typographically minimalist. Monochrome greys.

Maintain utter adherence to this style guide at all times.