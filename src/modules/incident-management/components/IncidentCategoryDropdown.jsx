import React, { useState, useRef, useEffect } from "react";

/**
 * Custom single-select dropdown for Incident Category in Heads-Up form.
 * Displays checkboxes on the left side of each category item to clearly
 * show which category is currently selected, while strictly enforcing single selection.
 */
const IncidentCategoryDropdown = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Select Incident Category...",
  hasError = false,
  disabled = false,
  id = "incident-category-dropdown"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation (Escape to close)
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if ((e.key === "Enter" || e.key === " ") && !isOpen) {
      e.preventDefault();
      if (!disabled) setIsOpen(true);
    }
  };

  const handleSelect = (category) => {
    if (disabled) return;
    // Strict single selection: selecting an option sets it as the active selection
    if (onChange) {
      onChange(category);
    }
    setIsOpen(false);
  };

  return (
    <div className="im-select-container" ref={containerRef} id={id}>
      <button
        type="button"
        className={`im-select-trigger ${isOpen ? "open" : ""} ${hasError ? "has-error" : ""}`}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`im-select-value ${!value ? "im-select-placeholder" : ""}`}>
          {value || placeholder}
        </span>
        <span className={`im-select-arrow ${isOpen ? "rotated" : ""}`}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="im-select-dropdown" role="listbox">
          {options.map((cat) => {
            const isSelected = value === cat;
            return (
              <div
                key={cat}
                role="option"
                aria-selected={isSelected}
                className={`im-select-option ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelect(cat)}
              >
                {/* Left side checkbox for clear visual confirmation of selection */}
                <div className="im-select-checkbox">
                  {isSelected && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>

                <span className="im-select-option-label">{cat}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IncidentCategoryDropdown;
