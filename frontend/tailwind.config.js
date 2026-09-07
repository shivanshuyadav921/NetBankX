/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Complete Color Archive — Dark Enterprise Color Architecture
        luxury: {
          // Dark Tonal Surfaces
          base: '#15181B',             // Deepest surface (Sidebar, Header, Canvas)
          bg: '#1B1D1B',               // Main page workspace background
          surface: '#1F1F1E',          // Primary cards & panels
          surfaceElevated: '#262624',  // Elevated cards & table headers
          surfaceControl: '#292A27',   // Inputs & secondary controls
          surfaceHover: '#30312D',     // Hover / selected / elevated interaction
          subtle: '#262624',           // Secondary panels

          // High-Contrast Text Hierarchy
          text: '#F2EEE9',             // Primary text
          textSecondary: '#D3CEC4',    // Secondary text
          textMuted: '#B8ADA1',        // Muted labels & timestamps
          textDisabled: '#8F8A82',     // Disabled text
          taupe: '#A88867',            // Warm earth accent

          // Borders
          border: '#343633',           // Default border
          borderSubtle: '#343633',     // Subtle border
          borderStrong: '#4A4B46',     // Elevated border
          borderFocus: '#4F6F73',      // Focus ring / active border

          // Dark Navigation & Shell
          charcoal: '#15181B',         // Deep sidebar
          charcoalSurface: '#262624',  // Dark card background
          charcoalHover: '#30312D',    // Dark hover state
          charcoalBorder: '#343633',   // Dark border
          charcoalText: '#F2EEE9',     // Warm ivory text on dark
          charcoalMuted: '#B8ADA1',    // Muted text on dark

          // Primary Brand: Muted Teal / Slate Family
          slateSubtle: '#8FA3A6',      // Subtle info / packet telemetry
          slateSecondary: '#6E8888',   // Secondary interactive accent / healthy links
          slate: '#4F6F73',            // Primary brand interaction
          slateDark: '#295155',        // Deep active / selected / emphasis
          slateHover: '#295155',       // Primary hover
          slateLight: '#262624',       // Subtle dark card fill

          // Teal Family
          teal: '#4F6F73',
          tealSoft: '#295155',

          // Green / Sage Family
          sage: '#607758',             // Muted Sage / Olive
          forest: '#607758',           // Healthy node / operational
          success: '#607758',          // Success
          successBg: '#1E2B1E',
          successBorder: '#3E5E3F',

          // Warm Earth & Leather / Ochre
          earth: '#A88867',            // Warm earth
          leather: '#A88867',          // Financial highlights
          ochre: '#B89F6A',            // Restrained amber / ochre

          // Semantics
          burgundy: '#7B1E20',         // Critical Security Alert / Blocked / Failed
          burgundyBg: '#2E1517',
          burgundyBorder: '#6E2C36',
          terracotta: '#B74E32',       // High Risk Warning / Suspicious
          terracottaBg: '#2E1D19',
          terracottaBorder: '#8A3B26',
          amber: '#B89F6A',            // Caution / Moderate / Warning
          amberBg: '#2A261C',
          amberBorder: '#6B5A36',
        },
        // Backward compatibility mappings
        brand: {
          dark: '#15181B',
          card: '#1F1F1E',
          cardHover: '#30312D',
          border: '#343633',
          gold: '#A88867',
          goldDim: '#B89F6A',
          cyan: '#4F6F73',
          emerald: '#607758',
          crimson: '#7B1E20',
          amber: '#B89F6A',
          indigo: '#4F6F73'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      },
      boxShadow: {
        'luxury-sm': '0 1px 3px rgba(24, 27, 30, 0.04), 0 1px 2px rgba(24, 27, 30, 0.02)',
        'luxury-md': '0 4px 6px -1px rgba(24, 27, 30, 0.05), 0 2px 4px -2px rgba(24, 27, 30, 0.03)',
        'luxury-lg': '0 10px 15px -3px rgba(24, 27, 30, 0.06), 0 4px 6px -4px rgba(24, 27, 30, 0.04)',
      }
    },
  },
  plugins: [],
}
