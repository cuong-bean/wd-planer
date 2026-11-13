/** @type {import('next').NextConfig} */
const nextConfig = {
  // Xuất ra web tĩnh (thư mục `out/`) để deploy lên Cloudflare Pages
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
