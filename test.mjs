import assert from "node:assert/strict";
import test from "node:test";
import { buildProviders, cursorModel, cursorppConfig, protocolOf } from "./cursorpp.mjs";

const samples = [
  { id: "claude/sonnet", name: "Claude Sonnet", context: 200000, output: 64000, images: true, efforts: ["low", "high", "max"], native_endpoints: ["/v1/messages"] },
  { id: "codex/gpt", name: "GPT", context: 922000, output: 128000, images: true, efforts: ["none", "medium", "high", "ultra"], native_endpoints: ["/v1/responses"] },
  { id: "group/deepseek", name: "DeepSeek", context: 1048576, output: 131072, images: true, efforts: ["none", "high"] },
];

test("选择协议，包括支持三种入口的路由组", () => {
  assert.equal(protocolOf(samples[0]), "anthropic");
  assert.equal(protocolOf(samples[1]), "openai-responses");
  assert.equal(protocolOf(samples[2]), "openai-chat");
});

test("生成 Cursor++ 模型，不传递 Cursor++ 不识别的 ultra 档", () => {
  assert.deepEqual(cursorModel(samples[0]), {
    id: "magpie/claude/sonnet",
    apiModel: "claude/sonnet",
    displayName: "Claude Sonnet",
    thinking: true,
    defaultOn: true,
    contextTokenLimit: 200000,
    contextTokenLimitForMaxMode: 200000,
    maxOutputTokens: 64000,
    supportsAgent: true,
    supportsImages: true,
    thinkingLevel: "high",
    parameters: { thinking: true, effort: ["low", "high", "max"] },
  });
  assert.deepEqual(cursorModel(samples[1]).parameters, { reasoning: ["medium", "high"] });
  assert.equal(cursorModel(samples[1]).thinkingLevel, "medium");
});

test("空配置也能生成合法数组，Magpie 断开时恢复用户原数组", () => {
  const gateway = { v1: "http://127.0.0.1:3425/v1", key: "agent-gateway-key" };
  const result = cursorppConfig({ gateway, models: samples, selectedModel: "codex/gpt" });
  assert.equal(Object.hasOwn(result, "providers."), false);
  assert.equal(result.providers[0].models[0].apiModel, "claude/sonnet");
  assert.equal(result.providers[1].models[0].apiModel, "codex/gpt");
  assert.equal(result.providers[2].models[0].apiModel, "group/deepseek");
  assert.equal(result.providers[1].baseUrl, "http://127.0.0.1:3425");
  assert.equal(result.providers[1].auth.value, "agent-gateway-key");
  assert.equal(buildProviders(samples, gateway).length, 3);
});

test("无模型时仍生成 Cursor++ 所需的三个提供商，不假设已有条目", () => {
  const result = cursorppConfig({
    gateway: { v1: "http://localhost:3425/v1", key: "local" },
    models: [],
  });
  assert.deepEqual(result.providers.map((provider) => provider.id), ["magpie", "magpie-responses", "magpie-chat"]);
  assert.ok(result.providers.every((provider) => Array.isArray(provider.models)));
  assert.ok(result.providers.every((provider) => provider.id.startsWith("magpie")));
});
