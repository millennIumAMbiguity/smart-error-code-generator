import vscode, { window } from "vscode";
import { getFormattedPathAndLine, format, moveToCode } from "./error-codes";

const PATH_LENGTH = "pathLength";
const LINE_LENGTH = "lineLength";
const PATH_FORMAT = "pathFormat";
const LINE_FORMAT = "lineFormat";
const CODE_FORMAT = "format";

function getPathLength(configuration: vscode.WorkspaceConfiguration): number {
  return configuration.get<number>(PATH_LENGTH, 3);
}

function getLineLength(configuration: vscode.WorkspaceConfiguration): number {
  return configuration.get<number>(LINE_LENGTH, 3);
}

function getPathFormat(configuration: vscode.WorkspaceConfiguration): format {
  return configuration.get<format>(PATH_FORMAT, "hexadecimal");
}

function getLineFormat(configuration: vscode.WorkspaceConfiguration): format {
  return configuration.get<format>(LINE_FORMAT, "hexadecimal");
}

function getCodeFormat(configuration: vscode.WorkspaceConfiguration): string | undefined {
  return configuration.get<format>(CODE_FORMAT);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const insertCodeCommand = vscode.commands.registerTextEditorCommand(
    "smart-error-code-generator.insert",
    (textEditor, edit) => {
      const configuration = vscode.workspace.getConfiguration(
        "smart-error-code-generator"
      );
      const pathLength = getPathLength(configuration);
      const lineLength = getLineLength(configuration);
      const pathFormat = getPathFormat(configuration);
      const lineFormat = getLineFormat(configuration);
	  const codeFormat = getCodeFormat(configuration);

      for (const selection of textEditor.selections) {
        const errorCode = getFormattedPathAndLine(
          textEditor.document,
          selection,
          pathLength,
          lineLength,
          pathFormat,
          lineFormat,
		  codeFormat
        );
        if (!errorCode) {
          continue;
        }

        if (selection.isEmpty) {
          edit.insert(selection.active, errorCode);
        } else {
          edit.replace(selection, errorCode);
        }
      }
    }
  );

  const findCodeCommand = vscode.commands.registerCommand(
    "smart-error-code-generator.find",
    async (args) => {
      const configuration = vscode.workspace.getConfiguration(
        "smart-error-code-generator"
      );
      const pathLength = getPathLength(configuration);
      const pathFormat = getPathFormat(configuration);

      // default show imput feild
      const code =
        args?.code ||
        (await window.showInputBox({ placeHolder: "Enter the error code" }));

      moveToCode(code, pathLength, pathFormat);
    }
  );

  context.subscriptions.push(insertCodeCommand);
  context.subscriptions.push(findCodeCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
