import "./Loader.css";

function Loader({
  text = "Loading...",
  size = "md",
  className = "",
}) {

  const safeSize =
    ["sm", "md", "lg"].includes(size)
      ? size
      : "md";

  return (
    <div
      className={
        `ssw-loader ssw-loader--${safeSize} ${className}`.trim()
      }
      role="status"
      aria-live="polite"
      aria-label={text || "Loading"}
    >

      <img
        className="ssw-loader__logo"
        src="/development/m3south/safesiteworks-logo.png"
        alt="SafeSiteWorks"
      />

      <div
        className="ssw-loader__progress"
        aria-hidden="true"
      >
        <span className="ssw-loader__progress-bar" />
      </div>

      {text && (
        <div className="ssw-loader__text">
          {text}
        </div>
      )}

    </div>
  );
}

export default Loader;
