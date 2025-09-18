#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server";
type JSONSchema = Record<string, any>;
// @ts-ignore JS SDK has no types; treat as any
import * as pingOne from "../../sdk/pingOneSdk.js";

function requireEnv(keys: string[]) {
  const missing = keys.filter(k => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

class StdioTransport {
  onmessage?: (msg: unknown) => void;
  onclose?: () => void;
  private writer: NodeJS.WriteStream;
  constructor() {
    this.writer = process.stdout;
    const reader = process.stdin;
    reader.setEncoding("utf8");
    let buffer = "";
    const emitClose = () => { if (this.onclose) this.onclose(); };
    reader.on("data", chunk => {
      buffer += chunk;
      for (;;) {
        const headerEnd = buffer.indexOf("\r\n\r\n");
        if (headerEnd === -1) break;
        const headers = buffer.slice(0, headerEnd);
        const m = headers.match(/Content-Length:\s*(\d+)/i);
        if (!m) { buffer = buffer.slice(headerEnd + 4); continue; }
        const len = parseInt(m[1], 10);
        const bodyStart = headerEnd + 4;
        const bodyEnd = bodyStart + len;
        if (buffer.length < bodyEnd) break;
        const json = buffer.slice(bodyStart, bodyEnd);
        buffer = buffer.slice(bodyEnd);
        try {
          const msg = JSON.parse(json);
          this.onmessage?.(msg);
        } catch { /* ignore malformed */ }
      }
    });
    reader.on("end", emitClose);
    reader.on("close", emitClose);
    reader.on("error", emitClose);
  }
  async start(): Promise<void> {
    return;
  }
  async send(message: unknown): Promise<void> {
    const data = JSON.stringify(message);
    const frame = `Content-Length: ${Buffer.byteLength(data, "utf8")}\r\n\r\n${data}`;
    this.writer.write(frame);
  }
  async close(): Promise<void> {
    try { (this.writer as any).end?.(); } catch {}
    this.onclose?.();
  }
}

const transport = new StdioTransport();
const server = new Server({
  name: "pingone-mcp-server",
  version: "1.0.0",
  tools: [
    {
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
      } as JSONSchema,
      handler: async (input: any) => {
        requireEnv(["APIROOT","AUTHROOT","ENVID","WORKERID","WORKERSECRET"]);
        const { name, enabled, tokenEndpointAuthMethod, extra } = input;
        const res = await pingOne.createOidcServiceApplication(name, { enabled, tokenEndpointAuthMethod, extra });
        return { content: [{ type: "json", json: res }] };
      }
    },
    {
      name: "pingone.getProtectDecision",
      description: "Create a PingOne Protect risk evaluation",
      inputSchema: { type: "object", properties: { body: { type: "object" } }, required: ["body"] } as JSONSchema,
      handler: async (input: any) => {
        requireEnv(["APIROOT","AUTHROOT","ENVID","WORKERID","WORKERSECRET"]);
        const res = await pingOne.getProtectDecision(input.body);
        return { content: [{ type: "json", json: res }] };
      }
    },
    {
      name: "pingone.updateProtectDecision",
      description: "Update a PingOne Protect risk evaluation status",
      inputSchema: { type: "object", properties: { id: { type: "string" }, status: { type: "string" } }, required: ["id","status"] } as JSONSchema,
      handler: async (input: any) => {
        requireEnv(["APIROOT","AUTHROOT","ENVID","WORKERID","WORKERSECRET"]);
        const res = await pingOne.updateProtectDecision(input.id, input.status);
        return { content: [{ type: "json", json: res }] };
      }
    },
    {
      name: "pingone.getSession",
      description: "Get current session using a session token",
      inputSchema: { type: "object", properties: { sessionToken: { type: "string" } }, required: ["sessionToken"] } as JSONSchema,
      handler: async (input: any) => {
        requireEnv(["APIROOT","AUTHROOT","ENVID","WORKERID","WORKERSECRET"]);
        const res = await pingOne.getSession(input.sessionToken);
        return { content: [{ type: "json", json: res }] };
      }
    },
    {
      name: "pingone.updateSession",
      description: "Update current session (PUT) using a session token",
      inputSchema: { type: "object", properties: { sessionToken: { type: "string" }, session: { type: "object" } }, required: ["sessionToken","session"] } as JSONSchema,
      handler: async (input: any) => {
        requireEnv(["APIROOT","AUTHROOT","ENVID","WORKERID","WORKERSECRET"]);
        const res = await pingOne.updateSession(input.sessionToken, input.session);
        return { content: [{ type: "json", json: res }] };
      }
    }
  ]
});

await server.connect(transport);
process.stdin.resume();
