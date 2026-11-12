import { cursorppConfig } from "./cursorpp.mjs";

export const agent = {
  id: "cursorpp",
  name: "Cursor++",
  dir: "~/.ccursor",
  config: "~/.ccursor/providers.json",
  format: "json",
  notice: "Keeps all Magpie models in Cursor++ and restores the previous providers on disconnect. Keep the BYOK Server enabled.",
};

export function connect({ gateway, model, models }) {
  return cursorppConfig({ gateway, selectedModel: model?.id, models });
}
