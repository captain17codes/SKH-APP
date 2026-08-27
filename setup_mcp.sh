#!/bin/bash
# Setup Supabase PostgreSQL MCP Connector for Claude Code

echo "Setting up Postgres MCP Connector..."

# Claude Code config directory
CLAUDE_CONFIG_DIR="$HOME/.claude"
CLAUDE_JSON="$CLAUDE_CONFIG_DIR/claude.json"

mkdir -p "$CLAUDE_CONFIG_DIR"

if [ -f "$CLAUDE_JSON" ]; then
    # Modify existing claude.json
    echo "Found existing claude.json, updating..."
    # A proper JSON parser should be used, but since we are doing a basic setup:
    # We will backup the existing config just in case
    cp "$CLAUDE_JSON" "$CLAUDE_JSON.bak"
    
    # In a real environment, you would inject the DB URL here. 
    # For now, we instruct the user on how to run the command directly via npx.
else
    echo "Creating new claude.json..."
    echo '{}' > "$CLAUDE_JSON"
fi

echo "==========================================================="
echo "To enable read-only database access for Claude Code, run the following command:"
echo ""
echo "npx -y @modelcontextprotocol/server-postgres postgresql://[user]:[password]@[host]:[port]/[dbname]"
echo ""
echo "Replace the connection string with your Supabase credentials."
echo "You can add this to your claude.json like this:"
echo "{"
echo "  \"mcpServers\": {"
echo "    \"supabase-db\": {"
echo "      \"command\": \"npx\","
echo "      \"args\": ["
echo "        \"-y\","
echo "        \"@modelcontextprotocol/server-postgres\","
echo "        \"postgresql://[user]:[password]@[host]:[port]/[dbname]\""
echo "      ]"
echo "    }"
echo "  }"
echo "}"
echo "==========================================================="

echo "Setup script completed."
