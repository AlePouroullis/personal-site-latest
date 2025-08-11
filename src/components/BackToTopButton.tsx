"use client";

interface BackToTopButtonProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function BackToTopButton({
  className,
  style,
}: BackToTopButtonProps) {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={className}
      style={{
        ...style,
        background: "none",
        border: "none",
        padding: 0,
        font: "inherit",
        cursor: "pointer",
        color: "var(--link-color)",
        textDecoration: "underline",
        textDecorationColor:
          "color-mix(in srgb, var(--link-underline) 70%, transparent)",
        transition: "text-decoration-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecorationColor = "var(--link-underline)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecorationColor =
          "color-mix(in srgb, var(--link-underline) 70%, transparent)";
      }}
    >
      ↑ Back to top
    </button>
  );
}
