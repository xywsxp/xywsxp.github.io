# Intent Ledger — Standard Engineering Design Specification

**Status:** unratified design proposal. **Wire-model proposal:** `intent-ledger/2`.

This document describes a current target design, not repository implementation or workspace authority. Adoption requires the owning project's authorized TypeScript specifications and selected policy/provider contracts. This proposal authorizes no implementation, publication service, deployment, or external action.

## 1. Purpose and capability boundary

The ledger records design commitments, grouped reasons, alternatives, and scoped verification evidence. A change produces one coherent version whose current evidence and authorization can be inspected without combining incompatible revisions.

The target provides:

1. Immutable claims with grouped positive support: AND within one justification, OR across justifications.
2. One explicitly admitted configuration per evaluated material root, with separately reported conflicts.
3. Coherent historical and current reads through pinned snapshots and named refs.
4. Exact-candidate, exact-obligation evidence; complete scoped absence queries; explicit decision selections.
5. Candidate preparation, assessment, authorization, and atomic expected-head publication with honest unsuccessful outcomes.

The target does not provide automatic natural-language formalization, automatic discovery of all dependencies, unrestricted theorem proving, a universal organizational authority model, a unique design solution from an intent, or execution/rollback of external actions. It does not infer verification boundaries from intent-graph connectivity. Abstraction/decomposition coordinates are optional navigation metadata. The logical support graph may contain cycles; snapshot ancestry and content-addressed object references are acyclic.

The kernel uses a **single active configuration**, not implicit simultaneous alternate worlds. Optional environment queries have separate semantics (§4.3). A project needing simultaneous incompatible configurations selects that capability explicitly; it is not obtained by filtering individual proof paths and calling their union consistent.

## 2. Terms, ownership, and storage strata

| Term | Meaning and owner |
| --- | --- |
| Claim | Immutable statement or pinned artifact description, with an opaque stable lineage for navigation |
| Justification | A grouped positive dependency and a versioned relation specification; not automatically a proof |
| Nogood | An authority-declared constraint: its member statements must not jointly hold in the selected configuration |
| Obligation | A subject, exact requested property/evidence scope, evaluator, and configuration |
| Material | Complete selected claim/edge/constraint/decision/check definitions and admitted roots; no current evaluation results |
| Evaluation | Current evidence and assurance profile bound to one immutable Material and consumed environment |
| Authority decision | The trusted project's answer to an exact change/publication request |
| Snapshot | Immutable envelope joining parents, Material, Evaluation, and authorization; also the change receipt |
| Ref | A named mutable pointer atomically resolving to one Snapshot |

Storage has one authority with three reference strata:

```
definitions and pinned source bytes → Material
Material → current CheckRequests, Evidence, Evaluation, AuthorityRequest/Decision
parents + Material + Evaluation + AuthorityDecision → Snapshot
named ref --atomic expected-head update--> Snapshot
```

Arrows indicate construction order, not payload-pointer direction. Evaluation records point back to Material; Material never points to the current evaluation or containing Snapshot. Query definitions live in Material, query observations in evidence. This permits bottom-up content addressing without a self-hash equation. Logical cycles are represented by separate Justification records referencing already identified Claim vertices, not by cyclic hash dependencies.

The content store may be one database or object store. No independent authoritative audit database is required. Indexes, rendered status, impact cones, layer views, and support explanations are rebuildable projections.

## 3. TypeScript wire model

References serialize as digests. Phantom brands assist TypeScript; runtime validation still establishes schema, identity, and active membership. Blob payload formats and their readers are declared by the selected adapters.

```ts
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
```

### 3.1 Identity and closure

1. Canonical object encoding is compact UTF-8 JSON. Object keys sort by UTF-16 code-unit order; strings use `JSON.stringify` escaping without Unicode normalization. Values are null, booleans, strings, safe integers, arrays, and plain records. Duplicate keys, unsupported values, non-safe-integer numbers, and undeclared core-schema fields are invalid. Adapter-owned extension content uses declared payload formats, not silently ignored core fields.
2. Object keys are `SHA256(UTF8("intent-ledger/2:object\\0") || canonicalJSONBytes)`; Blob keys are `SHA256(UTF8("intent-ledger/2:blob\\0") || originalBytes)`. `\\0` denotes one NUL byte. The payload includes its schema but no self-ID. Hashing identifies bytes, not permission or semantic equivalence. Loading verifies expected schema and content identity; conflicting bytes at an existing key are a storage-integrity failure, not an overwrite.
3. Reference collections are canonical sets unless a sequence is explicitly declared. Sets are sorted by digest and reject duplicates. Snapshot parents and AuthorityRequest bases are ordered, distinct sequences: the first parent is the expected publication head. Decision option and rejected arrays are sets keyed by option; assessments are distinct `(criterion, option, assessment)` tuples; dispositions are keyed by `(before.collection, before.ref)`. CheckReport subject arrays are sets keyed by subject kind and referenced identity (or the `candidate` marker), sorted by canonical encoded subject bytes; query matches are reference sets. A transform's semantic argument order belongs in its rule payload, not premise-set order.
4. At most one active Claim revision per lineage and one active Obligation revision per lineage exists in Material. A lineage is an opaque stable identifier minted uniquely within its project namespace; it does not imply version equivalence, authority inheritance, or permanent logical conflict. No alias registry is required by the kernel.
5. Every root, edge endpoint, nogood member, decision reference, required claim, and non-candidate obligation subject belongs to the corresponding active Material set. `requiredObligations` is a subset of `obligations`. All payload references resolve. A query-mode Obligation's specification Blob decodes to QuerySpecification. Every selected EvidenceRecord resolves to the mandatory CheckReport schema, which contains its request, result, coverage, execution observation, and detail artifact in one immutable object. Neither request nor result is duplicated in EvidenceRecord. Historical reports and `basis` references may resolve to old stored objects without becoming current active members.
6. A material edit creates new immutable objects as needed. Evidence reruns create new Evidence/Evaluation/Snapshot objects, not new claims or edges merely to replace a log. Old snapshots and objects remain readable. Readers resolve a ref once and use that Snapshot's exact closure throughout the read; they never follow a “latest” lineage independently at each edge.

## 4. Support, conflicts, and assurance semantics

### 4.1 Positive dependency grounding

Let finite Material `M` select claims `C`, roots `R ⊆ C`, justifications `J`, and nogoods `N`. For `U ⊆ C`:

```
F_M(U) = R ∪ U ∪ { j.consequent | j ∈ J ∧ j.premises ⊆ U }
D(M) = lfp(F_M), starting at ∅
```

`D` means dependency-grounded, not factually true, proved, or authorized. Root admission declares the basis of the argument. AND is within one premise set and OR is across edges with the same consequent. A seeded cycle is allowed; an unseeded cycle creates no support. A zero-premise theorem is allowed, but is not warranted without an applicable non-vacuous rule check. Empty logical premises do not imply an empty verification subject.

### 4.2 Warranted support in one active configuration

Freeze an Evaluation before computing warranted closure. For a Claim or Justification `x`, let `B(x)` be the active Obligations whose subject names exactly `x`. An obligation passes only when an applicable current result and decoded CheckReport establish its exact requested property and evidence scope under the selected profile. Missing required results, stale requests, refutation, incompleteness, unsupported adapters, errors, and not-run outcomes are not passes. A `candidate` subject is a candidate-wide readiness side condition; it belongs to neither `B(claim)` nor `B(justification)` and never generates inference by itself.

`pass(x)` means all checks in `B(x)` pass. An ordinary root with no bound check is an explicit admitted commitment/assumption/given, not a verified fact. A Claim of kind `absence` instead asserts an inventory-query fact: `Q(c)` is the subset of `B(c)` whose mode is query and whose decoded QuerySpecification expectation is `empty`. Define `claimGate(c) = pass(c) AND (c.kind != absence OR Q(c) is nonempty)`. Passing such a query requires a current complete empty result under §5.3; an unbound or unresolved absence Claim fails the gate. This rule applies to roots and derived conclusions alike. No Claim contains a back-reference to its own Obligation.

A Justification is eligible for warranted inference only if its bound check set is nonempty; those checks establish the declared relation, not merely that the edge can be parsed. Claim-bound checks are gates, not inference generators. A checked theorem or jointly checked conclusion uses an explicit Justification, possibly with zero premises. A rule-schema certificate may be reused through `EvidenceRecord.basis` and a current instantiation/applicability check; per-edge binding does not require rerunning the same full proof.

```
R_E = { r ∈ R | claimGate(r) }
J_E = { j ∈ J | B(j) ≠ ∅ ∧ pass(j) ∧ claimGate(j.consequent) }
F_{M,E}(U) = R_E ∪ U ∪ { j.consequent | j ∈ J_E ∧ j.premises ⊆ U }
W(M,E) = lfp(F_{M,E}), starting at ∅
ActiveNogoods(X) = { n ∈ N | n.members ⊆ X }
```

Eligibility is fixed independently of the growing `U`. Both operators are monotone on a finite powerset; at most `|C|` strict claim additions occur. A worklist with premise counts implements closure. A failing alternative route does not remove a consequent supported by another eligible route.

`W` means warranted relative to admitted roots, current evidence scope, judgment authority, and assurance profile. It is not a universal truth predicate. A test-based acceptance profile remains test-based; an observed sample is not promoted to a universal proposition. A required achievement Claim is not its own root; accepted normative requirements may be roots for a separate conformance claim. Oracle independence and coverage are declared and reviewed, not inferred from graph shape.

An active nogood in `W` makes the chosen configuration inconsistent and blocks accepted publication. Report witnesses; never delete a root, choose an alternative, or suppress unrelated derivations as an implicit repair. An empty nogood denotes unconditional inconsistency. `ActiveNogoods(D)` may be shown as hypothetical grounding diagnostics, but does not certify checked conflict.

Every Nogood in Material is a declared constraint, covered by the exact candidate's authority decision, not an empirical conclusion minted by a reason string. Its `reason` is read by human why/audit views. The conflict equation has no implicit scope filter: claims in different namespaces can conflict. Conditional/local applicability is explicit positive membership, for example `{inFooContext, a, b}`; without `inFooContext` this constraint is inactive. The same equation governs optional context queries. A checker counterexample can motivate preparation of such a declaration but does not authorize it or enter Material as a current-evidence back-reference.

If material, root/query conditions, or checker inputs change, construct or assess the resulting fixed candidate again. Circular assume-guarantee is a checker obligation with explicit side conditions, not permission for ungrounded graph cycles to certify themselves.

### 4.3 Optional consistent-environment query

For fixed roots `B` and optional roots `A`, a context is `E ⊆ A`. Using frozen eligible rules, define:

```
C_E = positiveClosure(B ∪ E)
consistent(E) ⇔ ActiveNogoods(C_E) = ∅
Labels(c) = minimal_⊆ { E ⊆ A | consistent(E) ∧ c ∈ C_E }
```

This finite definition is the reference oracle. Consistency uses the **full closure of a root environment**, not just claims visited in one proof tree. Joint support for several claims requires a single consistent environment supporting them all. Individually nonempty labels do not prove joint compatibility. Publication still chooses one actual configuration.

This query is optional, potentially exponential, and budgeted by work/output, not depth alone. A partial enumeration returns incomplete with its discovered results and remaining uncertainty; it never returns “no dependency” or “no context” as a completed answer. No eager ATMS label store or multiplicity semiring is required for the kernel.

### 4.4 Derived inspection reports

`read(ref)` resolves one Snapshot; `inspect(snapshot, requested_context)` reports as-of that identity and context. A Claim inspection exposes dependency grounding (`D`), warrant (`W`) with its root basis/profile, bound-check outcomes and absent required results, current conflict witnesses, and the independent applicable governance receipt. A history comparison can identify old evidence whose request no longer applies. These are derived values, not mutable Claim fields.

There is no unqualified `VALID` scalar. Unsupported, refuted, incomplete, unknown, and unauthorized conditions remain inspectable without forcing them into one mutually exclusive support enum. A current surviving route is not globally stale because an unused old route lost applicability. Any bounded inspection reports incomplete rather than passing on an unexamined seam.

## 5. Evidence and checker boundary

### 5.1 Request applicability

Each selected EvidenceRecord resolves through its decoded CheckReport to a CheckRequest for the Evaluation's exact Material, exact Obligation, and environment manifest. The Obligation pins the subject, specification, evaluator implementation/protocol, configuration, assumptions, and requested evidence scope. All implementation/model/property bytes are immutable references; a live filename, branch name, checker label, or authored interface digest is insufficient.

The environment manifest identifies all declared consumed toolchain, runtime, external API/data, configuration, and random/observational inputs material to the result. If the required inputs cannot be pinned or their applicability cannot be established for the requested guarantee, return incomplete/unsupported rather than silently treating a version string as complete evidence.

One Evaluation selects at most one EvidenceRecord per resolved request; duplicate requests are a validation error, not a newest-success tie-breaker. Every required request needs one applicable passing outcome; absent results are missing evidence, never vacuous coverage. Prior runs remain immutable. Inconsistent outcomes for nominally identical deterministic inputs require reconciliation. A changed profile/environment produces a new Evaluation identity and acceptance decision.

The profile judges sufficiency independently of the recorded checker observation. It is not duplicated in CheckRequest when it is not a checker input: unchanged raw evidence may be accepted by one profile and insufficient for another. If profile selection changes the actual property, evaluator, options, assumptions, or environment, those pinned request inputs must change. No old profile's acceptance decision is inherited.

Snapshot inspection is as-of its pinned evaluation context. A claim of live readiness additionally compares that context with the requested current policy/environment and declared external assumptions. Changed or unobserved live inputs are stale/unknown, not proof that the saved pass remains applicable. The ledger does not promise automatic discovery of external change or continuous validity without a project-owned observation trigger.

#### Evidence-admission procedure

The kernel applies the following rules before any outcome contributes to warranted support or readiness:

1. **Decode one bound record.** Validate the closed EvidenceRecord, referenced CheckReport, its embedded CheckResult, execution variant, and referenced artifacts. The report holds the request and result together; an external `EvidenceRecord.result`, a second request, or an undeclared result field is invalid. A pass means exactly the pinned request's property and scope; there is no caller-supplied `passed.established` proposition to substitute. A narrower established claim belongs to non-passing partial/detail evidence or to another request whose applicability is checked.
2. **Resolve current inputs once.** Resolve the report's request, verify its exact Material/environment and selected Obligation, apply outcome uniqueness, and validate current subject membership. A report for another request does not discharge this obligation; if a required outcome is absent, it remains missing. Loading/transformation of a changed representation owns its validation; unchanged internal handoffs do not repeat it.
3. **Enforce report kind.** A query-mode Obligation requires `kind="query"` and its matches; every other mode requires `kind="check"`. Validate coverage subjects, result artifacts, query scope/membership, and §5.3 expectation rules. Extra query fields cannot hide in the check variant. A missing or malformed object is an admission failure, not an empty report.
4. **Keep checker execution explicit.** `execution` is mandatory and describes the checker/harness boundary, not whether the requested property was exercised. `no_process` declares that this boundary is not relying on a separately observed checker-subprocess completion; the configured adapter owns the truth and applicability of that declaration. A check that relies on a subprocess must use `process` and preserve its exit/signal/timeout/abort observations. Missing process data must not default to `no_process`. A settled adapter decision (`passed`, `refuted`, or deliberate `not_run`) backed by a process needs a non-null numeric exitCode, null signal, and false timedOut/aborted. Signal termination, unknown termination, timeout, or abort cannot be silently relabeled as a settled decision to skip; report the actual `error`/`incomplete` cause instead. A normally completed harness may deliberately skip the requested property. A validated prefix/certificate can ground a separately identified witness/applicability check without claiming its interrupted collector completed.
5. **Describe exercise once.** Coverage is `complete` or `incomplete`; zero exercise is represented by `exercised=[]`, not a duplicate coverage state. Complete coverage requires nonempty exercised subjects including the declared subject, no requested omissions, and (for queries) exercise of the `candidate` inventory. Incomplete coverage permits zero or partial exercise. A property verdict (`passed` or `refuted`) requires actual declared-subject exercise and the query inventory where applicable. A pass additionally requires complete coverage. Refutation may retain incomplete coverage and omissions when a concrete witness already refutes the request. A zero-premise theorem still exercises its theorem/Justification; a complete empty query still exercises its inventory. Any reported query matches require inventory exercise even when the final result is a non-success.
6. **Keep the causal result separate.** `not_run` means a deliberate decision not to evaluate the requested property, not “no checker harness was invoked.” It requires incomplete coverage, no exercised subjects/current query matches, and a settled adapter decision under rule 4; its reason names the actual skip condition. `omitted` may identify the requested subjects left unexamined. No-process skips and normally completed harness skips are both representable. A loading failure, unavailable evaluator, or exhausted budget before the first subject instead retains `error`, `unsupported`, or `incomplete` with zero exercise; do not erase the initiating cause by forcing `not_run`. Complete exercise followed by interpretation/certificate failure may also retain a non-passing error/incomplete result. Coverage alone is never semantic success, and no non-passing result discharges an obligation. Admission preserves these distinct meanings and rejects the request-specific contradictions in §5.3.
7. **Apply the actual assurance boundary.** The trusted adapter/profile establishes report truth, property scope, valid counterexamples, and the configured positive or rejection oracle. A definitive numeric exit alone is insufficient: exit zero does not prove the property, and a nonzero exit can be the expected result of a specified rejection test. Typed admission checks enforce identity/shape/coherence, not producer honesty, execution, model adequacy, or oracle independence. No subject or missing evidence is not success. A profile cannot waive these admission rules; it may additionally reject insufficient evidence.

Raw logs/certificates have one home in `details`; result-specific partial/counterexample/diagnostic artifacts carry their declared evidence use. All claimed guarantees remain scoped to the identified request and applicable adapter contract. No crypto invocation token or duplicate attestation store is required.

### 5.2 Reuse and incrementality

Exact-request reuse is the default. A changed Material conservatively requires renewed applicability because it can change query results and candidate-wide obligations. A checker-specific reuse adapter may certify a new request using complete declared dependency projections and any required abstraction/correspondence proof. It records new evidence bound to the new request, with the original evidence in `basis` and the applicability argument in the report.

Equal interface text/digests alone do not establish behavior equivalence or code conformance. Unknown or undeclared dependencies do not permit early cutoff. Full candidate recomputation is an acceptable initial engine. An optimized evaluator must equal clean evaluation on the same inputs, including negative query observations and alternative support survival.

### 5.3 Query protocol

A query-mode Obligation pins its evaluator and QuerySpecification, whose predicate and optional result-predicate are immutable programs. Scope values are canonical absolute namespace paths: `/` or slash-separated nonempty segments, without trailing slash, dot segments, or alternate separators. Query scope `/` includes the full inventory; another scope includes claims with that exact scope or a descendant separated by `/`. The first kernel's domain is the selected **claim inventory and explicitly declared metadata/payload fields**, not current warranted support, authority results, or its own absence assumption. More expressive default/recursive-query semantics require a separately accepted extension.

The mandatory query CheckReport contains matches, coverage, execution, and its verdict; its exact request derives Material/inventory, query specification, evaluator, and configuration without a duplicate manifest. Every reported match is a current Claim in the declared scope, and the declared evaluator owns predicate correctness. Definitive verdicts obey §5.1 and the following expectation table:

| Expectation | Passed | Refuted |
| --- | --- | --- |
| `empty` | Complete query and zero matches | At least one concrete reported match; partial enumeration is allowed |
| `exact` | Complete query with the exact canonical expected set | A complete unequal set, or a partial result containing a concrete extra match outside the expected set; merely not finding an expected member yet is insufficient |
| `predicate` | Complete query and the admitted result-predicate verifier establishes true | Complete query and that verifier establishes false; no generic partial-result inference is assumed |

The registered result-predicate verifier is an explicit bounded adapter check, not an inferred truth value from its program hash. Unknown/unsupported/incomplete predicate evaluation cannot admit a definitive verdict. `refuted` on a complete empty report is therefore contradictory **for an empty expectation**, not for every possible expectation: zero matches can legitimately refute an exact nonempty set or a predicate requiring a match. A concrete counterexample must correspond to the exact request and reported witness; generic trace/certificate interpretation remains the declared verifier's obligation.

A passed query also omits no requested scope. Empty matches still depend on the inventory even when the inventory has no Claims. An incomplete/error verdict is not upgraded merely because reported matches would satisfy an expectation; it remains non-passing until a valid current check establishes that result. Completeness truth and predicate adequacy remain the declared evaluator's responsibility.

Insertion, deletion, or changed query/evaluator inputs require re-evaluation or justified dependency reuse. A changed collection is evidence inapplicability, not itself a logical contradiction. A concrete matching witness may refute absence without enumerating every match, preserving incomplete exploration separately; zero matches before completion cannot establish it. Thus `refuted` need not mean exhaustive search, but `passed` requires complete coverage. A skipped or pre-exercise failed query retains zero exercise and no current matches, with its actual non-passing cause.

Bind an inventory-absence check to a Claim of kind `absence`, with an `empty` expectation. Missing binding, missing evidence, incomplete results, or a current match exclude that Claim from warranted support via `claimGate`; it remains visible in the inventory and raw grounding. A successfully completed empty query may admit it. An ordinary `assumption` may declare an environmental premise, but must not be presented as query-established inventory absence. The kernel does not infer classifications from English; accountable authors/profiles review that semantic distinction, and changing a protected root's classification requires an explicit revision disposition. Invalidation creates no Nogood automatically; a new constraint is a separately authorized declaration.

### 5.4 Verification models and implementation correspondence

The obligation owner supplies observable behavior, necessary caller/environment assumptions, the property, and a model or structured semantics adequate for it. Static data properties may use predicates/types. Interaction properties may use interface models; internal or protocol properties may use state machines. Contracts and machines are not mutually exclusive choices inferred from graph topology.

Discharge uses either a joint check or a specific composition/refinement rule with its side conditions. For a joint check that warrants a conclusion, bind the obligation to one composed Justification: component Claims are its grouped premises, the checked property is its consequent, and the checker examines the declared composed model/relation. A candidate-only obligation can instead check a global readiness side condition, but its passing result never makes an unbound Justification eligible or inserts a Claim into `W`. A required conclusion without a bound derivation remains unwarranted even if a candidate-only joint check passes; attaching the joint check to the composed edge supplies the explicit bridge. A direct theorem may use a checked zero-premise edge. No speculative `establishes[]` propagation is implicit.

The selected calculus determines its obligations, including progress/fairness/divergence/termination when claimed; a generic list of acronyms is not a complete proof. SCC/interference analyses are discovery/scheduling hints with declared completeness limits. Async queues add queue/capacity/order/delivery/progress obligations rather than removing dependence.

The contract owns its observable guarantees and necessary caller duties, not unrelated consumer strategy. Implementation claims separately pin actual code/toolchain/runtime and establish a declared realization relation. Declaration checks, model traces, finite exploration, implementation replay, and reviewed model adequacy have distinct scopes. No model-only pass certifies production code.

## 6. Decisions and authority

### 6.1 Decision invariants

One current DecisionRecord exists per question. Options and their selection propositions are unique. Every selection Claim is distinct from option existence and belongs to one question/option pair. Assessments and rejection records refer to listed options; the selected option is not also rejected. Ordinal marks are not arithmetic utilities.

At most one selection proposition per question belongs to `W`. If `selectedOption` is non-null, its proposition belongs to `W` and other selection propositions do not. Null is a legitimate open question. Requiring a particular question to be resolved is a project-profile duty, implemented by an identified profile check or required candidate-level Obligation; the kernel has no hidden `requiredDecisions` default. A missing required profile check is unsupported/missing evidence, not a pass. Recording multiple feasible alternatives creates no conflict. Value selection needs appropriate judgment authority; factual assessments retain their own evidence duties.

The free-text `reopenWhen` is a human-review condition, not an executable pattern. Automation uses a separately versioned predicate/checker with declared inputs. A new selection changes Material before assessment; later authorization accepts or rejects that already fixed choice.

### 6.2 Accepted-item preservation

An AcceptedItem names a **selected role** `(collection, ref)`, not just object bytes. For each applicable accepted base, the default protected entries are every member of `roots`, `requiredClaims`, `obligations`, `requiredObligations`, `justifications`, `decisions`, and `nogoods`. Thus current accepted reason/decision/check definitions are protected along with normative roots and required memberships. Each base's recorded governing policy may additionally protect selected `claims` entries; this union covers every current Material object family. A candidate policy cannot erase those earlier protections: changing governing policy itself requires the provider's independently sourced capability for that exact policy/base change. Protection means explicit authorized revision, not permanent active retention or a fresh human approval ceremony.

The kernel derives the protected set for each base. For every protected entry absent from the same collection in the candidate, require exactly one AcceptedDisposition whose `before` is that entry. `after` is null for withdrawal of that role, or identifies a replacement role actually selected in the candidate. No-op dispositions for unchanged selections are invalid. Root or required-obligation demotion therefore needs disposition even if the identical Claim/Obligation bytes remain in another collection. Replacing a decision record, support edge, or check definition likewise cannot evade the rule by leaving its old object in storage. All additions and the full candidate diff are still covered by the exact authorization request. Missing or insufficiently authorized dispositions block publication; the provider decides capability for the exact change, without a universal total authority rank.

This is conservative identity-based protection, not an algorithm for deciding whether arbitrary prose is weaker. Equivalent/stronger replacements may be approved by delegated policy without fresh owner ceremony, but the acceptance event is explicit. Conflict inheritance across edited lineages is not automatic: a general cross-version constraint needs its own accepted specification; an exact-version constraint must be reconciled when endpoints change.

### 6.3 Authority provider

The project configures trusted assurance profiles and an authority provider with explicit source/delegation/applicability rules. A caller-supplied profile cannot waive governing policy merely because it is hashed. A provider receipt covers exact base(s), Material, Evaluation, principal, governing policy, intent/interpretation, dispositions, and `publish_snapshot` action. Stored claims cannot mint that authority.

Authority is independent of grounded support or evidence. A candidate can be supported but unauthorized, or authorized for consideration but fail checks. Requester identity has one home in `AuthorityRequest.principal`; provider identity and its reported UTC `recordedAt` are in AuthorityDecision. The timestamp is normalized `YYYY-MM-DDTHH:mm:ss.sssZ` provenance for audit inspection, not a trusted clock, causal-order proof, or permission grant. Provider contracts own any time-based expiry and underlying grantor provenance. Contest/retirement views come from the provider's named events/semantics or explicit dispositions; the kernel does not invent an underspecified four-state governance lifecycle. Publication authority does not grant deployment, migration, file mutation, or other external effects.

## 7. Evolution and publication protocol

### 7.1 Operations

```
propose(base(s), intent, recorded_oracle_inputs) -> candidate | unresolved
assess(Material, profile, environment, actual_checker_results) -> Evaluation + derived readiness
authorize(exact change/publication request) -> authorized | denied | indeterminate
publish(ref, expected_head, sealed Snapshot) -> published | stale_base | indeterminate
```

The assessment reducer is deterministic over fixed inputs/outcomes. Interpretation, synthesis, value choice, and external observations are explicit adapters or human inputs; a selection policy does not magically make their results deterministic. All operations preserve unsuccessful outcomes. No oracle is assumed always available or always successful.

### 7.2 Transition order

1. **Prepare:** resolve base(s); retain raw intent and selected interpretation; choose the complete candidate including selection, obligation revisions, reconciliation, and retirement. No accepted state is changed.
2. **Assess:** establish structural input invariants once at their owning boundary; build current requests, obtain outcomes, and derive `D`, `W`, conflicts, decision consistency, and required-check readiness. Reuse unchanged internal guarantees while applicability holds. Unavailable adapters yield unsupported outcomes, not defaults.
3. **Authorize:** obtain the provider's exact decision covering the candidate and protected-item dispositions. A request to change Material returns to Prepare; authorization does not modify it.
4. **Seal:** persist and verify immutable objects and the Snapshot envelope. Its parents equal the authorized bases; its Material/Evaluation match the authorized request. Prepared objects not installed in a ref are not publication evidence.
5. **Publish:** the ref store atomically compares `expected_head` and installs exactly the sealed Snapshot. A different head returns stale_base without changing the ref. No callback changes the candidate. The store enforces the authority provider's declared current-applicability rule at this boundary.
6. **Observe:** verify stored Snapshot bytes and the publication transition evidence. A later writer moving the ref does not undo an already observed successful publication; report both the accepted transition and current head where relevant. A readback/storage failure after an attempted update may leave an indeterminate effect; do not claim nothing was published or guess success.

Accepted readiness requires structural validity; required Claims in `W`; required obligations passed at the requested scope; no active nogoods; valid required decision selections; the governing profile's non-vacuity/independence conditions; and exact applicable authorization. A profile promising a checked nonempty corpus reports no-subject rather than readiness on an empty one. Open/failing candidates may be retained as unreferenced scratch objects without publication to an accepted ref.

### 7.3 Publication store contract and outcomes

The store owns immutable object persistence and atomic expected-head updates. A successful transition is durable within its documented assumptions. If historical installation must remain provable after later ref movement, transition evidence is recorded atomically with the update in that same authority; CAS object existence alone is insufficient. Storage errors preserve initiating cause, observed effects, durability/visibility limits, and reconciliation needs.

The orchestration returns one of:

```
published(snapshot, transition_evidence, observed_head)
invalid_input(violated_condition)
unresolved(open_questions, candidate?)
blocked(candidate, obligations_and_outcomes, conflicts)
unauthorized(exact_request, provider_receipt)
stale_base(expected_head, actual_head, candidate)
indeterminate(attempted_snapshot?, cause, observed_effects, reconciliation)
```

Internal checker/substrate failures remain identifiable as such, not misattributed to valid caller inputs. Cleanup/compensation reports preserve the initiating cause and any residue. A timeout, abort, missing evidence, or indeterminate publication is never success.

### 7.4 Merge, retirement, and recovery

Stale-base handling returns to preparation. A merge reconciles applicable common-base histories, retains both parents, and checks the combined candidate's affected and joint obligations. It obtains new authority for its exact bases/candidate request. Textual merge success and last-writer-wins are not semantic acceptance. An automatic merge engine is optional; stale_base is a complete supported result.

Retirement/refactoring is a new candidate following the same protocol, never a post-publication mutation. Historical objects remain available; retired branches need not remain in the active inventory. Restoring a graph ref does not restore databases, reverse deployments, or compensate migrations. External actions and their succeeded/failed/partial/unknown observations belong to independently authorized boundaries outside this publication protocol.

## 8. Conformance and verification plan

### 8.1 Invariants

| ID | Invariant | Owning check / witness |
| --- | --- | --- |
| I01 | Typed, immutable, canonical object identity and reference closure | Load/validate; §§2–3; V9 |
| I02 | One active concept revision and one pinned read closure | Material validation/ref resolution; V9 |
| I03 | AND/OR support is grounded, monotone, and order-independent | Positive worklist; V1–V4 |
| I04 | Authority-declared Nogoods constrain one configuration outside positive iteration; conditions are explicit members | Separate consistency check/declaration authorization; V1, V14, V16, V22 |
| I05 | Request, result, coverage, and execution belong to one immutable report; current evidence binds exact material/obligation/environment and requested scope | Closed report/result admission and request/profile validation; V7–V9, V13, V24–V27 |
| I06 | Missing/non-passing evidence cannot discharge a duty; complete coverage has actual requested exercise and no requested omissions | Kernel report admission plus trusted adapter exercise/completeness truth; V4–V5, V13, V21, V30–V31 |
| I07 | Typed inventory absence requires a current complete empty query, including collection identity for empty results | Query report/request binding and claimGate; V5, V19 |
| I08 | Option existence, selected proposition, and selection authority are distinct | Decision/profile/provider checks; V6 |
| I09 | Protected object selections and root/required memberships cannot change silently | Typed collection-entry diff, dispositions, provider capability; V10–V11, V17–V18 |
| I10 | Publication installs exactly the assessed and authorized candidate | Seal consistency and expected-head store operation; V11–V12 |
| I11 | Publication/recovery outcomes preserve actual effect uncertainty | Store transition/readback evidence; V12 |
| I12 | Incremental results equal clean evaluation under unchanged applicability | Differential evaluation; V15 |
| I13 | Verification claims retain model/test/implementation scope and independent oracle | Adapter/profile review; V7–V8, V13 |
| I14 | Retired history remains immutable; graph restoration claims no external inverse | Object retention and separate external-action boundary |
| I15 | Settled adapter decisions have applicable completion evidence; property exercise, deliberate skips, and startup failures retain distinct truthful scope/cause | §5.1 admission procedure and §5.3 expectation table; V21, V24–V31 |

### 8.2 Required witnesses

| ID | Fixed witness / required observation |
| --- | --- |
| V1 | Root `a`, edges `a→b`, `a→c`, nogood `{b,c}`: positive closure is order-independent, reports conflict, and never publishes readiness |
| V2 | `x←a∧b` or `x←d`: withholding `b` blocks only the first route; eligible `d` preserves `x` |
| V3 | Unseeded positive cycle creates no support; a seeded cycle may support reachable claims |
| V4 | A zero-premise checked theorem exercises its actual proposition and can warrant it; an unchecked zero-premise edge is raw grounding only |
| V5 | A complete empty inventory query is valid; insertion of a matching claim invalidates the old applicability and a current match defeats absence; incomplete empty enumeration never passes |
| V6 | Recording both feasible options is consistent; two warranted selections for one question fail; a required open decision blocks readiness |
| V7 | Same artifact/premises with postcondition strengthened `>=0` to `>0`: old evidence cannot discharge the new obligation |
| V8 | Same authored interface digest with changed implementation behavior: no reuse without applicable correspondence/dependency evidence |
| V9 | Editing one lineage creates a new exact revision; no edge/evidence silently follows it; query/current evidence binds Material without a self-hash cycle |
| V10 | Changed/removed accepted roots, goals, required checks, or nogoods need explicit disposition with adequate provider authority |
| V11 | Moved ref returns stale_base; any reconciled candidate rechecks joint obligations and obtains exact-base authority |
| V12 | Failure after attempted ref update reports observed/indeterminate effects; CAS object existence alone is not publication proof |
| V13 | Exhausted model/search budget, unsupported checker, error, absent subject, and implementation-not-tested remain distinct from pass |
| V14 | Optional contexts check full closure: fixed root `r` deriving both `a,b` with nogood `{a,b}` has no consistent context merely because each proof tree omits the other conclusion |
| V15 | Any incremental evaluator equals a clean evaluator on the same complete inputs, including negative queries and OR-survival |
| V16 | An unscoped `{a,b}` constraint conflicts even when Claims have different namespaces; `{inFoo,a,b}` is inactive without `inFoo` and active with it; no ignored Nogood.scope is admitted |
| V17 | Remove a root or required-obligation membership while retaining identical object bytes elsewhere: an exact role disposition is required; no-op dispositions do not satisfy it |
| V18 | Replace a selected DecisionRecord/rejected rationale or Justification/premise set: removed protected entries require exact authorized dispositions even when the old objects remain in CAS |
| V19 | An `absence` root/conclusion with no complete current empty-query binding is not warranted; complete empty queries can admit it; partial results or current matches cannot |
| V20 | Candidate-only joint success leaves an otherwise unbound required conclusion unwarranted; binding the joint check to a grouped composed Justification admits the conclusion only when its premises are warranted |
| V21 | A passed report with no exercised subject, incomplete coverage, requested omissions, invalid/missing report schema, or contradictory query matches is rejected; complete empty inventory is not no-subject |
| V22 | A Nogood is an authority-declared constraint, not an empirical assertion from a string; exact authorization covers its Material, and a checker-only suggestion cannot authorize declaration; definitional and counterexample-motivated constraints share this rule |
| V23 | A profile-owned required decision that is open blocks readiness through its identified profile/required-obligation check; optional questions remain open without inventing a kernel default |
| V24 | A signalled process cannot yield a definitive verdict even when timedOut/aborted are false; an explicitly process-free check or normally completed eligible process can |
| V25 | A process record with neither exit nor signal cannot pass; missing/unknown execution cannot default to no-process; timeout/abort do not become completed checks |
| V26 | Request and result share the same immutable report; outer result substitution or `passed.established` injection is invalid, and a valid report for another obligation cannot discharge the required one |
| V27 | Reject empty-expectation refutations with no matching witness and report-kind/mode mismatches; accept a real partial matching witness; exact/predicate refutations follow their own expectation, and post-exercise errors remain non-passing |
| V28 | A normally completed checker harness may deliberately skip the requested property: incomplete coverage, no exercise/matches, a truthful skip reason, and optional omitted requested subjects produce a valid non-pass |
| V29 | A signalled/timed-out/unknown process cannot produce a settled skip decision; its zero-exercise error/incomplete observation remains representable without turning into success |
| V30 | Before-first-subject loading failures, unsupported evaluators, and budget stops retain their actual error/unsupported/incomplete results; complete coverage with no exercise and an unknown coverage token are rejected |
| V31 | A no-process deliberate skip is a valid non-pass, including identified unexamined subjects; a skip cannot claim exercise or query matches; complete exercise plus a later error/incomplete/unsupported result remains non-passing |

The scratch support witnesses are `/tmp/shift-task/intent-dag-extract/sol-cold-probes.mjs` (P1–P9) and `/tmp/shift-task/intent-dag-extract/sol-convergence-probes.mjs` (P10–P13). Current model-shaped reference witnesses are `/tmp/shift-task/intent-dag-extract/sol-spec-v4-probes.mjs`; their recorded outcomes and exact candidate identity accompany the Room submission. They include bounded local Node fixtures for a normally completed harness skip and a startup failure before property exercise. These finite probes test the declared examples/reducers and those fixture outcomes, not a production ledger, general checker truth, store durability, or a real authority provider. V4 and V8–V31 still need applicable implementation/provider-specific tests before runtime acceptance. Syntax/type stripping and byte equality between the embedded model and `/tmp/shift-task/intent-dag-extract/intent-ledger-standard-model-v4.ts` are separate checks, not static typechecking. No repository verification suite, unrestricted model proof, production-store concurrency test, provider validation, or end-to-end runtime conformance is claimed.

## 9. Required project configuration and bounded extensions

Before implementation acceptance, select the governing authority/provider contract, assurance profile and admitted checker implementations, supported payload/query formats, publication-store atomicity/durability contract, and concrete acceptance subjects. Each choice remains an explicit project responsibility rather than a universal kernel default.

The core does not require QOC numeric scoring, SCC analysis, semantic-interface cutoff, synthesis, a regime taxonomy, commuting transformations, colimits, global abstraction layers, lineage aliases, or external-action orchestration. Add a field/check/stage only for an accepted obligation or identified human/audit operation. Preserve prior evidence when revising that choice. A fair comparison against existing versioned contracts/build dependencies/ADRs remains necessary before claiming the ledger's benefit exceeds its recording cost.
