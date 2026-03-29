import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: "call" | "result" = "result"
): ToolInvocation {
  return { toolCallId: "test-id", toolName, args, state, result: state === "result" ? "ok" : undefined } as ToolInvocation;
}

// str_replace_editor — create
test("shows 'Creating <filename>' for str_replace_editor create", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "src/components/Card.tsx" })} />);
  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
});

// str_replace_editor — str_replace
test("shows 'Editing <filename>' for str_replace_editor str_replace", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "src/components/Card.tsx" })} />);
  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});

// str_replace_editor — insert
test("shows 'Editing <filename>' for str_replace_editor insert", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "insert", path: "src/App.tsx" })} />);
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

// str_replace_editor — view
test("shows 'Reading <filename>' for str_replace_editor view", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "src/index.ts" })} />);
  expect(screen.getByText("Reading index.ts")).toBeDefined();
});

// file_manager — rename
test("shows 'Renaming <old> → <new>' for file_manager rename", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "rename", path: "src/Old.tsx", new_path: "src/New.tsx" })} />);
  expect(screen.getByText("Renaming Old.tsx → New.tsx")).toBeDefined();
});

// file_manager — delete
test("shows 'Deleting <filename>' for file_manager delete", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "delete", path: "src/Unused.tsx" })} />);
  expect(screen.getByText("Deleting Unused.tsx")).toBeDefined();
});

// unknown tool falls back to tool name
test("falls back to tool name for unknown tools", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("some_other_tool", {})} />);
  expect(screen.getByText("some_other_tool")).toBeDefined();
});

// spinner shown while in-progress
test("shows spinner when state is 'call'", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "src/Foo.tsx" }, "call")} />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

// green dot shown when done
test("shows green dot when state is 'result'", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "src/Foo.tsx" }, "result")} />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

// nested path — only filename shown
test("extracts filename from deeply nested path", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "src/components/ui/Button.tsx" })} />);
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});
