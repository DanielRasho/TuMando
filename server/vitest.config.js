import path from "node:path";
import {defineConfig} from "vitest/config";

export default defineConfig({
  // Let @ be the an alias to './test' folder
  resolve : {
    alias : {
      "@" : path.resolve(import.meta.dirname, "./tests"),
    },
  },
  test : {
    // Just run the main file, it will be the entry point for all tests.
    include: ["./tests/main.test.ts"],
    // Display a detailed report of tests
    reporters : [ [ "verbose" ] ],
    // globalSetup: ["./test/globalSetup.ts"],
    testTimeout : 10000,
    hookTimeout : 10000,
  },
  printConsoleTrace : true,
  silent : false,
});