const PROVIDERS = [
  { id: "magpie", name: "Magpie · Anthropic", type: "anthropic" },
  { id: "magpie-responses", name: "Magpie · OpenAI Responses", type: "openai-responses" },
  { id: "magpie-chat", name: "Magpie · OpenAI Chat", type: "openai-chat" },
];

export function protocolOf(model) {
  const endpoints = new Set(model.native_endpoints || []);
  if (endpoints.has("/v1/messages")) return "anthropic";
  if (endpoints.has("/v1/responses")) return "openai-responses";
  return "openai-chat";
}

function positiveInteger(value, fallback) {
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

function levelsOf(model) {
  const levels = Array.isArray(model.efforts) ? model.efforts : [];
  const supported = new Set(["low", "medium", "high", "xhigh", "max"]);
  if (protocolOf(model) === "openai-responses") supported.add("minimal");
  return levels.filter((level) => supported.has(level));
}

function defaultEffort(levels, type) {
  const preferences = type === "openai-responses"
    ? ["medium", "high", "low", "xhigh", "max"]
    : ["high", "medium", "max", "low", "xhigh"];
  return preferences.find((level) => levels.includes(level)) || levels[0];
}

export function cursorModel(model) {
  const type = protocolOf(model);
  const levels = levelsOf(model);
  const thinkingLevel = defaultEffort(levels, type);
  const context = positiveInteger(model.context, 200_000);
  const reasoning = levels.length > 0;
  const result = {
    id: `magpie/${model.id}`,
    apiModel: model.id,
    displayName: model.name || model.id,
    thinking: reasoning && Boolean(thinkingLevel),
    defaultOn: true,
    contextTokenLimit: context,
    contextTokenLimitForMaxMode: context,
    maxOutputTokens: positiveInteger(model.output, 8192),
    supportsAgent: true,
    supportsImages: model.images === true,
  };
  if (result.thinking) result.thinkingLevel = thinkingLevel;
  if (reasoning) {
    result.parameters = type === "openai-responses"
      ? { reasoning: levels }
      : { thinking: true, effort: levels };
  }
  return result;
}

export function buildProviders(models, gateway, selectedModel) {
  const buckets = new Map(PROVIDERS.map(({ type }) => [type, []]));
  const seen = new Set();
  for (const model of models) {
    if (!model || typeof model.id !== "string" || !model.id || seen.has(model.id)) continue;
    seen.add(model.id);
    buckets.get(protocolOf(model)).push(cursorModel(model));
  }
  for (const modelsOfType of buckets.values()) {
    modelsOfType.sort((left, right) => {
      if (left.apiModel === selectedModel) return -1;
      if (right.apiModel === selectedModel) return 1;
      return 0;
    });
  }
  const baseUrl = gateway.v1.replace(/\/v1\/?$/, "");
  return PROVIDERS.map((provider) => ({
    ...provider,
    baseUrl,
    auth: { kind: "apiKey", value: gateway.key },
    models: buckets.get(provider.type),
  }));
}

export function cursorppConfig({ gateway, models, selectedModel }) {
  return {
    $schemaVersion: 1,
    providers: buildProviders(models, gateway, selectedModel),
  };
}
