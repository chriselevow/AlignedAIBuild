interface PromptData {
  query?: string;
  currentHtml?: string;
  currentFeedback?: string;
  theme?: string;
}

export function constructPrompt(data: PromptData): string {
  const { query = '', currentHtml = '', currentFeedback = '', theme = '' } = data;
  const hasFeedback = currentFeedback.length > 0;

  const themeInstructions = query.length > 0
    ? `Apply the user's "${theme}" theme preference throughout. ${
        theme === 'dark'
          ? 'Use rich dark backgrounds (e.g. #0f0f0f, #1a1a2e) with high-contrast light text and vibrant accent colors.'
          : theme === 'light'
          ? 'Use clean white/light-gray backgrounds with dark text and refined accent colors.'
          : 'Use a neutral adaptive palette that looks polished in both light and dark contexts.'
      } Ensure WCAG AA contrast ratios are met for all text.`
    : '';

  const finalPrompt = `${currentHtml ? `<current html>${currentHtml}</current html>` : ''}
${currentFeedback ? `<feedback>${currentFeedback}</feedback>` : ''}
${!hasFeedback && query ? `<query>Generate a single HTML file based on this query: "${query}"</query>` : ''}
${`<output instructions>
Produce a single, self-contained HTML file of the highest possible quality. Follow every rule below without exception.

LAYOUT & STRUCTURE
- Use semantic HTML5 elements (header, nav, main, section, article, footer, etc.).
- Design a full-page layout that fills the viewport (min-height: 100vh) with no orphaned whitespace.
- Use a clear visual hierarchy: prominent heading, supporting subtext, primary action, secondary content.
- Make the layout fully responsive — mobile-first with Tailwind breakpoints (sm, md, lg, xl).

STYLING — load Tailwind in <head>: <script src="https://cdn.tailwindcss.com"></script>
- Extend Tailwind inside a <script> tag using tailwind.config to add any custom colors or fonts needed.
- Apply generous spacing (padding, margins, gaps) for a clean, uncluttered feel.
- Round corners on cards, buttons, and inputs (rounded-xl or rounded-2xl).
- Use consistent, purposeful shadow levels (shadow-sm for cards, shadow-md for elevated elements).
- Add subtle hover and focus transitions (transition-all duration-200) on all interactive elements.
- Use a cohesive 2–3 color palette: one primary brand color, one neutral, one accent/highlight.
${themeInstructions}

TYPOGRAPHY
- Import and apply a Google Font via @import in a <style> tag (e.g. Inter, Poppins, or a suitable pairing).
- Set a clear type scale: hero/display (3xl–5xl), headings (xl–2xl), body (base), captions (sm).
- Use font-weight contrast (bold headings, regular body, medium labels) for visual rhythm.

COMPONENTS & INTERACTIVITY
- Include at least one visually polished primary call-to-action button with hover + active states.
- Add realistic placeholder content (not lorem ipsum) that fits the app's purpose.
- Include micro-interactions where appropriate: button press feedback, input focus rings, card hover lifts.
- If the app has forms, validate required fields and show inline error states using JavaScript.
- If the app shows data, render it in a clean table or card grid rather than raw text.

CODE QUALITY
- Write clean, well-indented HTML with logical class groupings.
- Keep all JavaScript inline in a <script> tag at the bottom of <body>; no external JS libraries unless essential.
- Use CSS custom properties (--color-primary, etc.) in a <style> tag for theming tokens when helpful.
- Do NOT use placeholder images (no placehold.it or lorempixel); use SVG icons or CSS shapes instead.

Return ONLY the complete HTML wrapped in triple backticks with the html specifier:
\`\`\`html
<your complete html here>
\`\`\`
</output instructions>`}
`.trim();

  return finalPrompt;
}

