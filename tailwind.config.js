/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        // Web parity: Host Grotesk (headlines/names/prices) + Manrope (muted copy).
        // Each weight is its own loaded family — use these INSTEAD of
        // font-bold/font-semibold (weight classes conflict with custom families).
        "grotesk": ["HostGrotesk_400Regular"],
        "grotesk-medium": ["HostGrotesk_500Medium"],
        "grotesk-semibold": ["HostGrotesk_600SemiBold"],
        "grotesk-bold": ["HostGrotesk_700Bold"],
        "grotesk-extrabold": ["HostGrotesk_800ExtraBold"],
        "manrope": ["Manrope_400Regular"],
        "manrope-medium": ["Manrope_500Medium"],
        "manrope-semibold": ["Manrope_600SemiBold"],
        "manrope-bold": ["Manrope_700Bold"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gold: {
          light: "hsl(var(--gold-light))",
          DEFAULT: "hsl(var(--gold-primary))",
          dark: "hsl(var(--gold-dark))",
          darker: "hsl(var(--gold-darker))",
        },
        "black-pure": "hsl(var(--black-pure))",
        "black-soft": "hsl(var(--black-soft))",
        "black-medium": "hsl(var(--black-medium))",
        "black-light": "hsl(var(--black-light))",
      },
    },
  },
  plugins: [],
};
