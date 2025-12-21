#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const API_URL = process.env.API_URL || "http://localhost:3000";
const OUTPUT_PATH = path.join(
  __dirname,
  "../.cursor/context/openapi-schema.json",
);

console.log("🚀 Generating OpenAPI schema from NestJS application...");

// Function to download OpenAPI spec
function downloadOpenAPISpec(url) {
  return new Promise((resolve, reject) => {
    const specUrl = `${url}/api-json`;
    console.log(`📥 Downloading OpenAPI spec from ${specUrl}`);

    const client = url.startsWith("https") ? https : http;

    client
      .get(specUrl, res => {
        let data = "";

        res.on("data", chunk => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const spec = JSON.parse(data);

            // Enhance the spec with additional metadata
            spec.info = spec.info || {};
            spec.info.title = "Cinematik API";
            spec.info.description =
              "Cinematik API - Movie management platform backend";
            spec.info.version = "0.1.1";
            spec.info.contact = {
              name: "API Support",
              email: "support@cinematik.com",
            };

            // Add servers
            spec.servers = [
              {
                url: "http://localhost:3000",
                description: "Development server",
              },
              {
                url: "https://api.cinematik.com",
                description: "Production server",
              },
            ];

            resolve(spec);
          } catch (error) {
            reject(new Error(`Failed to parse OpenAPI spec: ${error.message}`));
          }
        });
      })
      .on("error", error => {
        reject(error);
      });
  });
}

// Function to create default schema if server is not running
function createDefaultSchema() {
  console.log("⚠️  Server not running, creating default schema...");

  return {
    openapi: "3.0.0",
    info: {
      title: "Cinematik API",
      description: "Cinematik API - Movie management platform backend",
      version: "0.1.1",
      contact: {
        name: "API Support",
        email: "support@cinematik.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://api.cinematik.com",
        description: "Production server",
      },
    ],
    paths: {
      "/": {
        get: {
          tags: ["App"],
          summary: "API Root",
          operationId: "getRoot",
          responses: {
            200: {
              description: "API is running",
            },
          },
        },
      },
    },
    components: {
      schemas: {
        APIResponse_String: {
          type: "object",
          properties: {
            data: {
              type: "string",
              example: "Hello from Cinematik API!",
            },
            code: {
              type: "string",
              example: "OK",
            },
            message: {
              type: "string",
              example: "Request successful",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: new Date().toISOString(),
            },
          },
        },
      },
    },
    tags: [
      {
        name: "App",
        description: "General application endpoints",
      },
    ],
  };
}

// Main execution
async function generateSchema() {
  try {
    // Try to download from running server
    const spec = await downloadOpenAPISpec(API_URL);

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write schema to file
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(spec, null, 2));

    console.log(`✅ OpenAPI schema generated successfully!`);
    console.log(`📍 Output: ${OUTPUT_PATH}`);
    console.log(`📊 Total endpoints: ${Object.keys(spec.paths || {}).length}`);
    console.log(`🏷️  Total tags: ${spec.tags?.length || 0}`);

    // Generate summary report
    const summary = {
      generated: new Date().toISOString(),
      source: `${API_URL}/api-json`,
      endpoints: Object.keys(spec.paths || {}).length,
      tags: spec.tags?.length || 0,
      version: spec.info?.version,
      file: OUTPUT_PATH,
    };

    fs.writeFileSync(
      path.join(outputDir, "openapi-summary.json"),
      JSON.stringify(summary, null, 2),
    );
    console.log(
      `📝 Summary report: ${path.join(outputDir, "openapi-summary.json")}`,
    );
  } catch (error) {
    console.warn(`⚠️  Could not connect to server at ${API_URL}`);
    console.warn(`🔄 Error: ${error.message}`);

    // Create default schema as fallback
    try {
      const defaultSpec = createDefaultSchema();

      // Ensure output directory exists
      const outputDir = path.dirname(OUTPUT_PATH);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write default schema to file
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(defaultSpec, null, 2));

      console.log(`✅ Default OpenAPI schema created!`);
      console.log(`📍 Output: ${OUTPUT_PATH}`);
      console.log(
        `💡 Run your NestJS server and re-run this script to get the full schema`,
      );
    } catch (fallbackError) {
      console.error(
        "❌ Failed to create default schema:",
        fallbackError.message,
      );
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  generateSchema();
}

module.exports = { generateSchema, createDefaultSchema };
