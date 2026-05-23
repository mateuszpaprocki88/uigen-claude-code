import { render, screen } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { afterEach, test, expect, vi } from "vitest";
import { ToolCallBadge } from "../ToolCallBadge";

vi.mock("lucide-react", () => ({
  Loader2: ({ className }: { className?: string }) => (
    <svg data-testid="spinner" className={className} />
  ),
}));

afterEach(cleanup);

// str_replace_editor labels
test("shows 'Creating' for str_replace_editor create", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "/App.jsx" }} state="call" />);
  expect(screen.getByText("Creating App.jsx")).toBeTruthy();
});

test("shows 'Editing' for str_replace_editor str_replace", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "str_replace", path: "/components/Card.tsx" }} state="call" />);
  expect(screen.getByText("Editing Card.tsx")).toBeTruthy();
});

test("shows 'Editing' for str_replace_editor insert", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "insert", path: "/lib/utils.ts" }} state="call" />);
  expect(screen.getByText("Editing utils.ts")).toBeTruthy();
});

test("shows 'Reading' for str_replace_editor view", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "view", path: "/index.tsx" }} state="call" />);
  expect(screen.getByText("Reading index.tsx")).toBeTruthy();
});

test("shows 'Undoing edit in' for str_replace_editor undo_edit", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "undo_edit", path: "/main.tsx" }} state="call" />);
  expect(screen.getByText("Undoing edit in main.tsx")).toBeTruthy();
});

// file_manager labels
test("shows 'Renaming' for file_manager rename", () => {
  render(<ToolCallBadge toolName="file_manager" args={{ command: "rename", path: "/Button.tsx", new_path: "/PrimaryButton.tsx" }} state="call" />);
  expect(screen.getByText("Renaming Button.tsx")).toBeTruthy();
});

test("shows 'Deleting' for file_manager delete", () => {
  render(<ToolCallBadge toolName="file_manager" args={{ command: "delete", path: "/old.tsx" }} state="call" />);
  expect(screen.getByText("Deleting old.tsx")).toBeTruthy();
});

// Fallback
test("falls back to raw tool name for unknown tool", () => {
  render(<ToolCallBadge toolName="unknown_tool" args={{}} state="call" />);
  expect(screen.getByText("unknown_tool")).toBeTruthy();
});

// State indicators
test("shows spinner when in progress", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "/App.jsx" }} state="call" />);
  expect(screen.getByTestId("spinner")).toBeTruthy();
  expect(screen.queryByRole("presentation")).toBeNull();
});

test("shows green dot when done", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "/App.jsx" }} state="result" result="ok" />);
  expect(screen.queryByTestId("spinner")).toBeNull();
  const dot = document.querySelector(".bg-emerald-500");
  expect(dot).toBeTruthy();
});

test("shows spinner when state is result but result is null", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "/App.jsx" }} state="result" result={null} />);
  expect(screen.getByTestId("spinner")).toBeTruthy();
});
