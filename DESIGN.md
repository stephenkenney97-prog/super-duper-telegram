---
name: Existing Interface Conventions
market:
  colors:
    page: "#0A0D12"
    textPrimary: "#FFFFFF"
    textSecondary: "#C3C2B7"
    textMuted: "#898781"
    pWave: "#3987E5"
    sWave: "#D95926"
    surfaceWave: "#199E70"
    good: "#0CA30C"
    warning: "#FAB219"
    critical: "#D03B3B"
  font: "'Courier New', ui-monospace, monospace"
  panelRadius: "10px"
  viewportInset: "14px"
plants:
  pageClass: "bg-gray-50"
  textClass: "text-gray-900"
  primaryClass: "bg-green-600"
  primaryHoverClass: "hover:bg-green-700"
  focusClass: "focus:ring-green-500"
  fontClass: "font-sans"
---

This repository has two distinct UI styles. Choose the section for the interface
being changed. The values above record existing CSS and utility classes; the
frontmatter is a design reference, not a runtime configuration file.

## Market seismograph

A compact scientific instrument display frames an animated terrain. Dark navy
surfaces, restrained blue borders, monospace labels, and prominent numerical
readouts establish the hierarchy. Keep the 3D scene full screen with translucent,
blurred panels layered above it.

Use the wave colors consistently in the terrain, legend, and readouts: blue for
P waves, orange for S waves, and green for surface waves. Pair color with labels.
Preserve the page's existing CSS custom properties as the source of runtime
color values.

Use compact 12px panel text, uppercase section titles, tabular numerical values,
and larger price and magnitude figures. Controls use subdued blue backgrounds
and borders. Keep the coin selector, test tremor, orbit control, feed status, and
disclaimer readable and reachable as the viewport changes.

Feed status must distinguish live, simulated, and unavailable states in text as
well as color. Keep the explanation that seismic motion is artistic and the
magnitude is synthetic visible when changing the layout.

## Plant tracker

A calm greenhouse notebook: light gray pages, white content surfaces, green
actions, plant imagery, and clear sans-serif text. Follow the existing utility
class conventions and shared components rather than introducing another styling
system.

The dashboard uses a wrapping header and a responsive card grid: one column by
default, two at `sm`, three at `lg`, and four at `xl`. Preserve comfortable gaps
and a clear primary Add plant action. Follow the existing rounded corners and
subtle shadows used by cards and buttons.

Use the common Modal, FileUploader, LoadingState, and ErrorState components.
Modals use a dark blurred backdrop, white rounded content, a clear title, close
control, and scrollable body. Preserve Escape handling and focus restoration;
new controls need accessible names and visible keyboard focus.

Keep loading, empty, error, and saving states distinct. Use plain language for
plant care and errors. Show progress and disable duplicate submissions during
saves. Keep layout usable with long plant names and missing images.

## Reviewing changes

Check the affected interface at desktop and narrow widths. Check keyboard access,
readability, and relevant loading, error, and empty states. The React source needs
a host build and runtime configuration before browser verification is possible;
record that limitation when those are unavailable.
