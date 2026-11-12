# Magpie → Cursor++

[简体中文](README.md) · MIT License · No runtime dependencies

Synchronize models and routing groups from [Magpie](https://usemagpie.ai) to [Cursor++](https://github.com/CometixSpace/CCursor), bringing one consistent `provider/model` catalog to Cursor.

## Features

- Synchronizes whenever the Magpie catalog changes, without polling or a background service.
- Supports Anthropic Messages, OpenAI Responses, and OpenAI Chat Completions.
- Carries model names, reasoning levels, context limits, output limits, and image input support.
- Preserves full Magpie model IDs, including routing groups.
- Uses a Cursor++-specific local gateway credential, never upstream provider API keys.

## Installation

Install Magpie, Cursor, and Cursor++ first. Enable the Cursor++ BYOK Server, which listens on `127.0.0.1:39831` by default.

Find the plugin in **Magpie → Plugins → Discover → Unofficial**, or run:

```sh
magpie plugin add github:teczt/magpie-cursorpp
```

Open **Agents → Cursor++** and set Provider to `magpie`, or run:

```sh
magpie cursorpp provider magpie
```

Choose a model whose name starts with `magpie/` in Cursor. Cursor++ normally reloads its configuration within two seconds; reopen the model menu if it does not refresh immediately.

## Configuration ownership

While connected, the plugin manages the entire **`providers` array** in `~/.ccursor/providers.json`, creating three providers:

| Provider ID | Protocol |
| --- | --- |
| `magpie` | Anthropic `/v1/messages` |
| `magpie-responses` | OpenAI `/v1/responses` |
| `magpie-chat` | OpenAI `/v1/chat/completions`, including routing groups |

Other Cursor++ providers are not visible while connected and the array should not be edited manually at the same time. Magpie's Agent API cannot read and merge this array by provider ID.

**Magpie saves the original configuration before connecting and restores it when disconnected.** The plugin writes only the local Magpie gateway credential for Cursor++, not upstream provider keys.

Disconnect and restore your original providers:

```sh
magpie cursorpp default
```

You can also turn off the Magpie Provider under **Agents → Cursor++**.

## Development

Node.js 20 or later is sufficient. There are no dependencies to install:

```sh
npm run check
npm test
```

To load a local checkout:

```sh
magpie plugin add ./
magpie cursorpp provider magpie
```

`agent.js` declares the Agent and forwards its input. `cursorpp.mjs` performs pure data conversion without filesystem or network access. Magpie handles writes, catalog updates, and restoring the original configuration.

## License

[MIT](LICENSE)
