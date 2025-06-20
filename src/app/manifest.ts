import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alé Pouroullis - Software Engineer & Writer",
    short_name: "Alé Pouroullis",
    description:
      "Personal website of Alé Pouroullis - software engineer, product builder, and occasional writer on career, ambition, and philosophy.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#2a2a2a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
