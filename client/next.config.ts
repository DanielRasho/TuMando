import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  // reactCompiler : true, // Enable React Compiler for automatic memoization
  output : "standalone",
  env: {
    API_URL: process.env.API_URL,
  },
};

export default nextConfig;
