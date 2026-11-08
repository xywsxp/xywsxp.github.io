# xywsxp · Formal Specifications & Working Papers

Public site: **<https://xywsxp.github.io/>**

## Featured Working Paper: The Justified Intent & Refinement Ledger (JIRL)

- **Interactive Reading & Inline Annotation Edition**: **<https://xywsxp.github.io/jirl-formal-paper/>**
  - Direct link to §1.2 Theoretical Placement: **<https://xywsxp.github.io/jirl-formal-paper/#12-theoretical-placement>**
- **Typeset PDF Edition**: **<https://xywsxp.github.io/jirl-formal-paper.pdf>**
- **Editable Source & Executable Witnesses (`jirl/`)**:
  - [`jirl/jirl-formal-paper.md`](jirl/jirl-formal-paper.md) — Full Markdown source of the paper.
  - [`jirl/jirl-reference-model.ts`](jirl/jirl-reference-model.ts) — Executable TypeScript reference model.
  - [`jirl/jirl-paper-probes.mjs`](jirl/jirl-paper-probes.mjs) & [`jirl/jirl-paper-probes.jsonl`](jirl/jirl-paper-probes.jsonl) — 37 finite counterexample and theorem witnesses (`P1–P21`, `V16–V31`).
  - [`jirl/intent-ledger-standard-design-specification-v4.md`](jirl/intent-ledger-standard-design-specification-v4.md) & [`jirl/intent-ledger-standard-model-v4.ts`](jirl/intent-ledger-standard-model-v4.ts) — Round-4 converged normative design specification and model.

### How to Collaborate & Annotate

1. **Inline Passage Annotation (Web)**:
   - Open <https://xywsxp.github.io/jirl-formal-paper/> and select any sentence, definition, theorem, or formula.
   - Click the **「💬 批注选中文字」** pill to open the annotation card.
   - You can either:
     - **Publish as a Shared GitHub Annotation** (opens a pre-filled GitHub Issue with label `jirl-annotation`; once submitted, it automatically renders inline on the webpage for all readers), or
     - **Save Locally & Copy Markdown** (click **「📋 复制批注 (Markdown)」** to paste your anchored critiques directly into WeChat / Slack).
2. **Replaying the 37 Executable Witnesses**:
   ```sh
   node jirl/jirl-paper-probes.mjs
   ```
