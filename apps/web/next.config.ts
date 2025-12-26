import path from "path";
import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const config: NextConfig = {
  transpilePackages: ["@unisane/ui", "@unisane/tokens"],
  turbopack: {
    root: path.join(process.cwd(), "..", ".."),
  },
  pageExtensions: ["ts", "tsx", "mdx"],
};

export default withMDX(config);
