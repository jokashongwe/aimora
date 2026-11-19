import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Airoma",
    short_name: "Airoma",
    description:
      "Suivez vos objectifs, recevez des rappels motivationnels et partagez vos réussites.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0B163F",
    theme_color: "#0B163F",
    lang: "fr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}