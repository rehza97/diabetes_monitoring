import { useEffect } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}

// Common keyboard shortcuts for the dashboard
export const commonShortcuts: KeyboardShortcut[] = [
  {
    key: "k",
    ctrl: true,
    action: () => {
      // Global search - handled in Header component
      const event = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);
    },
    description: "Ouvrir la recherche globale",
  },
  {
    key: "n",
    ctrl: true,
    action: () => {
      window.location.href = "/dashboard/patients?action=add";
    },
    description: "Ajouter un nouveau patient",
  },
  {
    key: "r",
    ctrl: true,
    action: () => {
      window.location.href = "/dashboard/readings?action=add";
    },
    description: "Enregistrer une nouvelle mesure",
  },
  {
    key: "s",
    ctrl: true,
    action: () => {
      window.location.href = "/dashboard/search";
    },
    description: "Recherche avancée",
  },
  {
    key: "p",
    ctrl: true,
    action: () => {
      window.location.href = "/dashboard/patients";
    },
    description: "Aller aux patients",
  },
  {
    key: "u",
    ctrl: true,
    action: () => {
      window.location.href = "/dashboard/users";
    },
    description: "Aller aux utilisateurs",
  },
  {
    key: "d",
    ctrl: true,
    action: () => {
      window.location.href = "/dashboard";
    },
    description: "Aller au tableau de bord",
  },
];
