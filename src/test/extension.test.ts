import * as vscode from "vscode";
import * as assert from "assert";
import {
  getFormattedNumber,
  getFormattedString,
  getFormattedPathAndLineManual,
} from "../error-codes";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Testing number formating in decimal", () => {
    assert.strictEqual(getFormattedNumber(1234, 3, "decimal"), "234");
  });

  test("Testing number formating in hexadeciaml", () => {
    assert.strictEqual(getFormattedNumber(1234, 3, "hexadecimal"), "4d2");
  });

  test("Testing number formating in base36", () => {
    assert.strictEqual(getFormattedNumber(1234, 2, "base36"), "ya");
  });

  test("Testing string formating in decimal", () => {
    assert.strictEqual(
      getFormattedString("Hello, world!", 3, "decimal"),
      "520"
    );
  });

  test("Testing string formating in hexadeciaml", () => {
    assert.strictEqual(getFormattedString("Hello", 6, "hexadecimal"), "381969");
  });

  test("Testing string formating in base36", () => {
    assert.strictEqual(getFormattedString("Hello", 2, "base36"), "c0");
  });

  test("Testing full code in decimal", () => {
    assert.strictEqual(
      getFormattedPathAndLineManual("test", 1024, 3, 3, "decimal", "decimal"),
      "200024"
    );
  });

  test("Testing full code in hexadeciaml", () => {
    assert.strictEqual(
      getFormattedPathAndLineManual(
        "test",
        1024,
        3,
        3,
        "hexadecimal",
        "hexadecimal"
      ),
      "a08400"
    );
  });

  test("Testing full code in base36", () => {
    assert.strictEqual(
      getFormattedPathAndLineManual("test", 1024, 3, 3, "base36", "base36"),
      "9c00sg"
    );
  });
});
