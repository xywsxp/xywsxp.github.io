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
export type CheckReportRef = Ref<"check-report">;
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
  readonly kind: "commitment" | "assumption" | "absence" | "proposition" | "artifact" | "selection";
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
  readonly members: readonly ClaimRef[];
  readonly reason: string; // Human rationale for an authority-declared constraint.
  // All members constrain one configuration; a condition Claim expresses local applicability.
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

export interface QuerySpecification {
  readonly schema: "intent-ledger/query-specification/1";
  readonly view: "claim-inventory";
  readonly scope: Scope;
  readonly predicate: BlobRef;
  readonly expectation:
    | {readonly kind: "empty"}
    | {readonly kind: "exact"; readonly matches: readonly ClaimRef[]}
    | {readonly kind: "predicate"; readonly predicate: BlobRef};
}

export type CheckResult =
  | {readonly kind: "passed"} // Exactly the pinned request's property and scope, not another proposition.
  | {readonly kind: "refuted"; readonly counterexample: BlobRef}
  | {readonly kind: "incomplete"; readonly reason: string; readonly partial: BlobRef | null}
  | {readonly kind: "unsupported"; readonly reason: string}
  | {readonly kind: "error"; readonly diagnostic: BlobRef}
  | {readonly kind: "not_run"; readonly reason: string}; // Deliberate property-check skip, not absence of a harness.

export type CheckReport = {
  readonly schema: "intent-ledger/check-report/1";
  readonly request: RequestRef;
  readonly result: CheckResult;
  readonly exercised: readonly CheckSubject[];
  readonly omitted: readonly CheckSubject[];
  readonly completeness: "complete" | "incomplete"; // Zero exercise is explicit in exercised, not a third coverage state.
  readonly details: BlobRef;
  readonly execution:
    | {readonly kind: "no_process"} // No checked subprocess-completion claim at this boundary.
    | {readonly kind: "process"; readonly exitCode: number | null;
       readonly signal: string | null; readonly timedOut: boolean; readonly aborted: boolean};
} & (
  | {readonly kind: "check"}
  | {readonly kind: "query"; readonly matches: readonly ClaimRef[]}
);

export interface EvidenceRecord {
  readonly schema: "intent-ledger/evidence/2";
  readonly report: CheckReportRef; // Request and result have one home in the same immutable report.
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
  | {readonly collection: "claims" | "roots" | "requiredClaims"; readonly ref: ClaimRef}
  | {readonly collection: "obligations" | "requiredObligations"; readonly ref: ObligationRef}
  | {readonly collection: "justifications"; readonly ref: JustificationRef}
  | {readonly collection: "decisions"; readonly ref: DecisionRef}
  | {readonly collection: "nogoods"; readonly ref: NogoodRef};

export interface AcceptedDisposition {
  readonly before: AcceptedItem;
  readonly after: AcceptedItem | null; // Null withdraws this selected role, not historical bytes.
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
  readonly recordedAt: string; // Provider-reported UTC provenance, not a permission or clock proof.
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
