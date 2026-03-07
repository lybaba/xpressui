import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormUI, mountFormUI, TFormUISubmitDetail } from "../src/index";
import { flushAsyncWork, resetDomAndStorage } from "./test-utils";

describe("Approval Workflows", () => {
  beforeEach(() => {
    resetDomAndStorage();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("supports an approval-request provider and emits pending approval events", async () => {
    const fetchSpy = vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        status: "pending_approval",
        transition: {
          type: "workflow",
          state: "pending_approval",
        },
        messages: ["Waiting for manager approval"],
        errors: [],
        data: {
          approvalId: "apr_123",
        },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const container = document.createElement("div");
    const element = mountFormUI(container, {
      name: "approval-request-form",
      title: "Approval Request Form",
      provider: {
        type: "approval-request",
        endpoint: "https://api.example.test/approvals",
      },
      fields: [
        { name: "requester_email", label: "Requester Email", type: "email", required: true },
        { name: "amount", label: "Amount", type: "number", required: true },
      ],
    }) as FormUI;
    const requesterEmail = element.querySelector("#requester_email") as HTMLInputElement;
    const amount = element.querySelector("#amount") as HTMLInputElement;
    const form = element.querySelector("#approval-request-form_form") as HTMLFormElement;
    const onApprovalRequested = vi.fn();

    element.addEventListener("form-ui:approval-requested", (event) => {
      onApprovalRequested((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    requesterEmail.value = "approver@example.com";
    requesterEmail.dispatchEvent(new Event("input", { bubbles: true }));
    amount.value = "250";
    amount.dispatchEvent(new Event("input", { bubbles: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.example.test/approvals",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "approval-request",
          approval: {
            requester_email: "approver@example.com",
            amount: 250,
          },
        }),
      }),
    );
    expect(onApprovalRequested).toHaveBeenCalledWith(
      expect.objectContaining({
        result: {
          status: "pending_approval",
          transition: { type: "workflow", state: "pending_approval" },
          messages: ["Waiting for manager approval"],
          errors: [],
          data: { approvalId: "apr_123" },
        },
        providerResult: {
          status: "pending_approval",
          transition: { type: "workflow", state: "pending_approval" },
          messages: ["Waiting for manager approval"],
          errors: [],
          data: { approvalId: "apr_123" },
        },
      }),
    );
  });

  it("emits approval-complete when an approval-request response is approved", async () => {
    vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "approved", approvalId: "apr_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const container = document.createElement("div");
    const element = mountFormUI(container, {
      name: "approval-complete-form",
      title: "Approval Complete Form",
      provider: {
        type: "approval-request",
        endpoint: "https://api.example.test/approvals",
      },
      fields: [{ name: "request_id", label: "Request ID", type: "text", required: true }],
    }) as FormUI;
    const requestId = element.querySelector("#request_id") as HTMLInputElement;
    const form = element.querySelector("#approval-complete-form_form") as HTMLFormElement;
    const onApprovalComplete = vi.fn();

    element.addEventListener("form-ui:approval-complete", (event) => {
      onApprovalComplete((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    requestId.value = "req_123";
    requestId.dispatchEvent(new Event("input", { bubbles: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(onApprovalComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { status: "approved", approvalId: "apr_123" },
      }),
    );
    expect(element.getApprovalState()).toEqual(
      expect.objectContaining({
        status: "approved",
        approvalId: "apr_123",
        result: { status: "approved", approvalId: "apr_123" },
        providerResult: {
          status: "approved",
          transition: { type: "workflow", state: "approved" },
          messages: [],
          errors: [],
          data: { approvalId: "apr_123" },
        },
      }),
    );
  });

  it("supports an approval-decision provider and emits approval state updates", async () => {
    const fetchSpy = vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "completed", approvalId: "apr_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const container = document.createElement("div");
    const element = mountFormUI(container, {
      name: "approval-decision-form",
      title: "Approval Decision Form",
      provider: {
        type: "approval-decision",
        endpoint: "https://api.example.test/approvals/decision",
      },
      fields: [
        { name: "approval_id", label: "Approval ID", type: "text", required: true },
        { name: "decision", label: "Decision", type: "text", required: true },
      ],
    }) as FormUI;
    const approvalId = element.querySelector("#approval_id") as HTMLInputElement;
    const decision = element.querySelector("#decision") as HTMLInputElement;
    const form = element.querySelector("#approval-decision-form_form") as HTMLFormElement;
    const onApprovalState = vi.fn();

    element.addEventListener("form-ui:approval-state", (event) => {
      onApprovalState((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    approvalId.value = "apr_123";
    approvalId.dispatchEvent(new Event("input", { bubbles: true }));
    decision.value = "approved";
    decision.dispatchEvent(new Event("input", { bubbles: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.example.test/approvals/decision",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "approval-decision",
          decision: {
            approval_id: "apr_123",
            decision: "approved",
          },
        }),
      }),
    );
    expect(onApprovalState).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          status: "completed",
          approvalId: "apr_123",
          result: { status: "completed", approvalId: "apr_123" },
          providerResult: {
            status: "completed",
            transition: { type: "workflow", state: "completed" },
            messages: [],
            errors: [],
            data: { approvalId: "apr_123" },
          },
        }),
      }),
    );
    expect(element.getApprovalState()).toEqual(
      expect.objectContaining({
        status: "completed",
        approvalId: "apr_123",
        result: { status: "completed", approvalId: "apr_123" },
        providerResult: {
          status: "completed",
          transition: { type: "workflow", state: "completed" },
          messages: [],
          errors: [],
          data: { approvalId: "apr_123" },
        },
      }),
    );
  });

  it("supports an approval-comment provider for audit trail messages", async () => {
    const fetchSpy = vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ saved: true, commentId: "cmt_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const container = document.createElement("div");
    const element = mountFormUI(container, {
      name: "approval-comment-form",
      title: "Approval Comment Form",
      provider: {
        type: "approval-comment",
        endpoint: "https://api.example.test/approvals/comment",
      },
      fields: [
        { name: "approval_id", label: "Approval ID", type: "text", required: true },
        { name: "comment", label: "Comment", type: "textarea", required: true },
      ],
    }) as FormUI;
    const approvalId = element.querySelector("#approval_id") as HTMLInputElement;
    const comment = element.querySelector("#comment") as HTMLTextAreaElement;
    const form = element.querySelector("#approval-comment-form_form") as HTMLFormElement;
    const onCommentSuccess = vi.fn();

    element.addEventListener("form-ui:approval-comment-success", (event) => {
      onCommentSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    approvalId.value = "apr_123";
    approvalId.dispatchEvent(new Event("input", { bubbles: true }));
    comment.value = "Approved with note";
    comment.dispatchEvent(new Event("input", { bubbles: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.example.test/approvals/comment",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "approval-comment",
          comment: {
            approval_id: "apr_123",
            comment: "Approved with note",
          },
        }),
      }),
    );
    expect(onCommentSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { saved: true, commentId: "cmt_123" },
      }),
    );
  });

  it("keeps approval-state fields in sync with the current approval status", async () => {
    vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "pending_approval", approvalId: "apr_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const container = document.createElement("div");
    const element = mountFormUI(container, {
      name: "approval-state-field-form",
      title: "Approval State Field Form",
      provider: {
        type: "approval-request",
        endpoint: "https://api.example.test/approvals",
      },
      fields: [
        { name: "requester_email", label: "Requester Email", type: "email", required: true },
        { name: "approval_status", label: "Approval Status", type: "approval-state" },
      ],
    }) as FormUI;
    const requesterEmail = element.querySelector("#requester_email") as HTMLInputElement;
    const approvalStatus = element.querySelector("#approval_status") as HTMLInputElement;
    const form = element.querySelector("#approval-state-field-form_form") as HTMLFormElement;

    requesterEmail.value = "approver@example.com";
    requesterEmail.dispatchEvent(new Event("input", { bubbles: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(approvalStatus.readOnly).toBe(true);
    expect(approvalStatus.value).toBe("pending_approval");
    expect((element.form?.getState().values || {}).approval_status).toBe("pending_approval");
  });

  it("emits workflow-state updates across a simple approval lifecycle", async () => {
    vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "pending_approval", approvalId: "apr_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const container = document.createElement("div");
    const element = mountFormUI(container, {
      name: "approval-workflow-form",
      title: "Approval Workflow Form",
      provider: {
        type: "approval-request",
        endpoint: "https://api.example.test/approvals",
      },
      fields: [{ name: "requester_email", label: "Requester Email", type: "email", required: true }],
    }) as FormUI;
    const requesterEmail = element.querySelector("#requester_email") as HTMLInputElement;
    const form = element.querySelector("#approval-workflow-form_form") as HTMLFormElement;
    const onWorkflowState = vi.fn();

    element.addEventListener("form-ui:workflow-state", (event) => {
      onWorkflowState((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    requesterEmail.value = "approver@example.com";
    requesterEmail.dispatchEvent(new Event("input", { bubbles: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(element.getWorkflowState()).toBe("pending_approval");
    expect(element.getWorkflowContext()).toEqual(
      expect.objectContaining({
        workflowState: "pending_approval",
        snapshot: expect.objectContaining({
          workflowState: "pending_approval",
        }),
        approvalState: expect.objectContaining({
          status: "pending_approval",
          approvalId: "apr_123",
        }),
      }),
    );
    expect(onWorkflowState).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          state: "submitting",
          approvalState: null,
          snapshot: expect.objectContaining({
            workflowState: "submitting",
          }),
        }),
      }),
    );
    expect(onWorkflowState).toHaveBeenLastCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          state: "pending_approval",
          snapshot: expect.objectContaining({
            workflowState: "pending_approval",
          }),
          approvalState: expect.objectContaining({
            status: "pending_approval",
            approvalId: "apr_123",
            result: { status: "pending_approval", approvalId: "apr_123" },
            providerResult: {
              status: "pending_approval",
              transition: { type: "workflow", state: "pending_approval" },
              messages: [],
              errors: [],
              data: { approvalId: "apr_123" },
            },
          }),
        }),
      }),
    );
  });
});
