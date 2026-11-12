# 公开技术资料

本项目只包含通用的公开技术资料，不包含本机配置、真实模型目录、个人提供商 ID、账户信息或密钥。

## 采用的 Magpie 机制

本插件使用 **Agent 插件**，而非供应商插件。包中的 `magpie.agent` 声明入口模块；`agent` 描述配置路径，`connect({ gateway, models })` 返回要写入的配置键。

- 省略 `agent.model` 形成 connect-only Agent，用户在 Agents 页以开关方式启用。
- `gateway` 提供 `url`、`v1` 和 Agent 专用 `key`。
- `models` 提供 `id`、`name`、`context`、`output`、`images`、`efforts`、`native_endpoints`。
- 模型目录变化时，Magpie 再次调用 `connect`，无需自行轮询。
- Magpie 暂存被写入配置键的原值，断开或移除插件时恢复。
- Agent 沙箱不提供 Node 文件系统 API，所以本插件只做纯数据转换。

官方资料：[Agent plugins](https://usemagpie.ai/docs/plugins#agents)、[Agent 执行契约](https://github.com/yetone/magpie/blob/main/internal/agentplug/agentplug.go)、[模型目录同步](https://github.com/yetone/magpie/blob/main/internal/agent/sync.go)、[写入与恢复](https://github.com/yetone/magpie/blob/main/internal/agent/plugged.go)。

## 数组的处理

Cursor++ 的 `providers.json` 使用对象根节点和 `providers` 数组。Magpie `connect` 可以替换整个数组并自动保存、恢复原值，但不能读取此文件后按提供商 ID 合并数组。`agent.merge` 是对象成员的合并机制，不能解决这个问题。

因此公开版采用可预测的规则：连接期间统一管理整个 `providers` 数组，断开时由 Magpie 恢复原数组。无需假定原数组有多少项，也无需写入任何机器专属 ID。

## Cursor++ 字段

依据 [Cursor++ 配置存储](https://github.com/CometixSpace/CCursor/blob/main/Cursor%2B%2B/src/server/config/providersStore.ts) 和 [模型类型定义](https://github.com/CometixSpace/CCursor/blob/main/Cursor%2B%2B/src/server/data/defaults.ts)：

- 提供商协议为 `anthropic`、`openai-responses`、`openai-chat` 或 `gemini`。
- `id` 是 Cursor 内的唯一模型 ID，`apiModel` 是发给上游的 ID。
- `contextTokenLimit`、`maxOutputTokens`、`supportsAgent`、`supportsImages` 描述能力。
- Responses 使用 `parameters.reasoning`；Anthropic 和 Chat 使用 `parameters.thinking` 与 `parameters.effort`。
- Cursor++ 通过 `fs.watchFile` 每 2 秒检查外部配置变化并重新加载。

## 协议选择

`native_endpoints` 包含 `/v1/messages` 时优先使用 Anthropic；否则优先 Responses，再回退 Chat。没有固定原生接口的路由组使用 Chat。`magpie/` 前缀只用于 Cursor 内模型 ID，发给 Magpie 网关的 `apiModel` 始终是完整的 `provider/model`。
