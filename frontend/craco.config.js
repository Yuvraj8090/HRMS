// craco.config.js
const path = require("path");
require("dotenv").config();

/**
 * ENV FLAGS
 */
const isProduction = process.env.NODE_ENV === "production";
const enableHealthCheck = process.env.ENABLE_HEALTH_CHECK === "true";
const enableVisualEdits = false; // TEMP: plugin is unstable
 // DEV ONLY

/**
 * OPTIONAL MODULES (LAZY LOADED)
 */
let setupDevServer = null;
let babelMetadataPlugin = null;

if (enableVisualEdits) {
  try {
    setupDevServer = require("./plugins/visual-edits/dev-server-setup");
    babelMetadataPlugin = require("./plugins/visual-edits/babel-metadata-plugin");
  } catch (err) {
    console.warn("⚠️ Visual edits plugins failed to load:", err.message);
  }
}

let WebpackHealthPlugin = null;
let setupHealthEndpoints = null;
let healthPluginInstance = null;

if (enableHealthCheck) {
  try {
    WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
    setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
    healthPluginInstance = new WebpackHealthPlugin();
  } catch (err) {
    console.warn("⚠️ Health check plugins failed to load:", err.message);
  }
}

/**
 * CRACO CONFIG
 */
module.exports = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },

  babel: enableVisualEdits && babelMetadataPlugin
    ? {
        plugins: [
          [
            babelMetadataPlugin,
            {
              safeMode: true, // ← IMPORTANT (plugin must ignore invalid AST)
            },
          ],
        ],
      }
    : undefined,

  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },

    configure: (config) => {
      // Reduce watcher load
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/build/**",
          "**/dist/**",
          "**/coverage/**",
          "**/public/**",
        ],
      };

      // Health check plugin
      if (enableHealthCheck && healthPluginInstance) {
        config.plugins = config.plugins || [];
        config.plugins.push(healthPluginInstance);
      }

      return config;
    },
  },

  devServer: (devServerConfig) => {
    // Visual edits dev server setup
    if (enableVisualEdits && typeof setupDevServer === "function") {
      devServerConfig = setupDevServer(devServerConfig);
    }

    // Health endpoints
    if (
      enableHealthCheck &&
      setupHealthEndpoints &&
      healthPluginInstance
    ) {
      const originalSetup = devServerConfig.setupMiddlewares;

      devServerConfig.setupMiddlewares = (middlewares, devServer) => {
        if (originalSetup) {
          middlewares = originalSetup(middlewares, devServer);
        }

        setupHealthEndpoints(devServer, healthPluginInstance);
        return middlewares;
      };
    }

    return devServerConfig;
  },
};
