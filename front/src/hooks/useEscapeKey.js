import { useEffect } from "react";

const isEditableTarget = (target) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

const hasOpenModal = () => Boolean(document.querySelector('[role="dialog"], .modal.d-block'));

export function useEscapeKey(active, onEscape) {
  useEffect(() => {
    if (!active) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onEscape();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, onEscape]);
}

export function useViewShortcutKeys(active, onFirstView, onSecondView) {
  useEffect(() => {
    if (!active) return undefined;

    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target) || hasOpenModal()) return;

      const key = event.key.toLowerCase();
      if (key === "a") {
        event.preventDefault();
        onFirstView();
      }

      if (key === "d") {
        event.preventDefault();
        onSecondView();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, onFirstView, onSecondView]);
}

export function useNavigationShortcutKeys(active, onPreviousSection, onNextSection) {
  useEffect(() => {
    if (!active) return undefined;

    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target) || hasOpenModal()) return;

      const key = event.key.toLowerCase();
      if (key === "w") {
        event.preventDefault();
        onPreviousSection();
      }

      if (key === "s") {
        event.preventDefault();
        onNextSection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, onPreviousSection, onNextSection]);
}

export function useTableSelectionShortcutKeys(active, onPreviousRow, onNextRow, onOpenRow) {
  useEffect(() => {
    if (!active) return undefined;

    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target) || hasOpenModal()) return;

      const key = event.key.toLowerCase();
      if (key === "q") {
        event.preventDefault();
        onPreviousRow();
      }

      if (key === "e") {
        event.preventDefault();
        onNextRow();
      }

      if (key === "enter" && onOpenRow) {
        event.preventDefault();
        onOpenRow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, onPreviousRow, onNextRow, onOpenRow]);
}
