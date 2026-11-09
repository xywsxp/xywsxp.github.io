import Std

/-! JIRL core calculus. Lean 4.14.0; only the bundled standard library.
    Predicates model sets. Observation-class obligations are explicit parameters.
    Theorems about stabilization, reduction and composition expose their premises. -/

namespace Jirl

abbrev Pred (α : Type) := α → Prop
def Subset (P Q : Pred α) : Prop := ∀ x, P x → Q x
infix:50 " ⊆ₚ " => Subset

theorem subset_refl (P : Pred α) : P ⊆ₚ P := fun _ h => h
theorem subset_trans {P Q R : Pred α} (h : P ⊆ₚ Q) (g : Q ⊆ₚ R) :
    P ⊆ₚ R := fun x hx => g x (h x hx)
theorem pred_ext {P Q : Pred α} (h : P ⊆ₚ Q) (g : Q ⊆ₚ P) : P = Q :=
  funext fun x => propext ⟨h x, g x⟩

/-! 1. Positive closure, guarded inference, layers and assumption labels. -/

structure Rule (α : Type) where
  premises : Pred α
  head : α

abbrev Nogood (α : Type) := Pred α

def F_pos (roots : Pred α) (rules : Pred (Rule α)) (U : Pred α) : Pred α :=
  fun x => roots x ∨ U x ∨ ∃ r, rules r ∧ r.premises ⊆ₚ U ∧ r.head = x

def Consistent (N : Pred (Nogood α)) (U : Pred α) : Prop :=
  ∀ n, N n → ¬ n ⊆ₚ U

def T_guard (roots : Pred α) (rules : Pred (Rule α))
    (N : Pred (Nogood α)) (U : Pred α) : Pred α :=
  fun x => roots x ∨ U x ∨ ∃ r, rules r ∧ r.premises ⊆ₚ U ∧ r.head = x ∧
    Consistent N (fun y => U y ∨ y = r.head)

theorem F_pos_monotone (R : Pred α) (J : Pred (Rule α))
    {U V : Pred α} (h : U ⊆ₚ V) : F_pos R J U ⊆ₚ F_pos R J V := by
  intro x hx
  rcases hx with hr | hu | ⟨r, hj, hp, he⟩
  · exact Or.inl hr
  · exact Or.inr (Or.inl (h x hu))
  · exact Or.inr (Or.inr ⟨r, hj, subset_trans hp h, he⟩)

theorem F_pos_inflationary (R : Pred α) (J : Pred (Rule α)) (U : Pred α) :
    U ⊆ₚ F_pos R J U := fun _ h => Or.inr (Or.inl h)

def Kleene (R : Pred α) (J : Pred (Rule α)) : Nat → Pred α
  | 0 => fun _ => False
  | n + 1 => F_pos R J (Kleene R J n)

def LeastFixedPoint (F : Pred α → Pred α) (X : Pred α) : Prop :=
  F X = X ∧ ∀ Y, F Y = Y → X ⊆ₚ Y

theorem kleene_below_fixed (R : Pred α) (J : Pred (Rule α))
    (Y : Pred α) (hy : F_pos R J Y = Y) (n : Nat) : Kleene R J n ⊆ₚ Y := by
  induction n with
  | zero => exact fun _ h => False.elim h
  | succ n ih =>
    intro x hx
    have h := F_pos_monotone R J ih x hx
    rw [hy] at h
    exact h

theorem lfp_is_least_fixed_point (R : Pred α) (J : Pred (Rule α)) (n : Nat)
    (stable : Kleene R J (n + 1) = Kleene R J n) :
    LeastFixedPoint (F_pos R J) (Kleene R J n) :=
  ⟨stable, fun Y hy => kleene_below_fixed R J Y hy n⟩

theorem least_fixed_point_unique {F : Pred α → Pred α} {X Y : Pred α}
    (hx : LeastFixedPoint F X) (hy : LeastFixedPoint F Y) : X = Y :=
  pred_ext (hx.2 Y hy.1) (hy.2 X hx.1)

inductive Closure (R : Pred α) (J : Pred (Rule α)) : α → Prop where
  | root {x} : R x → Closure R J x
  | rule (r) : J r → (∀ p, r.premises p → Closure R J p) → Closure R J r.head

theorem closure_least (R : Pred α) (J : Pred (Rule α)) :
    LeastFixedPoint (F_pos R J) (Closure R J) := by
  constructor
  · apply pred_ext
    · intro x hx
      rcases hx with hr | hu | ⟨r, hj, hp, he⟩
      · exact Closure.root hr
      · exact hu
      · exact he ▸ Closure.rule r hj hp
    · exact F_pos_inflationary R J _
  · intro Y hy x hx
    induction hx with
    | root hr => exact hy ▸ Or.inl hr
    | rule r hj _ ih => exact hy ▸ Or.inr (Or.inr ⟨r, hj, ih, rfl⟩)

theorem closure_monotone_roots {R S : Pred α} (J : Pred (Rule α))
    (h : R ⊆ₚ S) : Closure R J ⊆ₚ Closure S J := by
  intro x hx
  induction hx with
  | root hr => exact Closure.root (h _ hr)
  | rule r hj _ ih => exact Closure.rule r hj ih

def Layers (R : Pred α) (J : Pred (Rule α)) (rank : α → Nat) : Nat → Pred α
  | 0 => R
  | n + 1 => fun x => Layers R J rank n x ∨
      ∃ r, J r ∧ r.head = x ∧ rank x = n + 1 ∧ r.premises ⊆ₚ Layers R J rank n

theorem layers_sound (R : Pred α) (J : Pred (Rule α)) (rank : α → Nat) (n : Nat) :
    Layers R J rank n ⊆ₚ Closure R J := by
  induction n with
  | zero => exact fun _ hr => Closure.root hr
  | succ n ih =>
    intro x hx
    rcases hx with hx | ⟨r, hj, he, _, hp⟩
    · exact ih x hx
    · exact he ▸ Closure.rule r hj (subset_trans hp ih)

theorem closure_in_layers (R : Pred α) (J : Pred (Rule α)) (rank : α → Nat)
    (rootHeads : ∀ r, J r → rank r.head = 0 → R r.head)
    (strict : ∀ r, J r → ∀ p, r.premises p → rank p < rank r.head)
    (n : Nat) : ∀ x, Closure R J x → rank x ≤ n → Layers R J rank n x := by
  induction n with
  | zero =>
    intro x hx hbound
    cases hx with
    | root hr => exact hr
    | rule r hj _ => exact rootHeads r hj (by omega)
  | succ n ih =>
    intro x hx hbound
    by_cases hlow : rank x ≤ n
    · exact Or.inl (ih x hx hlow)
    · cases hx with
      | root hr =>
        have root_all : ∀ k, Layers R J rank k x := by
          intro k
          induction k with
          | zero => exact hr
          | succ k hk => exact Or.inl hk
        exact root_all (n + 1)
      | rule r hj hp =>
        have he : rank r.head = n + 1 := by omega
        refine Or.inr ⟨r, hj, rfl, he, ?_⟩
        intro p hpr
        have := strict r hj p hpr
        exact ih p (hp p hpr) (by omega)

theorem stratified_top_down_eq_fixed_point (R : Pred α) (J : Pred (Rule α))
    (rank : α → Nat) (height : Nat)
    (rootHeads : ∀ r, J r → rank r.head = 0 → R r.head)
    (strict : ∀ r, J r → ∀ p, r.premises p → rank p < rank r.head)
    (bounded : ∀ x, rank x ≤ height) :
    Layers R J rank height = Closure R J ∧
      LeastFixedPoint (F_pos R J) (Layers R J rank height) := by
  have he := pred_ext (layers_sound R J rank height)
    (fun x hx => closure_in_layers R J rank rootHeads strict height x hx (bounded x))
  exact ⟨he, he ▸ closure_least R J⟩

namespace GuardedWitness
inductive Atom where | a | b | c deriving DecidableEq
open Atom

def roots : Pred Atom := fun x => x = a
def rb : Rule Atom := ⟨roots, b⟩
def rc : Rule Atom := ⟨roots, c⟩
def rules : Pred (Rule Atom) := fun r => r = rb ∨ r = rc
def bad : Nogood Atom := fun x => x = b ∨ x = c
def nogoods : Pred (Nogood Atom) := fun n => n = bad
def ab : Pred Atom := fun x => x = a ∨ x = b
def ac : Pred Atom := fun x => x = a ∨ x = c
def guard := T_guard roots rules nogoods

theorem all_atoms (P : Pred Atom) : (∀ x, P x) ↔ P a ∧ P b ∧ P c := by
  constructor
  · intro h; exact ⟨h a, h b, h c⟩
  · intro h x; cases x with
    | a => exact h.1
    | b => exact h.2.1
    | c => exact h.2.2

theorem guard_roots : guard roots = fun _ => True := by
  funext x; apply propext; cases x <;>
    simp [guard, T_guard, roots, rules, rb, rc, Consistent, nogoods, bad, Subset, all_atoms]

theorem guard_ab : guard ab = ab := by
  funext x; apply propext; cases x <;>
    simp [guard, T_guard, roots, rules, rb, rc, Consistent, nogoods, bad, ab, Subset, all_atoms]

theorem guard_ac : guard ac = ac := by
  funext x; apply propext; cases x <;>
    simp [guard, T_guard, roots, rules, rb, rc, Consistent, nogoods, bad, ac, Subset, all_atoms]

theorem guarded_nonmonotone_and_no_lfp :
    (roots ⊆ₚ ac ∧ ¬ guard roots ⊆ₚ guard ac) ∧
    ¬ (∃ X, roots ⊆ₚ X ∧ guard X = X ∧
      ∀ Y, roots ⊆ₚ Y → guard Y = Y → X ⊆ₚ Y) := by
  have ra : roots ⊆ₚ ab := fun _ h => Or.inl h
  have rc' : roots ⊆ₚ ac := fun _ h => Or.inl h
  constructor
  · refine ⟨rc', ?_⟩
    intro h
    have hb : guard roots b := by rw [guard_roots]; trivial
    have hc := h b hb
    rw [guard_ac] at hc
    cases hc with
    | inl h => cases h
    | inr h => cases h
  · rintro ⟨X, hr, hf, least⟩
    have hab := least ab ra guard_ab
    have hac := least ac rc' guard_ac
    have eq : X = roots := by
      apply pred_ext _ hr
      intro x hx
      cases x with
      | a => rfl
      | b => rcases hac b hx with h | h <;> cases h
      | c => rcases hab c hx with h | h <;> cases h
    rw [eq, guard_roots] at hf
    have hb : roots b := hf ▸ True.intro
    cases hb

theorem parallel_guard_violates_nogood : ¬ Consistent nogoods (guard roots) := by
  intro h
  apply h bad rfl
  intro x _
  rw [guard_roots]
  trivial
end GuardedWitness

def EnvClosure (B : Pred α) (J : Pred (Rule α)) (E : Pred α) : Pred α :=
  Closure (fun x => B x ∨ E x) J

def Cons (B : Pred α) (J : Pred (Rule α)) (N : Pred (Nogood α)) (E : Pred α) : Prop :=
  Consistent N (EnvClosure B J E)

theorem env_closure_monotone (B : Pred α) (J : Pred (Rule α))
    {E D : Pred α} (h : E ⊆ₚ D) : EnvClosure B J E ⊆ₚ EnvClosure B J D :=
  closure_monotone_roots J (fun x hx => hx.elim Or.inl (fun he => Or.inr (h x he)))

theorem cons_downward_closed (B : Pred α) (J : Pred (Rule α)) (N : Pred (Nogood α))
    {E D : Pred α} (h : E ⊆ₚ D) (hc : Cons B J N D) : Cons B J N E :=
  fun n hn hp => hc n hn (subset_trans hp (env_closure_monotone B J h))

/- Finite subset minimality: the finite inventory supplies the only finiteness premise. -/
private def insert (a : α) (E : Pred α) : Pred α := fun x => x = a ∨ E x
private def erase (a : α) (E : Pred α) : Pred α := fun x => E x ∧ x ≠ a

private theorem insert_erase {a : α} {E : Pred α} (ha : E a) :
    insert a (erase a E) = E := by
  apply pred_ext
  · intro x hx; rcases hx with h | h
    · exact h ▸ ha
    · exact h.1
  · intro x hx
    classical
    by_cases h : x = a
    · exact Or.inl h
    · exact Or.inr ⟨hx, h⟩

theorem finite_minimal (xs : List α) (P : Pred α → Prop) (E : Pred α)
    (bound : ∀ x, E x → x ∈ xs) (pe : P E) :
    ∃ L, L ⊆ₚ E ∧ P L ∧ ∀ D, D ⊆ₚ L → P D → L ⊆ₚ D := by
  classical
  induction xs generalizing P E with
  | nil =>
    refine ⟨E, subset_refl E, pe, ?_⟩
    intro _ _ _ x hx
    have := bound x hx
    simp at this
  | cons a xs ih =>
    by_cases canOmit : ∃ D, D ⊆ₚ E ∧ P D ∧ ¬ D a
    · obtain ⟨D, hd, pd, na⟩ := canOmit
      have bd : ∀ x, D x → x ∈ xs := by
        intro x hx
        have hm := bound x (hd x hx)
        rcases List.mem_cons.mp hm with he | hm
        · subst x; exact False.elim (na hx)
        · exact hm
      obtain ⟨L, hl, pl, minimal⟩ := ih P D bd pd
      exact ⟨L, subset_trans hl hd, pl, minimal⟩
    · have required : ∀ D, D ⊆ₚ E → P D → D a := by
        intro D hd pd
        apply Classical.byContradiction
        intro h
        exact canOmit ⟨D, hd, pd, h⟩
      have ea := required E (subset_refl E) pe
      have br : ∀ x, erase a E x → x ∈ xs := by
        intro x hx
        rcases List.mem_cons.mp (bound x hx.1) with he | hm
        · exact False.elim (hx.2 he)
        · exact hm
      have pr : P (insert a (erase a E)) := by rw [insert_erase ea]; exact pe
      obtain ⟨L, hl, pl, minimal⟩ := ih (fun D => P (insert a D)) (erase a E) br pr
      have le : insert a L ⊆ₚ E := by
        intro x hx
        rcases hx with he | hx
        · exact he ▸ ea
        · exact (hl x hx).1
      refine ⟨insert a L, le, pl, ?_⟩
      intro D hd pd
      have da := required D (subset_trans hd le) pd
      have er : erase a D ⊆ₚ L := by
        intro x hx
        rcases hd x hx.1 with he | hx'
        · exact False.elim (hx.2 he)
        · exact hx'
      have pd' : P (insert a (erase a D)) := by rw [insert_erase da]; exact pd
      have lm := minimal (erase a D) er pd'
      intro x hx
      rcases hx with he | hx
      · exact he ▸ da
      · exact (lm x hx).1

def Label (A B : Pred α) (J : Pred (Rule α)) (N : Pred (Nogood α))
    (c : α) (L : Pred α) : Prop :=
  L ⊆ₚ A ∧ Cons B J N L ∧ EnvClosure B J L c ∧
    ∀ D, D ⊆ₚ L → EnvClosure B J D c → L ⊆ₚ D

theorem label_characterization (inventory : List α) (A B : Pred α)
    (J : Pred (Rule α)) (N : Pred (Nogood α))
    (finiteA : ∀ x, A x → x ∈ inventory) (c : α) (E : Pred α) (ea : E ⊆ₚ A) :
    (Cons B J N E ∧ EnvClosure B J E c) ↔
    (Cons B J N E ∧ ∃ L, Label A B J N c L ∧ L ⊆ₚ E) := by
  constructor
  · rintro ⟨hc, hs⟩
    obtain ⟨L, hl, sl, ml⟩ := finite_minimal inventory
      (fun D => EnvClosure B J D c) E (fun x hx => finiteA x (ea x hx)) hs
    exact ⟨hc, L, ⟨subset_trans hl ea, cons_downward_closed B J N hl hc, sl, ml⟩, hl⟩
  · rintro ⟨hc, L, hlabel, hl⟩
    exact ⟨hc, env_closure_monotone B J hl c hlabel.2.2.1⟩

def EnvUnion (L : ι → Pred α) : Pred α := fun x => ∃ i, L i x

theorem joint_support_consistency (inventory : List α) (A B : Pred α)
    (J : Pred (Rule α)) (N : Pred (Nogood α))
    (finiteA : ∀ x, A x → x ∈ inventory) (targets : ι → α) :
    (∃ E, E ⊆ₚ A ∧ Cons B J N E ∧ ∀ i, EnvClosure B J E (targets i)) ↔
    (∃ L : ι → Pred α, (∀ i, Label A B J N (targets i) (L i)) ∧
      Cons B J N (EnvUnion L)) := by
  classical
  constructor
  · rintro ⟨E, ea, hc, hs⟩
    have choices : ∀ i, ∃ L, Label A B J N (targets i) L ∧ L ⊆ₚ E :=
      fun i => ((label_characterization inventory A B J N finiteA (targets i) E ea).mp
        ⟨hc, hs i⟩).2
    let L := fun i => Classical.choose (choices i)
    have hL := fun i => Classical.choose_spec (choices i)
    refine ⟨L, fun i => (hL i).1, cons_downward_closed B J N ?_ hc⟩
    rintro x ⟨i, hx⟩
    exact (hL i).2 x hx
  · rintro ⟨L, hL, hc⟩
    refine ⟨EnvUnion L, ?_, hc, ?_⟩
    · rintro x ⟨i, hx⟩; exact (hL i).1 x hx
    · intro i
      exact env_closure_monotone B J (fun x hx => ⟨i, hx⟩) _ (hL i).2.2.1

/-! 2. Observation semantics, finite execution simulation and connectors. -/

structure Machine (Obs : Type) where
  observes : Pred Obs

def Refines (M A : Machine Obs) : Prop := M.observes ⊆ₚ A.observes
def Sat (M : Machine Obs) (Φ : Pred Obs) : Prop := M.observes ⊆ₚ Φ
def pullback (f : X → Y) (Φ : Pred Y) : Pred X := fun x => Φ (f x)

theorem refines_refl (M : Machine Obs) : Refines M M := subset_refl _
theorem refines_trans {M A P : Machine Obs} (h : Refines M A) (g : Refines A P) :
    Refines M P := subset_trans h g
theorem satisfaction_transfer {M A : Machine Obs} {Φ : Pred Obs}
    (h : Refines M A) (s : Sat A Φ) : Sat M Φ := subset_trans h s
theorem pullback_composition (f : X → Y) (g : Y → Z) (Φ : Pred Z) :
    pullback (fun x => g (f x)) Φ = pullback f (pullback g Φ) := rfl
theorem pullback_satisfaction (M : Machine X) (A : Machine Y) (f : X → Y)
    (h : ∀ x, M.observes x → A.observes (f x)) (Φ : Pred Y) (s : Sat A Φ) :
    Sat M (pullback f Φ) := fun x hx => s (f x) (h x hx)

def Correlated : Pred (Bool × Bool) := fun p => p.1 = p.2
def Proj1 (R : Pred (X × Y)) : Pred X := fun x => ∃ y, R (x, y)
def Proj2 (R : Pred (X × Y)) : Pred Y := fun y => ∃ x, R (x, y)

theorem projection_erases_correlation :
    Proj1 Correlated false ∧ Proj2 Correlated true ∧ ¬ Correlated (false, true) :=
  ⟨⟨false, rfl⟩, ⟨true, rfl⟩, Bool.noConfusion⟩

structure TransitionSystem (State Action : Type) where
  initial : Pred State
  step : State → Action → State → Prop

inductive Runs (T : TransitionSystem S A) : S → List A → S → Prop where
  | nil (s) : Runs T s [] s
  | cons {s u t a w} : T.step s a u → Runs T u w t → Runs T s (a :: w) t

def traceMachine (T : TransitionSystem S A) : Machine (List A) :=
  ⟨fun w => ∃ s t, T.initial s ∧ Runs T s w t⟩

def mapTrace (f : A → Option B) : List A → List B
  | [] => []
  | a :: w => match f a with
    | none => mapTrace f w
    | some b => b :: mapTrace f w

structure Simulation (C : TransitionSystem S A) (D : TransitionSystem T B)
    (f : A → Option B) (I : Pred S) (R : S → T → Prop) : Prop where
  initInv : ∀ s, C.initial s → I s
  initRel : ∀ s, C.initial s → ∃ t, D.initial t ∧ R s t
  consecution : ∀ s a u, I s → C.step s a u → I u
  silent : ∀ s t a u, I s → R s t → C.step s a u → f a = none → R u t
  visible : ∀ s t a u b, I s → R s t → C.step s a u → f a = some b →
    ∃ v, D.step t b v ∧ R u v

theorem simulate_run {C : TransitionSystem S A} {D : TransitionSystem T B}
    {f : A → Option B} {I : Pred S} {R : S → T → Prop}
    (sim : Simulation C D f I R) {s u : S} {w : List A} (run : Runs C s w u) :
    ∀ t, I s → R s t → ∃ v, Runs D t (mapTrace f w) v ∧ R u v := by
  induction run with
  | nil s => intro t _ hr; exact ⟨t, Runs.nil t, hr⟩
  | @cons s u z a w step _ ih =>
    intro t hi hr
    have hu := sim.consecution s a u hi step
    cases hf : f a with
    | none =>
      obtain ⟨v, hv, rv⟩ := ih t hu (sim.silent s t a u hi hr step hf)
      exact ⟨v, by simpa [mapTrace, hf] using hv, rv⟩
    | some b =>
      obtain ⟨v, dv, rv⟩ := sim.visible s t a u b hi hr step hf
      obtain ⟨q, dq, rq⟩ := ih v hu rv
      exact ⟨q, by simpa [mapTrace, hf] using Runs.cons dv dq, rq⟩

theorem inductive_simulation_sound {C : TransitionSystem S A} {D : TransitionSystem T B}
    {f : A → Option B} {I : Pred S} {R : S → T → Prop}
    (sim : Simulation C D f I R) :
    ∀ w, (traceMachine C).observes w → (traceMachine D).observes (mapTrace f w) := by
  rintro w ⟨s, u, hs, run⟩
  obtain ⟨t, ht, rt⟩ := sim.initRel s hs
  obtain ⟨v, hv, _⟩ := simulate_run sim run t (sim.initInv s hs) rt
  exact ⟨t, v, ht, hv⟩

structure Connector (ι Obs : Type) where
  compose : (ι → Machine Obs) → Machine Obs
  precongruence : ∀ M A, (∀ i, Refines (M i) (A i)) → Refines (compose M) (compose A)

def Dec (K : Connector ι Obs) (A : ι → Machine Obs) (M : Machine Obs) : Prop :=
  Refines (K.compose A) M

theorem compositional_sibling_independence (K : Connector ι Obs)
    (children contracts : ι → Machine Obs) (parent : Machine Obs) (Φ : Pred Obs)
    (sat : Sat parent Φ) (dec : Dec K contracts parent)
    (refs : ∀ i, Refines (children i) (contracts i)) :
    Refines (K.compose children) parent ∧ Sat (K.compose children) Φ := by
  have h := refines_trans (K.precongruence children contracts refs) dec
  exact ⟨h, satisfaction_transfer h sat⟩

/-! 3. Exact local key arguments and boundary proof substitution.
    Keys are typed tuples; applying any deterministic encoding/hash preserves Eq. -/

def update [DecidableEq ι] (f : ι → X) (i : ι) (x : X) : ι → X :=
  fun j => if j = i then x else f j

structure Node (ι Obs Context Map : Type) where
  property : Pred Obs
  parent : Machine Obs
  connector : Connector ι Obs
  contracts : ι → Machine Obs
  children : ι → Machine Obs
  maps : ι → Map
  context : Context

def updateChild [DecidableEq ι] (v : Node ι Obs Context Map)
    (i : ι) (M : Machine Obs) (f : Map) : Node ι Obs Context Map :=
  { v with children := update v.children i M, maps := update v.maps i f }

def k_Sat (v : Node ι Obs Context Map) := (v.parent, v.property, v.context)
def k_Dec (v : Node ι Obs Context Map) :=
  (v.connector, v.contracts, v.parent, v.context)
def k_Ref (v : Node ι Obs Context Map) (i : ι) :=
  (v.children i, v.contracts i, v.maps i, v.context)
def k_Mov (v : Node ι Obs Context Map) (i : ι) :=
  (v.children i, v.contracts i, v.maps i, v.connector,
    (fun j : { j : ι // j ≠ i } => v.contracts j.val), v.context)

theorem ancestor_keys_invariant [DecidableEq ι] (v : Node ι Obs Context Map)
    (i : ι) (M : Machine Obs) (f : Map) :
    k_Sat (updateChild v i M f) = k_Sat v ∧
    k_Dec (updateChild v i M f) = k_Dec v ∧
    ∀ j, j ≠ i →
      k_Ref (updateChild v i M f) j = k_Ref v j ∧
      k_Mov (updateChild v i M f) j = k_Mov v j := by
  refine ⟨rfl, rfl, ?_⟩
  intro j hj
  simp [k_Ref, k_Mov, updateChild, update, hj]

theorem boundary_proof_substitution_cutoff [DecidableEq ι]
    (v : Node ι Obs Context Map) (i : ι) (replacement : Machine Obs)
    (sat : Sat v.parent v.property) (dec : Dec v.connector v.contracts v.parent)
    (siblings : ∀ j, j ≠ i → Refines (v.children j) (v.contracts j))
    (newRef : Refines replacement (v.contracts i)) :
    Refines (v.connector.compose (update v.children i replacement)) v.parent ∧
    Sat (v.connector.compose (update v.children i replacement)) v.property := by
  apply compositional_sibling_independence v.connector _ v.contracts v.parent v.property sat dec
  intro j
  by_cases hj : j = i
  · subst j; simpa [update] using newRef
  · simpa [update, hj] using siblings j hj

theorem replacement_need_not_refine_old :
    let old : Machine Bool := ⟨fun b => b = false⟩
    let replacement : Machine Bool := ⟨fun b => b = true⟩
    let contract : Machine Bool := ⟨fun _ => True⟩
    Refines old contract ∧ Refines replacement contract ∧ ¬ Refines replacement old := by
  refine ⟨fun _ _ => True.intro, fun _ _ => True.intro, ?_⟩
  intro h
  have bad := h true rfl
  cases bad

/-! 4. Joint connector trajectories and upward contract strengthening. -/

def Realizable (M : Machine Obs) (o : Obs) : Prop := M.observes o

structure TrajectoryModel (ι Obs Trace : Type) where
  legal : Pred Trace
  slice : ι → Trace → Obs
  project : Trace → Obs

def trajectoryConnector (T : TrajectoryModel ι Obs Trace) : Connector ι Obs where
  compose M := ⟨fun o => ∃ t, T.legal t ∧ T.project t = o ∧
    ∀ i, Realizable (M i) (T.slice i t)⟩
  precongruence M A refs := by
    rintro o ⟨t, legal, ho, slices⟩
    exact ⟨t, legal, ho, fun i => refs i (T.slice i t) (slices i)⟩

theorem joint_concretization_sound (T : TrajectoryModel ι Obs Trace)
    (M : ι → Machine Obs) (o : Obs)
    (joint : ∃ t, T.legal t ∧ T.project t = o ∧
      ∀ i, Realizable (M i) (T.slice i t)) :
    Realizable ((trajectoryConnector T).compose M) o ∧
    ∀ i, ∃ t, T.legal t ∧ T.project t = o ∧ Realizable (M i) (T.slice i t) := by
  refine ⟨joint, ?_⟩
  obtain ⟨t, legal, ho, slices⟩ := joint
  exact fun i => ⟨t, legal, ho, slices i⟩

def sharedBit : TrajectoryModel Bool Bool Bool :=
  ⟨fun _ => True, fun _ t => t, fun _ => false⟩
def bitChild (i : Bool) : Machine Bool := ⟨fun b => b = i⟩

theorem independent_concretization_insufficient :
    (∀ i, ∃ t, sharedBit.legal t ∧ sharedBit.project t = false ∧
      Realizable (bitChild i) (sharedBit.slice i t)) ∧
    ¬ (∃ t, sharedBit.legal t ∧ sharedBit.project t = false ∧
      ∀ i, Realizable (bitChild i) (sharedBit.slice i t)) := by
  constructor
  · intro i; exact ⟨i, True.intro, rfl, rfl⟩
  · rintro ⟨t, _, _, h⟩
    have hf : t = false := h false
    have ht : t = true := h true
    have bad := hf.symm.trans ht
    cases bad

theorem upward_strengthening_preserves_dec (K : Connector ι Obs)
    (stronger contracts : ι → Machine Obs) (parent : Machine Obs)
    (strengthening : ∀ i, Refines (stronger i) (contracts i))
    (dec : Dec K contracts parent) : Dec K stronger parent :=
  refines_trans (K.precongruence stronger contracts strengthening) dec

/-! 5. Contextual projection and incremental validity by exact obligation reuse.
    These proofs concern behavioral obligations. Structural, profile and protected
    preservation conditions remain separate premises unless represented in Req. -/

def ContextualProjection (ΔP : Prop) (K : Connector ι Obs)
    (contracts : ι → Machine Obs) (R : Pred Obs) : Prop :=
  ΔP → Sat (K.compose contracts) R

theorem contextual_projection_sound {ΔP : Prop} (K : Connector ι Obs)
    (children contracts : ι → Machine Obs) (R : Pred Obs)
    (context : ΔP) (projection : ContextualProjection ΔP K contracts R)
    (refs : ∀ i, Refines (children i) (contracts i)) :
    Sat (K.compose children) R :=
  satisfaction_transfer (K.precongruence children contracts refs) (projection context)

def passThroughConnector : Connector Unit Obs where
  compose children := children ()
  precongruence _ _ refs := refs ()

theorem pass_through_projection (ΔP : Prop) (R : Pred Obs) :
    ContextualProjection ΔP passThroughConnector (fun _ => ⟨R⟩) R :=
  fun _ => subset_refl R

/- Denote does not depend on the version: retaining a label while changing its
   meaning is not obligation reuse. No decidable equality or finite inventory
   is needed for the logical frame theorem. -/
def Valid (Denote : Obl → Prop) (Req : Dev → Obl → Prop) (G : Dev) : Prop :=
  ∀ q, Req G q → Denote q

theorem validity_by_reuse {Denote : Obl → Prop} {Req : Dev → Obl → Prop}
    {G G' : Dev} (old : Valid Denote Req G)
    (covered : ∀ q, Req G' q → Req G q ∨ Denote q) : Valid Denote Req G' :=
  fun q hq => (covered q hq).elim (old q) id

theorem incremental_frame_cutoff {Denote : Obl → Prop} {Req : Dev → Obl → Prop}
    {G G' : Dev} (old : Valid Denote Req G)
    (changed : ∀ q, Req G' q → ¬ Req G q → Denote q) : Valid Denote Req G' := by
  classical
  apply validity_by_reuse old
  intro q hq
  by_cases previous : Req G q
  · exact Or.inl previous
  · exact Or.inr (changed q hq previous)

namespace Versioned

/- A finite snapshot of scoped obligations, not a formalization of the entire
   development graph. All terms needed by each inclusion are carried directly.
   This specialization uses one observation space and identity observation maps;
   concrete wiring adequacy and semantic-profile admissibility are not proved. -/
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
    Valid Denote Req (versions (t + 1)) :=
  incremental_frame_cutoff old changed

private def childSlots (n : Nat) : List (Fin n) :=
  (List.range n).attach.map (fun j => ⟨j.val, List.mem_range.mp j.property⟩)

private theorem mem_childSlots (i : Fin n) : i ∈ childSlots n := by
  apply List.mem_map.mpr
  exact ⟨⟨i.val, List.mem_range.mpr i.isLt⟩, List.mem_attach _ _, rfl⟩

def nodeRequirements (cell : Cell) (v : Node (Fin n) Obs Unit Unit) :
    Snapshot Cell (Fin n) Obs :=
  [.sat cell v.parent v.property, .dec cell v.connector v.contracts v.parent] ++
    (childSlots n).map (fun i => .child cell i (v.children i) (v.contracts i))

/- Updating a child changes neither the exact Sat/Dec propositions nor the
   unchanged siblings' propositions. Membership gives direct proof reuse. -/
theorem node_obligations_reused (cell : Cell) (v : Node (Fin n) Obs Unit Unit)
    (i : Fin n) (replacement : Machine Obs) :
    let next := updateChild v i replacement ()
    Obligation.sat cell next.parent next.property ∈ nodeRequirements cell v ∧
    Obligation.dec cell next.connector next.contracts next.parent ∈ nodeRequirements cell v ∧
    ∀ j, j ≠ i →
      Obligation.child cell j (next.children j) (next.contracts j) ∈ nodeRequirements cell v := by
  dsimp only
  refine ⟨?_, ?_, ?_⟩
  · simp [nodeRequirements, updateChild]
  · simp [nodeRequirements, updateChild]
  · intro j hj
    apply List.mem_append_right
    apply List.mem_map.mpr
    exact ⟨j, mem_childSlots j, by simp [updateChild, update, hj]⟩

/- Concrete replacement: old parent and sibling proofs are reused, whereas the
   changed child and the appended leaf implementation need their own proofs.
   The finite snapshot theorem also permits arbitrary lists of added/removed
   node requirements, without imposing a one-to-one node correspondence. -/
theorem node_update_with_leaf_valid (cell leaf : Cell)
    (v : Node (Fin n) Obs Unit Unit) (i : Fin n)
    (replacement program : Machine Obs)
    (old : Valid Denote Req (nodeRequirements cell v))
    (newRef : Refines replacement (v.contracts i))
    (newImpl : Refines program replacement) :
    Valid Denote Req (nodeRequirements cell (updateChild v i replacement ()) ++
      [.impl leaf program replacement]) := by
  apply incremental_frame_cutoff old
  intro q hq fresh
  have reused := node_obligations_reused cell v i replacement
  rcases List.mem_append.mp hq with hn | hl
  · simp only [nodeRequirements, List.mem_append, List.mem_cons, List.not_mem_nil,
      or_false, List.mem_map] at hn
    rcases hn with (hs | hd) | ⟨j, _, hj⟩
    · subst q
      exact False.elim (fresh reused.1)
    · subst q
      exact False.elim (fresh reused.2.1)
    · subst q
      by_cases same : j = i
      · subst j
        simpa [Denote, updateChild, update] using newRef
      · exact False.elim (fresh (reused.2.2 j same))
  · simp only [List.mem_cons, List.not_mem_nil, or_false] at hl
    subst q
    exact newImpl

/- A nonempty valid snapshot does not validate a changed implementation for
   free: a program returning true violates a contract allowing only false. -/
theorem changed_leaf_requires_new_evidence :
    let contract : Machine Bool := ⟨fun b => b = false⟩
    let replacement : Machine Bool := ⟨fun b => b = true⟩
    let old : Snapshot Unit Unit Bool := [.impl () contract contract]
    let next : Snapshot Unit Unit Bool := [.impl () replacement contract]
    Valid Denote Req old ∧ ¬ Valid Denote Req next := by
  dsimp only
  constructor
  · intro q hq
    simp only [Req, List.mem_cons, List.not_mem_nil, or_false] at hq
    subst q
    exact refines_refl _
  · intro valid
    have bad := valid (.impl () ⟨fun b => b = true⟩ ⟨fun b => b = false⟩)
      (by simp [Req])
    have impossible : true = false := bad true rfl
    cases impossible

end Versioned

end Jirl
