export const REMOTE_RESUME_CONTRACT_VERSION = "resume-contract-v1" as const;

export type TRemoteResumeContractVersion = typeof REMOTE_RESUME_CONTRACT_VERSION;

export type TRemoteResumePolicyCode =
  | "rate_limited"
  | "blocked"
  | "expired"
  | "invalid_signature"
  | "not_found";

export type TRemoteResumePolicy = {
  code: TRemoteResumePolicyCode;
  reason?: string;
  retryAfterSeconds?: number;
  blockedUntil?: number;
  expiresAt?: number;
};

export function isRemoteResumePolicy(value: unknown): value is TRemoteResumePolicy {
  if (!value || typeof value !== "object") {
    return false;
  }

  const policy = value as Record<string, any>;
  return (
    ["rate_limited", "blocked", "expired", "invalid_signature", "not_found"].includes(policy.code) &&
    (policy.reason === undefined || typeof policy.reason === "string") &&
    (policy.retryAfterSeconds === undefined || typeof policy.retryAfterSeconds === "number") &&
    (policy.blockedUntil === undefined || typeof policy.blockedUntil === "number") &&
    (policy.expiresAt === undefined || typeof policy.expiresAt === "number")
  );
}

export function getRemoteResumePolicy(value: unknown): TRemoteResumePolicy | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const policy = (value as Record<string, any>).policy;
  return isRemoteResumePolicy(policy) ? policy : null;
}
