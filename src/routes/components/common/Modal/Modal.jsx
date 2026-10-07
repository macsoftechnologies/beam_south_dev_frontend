import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import "./Modal.css";

function Modal({
  open,
  onClose,
  title,
  children,

  size = "md",

  centered = false,
  scrollable = false,
  backdropClosable = true,

  type = "default",
  hideDot = false,

  footer,

  fullscreen = false,
}) {

  /* Lock body scroll while open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  /* Size class */
  let sizeClass = "";
  switch (size) {
    case "sm":  sizeClass = "beam-modal-sm";  break;
    case "lg":  sizeClass = "beam-modal-lg";  break;
    case "xl":  sizeClass = "beam-modal-xl";  break;
    default:    sizeClass = "beam-modal-md";
  }

  /* Type accent class (colours the top border + dot) */
  const typeClass = `beam-modal--${type}`;

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        className="beam-modal-backdrop"
        onClick={() => backdropClosable && onClose && onClose()}
      />

      {/* Positioning wrapper */}
      <div
        className={`
          beam-modal-positioner
          ${centered ? "beam-modal-positioner--centered" : ""}
        `}
      >
        {/* Dialog panel */}
        <div
          className={`
            beam-modal-dialog
            ${sizeClass}
            ${typeClass}
            ${fullscreen ? "beam-modal--fullscreen" : ""}
          `}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >

          {/* ── Header ── */}
          <div className="beam-modal-header">
            <div className="beam-modal-header-left">
              {!hideDot && <span className="beam-modal-accent-dot" />}
              <h5 className="beam-modal-title">{title}</h5>
            </div>
            <button
              className="beam-modal-close"
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* ── Body ── */}
          <div
            className={`
              beam-modal-body
              ${scrollable ? "beam-modal-body--scrollable" : ""}
            `}
          >
            {children}
          </div>

          {/* ── Footer (optional) ── */}
          {footer && (
            <div className="beam-modal-footer">
              {footer}
            </div>
          )}

        </div>
      </div>
    </>,
    document.body
  );
}

export default Modal;