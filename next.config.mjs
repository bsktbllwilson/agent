/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Supabase Storage public bucket: <project>.supabase.co/storage/v1/…
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
