import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          950: "#07080D",
          900: "#0B0D14",
          800: "#12162447",
          850: "#0F1220",
          700: "#151A2C",
          600: "#1D2340",
        },
        aura: {
          violet: "#7C5CFF",
          cyan: "#00E5C7",
          pink: "#FF6B9D",
          amber: "#FFB454",
          emerald: "#34D399",
          sky: "#5EC8FF",
        },
        ink: {
          100: "#F1F1FA",
          200: "#E8EAF6",
          400: "#B7BBD9",
          600: "#8B90A8",
          800: "#565B77",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        xl2: "1.375rem",
        xl3: "1.75rem",
      },
      boxShadow: {
        glow: "0 0 24px -4px rgba(124,92,255,0.55), 0 0 60px -20px rgba(0,229,199,0.35)",
        "glow-sm": "0 0 12px -2px rgba(124,92,255,0.5)",
        "glow-cyan": "0 0 24px -4px rgba(0,229,199,0.55)",
        "glow-pink": "0 0 24px -4px rgba(255,107,157,0.55)",
        glass: "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 8px 40px -12px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "aura-gradient": "linear-gradient(135deg, #7C5CFF 0%, #00E5C7 100%)",
        "sheen": "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 40%)",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.06)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        drift: {
          "0%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(4px,-6px)" },
          "100%": { transform: "translate(0,0)" },
        },
        skySpin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        inkReveal: {
          "0%": { opacity: "0.3", filter: "blur(2px)" },
          "60%": { opacity: "0.75", filter: "blur(0.5px)" },
          "100%": { opacity: "1", filter: "blur(0)" },
        },
        settle: {
          "0%": { opacity: "0.5", transform: "scale(1.05)" },
          "100%": { opacity: "0.22", transform: "scale(1)" },
        },
      },
      animation: {
        // La durata legge una variabile CSS (impostata una volta sola da DayRhythm, vedi
        // components/DayRhythm.tsx) invece di un numero fisso: il "respiro" di tutta l'app
        // segue l'ora del giorno senza che ogni singolo componente debba saperlo. Il
        // ripiego è la stessa durata di sempre, per quel breve istante prima che la
        // variabile venga impostata al primo caricamento.
        pulseSoft: "pulseSoft var(--rhythm-pulse, 2.6s) ease-in-out infinite",
        float: "float var(--rhythm-float, 4s) ease-in-out infinite",
        // drift (il tremore individuale di ogni punto) e skySpin (la rotazione della scena)
        // restano a durata fissa apposta: non sono il "respiro", sono altri due linguaggi
        // di movimento con un significato diverso, e mischiarli col ritmo del giorno li
        // confonderebbe invece di distinguerli.
        drift: "drift 6s ease-in-out infinite",
        skySpin: "skySpin 240s linear infinite",
        skySpinReverse: "skySpin 240s linear infinite reverse",
        inkReveal: "inkReveal 1.1s ease-out forwards",
        // Una volta sola, non infinite: non un altro respiro, l'assenza di uno — una
        // candela che si assesta e resta ferma, invece di continuare a pulsare come i
        // viventi. Durata lunga e deliberata: non deve sembrare un effetto, deve sembrare
        // una quiete che si raggiunge.
        settle: "settle 3.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
