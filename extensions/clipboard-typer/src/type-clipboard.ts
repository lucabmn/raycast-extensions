import { Clipboard } from "@raycast/api";
import { typeText } from "./clipboard-typing";

export default async function main() {
  const clipboardText = await Clipboard.readText();
  await typeText(clipboardText);
}
