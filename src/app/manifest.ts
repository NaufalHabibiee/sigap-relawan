import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sigap — panggilan relawan",
    short_name: "Sigap",
    description: "Temukan panggilan relawan yang cocok untukmu.",
    start_url: "/",
    display: "standalone",
    background_color: "#eeece5",
    theme_color: "#1b2430",
    lang: "id",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
