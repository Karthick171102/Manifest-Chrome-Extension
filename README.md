![Manifest Logo](public/icons/logo-light.svg)

## What Manifest Do?

This extension addresses the need for efficient web page inspection and design iteration. Its core purpose is to enable developers and designers to:

- **Visually inspect** any web page element with detailed tooltip information
- **Make live edits** to text content, colors, and fonts directly on the page
- **Generate structured prompts** in both human-readable and JSON formats for agent IDEs
- **Track changes** with before/after diffs for documentation

By bridging the gap between visual design and code-based implementation, the extension streamlines the workflow of capturing and communicating design changes, making it easier to collaborate with team members or document modifications for future reference.

## Compatible Browsers

- Google Chrome (Manifest V3)
- Microsoft Edge (Chromium-based)

## Tech Stack

- **Frontend**: React 18 + TypeScript with strict typing
- **Extension Architecture**: Manifest V3 with modern Chrome extension APIs
- **Styling**: Tailwind CSS 3.4 with dark mode support
- **Runtime**: Node.js 18+ for development and build scripts
- **Build Tool**: Vite for fast development and production builds
- **State Management**: React hooks for component state, custom hooks for side effects
- **Message Passing**: Chrome runtime API for communication between content script, background script, and side panel
- **Type System**: Shared TypeScript types across content script and panel for type safety

## How to Use

### Prerequisites

- Google Chrome or Microsoft Edge (Chromium-based browser) version 93+
- Node.js 18+ (for development and build tools)
- Git (for cloning the repository)

### Installation

1. **Clone the repository** or download the extension files:
   ```bash
   git clone https://github.com/your-username/manifest-chrome-extension.git
   cd manifest-chrome-extension
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Load the extension**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in the top right corner)
   - Click **Load unpacked** and select the `dist` or root extension directory
   - The extension icon will appear in your Chrome toolbar

### Usage Workflow

#### 1. Open Side Panel

- Click the "Manifest" extension icon in your Chrome toolbar
- The side panel will slide open on the right side of the browser
- If the panel doesn't open, ensure the extension is enabled in `chrome://extensions/`

#### 2. Select an Element

- Click the **"Select Element"** button in the side panel
- Your cursor will change to a crosshair icon
- Move the cursor over any web page element
- A sleek overlay highlight will appear around the hovered element
- A tooltip will display:
  - HTML tag name (e.g., `div`, `span`, `p`)
  - Element ID (if present)
  - CSS classes (space-separated list)
- **Click an element** to lock the selection and open the editor panel

#### 3. Edit the Element

Once an element is selected, the side panel will display editing options:

- **Text**: Textarea showing the current element content. Modify the text and it updates live on the page
- **Color**: Color picker to change the text color. Supports HEX, RGB, and HSL formats
- **Font**: Dropdown to select from popular Google Fonts, or manually specify:
  - Font family (e.g., `Arial`, `Roboto`, `Open Sans`)
  - Font size (in px, em, or rem)
  - Font weight (100-900 or numeric values)
  - Line-height (multiplier or numeric value)

All changes apply **live** on the page immediately, allowing you to see the effects in real-time.

#### 4. Generate Prompt

- Click the **"Generate Prompt"** button in the side panel
- Two formats will be displayed side-by-side:

  - **Text Prompt**: Human-readable format structured for easy pasting into an agent IDE or documentation. Includes:
    - Element selector (CSS selector)
    - Original and new text content
    - Color changes (HEX values)
    - Font family, size, weight, and line-height

  - **JSON Prompt**: Structured JSON describing all changes. Format includes:
    ```json
    {
      "selector": "selector-string",
      "changes": {
        "text": "original → modified",
        "color": "#hex-value",
        "font": {
          "family": "font-name",
          "size": "size-value",
          "weight": numeric,
          "lineHeight": numeric
        }
      }
    }
    ```
- Click **"Copy Prompt"** to copy either format to your clipboard
- The prompt can then be pasted into your IDE, documentation, or shared with team members

#### 5. Reset

- Use the **"Reset Selection"** button to clear the current element selection and return to default state
- Use the **"Undo"** button to revert the most recent change
- Both reset options are available in the side panel header

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Esc** | Deactivate pointer mode and reset selection |
| **Tab** | Navigate between panel sections (Text, Color, Font, Prompt) |
| **Ctrl+C / Cmd+C** | Copy the currently selected prompt format (Text or JSON) |
| **Ctrl+Z / Cmd+Z** | Undo the last change (if available) |

### Development Tips

- After making code changes, reload the extension at `chrome://extensions` to see updates
- Use `npm run build` to compile for production
- Inspect runtime messages in the Chrome DevTools Console for debugging
- The content script and panel communicate via typed message passing - ensure type consistency
