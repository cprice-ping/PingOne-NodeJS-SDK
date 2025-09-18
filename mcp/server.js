#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server, Tool } from "@modelcontextprotocol/sdk/server/index.js";
import * as pingOne from "../sdk/pingOneSdk.js";

function requireEnv(keys) {
  const missing = keys.filter(k => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

const transport = new StdioServerTransport();
const server = new Server({
  name: "pingone-mcp-server",
  version: "1.0.0"
}, transport);

function jsonParam(name, required = true) {
  return { name, required, schema: { type: "object" } };
}

server.tool(new Tool({
  name: "pingone.createOidcServiceApplication",
  description: "Create an OIDC client_credentials (service) application",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      enabled: { type: "boolean" },
      tokenEndpointAuthMethod: { type: "string" },
      extra: { type: "object" }
    },
    required: ["name"]
  },
  async invoke(input) {
    requireEnv(["APIROOT","AUTHROOT","ENVID","WORKERID","WORKERSECRET"]);
    const { name, enabled, tokenEndpointAuthMethod, extra } = input;
    const res = await pingOne.createOidcServiceApplication(name, { enabled, tokenEndpointAuthMethod, extra });
    return { content: [{ type: "json", json: res }] };
  }
}));

server.tool(new Tool({
  name: "pingone.getProtectDecision",
  description: "Create a PingOne Protect risk evaluation",
  inputSchema: { type: "object", properties: { body: { type: "object" } }, required: ["body"] },
  async invoke(input) {
    requireEnv(["APIROOT","AUTHROOT","ENVID","WORKERID","WORKERSECRET"]);
    const res = await pingOne.getProtectDecision(input.body);
    return { content: [{ type: "json", json: res }] };
  }
}));

server.tool(new Tool({
  name: "pingone.updateProtectDecision",
  description: "Update a PingOne Protect risk evaluation status",
  inputSchema: { type: "object", properties: { id: { type: "string" }, status: { type: "string" } }, required: ["id","status"] },
  async invoke(input) {
    requireEnv(["APIROOT","AUTHROOT","ENVID","WORKERID","WORKERSECRET"]);
    const res = await pingOne.updateProtectDecision(input.id, input.status);
    return { content: [{ type: "json", json: res }] };
  }
}));

server.tool(new Tool({
  name: "pingone.getSession",
  description: "Get current session using a session token",
  inputSchema: { type: "object", properties: { sessionToken: { type: "string" } }, required: ["sessionToken"] },
  async invoke(input) {
    requireEnv(["APIROOT","AUTHROOT","ENVID","WORKERID","WORKERSECRET"]);
    const res = await pingOne.getSession(input.sessionToken);
    return { content: [{ type: "json", json: res }] };
  }
}));

server.tool(new Tool({
  name: "pingone.updateSession",
  description: "Update current session (PUT) using a session token",
  inputSchema: { type: "object", properties: { sessionToken: { type: "string" }, session: { type: "object" } }, required: ["sessionToken","session"] },
  async invoke(input) {
    requireEnv(["APIROOT","AUTHROOT","ENVID","WORKERID","WORKERSECRET"]);
    const res = await pingOne.updateSession(input.sessionToken, input.session);
    return { content: [{ type: "json", json: res }] };
  }
}));

await server.connect();
// Keep process alive
process.stdin.resume();

