#!/usr/bin/env node
/**
 * URDB MCP Server
 *
 * Exposes URDB product integrity data as tools for Claude Desktop and any
 * MCP-compatible host (Claude.ai, Cursor, Zed, etc.).
 *
 * Usage:
 *   npx urdb-mcp
 *
 * Requires env var: URDB_API_KEY (get one at https://urdb.io/settings/api-keys)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = "https://urdb.io/api/v1";
const API_KEY = process.env.URDB_API_KEY;

if (!API_KEY) {
  process.stderr.write("URDB_API_KEY env var is required\n");
  process.exit(1);
}

async function urdb(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

const server = new Server(
  { name: "urdb", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "urdb_search",
      description:
        "Search URDB for consumer products by name or keyword. Returns products with integrity scores (0-100). Use this first when the user asks about a product or wants product recommendations.",
      inputSchema: {
        type: "object",
        properties: {
          q: { type: "string", description: "Search query (product name, brand, or keyword)" },
          category: { type: "string", description: "Filter by category, e.g. 'Laptop', 'Smartphone', 'Refrigerator'" },
          min_score: { type: "number", description: "Minimum integrity score (0-100). Use 70+ for high-integrity results." },
        },
        required: ["q"],
      },
    },
    {
      name: "urdb_get_product",
      description:
        "Get full integrity breakdown for a specific product — scores across 7 dimensions (durability, repairability, material quality, version stability, anti-shrinkflation, firmware lock-in, ownership integrity), plus change event and recall counts.",
      inputSchema: {
        type: "object",
        properties: {
          slug: { type: "string", description: "Product slug from URDB (e.g. 'fairphone-6', 'framework-laptop-13')" },
        },
        required: ["slug"],
      },
    },
    {
      name: "urdb_get_changes",
      description:
        "Get documented enshittification events for a product — firmware regressions, warranty cuts, added subscriptions, material downgrades. All sourced and evidence-backed.",
      inputSchema: {
        type: "object",
        properties: {
          slug: { type: "string", description: "Product slug from URDB" },
          severity: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
            description: "Filter to this severity level",
          },
        },
        required: ["slug"],
      },
    },
    {
      name: "urdb_list_products",
      description:
        "List products filtered by category, brand, or score range. Use for recommendations like 'best integrity laptops' or 'washing machines above 70'.",
      inputSchema: {
        type: "object",
        properties: {
          category: { type: "string", description: "Category name (e.g. 'Laptop', 'Washing Machine')" },
          brand: { type: "string", description: "Brand slug (e.g. 'apple', 'samsung', 'framework')" },
          min_score: { type: "number", description: "Minimum integrity score (0-100)" },
          sort: { type: "string", enum: ["score", "name"], description: "Sort order — 'score' returns highest integrity first" },
          per_page: { type: "number", description: "Results per page (max 100)" },
        },
        required: [],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    if (name === "urdb_search") {
      result = await urdb("/search", args as Record<string, string>);
    } else if (name === "urdb_get_product") {
      const { slug, ...rest } = args as { slug: string };
      result = await urdb(`/products/${slug}`, rest);
    } else if (name === "urdb_get_changes") {
      const { slug, ...rest } = args as { slug: string; severity?: string };
      result = await urdb(`/products/${slug}/changes`, rest);
    } else if (name === "urdb_list_products") {
      result = await urdb("/products", args as Record<string, string>);
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
