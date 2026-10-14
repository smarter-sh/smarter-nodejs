/** Test src/resources/mcpclients.ts. */

import { beforeEach, describe, expect, it } from "vitest";

import { mockPlatform, type MockPlatform } from "./helpers.ts";

describe("MCPClients", () => {
  let platform: MockPlatform;
  beforeEach(() => {
    platform = mockPlatform();
  });

  it("lists MCPClients with their connection state", async () => {
    platform.route("GET", "mcpclients/", { fixture: "mcpclients" });
    const mcpclient = (await platform.client.mcpClients.list())[0];
    expect(mcpclient?.status).toBe("connected");
    expect(mcpclient?.allowedTools.length).toBeGreaterThan(0);
  });

  it("tools() returns the allowed tools, and asks for a refresh only when told to", async () => {
    platform.route("GET", "mcpclients/1/tools/", { fixture: "mcp_tools" });
    expect((await platform.client.mcpClients.tools(1)).tools[0]?.name).toBe("aws___read_documentation");
    expect(new URL(platform.lastRequest.url).searchParams.has("refresh")).toBe(false);
    await platform.client.mcpClients.tools(1, { refresh: true });
    expect(new URL(platform.lastRequest.url).searchParams.get("refresh")).toBe("true");
  });

  it("refresh() returns the connection's state", async () => {
    platform.route("POST", "mcpclients/1/refresh/", { json: { name: "aws_knowledge", status: "connected" } });
    expect((await platform.client.mcpClients.refresh(1)).status).toBe("connected");
  });

  it("callTool() sends the arguments as the JSON body, and returns the tool's result", async () => {
    const result = { name: "aws_knowledge", tool: "aws___list_regions", isError: false, content: "us-east-1" };
    platform.route("POST", "mcpclients/1/tools/aws___list_regions/", { json: result });
    const response = await platform.client.mcpClients.callTool(1, "aws___list_regions", { limit: 1 });
    expect(response.isError).toBe(false);
    expect(response.content).toBe("us-east-1");
    expect(await platform.requestJson()).toEqual({ limit: 1 });
    await platform.client.mcpClients.callTool(1, "aws___list_regions");
    expect(await platform.requestJson()).toEqual({});
  });
});
