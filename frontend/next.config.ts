import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75, 82],
  },

  // Short links for social posts. Each one sends visitors to the page with
  // a source tag, which the traffic tracker records.
  async redirects() {
    return [
      // Homepage: africacreativeshowcase.com/ig
      { source: "/ig", destination: "/?utm_source=instagram", permanent: false },
      { source: "/fb", destination: "/?utm_source=facebook", permanent: false },
      { source: "/x", destination: "/?utm_source=x", permanent: false },
      { source: "/wa", destination: "/?utm_source=whatsapp", permanent: false },
      { source: "/tt", destination: "/?utm_source=tiktok", permanent: false },
      { source: "/li", destination: "/?utm_source=linkedin", permanent: false },
      { source: "/yt", destination: "/?utm_source=youtube", permanent: false },

      // Any other page: africacreativeshowcase.com/register/ig
      { source: "/:path+/ig", destination: "/:path+?utm_source=instagram", permanent: false },
      { source: "/:path+/fb", destination: "/:path+?utm_source=facebook", permanent: false },
      { source: "/:path+/x", destination: "/:path+?utm_source=x", permanent: false },
      { source: "/:path+/wa", destination: "/:path+?utm_source=whatsapp", permanent: false },
      { source: "/:path+/tt", destination: "/:path+?utm_source=tiktok", permanent: false },
      { source: "/:path+/li", destination: "/:path+?utm_source=linkedin", permanent: false },
      { source: "/:path+/yt", destination: "/:path+?utm_source=youtube", permanent: false },
    ];
  },
};

export default nextConfig;