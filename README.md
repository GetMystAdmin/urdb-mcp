# urdb-mcp

MCP server for [URDB](https://urdb.io) — the product integrity database. Connect Claude Desktop (or any MCP-compatible AI) to real, sourced data on product downgrades, shrinkflation, warranty cuts, and enshittification.

<a href="https://glama.ai/mcp/servers/GetMystAdmin/urdb-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/GetMystAdmin/urdb-mcp/badge" alt="URDB MCP server" />
</a>

## Tools

| Tool | Description |
|------|-------------|
| `urdb_search` | Search products by name or keyword, with integrity scores |
| `urdb_get_product` | Full integrity breakdown across 7 dimensions |
| `urdb_get_changes` | Documented enshittification events for a product |
| `urdb_list_products` | List/filter products by category, brand, score |

## Setup

**1. Get an API key** at [urdb.io/settings/api-keys](https://urdb.io/settings/api-keys) (free tier available)

**2. Add to Claude Desktop config**

On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "urdb": {
      "command": "npx",
      "args": ["urdb-mcp"],
      "env": {
        "URDB_API_KEY": "urdb_live_your_key_here"
      }
    }
  }
}
```

**3. Restart Claude Desktop**

## Example prompts

- "Which laptops have the highest integrity scores?"
- "Has the KitchenAid Stand Mixer gotten worse over the years?"
- "Find me a washing machine that hasn't been enshittified"
- "What changed with the Sonos Era 100 recently?"

## API docs

Full REST API: [urdb.io/api](https://urdb.io/api)

## License

MIT