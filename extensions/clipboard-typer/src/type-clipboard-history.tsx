import { Action, ActionPanel, Clipboard, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { typeText } from "./clipboard-typing";

const historyOffsets = [0, 1, 2, 3, 4, 5];

type ClipboardHistoryItem = {
  id: string;
  offset: number;
  text: string;
};

export default function Command() {
  const [items, setItems] = useState<ClipboardHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadItems() {
      setIsLoading(true);

      const historyItems = (await Promise.all(historyOffsets.map(async (offset) => readHistoryItem(offset)))).filter(
        (item): item is ClipboardHistoryItem => item !== undefined,
      );

      if (isCancelled) {
        return;
      }

      setItems(historyItems);
      setIsLoading(false);
    }

    void loadItems();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search clipboard history">
      {!isLoading && items.length === 0 ? (
        <List.EmptyView
          title="No text items found"
          description="Raycast currently exposes the current clipboard item plus the last five history entries."
        />
      ) : null}
      {items.map((item) => (
        <List.Item
          key={item.id}
          icon={Icon.Clipboard}
          title={getTitle(item.text)}
          subtitle={getSubtitle(item.text)}
          keywords={[item.text]}
          accessories={[{ text: item.offset === 0 ? "Current" : `History ${item.offset}` }]}
          detail={
            <List.Item.Detail
              markdown={toMarkdown(item.text)}
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label
                    title="Source"
                    text={item.offset === 0 ? "Current Clipboard" : `History Offset ${item.offset}`}
                  />
                  <List.Item.Detail.Metadata.Label title="Characters" text={String(item.text.length)} />
                  <List.Item.Detail.Metadata.Label title="Lines" text={String(countLines(item.text))} />
                </List.Item.Detail.Metadata>
              }
            />
          }
          actions={
            <ActionPanel>
              <Action
                title="Type Selected Item"
                icon={Icon.Keyboard}
                onAction={() =>
                  void typeText(item.text, {
                    successMessage: item.offset === 0 ? "Typed current clipboard item" : "Typed clipboard history item",
                    errorMessage: "Unable to type the selected clipboard item",
                  })
                }
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

async function readHistoryItem(offset: number) {
  try {
    const text = await Clipboard.readText({ offset });

    if (!text) {
      return undefined;
    }

    return {
      id: `${offset}:${text.slice(0, 40)}`,
      offset,
      text,
    };
  } catch {
    return undefined;
  }
}

function getTitle(text: string) {
  return text.split(/\r?\n/, 1)[0].trim() || "(Empty line)";
}

function getSubtitle(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);

  if (lines.length <= 1) {
    return undefined;
  }

  return lines.slice(1).join(" ").slice(0, 80);
}

function countLines(text: string) {
  return text.split(/\r?\n/).length;
}

function toMarkdown(text: string) {
  return `\`\`\`text
${text.replaceAll("```", "``\\`")}
\`\`\``;
}
