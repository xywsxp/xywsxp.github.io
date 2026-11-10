# Refinement-DAG Software Development: A Calculus of Verified Behavior Inclusions for Agent-Authored Systems

## Abstract

Agent-authored software requires a principled boundary between the behavioral guarantees it must preserve and the internal implementation details an automated agent is permitted to change. We present a development calculus in which local component machines, parent-owned contracts, executable leaves, and architectural connectors are formally related through finite visible-trace inclusion. Three operational disciplines make system boundaries unambiguous: pure, terminating handlers defined over state-indexed enabled inputs; letter-or-erasure trace observations paired with deterministic protocol monitors; and single-owner stateful runtime instances, allowing sharing without replication only for genuinely state-free definitions. A guarded, execution-witness-indexed wiring obligation bridges local verification to concrete composition. We establish conditional root soundness, the soundness of root-covering inspection frontiers, and an incremental frame theorem for exact-operand evidence reuse. A complete durable-acknowledgement example provides explicit control graphs, handler tables, substrate assumptions, delivery invariants, and forward simulations, accompanied by an explicit premature-acknowledgement counterexample. The calculus addresses finite visible-trace safety under explicit environment, translation, and substrate premises. Across development and versioned evolution, evidence scope and protected interface meaning remain formally preserved.

## 1. Introduction

An autonomous agent can make a failing test suite pass by repairing the implementation, by weakening test assertions, or by altering the underlying meaning of the requirement. Only the first constitutes a genuine implementation repair. A sound development method must distinguish these actions before a successful tool invocation can be accepted as verification evidence.

The same distinction governs system composition. A storage subsystem may satisfy its local component model while that model permits acknowledgement prior to durable persistence. Conversely, a correct implementation may fail refinement simply because its abstraction admits environment executions that cannot occur in deployment. Neither failure mode is resolved by adding reviewers to an informal boundary. The specification, the abstraction, the executable implementation, and the evidence claim must be maintained as distinct, first-class objects.

The calculus developed here uses a single behavioral relation—set inclusion of finite visible traces—across five distinct roles: satisfaction, wiring adequacy, decomposition, child refinement, and leaf realization. Their operands are not interchangeable. In particular, a parent proves its architectural design against abstract contracts, whereas an executable connector is proved sound for operational witnesses that satisfy those contracts. A development DAG records these obligations and their provenance without allowing obligation activation to depend on proof success.

Admitted systems obey three orthogonal operational disciplines:

- **P1: Restricted Leaf Normal Form (RLNF).** A leaf consists of pure, terminating, explicit-state handlers $\delta_\ell$, defined over state-indexed enabled inputs $\mathrm{en}_\ell(s)$. Each handler returns a finite list of emitted outputs. Substrate operations are modeled as command events; their asynchronous results arrive as response inputs.
- **P2: Homomorphic observation and deterministic contract monitors.** Each edge observation is induced by a letter-or-erasure action map. A Level-3 contract is a deterministic, single-initial, prefix-closed protocol monitor. These restrictions guarantee a precise equivalence between trace inclusion and relational forward simulation.
- **P3: Single-owner stateful tree / stateless DAG.** Every stateful runtime instance has at most one owning parent boundary, which strictly routes and mediates all client access. Definitions with a single semantic state and no hidden mutable state may be shared across multiple parents in the DAG. In contrast, separate runtime instances of a stateful definition possess distinct runtime identities and disjoint owned mutable state.

These principles establish orthogonal language, observation, and ownership foundations. To prevent unsolicited outputs, hidden shared aliases, or trivial input refusal (producing only the empty trace $\epsilon$), the calculus enforces explicit delivery, confinement, relative receptiveness, and evidence applicability obligations at each system boundary.

The contributions of this work are:
1. The restricted operational semantics and five-place refinement algebra;
2. A guarded, witness-indexed composition theorem;
3. Conditional DAG and frontier soundness theorems;
4. Protected-boundary versioned evolution with exact-operand proof reuse (an incremental frame theorem and interface cutoff corollary); and
5. A fully instantiated, end-to-end durable-acknowledgement example with counterexamples.

Sections 2–4 establish the refinement algebra, the development DAG record, and core verification obligations. Sections 5–7 address modular interaction, authoring protocols, and versioned evolution. Section 8 details the complete durable-acknowledgement case study. Sections 9–11 review related literature, discuss fundamental limitations, and conclude. Appendix A provides expanded mathematical proofs; Appendix B summarizes formal notation.

## 2. The Refinement Algebra

### 2.1 Observations, machines, and action signatures

An interface $X$ has a disjoint action signature

$$
\Sigma_X=\Sigma_X^{\mathrm{in}}\uplus\Sigma_X^{\mathrm{out}}\uplus\Sigma_X^{\mathrm{int}},\qquad
\Sigma_X^{\mathrm{vis}}=\Sigma_X^{\mathrm{in}}\uplus\Sigma_X^{\mathrm{out}}.
$$

A machine is a labeled transition system $M=(S,S_0,\Sigma_X,\to)$ with nonempty initial states $\emptyset\ne S_0\subseteq S$. An execution is a finite path starting in $S_0$, including the length-zero path. Its visible trace deletes internal labels. Thus

$$\operatorname{tr}(M)=\{\operatorname{vis}(\rho)\mid\rho\text{ is a finite execution of }M\}\subseteq(\Sigma_X^{\mathrm{vis}})^*.$$

Write $\epsilon$ for the empty word, $u\preceq t$ for word-prefix order, and $\operatorname{pref}L=\{u\mid\exists t\in L,\ u\preceq t\}$ for prefix closure. A specification is an arbitrary language $\Phi\subseteq(\Sigma_X^{\mathrm{vis}})^*$, whereas every operational machine trace language is non-empty, contains $\epsilon$, and is closed under prefixes.

We adopt the action partition of Lynch and Tuttle (1989), but do not assume their global input-enabledness. Our open-interface admission rule is relative to a declared protocol (§2.5). Denotational behavior sets $Q$ and operational execution witnesses $N$ are kept distinct: $Q=\operatorname{tr}(N)$ abstracts away state spaces, input acceptance, ownership, and runtime scheduling structure. Concrete composition plugs in operational witnesses $N$, rather than unstructured sets of words.

### 2.2 Satisfaction, refinement, homomorphic edge abstraction, and contract precision

Satisfaction and same-interface refinement are defined by set inclusion:

$$
M\models\Phi\iff\operatorname{tr}(M)\subseteq\Phi,
\qquad M\preceq M'\iff\operatorname{tr}(M)\subseteq\operatorname{tr}(M').
$$

For an edge $(v,c)$, the child component and parent slot may have different visible alphabets. Fix a letter-or-erasure map:

$$
\lambda_{v,c}:\Sigma_c^{\mathrm{vis}}\longrightarrow\Sigma_{v,c}^{\mathrm{vis}}\cup\{\epsilon\},\qquad
\alpha_{v,c}=\lambda_{v,c}^*=\operatorname{mapTrace}(\lambda_{v,c}).
$$

The map $\lambda_{v,c}^*$ extends to words by concatenation, sending $\epsilon$ to $\epsilon$. On trace languages it acts by direct image. Inputs and outputs that remain visible retain their declared roles at the parent slot; erased inputs are still checked against the child-domain input scope. Internal child actions are likewise erased when matching transitions. All visible abstractions are therefore uniformly induced by the designated homomorphism $\lambda^*$.

**Lemma (Prefix Commutation of Letter-or-Erasure Homomorphisms).** For every language $L$,

$$\lambda^*(\operatorname{pref}L)=\operatorname{pref}(\lambda^*L).$$

**Proof.** The image of any source prefix is directly a target prefix. Conversely, given any prefix $p\preceq\lambda^*(t)$ for some $t\in L$, scanning the letters of $t$ accumulates non-erased target letters one at a time (or zero if erased); because each source letter contributes at most one letter to the target, some minimal prefix of $t$ maps exactly to $p$. The empty prefix is witnessed by $\epsilon$. Taking the union over all words in $L$ completes the proof for any language $L$, including $L=\emptyset$. $\square$

The restriction to letter-or-erasure maps is essential: for $L=\{a\}$ and a multi-letter substitution $\lambda(a)=xy$, the left side is $\lambda^*(\operatorname{pref}\{a\})=\{\epsilon,xy\}$, whereas the right side is $\operatorname{pref}(\lambda^*\{a\})=\{\epsilon,x,xy\}$.

Let $\pi_{\mathrm{in}}$ denote the projection that erases every non-input visible event. An admissible input language $A\subseteq(\Sigma_c^{\mathrm{in}})^*$ is prefix-closed and contains $\epsilon$. Define the input-restricted language:

$$Q\!\upharpoonright_A=\{t\in Q\mid\pi_{\mathrm{in}}(t)\in A\}.$$

Its operational realization $\operatorname{Restrict}_A(N)$ has composite states $(s,h)$, initial states $(s_0,\epsilon)$, and the following transitions. A source input step $s\xrightarrow{i}s'$ is retained precisely when $hi\in A$, producing $(s',hi)$. Every source output or internal transition is retained and leaves the input history $h$ unchanged. No output is filtered.

**Restriction equality.**

$$
\operatorname{tr}(\operatorname{Restrict}_A(N))=
\operatorname{tr}(N)\!\upharpoonright_A.
$$

**Proof.** Projecting an execution of $\operatorname{Restrict}_A(N)$ to $N$ yields an execution of $N$ whose history component records its input projection and remains in $A$. Conversely, given an execution of $N$ whose final input history is in $A$, prefix closure of $A$ ensures that every intermediate input history belongs to $A$, so every step lifts to $\operatorname{Restrict}_A(N)$. Initial states remain nonempty. $\square$

The canonical edge transformer is

$$T_{v,c}(Q)=\lambda_{v,c}^*(Q\!\upharpoonright_{A_{v,c}}).$$

Because restriction and direct image preserve set inclusion, $T_{v,c}$ is monotone. For a slot language $L_{v,c}$, edge refinement is $T_{v,c}(\operatorname{tr}(M_c))\subseteq L_{v,c}$. Equivalently,

$$
\operatorname{tr}(M_c)\!\upharpoonright_{A_{v,c}}
\subseteq(\lambda_{v,c}^*)^{-1}(L_{v,c}).
$$

Inverse-image notation is deliberately distinct from the star denoting word extension.

The calculus admits four levels of contract precision. They describe choices of predicates, not four different refinement relations.

| Level | Contract meaning | What evidence must establish |
| --- | --- | --- |
| 0: Top $\top$ | Every well-typed finite trace | Inclusion is trivial; no nontrivial protocol guarantee follows. |
| 1: Type/shape | Every recorded value or event has the required shape | A sound typing or schema argument for the selected observation; a compiler invocation alone is insufficient without its soundness and language assumptions. |
| 2: Pre/post | For completed calls, $P(x)\Rightarrow Q(x,y)$; behavior outside $P$ is unconstrained | A sound Hoare-style argument. A completed-call relation alone does not establish termination, initialization, input acceptance, or feasibility. |
| 3: Protocol | A deterministic partial monitor admitting all prefixes of its runs | A trace-inclusion proof or the initialized simulation of §4.3, together with separate admission checks. |

Levels 1 and 2 lift directly to trace predicates by evaluating completed request-response pairs. Following the feasibility foundations of Unifying Theories of Programming (Woodcock and Cavalcanti, 2004), specifications require explicit operational witnesses to ensure that preconditions are satisfiable and models are non-empty. In this setting, RLNF establishes totality and termination for each enabled handler over its declared enabled state-input domain.

Local cost predicates use the same pullback-intersection pattern:

$$Q\!\upharpoonright_A\subseteq(\lambda^*)^{-1}(L_B)\cap\Phi^{\mathrm{cost}}.$$

Within this core framework, cost properties are evaluated directly over recorded execution traces via explicit metering events. When lifting cost metrics across architectural boundaries, parent cost bounds compose through connector-specific cost-aggregation laws.

### 2.3 Connectors

A connector skeleton $W_v$ has legal finite joint trajectories $\operatorname{legal}_{W_v}(r)$, slot slices $\operatorname{slice}_c(r)$, and a parent observation $\operatorname{obs}_v(r)$. Its denotation is

$$
K_v((L_c)_c)=\{\operatorname{obs}_v(r)\mid
\operatorname{legal}_{W_v}(r)\land\forall c,\ \operatorname{slice}_c(r)\in L_c\}.
$$

A trajectory retains the correlations needed for routing, synchronization, and any declared substrate behavior. Legality is fixed independently of the argument languages. Its finite prefixes are legal, slices of trajectory prefixes are prefixes of the original slices, and every prefix of $\operatorname{obs}_v(r)$ is the observation of some trajectory prefix of $r$. Letter-or-erasure observation of a trajectory's individual events supplies this last, prefix-lifting property by §2.2; prefix preservation alone would not suffice. Consequently, $K_v$ maps prefix-closed slot languages to a prefix-closed parent language: any prefix of an observed trajectory lifts to a valid trajectory prefix whose slices remain within the admitted prefix languages, with initial states established by the operational realization.

**Lemma 1 (Monotonicity).** If $L_c\subseteq L'_c$ for every slot, then $K_v((L_c)_c)\subseteq K_v((L'_c)_c)$.

**Proof.** Keep the same legal trajectory witnessing membership on the left; every slice also belongs to its enlarged language. $\square$

The concrete connector $C_v[N]$ provides the operational composition of component witnesses, specifying explicit transition, routing, and instance allocation rules. The bridge between this operational composition and the denotational transformer $K_v$ is established by the guarded wiring obligation in Condition 5 (§3.4).

### 2.4 The single relation and its five uses

For Level-3 slots write $L_{v,c}=\operatorname{tr}(B_{v,c})$; coarser slots supply their declared trace predicates directly.

| Family | Behavioral obligation |
| --- | --- |
| $\operatorname{Sat}(v,j)$ | $\operatorname{tr}(M_v)\subseteq\llbracket j\rrbracket$ for an active owned intent |
| $\operatorname{Wire}(v)$ | Guarded universal delivery and $\operatorname{tr}(C_v[N])\subseteq K_v((T_{v,c}(\operatorname{tr}(N_c)))_c)$ |
| $\operatorname{Dec}(v)$ | $K_v((L_{v,c})_c)\subseteq\operatorname{tr}(M_v)$ |
| $\operatorname{Ref}(v,c)$ | $T_{v,c}(\operatorname{tr}(M_c))\subseteq L_{v,c}$ |
| $\operatorname{Impl}(\ell)$ | $\operatorname{tr}(N_\ell)\subseteq\operatorname{tr}(M_\ell)$ for the scoped executable witness |

The five obligations form a coherent algebraic inclusion chain, supported by operational delivery and admission premises that govern concrete runtime composition.

### 2.5 Semantic profile scope and side conditions

The profile $\Gamma_{\mathrm{safe}}$ fixes finite visible traces, inclusion, the action partition, and operational admission, ensuring that initialization is non-empty, state invariants hold, and accepted environmental contexts admit feasible physical realizations.

**Relative input receptiveness** is checked at reachable related protocol states, not from language inclusion alone. If the boundary protocol permits input $i$ at its current state, and extending the concrete input history by $i$ lies in $A$, the concrete witness must have a matching acceptance transition. When inputs are mapped or erased, the boundary declaration specifies their concrete acceptance relation; hidden substrate responses have their own protocol. A pending-output state cannot waive a permitted input by an arbitrary readiness flag. Either its corresponding protocol state permits no such input, or a modeled arrival buffer must accept it. A witness with only trace $\epsilon$ refines a monitor permitting `req` by inclusion but fails this reception check.

The core calculus focuses strictly on finite safety properties. Extensions to liveness, timed behavior, or probabilistic guarantees naturally require enriched observation carriers, specialized execution preorders, and explicit fairness or well-founded ranking arguments (discussed further in §10).

### 2.6 Boundary discipline

Component contracts specify visible interactions—enabled inputs, emitted outputs, acknowledgements, causal ordering, and client preconditions—while preserving encapsulation of the component's internal algorithms, data structures, and execution policies. The parent boundary defines the slot contract, and the child component establishes compliance through its chosen internal realization. RLNF serves as an operational admission standard for verified handlers, guaranteeing termination and explicit state transitions without constraining unrelated component design choices.

## 3. The Refinement DAG and Soundness

### 3.1 The development DAG record

A development record is

$$G=(V,\mathcal M,\chi,I,J,E).$$

$V$ is a finite set of cells. $\mathcal M(v)$ gives the interface, local machine $M_v$, semantic profile, and typed context references. An internal cell's $\chi(v)$ records $C_v,W_v,K_v$, its child slots, and $(B_{v,c},\lambda_{v,c},A_{v,c})_c$; a leaf's $\chi(\ell)$ records its RLNF realization and runtime interpretation. The edge relation $v\to c$ is acyclic. Write $\operatorname{ch}(v)$, $\operatorname{par}(v)$, $V_{\mathrm{root}}$, and $V_{\mathrm{leaf}}$ for children, parents, roots, and leaves.

The development record explicitly decouples obligation definitions from their verification status: $I$ tracks formal intents with stable identities, unique owners, scoped predicates $\llbracket j\rrbracket$, and authority tags (`root`, `protected`, or `delegated`). The support mapping $J(j)$ defines finite collections of conjunctive support groups, where alternative groups represent disjunctive proof paths over an acyclic support-reference graph. The evidence store $E$ maps typed proof obligations to formal verification artifacts, keeping obligation activation independent of evidence presence. Stateful runtime instances and stateless reusable definitions are partitioned according to the single-owner discipline of §3.5.

### 3.2 Active intents and positive support evaluation

Define the monotone support operator $F(X)=I^{\mathrm{root}}\cup\{j\mid\exists P\in J(j),\ P\subseteq X\}$, and let $A=\mu X.F(X)$ denote its unique least fixed point. Because $F$ operates over finite conjunctive support groups without negation, and Condition 1 restricts $(I, J)$ to a finite support graph, the Knaster–Tarski fixed-point theorem ensures the existence of $A$, which is computed by finite iteration starting from $\emptyset$; acyclicity of the support-reference graph further enables an efficient single topological evaluation. An explicitly accepted empty support group activates its conclusion directly. An unsupported cycle, if admitted in a more general support graph, would not bootstrap itself in the least fixed point.

Write $A(v)=\{j\in A\mid\operatorname{owner}(j)=v\}$ and

$$\Phi(v)=\bigcap_{j\in A(v)}\llbracket j\rrbracket,$$

with empty intersection equal to the full typed trace space. Each active intent has exactly one owner.

**Lemma 2 (Evidence Separation).** $A$ depends only on $I,J$, not on $E$.

**Proof.** $F$ does not mention $E$, so neither do its iterates or least fixed point. A failed or absent evidence record cannot deactivate its obligation. $\square$

Support formulas combine conjunction within groups and disjunction across alternative groups, admitting an exact semantics in positive Boolean provenance $\mathrm{PosBool}$ (Green, Karvounarakis, and Tannen, 2007) that tracks valid derivation paths through the development graph.

### 3.3 Context premises, dependency closure, and staleness

All scoped judgments are interpreted over a common world $\omega\in\Omega$. A hypothesis reference $h$ has a fixed meaning $\operatorname{Meaning}(h,\omega)$. An evidence claim has the form $\forall\omega,\ H_q(\omega)\Rightarrow q(\omega)$. Context references include environmental assumptions, runtime interpretations, proof-method soundness premises, and their own prerequisite references.

For a root $r$, $\operatorname{Deps}(r)$ is the transitive closure of every hypothesis used by its realization, admission, edge, wiring, decomposition, satisfaction, and evidence arguments. In particular, it is not merely the set of descendant cells. Define

$$H_r(\omega)=\bigwedge_{h\in\operatorname{Deps}(r)}\operatorname{Meaning}(h,\omega).$$

Each local context used in the root proof must be entailed by $H_r$. When reusing evidence previously established under context $H_{\mathrm{old}}$ in a new context $H_{\mathrm{new}}$, applicability requires the explicit entailment $H_{\mathrm{new}}\Rightarrow H_{\mathrm{old}}$ alongside identical typed claim correspondence, maintaining a rigorous distinction between formal logical implication, environmental feasibility, and empirical substrate premises.

Modifications to a hypothesis or operand propagate across semantic dependency edges, marking downstream obligations as pending until applicability is re-verified or new evidence is supplied. Historical evidence artifacts and prior derivation records are preserved for auditability.

### 3.4 Intra-DAG validity and guarded witness-indexed wiring

Let $N_v(\omega)$ be the actual scoped execution witness of cell $v$: a leaf realization or the composition $C_v[(N_c)_c]$. Put $\operatorname{Beh}_{\mathrm{exec}}(v,\omega)=\operatorname{tr}(N_v(\omega))$. A leaf scope restricts environment inputs before observation. Every use inside a parent must justify that scope by delivery; the root's external input scope is an explicit premise in $H_r$.

The following conditions define intra-DAG validity, pointwise under the applicable contexts.

1. **Structure and support.** The child and support graphs are finite and acyclic; interfaces, intent ownership, active supports, and runtime identities are well formed.
2. **Context.** All used premises and their transitive dependencies are declared; their interpretation and scope transports are fixed. Feasibility and unresolved empirical assumptions are reported separately from implication proofs.
3. **Satisfaction.** Every active owned intent has applicable evidence for $\operatorname{Sat}(v,j)$.
4. **Decomposition.** Every internal cell has applicable evidence for $\operatorname{Dec}(v)$, with the trajectory transformer of §2.3.
5. **Operational realization.** Every leaf has applicable $\operatorname{Impl}$ evidence. Every internal cell has the guarded universal $\operatorname{Wire}(v)$ certificate below.
6. **Admission and edges.** Every actual witness satisfies its declared $\operatorname{Adm}_v$, including initialization, relative reception, runtime confinement, and interface interpretation. Every edge satisfies $\operatorname{Ref}(v,c)$ and the ownership discipline of §3.5.

For Level-3 slots, Condition 5 is precisely

$$
\begin{aligned}
\forall(N_c)_c.\quad&
\Bigl(\forall c,\ \operatorname{Adm}_c(N_c)\land
\lambda_{v,c}^*(\operatorname{tr}(N_c)\!\upharpoonright_{A_{v,c}})
\subseteq\operatorname{tr}(B_{v,c})\Bigr)\\
&\Longrightarrow\Bigl(
\operatorname{Delivery}_v(C_v,N,A)\land
\operatorname{tr}(C_v[N])\subseteq
K_v((\lambda_{v,c}^*(\operatorname{tr}(N_c)\!\upharpoonright_{A_{v,c}}))_c)
\Bigr).
\end{aligned}
$$

The quantified objects are typed execution witnesses, not arbitrary trace sets. $\operatorname{Adm}_c$ is a fixed boundary-domain predicate, not a test for the particular implementation's identity. For coarse slots substitute their declared language for $\operatorname{tr}(B_{v,c})$.

$\operatorname{Delivery}_v$ means that every concrete finite composite execution has one legal shared trajectory, with child execution slices from the very witnesses supplied to $C_v$, the same parent observation, and each child's actual input history in $A_{v,c}$. Its slot slice is $\lambda_{v,c}^*$ of that child's visible trace. Delivery also establishes compatibility with intrinsic leaf input scopes. When scoped witnesses are analyzed under input restriction, the delivery proof demonstrates that the unrestricted operational composition naturally generates only in-scope inputs, ensuring that safety holds without artificially filtering invalid transitions. An inductive first-invalid-input argument exemplifies this derivation (§8.6).

Guarding universal wiring by slot conformance is essential: it guarantees that internal component behaviors, such as premature or spontaneous output emissions, are excluded before composing with the parent connector. The universal wiring certificate is proved once over its abstract admission domain and instantiated whenever concrete children satisfy their respective slot contracts.

### 3.5 Edge refinement and the single-owner discipline

Every edge satisfies

$$T_{v,c}(\operatorname{tr}(M_c))\subseteq\operatorname{tr}(B_{v,c}),$$

or the corresponding coarse slot predicate. Incoming edges to a shared definition have separate abstractions, input scopes, and contracts; each must be checked.

For a stateful runtime instance $c$, $|\operatorname{par}(c)|\le1$. All access crosses its owning parent connector, and there is no cross-branch hidden alias to its state or mutable substrate. A reusable stateful definition may be instantiated more than once, but its instances have distinct identities and disjoint owned mutable state. A definition shared without replication is state-free only if $|S_c|=1$ and its complete semantic closure, including descendants and substrate dependencies, has no mutable state. A composite owning a stateful descendant is therefore stateful for this rule. An effectful wrapper around a shared connection is not state-free merely because its source-level object has no fields. Runtime queues and pending-output buffers also have owners; sharing a pure handler definition does not share its invocation buffers.

**Single-Parent Enclosure Lemma.** Under this ownership and access discipline, every interaction with a stateful instance is enclosed by its unique parent boundary (or its external root boundary), and its ownership ancestry is a chain.

**Proof.** A non-root instance has one immediate owner. Every legal access crosses that owner by the access discipline. Repeating the owner relation yields at most one next ancestor at each step; acyclicity makes the sequence finite. Thus two purported independent owner paths cannot diverge above the instance, and an interaction from elsewhere must enter through the owning boundary rather than an alias. $\square$

The Single-Parent Enclosure Lemma establishes the exact architectural boundary where aggregate client interactions must be verified, ensuring that all access paths are mediated by the owning parent.

### 3.6 Theorem 1: Refinement-DAG soundness

**Theorem 1 (Refinement-DAG Soundness).** Let $G$ satisfy Conditions 1–6, with typed edge maps, declared scope transports, and all obligation evidence applicable under the full dependency contexts. For every root $r$,

$$
\forall\omega,\quad H_r(\omega)\Longrightarrow
\operatorname{Beh}_{\mathrm{exec}}(r,\omega)\subseteq\Phi(r,\omega).
$$

The analogous conditional inclusion into $\operatorname{tr}(M_v)$ and each active owned intent holds for every cell under its dependency closure.

**Proof.** Fix $\omega$ satisfying $H_r$. All local contexts in the proof of $r$ follow by dependency closure. Use well-founded induction on the child relation. At a leaf, $\operatorname{Impl}$ gives $\operatorname{tr}(N_\ell)\subseteq\operatorname{tr}(M_\ell)$. At an internal $v$, the induction hypotheses and monotonicity of $T_{v,c}$ give

$$T_{v,c}(\operatorname{tr}(N_c))\subseteq T_{v,c}(\operatorname{tr}(M_c))\subseteq\operatorname{tr}(B_{v,c}).$$

Together with actual-witness admission, these are exactly the guard of $\operatorname{Wire}(v)$. Instantiate it, then use Lemma 1 and $\operatorname{Dec}(v)$:

$$
\operatorname{tr}(N_v)\subseteq
K_v((T_{v,c}(\operatorname{tr}(N_c)))_c)\subseteq
K_v((\operatorname{tr}(B_{v,c}))_c)\subseteq\operatorname{tr}(M_v).
$$

Satisfaction at $v$ yields inclusion in every active owned predicate and thus in their intersection. Applying this inductively to root $r$ completes the proof, with every delivery premise strictly grounded by verified child slot guards. $\square$

### 3.7 Subgraph extraction, root-covering cuts, and frontier soundness

For $S\subseteq V$, let $\operatorname{Anc}(S)$ and $\operatorname{Desc}(S)$ be reflexive ancestor and descendant closures. The interval from $u$ to $w$ is $\operatorname{Desc}(\{u\})\cap\operatorname{Anc}(\{w\})$. A **root-covering cut** $F$ is an antichain intersecting every root-to-leaf path. These are semantic inspection boundaries, not graph-layout levels; different branches may meet $F$ at different depths.

For $v\in\operatorname{Anc}(F)$ define

$$
U_F(v)=\begin{cases}
\operatorname{tr}(M_v),&v\in F,\\
K_v((T_{v,c}(U_F(c)))_c),&v\notin F.
\end{cases}
$$

This recursion is well typed. If $v$ is above the cut and one child had no descendant in $F$, extending that child path to a leaf would bypass $F$; an earlier cut ancestor would contradict the antichain property. Thus all required children are in the upper region. Shared state-free nodes are evaluated once with their edge-indexed transformers.

**Corollary 1 (Frontier Soundness).** Suppose frontier realization $\operatorname{tr}(N_f)\subseteq\operatorname{tr}(M_f)$ holds for every $f\in F$. Suppose the upper region has the edge, decomposition, guarded wiring, actual-witness admission, and scope premises of Theorem 1, and roots satisfy their active intents. Under the full closure of these premises,

$$\operatorname{tr}(N_r)\subseteq U_F(r)\subseteq\operatorname{tr}(M_r)\subseteq\Phi(r).$$

**Proof.** Simultaneously induct upward on $\operatorname{tr}(N_v)\subseteq U_F(v)\subseteq\operatorname{tr}(M_v)$. The frontier case is assumed. Above it, the right inclusion follows from $T$-monotonicity, edge refinement, and decomposition. The left inclusion follows from guarded wiring, whose slot guards follow from the same inductive bounds, and monotonicity into $U_F(v)$. Root coverage makes the induction cover every root. $\square$

The root-covering condition ensures that every execution path to a leaf is intercepted by the cut; omitting any branch would discard component behaviors required for parent soundness. Because abstract frontier models provide safe over-approximations of executable behaviors, the theorem yields behavioral containment rather than trace equivalence.

### 3.8 Protected boundary inventory

Define a tagged disjoint union

$$\operatorname{Prot}(G)=\operatorname{Prot}_{\mathrm{intent}}(G)\uplus\operatorname{Prot}_{\mathrm{slot}}(G).$$

The intent part contains each active `root` or `protected` record, including identity, owner, authority, predicate, and scope. The slot part contains every parent-owned record

$$((v,c),B_{v,c},\lambda_{v,c},A_{v,c},\mathrm{scope}_{v,c}).$$

Scope encompasses the formal observation profile, action mapping, and environmental context. During evolution, protected boundary records preserve their semantic meaning and target subject unless updated through an authorized architectural disposition. Establishing exact typed-record identity ensures seamless preservation across versions, while new or revised specifications satisfy their respective behavioral obligations in full.

Modifying a slot contract (such as enlarging a language from $\{\epsilon,ok\}$ to $\{\epsilon,ok,bad\}$) or strengthening environmental assumptions alters protected interface contracts and requires formal architectural re-authorization. The development record ensures that obligations remain active until explicitly revised or retired, preserving complete audit trails for dormant or historical intents.

## 4. Verification Obligations and Restricted Leaf Realization

### 4.1 Satisfaction

Satisfaction verifies $\operatorname{tr}(M_v)\subseteq\llbracket j\rrbracket$ for each active owned intent. Depending on state complexity, this obligation may be discharged through exhaustive model checking, inductive invariant verification, or sound abstract interpretation. Where finite test suites are employed, universal inclusion requires an accompanying coverage proof demonstrating that all reachable behaviors have been explored.

### 4.2 Decomposition

Decomposition establishes $K_v((L_{v,c})_c)\subseteq\operatorname{tr}(M_v)$ strictly against abstract slot contracts rather than concrete child implementations. Consequently, the resulting proof remains valid for any replacement child components that satisfy the same boundary contracts. While the mathematical trajectory definition guarantees monotonicity, the operational fidelity of the composition is established through the guarded wiring obligation.

### 4.3 Child refinement and deterministic contract monitors

A Level-3 monitor is

$$
B=(Q,q_0,\Sigma^{\mathrm{in}}\uplus\Sigma^{\mathrm{out}},\beta),\qquad
\beta:Q\times\Sigma^{\mathrm{vis}}\rightharpoonup Q.
$$

It has one initial state, no hidden transitions, and at most one successor for each state and label. Every reachable state accepts a finite prefix; missing transitions forbid events. Distinct labels such as `ok` and `fail` may both be enabled. Determinism does not imply finite state. Every prefix-closed language $L$ containing $\epsilon$ has a canonical such monitor: states are words in $L$, the initial state is $\epsilon$, and $w\xrightarrow{a}wa$ exactly when $wa\in L$.

Extend $\lambda$ to internal source labels by erasure. An initialized forward simulation $R\subseteq S_N\times Q$ relates every source initial state to $q_0$. For every related pair and every source step $s\xrightarrow{a}s'$, it requires $(s',q)\in R$ when $\lambda(a)=\epsilon$, and otherwise requires $\beta(q,\lambda(a))=q'$ and $(s',q')\in R$.

**Proposition (Simulation Completeness for Deterministic Monitors).**

$$
\lambda^*(\operatorname{tr}(N))\subseteq\operatorname{tr}(B)
\quad\Longleftrightarrow\quad
\text{an initialized forward simulation }N\to B\text{ exists}.
$$

**Proof.** A simulation matches each finite run by induction. Conversely, relate $s$ to every monitor state reached by the mapped trace of a source execution ending in $s$. Inclusion admits that trace. Extend its witnessing execution by any source step; determinism makes the monitor state after its old prefix the very state already related to $s$, so the new label matches or erases as required. $\square$

For scoped edge refinement, the simulation equivalence applies directly to the restricted witness $\operatorname{Restrict}_{A_{v,c}}(N)$. The simulation relation may be history-dependent, capturing relational correspondences across execution paths, while relative input reception is independently established as an admission requirement (§2.5).

The deterministic-target premise is essential. Consider the nondeterministic target with edges $0\xrightarrow{a}1\xrightarrow{b}2$ and $0\xrightarrow{a}2\xrightarrow{c}3$. Its language is $\{\epsilon,a,ab,ac,abc\}$: the shared state $2$ also permits $c$ after $ab$. A source $s_0\xrightarrow{a}s_1$, $s_1\xrightarrow{b}s_2$, $s_1\xrightarrow{c}s_3$, $s_2\xrightarrow{c}s_3$ has exactly that language. No simulation exists: after $a$, target state $1$ cannot match the source's $c$, and state $2$ cannot match its $b$. Equality of finite trace languages therefore does not suffice for this nondeterministic target.

### 4.4 Leaf realization and Restricted Leaf Normal Form

An RLNF leaf is

$$D_\ell=(S_\ell,s_{0,\ell},I_\ell,O_\ell,\mathrm{en}_\ell,\delta_\ell),$$

where $s_{0,\ell}\in S_\ell$, $\mathrm{en}_\ell:S_\ell\to\mathcal P(I_\ell)$, and

$$\delta_\ell:\{(s,i)\mid i\in\mathrm{en}_\ell(s)\}\longrightarrow S_\ell\times\mathrm{List}(O_\ell)$$

is pure, single-valued, total on its domain, and terminating. All persistent state influencing handler execution is encapsulated within $S_\ell$ or supplied via explicit inputs. These semantic properties are verified through total functional programming primitives, well-founded recursion measures, or verified runtime substrates.

The microstep elaboration has configurations $S_\ell\times\mathrm{List}(O_\ell)$, initial configuration $(s_{0,\ell},[])$, and exactly two rules:

$$
\frac{i\in\mathrm{en}_\ell(s)\quad\delta_\ell(s,i)=(s',w)}
{(s,[])\xrightarrow{\mathrm{in}(i)}(s',w)}
\qquad
\frac{}{(s,o::w)\xrightarrow{\mathrm{out}(o)}(s,w)}.
$$

No input dispatch occurs while outputs remain. The explicit state may already hold the next handler state while the output list records an intermediate observable control point. Empty lists permit the next enabled input immediately.

For any finite handler chain $s_0\xRightarrow{i_1/w_1}s_1\cdots\xRightarrow{i_n/w_n}s_n$, form the concatenated packets $i_1w_1\cdots i_nw_n$, with input/output tags understood. Let $\operatorname{Packets}(D)$ contain all such words, including $\epsilon$.

**Lemma (Packet Decomposition).**

$$\operatorname{tr}(\operatorname{elab}(D))=\operatorname{pref}(\operatorname{Packets}(D)).$$

**Proof.** A finite elaborated execution consists of completed packets and possibly a final packet whose output list is only partly drained. Complete that finite list to obtain a packet word extending the trace. Conversely, execute each packet's input step and output drains; any prefix of that execution is a valid finite execution. The zero-packet and empty-output cases follow from the same rules. $\square$

Substrate operations are externalized:

$$
I_\ell=I_{\mathrm{env}}\uplus\mathrm{Resp}_\ell,\qquad
O_\ell=\mathrm{Emit}_\ell\uplus\mathrm{Cmd}_\ell.
$$

A shell $\mathrm{Sh}_\ell$ is a formal transition system that receives command outputs and emits corresponding response inputs. The connector specifies synchronization mechanisms, buffering boundaries, response correlations, and outcome domains. The formal shell model captures observable interface interactions, with the physical hardware and substrate fidelity explicitly designated as environmental premises in the trusted base.

The mathematical realization obligation is

$$
\operatorname{tr}(\operatorname{elab}(D_\ell))\!\upharpoonright_{A_\ell}
\subseteq\operatorname{tr}(M_\ell).
$$

When using host-language implementations $P_\ell$, an explicit translation premise $\mathrm{Trans}_\ell$ formally establishes that the compiled or interpreted runtime witness refines the RLNF microstep elaboration under identical observations, input scopes, and substrate bindings. Composing this translation refinement with the tabular realization proof completely discharges $\operatorname{Impl}$.

Here inputs denote dispatch. An asynchronous arrival buffer, if used, has separate enqueue and dispatch transitions; dispatch removes its head only when the leaf is ready and that input is enabled. Pending output drains never remove buffered inputs. Such a buffer is an owned component or substrate primitive requiring its own conformance evidence. The synchronous connector in §8 needs no mailbox. In either case, an empty output list in `AwaitFsync` enables only its declared completion inputs, not a new ordinary request.

### 4.5 Evidence discipline

An evidence record explicitly documents the obligation, target claim, verification method, execution outcome, underlying assumptions, architectural scope, and verified artifact. Different verification approaches—deductive proofs, exhaustive model checking, bounded analysis, systematic testing, and runtime monitoring—provide distinct formal assurances. Following the foundational principles of the Evidential Tool Bus (Rushby, 2005; Cruanes et al., 2013, 2014) and Assurance 2.0 (Bloomfield, Netkachova, and Rushby, 2024), verification results are maintained as structured, typed arguments, ensuring that tool evidence directly matches the strength and assumptions of its claimed obligation.

### 4.6 Three-gate structure

The evidence gate evaluates three orthogonal dimensions: **behavioral validity**, confirming mathematical trace inclusions and operational side conditions; **authority preservation**, verifying that protected intents and slot contracts conform to architectural authorizations; and **evidence applicability**, confirming that proof artifacts, environmental scopes, and candidate binaries match the target obligation precisely.

### 4.7 Consolidated trusted base

The following inventory collects the premises that connect the mathematical argument to an implementation. Items proved in a particular deployment cease to be assumptions there, but their boundary obligations do not disappear.

| Boundary | Required evidence or explicit premise | What is not inferred |
| --- | --- | --- |
| Intent and context interpretation | Accepted predicates, authority, scopes, feasible environment interpretation | That a formalized requirement matches every unstated user expectation |
| Mathematical proof / checker | Sound inference and applicable checker semantics or checked certificates | Universal validity from a bare process exit code |
| RLNF handlers | Totality, purity, explicit-state closure, enabled-input definition | Termination from syntax alone or state-freedom from an empty object |
| Source-to-RLNF translation | $\mathrm{Trans}_\ell$ for exact code, runtime, and observation | Correctness of arbitrary host-language code |
| Runtime and connector | $\operatorname{Adm}$, ownership, relative reception, guarded $\operatorname{Wire}$, scope erasure | Legal delivery from local trace inclusion alone |
| Physical substrate | Command/response meaning, failure model, and any durability hypothesis | Physical persistence from a symbolic `fsync_ok` label alone |
| Evolution and evidence storage | Operand identity or proved transport; coherent candidate publication and preserved audit records | Semantic equivalence from labels, paths, or hashes alone |

## 5. Decomposition, Modularity, and Interaction

### 5.1 Contracts are relational

**Proposition 1 (Coordinate Projections Erase Correlation).** A relation need not equal the product of its coordinate projections.

**Proof.** For $R=\{(0,0),(1,1)\}$, both projections are $\{0,1\}$. Their product also contains $(0,1)$ and $(1,0)$, which are not in $R$. $\square$

Accordingly, independent child predicates do not establish an interaction property such as matching transaction identifiers or coherent shared-state updates. The owning connector's joint trajectories retain that correlation. Decomposition verifies the property where the interaction is owned.

### 5.2 Sibling independence

**Theorem 2 (Sibling Independence).** Fix a parent's context, admission domain, contracts, abstractions, input scopes, and connector. If replacement witnesses are admissible and satisfy every fixed slot, the same guarded wiring and decomposition proofs establish their composite inclusion in $\operatorname{tr}(M_v)$. An unchanged sibling needs no new local refinement proof solely because another child was replaced.

**Proof.** Instantiate the existing universal wiring certificate with the replacement tuple. Slot conformance gives its guard. Monotonicity and the fixed decomposition yield the inclusion, exactly as in Theorem 1. $\square$

Theorem 2 establishes formal proof modularity: verifying a localized component replacement preserves parent safety whenever external slot contracts are respected, isolating downstream verification effort to modified components.

### 5.3 Executable closure

Every executable behavior contributing to a root system is explicitly owned by an RLNF leaf, a declared connector transition, or a declared substrate primitive. Architectural routing skeletons synchronize and map events, while persistent queues, transaction managers, and shared scheduling mechanisms are represented as explicit owned components or declared runtime/substrate state, with the applicable proof or hypothesis retained in the dependency closure.

### 5.4 Single-owner shared services via parent-connector serialization

A parent component may own a stateful service and mediate requests originating from multiple client branches. A serializing connector coordinates client access by granting service access to at most one outstanding operation at a time, recording client identities, and delivering responses back to the originating client. The shared state is owned explicitly by a coordinator or verified runtime primitive.

Sharing a stateful service inherently induces sequential interactions across client invocations. For example, if two clients invoke an increment operation on a shared counter initially set to 0, they will observe sequential outputs (such as 1 and 2), reflecting their composite execution order. The parent contract formalizes this combined behavior, establishing joint correctness across the client population.

Extensions supporting concurrent or interleaved operations incorporate verified synchronization wrappers, such as linearizable concurrent data structures (Herlihy and Wing, 1990; Filipović et al., 2010), which are integrated via explicit concurrent connector semantics.

### 5.5 Verified and substrate libraries

Verified third-party libraries integrate into the development DAG through declared interfaces, applicable refinement evidence, and clear runtime ownership bindings. Components that fall outside RLNF are modeled as declared substrate boundaries supported by an explicit hypothesis or a separately established translation or refinement result. In accordance with compositional design, specifications adopt the minimal contract strength necessary to establish parent requirements.

### 5.6 Admissible-input databases

General storage interfaces frequently support rich query protocols, whereas an application may rely upon a disciplined transaction sequence. By formalizing this usage pattern as an input scope $A$ and proving that the owning connector delivers only admissible sequences, component refinement is established on the relevant operating domain. Durability guarantees, transaction isolation levels, and failure models are formalized as explicit boundary premises, ensuring that transactional semantics remain verified relative to those premises.

## 6. The Development Protocol

### 6.1 Five development gates

The protocol uses five gates, distinct from the three evidence dimensions in §4.6.

| Gate | Required result |
| --- | --- |
| G1: Declare | Fix accepted intents, scopes, authority, and the contract-inclusive $\operatorname{Prot}(G)$. Separate open questions and hypotheses from commitments. |
| G2: Model | Establish typed machines, contexts, input protocols, ownership, and satisfaction obligations without deactivating failed intents. |
| G3: Decompose | Fix parent slots and connector semantics; prove decomposition and guarded wiring for the stated witness domain. |
| G4: Realize | Prove child refinements, RLNF realizations, translation premises where needed, and actual-witness admission. |
| G5: Integrate | Check the full dependency closure, all applicable evidence, protected dispositions, and the integrated candidate before publication. |

These five gates provide an organized verification workflow, systematically guiding development from initial specification to full integration while maintaining the formal mathematical obligations of Sections 3–4.

### 6.2 Authoring cycle

When introducing a modification, developers identify the target requirement and its owning architectural boundary. Target specifications and discriminating test cases are established prior to implementation. Developers then author the minimal model or handler modification required, independently verifying all relevant obligations against the candidate build. Complete verification records, counterexamples, and regression suites are retained across iterations to support rigorous evaluation.

### 6.3 Authority and repair

An implementation author may modify internal component behavior while preserving incoming slot contracts. A slot revision, an intent revision, and an environmental assumption change are distinct architectural actions requiring separate authorization. Editing a test to match an implementation does not establish the original requirement. When an implementation defect is identified, it is repaired directly within the existing component boundary; in contrast, a material conflict in accepted system requirements requires explicit escalation and architectural decision rather than an ad hoc local adjustment. Once a protected revision is authorized, all resulting validity obligations still apply.

## 7. Versioned Evolution and Incremental Frame Cutoff

### 7.1 Versioned developments

A version sequence $(G_t)_t$ retains prior records and evidence. A candidate $G_{t+1}$ is distinct from a verified published version. Let $\operatorname{Req}(G)$ be its set of typed scoped obligations. Publication additionally checks the protected inventory and all structural, admission, context, and integration premises; merely discharging the changed formulas is insufficient.

An authorized disposition records the original protected subject, its accepted updated specification or retirement, the governing authority, and the applicable scope. Across each published version, logical cells resolve to coherent definitions, with distinct stateful runtime instances maintaining unique runtime identities.

### 7.2 Contextual projection and staleness

When an accepted intent motivates a stronger child contract or an alternative decomposition, the proposed structure is validated by re-establishing parent decomposition and context entailments. Modifications propagate along semantic dependency paths: downstream obligations remain pending until prior evidence is demonstrated to be applicable or fresh proofs are supplied. Conversely, when the typed operands of an obligation remain strictly identical across revisions, existing verification evidence carries forward directly.

### 7.3 Exact obligation operands and the frame theorem

Let $\sigma_q$ contain the typed interfaces, visible/internal interpretation, profile, accepted context with transitive hypothesis meanings, and claim scope used by obligation $q$. With ordered slot identities $\mathcal S_v$, the five operand records are:

| Family | Exact typed operands |
| --- | --- |
| $\operatorname{Sat}(v,j)$ | $(X_v,M_v,\llbracket j\rrbracket,\sigma_q)$ |
| $\operatorname{Wire}(v)$ | $(\mathcal S_v,(X_c,X_{v,c})_c,X_v,(\operatorname{Adm}_c)_c,C_v,W_v,K_v,(B_{v,c},\lambda_{v,c},A_{v,c})_c,\operatorname{Delivery}_v,\mathcal R_v,\sigma_q)$ |
| $\operatorname{Dec}(v)$ | $(\mathcal S_v,K_v,(L_{v,c})_c,M_v,\sigma_q)$ |
| $\operatorname{Ref}(v,c)$ | $(X_c,X_{v,c},M_c,B_{v,c},\lambda_{v,c},A_{v,c},\sigma_q)$ |
| $\operatorname{Impl}(\ell)$ | $(X_\ell,P_\ell,D_\ell,\operatorname{elab},A_\ell,M_\ell,\mathcal R_\ell,\mathrm{Trans}_\ell,\sigma_q)$ |

The configuration $\mathcal R$ formalizes runtime instance allocation, substrate shell and buffer models, and scoped witness constructors. In direct formalizations where the executable implementation is the mathematical model $D_\ell$, $P_\ell=D_\ell$ and $\mathrm{Trans}_\ell$ is witnessed by identity. The $\operatorname{Impl}$ obligation encompasses the complete realization chain (§4.4), ensuring that component code, admission conditions, and environmental premises are unified.

Guarded $\operatorname{Wire}$ depends on $B$ when its delivery proof uses slot conformance. Changing a public slot can therefore change $\operatorname{Wire}$ as well as $\operatorname{Dec}$ and $\operatorname{Ref}$. Replacing a child witness does not change the universal quantifier's domain merely because that witness has different internal states; changing the admission domain does.

In automated development environments, exact operand identity can be conservatively recognized through normalized typed records and cryptographic hashes of ASTs and contexts, providing sound and efficient proof reuse without requiring general semantic-equivalence deciders.

**Theorem 3 (Incremental Frame).** Suppose old obligations have valid applicable evidence. Suppose every operand-identical obligation in $\operatorname{Req}(G_t)\cap\operatorname{Req}(G_{t+1})$ retains applicable evidence, and every obligation in $\operatorname{Req}(G_{t+1})\setminus\operatorname{Req}(G_t)$ is discharged. If the new structural, context, admission, scope, and protected-preservation conditions hold, $G_{t+1}$ satisfies Theorem 1 under its new full dependency context.

**Proof.** Partition $\operatorname{Req}(G_{t+1})$ into the intersection and difference. Applicable carryover proves each member of the first part; the new evidence proves each member of the second. The remaining stated premises supply Conditions 1–6 and the version-preservation gate. Apply Theorem 1. $\square$

### 7.4 Corollary 2: Interface cutoff

**Corollary 2 (Interface Cutoff).** Replace a region while fixing all external boundary operands: slot contracts, maps, input scopes, parent model and intents, connector and admission domain, runtime interpretation, and contexts. Once the replacement's local and incoming refinement obligations are established, the parent $\operatorname{Wire}$ and $\operatorname{Dec}$ proofs are reusable, as are other operand-identical obligations with applicable evidence.

**Proof.** Universal wiring does not contain a particular child's implementation as an operand. The fixed parent decomposition contains slot languages rather than child models. Their typed propositions are unchanged; apply Theorem 3. $\square$

A leaf-code change with fixed $M_\ell$ changes realization but not incoming model refinement. A child-model change can change incoming refinement without changing the fixed parent slot. A split or merge changes the direct parent's slot signature and wiring, so cutoff occurs above the first preserved boundary, not at the modified connector itself. Changing a slot guard, input scope, substrate meaning, or runtime interpretation is not an unchanged-boundary case.

This result provides an obligation-level instance of early cutoff: re-verification of unaffected subgraphs terminates as soon as external interface operands are confirmed unchanged, adapting the dependency-tracking principles of modern build systems (Mokhov, Mitchell, and Peyton Jones, 2018) to formal verification obligations.

### 7.5 Typed evolution and four-way failure diagnosis

Define the tagged outcome type

$$
\begin{aligned}
\mathrm{EvolutionResult}={}&
\mathrm{Verified}(\mathrm{Development},\mathrm{Evidence},\mathrm{AuthorizedDispositions})\\
&\mid\mathrm{Conflict}(\mathrm{Development},\mathrm{ConflictWitness})\\
&\mid\mathrm{Unresolved}(\mathrm{Development},\mathcal P_{\mathrm{fin}}(\mathrm{Obligation})).
\end{aligned}
$$

An evolution procedure has the partial-function type

$$
\operatorname{evolve}:\mathrm{Development}\times\mathrm{AuthorizedDelta}
\rightharpoonup\mathrm{EvolutionResult}.
$$

The payload types represent the possible outcomes of development evolution: `Verified` denotes a candidate that satisfies all publication and verification gates; `Conflict` documents a demonstrated incompatibility among accepted requirements or environmental premises; and `Unresolved` captures open proof obligations and pending implementation adjustments requiring further automated or human intervention.

After applying an authorized delta, recompute active intents, exact obligations, dependency closure, and protected dispositions. Check premise compatibility and evidence applicability. A failed attempt is classified into four evidentially distinct cases:

1. **Concrete violation:** a legal joint executable run violates the accepted predicate. Repair the implementation or owning integration boundary.
2. **Abstract counterexample:** a model or contract trajectory violates its target, but runtime feasibility is not established. Refine the offending abstraction or produce a concrete witness before calling it a runtime bug.
3. **Failed proof witness:** a proposed invariant or simulation does not close. Repair the proof witness or investigate further; this does not itself refute inclusion.
4. **Unknown:** timeout, unsupported reasoning, or missing evidence. Preserve the open obligation without classifying it as true, false, genuine, or spurious.

This taxonomy synthesizes counterexample-guided abstraction refinement (Clarke et al., 2003) with the eliminative argumentation of Assurance 2.0 (Bloomfield, Netkachova, and Rushby, 2024), clearly distinguishing concrete runtime bugs, spurious abstraction artifacts, and solver incompleteness.

### 7.6 Joint trajectory feasibility and repair direction

For an abstract parent counterexample $\tau$, model-level feasibility is

$$
\exists r.\ \operatorname{legal}_{W_v}(r)\land\operatorname{obs}_v(r)=\tau
\land\forall c,\ \operatorname{slice}_c(r)\in T_{v,c}(\operatorname{tr}(M_c)).
$$

**Proposition 2 (Joint Trajectory Feasibility).** The displayed condition is equivalent to $\tau\in K_v((T_{v,c}(\operatorname{tr}(M_c)))_c)$. Separate per-child existential witnesses do not imply it.

**Proof.** The equivalence is the definition of $K_v$. For the second claim, let one shared trajectory bit $b$ be fixed. One child requires $b=0$ and another requires $b=1$. Each has a separate witness; no single trajectory has both values. $\square$

Establishing the runtime feasibility of an abstract trajectory requires exhibiting a concrete joint execution witness or proving a two-way simulation completeness theorem between model and implementation.

Identifying the appropriate repair direction depends on whether the defect resides in component implementation or architectural abstraction. For example, if a child component correctly produces $\{\epsilon,ok\}$ while its abstraction over-approximates behaviors with $\{\epsilon,ok,bad\}$, the appropriate repair refines the child abstraction rather than altering the parent slot. Conversely, if a decomposition fails because parent slots permit invalid interleavings, strengthening the slot contracts resolves the issue, provided child components can fulfill the tighter requirements and the contract change is formally authorized. Publish only after all gates pass; otherwise retain the candidate, evidence, and open obligations.

## 8. End-to-End Worked Example: Durable Acknowledgement

### 8.1 Requirement and scope

One runtime instance handles at most one request carrying identifier $i\in\mathrm{Id}$. The visible root requirement is: `ack(i)` is preceded by the matching `commit_ok(i)`; a failure branch emits `commit_fail(i)` and `fail(i)` instead. A named substrate hypothesis $H_{\mathrm{dur}}$ states that a matching successful flush response after the modeled write establishes durability under the declared storage/crash model. It is a forward implication, not an assertion that every durable write must return success.

The environment supplies at most one request. In this modeled scope, file writing produces a successful `write_ok` response, while flush may succeed, fail, or remain pending. The root's durability guarantee establishes safety conditional upon hypothesis $H_{\mathrm{dur}}$, the substrate shell semantics, and the runtime translation premises.

### 8.2 Root and slot control graphs

Every arrow below is one event. All displayed states accept finite prefixes; omitted transitions are absent. The initial states of the root, coordinator slot, and store slot are $r_0$, $c_0$, and $b_0$, respectively. For each $i$, the root machine $M_0$ is

```text
r0 --req(i)--> r1(i)
r1(i) --commit_ok(i)--> r2(i) --ack(i)--> rDone
r1(i) --commit_fail(i)--> r3(i) --fail(i)--> rDone
```

`req` is an input; the other root labels are outputs. Its language is

$$
L_0=\bigcup_i\operatorname{pref}\{\mathrm{req}(i)\,\mathrm{commit\_ok}(i)\,\mathrm{ack}(i),
\mathrm{req}(i)\,\mathrm{commit\_fail}(i)\,\mathrm{fail}(i)\}.
$$

Assume $\mathrm{Id}\ne\emptyset$; equivalently add $\{\epsilon\}$ explicitly when allowing an empty identifier type. The coordinator slot $B_{0,\mathrm{coord}}$ is

```text
c0 --req(i)--> c1(i) --append(i)--> c2(i)
c2(i) --committed(i)--> c3(i) --ack(i)--> cDone
c2(i) --failed(i)--> c4(i) --fail(i)--> cDone
```

Its inputs are `req`, `committed`, and `failed`; its outputs are `append`, `ack`, and `fail`. Its language is the union of prefixes of the two displayed complete branches.

The store slot deliberately exposes its command protocol to the owning connector, which contains the substrate shell. This makes shell delivery part of the same guarded proof rather than an undeclared property of hidden commands. $B_{0,\mathrm{store}}$ is

```text
b0 --append(i)--> b1(i) --Cmd.write(i)--> b2(i)
b2(i) --write_ok(i)--> b3(i) --Cmd.fsync(i)--> b4(i)
b4(i) --fsync_ok(i)--> b5(i) --flush_ok(i)--> b6(i)
b6(i) --committed(i)--> bDone
b4(i) --fsync_fail(i)--> b7(i) --flush_fail(i)--> b8(i)
b8(i) --failed(i)--> bDone
```

Its inputs are `append`, `write_ok`, `fsync_ok`, and `fsync_fail`; its remaining events are outputs. Write $p_i=\mathrm{append}(i)\,\mathrm{Cmd.write}(i)\,\mathrm{write\_ok}(i)\,\mathrm{Cmd.fsync}(i)$. Then

$$
L_{0,\mathrm{store}}=\bigcup_i\operatorname{pref}\{
p_i\,\mathrm{fsync\_ok}(i)\,\mathrm{flush\_ok}(i)\,\mathrm{committed}(i),
p_i\,\mathrm{fsync\_fail}(i)\,\mathrm{flush\_fail}(i)\,\mathrm{failed}(i)\}.
$$

Erasing command and response events yields the public protocol `append, flush_ok, committed` or `append, flush_fail, failed`, including every prefix. The local machines are $M_{\mathrm{coord}}=B_{0,\mathrm{coord}}$ and $M_{\mathrm{store}}=B_{0,\mathrm{store}}$. Both edge maps $\lambda_{0,c}$ are identity maps on these declared slot alphabets; hiding occurs in the root connector observation, not in an inconsistent second edge map. Each graph's language is exactly its displayed prefix language, by enumeration of its initial path and two outgoing outcome branches. These are finite-control symbolic monitors, and are finite-state when $\mathrm{Id}$ is finite.

### 8.3 Input scopes and concrete connector

The input-only scopes are

$$
A_{0,\mathrm{coord}}=\{\epsilon\}\cup\bigcup_i
\{[\mathrm{req}(i)],\ [\mathrm{req}(i),\mathrm{committed}(i)],\ [\mathrm{req}(i),\mathrm{failed}(i)]\},
$$

$$
A_{0,\mathrm{store}}=\{\epsilon\}\cup\bigcup_i\operatorname{pref}\{
[\mathrm{append}(i),\mathrm{write\_ok}(i),\mathrm{fsync\_ok}(i)],
[\mathrm{append}(i),\mathrm{write\_ok}(i),\mathrm{fsync\_fail}(i)]\}.
$$

Use these same scopes for the leaf realization obligations. They exclude wrong identifiers, duplicates, contradictory outcomes, and spontaneous response inputs. They do not express that a response follows a command output or that `committed` follows coordinator `append`; those causal facts require the connector and slot guarantees.

$C_0$ is a synchronous product of the two child witnesses and the shell of §8.5, with the following rules. A coordinator `append(i)` output synchronizes with the store's `append(i)` input. Store `committed(i)` and `failed(i)` outputs synchronize with the matching coordinator inputs. Each store command synchronizes with the shell's command input; each shell response synchronizes with the store's corresponding input. Unshared child events interleave. Child internal events interleave and are hidden. The environment supplies only the permitted root request. Shared events occur only when both participants have the transition; no event is fabricated or duplicated.

There is no arrival queue in this connector. Reception is checked at the paired states before each synchronous delivery. A deployment adding buffering must establish its distinct arrival/dispatch refinement (§4.4).

$W_0$ is the same finite-trajectory synchronization scheme over slot words and shell paths. Its root observation keeps coordinator `req`, `ack`, and `fail`, maps store `flush_ok` to `commit_ok` and `flush_fail` to `commit_fail`, and erases every other event. This is again a letter-or-erasure projection. Each root trajectory retains both component slices, including hidden commands, responses, and routed events, so it does not discard their causal correlation.

### 8.4 RLNF handler tables

Both leaves start in `Idle` with an empty pending-output list. The coordinator's private states are `Idle`, `Await(i)`, and `Done`. Its enabled inputs and complete handler table are:

| State | Enabled input | Next state | Output list |
| --- | --- | --- | --- |
| `Idle` | `req(i)` | `Await(i)` | `[append(i)]` |
| `Await(i)` | `committed(i)` | `Done` | `[ack(i)]` |
| `Await(i)` | `failed(i)` | `Done` | `[fail(i)]` |
| `Done` | none | — | — |

The store's private states are `Idle`, `AwaitWrite(i)`, `AwaitFsync(i)`, and `Done`:

| State | Enabled input | Next state | Output list |
| --- | --- | --- | --- |
| `Idle` | `append(i)` | `AwaitWrite(i)` | `[Cmd.write(i)]` |
| `AwaitWrite(i)` | `write_ok(i)` | `AwaitFsync(i)` | `[Cmd.fsync(i)]` |
| `AwaitFsync(i)` | `fsync_ok(i)` | `Done` | `[flush_ok(i), committed(i)]` |
| `AwaitFsync(i)` | `fsync_fail(i)` | `Done` | `[flush_fail(i), failed(i)]` |
| `Done` | none | — | — |

The rows define $\mathrm{en}$ exactly; no other state/input pair is enabled. Each row is a finite constructor computation and hence pure and terminating in the mathematical model. The elaboration, rather than an atomic multi-output transition, emits the output list one event at a time. In particular, after `flush_ok` but before `committed`, the pending list is `[committed(i)]` although the private state is already `Done`.

### 8.5 Substrate shell and pending-output simulations

The shell $\mathrm{Sh}_{\mathrm{store}}$ has initial state $h_0$ and transitions

```text
h0 --Cmd.write(i)?--> hW(i) --write_ok(i)!--> hF(i)
hF(i) --Cmd.fsync(i)?--> hPending(i)
hPending(i) --fsync_ok(i)!--> hDone
hPending(i) --fsync_fail(i)!--> hDone
```

Question and exclamation marks indicate shell input and output roles, not extra labels. A response can occur only after its corresponding command, once, with the same identifier. A finite execution can stop at any state. The shell's physical interpretation is a hypothesis; $H_{\mathrm{dur}}$ applies to the successful flush transition after this write sequence. The safety argument does not assume that the shell eventually takes an enabled response.

The initialized coordinator simulation relates the following reachable elaboration configurations to monitor states:

| Configuration | Monitor state |
| --- | --- |
| `(Idle, [])` | $c_0$ |
| `(Await(i), [append(i)])` | $c_1(i)$ |
| `(Await(i), [])` | $c_2(i)$ |
| `(Done, [ack(i)])` | $c_3(i)$ |
| `(Done, [fail(i)])` | $c_4(i)$ |
| `(Done, [])` | $c_{\mathrm{Done}}$ |

For the store:

| Configuration | Monitor state |
| --- | --- |
| `(Idle, [])` | $b_0$ |
| `(AwaitWrite(i), [Cmd.write(i)])` | $b_1(i)$ |
| `(AwaitWrite(i), [])` | $b_2(i)$ |
| `(AwaitFsync(i), [Cmd.fsync(i)])` | $b_3(i)$ |
| `(AwaitFsync(i), [])` | $b_4(i)$ |
| `(Done, [flush_ok(i), committed(i)])` | $b_5(i)$ |
| `(Done, [committed(i)])` | $b_6(i)$ |
| `(Done, [flush_fail(i), failed(i)])` | $b_7(i)$ |
| `(Done, [failed(i)])` | $b_8(i)$ |
| `(Done, [])` | $b_{\mathrm{Done}}$ |

Each input row matches its monitor input transition; each output-drain rule matches exactly one output arrow. The tables enumerate all reachable configurations. Hence they prove both leaf realization inclusions, including every intermediate prefix and both outcomes. The reverse graph-to-table step correspondence also gives equality of these mathematical leaf languages. Relative reception holds at $c_0,c_2,b_0,b_2,b_4$ for exactly their permitted inputs. Pending-output states correspond to output-only monitor states, so no permitted input is waived. Initial states are nonempty, and the two leaves have disjoint private state owned by root $0$.

### 8.6 Causal delivery, wiring, decomposition, and root soundness

We prove guarded $\operatorname{Wire}(0)$ for arbitrary admissible witnesses refining the two fixed slots, not just the tables. The shell and synchronization rules are fixed operands. Consider a supposed first delivery outside a declared input scope. Before it, every child input history is in scope, so its executed prefix and any output extending that prefix are governed by its slot inclusion: outputs cannot be hidden by the input restriction.

The external request is single-use and matching by the root environment premise. A coordinator `append(i)` can occur only after that `req(i)`, once. The store can issue `Cmd.write(i)` only after receiving `append(i)`; the shell can return `write_ok(i)` only after receiving that command. A store `Cmd.fsync(i)` can occur only after the matching write response, and the shell can supply at most one matching flush outcome. Finally, a store `committed(i)` or `failed(i)` can occur only after its matching flush event, itself after `append(i)`. Thus coordinator response delivery is after its append output has drained and is single-use, matching, and non-spontaneous.

To make the first-invalid-input argument fully explicit, suppose for contradiction that some composite step delivers a first input prefix violating either $A_{0,\mathrm{coord}}$ or $A_{0,\mathrm{store}}$:
1. *First invalid input delivered to the coordinator:* The only permitted inputs in $A_{0,\mathrm{coord}}$ are an initial single $\mathrm{req}(i)$, followed by at most one matching $\mathrm{committed}(i)$ or $\mathrm{failed}(i)$. A violation would require: (a) a spurious or duplicate $\mathrm{req}(j)$, which is barred by the root environment premise; (b) a spontaneous $\mathrm{committed}(i)$ or $\mathrm{failed}(i)$ prior to emitting $\mathrm{append}(i)$, which contradicts the store slot $B_{0,\mathrm{store}}$ (which requires $\mathrm{append}(i)$ before any response); or (c) an outcome with mismatched identifier $j \ne i$ or a contradictory second outcome, both barred by the single-identifier execution of $B_{0,\mathrm{store}}$ and shell synchronization.
2. *First invalid input delivered to the store:* Under the fixed shell $\mathrm{Sh}_{\mathrm{store}}$ and command synchronization, admissible delivered input histories to the store consist of an initial $\mathrm{append}(i)$, followed by $\mathrm{write\_ok}(i)$ strictly after $\mathrm{Cmd.write}(i)$, and finally $\mathrm{fsync\_ok}(i)$ or $\mathrm{fsync\_fail}(i)$ strictly after $\mathrm{Cmd.fsync}(i)$. A violation would require: (a) a spurious or duplicate $\mathrm{append}(j)$, which contradicts coordinator slot conformance (the coordinator emits $\mathrm{append}(i)$ at most once, strictly in response to $\mathrm{req}(i)$); or (b) an unsolicited, out-of-order, or duplicate shell response, which contradicts the transition structure of $\mathrm{Sh}_{\mathrm{store}}$ (which transitions to response states only upon receiving the corresponding command from the store).

Every branch of this finite case split contradicts the causal prefixes of the component slots and shell. All delivered histories therefore lie in the stated $A$ sets, including the intrinsic leaf scopes.

This argument also checks readiness: the routed `append` reaches the store's initial input state; each shell response reaches the corresponding store input state; and the store result reaches coordinator $c_2(i)$, not its pending-append state. Relative reception of the admitted witnesses supplies the matching input transition. Hidden internal source steps cannot change the deterministic monitor state. Thus the proof does not rely on suppressing an invalid delivery by composing already restricted machines. If a raw witness had a first bad delivery, the same prefix argument would exclude it.

For routing adequacy, induct on concrete composite steps. An unshared transition extends one component slice; a synchronization extends both participating slices with the shared event; a shell step also extends the shell path. The retained joint record is legal for $W_0$ and has exactly the root observation defined in §8.3. Combining this slicing invariant with the proved input scopes gives $\operatorname{Delivery}_0$ and the restricted inclusion required by $\operatorname{Wire}(0)$.

For $\operatorname{Dec}(0)$, take any legal trajectory whose slices belong to the slot languages. If no root request has occurred, its root observation is empty. After `req(i)`, the coordinator emits `append(i)` at most once. The store's selected branch can contribute either `commit_ok(i)` followed eventually, if the trajectory continues, by coordinator `ack(i)`, or `commit_fail(i)` followed by `fail(i)`. The coordinator cannot acknowledge before receiving the store result, which follows the matching flush event. No other root events are possible. Hence every root observation is in $L_0$, including truncations at all hidden or visible intermediate events.

The two edge refinements are immediate because restriction selects a sublanguage ($\operatorname{tr}(M_c)\!\upharpoonright_{A_{0,c}} \subseteq \operatorname{tr}(M_c)$), the edge maps $\lambda_{0,c}$ are identities, and the local component machines are defined by $M_c=B_{0,c}$. The simulations establish realization; the delivery proof justifies the shared input scopes; the product has a nonempty initial state and accepts the permitted initial request. Root satisfaction is $\operatorname{tr}(M_0)=L_0\subseteq\Phi_0$, where $\Phi_0$ is a necessary safety predicate requiring that every `ack(i)` be preceded by `commit_ok(i)` and every `fail(i)` by `commit_fail(i)` (with request precedence and branch mutual exclusivity ensured by $L_0$). Theorem 1 therefore yields the complete root trace inclusion. Under hypothesis $H_{\mathrm{dur}}$, emitting `ack(i)` establishes that the successful write has been durably flushed to persistent storage, with the overall root guarantee formally supported by the combined environment, shell, and runtime premises in $H_0$.

A spontaneous-output store serves as an informative negative witness: even if receptive and properly initialized, emitting an initial `committed(i)` violates its slot contract and is decisively rejected by the universal wiring guard.

### 8.7 Premature-commit regression

Consider a faulty store handler `Idle + append(i) -> Done, [committed(i)]`, with the other initial inputs unchanged. Its trace `append(i), committed(i)` is rejected by the fixed store graph: after `append(i)` the next required visible output is `Cmd.write(i)`, and the projected public protocol also requires `flush_ok(i)` before `committed(i)`. The input history `[append(i)]` is admissible, so input restriction does not remove the counterexample.

Composed with the coordinator, this witness produces the root trace `req(i), ack(i)`. It is not in $L_0$, because `ack(i)` lacks its preceding `commit_ok(i)`. The expected rejection is stated by the unchanged graphs, not copied from the faulty implementation. This run does not contradict Theorem 1: the faulty store fails realization/refinement, so the universal wiring guard cannot be instantiated for it.

### 8.8 Inspection and proof reuse

The frontier $\{\mathrm{coord},\mathrm{store}\}$ is root-covering and displays both slot protocols; Corollary 1 transfers its upper proof to the leaves. Inspecting only the coordinator omits the store path and cannot justify root safety.

Suppose the store's internal representation is modified while its component model, shell protocol, input scope, and slot contract remain unchanged. Once the new handler realization and admission obligations are verified, Corollary 2 allows immediate reuse of existing proofs for $\operatorname{Wire}(0)$, $\operatorname{Dec}(0)$, coordinator compliance, and root satisfaction. If an update instead alters the substrate crash model, command protocol, or delivery buffering, the affected operands are updated and re-verified accordingly.

## 9. Related Work

**Transition-system refinement and interfaces.** Lynch and Tuttle (1989) separate input, output, and internal actions and make execution composition explicit. De Alfaro and Henzinger (2001) distinguish environmental inputs from component outputs in interface compatibility. Our framework adopts these distinctions within a finite-trace safety setting, pairing trace containment with explicit relative reception and causal delivery obligations to ensure receptive composition. Abadi and Lamport (1991, 1995) study refinement mappings and composition of specifications; Lamport (1994) makes stuttering and temporal interpretation explicit. Here the observation map is restricted enough to prove the needed finite-prefix law directly, without importing a liveness theorem.

**Refinement calculi and reactive modeling.** UTP designs distinguish feasibility and termination-sensitive meanings from arbitrary relations (Woodcock and Cavalcanti, 2004). Circus separates data and process refinement (Cavalcanti, Sampaio, and Woodcock, 2003), while Event-B organizes initialization, invariants, and refinement obligations (Abrial, 2010). RLNF identifies a structured, pure, terminating handler fragment suitable for automated synthesis and verification. The extensive systems verified by IronFleet (Hawblitzel et al., 2015) highlight the importance of connecting high-level state-machine models to executable distributed code; our calculus formalizes this connection via explicit translation premises and typed runtime obligations.

**Shared services.** Linearizability provides concurrent operations with a legal sequential interpretation respecting real-time order (Herlihy and Wing, 1990; Filipović et al., 2010). The core calculus captures shared services through single-owner state and explicit parent-mediated serialization, establishing aggregate correctness across concurrent clients.

**Evidence and agent-oriented assurance.** Rushby's Evidential Tool Bus (2005) and the implementations and analyses of Cruanes et al. (2013, 2014) address heterogeneous verification evidence and its logical dependencies. Assurance 2.0's treatment of defeaters distinguishes challenges to claims, arguments, and evidence (Bloomfield, Netkachova, and Rushby, 2024). CLARISSA develops foundations and automation for assurance cases (Varadarajan et al., 2023); PLACIDUS formalizes assurance-case development for software product lines (Murphy et al., iFM 2024); AssureCode connects developer intent, specifications, and analysis evidence in agentic coding (Murphy et al., 2026). Our contribution integrates these assurance principles with an operational refinement calculus: while structured assurance frameworks organize arguments and defeaters (Bloomfield, Netkachova, and Rushby, 2024; Murphy et al., 2024, 2026), our development DAG provides the formal trace semantics, obligation taxonomy, and typed gates required to verify agent-authored systems.

**Provenance, incrementality, and counterexamples.** Our provenance and cutoff mechanisms draw upon foundational work in database provenance (Green et al., 2007) and modern build systems (Mokhov et al., 2018), while our diagnostic taxonomy builds upon counterexample-guided abstraction refinement (Clarke et al., 2003) to clearly separate abstract model defects from concrete runtime violations.

## 10. Limitations and Open Problems

The calculus proves finite visible-trace safety for its admitted operational fragment. A request followed by permanent silence can satisfy its safety language. Adding an internal self-loop at a terminal state leaves the finite visible trace language unchanged. Infinite internal activity, delayed substrate responses, and scheduler starvation are not excluded by terminating handlers. For example, an execution with intermittently enabled but never taken work can satisfy weak fairness while violating strong fairness: weak fairness concerns eventual continuous enabling, whereas strong fairness concerns repeated enabling. Neither fairness property is proved by erasing pending duties from a trace.

RLNF excludes hidden effects and unproved within-handler divergence. State-indexed reception restricts deployment inputs; it is not global input-enabledness. Sharing restrictions exclude unmediated mutable aliases and do not provide a general concurrent-history substitution theorem. Adding those behaviors requires new boundary semantics and proofs rather than a broader interpretation of an existing inclusion.

Symbolic state and data may be infinite. Deterministic-monitor simulation completeness is an existence theorem, not an algorithm for finding invariants. Context consistency, physical substrate warrant, source translation, and publication correctness can remain trusted premises. Contract precision limits what a parent can establish: a Top slot cannot carry a nontrivial durability promise by itself.

The worked example is a single-request model, not a production storage implementation or crash-recovery protocol. The paper makes no empirical claim that the workflow reduces agent error rates, review cost, or proof effort. Those questions require implementations, representative tasks, and measured comparisons with explicitly scoped acceptance criteria.

## 11. Conclusion

A refinement DAG separates what a boundary promises, how its children establish that promise, and why the available evidence applies. In the finite-safety fragment studied here, RLNF supplies executable leaf semantics, homomorphic observations connect traces across interfaces, deterministic monitors support complete simulation reasoning, and single-owner state locates interaction obligations. Guarded wiring closes the composition seam. Protected contracts and exact-operand evidence reuse then permit internal change without silently changing accepted meaning. The resulting guarantee is conditional, compositional, and explicit about its operational and trusted boundaries.

## Appendix A. Proof Details

### A.1 Theorem 1: full conditional DAG induction

Fix a root $r$ and a world $\omega$ with $H_r(\omega)$. By definition of transitive dependency closure and the declared scope-entailment premises, every local obligation and admission judgment used below holds at this same $\omega$. Let $d(v)$ be the maximum length of a path from $v$ to a leaf; finiteness and acyclicity give $d(c)<d(v)$ on every child edge. Abbreviate $Q_v=\operatorname{tr}(N_v(\omega))$ and $L_v=\operatorname{tr}(M_v(\omega))$.

First, $Q\subseteq Q'$ implies $Q\!\upharpoonright_A\subseteq Q'\!\upharpoonright_A$, since membership retains the same input predicate. Direct image under $\lambda^*$ preserves inclusion, giving $T_{v,c}(Q)\subseteq T_{v,c}(Q')$. This uses neither operational composition of sets nor output filtering.

Proceed by induction on $d(v)$. If $d(v)=0$, the scoped executable witness is the leaf runtime interpretation. $\mathrm{Trans}_\ell$, when needed, gives its inclusion in $\operatorname{tr}(\operatorname{elab}(D_\ell))\!\upharpoonright_{A_\ell}$, and leaf realization gives inclusion in $L_\ell$. This is $\operatorname{Impl}(\ell)$. Initial states and reception are supplied by admission, not inferred from inclusion.

For an internal $v$, assume $Q_c\subseteq L_c$ for every child. Then for each edge,

$$T_{v,c}(Q_c)\subseteq T_{v,c}(L_c)\subseteq L_{v,c}.$$

The actual $N_c$ is admitted by Condition 6, so the tuple of these actual witnesses satisfies the entire guard of Condition 5. Its conclusion gives both delivery and

$$Q_v\subseteq K_v((T_{v,c}(Q_c))_c).$$

Lemma 1 and the previous bounds yield

$$
Q_v\subseteq K_v((T_{v,c}(Q_c))_c)
\subseteq K_v((T_{v,c}(L_c))_c)
\subseteq K_v((L_{v,c})_c)\subseteq L_v,
$$

where the last inclusion is decomposition. Condition 3 then gives $L_v\subseteq\llbracket j\rrbracket$ for every $j\in A(v)$, so $Q_v\subseteq\Phi(v)$. When $A(v)$ is empty, $\Phi(v)$ defaults to the entire typed trace universe. In particular, $Q_r\subseteq\Phi(r)$. Since $\omega$ was arbitrary under $H_r$, the theorem holds universally across all models of the root context. Single-owner encapsulation and typed runtime interpretations ensure that the execution witnesses correspond directly to the declared physical system instances. $\square$

### A.2 Corollary 1: full frontier induction

Let $F$ be a root-covering antichain. Every root has a descendant in $F$. For $v\in\operatorname{Anc}(F)\setminus F$ and child $c$, choose a root-to-$v$ path and extend the $v\to c$ path to a leaf. No node of $F$ can be strictly above $v$ on this path, because $v$ has a descendant in $F$ and that would violate the antichain property. Coverage therefore supplies a cut node at or below $c$. Thus $c\in\operatorname{Anc}(F)$, and the recursive definition of $U_F$ is closed on the upper region.

Fix a world satisfying the full contexts of frontier realization and all upper obligations. Induct in increasing child rank, stopping at $F$. At $f\in F$, $Q_f\subseteq U_F(f)=L_f$ is the frontier premise. At an upper internal node, assume $Q_c\subseteq U_F(c)\subseteq L_c$ for every child. The right half, monotonicity, edge refinement, and decomposition give

$$
U_F(v)=K_v((T_{v,c}(U_F(c)))_c)
\subseteq K_v((T_{v,c}(L_c))_c)
\subseteq K_v((L_{v,c})_c)\subseteq L_v.
$$

The same bounds imply the slot guards for the actual witnesses. Their separately assumed admission permits wiring instantiation, yielding

$$
Q_v\subseteq K_v((T_{v,c}(Q_c))_c)
\subseteq K_v((T_{v,c}(U_F(c)))_c)=U_F(v).
$$

Root satisfaction supplies the final inclusion in $\Phi(r)$. The induction accommodates arbitrary cut configurations and shared state-free components by following well-founded partial ordering over the DAG, with actual-witness admission independently verified at the frontier boundary. $\square$

### A.3 Packet Decomposition

Consider a finite path from $(s_0,[])$ in $\operatorname{elab}(D)$. Every input step starts with an empty pending list. It selects exactly one enabled handler result $(s',w)$, after which only the successive heads of $w$ can be emitted until the list empties. Induction on the number of input steps partitions the path into complete packets and, possibly, one last input with an initial segment of its output word. Because that remaining word is finite, drain it without any further input. The resulting trace is a member of $\operatorname{Packets}(D)$ extending the original trace. A path with no input is the zero-step path and has trace $\epsilon$. Thus the left side is contained in the right.

Conversely, take a packet word from an enabled finite handler chain. Starting at $(s_0,[])$, apply each chain input rule and then drain its listed outputs. The handler's next state is exactly the next chain state, so this constructs an execution of the whole word. For any prefix of the word, stop this execution after the corresponding event. Empty outputs require no drain transitions; the empty prefix requires no transitions. Thus every prefix is an elaborated trace. $\square$

The lemma accounts for intermediate prefixes occurring between successive output emissions, precisely reflecting microstep evaluation while preserving the invariant that input dispatch occurs only when pending output buffers are exhausted.

### A.4 Prefix Commutation

For $u\preceq t$, choose $z$ with $t=uz$. Homomorphic extension gives $\lambda^*(t)=\lambda^*(u)\lambda^*(z)$, so $\lambda^*(u)\preceq\lambda^*(t)$. This proves $\lambda^*(\operatorname{pref}L)\subseteq\operatorname{pref}(\lambda^*L)$.

For the converse take $p\preceq\lambda^*(t)$ with $t=a_1\cdots a_n\in L$. If $p=\epsilon$, use the source prefix $\epsilon$. Otherwise let $k=|p|$. Each source letter contributes zero or one target letter. Scanning $a_1,\ldots,a_n$, the count of contributed letters begins at zero, ends at least at $k$, and increases by at most one. Hence some first index $j$ reaches exactly $k$. The image of $a_1\cdots a_j$ is the first $k$ letters of $\lambda^*(t)$, namely $p$. That source prefix belongs to $\operatorname{pref}L$. If $L$ is empty, neither side has a witness. This proves equality in every case. A multi-letter image can jump over $k$, which is exactly the obstruction in $a\mapsto xy$. $\square$

### A.5 Deterministic Contract Simulation Equivalence

Let $B$ have one initial state $q_0$, no hidden transitions, partial deterministic $\beta$, and every reachable state accepting. For a word $w$ admitted by $B$, let $\widehat\beta(q_0,w)$ denote its unique reached state. Extend $\lambda$ by erasing source internal labels.

Suppose initialized simulation $R$ exists. For a finite source execution, start with its initial state related to $q_0$. Induct over its transitions. An erased action leaves the target state unchanged; a visible image follows the required target transition. At each step the new states are related. Thus the target admits precisely the concatenation of non-erased images, which is $\lambda^*$ of the source visible trace. All finite source traces are included.

Conversely assume inclusion. Define $(s,q)\in R$ iff there exists a finite source execution $\rho$ ending at $s$ such that

$$q=\widehat\beta(q_0,\lambda^*(\operatorname{vis}(\rho))).$$

Inclusion makes this value defined for every witnessing execution. Every source initial state has the zero-step execution, so initialization holds. Let $(s,q)\in R$ be witnessed by $\rho$, and let $s\xrightarrow{a}s'$. The extended execution $\rho a$ is a source execution. If $a$ is internal or $\lambda(a)=\epsilon$, its mapped trace is unchanged, giving $(s',q)\in R$. Otherwise write $b=\lambda(a)$. Inclusion admits $\lambda^*(\operatorname{vis}(\rho))b$. Determinism and the unique initial state mean its prefix reaches exactly $q$, so $\beta(q,b)$ is defined, say $q'$, and the extended execution witnesses $(s',q')\in R$. These are all simulation clauses.

The construction allows multiple target states to relate to a source state through history-dependent executions. For scoped input languages, the equivalence applies directly to the operational machine $\operatorname{Restrict}_A(N)$ via restriction equality. $\square$

## Appendix B. Notation

| Symbol | Meaning |
| --- | --- |
| $\Sigma^{\mathrm{in}},\Sigma^{\mathrm{out}},\Sigma^{\mathrm{int}}$ | Disjoint input, output, and internal action sets |
| $\operatorname{tr}(M)$ | Finite visible execution traces of a nonempty-initialized machine |
| $\epsilon$, $u\preceq t$, $\operatorname{pref}L$ | Empty word, prefix order, prefix closure |
| $\lambda$, $\lambda^*=\alpha$ | Letter-or-erasure action map and its homomorphic word extension |
| $\pi_{\mathrm{in}}$, $Q\!\upharpoonright_A$ | Input projection and input-history restriction before hiding |
| $\operatorname{Restrict}_A(N)$ | Operational restriction on state-history pairs |
| $T_{v,c}(Q)$ | $\lambda_{v,c}^*(Q\!\upharpoonright_{A_{v,c}})$ |
| $B_{v,c}$, $L_{v,c}$ | Parent-owned slot monitor and its language, or a declared coarse slot predicate |
| $C_v[N]$, $W_v$, $K_v$ | Concrete witness composition, trajectory skeleton, monotone denotation |
| $\operatorname{Adm}$, $\operatorname{Delivery}$ | Witness admission and actual scoped joint-delivery conditions |
| $G=(V,\mathcal M,\chi,I,J,E)$ | Cells, models, realization/decomposition, intents, support, evidence |
| $A$, $A(v)$ | Active intents and those owned by $v$; distinct from edge input languages $A_{v,c}$ |
| $\Phi(v)$ | Intersection of active owned intent predicates |
| $\operatorname{Deps}(r)$, $H_r$ | Full hypothesis dependency closure and its common-world conjunction |
| $\operatorname{Beh}_{\mathrm{exec}}(v)$ | Trace language of the declared scoped runtime witness |
| $\operatorname{Prot}(G)$ | Tagged protected intent and slot inventory, including scope |
| $D_\ell$, $\mathrm{en}_\ell$, $\delta_\ell$ | RLNF leaf, enabled-input function, pure terminating handler |
| $\operatorname{elab}(D)$, $\operatorname{Packets}(D)$ | Two-rule microstep machine and complete packet words |
| $\mathrm{Sh}_\ell$, $\mathrm{Trans}_\ell$ | Substrate shell and source-to-elaboration translation premise |
| $F$, $U_F$ | Root-covering cut and its recursively composed upper abstraction |
| $\operatorname{Req}(G)$, $\sigma_q$ | Typed scoped obligation set and an obligation's interpretation/context |

## References

- Abadi, M., and Lamport, L. 1991. [The Existence of Refinement Mappings](https://lamport.azurewebsites.net/pubs/abadi-existence.pdf). *Theoretical Computer Science* 82(2), 253–284.
- Abadi, M., and Lamport, L. 1995. [Conjoining Specifications](https://lamport.azurewebsites.net/pubs/abadi-conjoining.pdf). *ACM Transactions on Programming Languages and Systems* 17(3), 507–534.
- Abrial, J.-R. 2010. [Modeling in Event-B: System and Software Engineering](https://www.cambridge.org/core/books/modeling-in-eventb/F39FF5F1B60F0AA585718B8E6A4F9DD7). Cambridge University Press.
- Bloomfield, R., Netkachova, K., and Rushby, J. 2024. [Defeaters and Eliminative Argumentation in Assurance 2.0](https://arxiv.org/abs/2405.15800). arXiv:2405.15800.
- Cavalcanti, A. L. C., Sampaio, A. C. A., and Woodcock, J. C. P. 2003. [A Refinement Strategy for Circus](https://doi.org/10.1007/s00165-003-0006-5). *Formal Aspects of Computing* 15(2–3), 146–181.
- Clarke, E. M., Grumberg, O., Jha, S., Lu, Y., and Veith, H. 2003. [Counterexample-Guided Abstraction Refinement for Symbolic Model Checking](https://doi.org/10.1145/876638.876643). *Journal of the ACM* 50(5), 752–794.
- Cruanes, S., Hamon, G., Owre, S., and Shankar, N. 2013. [Tool Integration with the Evidential Tool Bus](https://doi.org/10.1007/978-3-642-35873-9_18). *VMCAI 2013*, LNCS 7737, 275–294. Springer.
- Cruanes, S., Heymans, S., Mason, I., Owre, S., and Shankar, N. 2014. [The Semantics of Datalog for the Evidential Tool Bus (Extended Abstract)](https://doi.org/10.1007/978-3-642-54624-2_13). *Specification, Algebra, and Software*, LNCS 8373, 256–275. Springer.
- de Alfaro, L., and Henzinger, T. A. 2001. [Interface Automata](https://doi.org/10.1145/503209.503226). *ESEC/FSE 2001*, 109–120. ACM.
- Filipović, I., O'Hearn, P., Rinetzky, N., and Yang, H. 2010. [Abstraction for Concurrent Objects](https://doi.org/10.1016/j.tcs.2010.09.021). *Theoretical Computer Science* 411(51–52), 4379–4398.
- Green, T. J., Karvounarakis, G., and Tannen, V. 2007. [Provenance Semirings](https://doi.org/10.1145/1265530.1265535). *PODS 2007*, 31–40. ACM.
- Hawblitzel, C., Howell, J., Kapritsos, M., Lorch, J. R., Parno, B., Roberts, M. L., Setty, S., and Zill, B. 2015. [IronFleet: Proving Practical Distributed Systems Correct](https://www.microsoft.com/en-us/research/wp-content/uploads/2015/10/ironfleet.pdf). *SOSP 2015*, 1–17. ACM. doi:10.1145/2815400.2815428.
- Herlihy, M. P., and Wing, J. M. 1990. [Linearizability: A Correctness Condition for Concurrent Objects](https://doi.org/10.1145/78969.78972). *ACM Transactions on Programming Languages and Systems* 12(3), 463–492.
- Lamport, L. 1994. [The Temporal Logic of Actions](https://www.microsoft.com/en-us/research/publication/the-temporal-logic-of-actions/). *ACM Transactions on Programming Languages and Systems* 16(3), 872–923.
- Lynch, N. A., and Tuttle, M. R. 1989. [An Introduction to Input/Output Automata](https://groups.csail.mit.edu/tds/papers/Lynch/CWI89.html). *CWI Quarterly* 2(3), 219–246.
- Mokhov, A., Mitchell, N., and Peyton Jones, S. 2018. [Build Systems à la Carte](https://doi.org/10.1145/3236774). *Proceedings of the ACM on Programming Languages* 2 (ICFP), Article 79, 1–29.
- Murphy, L., Viger, T., Di Sandro, A., and Chechik, M. [PLACIDUS: Engineering Product Lines of Rigorous Assurance Cases](https://doi.org/10.1007/978-3-031-76554-4_6). *iFM 2024*, LNCS 15234, 87–108. Springer; first online 2024, proceedings imprint 2025. Preprint: arXiv:2407.10345 (2024).
- Murphy, L., Sy, W., Balevicius, R., Fung, K., Kung, K., Babikian, A. A., and Chechik, M. 2026. [AssureCode: Structured Justification for Trustworthy Agentic Coding](https://arxiv.org/abs/2610.29758). arXiv:2610.29758.
- Rushby, J. 2005. [An Evidential Tool Bus](https://doi.org/10.1007/11576280_3). *ICFEM 2005*, LNCS 3785, p. 36. Springer. [Full invited paper](https://www.csl.sri.com/users/rushby/papers/icfem05.pdf).
- Varadarajan, S., Bloomfield, R., Rushby, J., Gupta, G., Murugesan, A., Stroud, R., Netkachova, K., and Wong, I. H. 2023. [CLARISSA: Foundations, Tools & Automation for Assurance Cases](https://www.csl.sri.com/~rushby/abstracts/dasc23). *42nd AIAA/IEEE Digital Avionics Systems Conference (DASC)*. doi:10.1109/DASC58513.2023.10311213.
- Woodcock, J., and Cavalcanti, A. 2004. [A Tutorial Introduction to Designs in Unifying Theories of Programming](https://doi.org/10.1007/978-3-540-24756-2_4). *iFM 2004*, LNCS 2999, 40–66. Springer.
