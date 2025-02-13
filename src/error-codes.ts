import vscode from "vscode";
import crypto from "crypto";
import ignore, { Ignore } from 'ignore';
import * as fs from 'fs';
import * as path from 'path';

export type format = "decimal" | "hexadecimal" | "base36";

function hash(input: string): string {
  // Create a hash of the input using SHA-256
  return crypto.createHash("sha256").update(input).digest("hex");
}

function formatNumber(value: number, format: format): string {
  if (format === "decimal") {
    return value.toString();
  } else if (format === "hexadecimal") {
    return value.toString(16);
  } else if (format === "base36") {
    return value.toString(36); // Base36 uses 0-9 and a-z
  }
  throw new Error(`Unsupported format: ${format}`);
}

function unformatNumber(value: string, format: format): number {
  if (format === "decimal") {
    return parseInt(value);
  } else if (format === "hexadecimal") {
    return parseInt(value, 16);
  } else if (format === "base36") {
    return parseInt(value, 36);
  }
  throw new Error(`Unsupported format: ${format}`);
}

export function getFormattedPathAndLine(
  document: vscode.TextDocument,
  selection: vscode.Selection,
  pathLength: number,
  lineLength: number,
  pathFormat: format,
  lineFormat: format,
  codeFormat?: string | undefined
): string | undefined {
  // Get the file path
  const filePath = document.uri.fsPath;

  // Get the relative path
  const relativePath = vscode.workspace.asRelativePath(filePath);

  // Get the current line number
  const lineNumber = selection.active.line + 1; // VS Code uses 0-based line numbers

  // Combine the formatted path and line
  return getFormattedPathAndLineManual(
    relativePath,
    lineNumber,
    pathLength,
    lineLength,
    pathFormat,
    lineFormat,
    codeFormat
  );
}

export function getFormattedPathAndLineManual(
  path: string,
  line: number,
  pathLength: number,
  lineLength: number,
  pathFormat: format,
  lineFormat: format,
  codeFormat?: string | undefined
): string | undefined {
  // Hash, shorten, and hash path and line number
  const p = getFormattedString(path, pathLength, pathFormat).padStart(
    pathLength,
    "0"
  );

  if (lineLength < 1) {
    if (!codeFormat) {
      return p;
    }

    return codeFormat.replace("{path}", p);
  }

  const l = getFormattedNumber(line, lineLength, lineFormat).padStart(
    lineLength,
    "0"
  );

  if (!codeFormat) {
    return `${p}${l}`;
  }

  // Combine the formatted path and line
  return codeFormat.replace("{path}", p).replace("{line}", l.toString());
}

export function getFormattedString(
  value: string,
  length: number,
  targetFormat: format
): string {
  if (length < 1) {
    return "";
  }

  let hashed = hash(value);

  // The hash is in hexadecimal format
  // If the target format is hex, return the last characters of the hash
  if (targetFormat === "hexadecimal") {
    return hashed.substring(hashed.length - length);
  }

  hashed = hashed.substring(0, 15); // Shorten the hash to max 21 characters base10 to avoid scientific notations
  const formated = formatNumber(parseInt(hashed, 16), targetFormat);
  return formated.substring(formated.length - length);
}

export function getFormattedNumber(
  value: number,
  length: number,
  targetFormat: format
): string {
  if (length < 1) {
    return "";
  }

  const formated = formatNumber(value, targetFormat);
  return formated.substring(formated.length - length);
}

export function getUnformattedNumber(
  value: string,
  targetFormat: format
): number {
  return unformatNumber(value, targetFormat);
}

function loadGitignoreRules(workspaceFolder: vscode.WorkspaceFolder, dir: string = workspaceFolder.uri.fsPath): Ignore {
    const ig = ignore();
    const gitignorePath = path.join(dir, '.gitignore');

    if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        ig.add(gitignoreContent);
    }

    // Recursively load .gitignore files in subdirectories
    const subdirs = fs.readdirSync(dir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => path.join(dir, dirent.name));

    for (const subdir of subdirs) {
        const subIg = loadGitignoreRules(workspaceFolder, subdir);
        ig.add(subIg);
    }

    return ig;
}

async function findCodeInWorkspace(
  targetCode: string,
  length: number,
  targetFormat: format,
  returnFirst: boolean = false
): Promise<{ code: string; filePath: string }[]> {
  const codes: { code: string; filePath: string }[] = [];

  // Get the workspace folder
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder found.');
    return codes;
  }

  // Load .gitignore rules
  const ig = loadGitignoreRules(workspaceFolder);

  // Get all files in the workspace
  const files = await vscode.workspace.findFiles("**/*", "**/node_modules/**"); // Exclude node_modules

  for (const file of files) {
    const filePath = file.fsPath;
    const relativePath = vscode.workspace.asRelativePath(filePath);

    // Check if the file is ignored by .gitignore
    if (ig.ignores(relativePath)) {
      continue;
    }

    const code = getFormattedString(
      relativePath,
      length,
      targetFormat
    ).padStart(length, "0");
    if (targetCode !== code) {
      continue;
    }

    codes.push({ code, filePath });

    if (returnFirst) {
      return codes;
    }
  }

  return codes;
}

// Function to move the cursor to a file and line based on a code
export async function moveToCode(
  targetCode: string,
  length: number,
  targetFormat: format
) {
  const haveLine = targetCode.length > length;
  let lineCode = "";

  if (haveLine) {
    lineCode = targetCode.substring(length);
    targetCode = targetCode.substring(0, length);
  }

  const codes = await findCodeInWorkspace(
    targetCode,
    length,
    targetFormat,
    false
  );

  if (codes.length === 0) {
    vscode.window.showErrorMessage("No matching code found.");
  }

  const match = codes[0];

  // Open the file
  const document = await vscode.workspace.openTextDocument(match.filePath);
  const editor = await vscode.window.showTextDocument(document);

  // Move the cursor to the line
  const position = new vscode.Position(
    getUnformattedNumber(lineCode, targetFormat) - 1,
    0
  ); // VS Code uses 0-based line numbers
  editor.selection = new vscode.Selection(position, position);
  editor.revealRange(
    new vscode.Range(position, position),
    vscode.TextEditorRevealType.InCenter
  );
}
