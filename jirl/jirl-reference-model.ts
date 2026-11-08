declare const refBrand: unique symbol;
export type Ref<K extends string> = string & {readonly [refBrand]: K};
export type BlobRef = Ref<"blob">;
export type ClaimRef = Ref<"claim">;
export type JustificationRef = Ref<"justification">;
export type NogoodRef = Ref<"nogood">;
export type ObligationRef = Ref<"obligation">;
export type DecisionRef = Ref<"decision">;
export type MaterialRef = Ref<"material">;
export type RequestRef = Ref<"check-request">;
export type EvidenceRef = Ref<"evidence">;
export type EvaluationRef = Ref<"evaluation">;
export type AuthorityRequestRef = Ref<"authority-request">;
export type AuthorityRef = Ref<"authority-decision">;
export type SnapshotRef = Ref<"snapshot">;
export type Lineage = string;
export type Scope = string;

export interface Claim {
  readonly schema: "intent-ledger/claim/2";
  readonly lineage: Lineage;
  readonly kind: "commitment" | "assumption" | "proposition" | "artifact" | "selection";
  readonly scope: Scope;
  readonly statement: string;
  readonly payload?: {readonly format: string; readonly content: BlobRef};
  readonly tags: Readonly<Record<string, string>>;
}

export interface Justification {
  readonly schema: "intent-ledger/justification/2";
  readonly premises: readonly ClaimRef[];
  readonly consequent: ClaimRef;
  readonly rule: BlobRef; // Versioned relation/rule specification, not a truth label.
}

export interface Nogood {
  readonly schema: "intent-ledger/nogood/2";
  readonly scope: Scope;
  readonly members: readonly ClaimRef[];
  readonly reason: string;
  // Current evidence is attached outside Material, never back to its containing root.
}

export type CheckSubject =
  | {readonly kind: "claim"; readonly claim: ClaimRef}
  | {readonly kind: "justification"; readonly justification: JustificationRef}
  | {readonly kind: "candidate"};

export interface Obligation {
  readonly schema: "intent-ledger/obligation/2";
  readonly lineage: Lineage;
  readonly scope: Scope;
  readonly subject: CheckSubject;
  readonly mode: "judgment" | "proof" | "test" | "query";
  readonly specification: BlobRef; // Exact property, assumptions, and required evidence scope.
  readonly checker: BlobRef;       // Immutable adapter/tool identity and protocol.
  readonly configuration: BlobRef; // Declared options, budgets, seeds, etc.
}

export interface DecisionRecord {
  readonly schema: "intent-ledger/decision/2";
  readonly question: ClaimRef;
  readonly options: readonly {
    readonly option: ClaimRef;
    readonly selection: ClaimRef; // Distinct proposition: this option is chosen for this question.
  }[];
  readonly assessments: readonly {
    readonly criterion: ClaimRef;
    readonly option: ClaimRef;
    readonly assessment: ClaimRef; // Factual evidence binds to this claim outside Material.
    readonly mark?: "++" | "+" | "0" | "-" | "--";
  }[];
  readonly selectedOption: ClaimRef | null; // Null means open, not failure.
  readonly rejected: readonly {
    readonly option: ClaimRef;
    readonly reason: string;
    readonly reopenWhen: string; // Human condition; no automatic string matching.
  }[];
}

export interface Material {
  readonly schema: "intent-ledger/material/2";
  readonly claims: readonly ClaimRef[];
  readonly roots: readonly ClaimRef[];
  readonly justifications: readonly JustificationRef[];
  readonly nogoods: readonly NogoodRef[];
  readonly decisions: readonly DecisionRef[];
  readonly obligations: readonly ObligationRef[];
  readonly requiredObligations: readonly ObligationRef[];
  readonly requiredClaims: readonly ClaimRef[];
  // Definitions only: no evidence or query observation that refers to this Material.
}

export interface CheckRequest {
  readonly schema: "intent-ledger/check-request/2";
  readonly material: MaterialRef;
  readonly obligation: ObligationRef;
  readonly environment: BlobRef; // Complete declared manifest of consumed external inputs.
}

export type CheckResult =
  | {readonly kind: "passed"; readonly established: BlobRef}
  | {readonly kind: "refuted"; readonly counterexample: BlobRef}
  | {readonly kind: "incomplete"; readonly reason: string; readonly partial: BlobRef | null}
  | {readonly kind: "unsupported"; readonly reason: string}
  | {readonly kind: "error"; readonly diagnostic: BlobRef}
  | {readonly kind: "not_run"; readonly reason: string};

export interface EvidenceRecord {
  readonly schema: "intent-ledger/evidence/2";
  readonly request: RequestRef;
  readonly result: CheckResult;
  readonly report: BlobRef;
  readonly basis: readonly EvidenceRef[]; // Earlier evidence used by a declared reuse checker.
}

export interface Evaluation {
  readonly schema: "intent-ledger/evaluation/2";
  readonly material: MaterialRef;
  readonly profile: BlobRef;     // Trusted assurance/checker policy, not an arbitrary caller waiver.
  readonly environment: BlobRef;
  readonly evidence: readonly EvidenceRef[];
}

export type AcceptedItem =
  | {readonly kind: "claim"; readonly ref: ClaimRef}
  | {readonly kind: "obligation"; readonly ref: ObligationRef}
  | {readonly kind: "nogood"; readonly ref: NogoodRef};

export interface AcceptedDisposition {
  readonly before: AcceptedItem;
  readonly after: AcceptedItem | null; // Null is explicit retirement.
  readonly reason: string;
}

export interface AuthorityRequest {
  readonly schema: "intent-ledger/authority-request/2";
  readonly bases: readonly SnapshotRef[];
  readonly material: MaterialRef;
  readonly evaluation: EvaluationRef;
  readonly policy: BlobRef;
  readonly principal: string;
  readonly intent: BlobRef;
  readonly interpretation: BlobRef;
  readonly dispositions: readonly AcceptedDisposition[];
  readonly action: "publish_snapshot"; // Does not grant deployment or data migration.
}

export interface AuthorityDecision {
  readonly schema: "intent-ledger/authority-decision/2";
  readonly request: AuthorityRequestRef;
  readonly provider: BlobRef;
  readonly result: "authorized" | "denied" | "indeterminate";
  readonly receipt: BlobRef;
}

export interface Snapshot {
  readonly schema: "intent-ledger/snapshot/2";
  readonly parents: readonly SnapshotRef[];
  readonly material: MaterialRef;
  readonly evaluation: EvaluationRef;
  readonly authorization: AuthorityRef;
  // This immutable envelope is also the change receipt; new identity is its external CAS key.
}
