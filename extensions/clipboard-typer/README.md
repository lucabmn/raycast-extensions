# Clipboard Typer

Type clipboard content as keyboard input in the frontmost application.

This is useful for apps like TeamViewer, remote desktop tools, or password prompts where regular paste does not work.

## Commands

- `Type Clipboard`: Types the current clipboard item immediately.
- `Type from Clipboard History`: Lets you choose a text item from Raycast's clipboard history and type it.

## Usage

1. Copy the text you want to enter.
2. Focus the target field or app.
3. Run `Type Clipboard` or open `Type from Clipboard History` and select an item.

## Notes

- Raycast needs accessibility permissions to simulate keystrokes.
- The history picker shows up to 6 text entries because Raycast's Clipboard API currently exposes offsets `0` through `5`.
- The extension supports macOS and Windows.
