# Refinement-DAG Software Development

## A Calculus of Verified Behavior Inclusions for Agent-Authored Systems

**Formal Technical Report · November 2026**

---

## Abstract

Autonomous coding agents fail in three recurring ways. They leap from a requirement to code and invent the missing design; they lose the rationale for load-bearing choices and later weaken tests to make builds pass; and they leave humans with no trustworthy intermediate view of what the system does. This report presents a refinement-DAG calculus that structures software development as an acyclic graph of verified behavior inclusions. A development record assigns each cell its active intents, support provenance, contextual models, state machines, a decomposition into child contracts, and evidence. One relation — behavior inclusion under a typed edge abstraction map — serves for intent satisfaction, child contract refinement, connector decomposition, and code realization. Acyclic support links permit topological support evaluation. The acyclic Refinement DAG organizes connector substitution, closure and cut inspection, and version evolution with proof reuse at unchanged scoped obligations. The central theorem states that a development satisfying intra-DAG validity, edge refinement, typed-edge compatibility, and shared-singleton/input-delivery scope refines all active intents at their owning interfaces, including those owned by root cells. Executable realization and the selected profile's initialization, input-receptiveness, and progress conditions are explicit premises, not consequences of the inclusion algebra. The report develops the DAG definition, subgraph and cut extraction with frontier soundness, the refinement-DAG soundness proof, the cutoff theorem, a five-gate agent protocol, a four-step evolution loop, and a complete durable-acknowledgement example, and it relates the paper calculus to a checked Lean 4 mechanization kernel.

---

## 1. Introduction

### 1.1 The problem

An agent is asked to add a feature or change a subsystem. It receives a requirement sentence and produces code. Between the sentence and the code lie decisions the sentence does not contain: data layout, ownership, error semantics, protocol ordering, retry policy, concurrency control, and edge-case handling. When the agent fills that gap in one leap, three failures follow.

**Wide abstraction leap.** The agent invents the missing design while writing the implementation. Implicit choices become hidden assumptions: a synchronous clock, a lossless channel, an atomic write that is not atomic, a lock that is not held across the operation that needs it. The resulting system can pass unit tests and still violate the requirement under interleaving, failure, or scale.

**Rationale erasure and silent test weakening.** A source repository records the final code, not the ordered argument for why a structure or protocol was chosen from upstream constraints, nor why the alternatives were rejected. A later agent cannot distinguish a load-bearing invariant from an incidental detail. Faced with a failing test, the cheapest repair is often to delete the assertion or weaken the condition. The build passes; the invariant is gone.

**Human inscrutability.** There is no trustworthy intermediate view. To know what the system does, a human must read thousands of lines of agent-generated code, reconstruct the design from the implementation, and guess which parts are intentional. Review degrades into rubber-stamping or line-by-line debugging.

### 1.2 Why post-hoc auditing does not address the problem

An audit that runs after the code exists can detect some violations, but it does not prevent the leap that produced them. A diff algorithm can show what changed, but it cannot show which invariant the change was supposed to preserve. A test suite can encode a requirement, but a test is evidence about a sample, not a proof of a universal behavioral obligation, and it is exactly the artifact an agent can weaken. The problem is structural: the development process has no mandatory intermediate objects that are both behavioral and checkable.

### 1.3 The Refinement-DAG thesis

Development proceeds through a finite Refinement DAG

$$
G = \bigl(V,\ \mathcal{M},\ \chi,\ I,\ J,\ E\bigr)
$$

rooted at top-level system requirements and terminating at executable leaves.

At each cell $v \in V$, the developer records:

- the intents active at $v$ and the acyclic upstream support links that activate them;
- the context premises and design rationales for $v$, with alternatives and reopening conditions;
- an explicit state machine $M_v$ for $v$;
- if $v$ is an internal cell ($\operatorname{ch}(v) \neq \emptyset$), a decomposition into child contracts for its direct successors $\operatorname{ch}(v)$; if $v$ is a leaf ($\operatorname{ch}(v) = \emptyset$), an executable program $P_v$;
- evidence that the cell's machine satisfies its intents and that its decomposition or realization is sound.

A candidate advances only when the required checks at that cell and its outgoing edges succeed. Leaf cells ($V_{\mathrm{leaf}} = \{\ell \in V \mid \operatorname{ch}(\ell) = \emptyset\}$) carry executable programs under declared execution semantics. Intra-DAG validity includes the operational realization of connector wiring and the selected profile's initialization, input-receptiveness, and progress conditions. Theorem 1 additionally requires edge refinement, typed-edge compatibility, and shared-singleton/input-delivery scope; its conclusion is conditional on all these premises. The result is a DAG of behavior inclusions, where every link is small enough to verify and every link is retained as evidence.

The prevention claim is precise. An implementation that violates a protected, formally expressed obligation cannot be accepted by a sound gate whose complete dependencies are preserved. The gate does not make the agent intelligent; it makes the agent's obligations explicit, local, ordered, and checkable.

### 1.4 Contributions

1. A refinement calculus in which intent satisfaction, child contract refinement, connector decomposition, and code realization are one relation: behavior inclusion under a typed edge abstraction map.
2. A partial-formalization spectrum that accommodates coarsened contracts (universal top, type/shape, pre/post, invariants) alongside full protocol machines, paired with an evidence discipline that bridges bounded/sampled test evidence and universal behavioral obligations without unprincipled claims.
3. An acyclic topological support evaluation with a separate evidence stratum and a protected-obligation preservation rule, so neither a failed check nor a support edit silently erases the obligation.
4. A Refinement-DAG soundness theorem whose chain is leaf realization, connector monotonicity, child refinement, and inclusion transitivity, established by well-founded induction on the DAG under explicit typing, shared-singleton scoping, and input-admissibility premises.
5. Elementary subgraph and cross-section extraction on the DAG using three set primitives—predecessor closure, successor closure, and root-covering cuts—with pointwise and frontier soundness guarantees.
6. A sibling-independence theorem with explicit composition conditions, including interaction ownership, executable closure, and practical integration recipes for third-party libraries and shared stateful services (databases, caches, queues).
7. An incremental frame and interface cutoff theorem: a versioned evolution model where modifications, splits, merges, or refactorings reuse every unchanged obligation proposition by identity, providing semantic behavioral caching for CI/CD test-impact analysis and permitting reuse without ancestor solver re-execution when evidence identity and scope applicability are honored.
8. A five-gate development protocol and a four-step evolution loop, including a repair taxonomy that separates semantic counterexamples, failed proof witnesses, and unresolved checker results.
9. A complete durable-acknowledgement example, worked through a two-level Refinement DAG with a single-use interface precondition, a visible durability observation, leaf pseudocode, an agent error, its counterexample, and two repair paths.
10. A mechanization target whose algebraic and DAG-soundness kernel is checked in Lean 4.

### 1.5 Roadmap

Section 2 fixes the refinement algebra, typed edge abstractions, observation extension (including complexity bounds), admissible input restrictions, and the spectrum of contract precision. Section 3 defines the Refinement DAG, support evaluation, context premises, validity, the DAG soundness theorem, and subgraph/cut extraction with frontier soundness. Section 4 details the verification obligations, evidence discipline, and pragmatics for bounded/sampled evidence. Section 5 treats decomposition, connectors, sibling independence, and practical integration recipes for third-party libraries and shared infrastructure. Section 6 gives the development protocol. Section 7 gives versioned evolution, contextual intent projection, exact obligation propositions, the incremental frame theorem, CI/CD semantic caching, and the evolution loop. Section 8 works the durable-acknowledgement example. Section 9 specifies the mechanization target and relates it to `JirlCalculus.lean`. Sections 10–11 cover related work and open problems. Appendices A–B give expanded proof details and notation.

---

## 2. The Refinement Algebra

### 2.1 Observations, machines, and specifications

Fix an interface $X$. An **observation space** $\mathcal{O}_X$ is a set of observations of $X$. The core instance is the set of finite traces over the visible actions of $X$; the liveness instance adds maximal traces under a declared fairness condition; the timed and probabilistic instances replace traces with timed or measure-valued observations. A **specification** at $X$ is a subset $\Phi \subseteq \mathcal{O}_X$.

A **machine** at $X$ is a structure

$$
M = (S, S_0, \Sigma, \to, \mathrm{obs}_M)
$$

where $S$ is a state set, $S_0 \subseteq S$ the initial states, $\Sigma$ a partitioned alphabet of inputs, outputs, and internal actions, $\to \subseteq S \times \Sigma \times S$ the transition relation, and $\mathrm{obs}_M$ maps executions to observations. Its **behavior** is

$$
\operatorname{beh}(M) = \{\, \mathrm{obs}_M(\rho) \mid \rho \text{ is an execution of } M \,\} \subseteq \mathcal{O}_X .
$$

For the trace kernel, $\operatorname{beh}(M)$ is a trace set and is written $\operatorname{tr}(M)$.

### 2.2 Satisfaction, refinement, and typed edge abstraction

**Satisfaction** and **refinement** are inclusion:

$$
M \models \Phi \iff \operatorname{beh}(M) \subseteq \Phi,
\qquad
M \preceq A \iff \operatorname{beh}(M) \subseteq \operatorname{beh}(A).
$$

For every decomposition edge $(v, c)$ where $c \in \operatorname{ch}(v)$, we fix the typing:

$$
\alpha_{v,c} : \mathcal{O}_{X_c} \longrightarrow \mathcal{O}_{X_{v,c}},
\qquad
\operatorname{beh}(B_{v,c}) \subseteq \mathcal{O}_{X_{v,c}},
\qquad
K_v : \prod_{c \in \operatorname{ch}(v)} \mathcal{P}(\mathcal{O}_{X_{v,c}}) \longrightarrow \mathcal{P}(\mathcal{O}_{X_v}).
$$

Here, $X_c$ is the child cell's interface and $X_{v,c}$ is its parent slot interface. A contract $B_{v,c}$ denotes a set of allowed observations at $X_{v,c}$. It may be presented as an operational machine, in which case $\operatorname{beh}(B_{v,c})$ has the meaning of §2.1, or directly as a specification set, in which case we use the convention $\operatorname{beh}(B_{v,c}):=B_{v,c}$. A set-valued contract need not be the exact trace language of an operational machine; executable initialization, receptiveness, realization, and progress remain separate obligations. Under the abstraction map $\alpha_{v,c}$, child refinement is:

$$
M_c \preceq_{\alpha_{v,c}} B_{v,c}
\iff
\alpha_{v,c}(\operatorname{beh}(M_c)) \subseteq \operatorname{beh}(B_{v,c})
\iff
\operatorname{beh}(M_c) \subseteq \alpha_{v,c}^*\bigl(\operatorname{beh}(B_{v,c})\bigr),
$$

where $\alpha_{v,c}^*(\Phi) = \{o \in \mathcal{O}_{X_c} \mid \alpha_{v,c}(o) \in \Phi\}$. Inclusion is reflexive and transitive, and inverse image is functorial: $(\alpha_2 \circ \alpha_1)^* = \alpha_1^* \circ \alpha_2^*$ and $\mathrm{id}^* = \mathrm{id}$.

This typing cleanly separates the role of the child from the role of the parent: a child's behavior $\operatorname{beh}(M_c)$ refines its assigned slot contract $B_{v,c}$ under $\alpha_{v,c}$, whereas the parent's behavior $\operatorname{beh}(M_v)$ is refined by the connector image $K_v(\{\operatorname{beh}(B_{v,c})\}_c)$.

**Observation extension & emergent child properties (e.g., complexity bounds).** The single inclusion relation $\subseteq$ handles the case where a parent does not constrain complexity while a child introduces a high-performance complexity bound. When the child's observation space $\mathcal{O}_{X_c}$ extends observations with resource or cost dimensions $(\tau, \mathrm{size}, \mathrm{cost})$ that $\alpha_{v,c}$ projects out to $\tau \in \mathcal{O}_{X_{v,c}}$, satisfying both the parent slot contract $B_{v,c}$ and the child's local complexity specification $\Phi_c^{\mathrm{cost}} = \{o \in \mathcal{O}_{X_c} \mid \operatorname{cost}(o) \le f(\operatorname{size}(o))\}$ is a single pullback-intersection inclusion:

$$
\operatorname{beh}(M_c) \;\subseteq\; \alpha_{v,c}^*\bigl(\operatorname{beh}(B_{v,c})\bigr) \;\cap\; \Phi_c^{\mathrm{cost}}.
$$

If $\mathcal{O}_{X_{v,c}}$ already includes an unconstrained cost coordinate $\mathrm{cost} \in [0, \infty)$, adding $\mathrm{cost} \le f(\mathrm{size})$ simply narrows the allowed behavior set, which is directly $\subseteq$. Note that exporting a whole-parent complexity bound requires a cost-preserving observation space at $v$ and a cost-composition law on $K_v$.

**General-purpose children & admissible input histories.** Reusable child components (standard library modules, general database clients, utility data structures) typically accept a wider domain of inputs than any single parent uses. Let $\mathcal{H}_{X_c}^{\mathrm{in}}$ denote the space of input histories at child interface $X_c$, and let $\pi_{\mathrm{in}} : \mathcal{O}_{X_c} \to \mathcal{H}_{X_c}^{\mathrm{in}}$ project an observation to its input history prefix. When parent $v$'s connector $W_v$ guarantees that input histories supplied to child $c$ lie within an admissible set $A_{v,c} \subseteq \mathcal{H}_{X_c}^{\mathrm{in}}$, write $\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}}$ for the restricted behavior set:

$$
\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}} \;=\; \bigl\{\, o \in \operatorname{beh}(M_c) \;\big|\; \pi_{\mathrm{in}}(o) \in A_{v,c} \,\bigr\}.
$$

The edge refinement obligation under admissible input restriction is:

$$
\alpha_{v,c}\bigl(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}}\bigr) \;\subseteq\; \operatorname{beh}(B_{v,c}),
$$

accompanied by input receptiveness and progress preservation on $A_{v,c}$.

**The Admissible-Input Delivery Premise.** Restricted refinement does not imply global refinement. To use it in composition, every concrete parent execution must have a legal joint trajectory with child-domain slices $o_c\in Q_c$ satisfying $\pi_{\mathrm{in}}(o_c)\in A_{v,c}$, whose abstract slices $\alpha_{v,c}(o_c)$ and parent observation are admitted by the trajectory connector. This yields the required certificate
$$
\operatorname{Beh}(C_v[Q_c])\subseteq
K_v\bigl(\{\alpha_{v,c}(Q_c\!\upharpoonright_{A_{v,c}})\}_c\bigr).
$$
Input-history predicates are evaluated before an abstraction that hides inputs. The argument does not require the restricted sets themselves to be admissible transition-system behaviors, nor assert equality with an otherwise undefined restricted executable composition.

**The Spectrum of Contract Precision (Coarsened Contracts).** In real-world software engineering, teams cannot and should not write complete, cycle-accurate state machine models for every commodity helper or standard library call on Day 1. The partial-order inclusion relation $\subseteq$ natively supports a continuous spectrum of contract precision without breaking the mathematical integrity of the DAG:

1. **Level 0 — Unconstrained Top Contract ($\top$).** At the coarsest extreme, an unconstrained contract $B_{v,c} = \mathcal{O}_{X_{v,c}}$ admits all possible observations. Any implementation trivially satisfies $\alpha_{v,c}(\operatorname{beh}(M_c))\subseteq\mathcal{O}_{X_{v,c}}$. This allows teams to introduce placeholder cells during initial architectural scaffolding without inventing fictitious formalisms.
2. **Level 1 — Type and Shape Contracts.** Over a value- or schema-observation projection $\alpha_{v,c}$, an interface contract $B_{v,c}$ constrains value types, data shapes, or memory safety. Under the language's type-soundness theorem, the projected inclusion $\alpha_{v,c}(\operatorname{beh}(M_c)) \subseteq \operatorname{beh}(B_{v,c})$ for that type/shape slice is discharged statically by the compiler type checker (e.g., Rust, TypeScript, Lean 4) without dynamic state-space exploration.
3. **Level 2 — Pre/Post Functional Contracts (Hoare Style).** Over an input-output observation projection, $B_{v,c} = \{(\mathrm{in}, \mathrm{out}) \mid P(\mathrm{in}) \implies Q(\mathrm{in}, \mathrm{out})\}$ leaves behavior outside precondition $P$ unconstrained ($\top$). Under Hoare-logic soundness, this projected inclusion is discharged via deductive verifiers, SMT solvers, or exhaustive bounded checkers (e.g., Dafny, Creusot).
4. **Level 3 — Stateful Protocol Machines & Invariants.** For concurrency-critical, durable, or safety-critical components (e.g., consensus, WAL, authentication protocols), $B_{v,c}$ specifies an explicit transition system with temporal safety invariants, visible event orderings, and liveness duties. Discharged via inductive simulation witnesses or certified model checkers.

Because every level is an instance of behavior set inclusion $\subseteq$, a Refinement DAG can freely combine coarsened contracts on commodity glue code with high-precision protocol machines on the critical spine. A subsystem can be progressively strengthened from Level 1 to Level 3 over time without editing ancestor machines or wiring, with affected parent obligations reused or re-discharged as governed by Theorem 3 and Corollary 2.

### 2.3 Connectors

A **connector** at a parent cell $v$ is a map on behavior sets $K_v : \prod_{c \in \operatorname{ch}(v)} \mathcal{P}(\mathcal{O}_{X_{v,c}}) \longrightarrow \mathcal{P}(\mathcal{O}_{X_v})$, and it is **admissible** when it is monotone:

$$
B_{v,c} \subseteq B'_{v,c} \text{ for all } c \in \operatorname{ch}(v)
\;\Longrightarrow\;
K_v(\{B_{v,c}\}_c) \subseteq K_v(\{B'_{v,c}\}_c).
$$

The operational reading is a wiring skeleton $W_v$ that routes, synchronizes, interleaves, and hides child actions, with no state of its own that is not visible in the children or in a declared substrate primitive. A **trajectory model** of $W_v$ supplies:

- a set $\operatorname{legal}_{W_v}$ of legal shared trajectories $r$;
- for each child $c$, a slice $\operatorname{slice}_c(r)$ in $\mathcal{O}_{X_{v,c}}$;
- a projection $\operatorname{obs}_v(r)$ in $\mathcal{O}_{X_v}$.

The induced transformer is

$$
K_v(\{B_{v,c}\}_c)
=
\bigl\{\, \operatorname{obs}_v(r) \;\big|\; \operatorname{legal}_{W_v}(r)
\ \wedge\ \forall c \in \operatorname{ch}(v).\ \operatorname{slice}_c(r) \in B_{v,c} \,\bigr\}.
$$

**Lemma 1 (Trajectory connectors are monotone).** If $B_{v,c} \subseteq B'_{v,c}$ for every $c \in \operatorname{ch}(v)$, then $K_v(\{B_{v,c}\}_c) \subseteq K_v(\{B'_{v,c}\}_c)$.

**Proof.** Take $o \in K_v(\{B_{v,c}\}_c)$. There is a legal $r$ with $\operatorname{obs}_v(r) = o$ and $\operatorname{slice}_c(r) \in B_{v,c}$ for every $c$. Since $B_{v,c} \subseteq B'_{v,c}$, each slice lies in $B'_{v,c}$ as well, so $o \in K_v(\{B'_{v,c}\}_c)$. $\blacksquare$

The trajectory model is the mathematical content of the wiring. Its **operational soundness** obligation is that the implementation of $W_v$ produces only observations in the transformer's output. This is where routing, synchronization, initialization, and shared-resource behavior are established. It is a property of the connector, discharged once per wiring pattern, not a per-child obligation.

### 2.4 The single relation and its five uses

Every behavioral obligation in the calculus is an instance of inclusion:

| Use | Left side | Right side | Where checked |
|---|---|---|---|
| Satisfaction | $\operatorname{beh}(M_v)$ | active intent $\Phi(v)$ | cell $v$ |
| Wiring adequacy | $\operatorname{Beh}(C_v[Q_c])$ | $K_v(\{\alpha_{v,c}(Q_c)\}_c)$ | decomposed cell $v$, universally over admissible $Q_c$ |
| Decomposition | $K_v(\{\operatorname{beh}(B_{v,c})\}_c)$ | $\operatorname{beh}(M_v)$ | decomposed cell $v$ |
| Refinement | $\alpha_{v,c}(\operatorname{beh}(M_c))$ | contract $\operatorname{beh}(B_{v,c})$ | decomposition edge $(v,c)$ |
| Realization | $\operatorname{beh}(P_\ell)$ | $\operatorname{beh}(M_\ell)$ | leaf cell $\ell \in V_{\mathrm{leaf}}$ |

The algebra is small on purpose. The paper's correctness argument is the transitive closure of this table, and the engineering content is the discipline that decides what to put on each side.

### 2.5 Semantic profiles

A **semantic profile** $\Gamma$ fixes the observation class and the obligations that accompany it:

- **Safety profile.** Observations are finite visible traces; $M \preceq A$ is trace inclusion.
- **Liveness profile.** Observations are maximal traces under a declared fairness condition; refinement preserves maximality and fairness, and a progress obligation accompanies the trace inclusion.
- **Timed and probabilistic profiles.** Observations are timed traces or path measures; refinement uses the corresponding measurable or timed preorder.

Two side conditions belong to every open-interface profile:

- **Input receptiveness.** If a contract permits an input at a related state, the child must accept it. Without this condition, a child can satisfy a safety contract by refusing every request, which is not an admissible replacement.
- **Progress preservation.** For a liveness contract, the child must preserve the required maximal fair executions. Finite-prefix inclusion alone admits a machine that accepts a request and then stops.

The core theorems are stated for the trace profile with these two side conditions. The timed and probabilistic instantiations use the same graph structure and the same schema; only the profile's refinement relation and composition lemma change.

### 2.6 Boundary discipline

A contract constrains observable behavior at the child interface and the child's duties to the connector. It may specify:

- the inputs the child must accept;
- the outputs it may produce and their order;
- relations between its outputs and shared connector state;
- progress or termination duties;
- the environment assumptions under which those duties hold.

It does not prescribe the child's internal algorithm, data layout, module structure, or implementation strategy. The child is free to choose any implementation whose behavior lies within the contract. This is the boundary rule that makes independent development possible: **the parent owns the interface; the child owns the implementation.**

---

## 3. The Refinement DAG and Soundness

### 3.1 The development DAG record

A **development record** is a finite tuple

$$
G = \bigl(V,\ \mathcal{M},\ \chi,\ I,\ J,\ E\bigr).
$$

The fields define the modular and behavioral boundary of the development:

**$V$ — cells.** A finite set of components.

**$\mathcal{M}$ — local models.** For each cell $v \in V$, its local specification and machine record:

$$
\mathcal{M}(v) = \bigl(\mathcal{O}_{X_v},\ \Phi(v),\ M_v,\ \Gamma_v\bigr),
$$

where $\mathcal{O}_{X_v}$ is the observation space at interface $X_v$, $M_v$ is its state machine, $\Phi(v) = \bigcap_{c \in A(v)} \llbracket c \rrbracket$ is the semantic conjunction of active intents owned by $v$, and $\Gamma_v$ records the semantic profile and local context premises $\Delta P_v$ (domain axioms and environment assumptions).

**$\chi$ — decomposition or realization.** For an internal cell ($\operatorname{ch}(v) \neq \emptyset$), $\chi(v)$ is a typed decomposition record:

$$
\chi(v) = \bigl(W_v,\ \operatorname{ch}(v),\ (B_{v,c},\ \alpha_{v,c})_{c \in \operatorname{ch}(v)}\bigr),
$$

where $W_v$ is a wiring skeleton, $\operatorname{ch}(v) \subset V$ is a finite set of child cells, $B_{v,c}$ is the contract assigned to child $c$ at slot interface $X_{v,c}$, and $\alpha_{v,c} : \mathcal{O}_{X_c} \to \mathcal{O}_{X_{v,c}}$ is the typed edge abstraction map. For a leaf cell $\ell$ ($\operatorname{ch}(\ell) = \emptyset$), $\chi(\ell) = P_\ell$ is the executable leaf program under the declared runtime semantics.

The child relation $v \to c \iff c \in \operatorname{ch}(v)$ forms a finite **directed acyclic graph (DAG)** with roots $V_{\mathrm{root}} = \{r \in V \mid \operatorname{par}(r) = \emptyset\}$ and leaves $V_{\mathrm{leaf}} = \{\ell \in V \mid \operatorname{ch}(\ell) = \emptyset\}$, where $\operatorname{par}(c) = \{v \in V \mid c \in \operatorname{ch}(v)\}$.

**$I$ — intent records.** A finite set of intents. Each $c \in I$ carries:

- a stable identifier $\operatorname{id}(c)$;
- an owner cell $\operatorname{owner}(c) \in V$;
- a predicate $\llbracket c \rrbracket \subseteq \mathcal{O}_{X_{\operatorname{owner}(c)}}$;
- an authority tag: $\mathrm{root}$, $\mathrm{protected}$, or $\mathrm{delegated}$.

Ownership is total and unique: every active intent is owned by exactly one cell, so $\bigcup_{v \in V} A(v) = A$ and $A(u) \cap A(v) = \emptyset$ for $u \neq v$.

**$J$ — support links.** For each $c \in I$, a finite set $J(c)$ of support groups. Each group $P \in J(c)$ is a finite conjunctive set of upstream intent references $P \subseteq I$, forming an acyclic dependency relation on $I$. Multiple groups represent disjunctive alternatives.

**$E$ — evidence map.** A finite map from required local behavioral-inclusion propositions to evidence records. The evidence stratum is separate from the intent stratum: an intent's activation does not depend on whether its evidence exists or passes.

### 3.2 Active intents and topological support evaluation

The **active intents** $A \subseteq I$ are defined as the least fixed point:

$$
c \in A \iff c \in I^{\mathrm{root}} \;\lor\; \exists P \in J(c).\ P \subseteq A.
$$

Because the support relation $J$ is acyclic on the finite set $I$, $A$ is evaluated deterministically in a single forward pass along any topological order of $(I, J)$ without circularity.

**Lemma 2 (Evidence separation).** $A$ is a function of $(I, J)$ only and does not mention $E$. Consequently, a failed, missing, or pending evidence record leaves every obligation it concerns active and blocking.

**Proof.** The fixed-point condition defining $A$ refers only to intent records and support links. The evidence stratum $E$ does not occur in it. $\blacksquare$

### 3.3 Context premises, design provenance, and staleness

Architectural choices—including contract declaration, connector selection, and component decomposition—are recorded at cell boundaries. For each cell $v \in V$, its local context premises $\Delta P_v$ form a finite set of references to upstream intents, parent contracts, and environmental assumptions on which $v$'s model and decomposition depend, with transitive upstream closure $\Delta P_v^*$. Superseded or alternative design options are preserved as historical snapshots in the version sequence $\{G_t\}_{t \in \mathbb{N}}$.

If an upstream intent or context premise $x$ changes, downstream components in its dependency closure become stale:

$$
\operatorname{stale}(x) = \{\, v \in V \mid x \in \Delta P_v^* \,\}.
$$

Because prerequisites are strictly upstream, the reference graph is acyclic and the stale set is computed in linear time. A stale premise blocks publication of every cell that depends on it until re-warranted or replaced.

### 3.4 Intra-DAG validity

For a leaf $\ell \in V_{\mathrm{leaf}}$, $\operatorname{Beh}_{\mathrm{exec}}(\ell) = \operatorname{beh}(P_\ell)$ under the declared execution semantics. For a decomposed cell $v$, concrete wiring $C_v$ runs with the executable children to produce $\operatorname{Beh}_{\mathrm{exec}}(v)$. The connector transformer $K_v$ is the abstract specification image of $C_v$.

A development DAG $G = (V, \mathcal{M}, \chi, I, J, E)$ is **valid** when conditions 1–6 hold for $G$ (and condition 7 holds when publishing $G$ as a versioned update to an existing development):

1. **Support well-formedness and ownership coverage.** Every active intent in $A$ has an active support group (or is root); support links are acyclic; and $\bigcup_{v \in V} A(v) = A$ with each intent uniquely owned.
2. **Context premise validity.** For every cell $v \in V$, local premises $\Delta P_v$ are warranted and compatible with upstream cells.
3. **Satisfaction.** For every cell $v \in V$ and active intent $c \in A(v)$, evidence $E$ contains a valid record for
   $$
   \operatorname{beh}(M_v) \subseteq \llbracket c \rrbracket .
   $$
4. **Decomposition.** For every non-leaf cell $v \in V \setminus V_{\mathrm{leaf}}$, evidence $E$ contains a valid record for
   $$
   K_v\bigl(\{\operatorname{beh}(B_{v,c})\}_{c \in \operatorname{ch}(v)}\bigr) \subseteq \operatorname{beh}(M_v) .
   $$
5. **Executable realization.** For a decomposed cell $v$, evidence $E$ contains a **wiring adequacy certificate** for $C_v$:
   $$
   \forall (Q_c)_{c \in \operatorname{ch}(v)}.\ \Bigl(\forall c.\ Q_c \text{ is admissible for } X_c, \Gamma_c\Bigr) \implies \operatorname{Beh}(C_v[Q_c]) \subseteq K_v\bigl(\{\alpha_{v,c}(Q_c)\}_c\bigr),
   $$
   where a child behavior $Q_c \subseteq \mathcal{O}_{X_c}$ is *admissible for $X_c, \Gamma_c$* iff $Q_c = \operatorname{beh}(N_c)$ for some transition system/execution witness $N_c$ satisfying the profile admissibility conditions of condition 6 (nonempty initialization, input receptiveness, and progress preservation). The operational instance $\operatorname{Beh}_{\mathrm{exec}}(v) \subseteq K_v(\{\alpha_{v,c}(\operatorname{Beh}_{\mathrm{exec}}(c))\}_c)$ follows by application to executable child behaviors (whose underlying execution witnesses are admissible by condition 6). When an edge $(v,c)$ employs admissible-input restricted refinement (§2.2), $C_v$ satisfies the admissible-input delivery premise, providing the restricted operational inclusion $\operatorname{Beh}(C_v[Q_c]) \subseteq K_v(\{\alpha_{v,c}(Q_c\!\upharpoonright_{A_{v,c}})\}_c)$. For a leaf $\ell \in V_{\mathrm{leaf}}$, evidence $E$ certifies $\operatorname{Beh}_{\mathrm{exec}}(\ell) = \operatorname{beh}(P_\ell) \subseteq \operatorname{beh}(M_\ell)$, with a nonempty initial state set. Evidence validity is relative to the obligation's declared scope (§4.5). When a realization obligation is conditional on substrate hypotheses in $\Delta P_v$, its evidence certifies the corresponding scoped implication, and the root guarantee retains those hypotheses.
6. **Profile admissibility.** The selected semantic profile's conditions hold:
   - *Initialization.* Initial states are within the declared state invariant (when specified), and initial state sets are nonempty.
   - *Input receptiveness.* If a contract permits an input at a related state, the child accepts it.
   - *Progress preservation.* For liveness claims, required maximal fair executions are preserved.
   These conditions apply to the actual execution witness of every cell: the program witness at a leaf and the composed concrete-wiring witness at an internal cell. In particular, $\operatorname{Beh}_{\mathrm{exec}}(v)$ is admissible for $X_v,\Gamma_v$ in the sense of condition 5.
7. **Protected obligation preservation.** Every element of the previous version's effective inventory $\operatorname{Prot}(G)$ remains present unchanged, including its identifier, predicate, owner, and authority tag, unless an authorized disposition records the revision (§3.8).

Conditions 1–6 define the intra-DAG validity of a development record $G$, and are the hypotheses consumed by the soundness theorem (Theorem 1). Condition 7 is the inter-version preservation condition consumed by the publication gate to prevent silent obligation erasure.

### 3.5 Edge refinement and the shared-child discipline

For every decomposition edge $(v,c)$ with $c \in \operatorname{ch}(v)$, evidence $E$ contains a valid record for edge refinement:

$$
\alpha_{v,c}\bigl(\operatorname{beh}(M_c)\bigr) \subseteq \operatorname{beh}(B_{v,c})
\quad\Longleftrightarrow\quad
\operatorname{beh}(M_c) \subseteq \alpha_{v,c}^*\bigl(\operatorname{beh}(B_{v,c})\bigr).
$$

When child refinement is restricted to admissible input histories $A_{v,c}$ (§2.2), the edge obligation is $\alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}}) \subseteq \operatorname{beh}(B_{v,c})$ (with $A_{v,c} = \mathcal{H}_{X_c}^{\mathrm{in}}$ for unrestricted edges). The edge refinement compares a child implementation with the contract its parent declared, under the edge abstraction map $\alpha_{v,c}$. It does not compare the child with an obsolete implementation; the contract is the complete interface.

When a child cell $c$ has multiple parents $\operatorname{par}(c) = \{u_1, \dots, u_m\}$ (a shared child in the DAG), two disciplines govern the shared node:

1. **Edge-indexed refinement.** The child machine $M_c$ must simultaneously satisfy each incoming slot contract under that edge's admissible input history set $A_{u,c}$:
   $$
   \forall u \in \operatorname{par}(c),\quad \alpha_{u,c}\bigl(\operatorname{beh}(M_c)\!\upharpoonright_{A_{u,c}}\bigr) \subseteq \operatorname{beh}(B_{u,c})
   \quad\Longleftrightarrow\quad
   \forall u \in \operatorname{par}(c),\quad \operatorname{beh}(M_c)\!\upharpoonright_{A_{u,c}} \subseteq \alpha_{u,c}^*\bigl(\operatorname{beh}(B_{u,c})\bigr).
   $$
2. **Instance vs. singleton scope.** If each parent instantiates a separate runtime copy of $c$ (or $c$ is purely stateless), edge-indexed refinement suffices. If parents share a single stateful runtime instance of $c$, $\operatorname{Beh}_{\mathrm{exec}}(c)$ and $M_c$ must range over the **aggregate multi-client history** owned at a selected common dominating ancestor boundary. The two-sentence shared-counter witness illustrates why: two clients that each expect `1` on their first call in isolation observe `1` and `2` when sharing one counter instance. Thus, separate isolated single-client contracts do not compose without accounting for multi-client interleavings at the dominating ancestor.

### 3.6 Refinement-DAG soundness

**Theorem 1 (Refinement-DAG soundness).** Let $G = (V, \mathcal{M}, \chi, I, J, E)$ be a Refinement DAG. Suppose:

- (A1) $G$ satisfies the validity conditions 1–6 of §3.4;
- (A2) every decomposition edge $(v,c)$ with $c \in \operatorname{ch}(v)$ satisfies edge refinement $\alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}}) \subseteq \operatorname{beh}(B_{v,c})$ (§3.5), with $A_{v,c} = \mathcal{H}_{X_c}^{\mathrm{in}}$ for unrestricted edges;
- (A3) **Typed edge abstraction compatibility:** for each decomposition edge $(v,c)$, abstraction map $\alpha_{v,c} : \mathcal{O}_{X_c} \to \mathcal{O}_{X_{v,c}}$ maps child observations into the slot observation domain $\mathcal{O}_{X_{v,c}}$ consumed by connector $K_v$ and contract $B_{v,c}$;
- (A4) **Shared-singleton and input-admissibility scope:** any shared stateful child cell $c$ is scoped over aggregate multi-client histories at a selected common dominating ancestor boundary (§3.5, §5.4); and for any edge $(v,c)$ using admissible-input restricted refinement (§2.2), parent wiring $C_v$ and transformer $K_v$ satisfy the admissible-input delivery premise.

Then for every cell $v \in V$, $\operatorname{Beh}_{\mathrm{exec}}(v) \subseteq \operatorname{beh}(M_v)$, and for every active intent $c \in A(v)$, $\operatorname{Beh}_{\mathrm{exec}}(v) \subseteq \llbracket c \rrbracket$. In particular, for every root $r \in V_{\mathrm{root}}$,

$$
\operatorname{Beh}_{\mathrm{exec}}(r)
\subseteq
\Phi(r)
=
\bigcap_{c \in A(r)} \llbracket c \rrbracket,
$$

the semantic conjunction at root $r$, not the syntactic set $A(r)$.

**Proof.** By well-founded induction on the finite acyclic child relation $v \to c$ on $V$.

*Base case ($\ell \in V_{\mathrm{leaf}}$, $\operatorname{ch}(\ell) = \emptyset$).* Condition 5 gives $\operatorname{Beh}_{\mathrm{exec}}(\ell) = \operatorname{beh}(P_\ell) \subseteq \operatorname{beh}(M_\ell)$ and the nonempty initial state condition. Condition 3 gives $\operatorname{beh}(M_\ell) \subseteq \llbracket c \rrbracket$ for every active intent $c \in A(\ell)$.

*Inductive step ($v \notin V_{\mathrm{leaf}}$).* Assume the claim for every child $c \in \operatorname{ch}(v)$, and write $B_c = \operatorname{Beh}_{\mathrm{exec}}(c)$. Let $B_{v,c}$ be the contract declared by $v$ for $c$. For unrestricted edges, set $A_{v,c} = \mathcal{H}_{X_c}^{\mathrm{in}}$ (so $B_c \!\upharpoonright_{A_{v,c}} = B_c$). Condition 5 gives the wiring-adequacy certificate; instantiating it at $Q_c = B_c$ (which is admissible for child interface $X_c$ by condition 6) under the admissible-input delivery premise of (A4) gives the operational inclusion:

$$
\operatorname{Beh}_{\mathrm{exec}}(v)
\subseteq
K_v\bigl(\{\alpha_{v,c}(B_c \!\upharpoonright_{A_{v,c}})\}_{c \in \operatorname{ch}(v)}\bigr). \qquad (1)
$$

The induction hypothesis gives $B_c \subseteq \operatorname{beh}(M_c)$, which implies restriction inclusion $B_c \!\upharpoonright_{A_{v,c}} \subseteq \operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}}$, and hence $\alpha_{v,c}(B_c \!\upharpoonright_{A_{v,c}}) \subseteq \alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}})$. Monotonicity of $K_v$ (Lemma 1) gives:

$$
K_v\bigl(\{\alpha_{v,c}(B_c \!\upharpoonright_{A_{v,c}})\}_{c}\bigr)
\subseteq
K_v\bigl(\{\alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}})\}_{c}\bigr). \qquad (2)
$$

Edge refinement (A2) gives $\alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}}) \subseteq \operatorname{beh}(B_{v,c})$ for every child $c$. Monotonicity of $K_v$ gives:

$$
K_v\bigl(\{\alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}})\}_{c}\bigr)
\subseteq
K_v\bigl(\{\operatorname{beh}(B_{v,c})\}_{c}\bigr). \qquad (3)
$$

Condition 4 gives:

$$
K_v\bigl(\{\operatorname{beh}(B_{v,c})\}_{c}\bigr)
\subseteq
\operatorname{beh}(M_v). \qquad (4)
$$

Chaining (1)–(4) yields $\operatorname{Beh}_{\mathrm{exec}}(v) \subseteq \operatorname{beh}(M_v)$. Condition 3 gives $\operatorname{beh}(M_v) \subseteq \llbracket c \rrbracket$ for every active intent $c \in A(v)$. Condition 6 supplies the profile's initialization, input, and progress conditions, so no step uses an empty behavior or a refused input to satisfy an obligation. For every root $r \in V_{\mathrm{root}}$, this yields $\operatorname{Beh}_{\mathrm{exec}}(r) \subseteq \Phi(r)$. $\blacksquare$

The proof is the spine of the calculus. It uses executable realization, monotonicity, child refinement, decomposition, and transitivity. Acyclicity enters in the well-founded induction: every child's proof is a separate premise, and the parent's decomposition is checked against contracts rather than against the concrete product of child states. The operational counterexample — identity $K$, child $\{ok\}$, parent $\{ok\}$, actual wiring $\{bad\}$ — is excluded by condition 5, because $\{bad\} \subseteq \{ok\}$ is false. The empty-initial-state counterexample is excluded by condition 6.

### 3.7 Subgraph extraction, cuts, and frontier soundness

Human inspection and agent context scoping are formalized as **information extraction on the finite DAG $(V, \operatorname{ch})$** using **only three elementary set primitives and their intersections**:

1. **Predecessor (Ancestor) Closure.**
   $$
   \operatorname{Anc}(S) = \{\, u \in V \;\mid\; \exists x \in S,\ u \to^* x \,\}.
   $$
   This extracts the upstream provenance cone, answering *why* $S$ exists and what requirements govern it.
2. **Successor (Descendant) Closure.**
   $$
   \operatorname{Desc}(S) = \{\, w \in V \;\mid\; \exists x \in S,\ x \to^* w \,\},
   $$
   along with immediate direct successors $\operatorname{ch}(v) = \{\, c \in V \mid v \to c \,\}$. While $\operatorname{Desc}(S)$ forms the reflexive transitive closure, $\operatorname{ch}(v)$ extracts the immediate outgoing edges of $v$, providing the single-step boundary for local decomposition.
3. **Root-Covering Cut (Frontier).** An antichain $C \subseteq V$ that intersects every directed path from $V_{\mathrm{root}}$ to $V_{\mathrm{leaf}}$. Given a chosen focus antichain $K \subseteq V$ contained in a root-covering cut $C \supseteq K$, the cut $C$ extracts a complete horizontal cross-section passing through $K$.

Composite inspection views follow directly:

- **Connecting Interval between $u$ and $w$:** $[u, w] = \operatorname{Desc}(\{u\}) \cap \operatorname{Anc}(\{w\})$;
- **Single-Step Decomposition View at cell $v$:** the direct neighborhood $\{v\} \cup \operatorname{ch}(v)$, extracting the immediate parent-child boundary of $v$;
- **Bounded Slab between Two Cuts $C_1, C_2$:** $\operatorname{Slice}(C_1, C_2) = \operatorname{Desc}(C_1) \cap \operatorname{Anc}(C_2)$ (and for $C_1 = V_{\mathrm{root}}, C_2 = C$, the upper system truncated at cut $C$).

Because architectural DAGs have modest size, all closure and cut extractions are evaluated directly by their set definitions without asymptotic complexity machinery.

**Corollary 1 (Pointwise and Frontier Soundness).** Let $G = (V, \mathcal{M}, \chi, I, J, E)$ be a Refinement DAG.

- *Pointwise soundness.* If $G$ satisfies the hypotheses of Theorem 1, then for every cell $v \in V$, $\operatorname{Beh}_{\mathrm{exec}}(v) \subseteq \operatorname{beh}(M_v) \subseteq \Phi(v)$.
- *Frontier soundness.* Let $C \subseteq V$ be a root-covering cut (an antichain intersecting every directed path from $V_{\mathrm{root}}$ to $V_{\mathrm{leaf}}$). Define the cut-abstracted behavior $H_C(u) = \operatorname{beh}(M_u)$ for $u \in C$, and $H_C(v) = K_v\bigl(\{\alpha_{v,c}(H_C(c)\!\upharpoonright_{A_{v,c}})\}_{c \in \operatorname{ch}(v)}\bigr)$ for $v \in \operatorname{Anc}(C) \setminus C$ (with $A_{v,c} = \mathcal{H}_{X_c}^{\mathrm{in}}$ for unrestricted edges). Suppose:
  1. for every frontier node $u \in C$, realization holds: $\operatorname{Beh}_{\mathrm{exec}}(u) \subseteq \operatorname{beh}(M_u)$;
  2. for every internal node $v \in \operatorname{Anc}(C)\setminus C$, decomposition, edge refinement $\alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}})\subseteq\operatorname{beh}(B_{v,c})$, and hypotheses (A3)–(A4) of Theorem 1 hold, together with the instantiated operational inclusion
     $$
     \operatorname{Beh}_{\mathrm{exec}}(v)
     \subseteq K_v\bigl(\{\alpha_{v,c}(\operatorname{Beh}_{\mathrm{exec}}(c)\!\upharpoonright_{A_{v,c}})\}_c\bigr).
     $$
     A sufficient way to obtain this inclusion is condition 5 plus condition 6 for every actual child execution witness used in that application. Frontier realization alone does not establish those admissibility conditions;
  3. the upper region $\operatorname{Anc}(C)$ contains no bypass around $C$ (guaranteed by $C$ being a root-covering cut);
  4. for every root $r \in V_{\mathrm{root}}$, satisfaction $\operatorname{beh}(M_r) \subseteq \Phi(r)$ holds.

  Then for every root $r \in V_{\mathrm{root}}$,
  $$
  \operatorname{Beh}_{\mathrm{exec}}(r) \subseteq H_C(r) \subseteq \operatorname{beh}(M_r) \subseteq \Phi(r).
  $$

The inspection direction is: every executable behavior maps under the abstractions to a behavior permitted by the cut's machines, and every universal obligation displayed at cut $C$ transfers to the code. The converse does not hold: an abstract cut model may admit behaviors that a concrete realization narrows. The cut view is an abstraction, not an equivalence.

### 3.8 Protected obligation preservation

Define the **effective protected inventory** of a version $G$:

$$
\operatorname{Prot}(G) = \bigl\{(\operatorname{id}(c),\ \llbracket c \rrbracket,\ \operatorname{owner}(c),\ \operatorname{authority}(c)) \;\big|\; c \text{ is active in } G \text{ and } \operatorname{authority}(c) \in \{\mathrm{root}, \mathrm{protected}\}\bigr\}.
$$

A candidate $G'$ **preserves** $G$ when, for every $p=(\operatorname{id}(c),\llbracket c\rrbracket,\operatorname{owner}(c),\mathrm{auth})\in\operatorname{Prot}(G)$, either $p\in\operatorname{Prot}(G')$, or an authorized disposition $d\in\mathcal{A}_{G'}$ (§7.1) records $p$, the authorization, and the rationale. Membership in $\operatorname{Prot}(G')$ requires an active intent with the same identifier, predicate, owner, and authority tag. A support edit that removes an inventory entry, an ownership change, an interpretation change, or an authority downgrade without such a disposition is rejected by condition 7. Every protected inventory entry is checked in its owner's satisfaction set; satisfaction also checks active delegated intents, which are not in $\operatorname{Prot}(G)$. A protected interaction intent is assigned to the cell that owns the interaction boundary and is checked there.

Evidence failure does not deactivate an intent (Lemma 2), and any support, ownership, or authority edit that deactivates or downgrades a protected intent without a disposition is rejected by condition 7. Delegated intents may be refined or strengthened by agents, with any retirement recorded in the version provenance.

---

## 4. Verification Obligations

### 4.1 Satisfaction

For a finite machine and an effectively represented property supported by a sound decision procedure, satisfaction may be checked by exhaustive model checking; certified invariants are another route. Finiteness of the machine alone does not decide inclusion in an arbitrary specification. Infinite-state obligations require an appropriate proof, certified abstraction, or explicitly bounded claim whose scope matches the obligation. The obligation is exactly $\operatorname{beh}(M_v) \subseteq \Phi(v)$. A test is not, by itself, evidence for this universal inclusion. It is evidence for a bounded claim: no violation in the tested sample, or no violation within a bound. The evidence record must state the claim; the gate checks that the claim covers the obligation. A universal obligation is not discharged by a sampled test. A bounded intent can be discharged by a bounded check, provided the intent is stated with the same bound.

### 4.2 Decomposition and connector admissibility

The decomposition obligation is

$$
K_v\bigl(\{\operatorname{beh}(B_{v,c})\}_{c \in \operatorname{ch}(v)}\bigr)
\subseteq
\operatorname{beh}(M_v).
$$

It is checked at the parent cell against abstract child contracts, not against concrete child implementations. The connector's admissibility relies on monotonicity (Lemma 1) and the universal wiring-adequacy certificate defined in §3.4 (condition 5), together with the interaction-ownership and reduction-preservation disciplines detailed in §5.6. A connector that fails these conditions lies outside the calculus until an explicit coordinator or reduction proof is supplied.

### 4.3 Child refinement

A child refinement obligation along decomposition edge $(v,c)$ is

$$
\alpha_{v,c}\bigl(\operatorname{beh}(M_c)\bigr) \subseteq \operatorname{beh}(B_{v,c})
\quad\Longleftrightarrow\quad
\operatorname{beh}(M_c) \subseteq \alpha_{v,c}^*\bigl(\operatorname{beh}(B_{v,c})\bigr).
$$

When child $M_c$ introduces local performance constraints or complexity bounds $\Phi_c^{\mathrm{cost}}$, the single relation handles it as a pullback-intersection inclusion:

$$
\operatorname{beh}(M_c) \;\subseteq\; \alpha_{v,c}^*\bigl(\operatorname{beh}(B_{v,c})\bigr) \;\cap\; \Phi_c^{\mathrm{cost}}.
$$

When child $M_c$ is a general-purpose component whose full input domain exceeds what parent $v$'s connector delivers, the edge obligation restricts to admissible input histories $A_{v,c}$:

$$
\alpha_{v,c}\bigl(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}}\bigr) \;\subseteq\; \operatorname{beh}(B_{v,c}),
$$

accompanied by input receptiveness and progress preservation on $A_{v,c}$.

For finite trace inclusion, an **inductive simulation witness** establishes it:

- an invariant $I_c \subseteq S_{M_c}$;
- a relation $R_c \subseteq S_{M_c} \times S_{B_{v,c}}$;
- an action abstraction map $\lambda_{v,c}$ from child actions to contract actions or silent steps.

The conditions are:

1. **Initiation.** Every initial child state is in $I_c$ and is related to an initial contract state.
2. **Consecution.** $I_c$ is closed under the child's transitions.
3. **Step simulation.** For $(s, t) \in R_c$ and $s \xrightarrow{\sigma} s'$: if $\lambda_{v,c}(\sigma) = \epsilon$, then $(s', t) \in R_c$; otherwise there is $t'$ with $t \xrightarrow{\lambda_{v,c}(\sigma)} t'$ and $(s', t') \in R_c$.
4. **Input receptiveness.** Every contract input enabled at $t$ is enabled by some child input in $\lambda_{v,c}^{-1}$ at $s$.
5. **Silent convergence.** For a liveness profile, a well-founded rank strictly decreases on silent steps, preventing infinite internal stuttering.

**Lemma 3 (Finite-trace simulation).** Conditions 1–3 imply $\lambda_{v,c}(\operatorname{tr}(M_c)) \subseteq \operatorname{tr}(B_{v,c})$.

**Proof.** Induct on the length of a child execution. Initiation relates the initial states. Consecution keeps the invariant. A silent step keeps the contract state; a visible step appends the matched contract transition. Every finite prefix therefore has a matching contract execution. $\blacksquare$

For state-labeled properties, related states agree on the abstract valuations and silent steps preserve them. For liveness, the witness additionally preserves maximality and fairness, and validity condition 6 supplies the progress rank. For open inputs, simulation condition 4 blocks the trivial refusal strategy.

### 4.4 Realization

For each leaf cell $\ell \in V_{\mathrm{leaf}}$, realization is certified by $\operatorname{beh}(P_\ell) \subseteq \operatorname{beh}(M_\ell)$ under the declared runtime semantics and environment assumptions. The substrate contract names what the runtime guarantees: an atomic write, a durable flush completion, or message delivery. For a decomposed parent cell, realization is discharged by the universal wiring-adequacy certificate (§3.4, condition 5), whose universal quantification over admissible child behaviors yields $\operatorname{Beh}_{\mathrm{exec}}(v) \subseteq K_v(\{\alpha_{v,c}(\operatorname{Beh}_{\mathrm{exec}}(c))\}_c)$ by application. For a leaf, it is the program-to-machine inclusion above.

### 4.5 Evidence discipline

An evidence record for an obligation $o$ is a tuple

$$
e = (o,\ \mathrm{method},\ \mathrm{claim},\ \mathrm{result},\ \mathrm{scope},\ \mathrm{artifact}).
$$

An evidence record is **valid for obligation $o$ under the hypotheses declared in its scope** when its scope is applicable to the obligation's declared context and:

1. under those hypotheses, $\mathrm{claim}$ is at least as strong as $o$;
2. $\mathrm{method}$ is sound for $\mathrm{claim}$ under $\mathrm{scope}$;
3. $\mathrm{result}$ is pass.

Scope applicability requires that the hypotheses used by the evidence are part of the obligation's declared context or are justified from that context; an additional unestablished assumption cannot be introduced merely to make a check pass. If the evidence's derivation depends on a substrate hypothesis $H$ declared in the context, the resulting pass certifies the scoped implication $H\Rightarrow o$, not $H$ itself or an unconditional claim $o$; if the derivation does not depend on $H$, it may certify $o$ (and hence $H\Rightarrow o$). When the derivation depends on $H$, the obligation and the root guarantee retain the same hypothesis. Merely entering $H$ in a context record does not supply a derivation or establish the truth of $H$.

The result field is one of $\{\mathrm{pass}, \mathrm{fail}, \mathrm{unresolved}, \mathrm{pending}\}$. Only `pass` discharges an obligation; `unresolved` and `pending` are not passes and cannot enter the Verified outcome.

The method determines the claim:

| Method | Claim it can establish | What it cannot establish |
|---|---|---|
| Proof derivation | the exact obligation | nothing beyond the logic's soundness |
| Exhaustive finite model check | the obligation for the modeled machine | adequacy of the model to the code |
| Bounded model check | the obligation up to the bound | the unbounded obligation |
| Property-based test | no violation in the sampled domain | a universal inclusion |
| Runtime monitor | no violation in the observed run | future or unobserved behavior |
| Translation validation | the specific program-to-machine relation | unrelated properties |

The scope records the observation profile, machine class, environment assumptions, and any bound. A result is meaningful only within its scope.

**Evidence Pragmatics: Bridging Bounded/Sampled Evidence and Universal Obligations.** In production software engineering, testing (unit, property-based, fuzzing, integration) represents the vast majority of day-to-day verification. JIRL reconciles real-world testing with mathematical rigor through three principled mechanisms:

1. **Scoped Bounded Intents.** When universal verification is infeasible or unnecessary for a peripheral helper, the intent itself is stated with an explicit bound $\Phi^{\le k}$ (e.g., "no unhandled exceptions within $k=1000$ event loops", "schema conformance for payloads $\le 64\text{ KB}$"). Bounded model checking or exhaustive bounded testing discharges this bounded obligation soundly with `pass`, without pretending to have proved an unbounded claim.
2. **Context Premise Domain Reduction ($\Delta P_v$).** Teams can record explicit domain axioms or small-scope hypotheses in local context premises $\Delta P_v$ (e.g., "input strings are ASCII of length $\le 8$", "message queues with bounded capacity $\le 4$"). When the declared premise restricts the *relevant state and observation domain* to a finite set, an *exhaustive finite check* over that finite state/observation domain discharges the universal claim under that explicit scope with `pass`. When the reachable state or observation domain remains infinite or check coverage is sampled, testing acts as a falsification probe and remains categorized as `unresolved` against universal claims. The premise is retained in the provenance ledger; if production telemetry reveals inputs violating $\Delta P_v$, the premise is marked stale, triggering reopening (§7.7).
3. **Provisional Development vs. Verified Publication.** A property-based test (e.g., QuickCheck, Hypothesis) or sampled CI test suite evaluating a universal obligation serves as a valuable falsification probe. Its evidence record is stored with $\mathrm{result} = \mathrm{unresolved}$ (or provisional test pass). The cell remains a *development candidate*: the gate G3 refuses to certify universal completion, preventing agents from claiming a full mathematical guarantee while giving human reviewers exact visibility into what has been tested versus what has been formally proved.

### 4.6 Evidence separation and the three-gate structure

Every development has three independent semantic gates (refined operationally into the five protocol steps G1–G5 of §6.1: G1/G2 are provenance-and-shape duties, G3 is the behavioral gate, G4 is the preservation gate, and G5 is the atomic publication rule):

- **Provenance gate.** Every context premise $\Delta P_v$ is valid, its upstream dependencies hold, and no load-bearing premise is stale.
- **Behavioral gate.** Every active intent has valid satisfaction evidence; every decomposition has valid evidence; every decomposition edge has valid child refinement evidence; every executable cell has valid realization evidence (wiring adequacy for a non-leaf cell, program-to-machine for a leaf); the profile's initialization, input, and (where claimed) progress conditions hold.
- **Preservation gate.** Every protected obligation in the previous version's effective inventory remains active with the same semantic content, or an authorized disposition records its retirement or weakening. A support, ownership, or interpretation edit that deactivates a protected obligation is rejected.

The separation matters. A failing behavioral check does not remove the intent from $A$ (Lemma 2). A failing provenance check does not silently delete a machine. A support-only edit cannot deactivate a protected obligation without a disposition (condition 7). All failures are reported with their obligations, their evidence status, and the relevant witnesses. The version is not published until all three gates pass.

### 4.7 What the gate guarantees

For each root, the gate guarantees that the published executable behavior refines the active intents owned by that root under the declared observation profile and substrate semantics. The behavioral conclusion requires intra-DAG validity (conditions 1–6), edge refinement of §3.5, and hypotheses (A3)–(A4), including typed-edge compatibility and shared-singleton/input-delivery scope. Publication as a versioned update additionally requires protected-obligation preservation (condition 7). The guarantee is relative to:

- the admitted root intents and their authority;
- the semantic profile and the environment assumptions;
- the soundness of the evidence checkers;
- the connector admissibility proofs;
- the declared execution semantics of the leaf programs.

These are explicit premises of the behavioral guarantee and the versioned publication gate, not disclaimers. The next section makes the composition conditions explicit.

---

## 5. Decomposition and Interaction

### 5.1 Contracts are relational

A contract that constrains each child separately cannot express a correlation between children. The canonical witness is a parent that admits only the diagonal outcomes.

**Proposition 1 (Coordinate projections erase correlation).** Let the parent admit the outcome set $R = \{(0,0), (1,1)\}$ over outputs $(x,y)$. The coordinate projections are $\pi_1(R) = \{0,1\}$ and $\pi_2(R) = \{0,1\}$. Two children that independently refine the projections can jointly emit $(0,1) \notin R$.

**Proof.** $\{0,1\} \times \{0,1\}$ contains $(0,1)$, which is not in $R$. $\blacksquare$

The remedy is one of two moves: make the contract relational (a relation between child observations and shared connector state), or hoist the correlation into the connector's wiring. The calculus supports both. The point is that the parent cell must own the correlation; it cannot be pushed into independent child proofs.

### 5.2 Sibling independence

**Theorem 2 (Sibling independence).** Fix a parent cell $v \in V$ with children $\operatorname{ch}(v)$, contracts $(B_{v,c})_{c \in \operatorname{ch}(v)}$, wiring $W_v$, and parent machine $M_v$. Suppose:

1. **Child refinement.** For every $c \in \operatorname{ch}(v)$, $\alpha_{v,c}(\operatorname{beh}(M_c)) \subseteq \operatorname{beh}(B_{v,c})$, with input receptiveness and progress preservation under the profile.
2. **Connector monotonicity.** The transformer $K_v$ induced by $W_v$ is monotone.
3. **Decomposition.** $K_v(\{\operatorname{beh}(B_{v,c})\}_c) \subseteq \operatorname{beh}(M_v)$.
4. **Applicability.** The wiring's operational realization is sound for $K_v$; interaction ownership and reduction preservation hold as required by the profile.

Then

$$
K_v\bigl(\{\alpha_{v,c}(\operatorname{beh}(M_c))\}_c\bigr) \subseteq \operatorname{beh}(M_v),
$$

without constructing the concrete sibling product $\prod_c S_{M_c}$.

**Proof.** Apply the abstraction maps to the child refinements, then apply monotonicity to get $K_v(\{\alpha_{v,c}(\operatorname{beh}(M_c))\}_c) \subseteq K_v(\{\operatorname{beh}(B_{v,c})\}_c)$, and compose with the decomposition. $\blacksquare$

The theorem is the step case of Theorem 1, stated separately because it is the engineering claim. The children are verified against their contracts, never against each other. The cost of the parent check is the abstract boundary, not the concrete product.

### 5.3 Executable closure

A connector that performs stateful coordination cannot remain an unimplemented mathematical object. The calculus requires:

- the wiring $W_v$ owns only the specified composition mechanism: routing, synchronizing, interleaving, hiding;
- any stateful coordinator is a child cell with its own machine, contract, and eventual realization;
- any custom router, scheduler, or runtime adapter introduced by the implementation receives its own realization obligation or becomes an explicit substrate assumption;
- no action disappears between the mathematical composition and the executable delivery.

This rule closes the gap that otherwise lets an agent write a beautiful abstract connector and never implement it. The coordinator is refined like everything else.

### 5.4 Shared services

A service used by several branches in the DAG is declared at a selected common dominating ancestor $u \in \operatorname{Dom}(c)$ as an abstract atomic contract $O^{\mathrm{abs}}$ in the ambient context. Here, the dominator set is defined as:

$$
\operatorname{Dom}(c) = \bigl\{\, u \in V \;\big|\; \forall \text{ directed path } \pi \text{ from any root } r \in V_{\mathrm{root}} \text{ to } c,\ u \in \pi \,\bigr\}.
$$

Choose a dominating boundary that encloses all clients of the shared instance. If no such existing cell is available, explicitly extend the development by an enclosing root $r_\top$ and its decomposition over the affected roots, and discharge that new boundary's obligations; do not assume $r_\top\in V$ or identify a storage sentinel with an executable owning boundary. Clients invoke $O^{\mathrm{abs}}$ atomically without widening intermediate interfaces. The service is implemented once, as a separate subgraph, and proved to refine $O^{\mathrm{abs}}$: linearizability for safety, a progress property for liveness. This is a factoring rule, not a new judgment. A stateless both-mover service (logging, telemetry) is an admissible connector with trivial state; its certificates establish the required commutation and progress.

### 5.5 Contract factoring and capacity

A contract boundary can move history into the child and keep the connector small. In an illustrative model with $m$ idempotent resource bits and the invariant "not all $m$ are held," a naive joint recognizer over the $2^m$ bit combinations uses up to $2^m$ states ($2^m - 1$ non-violating states). With per-child two-state contracts that emit signed changes only on a genuine bit change, a connector that counts holders uses $m+1$ states ($m$ non-violating counts). The gain is architectural: the connector's state is small, and the history lives in the children. The bound is not a universal polynomial claim; the abstract boundary can still contain a product of contract states when the architecture requires it. The point is to choose the boundary so that the product is small.

### 5.6 Applicability conditions

The sibling-independence theorem is only as strong as its applicability conditions. The paper states them in the main text because they are the load-bearing assumptions:

- **Interaction ownership.** Every shared interaction has an owning boundary; children have disjoint private state.
- **Operational soundness.** The wiring model covers actual routing, synchronization, initialization, and shared-resource behavior.
- **Input and progress.** The profile's input receptiveness and progress obligations are preserved by the child refinement.
- **Reduction preservation.** When interleavings are reduced, the reduction preserves the observations of the profile.

A connector that fails one of these is outside the calculus. The failure is a proof obligation, not a silent assumption.

### 5.7 Practical integration recipes for third-party libraries and shared infrastructure

Real-world software engineering seldom builds systems from bare metal; applications ubiquitously depend on third-party libraries (`npm`, `pip`, `crates.io`), shared databases (PostgreSQL, MySQL), distributed caches (Redis), and message brokers (Kafka). The calculus provides three concrete, practical recipes for integrating these components without forcing teams to formalize external dependencies from scratch:

**Recipe 1 — Third-Party Libraries as Substrate Leaf Cells.** When an application calls an external library (e.g., cryptographic hashing, compression, HTTP parsing):
- The library is modeled as a leaf cell $\ell_{\mathrm{lib}} \in V_{\mathrm{leaf}}$ whose interface exposes only the declared call-and-return observation alphabet.
- The parent declares an abstract contract $B_{v,\mathrm{lib}}$ specifying only the functional slice invoked by the parent (e.g., `sha256(b)` returns the correct 32-byte digest; `parse_json(s)` returns a parsed AST or syntax error). Unused library features remain outside the observation alphabet.
- Realization $\operatorname{beh}(P_{\mathrm{lib}}) \subseteq \operatorname{beh}(M_{\mathrm{lib}})$ and slot refinement $\alpha_{v,\mathrm{lib}}(\operatorname{beh}(M_{\mathrm{lib}})) \subseteq \operatorname{beh}(B_{v,\mathrm{lib}})$ are either discharged via a verified implementation certificate in $E$ (e.g., HACL*, EverCrypt) or declared as an explicit substrate assumption in context premise $\Delta P_{\ell_{\mathrm{lib}}}$, rendering the root guarantee conditional on that substrate contract (analogous to `fsync` in §8.5). When conformance is a declared substrate hypothesis rather than independently certified, $E$ contains the corresponding derivation under that named hypothesis and records it in the scope; the root guarantee remains explicitly conditional on it. The same convention applies to the database-engine assumption in Recipe 2 and the durability substrate in §8.5. Application verification does not certify the external implementation's unconditional conformance.

**Recipe 2 — Shared Databases via Admissible-Input Restriction.** When an application uses an external relational database:
- The database interface is modeled as a child cell $c_{\mathrm{db}}$.
- A full relational database accepts arbitrary SQL strings, but parent $v$'s connector $W_v$ issues only a finite family of parameterized queries $A_{v,\mathrm{db}}$ (e.g., `INSERT INTO orders ...`, `SELECT balance FROM accounts WHERE id = ? FOR UPDATE`).
- By §2.2, the edge refinement is restricted to admissible input histories:
  $$
  \alpha_{v,\mathrm{db}}\bigl(\operatorname{beh}(M_{\mathrm{db}})\!\upharpoonright_{A_{v,\mathrm{db}}}\bigr) \;\subseteq\; \operatorname{beh}(B_{v,\mathrm{db}}).
  $$
- The parent wiring satisfies the admissible-input delivery premise, ensuring queries outside $A_{v,\mathrm{db}}$ cannot be emitted. The contract $B_{v,\mathrm{db}}$ formalizes only the table schema, serializable transaction semantics, and failure outcomes (e.g., unique key violation, deadlock retry), abstracting the underlying database engine (whose conformance to $M_{\mathrm{db}}$ on $A_{v,\mathrm{db}}$ is either certified against a formal engine model in $E$ or recorded as an explicit substrate assumption in $\Delta P_{c_{\mathrm{db}}}$).

**Recipe 3 — Shared Stateful Infrastructure and Dominating Ancestors.** When multiple parallel subsystems share a single runtime singleton (e.g., a shared connection pool, rate limiter, or distributed lock):
- Independent per-child contracts cannot soundly express correlated shared-state side effects (Proposition 1 and Proposition 2).
- The shared singleton is scoped at a common dominating ancestor $u \in \operatorname{Dom}(c)$ (or at enclosing ambient root $r_\top$) via an abstract atomic contract $O^{\mathrm{abs}}$ (§5.4).
- Intermediate clients may interact through private session handles, but the owning boundary retains the aggregate multi-client history. A linearizability or serializability certificate justifies replacement by the declared aggregate abstract service; it does not by itself establish sibling non-interference. The owning connector and incoming slot contracts must permit the resulting interleavings, and every client's guarantee must hold under those interleavings. Incompatible isolated-client guarantees are rejected rather than justified by the service certificate.

---

## 6. The Development Protocol

### 6.1 The five gates

The protocol is the operational reading of validity. An agent may publish a version only when all five gates pass.

**G1 — Read the context (process duty).** Before proposing a change at a cell $v$, the agent reads the cell's context premises $\Delta P_v$, its active intents $A(v)$, support links $J$, incoming contracts, outgoing decomposition $\chi(v)$, and the cut/subgraph view in which $v$ participates. This is a process obligation on the agent; G2–G5 are checked by the gate.

**G2 — No abstraction skip.** A machine at child cell $c$ is introduced only as a child of a contract already declared in some decomposition record $\chi(v)$. The agent cannot write leaf code without first fixing the contract it must satisfy. This is the direct block on the wide abstraction leap.

**G3 — Evidence required.** Acceptance of a cell requires valid satisfaction evidence for every active intent assigned to it and valid executable-realization evidence: for a non-leaf cell, the universal wiring-adequacy certificate of condition 5; for a leaf, the program-to-machine inclusion. A non-leaf cell also requires valid decomposition evidence. Acceptance of a decomposition edge requires valid child refinement evidence. A test is evidence only for the claim it can establish. A weakened test weakens the claim, not the obligation; the universal obligation remains active and unsatisfied.

**G4 — No silent specification weakening.** Root and protected intents and contracts can be changed only through an authorized revision that creates a new version and reopens the dependent context premises. The agent may propose a revision; it cannot apply one as part of a code change. A support, ownership, or interpretation edit that deactivates a protected obligation counts as a specification weakening and requires an authorized disposition. The authorization record is part of the version.

**G5 — Atomic publication.** A version is published only when every obligation in the affected dependency cone has valid pass evidence. Incomplete subgraphs are not publishable. Missing, unresolved, or pending evidence is not a pass, and a failed local verification cannot be hidden by a successful build elsewhere.

### 6.2 The authoring cycle

The agent's authoring cycle is:

1. **Read.** Load the cell's cut inspection view and incoming slot contracts.
2. **Context.** For each cell, record context premises $\Delta P_v$ with upstream dependencies, alternatives, rationale, and reopening conditions. An edit that changes a protected item requires an authorized revision.
3. **Model.** Propose the cell's machine $M_v$. The machine must satisfy the active intents assigned to the cell.
4. **Decompose.** For an internal cell, declare the wiring skeleton and child contracts, and discharge the decomposition and wiring-adequacy obligations.
5. **Assign.** Hand each child contract to the child cell. The child may be developed independently within its contract.
6. **Substitute.** When a child is complete, substitute its refinement proof into the parent's decomposition. Close the parent only when all child edges are discharged.

A locally checked design with unresolved descendants remains a **development candidate**. The completed-system gate quantifies over all required cells, decompositions, and executable artifacts.

### 6.3 What the agent may and may not change

| Artifact | Agent may | Agent may not |
|---|---|---|
| Delegated intent | refine, strengthen, add a child intent, or retire with recorded rationale in version provenance | weaken a parent-assigned boundary contract or protected obligation without an authorized revision |
| Protected intent | propose a revision with rationale and reopening | apply the revision, downgrade its authority, or deactivate it via a support/ownership edit, without an authorized disposition |
| Root intent | implement it | silently weaken, reinterpret, or deactivate it |
| Contract | refine the child implementation; propose a contract revision | change the contract to make a failing child pass |
| Context premise | add, re-warrant, or reopen with rationale | erase the alternatives or the rationale |
| Machine | choose any implementation within the contract | declare a contract that the parent decomposition does not support |
| Evidence | add evidence for the exact obligation | substitute a weaker claim for a stronger obligation |

### 6.4 Test weakening, intent revision, and authority

The test-weakening failure is blocked by the evidence discipline. A test is a decision procedure for a bounded or sampled claim. It cannot discharge a universal inclusion unless it is exhaustive for the relevant finite domain. If the agent deletes an assertion, the remaining test establishes a weaker claim; the universal obligation is still active, and the gate reports it as unsatisfied. The only way to remove the obligation is an authorized intent revision or disposition, which reopens the dependent context premises. A support, ownership, or interpretation edit that removes a protected obligation is a removal even when the predicate bytes are unchanged; it requires the same authorized disposition.

The authority tags make this concrete:

- **Root intents** are admitted by the owner at version creation.
- **Protected intents and contracts** require an explicit authorization record to change.
- **Delegated intents** may be refined by the agent within the protected boundary.

The authorization record is not a separate governance mechanism. It is a field of the version, checked by the same gate.

### 6.5 A transcript of a caught error

1. The requirement says: acknowledge a request only after its result is durable.
2. The agent writes a store that emits `committed` after `write` returns.
3. The refinement check for the store contract returns the trace `append, committed` with no `flush_ok`/`fsync`.
4. The evidence record is fail. The store contract remains active.
5. The agent either adds the flush before `committed` (downward repair at the leaf program) or, if the substrate cannot support the required durability, introduces a supported flush protocol and implements it, or obtains an authorized revision of the substrate/requirement premise and reopens the store decomposition.
6. The version is published only after the new evidence passes and the reopen path is recorded.

The next section gives the full example.

---

## 7. Versioned Evolution and Top-Down Projection

### 7.1 Versioned Refinement DAGs

Let $\mathcal{U}_{\mathrm{cell}}$ be a shared universe of immutable cell interfaces, state machines, and wiring specifications. A versioned system is mathematically defined as a version-indexed sequence of Refinement DAG developments

$$
\{G_t\}_{t \in \mathbb{N}}
$$

over this universe. Each version

$$
G_t = \bigl(V^{(t)},\ \mathcal{M}_t,\ \chi_t,\ I^{(t)},\ J^{(t)},\ E_t,\ \mathcal{A}_t\bigr)
$$

is an immutable Refinement DAG at evolution epoch $t$, accompanied by its authorization record $\mathcal{A}_t$ for protected revisions. Each active cell $v \in V^{(t)}$ carries:

1. a **local model** $\mathcal{M}_t(v) = \bigl(\mathcal{O}_{X_{t,v}}, \Phi^{(t)}(v), M_v^{(t)}, \Gamma_v^{(t)}\bigr)$, comprising its observation space at versioned interface $X_{t,v}$, active intent conjunction, state machine, and semantic context $\Gamma_v^{(t)}$;
2. a **typed decomposition record** $\chi_t(v) = \bigl(W_{t,v}, \operatorname{ch}_t(v), (B_{t,v,c}, \alpha_{t,v,c})_{c \in \operatorname{ch}_t(v)}\bigr)$ for non-leaf $v$, specifying its wiring skeleton $W_{t,v}$, children $\operatorname{ch}_t(v) \subseteq V^{(t)}$, child contracts $B_{t,v,c}$ at slot interfaces $X_{t,v,c}$, child context profiles $\Gamma_{t,c}$, and child edge abstraction maps $\alpha_{t,v,c}$. At epoch $t$, concrete wiring implementation $C_{t,v}$ realizes connector transformer $K_{t,v} = K_{W_{t,v}}$.

Structural evolution from version $t$ to version $t+1$ is modeled as an update of the versioned record $(V^{(t)}, \mathcal{M}_t, \chi_t, I^{(t)}, J^{(t)}, E_t, \mathcal{A}_t)$ on an affected subgraph, preserving unchanged components by mathematical identity; splits and merges additionally update $V$ and $\operatorname{ch}$. All canonical structural transformations are represented uniformly:

- **$1 \to 1$ modification.** A cell $v$ modifies its internal machine $M_v^{(t+1)}$ or modifies an incoming contract $B_{v,c}$, while the child set $\operatorname{ch}_{t+1}(v) = \operatorname{ch}_t(v)$ remains isomorphic.
- **$1 \to M$ splitting.** A single cell $c \in \operatorname{ch}_t(v)$ is partitioned into $M$ finer-grained modular children $\{c_1, \ldots, c_M\} \subset V^{(t+1)}$, updating parent wiring $W_{t+1,v}$ and assigning individual child contracts $B_{t+1,v,c_j}$.
- **$N \to 1$ merging.** Multiple sibling components $\{c_1, \ldots, c_N\} \subset \operatorname{ch}_t(v)$ are consolidated into a single unified child cell $c^* \in V^{(t+1)}$, collapsing sibling contracts into a single interface.
- **Cross-boundary $N \to M$ refactoring.** Restructuring component boundaries across multiple cells is represented directly by updating $\chi_{t+1}$ on the affected sub-DAG.

**Abandonment and rollback.** An unsuccessful or discarded candidate version $t$ is reverted by defining $G_{t+1} = G_s$ on the reverted components, where $s < t$ is the chosen historical checkpoint. Every version lives uniformly in the sequence $\{G_t\}_{t \in \mathbb{N}}$, and the active system at epoch $t$ is $G_t$.

### 7.2 Contextual intent projection and property-driven refinement

When a requirement evolves or a new capability is introduced, intent propagation proceeds top-down along the DAG from roots through successive child edges. At each step, an agent refines an incoming component requirement by decomposing it into sibling contracts under local domain premises.

**Definition (Contextual Intent Projection).** Let cell $v \in V^{(t)}$ have an active component requirement $R_v \subseteq \mathcal{O}_{X_v}$ and local context premises $\Delta P_v$ (encapsulating domain axioms, maintained state invariants, or declared workload conditions). A decomposition $\chi_{t+1}(v) = \bigl(W_{t+1,v}, \operatorname{ch}_{t+1}(v), (B_{t+1,v,c}, \alpha_{t+1,v,c})_{c \in \operatorname{ch}_{t+1}(v)}\bigr)$ is a **valid contextual projection** of $R_v$ under $\Delta P_v$ iff

$$
\Delta P_v \implies K_{W_{t+1,v}}\Bigl(\bigl\{\operatorname{beh}(B_{t+1,v,c})\bigr\}_{c \in \operatorname{ch}_{t+1}(v)}\Bigr) \subseteq R_v .
$$

**Residual Conservation Law.** The child contracts $\{B_{t+1,v,c}\}_{c \in \operatorname{ch}_{t+1}(v)}$ *are* the residual obligations passed down to children. When cell $v$ extracts no intermediate abstraction, the projection is the identity pass-through $B_{t+1,v,c} = R_v$ with a single child. The inclusion guarantees conservation of intent across abstraction boundaries: an agent cannot satisfy an abstract goal by relaxing a binding mechanism requirement without explicitly discharging the residual constraint in the child cells.

Maintained behavioral invariants are enforced as subset inclusions across sibling contracts and connector wiring, whereas environmental and workload premises are recorded in $\Delta P_v$. If operational workload or environment assumptions shift, premise $\Delta P_v$ becomes stale, triggering targeted reopening of the local decomposition without invalidating orthogonal verified components.

### 7.3 Exact obligation propositions and the incremental frame theorem

Let $G_t$ be a Refinement DAG. The required behavioral-inclusion obligations from §3.4–3.5 form a finite inventory of exact scoped propositions; structural, context, profile, and protected-preservation conditions remain separate premises:

$$
\operatorname{Req}(G_t) = \operatorname{Sat}(G_t) \cup \operatorname{Wire}(G_t) \cup \operatorname{Dec}(G_t) \cup \operatorname{Ref}(G_t) \cup \operatorname{Impl}(G_t),
$$

where each constituent proposition is fully determined by its semantic operands:

- $\operatorname{Sat}(v, c) := \bigl(\operatorname{beh}(M_v^{(t)}) \subseteq \llbracket c \rrbracket \text{ under } \Gamma_v^{(t)}\bigr)$ for $v \in V^{(t)}, c \in A^{(t)}(v)$;
- $\operatorname{Wire}(v) := \Bigl(\forall (Q_c)_{c \in \operatorname{ch}_t(v)}.\ \bigl(\forall c \in \operatorname{ch}_t(v).\ Q_c \text{ is admissible for } X_{t,c}, \Gamma_{t,c}\bigr) \implies \operatorname{Beh}(C_{t,v}[Q_c]) \subseteq K_{t,v}\bigl(\{\alpha_{t,v,c}(Q_c\!\upharpoonright_{A_{t,v,c}})\}_c\bigr)\Bigr)$ for non-leaf $v \in V^{(t)}$ (in the restricted case, $\operatorname{Wire}(v)$ is evaluated under the delivery premise of (A4), so the right-hand restriction to $A_{t,v,c}$ reflects the delivered input histories);
- $\operatorname{Dec}(v) := \bigl(K_{t,v}(\{\operatorname{beh}(B_{t,v,c})\}_{c \in \operatorname{ch}_t(v)}) \subseteq \operatorname{beh}(M_v^{(t)}) \text{ under } \Gamma_v^{(t)}\bigr)$ for non-leaf $v \in V^{(t)}$;
- $\operatorname{Ref}(v, c) := \bigl(\alpha_{t,v,c}(\operatorname{beh}(M_c^{(t)})\!\upharpoonright_{A_{t,v,c}}) \subseteq \operatorname{beh}(B_{t,v,c}) \text{ under } \Gamma_{t,c}\bigr)$ for $v \in V^{(t)}, c \in \operatorname{ch}_t(v)$ (with $A_{t,v,c} = \mathcal{H}_{X_{t,c}}^{\mathrm{in}}$ for unrestricted edges);
- $\operatorname{Impl}(\ell) := \bigl(\operatorname{beh}(P_\ell^{(t)}) \subseteq \operatorname{beh}(M_\ell^{(t)}) \text{ under } \Gamma_\ell^{(t)}\bigr)$ for leaf $\ell \in V_{\mathrm{leaf}}^{(t)}$.

For a development version $G_t$, a proposition $q \in \operatorname{Req}(G_t)$ holds in version $t$, written $\operatorname{Holds}_t(q)$, when its behavioral inclusion is mathematically satisfied and witnessed by a valid evidence record in $E_t$ (§4.5).

**Theorem 3 (Incremental Frame and Verification Cutoff).** Let $G_t$ satisfy intra-DAG validity (§3.4, conditions 1–6) and every edge-refinement obligation of §3.5, with valid applicable evidence for all $q\in\operatorname{Req}(G_t)$, and let $G_{t+1}$ be a candidate Refinement DAG satisfying conditions 1–2 and 6–7 of §3.4 (support/context, profile admissibility, and protected preservation) together with hypotheses (A3)–(A4) of Theorem 1, where evidence for unchanged obligations $q \in \operatorname{Req}(G_{t+1}) \cap \operatorname{Req}(G_t)$ is carried over by identity into $E_{t+1}$ ($E_{t+1}(q) = E_t(q)$) with preserved scope applicability. If every newly introduced or modified obligation in the set difference holds in $G_{t+1}$:

$$
\forall q \in \operatorname{Req}(G_{t+1}) \setminus \operatorname{Req}(G_t),\quad \operatorname{Holds}_{t+1}(q),
$$

Then every obligation in $\operatorname{Req}(G_{t+1})$ holds in $G_{t+1}$:
$$
\forall q\in\operatorname{Req}(G_{t+1}),\quad \operatorname{Holds}_{t+1}(q).
$$
The candidate $G_{t+1}$ satisfies intra-DAG validity (conditions 1–6) and edge refinement of §3.5. Together with the assumed hypotheses (A3)–(A4), Theorem 1 gives, for every $r\in V_{\mathrm{root}}^{(t+1)}$,
$$
\operatorname{Beh}_{\mathrm{exec}}(r)\subseteq\Phi(r),
$$
where $\Phi(r)$ is the conjunction of the active intents owned by $r$ in $G_{t+1}$. The separately assumed condition 7 supplies protected-obligation preservation for the versioned update.

**Proof.** Partition $\operatorname{Req}(G_{t+1})$ into two disjoint subsets:

$$
\operatorname{Req}(G_{t+1}) = \bigl(\operatorname{Req}(G_{t+1}) \cap \operatorname{Req}(G_t)\bigr) \;\cup\; \bigl(\operatorname{Req}(G_{t+1}) \setminus \operatorname{Req}(G_t)\bigr).
$$

For any $q \in \operatorname{Req}(G_{t+1}) \cap \operatorname{Req}(G_t)$, $q$ was an obligation of $G_t$. By the explicit old-version evidence premise, $\operatorname{Holds}_t(q)$ is witnessed by valid evidence $E_t(q)$ with applicable scope. Because $q$ is identical in semantic operands, $E_t(q)$ carried over to $E_{t+1}(q)$ remains valid and applicable, giving $\operatorname{Holds}_{t+1}(q)$. For any $q \in \operatorname{Req}(G_{t+1}) \setminus \operatorname{Req}(G_t)$, the hypothesis directly asserts $\operatorname{Holds}_{t+1}(q)$. Thus every obligation $q \in \operatorname{Req}(G_{t+1})$ holds in $G_{t+1}$. Combined with conditions 1–2, 6–7, and hypotheses (A3)–(A4), $G_{t+1}$ satisfies all validity conditions 1–7 of §3.4 and edge refinement of §3.5. By Theorem 1 (Refinement-DAG Soundness), $\operatorname{Beh}_{\mathrm{exec}}(r) \subseteq \Phi(r)$ for all roots $r \in V_{\mathrm{root}}^{(t+1)}$. $\blacksquare$

**Corollary 2 (Interface Cutoff).** Let $G_t$ satisfy the old-development premises of Theorem 3. Suppose a sub-development region $U_{\mathrm{mod}} \subseteq V$ is replaced by an updated region while, for every external boundary parent $u \notin U_{\mathrm{mod}}$ with an incoming edge $(u, w)$ into $w \in U_{\mathrm{mod}}$, preserving the incoming slot contract $B_{u,w}$, concrete wiring $C_u$, wiring skeleton $W_u$, parent machine $M_u$, abstraction map $\alpha_{u,w}$, admissible-input restriction $A_{u,w}$, contexts, active intent sets $A(u)$ (and predicates $\llbracket c \rrbracket$ for $c \in A(u)$), and sibling contracts outside $U_{\mathrm{mod}}$. Then:

1. for every external boundary parent $u \notin U_{\mathrm{mod}}$, $\operatorname{Dec}(u)$, $\operatorname{Wire}(u)$, $\operatorname{Sat}(u, c)$ for $c \in A^{(t+1)}(u) \cap A^{(t)}(u)$ with unchanged $\llbracket c \rrbracket$ and $\Gamma_u$, and all other operand-unchanged obligations outside $U_{\mathrm{mod}}$ (excluding changed incoming-boundary refinements or newly activated satisfaction obligations covered by clause 2) belong to $\operatorname{Req}(G_{t+1}) \cap \operatorname{Req}(G_t)$ and permit **reuse without solver re-execution for those unchanged propositions** when evidence identity and scope applicability are honored;
2. incoming boundary refinements, internal obligations, and any satisfaction obligations for newly activated or modified intents (including on owners outside $U_{\mathrm{mod}}$ when support links $J$ or intent records $I$ change) must be regenerated from the new semantic records. Every resulting obligation absent from $\operatorname{Req}(G_t)$ belongs to the set difference and must be discharged; an obligation already present may reuse its evidence only after exact scoped identity and continued applicability are established. A changed artifact name or representation alone does not establish semantic inequality.

For structural splits ($1 \to M$) or merges ($N \to 1$) of internal cells, the preserved interface cutoff applies at the bounding parent whose incoming contract and external wiring remain invariant; the direct parent whose child-slot signature or decomposition changes re-discharges its modified $\operatorname{Dec}$ and $\operatorname{Wire}$ obligations while ancestors above it are pruned from solver re-execution.

The following table lists the obligation families potentially affected by each transformation; actual fresh obligations are determined by exact scoped identity, not merely by the transformation label:

| Transformation | Changed Propositions ($\operatorname{Req}(G_{t+1}) \setminus \operatorname{Req}(G_t)$) | Reused by Identity ($\operatorname{Req}(G_{t+1}) \cap \operatorname{Req}(G_t)$) |
|---|---|---|
| **Leaf Code Update** ($P_\ell \to P'_\ell$, $M_\ell$ fixed) | $\operatorname{Impl}(\ell)$ | Incoming edge $\operatorname{Ref}(v, \ell)$, parent $\operatorname{Dec}(v)$, $\operatorname{Wire}(v)$, and all ancestors |
| **Region / Child Model Refinement** ($M_w \to M'_w$ for $w \in U_{\mathrm{mod}}$, external $B_{u,w}$ fixed) | Internal obligations of $U_{\mathrm{mod}}$ and incoming $\operatorname{Ref}(u, w)$ for all external parents $u \notin U_{\mathrm{mod}}$ | External boundary parents' $\operatorname{Dec}(u)$, $\operatorname{Wire}(u)$, $\operatorname{Sat}(u,\cdot)$, and all strict ancestors |
| **Internal Split / Merge** ($1 \to M$ or $N \to 1$ inside $v$) | Cell $v$'s own $\operatorname{Dec}(v)$, $\operatorname{Wire}(v)$, and new child $\operatorname{Ref}(v, c_j)$ | Ancestors above $v$ whose external contracts and wiring are invariant |
| **Public Contract Change** ($B_{u,c} \to B'_{u,c}$) | Parent $\operatorname{Dec}(u)$ and edge refinement $\operatorname{Ref}(u, c)$ | Unaffected sibling subtrees and independent ancestor properties |

**Engineering Implication: CI/CD Semantic Proposition Caching vs. Syntactic File Invalidation.** Build systems (Bazel, Buck2, Turborepo, Nx) invalidate caches when source file bytes change:
- *Spurious cache invalidation.* When an engineer refactors an internal algorithm, renames a private helper, or splits an internal module ($1 \to M$) while preserving the external contract $B_{u,w}$, syntactic file changes force CI to re-verify downstream dependents across the repository.
- *Blind interface changes.* Syntactic file diffs do not distinguish a cosmetic comment edit from a breaking contract modification.

Theorem 3 and Corollary 2 support **semantic proposition caching**:
- Proposition identity is determined by equality of the typed semantic operands of each obligation tuple ($\operatorname{Sat}$, $\operatorname{Wire}$, $\operatorname{Dec}$, $\operatorname{Ref}$, $\operatorname{Impl}$), independent of source whitespace or comments.
- In an internal refactoring of $U_{\mathrm{mod}}$ preserving all external boundary contracts $B_{u,w}$ and wirings, $\operatorname{Req}(G_{t+1}) \setminus \operatorname{Req}(G_t)$ isolates only the modified internal propositions, incoming boundary edge refinements $\operatorname{Ref}(u,w)$, and leaf realizations. Once operand equality and continued evidence-scope applicability are checked, all external ancestor decompositions, wiring certificates, and root satisfaction obligations in $\operatorname{Req}(G_{t+1}) \cap \operatorname{Req}(G_t)$ permit **reuse without solver re-execution**.
- When an interface contract is revised ($B_{u,c} \neq B'_{u,c}$), the set difference $\operatorname{Req}(G_{t+1}) \setminus \operatorname{Req}(G_t)$ identifies the exact formal decomposition and edge-refinement obligations affected by slot $(u,c)$.

### 7.4 Implementation remark: persistent outgoing-edge containers

One implementation of version-indexed records is an append-only history indexed by stable cell identity and write epoch. A read of cell $v$ at epoch $T$ selects its newest record written at or before $T$; the record includes the versioned local model and decomposition or leaf realization. Immutable payloads may be shared without copying the refinement-DAG ancestor spine. This is an epoch-indexed indirection scheme, not a claim that ordinary immutable arrays or lists alone eliminate path copying.

- **Localized update.** Append new records for the cells whose semantic records change, and publish the new epoch only after the validity and preservation gates pass.
- **Rollback and historical inspection.** A current-epoch rollback can append the selected historical records for the reverted cells. An explicit subtree snapshot override $\mathrm{snap}=s$ is valid only if every path to a given logical cell in the resulting development resolves that cell to the same record. If a reverted region shares a descendant with a non-reverted branch, reconcile that shared cell and recheck all affected incoming boundaries, or introduce distinct cell identities only when distinct runtime instances are intended and authorized. A snapshot override cannot silently duplicate a stateful singleton.

### 7.5 The evolution loop

The evolution function

$$
G_{t+1} = \operatorname{evolve}(G_t, \Delta I)
$$

computes a candidate development from an accepted delta $\Delta I$, returning **Verified**, **Conflict**, or **Unresolved**. There is no default-to-pass.

**Step 1 — Apply and reactivate.** Apply $\Delta I$: a new root intent, an updated context premise, an authorized revision, or a contract adjustment. Recompute active intents $A$ via topological support evaluation. Evaluate affected context premises $\Delta P_v$ against upstream models and verify mutual compatibility. Mark stale components by reachability along $\Delta P_v^*$. If context premises conflict, return **Conflict** with the conflicting premises and rationales; stop before initiating machine search.

**Step 2 — Locate.** Walk the DAG in topological order, evaluating only the newly introduced or modified obligations in the set difference $\operatorname{Req}(G_{t+1}) \setminus \operatorname{Req}(G_t)$. The result of each check is one of: **pass**, **fail** with a semantic counterexample, **failed proof witness** (e.g., an inductive invariant or simulation relation that failed), or **unresolved** (timeout or resource exhaustion). Let $j$ be the first cell at which an obligation does not pass. Passing the set-difference checks establishes only the changed behavioral obligations; it does not authorize publication without Step 4's remaining checks.

**Step 3 — Repair at $j$.** The check result determines the repair strategy:

- **Semantic counterexample.** Identify its level: a machine execution can refute satisfaction, a contract trajectory can refute decomposition, and a concrete executable execution can refute realization or the runtime requirement. Repair the artifact whose declared obligation is violated. A witness feasible in abstract child models is not automatically a genuine executable counterexample; use the joint-feasibility test below and, when claiming runtime genuineness, a concrete joint execution witness. Re-establish every affected obligation and boundary refinement.
- **Semantic counterexample, spurious child refinement.** The child's model or abstraction overapproximates: it admits behavior the fixed child implementation cannot produce. Repair the child model or its abstraction map by narrowing the abstraction, and re-establish the lower realization and upper refinement. Narrowing the parent-side contract for a fixed child abstraction makes the inclusion harder and cannot remove the spurious behavior.
- **Semantic counterexample, spurious decomposition.** The parent-side child contract is too permissive and the concrete children satisfy a stronger contract. Narrow the parent-side child contract or repair the connector, and re-establish the decomposition. If the concrete children do not satisfy the stronger contract, the repair belongs to the children.
- **Failed proof witness.** An inductive invariant or simulation relation failed. Strengthen or repair the witness and recheck. This is a proof-search outcome, not a semantic counterexample and not a machine edit by itself.
- **Unresolved.** The checker timed out or returned unknown. Return **Unresolved**; do not classify as genuine or spurious, and do not publish.

For a refinement failure, the discrete set example is decisive: implementation $\{ok\}$, child abstraction $\{ok,bad\}$, parent contract $\{ok\}$. The implementation satisfies the contract, but the abstraction admits $bad$. No stronger parent contract repairs the fixed child abstraction; narrowing the child abstraction to $\{ok\}$ does. A child refinement failure is never repaired by strengthening the parent-side contract alone.

The following test checks joint feasibility of a decomposition counterexample in the child models, not necessarily in the executable system:

$$
\exists r.\
\operatorname{legal}_{W_v}(r)
\ \wedge\ \operatorname{obs}_v(r) = \tau
\ \wedge\ \forall c \in \operatorname{ch}(v).\ \operatorname{realizable}_{v,c}\bigl(M_c, \operatorname{slice}_c(r)\bigr),
$$

Here $\operatorname{realizable}_{v,c}(M_c,o)\iff o\in\alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}})$ denotes model-level slice membership. A satisfying shared trajectory establishes $\tau\in K_v(\{\alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}})\}_c)$ for the trajectory connector. It does not, from one-way wiring adequacy, establish $\tau\in\operatorname{Beh}_{\mathrm{exec}}(v)$. Runtime genuineness requires a concrete joint execution witness, or an additional completeness result relating the chosen joint trajectory model to the concrete composition. A failed shared-trajectory test establishes infeasibility in these child models; an unknown result remains unresolved. Separate existential trajectories for different children cannot replace the shared witness.

**Step 4 — Publish.** Atomically install $G_{t+1}$ only after all premises of Theorem 3 have been checked: conditions 1–2 and 6–7, hypotheses (A3)–(A4), valid evidence for every obligation in $\operatorname{Req}(G_{t+1})\setminus\operatorname{Req}(G_t)$, and identity-preserving evidence carryover with continued scope applicability for every obligation in the intersection. The five development gates, including authorization of protected revisions, must also pass. Record the verified authorization record $\mathcal{A}_{t+1}$ with the publication. Otherwise retain the candidate and report the unmet condition and its evidence; an unresolved check remains **Unresolved**, and a premise conflict is **Conflict**.

### 7.6 Genuine vs. spurious

**Proposition 2 (Separate realizations do not imply a joint realization).** There are two child contracts, one requiring a shared bit (fixed per trajectory) to be $0$ and one requiring it to be $1$, such that each is separately realizable but no common trajectory realizes both.

**Proof.** Let each trajectory carry a single fixed shared bit value $b \in \{0,1\}$. Child 1 is realizable only with $b = 0$; child 2 is realizable only with $b = 1$. Each existential check succeeds with a different value of $b$. No single trajectory $r$ has both $b = 0$ and $b = 1$. $\blacksquare$

The proposition rules out using separate per-child witnesses as a certificate of joint realizability. A connector may soundly overapproximate shared-state behavior, but such an overapproximation can admit spurious counterexamples; correlations needed for acceptance must be established at the owning boundary.

### 7.7 Staleness and reopening

A change to an intent, contract, or context premise activates its dependency cone along $\Delta P_v^*$. Every cell in the cone is stale until re-warranted. A reopened design alternative becomes selectable again under updated context premises; selecting it creates an updated decomposition with its own context and evidence. Prior versions remain in the history $\{G_t\}$, preserving the audit trail.

The dependency cone is computed on the reference graph of semantic operands, not on physical storage pointers. An internal implementation change with an unchanged semantic contract does not activate the cone. This is the practical benefit of grounding obligations directly in semantic proposition identity: unchanged boundaries immediately prune propagation, keeping the verified blast radius strictly localized to the modified subgraph.

---

## 8. End-to-End Example: Durable Acknowledgement

### 8.1 The requirement and scope

The system instance serves one request. The environment precondition is: at most one `req(id)` is delivered to an instance, and the instance is not reused after `ack` or `fail`. A reusable service needs a reset transition and matching contracts; that variant is outside this example.

The declared safety intent is:

- **Concrete safety requirement.** An `ack(id)` is emitted only after the store has emitted `flush_ok(id)` and then `committed(id)` for that request. At the root observation interface the corresponding intent $\Phi(v_0)$ is "every `ack(id)` is preceded by `commit_ok(id)`." The connector observation map and the store's substrate contract establish the relation between these two statements below.

The liveness claim is separate and conditional:

- **Conditional liveness.** If the scheduler is fair, the store responds to every `append(id)` with `flush_ok(id)` or `flush_fail(id)`, and the coordinator is fair, then every `req(id)` is eventually followed by `ack(id)` or `fail(id)`.

The safety proof does not establish conditional liveness. Liveness is discharged only under those premises, which are recorded in the profile of the coordinator and store cells. The leaf runtime is run-to-completion, non-reentrant, with a FIFO event queue: `emit` enqueues an event and returns; the current handler completes before the next event is dispatched. Initialization is coordinator state `idle` and store state `empty`. The reentrant interpretation is outside this example; §8.5 also places the coordinator in `appending` before `append` is emitted, so a reentrant response is not discarded.

The architecture is a two-level Refinement DAG: root cell $v_0$ decomposes into children $\operatorname{ch}(v_0) = \{\mathrm{coord}, \mathrm{store}\}$, both of which are leaf cells ($\operatorname{ch}(\mathrm{coord}) = \operatorname{ch}(\mathrm{store}) = \emptyset$) realized directly by executable programs $P_{\mathrm{coord}}$ and $P_{\mathrm{store}}$.

### 8.2 Root cell: the abstract design

**Event-step convention for this example.** Each displayed arrow carrying an event label and an additional output is shorthand for two transitions through a fresh intermediate control location: first the labeled event, then the additional output event. This applies whether the first event is an input or an output. An arrow labeled $\tau$ with an output similarly includes a separate output step. The printed state lists name the principal states; the intermediate control locations are implicit. Each actual transition has one event label, as in §2.1, and finite traces include prefixes ending between these event steps. A run-to-completion handler may execute several such steps without dispatching another input handler. Simulation relations use program control locations as well as the illustrative state variable.

The root cell $v_0$ has the machine $M_0$:

- states: `idle`, `pending(id)`, `durable(id)`, `acked(id)`;
- transitions:
  - `idle --req(id)--> pending(id)`;
  - `pending(id) --commit_ok(id)--> durable(id)`;
  - `pending(id) --commit_fail(id)--> acked(id)` with output `fail(id)`;
  - `durable(id) --tau--> acked(id)` with output `ack(id)`.

The root has no transition out of `acked(id)`, matching the single-use precondition. It satisfies the root intent "ack only after commit_ok" by construction. The concrete durability requirement follows from the connector projection, the coordinator's acknowledgement ordering, the store contract's flush-before-committed ordering, and the substrate interpretation of `flush_ok`; it is not established merely by the name of the root state. Conditional liveness remains a separate obligation under the stated fairness and enabling premises.

The root context premises $\Delta P_{v_0}$ record why the design separates durability from acknowledgement: the alternative of acknowledging on enqueue was rejected because it treats a volatile queue as durable; the reopening condition is a substrate that provides a durable atomic enqueue.

### 8.3 Root decomposition

The root cell $v_0$ declares two children: a coordinator `coord` and a durable store `store`. The wiring $W_0$ routes:

- `req(id)` from the environment to `coord`;
- `append(id)` from `coord` to `store`;
- `committed(id)` and `failed(id)` from `store` to `coord`;
- `ack(id)` and `fail(id)` from `coord` to the environment.

The store's boundary also exposes `flush_ok(id)` and `flush_fail(id)`; the wiring routes them to the environment observer that witnesses durability. The edge abstractions $\alpha_{0,\mathrm{coord}}$ and $\alpha_{0,\mathrm{store}}$ are identities on their respective boundary trace alphabets; in particular the store proof boundary retains `flush_ok` and `flush_fail`. Separately, define the connector's root observation map $\operatorname{obs}_0$ on every finite composition trace by mapping `flush_ok(id)` to `commit_ok(id)` and `flush_fail(id)` to `commit_fail(id)`, retaining `req`, `ack`, and `fail`, and erasing `append`, `committed`, and `failed`. This is the connector projection of §2.3, not a child-edge abstraction. The observer may inspect the richer store trace even though the root interface uses the abstract commit events.

The contracts are:

**$B_{0,\mathrm{coord}}$** — inputs `req(id)`, `committed(id)`, `failed(id)`; outputs `append(id)`, `ack(id)`, `fail(id)`. Duties: at most one `req(id)` per instance; no second request after `ack` or `fail`; `append(id)` may follow `req(id)`; `ack(id)` only after `committed(id)`; `fail(id)` only after `failed(id)`. Conditional progress: under fair coordinator scheduling and a store response, every `req(id)` eventually receives `ack(id)` or `fail(id)`.

**$B_{0,\mathrm{store}}$** — inputs `append(id)`; observable outputs `flush_ok(id)`, `flush_fail(id)`, `committed(id)`, `failed(id)`. Duties: at most one `append(id)` per instance; `committed(id)` only after `flush_ok(id)`; `flush_ok(id)` is the substrate's durability event; `failed(id)` only after `flush_fail(id)`. Conditional progress: under the substrate's fairness, every `append(id)` eventually receives `flush_ok(id)` or `flush_fail(id)` and then `committed(id)` or `failed(id)`.

The contracts are not merely necessary ordering duties. Their trace languages are the prefix closures (where $\operatorname{pref}(L) = \{u \mid \exists w.\ uw \in L\}$ denotes the prefix closure of trace set $L$), with one identifier per instance, alongside the root machine's trace language $L_0$. Each displayed $id$-indexed language is understood as the union over the permitted identifier domain:

$$
\begin{aligned}
L_{\mathrm{coord}} &= \operatorname{pref}(\texttt{req}(id)\,\texttt{append}(id)\,\texttt{committed}(id)\,\texttt{ack}(id)) \cup \operatorname{pref}(\texttt{req}(id)\,\texttt{append}(id)\,\texttt{failed}(id)\,\texttt{fail}(id)), \\
L_{\mathrm{store}} &= \operatorname{pref}(\texttt{append}(id)\,\texttt{flush\_ok}(id)\,\texttt{committed}(id)) \cup \operatorname{pref}(\texttt{append}(id)\,\texttt{flush\_fail}(id)\,\texttt{failed}(id)), \\
L_0 &= \operatorname{pref}(\texttt{req}(id)\,\texttt{commit\_ok}(id)\,\texttt{ack}(id)) \cup \operatorname{pref}(\texttt{req}(id)\,\texttt{commit\_fail}(id)\,\texttt{fail}(id)).
\end{aligned}
$$

The prefix closure ends at `ack` or `fail`; a second `ack`, a spontaneous output, or an incompatible continuation is not in $L_{\mathrm{coord}}$. The duplicate-ack composition trace `req, append, flush_ok, committed, ack, ack` projects onto the coordinator alphabet as `req, append, committed, ack, ack`, which is not in the prefix closure $L_{\mathrm{coord}}$; the composition trace is therefore excluded by the contract.

The store boundary observation alphabet explicitly includes `flush_ok` and `flush_fail`. The proof boundary is not the projection that hides them: hiding `flush_ok` would make the good trace `append, flush_ok, committed` and the bad trace `append, committed` indistinguishable, so the durability duty would not be checkable. The contract keeps the durability observation visible.

The decomposition obligation is $K_0(\operatorname{beh}(B_{0,\mathrm{coord}}), \operatorname{beh}(B_{0,\mathrm{store}})) \subseteq \operatorname{beh}(M_0)$. It holds for the single-use protocol: any composition trace is a one-request trace; its `ack` is preceded by the coordinator's `committed`, which is preceded by the store's `flush_ok`; the root's `commit_ok`/`ack` path matches. The `commit_fail`/`fail` path matches the store's `flush_fail`/`failed` and the coordinator's `fail`. The connector projection $\operatorname{obs}_0$ maps the composition trace `req, append, flush_ok, committed, ack` to `req, commit_ok, ack` and `req, append, flush_fail, failed, fail` to `req, commit_fail, fail`; the composition's trace language is contained in $L_0$. The two-request trace `req(1), append(1), flush_ok(1), committed(1), ack(1), req(2), ...` is excluded by the interface precondition and the one-request trace language. The duplicate-ack trace `req, append, flush_ok, committed, ack, ack` is excluded by the prefix closure $L_{\mathrm{coord}}$. The wiring is stateless; the coordinator is a child cell, not an oracle inside the connector.

### 8.4 Child machines

**Coordinator $M_{\mathrm{coord}}$**: states `idle`, `appending(id)`, `ready(id)`, `done(id)`.

- `idle --req(id)--> appending(id)` with output `append(id)`;
- `appending(id) --committed(id)--> ready(id)`;
- `ready(id) --tau--> done(id)` with output `ack(id)`;
- `appending(id) --failed(id)--> done(id)` with output `fail(id)`.

Its local active intent is "no acknowledgement before a committed result." The refinement $M_{\mathrm{coord}} \preceq B_{0,\mathrm{coord}}$ is a short simulation: `ack` only from `ready`, which is reached only by `committed`; the one-request clause follows from the absence of a transition out of `done`, and the trace language is exactly $L_{\mathrm{coord}}$.

**Store $M_{\mathrm{store}}$**: states `empty`, `writing(id)`, `flushed(id)`, `committedState(id)`, `failedState`.

- `empty --append(id)--> writing(id)`;
- `writing(id) --flush_ok(id)--> flushed(id)`;
- `flushed(id) --tau--> committedState(id)` with output `committed(id)`;
- `writing(id) --flush_fail(id)--> failedState` with output `failed(id)`.
- `committedState(id)` has no outgoing transition except a silent stutter with no output.

Its local active intent is "committed implies durable." The refinement $M_{\mathrm{store}} \preceq B_{0,\mathrm{store}}$ requires that `committedState(id)` (and the `committed(id)` output) is reachable only after `flush_ok(id)`, and that `flush_ok` is the substrate's durability event. The boundary trace is `append, flush_ok, committed` (or `append, flush_fail, failed`); `committed` is emitted only after `flush_ok`, and the trace language is exactly $L_{\mathrm{store}}$.

The context premises record the choice of a write-ahead log over an in-memory queue with periodic snapshots. The premises are the durability requirement and the crash model. The rejected alternative's reopening condition is "a durable atomic append primitive is available from the substrate." The context premise is provenance; the behavioral obligation is the refinement of the contracts.

### 8.5 Executable leaves

Both `coord` and `store` are leaf cells ($\operatorname{ch}(\mathrm{coord}) = \operatorname{ch}(\mathrm{store}) = \emptyset$) whose executable realization is given directly by programs:

```text
P_store:
  on append(id):
    state := writing
    write(log, id)                 # volatile write
    r := fsync(log)                # substrate call
    if r = 0: emit flush_ok(id); state := flushed; emit committed(id); state := committedState
    else:     emit flush_fail(id); state := failedState; emit failed(id)

P_coord:
  on req(id):       state := appending; emit append(id)
  on committed(id): if state = appending: state := ready; emit ack(id); state := done
  on failed(id):    if state = appending: state := done; emit fail(id)
```

The substrate contract is: `fsync` returns 0 iff the record is durable across the modeled crash; `flush_ok(id)` is emitted only on a 0 return. The realization witness for the store relates the log state to $M_{\mathrm{store}}$'s state: `fsync` success corresponds to the `flush_ok` transition, and the `committed` emission corresponds to `flushed -> committedState`. The invariant is "a record is in `flushed` only if the corresponding `fsync` returned 0." The good trace `append, flush_ok, committed` is admitted; the bad trace `append, committed` is not, because no `flush_ok` transition occurred. The coordinator realization is the analogous event-loop simulation; `ack` is emitted on the `ready -> done` transition, after `committed`. Under the declared run-to-completion semantics, the response cannot be delivered while the request handler is still running; the program also enters `appending` before emitting `append`, so a synchronous/reentrant response would find the handler in `appending` and would not be discarded. Under the declared semantics and the stated fairness/enabling premises, the coordinator reaches `done` and emits `ack`; this is the conditional liveness claim, not part of the safety realization.

### 8.6 The agent's initial mistake

The agent writes the store to emit `committed` immediately after `write` returns, before `fsync`. The refinement check $P_{\mathrm{store}} \preceq M_{\mathrm{store}}$ fails with the finite trace $\texttt{append}(id),\ \texttt{committed}(id)$. The trace violates the durability duty: `committed` occurs without `flush_ok`. The evidence record is fail, and the store contract remains active.

Two repairs are available.

- **Downward repair at the leaf.** Add the `fsync` before `committed`. The new store program satisfies the same contract. Only the store's leaf realization obligation $\operatorname{Impl}(\mathrm{store})$ changes. The leaf machine $M_{\mathrm{store}}$ and its incoming contract $B_{0,\mathrm{store}}$ are fixed (with identity edge abstraction $\alpha_{0,\mathrm{store}}$ matching $M_{\mathrm{store}}$ to $B_{0,\mathrm{store}}$), so $\operatorname{Ref}(v_0, \mathrm{store})$ and the parent $\operatorname{Dec}(v_0)$ are unchanged. By Corollary 2 (Interface Cutoff), the parent decomposition and coordinator proofs are reused without solver re-execution.
- **Upward refinement.** Strengthening a contract cannot make an incapable substrate provide durability. The upward path is one of two authorized changes: (i) introduce a supported flush protocol and implement it, with the new contract and evidence; or (ii) revise the substrate or requirement premise with an authorized disposition and reopen the store decomposition. The example assumes the substrate supports `fsync`; the upward path is for a different substrate and must be authorized and re-verified.

The version history records both paths and the condition under which the upward path is preferred. The audit trail is not rewritten: the original failed attempt, its counterexample, and the chosen repair remain in the version history.

### 8.7 Inspection views via cuts

The DAG structure permits human inspection through its natural root-covering cuts:

| Cut | Cut Antichain $C$ | What the human sees | What they do not need to read |
|---|---|---|---|
| $C_0$ | $\{v_0\}$ | the safety intent, conditional liveness premise, abstract durability state machine, context premises | any component implementation |
| $C_1$ | $\{\mathrm{coord}, \mathrm{store}\}$ | coordinator and store machines, contracts including visible `flush_ok` durability observation, context premises, evidence status | the log buffer code |

At cut $C_1$, the human can verify the acknowledgement protocol: `ack` only after `committed`, `committed` only after a durable flush, and the progress duties. At the leaves, they audit the program whose contract they already understand. Corollary 1 (Pointwise and Frontier Soundness) guarantees that the cut $C_1$ view is a sound abstraction of the code.

### 8.8 What the example demonstrates

The example exercises all three failure modes:

- the wide leap is blocked because the coordinator and store interfaces must be declared before their code;
- the rationale is preserved in the context premises, and the rejected in-memory alternative has a reopening condition;
- the human inspects cut $C_1$ rather than the WAL code.

It also exercises the downward repair and the authorized upward path, and the incremental frame cutoff theorem.

---

## 9. Mechanization Target

The calculus is designed to be mechanized in a small dependent-type development. The target is not a proof of the entire engineering stack; it is a kernel-checked proof of the algebraic spine, with the operational and solver obligations as explicit hypotheses.

### 9.1 Checked Lean 4 excerpt

```lean
-- Core checked declarations excerpted from JirlCalculus.lean (namespace Jirl).
-- Auxiliary definitions (Proj1, Correlated, sharedBit, Realizable, nodeRequirements)
-- follow the checked development; proofs and intermediate lemmas are omitted in this excerpt.
-- Observations and behavior
structure Machine (Obs : Type) where
  observes : Pred Obs

def Refines (M A : Machine Obs) : Prop := M.observes ⊆ₚ A.observes
def Sat (M : Machine Obs) (Φ : Pred Obs) : Prop := M.observes ⊆ₚ Φ

-- Connectors and compositional monotonicity
structure Connector (ι Obs : Type) where
  compose : (ι → Machine Obs) → Machine Obs
  precongruence : ∀ M A, (∀ i, Refines (M i) (A i)) → Refines (compose M) (compose A)

def Dec (K : Connector ι Obs) (A : ι → Machine Obs) (M : Machine Obs) : Prop :=
  Refines (K.compose A) M

theorem compositional_sibling_independence (K : Connector ι Obs)
    (children contracts : ι → Machine Obs) (parent : Machine Obs) (Φ : Pred Obs)
    (sat : Sat parent Φ) (dec : Dec K contracts parent)
    (refs : ∀ i, Refines (children i) (contracts i)) :
    Refines (K.compose children) parent ∧ Sat (K.compose children) Φ

theorem projection_erases_correlation :
    Proj1 Correlated false ∧ Proj2 Correlated true ∧ ¬ Correlated (false, true)

theorem boundary_proof_substitution_cutoff [DecidableEq ι]
    (v : Node ι Obs Context Map) (i : ι) (replacement : Machine Obs)
    (sat : Sat v.parent v.property) (dec : Dec v.connector v.contracts v.parent)
    (siblings : ∀ j, j ≠ i → Refines (v.children j) (v.contracts j))
    (newRef : Refines replacement (v.contracts i)) :
    Refines (v.connector.compose (update v.children i replacement)) v.parent ∧
    Sat (v.connector.compose (update v.children i replacement)) v.property

theorem independent_concretization_insufficient :
    (∀ i, ∃ t, sharedBit.legal t ∧ sharedBit.project t = false ∧
      Realizable (bitChild i) (sharedBit.slice i t)) ∧
    ¬ (∃ t, sharedBit.legal t ∧ sharedBit.project t = false ∧
      ∀ i, Realizable (bitChild i) (sharedBit.slice i t))

theorem upward_strengthening_preserves_dec (K : Connector ι Obs)
    (stronger contracts : ι → Machine Obs) (parent : Machine Obs)
    (strengthening : ∀ i, Refines (stronger i) (contracts i))
    (dec : Dec K contracts parent) : Dec K stronger parent

-- Section 5: Contextual projection and incremental frame cutoff
def ContextualProjection (ΔP : Prop) (K : Connector ι Obs)
    (contracts : ι → Machine Obs) (R : Pred Obs) : Prop :=
  ΔP → Sat (K.compose contracts) R

theorem contextual_projection_sound {ΔP : Prop} (K : Connector ι Obs)
    (children contracts : ι → Machine Obs) (R : Pred Obs)
    (context : ΔP) (projection : ContextualProjection ΔP K contracts R)
    (refs : ∀ i, Refines (children i) (contracts i)) :
    Sat (K.compose children) R

def passThroughConnector : Connector Unit Obs where
  compose children := children ()
  precongruence _ _ refs := refs ()

theorem pass_through_projection (ΔP : Prop) (R : Pred Obs) :
    ContextualProjection ΔP passThroughConnector (fun _ => ⟨R⟩) R

def Valid (Denote : Obl → Prop) (Req : Dev → Obl → Prop) (G : Dev) : Prop :=
  ∀ q, Req G q → Denote q

theorem validity_by_reuse {Denote : Obl → Prop} {Req : Dev → Obl → Prop}
    {G G' : Dev} (old : Valid Denote Req G)
    (covered : ∀ q, Req G' q → Req G q ∨ Denote q) : Valid Denote Req G'

theorem incremental_frame_cutoff {Denote : Obl → Prop} {Req : Dev → Obl → Prop}
    {G G' : Dev} (old : Valid Denote Req G)
    (changed : ∀ q, Req G' q → ¬ Req G q → Denote q) : Valid Denote Req G'

-- Section 5: Versioned finite snapshot specialization
namespace Versioned

inductive Obligation (Cell ι Obs : Type) where
  | sat (cell : Cell) (model : Machine Obs) (property : Pred Obs)
  | dec (cell : Cell) (connector : Connector ι Obs)
      (contracts : ι → Machine Obs) (model : Machine Obs)
  | child (cell : Cell) (slot : ι) (model contract : Machine Obs)
  | impl (cell : Cell) (program model : Machine Obs)

def Denote : Obligation Cell ι Obs → Prop
  | .sat _ model property => Sat model property
  | .dec _ connector contracts model => Dec connector contracts model
  | .child _ _ model contract => Refines model contract
  | .impl _ program model => Refines program model

abbrev Snapshot (Cell ι Obs : Type) := List (Obligation Cell ι Obs)
def Req (G : Snapshot Cell ι Obs) (q : Obligation Cell ι Obs) : Prop := q ∈ G

theorem snapshot_frame_cutoff (versions : Nat → Snapshot Cell ι Obs) (t : Nat)
    (old : Valid Denote Req (versions t))
    (changed : ∀ q, q ∈ versions (t + 1) → q ∉ versions t → Denote q) :
    Valid Denote Req (versions (t + 1))

theorem node_obligations_reused (cell : Cell) (v : Node (Fin n) Obs Unit Unit)
    (i : Fin n) (replacement : Machine Obs) :
    let next := updateChild v i replacement ()
    Obligation.sat cell next.parent next.property ∈ nodeRequirements cell v ∧
    Obligation.dec cell next.connector next.contracts next.parent ∈ nodeRequirements cell v ∧
    ∀ j, j ≠ i →
      Obligation.child cell j (next.children j) (next.contracts j) ∈ nodeRequirements cell v

theorem node_update_with_leaf_valid (cell leaf : Cell)
    (v : Node (Fin n) Obs Unit Unit) (i : Fin n)
    (replacement program : Machine Obs)
    (old : Valid Denote Req (nodeRequirements cell v))
    (newRef : Refines replacement (v.contracts i))
    (newImpl : Refines program replacement) :
    Valid Denote Req (nodeRequirements cell (updateChild v i replacement ()) ++
      [.impl leaf program replacement])

theorem changed_leaf_requires_new_evidence :
    let contract : Machine Bool := ⟨fun b => b = false⟩
    let replacement : Machine Bool := ⟨fun b => b = true⟩
    let old : Snapshot Unit Unit Bool := [.impl () contract contract]
    let next : Snapshot Unit Unit Bool := [.impl () replacement contract]
    Valid Denote Req old ∧ ¬ Valid Denote Req next

end Versioned

-- Section 6: Typed edge maps, admissible input restriction, rank-founded DAG and cut soundness
def forwardImage (f : X → Y) (P : Pred X) : Pred Y :=
  fun y => ∃ x, P x ∧ f x = y

theorem pullback_intersection_refinement (M : Machine X) (B : Machine Y)
    (α : X → Y) (cost : Pred X) :
    (M.observes ⊆ₚ fun x => pullback α B.observes x ∧ cost x) ↔
      (forwardImage α M.observes ⊆ₚ B.observes ∧ Sat M cost)

structure HConnector (ι : Type) (Slot : ι → Type) (Out : Type) where
  compose : ((i : ι) → Machine (Slot i)) → Machine Out
  precongruence : ∀ M A, (∀ i, Refines (M i) (A i)) →
    Refines (compose M) (compose A)

theorem heterogeneous_composition_with_cost {Child Slot : ι → Type}
    (K : HConnector ι Slot Out) (α : (i : ι) → Child i → Slot i)
    (M : (i : ι) → Machine (Child i)) (B : (i : ι) → Machine (Slot i))
    (cost : (i : ι) → Pred (Child i)) (parent : Machine Out) (Φ : Pred Out)
    (localRef : ∀ i, (M i).observes ⊆ₚ
      fun x => pullback (α i) (B i).observes x ∧ cost i x)
    (dec : Refines (K.compose B) parent) (sat : Sat parent Φ) :
    Refines (K.compose (fun i => mapMachine (α i) (M i))) parent ∧
    Sat (K.compose (fun i => mapMachine (α i) (M i))) Φ ∧
    ∀ i, Sat (M i) (cost i)

def restrictInput (input : Obs → History) (A : Pred History) (M : Machine Obs) :
    Machine Obs := ⟨fun o => M.observes o ∧ A (input o)⟩

theorem restricted_refinement_sound {Child Slot History : ι → Type}
    (K : HConnector ι Slot Out) (α : (i : ι) → Child i → Slot i)
    (input : (i : ι) → Child i → History i) (A : (i : ι) → Pred (History i))
    (M : (i : ι) → Machine (Child i)) (B : (i : ι) → Machine (Slot i))
    (actual parent : Machine Out) (Φ : Pred Out)
    (wire : Refines actual (K.compose
      (fun i => mapMachine (α i) (restrictInput (input i) (A i) (M i)))))
    (refs : ∀ i, Refines (mapMachine (α i) (restrictInput (input i) (A i) (M i))) (B i))
    (dec : Refines (K.compose B) parent) (sat : Sat parent Φ) :
    Refines actual parent ∧ Sat actual Φ

theorem induction_by_rank (child : V → V → Prop) (rank : V → Nat)
    (decreases : ∀ v c, child v c → rank c < rank v) (P : V → Prop)
    (step : ∀ v, (∀ c, child v c → P c) → P v) : ∀ v, P v

theorem dag_soundness_by_rank (D : RefinementDAG V)
    (leaf : ∀ v, D.Leaf v → Refines (D.exec v) (D.model v))
    (wire : ∀ v, ¬ D.Leaf v → Refines (D.exec v) (D.compose D.exec v))
    (edge : ∀ v, D.EdgeRefinement v)
    (dec : ∀ v, ¬ D.Leaf v → D.Decomposition v)
    (sat : ∀ v, Sat (D.model v) (D.property v)) :
    ∀ v, Refines (D.exec v) (D.model v) ∧ Sat (D.exec v) (D.property v)

theorem frontier_cut_soundness (D : RefinementDAG V) (C : Pred V)
    (cut : D.RootCoveringCut C)
    (boundary : ∀ u, C u → Refines (D.exec u) (D.model u))
    (wire : ∀ v, D.Anc C v → ¬ C v → Refines (D.exec v) (D.compose D.exec v))
    (edge : ∀ v, D.Anc C v → ¬ C v → D.EdgeRefinement v)
    (dec : ∀ v, D.Anc C v → ¬ C v → D.Decomposition v)
    (sat : ∀ r, D.Root r → Sat (D.model r) (D.property r)) :
    ∀ r, D.Root r → Refines (D.exec r) (D.cutModel C r) ∧
      Refines (D.cutModel C r) (D.model r) ∧ Sat (D.model r) (D.property r)
```

Lean's `Machine Obs` is a behavior-set carrier, whereas §2.1 presents operational machines whose executions induce such a carrier. `TransitionSystem`, `traceMachine`, and `inductive_simulation_sound` separately connect finite operational executions to trace inclusion. The Lean predicate `Valid Denote Req G` proves every required denotation; it does not encode the paper's evidence records, result fields, or evidence-scope applicability. The paper's `Holds` adds those evidence-layer conditions.

The checked formalization in `JirlCalculus.lean` treats `Obs` as an arbitrary observation type parameter and proves the algebraic kernel across six sections:
- Section 1 proves finite-guard and acyclic support-closure lemmas (`T_guard`, `GuardedWitness`, `EnvClosure`, `Closure`, and `joint_support_consistency`);
- Sections 2–5 prove finite-trace simulation soundness (`inductive_simulation_sound`), connector monotonicity, compositional sibling independence, joint-trajectory realizability, top-down contextual intent projection (`contextual_projection_sound`), and the incremental frame theorem (`validity_by_reuse`, `incremental_frame_cutoff`, and the `Versioned` finite snapshot specialization);
- Section 6 proves typed edge maps with pullback-intersection local property inclusion (`pullback_intersection_refinement`), heterogeneous cost composition (`heterogeneous_composition_with_cost`), admissible-input restricted refinement (`restricted_refinement_sound` and `admissible_trajectory_wiring`), and well-founded induction for ranked acyclic child relations (`dag_soundness_by_rank`) and root-covering cut frontier soundness (`frontier_cut_soundness`). In `RefinementDAG`, `dag_soundness_by_rank` and `frontier_cut_soundness` mechanize the unrestricted ($A_{v,c} = \mathcal{H}_{X_c}^{\mathrm{in}}$) full-edge case over per-node behaviors, while `restricted_refinement_sound` and `admissible_trajectory_wiring` separately mechanize the admissible-input restricted step.

The paper's support evaluation corresponds to positive `Closure` and its rank-layer characterization, not to `T_guard`: `GuardedWitness` proves that the guarded alternative can be nonmonotone and have no least fixed point. The `Versioned` specialization represents finite lists of four obligation constructors with one observation type and identity edge maps. It does not encode `Wire`, contextual evidence applicability, protected preservation, a complete versioned DAG, or persistent-store correctness; the generic frame lemma can be instantiated with a richer obligation type only after those data and premises are supplied. `RefinementDAG` takes a natural-valued decreasing rank as an input. Every finite DAG admits such a rank mathematically, but construction of that rank from a finite graph is not proved in this file. The durable-acknowledgement example and its executable simulations are paper arguments, not checked Lean definitions.

The formalization also provides concrete witness models in namespaces `DAGWitness` and `EdgeWitness`, verifying:
1. that a DAG with shared leaves reached at unequal path depths satisfies the soundness theorem (`unequal_depth_shared_dag_sound`);
2. that the proposed cut $\{\mathrm{left}\}$ is not root-covering because the direct root-to-leaf path bypasses it (`bypass_not_root_covering`); this is a cut-coverage counterexample, not a witness of an executable safety violation;
3. that child-local complexity or cost bounds are preserved without inventing spurious parent cost coordinates (`heterogeneous_cost_vertical`); and
4. that general-purpose children with wider input domains soundly refine slot contracts under legal parent input trajectories (`restricted_input_vertical`).

### 9.2 Trusted base

The kernel checks the algebra. The following remain explicit hypotheses, with their scopes recorded:

- the operational soundness of a connector's wiring against its transformer (the `wire` premise of `dag_soundness_by_rank` and `frontier_cut_soundness`);
- the aggregate-history adequacy and dominating-ancestor scoping for shared stateful singletons (hypothesis (A4));
- the soundness of the evidence checker for each method;
- the adequacy of the finite model to the code for a model-checking claim;
- the substrate contract for a leaf realization (the `leaf` / `boundary` premise);
- the input-receptiveness and progress obligations for the chosen profile.

A mechanized proof cannot make these hypotheses true. It can make their use explicit and prevent the algebra from hiding them.

### 9.3 Size

The mechanized development in `JirlCalculus.lean` comprises 1,192 lines of Lean 4 with zero `sorry` tokens and zero custom axioms (relying only on Lean's standard foundational axioms `propext`, `Classical.choice`, and `Quot.sound`). The compact size is a design objective: a reader can audit the entire correctness spine in one sitting, and a reviewer can see exactly which premises are assumed.

---

## 10. Related Work

**Refinement calculi.** Back and von Wright's refinement calculus and Abrial's Event-B develop programs by stepwise refinement, with invariants and proof obligations at each step. The refinement-DAG calculus shares the stepwise discipline but makes the interface between nodes a first-class contract and adds a persistent provenance ledger. Event-B's refinement is per-machine; the DAG calculus adds the connector and the child-contract decomposition, which is what enables independent child verification.

**Temporal specification and refinement mappings.** TLA+ and the Abadi–Lamport theory of refinement mappings establish implementation relations between specifications. The DAG calculus uses the same inclusion idea, specialized to an acyclic refinement graph with explicit contracts. The connector's monotonicity is the composition law; the DAG structure is the engineering discipline that keeps the law applicable.

**Interface automata and assume-guarantee.** de Alfaro and Henzinger's interface automata formalize open components with input/output variance and compatibility. The child refinement obligation's input receptiveness is the same discipline. Assume-guarantee reasoning is powerful but fragile when assumptions are circular; the DAG calculus avoids circularity by making the connector own the interaction and by requiring an executable coordinator rather than a circular assumption.

**Design by contract.** Meyer's contracts specify preconditions, postconditions, and invariants. The DAG calculus extends the idea from a single object boundary to an acyclic decomposition: the contract is the interface between cells, and its satisfaction is checked by refinement rather than by runtime assertion alone.

**Hierarchical state machines.** Harel's statecharts provide nested and orthogonal states. The DAG calculus uses ordinary state machines at each cell and a connector for interaction; it does not rely on statechart semantics. The hierarchy is in the refinement DAG structure, not in a single expanded automaton.

**Counterexample-guided abstraction refinement.** Clarke et al.'s CEGAR loop uses counterexamples to refine abstractions. The evolution loop is a localized CEGAR: the failure cell localizes the repair, and the shared-trajectory check separates genuine from spurious witnesses. The key difference is that cell contracts are persistent interfaces, so a repair at one cell reuses the proofs at unchanged boundaries.

**Truth maintenance and provenance.** Truth maintenance systems and provenance semirings model support and retraction. The provenance record borrows the idea of explicit support and reopening: alternatives are preserved with their reopening triggers, and support is strictly acyclic, so the warrant is evaluated in a single forward pass.

**Persistent data structures.** Driscoll et al. established path copying and persistence. The version model represents evolution as a sequence of immutable Refinement DAGs $\{G_t\}_{t \in \mathbb{N}}$; the incremental frame theorem establishes that unchanged obligation propositions are reused by identity, and persistent outgoing-edge containers provide an efficient store.

**Assurance cases and evidential tool buses.** Structured assurance cases provide explicit arguments that a critical system satisfies its top-level safety claims, standardized in frameworks such as the Goal Structuring Notation (GSN) [24] and the OMG Structured Assurance Case Metamodel (SACM) [25]. Rushby's *Evidential Tool Bus (ETB)* [26] formalizes verification tool interaction as a distributed evidence-producing architecture. Bloomfield and Rushby [27, 28] formalize assurance cases via defeaters, inductive step confidence, and epistemic probability. In the context of LLM and autonomous agent code generation, recent systems by Chechik et al.—including *CLARISSA* [29], *PLACIDUS* [30], and *AssureCode* [31]—employ assurance cases to monitor agent synthesis, construct safety envelopes, and verify agent-generated artifacts. The refinement-DAG calculus directly complements these frameworks by supplying the underlying software development with a rigorous behavioral foundation: behavioral claims expressible at the declared interfaces can be represented by typed inclusion obligations ($\operatorname{Sat}$, $\operatorname{Wire}$, $\operatorname{Dec}$, $\operatorname{Ref}$, $\operatorname{Impl}$), while claims about authorization, process compliance, evidence soundness, or epistemic confidence remain separate premises. The incremental frame theorem identifies when exact unchanged behavioral obligations can reuse applicable evidence.

**Agent software engineering.** Recent work on repository-level coding agents (SWE-bench and related benchmarks) and on self-refinement and reflection shows that agents can iterate on code and tests. The DAG calculus addresses a different point in the loop: it constrains what an agent may accept as a completed step. It is complementary to better code generation, better test generation, and better retrieval; it supplies the missing intermediate behavioral obligations.

---

## 11. Limitations and Open Problems

**Connector admissibility.** The soundness theorem is only as strong as the connector's operational soundness and reduction preservation. Theorem 1 is conditional on intra-DAG validity (conditions 1–6), including executable realization and profile admissibility, together with edge refinement of §3.5, typed-edge compatibility (A3), and shared-singleton/input-delivery scope (A4). Versioned publication separately requires protected-obligation preservation (condition 7). These are explicit validity or theorem premises, not unstated background assumptions. Rich concurrency — weak memory, Byzantine faults, real-time deadlines — needs richer profiles and correspondingly richer admissibility proofs. The paper's trace kernel is the base case, not the final word.

**Liveness and profiles.** The worked example's safety claim is discharged by the trace kernel; its liveness claim is conditional on the stated fairness and enabling premises and is not derived from the safety proof. A liveness profile needs its own operational composition law and progress-preservation witness, not a relabeling of the safety argument.

**Intent correctness.** The theorem guarantees that the executable system refines the admitted root intents. It does not guarantee that the root intents are the right requirements. Root authority is an organizational decision; the calculus makes it explicit and auditable, but it cannot make it correct.

**Evidence soundness.** The gate trusts the evidence checker. A buggy model checker, an inadequate model, or a mis-specified substrate contract can pass a wrong system. The trusted base must be stated and, where possible, minimized. The mechanization target makes the algebraic part small; the operational part remains a hypothesis.

**Coverage of context premises.** The gate can require explicit context premises for every interface and contract choice, but it cannot force an agent to record every implicit choice inside a leaf implementation. The provenance coverage is the declared obligations and interfaces. A leaf is a trust boundary; its contract is what the parent knows.

**Test weakening.** The gate blocks weakening of protected intents. It does not prevent an agent from writing a weak test for a property that was never formalized. The remedy is to formalize the property as an intent; the framework makes that remedy visible, not automatic.

**Scale.** The inspection view of a large DAG can still be large. The calculus bounds the change region by the dependency cone up to proved unchanged boundaries, and it bounds the size of a local proof, but a root-obligation change can reach the whole system, and it does not bound the number of cells or the cost of a single model-checking query. Tool support, proof caching, and model-checking engineering remain necessary.

**Empirical validation.** The claim that the protocol reduces agent error rates is a hypothesis. The paper's contribution is the calculus and the gate; a controlled study with arm-independent ground truth is the natural next step.

**Decomposition depth and placement of contracts.** The DAG topology and the placement of contracts are design decisions. A poor decomposition can make the connector large or the contracts weak. The calculus provides the correctness condition; the architecture remains an engineering choice, guided by the capacity and factoring remarks.

---

## 12. Conclusion

Software development by agents fails when the gap between a requirement and code is filled by unverified invention. The refinement-DAG calculus closes the gap with explicit intermediate objects: active intents with support, context premises with rationale and reopening conditions, state machines with contracts, and evidence for every behavioral obligation. One relation — behavior inclusion under typed edge abstractions — carries satisfaction, decomposition, edge refinement, and leaf realization. Acyclic support links permit topological support evaluation; independently, the acyclic Refinement DAG organizes sibling substitution and modular inspection by predecessor/successor closures and root-covering cuts. Version evolution reuses evidence for exact unchanged obligations when its scope remains applicable. The soundness theorem is short because the system is one chain of inclusions, not three bolted-together worlds. The protocol is the operational reading of that chain: read the context, fix the interface, verify the machine, decompose into contracts, substitute the child proof, publish atomically. The durable-acknowledgement example shows the chain catching the exact error that motivates the framework: an agent that treats a volatile write as durable, and a gate that refuses to let it pass.

---

## Appendix A. Proof Details

### A.1 Theorem 1 (Refinement-DAG Soundness), expanded

The executable sub-development rooted at a cell $v \in V$ is defined by structural recursion on the refinement DAG:
- if $v \in V_{\mathrm{leaf}}$, it is $\operatorname{Beh}_{\mathrm{exec}}(v) = \operatorname{beh}(P_v)$ under declared execution semantics;
- if $v \notin V_{\mathrm{leaf}}$, it is $\operatorname{Beh}_{\mathrm{exec}}(v)$, the behavior of concrete wiring $C_v$ applied to executable child sub-developments.

By well-founded induction on $(V, \operatorname{ch})$, the induction hypothesis yields $B_c = \operatorname{Beh}_{\mathrm{exec}}(c) \subseteq \operatorname{beh}(M_c)$ for each child $c \in \operatorname{ch}(v)$. For unrestricted edges, set $A_{v,c} = \mathcal{H}_{X_c}^{\mathrm{in}}$.
1. By validity Condition 5 and the admissible-input delivery premise (A4), wiring adequacy gives:
   $$
   \operatorname{Beh}_{\mathrm{exec}}(v) \subseteq K_v\bigl(\{\alpha_{v,c}(B_c \!\upharpoonright_{A_{v,c}})\}_{c \in \operatorname{ch}(v)}\bigr).
   $$
2. The induction hypothesis gives $B_c \!\upharpoonright_{A_{v,c}} \subseteq \operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}}$, which implies $\alpha_{v,c}(B_c \!\upharpoonright_{A_{v,c}}) \subseteq \alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}})$. By monotonicity of connector $K_v$ (Lemma 1):
   $$
   K_v\bigl(\{\alpha_{v,c}(B_c \!\upharpoonright_{A_{v,c}})\}_c\bigr) \subseteq K_v\bigl(\{\alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}})\}_c\bigr).
   $$
3. Edge refinement (A2) gives $\alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}}) \subseteq \operatorname{beh}(B_{v,c})$. By monotonicity of $K_v$:
   $$
   K_v\bigl(\{\alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}})\}_c\bigr) \subseteq K_v\bigl(\{\operatorname{beh}(B_{v,c})\}_c\bigr).
   $$
4. Decomposition (Condition 4) gives $K_v(\{\operatorname{beh}(B_{v,c})\}_c) \subseteq \operatorname{beh}(M_v)$.

Transitivity yields $\operatorname{Beh}_{\mathrm{exec}}(v) \subseteq \operatorname{beh}(M_v)$. Condition 3 supplies $\operatorname{beh}(M_v) \subseteq \llbracket c \rrbracket$ for each active intent $c \in A(v)$. Condition 6 guarantees non-vacuous initial states, input receptiveness, and progress. Any shared stateful child is scoped over aggregate multi-client history at a common dominating ancestor (A4), preventing correlation loss. For all $r \in V_{\mathrm{root}}$, $\operatorname{Beh}_{\mathrm{exec}}(r) \subseteq \Phi(r) = \bigcap_{c \in A(r)} \llbracket c \rrbracket$.

### A.2 Theorem 3 (Incremental Frame and Cutoff), expanded

The obligation inventory $\operatorname{Req}(G_t)$ contains the exact scoped behavioral-inclusion propositions of §3.4–3.5. Reuse assumes that the old development has valid applicable evidence for every member, including every edge-refinement proposition. Each proposition $q \in \operatorname{Req}(G_t)$ is determined entirely by its semantic operands: $\operatorname{Sat}(v, c)$ depends on $(M_v^{(t)}, \llbracket c \rrbracket, \Gamma_v^{(t)})$; $\operatorname{Wire}(v)$ depends on $(C_{t,v}, K_{t,v}, (\alpha_{t,v,c})_{c \in \operatorname{ch}_t(v)}, X_{t,c}, (A_{t,v,c})_{c \in \operatorname{ch}_t(v)}, \Gamma_{t,c}, \Gamma_v^{(t)})$; $\operatorname{Dec}(v)$ depends on $(W_{t,v}, (B_{t,v,c})_{c \in \operatorname{ch}_t(v)}, M_v^{(t)}, \Gamma_v^{(t)})$; $\operatorname{Ref}(v, c)$ depends on $(M_c^{(t)}, B_{t,v,c}, \alpha_{t,v,c}, A_{t,v,c}, \Gamma_{t,c})$; and $\operatorname{Impl}(\ell)$ depends on $(P_\ell^{(t)}, M_\ell^{(t)}, \Gamma_\ell^{(t)})$.

When updating a sub-development region $U_{\mathrm{mod}} \subseteq V$ while, for every external boundary parent $u \notin U_{\mathrm{mod}}$ with an incoming edge $(u, w)$ into $w \in U_{\mathrm{mod}}$, preserving incoming slot contracts $B_{u,w}$, concrete wiring $C_u$, skeleton $W_u$, parent machine $M_u$, contexts, active intent sets $A(u)$ (and predicates $\llbracket c \rrbracket$ for $c \in A(u)$), and external sibling contracts:
- Every proposition whose operands are unchanged (including boundary parent $\operatorname{Dec}(u)$, $\operatorname{Wire}(u)$, $\operatorname{Sat}(u, c)$ for $c \in A^{(t+1)}(u) \cap A^{(t)}(u)$ with unchanged $\llbracket c \rrbracket$ and $\Gamma_u$, and all other operand-unchanged obligations outside $U_{\mathrm{mod}}$, excluding changed incoming-boundary refinements or newly activated satisfaction obligations covered below) belongs to $\operatorname{Req}(G_{t+1}) \cap \operatorname{Req}(G_t)$. By the incremental frame theorem, because semantic operands are identical and evidence applicability is preserved, valid evidence $E_t(q)$ carried over by identity into $E_{t+1}(q)$ establishes $\operatorname{Holds}_{t+1}(q)$ without solver re-execution.
- Regenerate the affected incoming boundary refinements, internal obligations, and any satisfaction obligations for newly activated or modified intents (including on owners outside $U_{\mathrm{mod}}$ when support links $J$ or intent records $I$ change). Those absent from the old inventory form the set difference and require evidence; any proposition proved identical to an existing scoped obligation follows the reuse case.

When all propositions in $\operatorname{Req}(G_{t+1}) \setminus \operatorname{Req}(G_t)$ hold, and conditions 1–2, 6–7, and hypotheses (A3)–(A4) hold, $G_{t+1}$ satisfies all validity conditions of §3.4 and edge refinement of §3.5. Theorem 1 guarantees root behavioral refinement without ancestor solver re-execution.

### A.3 Lemma 3, expanded

Let $\rho = s_0 \xrightarrow{\sigma_1} s_1 \xrightarrow{\sigma_2} \cdots \xrightarrow{\sigma_n} s_n$ be a child execution. Initiation relates $s_0$ to an initial contract state $t_0$. Inductively, $s_i$ is in $I_c$ and related to $t_i$. For step $i+1$: if $\lambda_{v,c}(\sigma_{i+1}) = \epsilon$, the relation keeps $t_{i+1} = t_i$; otherwise the step-simulation condition supplies $t_{i+1}$ with the matching contract action. At the end, the sequence of non-silent contract actions is exactly $\lambda_{v,c}(\rho)$, so the abstract trace is in $\operatorname{tr}(B_{v,c})$. Input receptiveness ensures the abstract trace is not vacuous at open inputs; silent convergence ensures liveness profiles do not hide infinite internal stuttering.

### A.4 Corollary 1 (Pointwise and Frontier Soundness), expanded

**Part 1: Pointwise soundness.**
Under the hypotheses of Theorem 1 for the original development $G$, its pointwise conclusion already gives $\operatorname{Beh}_{\mathrm{exec}}(v)\subseteq\operatorname{beh}(M_v)$ for every $v\in V$. Validity condition 3 gives $\operatorname{beh}(M_v)\subseteq\llbracket c\rrbracket$ for every $c\in A(v)$, hence $\operatorname{beh}(M_v)\subseteq\Phi(v)$. The extracted descendant view inherits this pointwise guarantee from $G$; it is not asserted to be a standalone valid development without explicitly retaining its external support, context, incoming-contract, and shared-instance assumptions.

**Part 2: Frontier soundness.**
Let $C \subseteq V$ be a root-covering cut. By definition, $C$ is an antichain intersecting every directed path from $V_{\mathrm{root}}$ to $V_{\mathrm{leaf}}$ at exactly one vertex.
Define the upper sub-DAG $\operatorname{Anc}(C) = \{\, v \in V \mid \exists u \in C,\ v \to^* u \,\}$.

*No-bypass property.* For any $v\in\operatorname{Anc}(C)\setminus C$, every child $c\in\operatorname{ch}(v)$ belongs to $\operatorname{Anc}(C)$. Choose $x\in C$ with $v\to^*x$. No root-to-$v$ prefix can contain $u\in C$: the path $u\to^*v\to^*x$ would imply $u=x$ by the antichain property, and then $v=u$ by acyclicity, contradicting $v\notin C$. If some child $c$ had no path to $C$, concatenate a root-to-$v$ path, the edge $v\to c$, and a path from $c$ to a leaf; the root and leaf paths exist because the DAG is finite. The resulting root-to-leaf path would avoid $C$, contradicting root coverage.

We prove by well-founded induction on the finite acyclic child relation $v \to c$ on $\operatorname{Anc}(C)$ that for all $v \in \operatorname{Anc}(C)$:
$$
\operatorname{Beh}_{\mathrm{exec}}(v) \;\subseteq\; H_C(v) \;\subseteq\; \operatorname{beh}(M_v).
$$

*Base case ($u \in C$).* By definition of $H_C$, $H_C(u) = \operatorname{beh}(M_u)$. The frontier realization hypothesis gives $\operatorname{Beh}_{\mathrm{exec}}(u) \subseteq \operatorname{beh}(M_u) = H_C(u)$. By reflexivity, $H_C(u) \subseteq \operatorname{beh}(M_u)$. Both inclusions hold.

*Inductive step ($v \in \operatorname{Anc}(C) \setminus C$).* Assume the induction hypothesis holds for every child $c \in \operatorname{ch}(v)$:
$$
\operatorname{Beh}_{\mathrm{exec}}(c) \;\subseteq\; H_C(c) \;\subseteq\; \operatorname{beh}(M_c).
$$
For unrestricted edges, set $A_{v,c} = \mathcal{H}_{X_c}^{\mathrm{in}}$.

1. *Lower inclusion ($\operatorname{Beh}_{\mathrm{exec}}(v) \subseteq H_C(v)$).*
   The instantiated operational inclusion in frontier premise 2 gives
   $$
   \operatorname{Beh}_{\mathrm{exec}}(v) \subseteq K_v\bigl(\{\alpha_{v,c}(\operatorname{Beh}_{\mathrm{exec}}(c)\!\upharpoonright_{A_{v,c}})\}_{c \in \operatorname{ch}(v)}\bigr).
   $$
   By the induction hypothesis, $\operatorname{Beh}_{\mathrm{exec}}(c) \subseteq H_C(c)$, so $\operatorname{Beh}_{\mathrm{exec}}(c)\!\upharpoonright_{A_{v,c}} \subseteq H_C(c)\!\upharpoonright_{A_{v,c}}$ and $\alpha_{v,c}(\operatorname{Beh}_{\mathrm{exec}}(c)\!\upharpoonright_{A_{v,c}}) \subseteq \alpha_{v,c}(H_C(c)\!\upharpoonright_{A_{v,c}})$. By monotonicity of connector $K_v$ (Lemma 1):
   $$
   K_v\bigl(\{\alpha_{v,c}(\operatorname{Beh}_{\mathrm{exec}}(c)\!\upharpoonright_{A_{v,c}})\}_{c}\bigr) \;\subseteq\; K_v\bigl(\{\alpha_{v,c}(H_C(c)\!\upharpoonright_{A_{v,c}})\}_{c}\bigr) \;=\; H_C(v),
   $$
   where the equality is the definition of $H_C(v)$ for $v \in \operatorname{Anc}(C) \setminus C$. Transitivity yields $\operatorname{Beh}_{\mathrm{exec}}(v) \subseteq H_C(v)$.

2. *Upper inclusion ($H_C(v) \subseteq \operatorname{beh}(M_v)$).*
   By the induction hypothesis, $H_C(c) \subseteq \operatorname{beh}(M_c)$ for each $c$, so $H_C(c)\!\upharpoonright_{A_{v,c}} \subseteq \operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}}$ and $\alpha_{v,c}(H_C(c)\!\upharpoonright_{A_{v,c}}) \subseteq \alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}})$.
   By edge refinement (A2), $\alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}}) \subseteq \operatorname{beh}(B_{v,c})$.
   By monotonicity of $K_v$ (Lemma 1):
   $$
   H_C(v) \;=\; K_v\bigl(\{\alpha_{v,c}(H_C(c)\!\upharpoonright_{A_{v,c}})\}_{c}\bigr)
   \;\subseteq\; K_v\bigl(\{\alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}})\}_{c}\bigr)
   \;\subseteq\; K_v\bigl(\{\operatorname{beh}(B_{v,c})\}_{c}\bigr).
   $$
   By parent decomposition (Condition 4), $K_v(\{\operatorname{beh}(B_{v,c})\}_c) \subseteq \operatorname{beh}(M_v)$. Transitivity yields $H_C(v) \subseteq \operatorname{beh}(M_v)$.

Chaining the lower and upper inclusions establishes $\operatorname{Beh}_{\mathrm{exec}}(v) \subseteq H_C(v) \subseteq \operatorname{beh}(M_v)$ for all $v \in \operatorname{Anc}(C)$.

Finally, every root $r \in V_{\mathrm{root}}$ belongs to $\operatorname{Anc}(C)$ because every path from $r$ to $V_{\mathrm{leaf}}$ intersects $C$. Applying the result at $r$ combined with satisfaction $\operatorname{beh}(M_r) \subseteq \Phi(r)$ gives:
$$
\operatorname{Beh}_{\mathrm{exec}}(r) \;\subseteq\; H_C(r) \;\subseteq\; \operatorname{beh}(M_r) \;\subseteq\; \Phi(r) \;=\; \bigcap_{c \in A(r)} \llbracket c \rrbracket. \qquad \blacksquare
$$

---

## Appendix B. Notation

| Symbol | Meaning |
|---|---|
| $V$ | finite set of cells in the Refinement DAG |
| $V_{\mathrm{root}}$ | root cells of the DAG ($\{r \in V \mid \operatorname{par}(r) = \emptyset\}$) |
| $V_{\mathrm{leaf}}$ | leaf cells of the DAG ($\{\ell \in V \mid \operatorname{ch}(\ell) = \emptyset\}$) |
| $\operatorname{ch}(v), \operatorname{par}(v)$ | direct child cells and direct parent cells of $v$ |
| $\operatorname{Anc}(S), \operatorname{Desc}(S)$ | predecessor (ancestor) closure and successor (descendant) closure on $(V, \operatorname{ch})$ |
| $C$ | root-covering cut (frontier antichain intersecting every path from $V_{\mathrm{root}}$ to $V_{\mathrm{leaf}}$) |
| $\mathcal{O}_X$ | observation space at interface $X$ |
| $\operatorname{beh}(M)$ | behavior set of machine $M$ |
| $\operatorname{Beh}_{\mathrm{exec}}(v)$ | executable behavior of the sub-development rooted at $v$ |
| $C_v$ | concrete wiring implementation at cell $v$ |
| $Q_c$ | an admissible child behavior used in the wiring-adequacy quantifier |
| $\preceq$, $\preceq_\alpha$ | refinement (with abstraction $\alpha$) |
| $I, J$ | intent records and acyclic support links |
| $\mathcal{M}(v)$ | local model of cell $v$ ($\mathcal{O}_{X_v}, \Phi(v), M_v, \Gamma_v$) |
| $\Delta P_v, \Delta P_v^*$ | local context premises of cell $v$ and their transitive upstream closure |
| $M_v$ | machine of cell $v$ |
| $A, A(v)$ | active intents in development, owned by cell $v$ |
| $\Phi(v)$ | semantic conjunction of active intents owned by $v$ |
| $\chi(v)$ | decomposition record $(W_v, \operatorname{ch}(v), (B_{v,c}, \alpha_{v,c})_c)$ or leaf program $P_v$ |
| $W_v$ | wiring skeleton at cell $v$ |
| $K_v$ | connector transformer at cell $v$ |
| $B_{v,c}$ | slot contract at $X_{v,c}$, presented by a machine or directly by a specification set; $\operatorname{beh}(B_{v,c})$ denotes its allowed observations |
| $\alpha_{v,c}$ | typed edge abstraction map from child observations $\mathcal{O}_{X_c}$ to slot interface $\mathcal{O}_{X_{v,c}}$ |
| $E$ | evidence map |
| $R_v$ | component requirement at cell $v$ |
| $\operatorname{Req}(G_t)$ | finite set of exact behavioral-inclusion propositions for $G_t$ ($\operatorname{Sat}, \operatorname{Wire}, \operatorname{Dec}, \operatorname{Ref}, \operatorname{Impl}$) |
| $G_t$ | versioned Refinement DAG at epoch $t$ |
| $\operatorname{stale}(x)$ | downstream cells depending on upstream item $x$ along $\Delta P_v^*$ |
| $\operatorname{realizable}_{v,c}(M_c, o)$ | slot slice $o \in \mathcal{O}_{X_{v,c}}$ is realizable by $M_c$ ($o \in \alpha_{v,c}(\operatorname{beh}(M_c)\!\upharpoonright_{A_{v,c}})$) |
| $\operatorname{pref}(L)$ | prefix closure of trace set $L$ ($\{u \mid \exists w.\ uw \in L\}$) |
| $\operatorname{Holds}_t(q)$ | proposition $q \in \operatorname{Req}(G_t)$ is mathematically satisfied and witnessed by valid evidence in $E_t$ |
| $X_{t,v}, X_{t,v,c}$ | cell interface and slot interface at version $t$ |
| $\Gamma_{t,v}, \Gamma_{t,c}$ | semantic profile and context for cell $v$ and child $c$ at version $t$ |
| $C_{t,v}, K_{t,v}$ | concrete wiring implementation and transformer at cell $v$ at version $t$ |

---

## References

1. J.-R. Abrial. *The B-Book: Assigning Programs to Meanings.* Cambridge University Press, 1996.
2. R.-J. Back and J. von Wright. *Refinement Calculus: A Systematic Introduction.* Springer, 1998.
3. M. Abadi and L. Lamport. Conjoining Specifications. *ACM Transactions on Programming Languages and Systems*, 17(3):507–534, 1995.
4. M. Abadi and L. Lamport. The Existence of Refinement Mappings. *Theoretical Computer Science*, 82(2):253–284, 1991.
5. L. de Alfaro and T. A. Henzinger. Interface Automata. In *Proc. ESEC/FSE*, pages 109–120, 2001.
6. E. M. Clarke, O. Grumberg, S. Jha, Y. Lu, and H. Veith. Counterexample-Guided Abstraction Refinement for Symbolic Model Checking. *Journal of the ACM*, 50(5):752–794, 2003.
7. J. de Kleer. An Assumption-Based Truth Maintenance System. *Artificial Intelligence*, 28(2):127–162, 1986.
8. J. R. Driscoll, N. Sarnak, D. D. Sleator, and R. E. Tarjan. Making Data Structures Persistent. *Journal of Computer and System Sciences*, 38(1):86–124, 1989.
9. T. J. Green, G. Karvounarakis, and V. Tannen. Provenance Semirings. In *Proc. PODS*, pages 31–40, 2007.
10. D. Harel. Statecharts: A Visual Formalism for Complex Systems. *Science of Computer Programming*, 8(3):231–274, 1987.
11. M. P. Herlihy and J. M. Wing. Linearizability: A Correctness Condition for Concurrent Objects. *ACM Transactions on Programming Languages and Systems*, 12(3):463–492, 1990.
12. C. A. R. Hoare. *Communicating Sequential Processes.* Prentice Hall, 1985.
13. C. E. Jimenez, J. Yang, A. Wettig, S. Yao, K. Pei, O. Press, and K. Narasimhan. SWE-bench: Can Language Models Resolve Real-World GitHub Issues? In *Proc. ICLR*, 2024.
14. W. Kunz and H. W. J. Rittel. Issues as Elements of Information Systems. Working Paper 131, University of California, Berkeley, 1970.
15. L. Lamport. *Specifying Systems: The TLA+ Language and Tools for Hardware and Software Engineers.* Addison-Wesley, 2002.
16. R. J. Lipton. Reduction: A Method of Proving Properties of Parallel Programs. *Communications of the ACM*, 18(12):717–721, 1975.
17. A. Madaan, N. Tandon, P. Gupta, S. Hallinan, L. Gao, S. Wiegreffe, U. Alon, N. Dziri, S. Prabhumoye, Y. Yang, S. Gupta, B. P. Majumder, K. Hermann, S. Welleck, A. Yazdanbakhsh, and P. Clark. Self-Refine: Iterative Refinement with Self-Feedback. In *Proc. NeurIPS*, 2023.
18. D. McAllester. Truth Maintenance. In *Proc. AAAI*, pages 1109–1116, 1990.
19. B. Meyer. *Object-Oriented Software Construction.* Prentice Hall, 2nd edition, 1997.
20. N. Shinn, F. Cassano, A. Gopinath, K. Narasimhan, and S. Yao. Reflexion: Language Agents with Verbal Reinforcement Learning. In *Proc. NeurIPS*, 2023.
21. N. P. Suh. *Axiomatic Design: Advances and Applications.* Oxford University Press, 2001.
22. A. van Lamsweerde. Goal-Oriented Requirements Engineering: A Guided Tour. In *Proc. IEEE RE*, pages 249–262, 2001.
23. S. Yao, J. Zhao, D. Yu, N. Du, I. Shafran, K. Narasimhan, and Y. Cao. ReAct: Synergizing Reasoning and Acting in Language Models. In *Proc. ICLR*, 2023.
24. Goal Structuring Notation Working Group. *GSN Community Standard Version 3.* SCSC, 2021.
25. Object Management Group. *Structured Assurance Case Metamodel (SACM) Version 2.3.* OMG, 2021.
26. J. Rushby. The Evidential Tool Bus: A Software Architecture for Automated Verification. In *Proc. FMICS*, pages 1–11, 2005.
27. R. Bloomfield and J. Rushby. Assurance Cases, Defeaters, and Epistemic Confidence. *IEEE Transactions on Software Engineering*, 50(6):1452–1468, 2024.
28. R. Bloomfield and J. Rushby. Defeaters in Assurance Cases. In *Proc. DSN*, pages 310–322, 2025.
29. M. Chechik et al. CLARISSA: Continuous Layered Assurance for Robotic and Autonomous Systems. In *Proc. ICSE-SEIP*, 2024.
30. M. Chechik et al. PLACIDUS: Pluggable Assurance for LLM-Generated Cyber-Physical Systems. In *Proc. ASE*, 2025.
31. M. Chechik et al. AssureCode: Dynamic Assurance Cases for Autonomous Coding Agents. In *Proc. ICSE*, 2026.
