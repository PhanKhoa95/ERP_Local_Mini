import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DirectiveProgressCard } from "../directives/DirectiveProgressCard";

describe("DirectiveProgressCard", () => {
  it("renders title and status badge", () => {
    render(
      <DirectiveProgressCard
        id="1"
        title="Chỉ thị triển khai dự án X"
        status="draft"
        deadline={null}
        totalTasks={10}
        completedTasks={3}
        overdueTasks={0}
        escalationCount={0}
      />
    );
    expect(screen.getByText("Chỉ thị triển khai dự án X")).toBeInTheDocument();
    expect(screen.getByText("Nháp")).toBeInTheDocument();
  });

  it("shows correct progress percentage", () => {
    render(
      <DirectiveProgressCard
        id="2"
        title="Test"
        status="in_progress"
        deadline={null}
        totalTasks={4}
        completedTasks={2}
        overdueTasks={0}
        escalationCount={0}
      />
    );
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("2/4 việc")).toBeInTheDocument();
  });

  it("shows overdue warning", () => {
    render(
      <DirectiveProgressCard
        id="3"
        title="Test"
        status="in_progress"
        deadline={null}
        totalTasks={5}
        completedTasks={1}
        overdueTasks={2}
        escalationCount={0}
      />
    );
    expect(screen.getByText("2 quá hạn")).toBeInTheDocument();
  });

  it("shows escalation count", () => {
    render(
      <DirectiveProgressCard
        id="4"
        title="Test"
        status="draft"
        deadline={null}
        totalTasks={0}
        completedTasks={0}
        overdueTasks={0}
        escalationCount={3}
      />
    );
    expect(screen.getByText("Nhắc 3x")).toBeInTheDocument();
  });

  it("shows deadline when provided", () => {
    render(
      <DirectiveProgressCard
        id="5"
        title="Test"
        status="dispatched"
        deadline="2026-03-15T00:00:00Z"
        totalTasks={2}
        completedTasks={0}
        overdueTasks={0}
        escalationCount={0}
      />
    );
    expect(screen.getByText("Đã phân phối")).toBeInTheDocument();
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it("handles zero tasks gracefully (0%)", () => {
    render(
      <DirectiveProgressCard
        id="6"
        title="Empty"
        status="draft"
        deadline={null}
        totalTasks={0}
        completedTasks={0}
        overdueTasks={0}
        escalationCount={0}
      />
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("0/0 việc")).toBeInTheDocument();
  });

  it("completed status shows correct badge", () => {
    render(
      <DirectiveProgressCard
        id="7"
        title="Done"
        status="completed"
        deadline={null}
        totalTasks={5}
        completedTasks={5}
        overdueTasks={0}
        escalationCount={0}
      />
    );
    expect(screen.getByText("Hoàn thành")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
