import { useEffect, useCallback } from 'react';

const useKeyboardNavigation = (handlers = {}) => {
  const handleKeyDown = useCallback((event) => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;

    // Prevent default browser behavior for our shortcuts
    const shouldPreventDefault = (key) => {
      const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', ' ', 'f', 's', 'c'];
      return navigationKeys.includes(key) && (ctrlKey || metaKey || altKey);
    };

    if (shouldPreventDefault(key)) {
      event.preventDefault();
    }

    // Handle keyboard shortcuts
    switch (key) {
      case 'f':
      case 'F':
        if (ctrlKey || metaKey) {
          // Ctrl+F or Cmd+F - Focus search
          if (handlers.onFocusSearch) {
            handlers.onFocusSearch();
          }
        }
        break;

      case 'Escape':
        // Escape - Clear selections or close modals
        if (handlers.onEscape) {
          handlers.onEscape();
        }
        break;

      case 'Enter':
        // Enter - Perform primary action
        if (handlers.onEnter) {
          handlers.onEnter();
        }
        break;

      case ' ':
        // Space - Toggle selection (when focused on selectable item)
        if (handlers.onSpace && !event.target.matches('input, textarea, [contenteditable]')) {
          event.preventDefault();
          handlers.onSpace();
        }
        break;

      case 'a':
      case 'A':
        if (ctrlKey || metaKey) {
          // Ctrl+A or Cmd+A - Select all
          event.preventDefault();
          if (handlers.onSelectAll) {
            handlers.onSelectAll();
          }
        }
        break;

      case 'ArrowUp':
        if (handlers.onArrowUp) {
          handlers.onArrowUp();
        }
        break;

      case 'ArrowDown':
        if (handlers.onArrowDown) {
          handlers.onArrowDown();
        }
        break;

      case 'ArrowLeft':
        if (handlers.onArrowLeft) {
          handlers.onArrowLeft();
        }
        break;

      case 'ArrowRight':
        if (handlers.onArrowRight) {
          handlers.onArrowRight();
        }
        break;

      default:
        break;
    }
  }, [handlers]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    // Utility functions for focus management
    focusElement: (selector) => {
      const element = document.querySelector(selector);
      if (element) {
        element.focus();
      }
    },

    focusFirstFocusable: (containerSelector) => {
      const container = document.querySelector(containerSelector);
      if (container) {
        const focusableElements = container.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    }
  };
};

export default useKeyboardNavigation;