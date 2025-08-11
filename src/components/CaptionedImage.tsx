import Image from "next/image";

interface CaptionedImageProps {
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

export default function CaptionedImage({
  src,
  alt,
  title,
  width,
  height,
  ...props
}: CaptionedImageProps) {
  return (
    <figure
      style={{
        margin: "1.5rem 0",
        textAlign: "center",
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={width || 800}
        height={height || 600}
        style={{
          width: "100%",
          height: "auto",
          borderRadius: "6px",
          // boxShadow: "0 4px 8px rgba(216, 207, 193, 0.4)",
        }}
        {...props}
      />
      {title && (
        <figcaption
          style={{
            marginTop: "0.5rem",
            color: "var(--text-muted)",
            fontStyle: "italic",
            lineHeight: "1.4",
            textAlign: "left",
          }}
        >
          {title}
        </figcaption>
      )}
    </figure>
  );
}
