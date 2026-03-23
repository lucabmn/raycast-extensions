import { closeMainWindow, showHUD } from "@raycast/api";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const focusDelayMs = 150;

type TypeTextOptions = {
  emptyMessage?: string;
  successMessage?: string;
  errorMessage?: string;
};

export async function typeText(text: string | undefined, options: TypeTextOptions = {}) {
  const {
    emptyMessage = "Clipboard is empty",
    successMessage = "Typed clipboard content",
    errorMessage = "Unable to type clipboard content",
  } = options;

  try {
    if (!text) {
      await showHUD(emptyMessage);
      return;
    }

    await closeMainWindow();
    await sleep(focusDelayMs);

    if (process.platform === "darwin") {
      await typeOnMacOS(text);
    } else if (process.platform === "win32") {
      await typeOnWindows(text);
    } else {
      await showHUD("Typing is not supported on this platform");
      return;
    }

    await showHUD(successMessage);
  } catch {
    await showHUD(errorMessage);
  }
}

async function typeOnMacOS(text: string) {
  await execFileAsync("osascript", [
    "-e",
    "on run argv",
    "-e",
    "set textToType to item 1 of argv",
    "-e",
    'tell application "System Events"',
    "-e",
    "repeat with currentCharacter in characters of textToType",
    "-e",
    "set typedCharacter to contents of currentCharacter",
    "-e",
    "if typedCharacter is return or typedCharacter is linefeed then",
    "-e",
    "key code 36",
    "-e",
    "else if typedCharacter is tab then",
    "-e",
    "key code 48",
    "-e",
    "else",
    "-e",
    "keystroke typedCharacter",
    "-e",
    "end if",
    "-e",
    "end repeat",
    "-e",
    "end tell",
    "-e",
    "end run",
    "--",
    text,
  ]);
}

async function typeOnWindows(text: string) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms

$textToType = $env:RAYCAST_TYPED_TEXT
$builder = [System.Text.StringBuilder]::new()

foreach ($character in $textToType.ToCharArray()) {
  switch ($character) {
    "\`r" { continue }
    "\`n" { [void] $builder.Append("{ENTER}") }
    "\`t" { [void] $builder.Append("{TAB}") }
    "+" { [void] $builder.Append("{+}") }
    "^" { [void] $builder.Append("{^}") }
    "%" { [void] $builder.Append("{%}") }
    "~" { [void] $builder.Append("{~}") }
    "(" { [void] $builder.Append("{(}") }
    ")" { [void] $builder.Append("{)}") }
    "[" { [void] $builder.Append("{[}") }
    "]" { [void] $builder.Append("{]}") }
    "{" { [void] $builder.Append("{{}") }
    "}" { [void] $builder.Append("{}}") }
    default { [void] $builder.Append($character) }
  }
}

[System.Windows.Forms.SendKeys]::SendWait($builder.ToString())
  `.trim();

  const encodedCommand = Buffer.from(script, "utf16le").toString("base64");

  await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", encodedCommand], {
    env: {
      ...process.env,
      RAYCAST_TYPED_TEXT: text,
    },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
