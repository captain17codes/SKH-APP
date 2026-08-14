import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:7000';

export const mcpClient = {
  isMcpServerAvailable: async () => {
    try {
      const res = await axios.get(`${MCP_SERVER_URL}/health`, { timeout: 1500 });
      return res.status === 200 && (res.data.status === 'healthy' || res.data.status === 'ok');
    } catch (e) {
      console.error(`[MCP CLIENT] Failed to connect to MCP server: ${e.message}`);
      return false;
    }
  },


  getTools: async () => {
    try {
      const res = await axios.get(`${MCP_SERVER_URL}/tools`, { timeout: 2000 });
      return res.data.tools || [];
    } catch (e) {
      console.error('❌ MCP client failed to retrieve tools:', e.message);
      return [];
    }
  },

  callTool: async (name, args = {}) => {
    console.log(`[MCP] Tool called: ${name} with args ${JSON.stringify(args)}`);
    try {
      const res = await axios.post(`${MCP_SERVER_URL}/call`, {
        name,
        arguments: args
      }, { timeout: 8000 });
      
      console.log(`[MCP] Tool completed: ${name}`);
      console.log(`[GIS] Records returned: ${JSON.stringify(res.data.result).length} bytes`);
      return res.data.result;
    } catch (e) {
      console.error(`❌ MCP client tool call failed (${name}):`, e.message);
      throw new Error(`MCP Tool ${name} execution failed: ${e.message}`);
    }
  }
};

export default mcpClient;
