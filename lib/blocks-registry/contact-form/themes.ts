/**
 * 7 סגנונות עיצוב + מצב כהה/בהיר לכל אחד, בדיוק כמו בדוגמה שסופקה.
 * accent מוזרק דינמית (לא קבוע בטבלה) כדי שצבע מותאם-אישית יעבוד בכל תבנית.
 */
export interface ThemeVars {
  bg: string;
  panel: string;
  border: string;
  text: string;
  inputBg: string;
  panelCss: string;
}

export function getTheme(key: string, accent: string): { dark: ThemeVars; light: ThemeVars } {
  const themes: Record<string, (a: string) => { dark: ThemeVars; light: ThemeVars }> = {
    glass: () => ({
      dark: { bg: "linear-gradient(135deg, #0f172a, #1e293b)", panel: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", text: "#fff", inputBg: "rgba(0,0,0,0.2)", panelCss: "backdrop-filter: blur(16px); box-shadow: 0 8px 32px rgba(0,0,0,0.35); border-radius: 20px;" },
      light: { bg: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)", panel: "rgba(255,255,255,0.85)", border: "rgba(255,255,255,0.5)", text: "#1e293b", inputBg: "#fff", panelCss: "backdrop-filter: blur(16px); box-shadow: 0 8px 32px rgba(31,38,135,0.15); border-radius: 20px;" },
    }),
    cyber: (a) => ({
      dark: { bg: "#09090b", panel: "#18181b", border: a, text: "#e4e4e7", inputBg: "#000", panelCss: `box-shadow: 0 0 20px ${a}40; border: 1px solid ${a}; border-radius: 4px;` },
      light: { bg: "#f4f4f5", panel: "#ffffff", border: "#000", text: "#09090b", inputBg: "#f4f4f5", panelCss: `box-shadow: 5px 5px 0px ${a}; border: 2px solid #000; border-radius: 0px;` },
    }),
    ios: () => ({
      dark: { bg: "#000000", panel: "#1c1c1e", border: "#38383a", text: "#ffffff", inputBg: "#2c2c2e", panelCss: "border-radius: 24px;" },
      light: { bg: "#f2f2f7", panel: "#ffffff", border: "#e5e5ea", text: "#000000", inputBg: "#f2f2f7", panelCss: "border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.08);" },
    }),
    material: () => ({
      dark: { bg: "#121212", panel: "#1e1e1e", border: "#333", text: "#e0e0e0", inputBg: "#2d2d2d", panelCss: "border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);" },
      light: { bg: "#eceff1", panel: "#ffffff", border: "#cfd8dc", text: "#263238", inputBg: "#fafafa", panelCss: "border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" },
    }),
    ocean: () => ({
      dark: { bg: "#001a33", panel: "#003366", border: "#0059b3", text: "#e6f2ff", inputBg: "#002244", panelCss: "border-radius: 16px; box-shadow: inset 0 0 15px rgba(0,0,0,0.5);" },
      light: { bg: "#e6f2ff", panel: "#ffffff", border: "#b3d9ff", text: "#002244", inputBg: "#f0f7ff", panelCss: "border-radius: 16px; box-shadow: 0 8px 20px rgba(0,89,179,0.1);" },
    }),
    neon: (a) => ({
      dark: { bg: "#050505", panel: "#111", border: a, text: "#fff", inputBg: "#1a1a1a", panelCss: `border-radius: 12px; border: 2px solid ${a}; box-shadow: 0 0 15px ${a}, inset 0 0 10px ${a}33;` },
      light: { bg: "#fff", panel: "#fafafa", border: a, text: "#000", inputBg: "#fff", panelCss: `border-radius: 12px; border: 2px solid ${a}; box-shadow: 0 0 10px ${a};` },
    }),
    retro: () => ({
      dark: { bg: "#0000aa", panel: "#0000aa", border: "#ffffff", text: "#ffffff", inputBg: "#000055", panelCss: "border-radius: 0; border: 4px double #ffffff; box-shadow: 5px 5px 0 #000000;" },
      light: { bg: "#c0c0c0", panel: "#c0c0c0", border: "#000000", text: "#000000", inputBg: "#ffffff", panelCss: "border-radius: 0; border: 2px solid #000000; box-shadow: 3px 3px 0 #808080;" },
    }),
  };
  return (themes[key] ?? themes.glass)(accent);
}
