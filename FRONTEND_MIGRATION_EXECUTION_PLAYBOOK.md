# Frontend Migration Execution Playbook

## Purpose

This document is the operating procedure for the **current frontend migration only**.

The migration objective is:

> Make `app` responsible only for routing, and move screen implementation, reusable components, and applicable business/UI logic into `src` in a segmented and reusable structure.

The migration must preserve the application's existing navigation, styles, and behavior.

This document does **not** authorize feature work, redesigns, dependency changes, unrelated refactors, or general cleanup.

---

# 1. Source requirements that must be satisfied

The assignment requires all of the following:

1. Finish moving components that still live in `app` into `src`.
2. Files inside `app` must be limited to defining routes and rendering components imported from `src`.
3. Large screens must be divided into smaller components with a single responsibility.
4. `src` must be organized coherently.
5. Reusable UI elements may live in `src/components`.
6. Screen- or feature-level implementation may live in `src/screens` or `src/features`.
7. Custom hooks may live in `src/hooks` or next to the functionality they belong to.
8. Components should mainly handle presentation.
9. State management that belongs to feature/screen behavior should be extracted into custom hooks.
10. Relevant `useEffect` logic should be extracted into custom hooks.
11. Service/API calls should be extracted from presentation components.
12. Form validation should be extracted from presentation components.
13. Repeated logic should be extracted appropriately.
14. Every custom hook must use the `use` prefix.
15. A hook must return only what the consuming component needs: data, loading state, error state, and functions/actions.
16. The application must continue working the same after the migration: navigation, styles, and behavior.
17. The assignment requires at least **3 meaningful custom hooks per team member**.
18. Commits must be progressive rather than one final commit.
19. Commit messages must describe the actual change.
20. Every team member must have commits recorded for their contribution.
21. Assignment deadline: **Thursday, October 8 at 6:00 p.m.**

---

# 2. Absolute scope boundary

You are authorized to complete the migration described above and nothing else.

## You MUST NOT, unless strictly required to preserve behavior after moving code

- add features;
- remove features;
- redesign screens;
- rewrite copy;
- change navigation flows;
- change route paths;
- change route names;
- change route parameters;
- change API endpoints;
- change API request/response contracts;
- change authentication behavior;
- change persistence behavior;
- change validation rules;
- change business rules;
- change state-management libraries;
- replace the router;
- replace the networking layer;
- replace UI libraries;
- upgrade packages;
- add dependencies;
- modify backend code;
- change colors, typography, spacing, assets, icons, or animations;
- rename unrelated files;
- reorganize compliant code for aesthetic reasons;
- perform repository-wide formatting;
- fix unrelated bugs;
- delete unrelated code;
- introduce an architecture not required by this migration.

If you discover an unrelated issue, report it separately and leave it unchanged.

The success criterion is:

> **Same application, same behavior, better separation of responsibilities.**

---

# 3. Mandatory first step: audit before editing

Some screens are already migrated.

Therefore, **do not start by moving files**.

Before making any code change, inspect the frontend codebase and classify the current state.

At minimum inspect:

```text
app/
src/
```

Also inspect any existing:

```text
components/
screens/
features/
hooks/
services/
api/
utils/
contexts/
providers/
```

that participate in screen behavior.

For every route under `app`, determine:

- route path;
- route group;
- layout relationship;
- dynamic parameters, if any;
- what file currently renders the screen;
- whether the route contains screen JSX;
- whether the route contains feature state;
- whether the route contains `useEffect`;
- whether the route makes service/API calls;
- whether the route performs form validation;
- whether the route contains repeated behavior;
- whether a corresponding screen already exists in `src`;
- whether that screen is already segmented;
- whether appropriate custom hooks already exist;
- whether the current migration appears correct;
- whether changing it would alter already-migrated code.

Do not edit until this inventory exists.

---

# 4. Required classification for every route

Every route must be placed in exactly one of these categories.

## A. `MIGRATED_CORRECTLY`

Use this status only when:

- the `app` route is thin;
- the route performs routing responsibilities only;
- screen implementation lives in `src`;
- substantial visual sections are not implemented inside `app`;
- screen/business behavior is not implemented inside the route;
- obvious state/effect/API/form logic is already separated appropriately;
- the structure is coherent with the rest of the migrated project;
- no behavior regression is evident.

### Action

**Leave it unchanged.**

Do not remigrate it. Do not rename it. Do not reorganize it merely because another structure is possible.

## B. `NOT_MIGRATED`

Use when the route still directly contains substantial screen implementation.

Typical signs:

- large JSX tree in `app`;
- form implementation in `app`;
- stateful screen logic in `app`;
- API calls in `app`;
- effect-driven feature logic in `app`;
- large sections of a screen defined inside the route;
- reusable components defined inside the route.

### Action

Migrate it according to this playbook.

## C. `PARTIALLY_MIGRATED`

Use when migration has started but is incomplete.

Examples:

- route imports a screen but still owns API calls;
- route imports a screen but still owns form state;
- route imports a screen but still owns feature `useEffect` logic;
- screen is in `src`, but large independent UI sections remain monolithic;
- behavior is in `src`, but clear hook candidates remain embedded in the presentation component;
- reusable feature components are still defined in the screen file.

### Action

Complete only the missing migration work. Preserve already-correct pieces.

## D. `MIGRATED_INCORRECTLY_REQUIRES_APPROVAL`

Use when a screen was already migrated, but the existing migrated implementation violates the required architecture in a way that would require correcting prior work.

Examples:

- the migrated version changed observable behavior;
- the route contract was altered during the prior migration;
- required screen logic was lost;
- the prior migration introduced a conflicting architecture;
- a supposedly thin route still owns significant business logic;
- the hook design is materially wrong and fixing it requires restructuring already-migrated code;
- code was moved to an inappropriate layer and correction would alter the prior implementation;
- `src` now depends improperly on route implementation files in `app`.

### Mandatory action

1. **Do not fix it.**
2. **Do not partially fix it.**
3. **Do not include its correction inside another change.**
4. Report the problem to the user.
5. Wait for explicit authorization before modifying that migration.

You may continue with other independent migration items that do not require touching the flagged code.

---

# 5. Required audit report before migration

Before changing files, produce a report in this format:

```md
# Migration Audit

| Route | Status | Current implementation | Problem | Planned action |
|---|---|---|---|---|
| `app/...` | MIGRATED_CORRECTLY | `src/...` | None | Leave unchanged |
| `app/...` | NOT_MIGRATED | Inline in route | UI + logic still in `app` | Migrate |
| `app/...` | PARTIALLY_MIGRATED | `src/...` | API logic still in screen | Extract hook |
| `app/...` | MIGRATED_INCORRECTLY_REQUIRES_APPROVAL | `src/...` | Existing migration issue | Report and lock |
```

Then include:

```md
## Totals
- Correctly migrated:
- Not migrated:
- Partially migrated:
- Approval required:

## Planned migration order
1.
2.
3.
```

If any item is `MIGRATED_INCORRECTLY_REQUIRES_APPROVAL`, include a separate approval report before touching it.

---

# 6. Approval report for an incorrect existing migration

Use this structure:

```md
# Approval Required: Existing Migration Issue

## Affected files
- `...`
- `...`

## Current implementation
Describe what exists now.

## Violated migration rule
State the exact architectural rule that is violated.

## Why this is considered an existing incorrect migration
Explain why this is not simply unfinished work.

## Proposed correction
Describe precisely what would be changed.

## Expected blast radius
- imports:
- routes:
- hooks:
- components:
- behavior risk:

## Status
No changes have been made to this migrated item.

Explicit user authorization is required before correction.
```

Do not interpret silence as approval.

---

# 7. Target architecture

Use the architecture already established by correctly migrated screens.

Do not create a second competing architecture.

A valid screen-oriented organization may look like:

```text
app/
  _layout.tsx
  index.tsx
  login.tsx
  register.tsx
  clinics/
    [id].tsx

src/
  components/
    Button.tsx
    Input.tsx
    Card.tsx

  screens/
    Login/
      LoginScreen.tsx
      components/
        LoginForm.tsx
      hooks/
        useLogin.ts

    ClinicDetails/
      ClinicDetailsScreen.tsx
      components/
        ClinicHeader.tsx
        ClinicInfo.tsx
      hooks/
        useClinicDetails.ts

  hooks/
    useSharedSomething.ts

  services/
  utils/
```

A valid feature-oriented organization may look like:

```text
app/
  ...

src/
  components/

  features/
    auth/
      screens/
        LoginScreen.tsx
      components/
        LoginForm.tsx
      hooks/
        useLogin.ts

    clinics/
      screens/
        ClinicDetailsScreen.tsx
      components/
        ClinicHeader.tsx
      hooks/
        useClinicDetails.ts

  hooks/
  services/
  utils/
```

## Architecture selection rule

If the repository already uses `src/screens` coherently, continue using it.

If it already uses `src/features` coherently, continue using it.

If both exist, determine what distinction the existing code is making and preserve it if coherent.

Do not reorganize already-correct migrations merely to make one folder convention universal.

---

# 8. The `app` directory contract

`app` is the routing layer.

A route file may:

- declare the route by existing router convention;
- import a screen from `src`;
- render that screen;
- define route-specific metadata;
- define route/layout configuration;
- obtain route parameters when that is genuinely a routing concern;
- pass route-derived values to a screen;
- use router APIs for routing behavior.

A simple route should be approximately this thin:

```tsx
import { LoginScreen } from '@/src/screens/Login/LoginScreen';

export default function LoginRoute() {
  return <LoginScreen />;
}
```

A dynamic route may look like:

```tsx
import { useLocalSearchParams } from 'expo-router';
import { ClinicDetailsScreen } from '@/src/screens/ClinicDetails/ClinicDetailsScreen';

export default function ClinicDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ClinicDetailsScreen clinicId={id} />;
}
```

The exact imports and router API must follow the existing project.

---

# 9. What must not remain in `app`

Unless it is strictly route-specific, remove these responsibilities from route files:

- large visual JSX;
- feature components;
- form UI implementation;
- form state;
- screen state;
- data-fetching state;
- mutation state;
- screen-specific `useEffect`;
- API/service calls;
- validation rules;
- domain/business logic;
- repeated logic;
- data transformations used by the screen;
- feature-specific event orchestration;
- reusable components.

Do not move router-required files out of `app`.

Layouts may remain in `app` because they are part of routing.

---

# 10. Screen migration procedure

For each `NOT_MIGRATED` item, and each `PARTIALLY_MIGRATED` item that does not require approval, follow this procedure.

## Step 1 — Record the current behavior

Before moving code, identify:

- route path;
- route group;
- route parameters;
- query parameters;
- navigation targets;
- entry points;
- exported route options;
- layout relationship;
- current loading states;
- current error states;
- current form behavior;
- current visible content;
- current styles;
- current service calls.

This is the baseline that must be preserved.

## Step 2 — Establish the screen boundary

Move the main visual implementation into `src`.

Examples:

```text
src/screens/Login/LoginScreen.tsx
```

or:

```text
src/features/auth/screens/LoginScreen.tsx
```

The route should then import and render that screen.

Do not redesign the screen while moving it.

## Step 3 — Segment large screens

Inspect the screen for meaningful independent sections.

A section is a good component candidate when it:

- has one clear visual responsibility;
- can be named by what it represents;
- has its own inputs/props;
- contains repeated JSX;
- is independently reused;
- represents a distinct loading/error/empty/presentation state;
- makes the screen easier to understand without introducing meaningless fragmentation.

Examples:

```text
LoginForm
ProfileHeader
ClinicCard
ClinicList
ClinicSearchBar
AppointmentSection
EmptyAppointmentsState
LoadingState
ErrorState
```

Do **not** split every `<View>` into a separate file.

The requirement is single responsibility, not maximum file count.

---

# 11. Component placement rules

## Shared reusable component

Place under a shared area such as:

```text
src/components/
```

only when it is generic enough to be used across unrelated features.

Examples:

```text
Button
Input
Card
Avatar
Modal
LoadingIndicator
```

## Feature/screen-local component

Keep next to its owner when it has domain meaning.

Examples:

```text
src/features/clinics/components/ClinicCard.tsx
src/features/appointments/components/AppointmentTimePicker.tsx
src/screens/Login/components/LoginForm.tsx
```

Do not dump all extracted components into `src/components`.

---

# 12. Mandatory logic review for every migrated screen

After moving the screen, inspect it for:

- `useState`;
- `useReducer`;
- `useEffect`;
- API calls;
- service calls;
- asynchronous request orchestration;
- loading state;
- error state;
- form state;
- validation;
- submit handling;
- refresh behavior;
- retry behavior;
- repeated behavior;
- subscriptions;
- timers;
- derived domain state;
- complex filtering/sorting;
- non-trivial interaction handlers.

For each item, decide whether it belongs in a custom hook.

The default architectural intent is:

> Visual components should primarily render and connect user interactions. Custom hooks should own feature behavior.

---

# 13. Custom hook rules

## 13.1 Naming

Every custom hook must start with `use`.

Correct:

```text
useLogin
useRegister
useClinics
useClinicDetails
useAppointments
useProfileForm
```

Incorrect:

```text
loginLogic
clinicController
appointmentManager
formHandler
```

## 13.2 Responsibility

Each hook must represent one coherent behavior boundary.

Good:

```ts
const {
  email,
  password,
  errors,
  isSubmitting,
  setEmail,
  setPassword,
  submit,
} = useLogin();
```

Bad:

```ts
const everything = useScreen();
```

when one hook becomes a bucket for unrelated responsibilities.

Also bad: creating one custom hook for every simple state variable solely to increase the number of hooks.

The assignment requires meaningful hooks, not artificial hook count inflation.

## 13.3 Logic that should usually move to hooks

When appropriate, extract:

- screen state;
- feature state;
- effects;
- service/API orchestration;
- request lifecycle;
- loading state;
- error state;
- validation;
- form submission;
- retry logic;
- refresh logic;
- subscriptions;
- timers tied to feature behavior;
- repeated behavior;
- derived feature/domain state;
- non-trivial interaction logic.

## 13.4 Logic that may remain in visual components

Keep simple presentation logic local when extracting it would reduce clarity.

Examples:

- mapping prepared data into components;
- simple display conditionals;
- direct event wiring;
- small presentation-only calculations;
- trivial local visual toggles.

Do not create hooks for ordinary JSX rendering.

## 13.5 Hook return contract

A hook must expose only what its consumer needs.

Preferred:

```ts
return {
  clinics,
  isLoading,
  error,
  refresh,
};
```

Avoid exposing:

- internal helpers;
- raw service clients;
- unused state;
- internal setters the UI should not control;
- request implementation details;
- values with no current consumer.

Treat the return object as a public interface.

---

# 14. Hook placement

Use a global area such as:

```text
src/hooks/
```

for hooks that are genuinely shared across features.

Use feature-local placement such as:

```text
src/features/appointments/hooks/useAppointments.ts
```

or:

```text
src/screens/Appointments/hooks/useAppointments.ts
```

when only that feature/screen owns the behavior.

Prefer locality unless reuse is real.

---

# 15. API/service boundary

Do not rewrite the backend integration as part of this migration.

If the project already has service/API modules, reuse them.

Preferred dependency flow:

```text
app route
    ↓
screen in src
    ↓
custom hook
    ↓
existing service/API layer
```

Example:

```tsx
export function ClinicsScreen() {
  const {
    clinics,
    isLoading,
    error,
    refresh,
  } = useClinics();

  if (isLoading) return <ClinicsLoadingState />;
  if (error) return <ClinicsErrorState onRetry={refresh} />;

  return <ClinicList clinics={clinics} />;
}
```

The screen handles presentation.

The hook handles request behavior.

The service handles transport/API integration.

---

# 16. Form migration rules

Separate forms into presentation and behavior.

## Presentation may contain

- inputs;
- labels;
- error text rendering;
- submit buttons;
- visual disabled/loading state;
- calling handlers returned by a hook.

## Hook should contain, when applicable

- field state;
- validation rules;
- validation errors;
- submission logic;
- service/API call;
- loading state;
- submission error;
- feature-specific post-success behavior.

Preserve existing validation semantics exactly.

Do not tighten or loosen validation during migration.

---

# 17. Routing isolation

Routing knowledge should remain as close to `app` as practical.

Prefer:

```tsx
export default function ClinicRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ClinicScreen clinicId={id} />;
}
```

over deeply coupling generic feature components to route files.

Never import route implementation files from `app` into `src`.

Preferred dependency direction:

```text
app -> src
```

Avoid:

```text
src -> app
```

---

# 18. Existing migrated code preservation

If a route is `MIGRATED_CORRECTLY`:

- do not rewrite it;
- do not move it again;
- do not rename it;
- do not extract more files solely for style;
- do not standardize it beyond what the assignment requires;
- do not change working architecture because you prefer another pattern.

The task is to **finish** the migration.

It is not to repeatedly refactor already-compliant code.

---

# 19. Change minimization

For each migration unit, prefer:

1. move code;
2. extract meaningful components;
3. extract appropriate custom hooks;
4. fix imports;
5. preserve behavior.

Avoid bundling unrelated edits into the same change.

This makes regressions easier to identify.

---

# 20. Validation after every migration unit

After each independent route/screen migration:

1. verify imports resolve;
2. run the project's configured type check, if available;
3. run lint, if configured;
4. run relevant tests, if available;
5. build or launch using the existing project workflow when feasible;
6. open the migrated route;
7. test route parameters;
8. test navigation;
9. test major interactions;
10. test form behavior;
11. test loading state;
12. test error state where practical;
13. confirm styles are unchanged;
14. confirm copy is unchanged;
15. confirm no unrelated file was modified.

If the migration introduced an error, fix that error before moving on.

If an unrelated pre-existing issue appears, report it separately.

---

# 21. Behavior-preservation checklist

For each migrated screen, confirm:

- [ ] Same route path
- [ ] Same route parameters
- [ ] Same query parameters
- [ ] Same navigation destinations
- [ ] Same back behavior
- [ ] Same visible copy
- [ ] Same styles
- [ ] Same assets
- [ ] Same loading behavior
- [ ] Same error behavior
- [ ] Same empty-state behavior
- [ ] Same validation behavior
- [ ] Same service/API behavior
- [ ] Same persistence behavior
- [ ] Same user interactions
- [ ] Same conditional rendering rules
- [ ] Same modal/sheet/drawer behavior where applicable

---

# 22. Full-project final audit

After all authorized migration work is complete, inspect the whole frontend again.

Confirm:

- [ ] Every route under `app` was classified
- [ ] `app` contains routing/layout responsibilities only
- [ ] Screen implementation lives under `src`
- [ ] Reusable UI is organized coherently
- [ ] Large screens are segmented by meaningful responsibility
- [ ] Appropriate state logic is in custom hooks
- [ ] Appropriate effects are in custom hooks
- [ ] API/service orchestration is separated from presentation
- [ ] Form validation is separated from presentation
- [ ] Repeated logic has been extracted where appropriate
- [ ] Custom hooks start with `use`
- [ ] Hooks expose only what consumers need
- [ ] `src` does not improperly depend on `app`
- [ ] Imports resolve
- [ ] Navigation still works
- [ ] Styles are unchanged
- [ ] Behavior is unchanged
- [ ] Already-correct migrations were not unnecessarily rewritten
- [ ] Incorrect prior migrations were not changed without authorization
- [ ] No unrelated work was introduced

---

# 23. Academic hook requirement

The assignment requires at least **3 custom hooks per team member**.

When satisfying this requirement:

- use real behavior boundaries;
- do not create fake hooks solely to reach a number;
- keep hooks useful and coherent;
- attribute each hook to the team member who actually implemented it;
- never fabricate authorship.

If repository history or project context does not establish contributor mapping, report that limitation.

---

# 24. Commit strategy

The assignment requires progressive commits with descriptive messages.

If commit authorization exists, prefer commit boundaries such as:

```text
Migra pantalla de login a src/screens
Extrae lógica de login a useLogin
Segmenta pantalla de clínicas en componentes
Extrae lógica de clínicas a useClinics
Migra pantalla de citas a src/features
Extrae validación de citas a useAppointmentForm
```

Do not:

- create one giant final commit;
- rewrite history;
- fabricate commits for other team members;
- change commit authorship.

If you are not authorized to commit, prepare a recommended commit plan instead.

---

# 25. Recommended execution order

Use this order unless code dependencies require a slight adjustment:

1. inventory entire frontend;
2. classify every route;
3. report audit;
4. lock any incorrect prior migrations pending authorization;
5. migrate simple independent routes;
6. extract local components;
7. extract meaningful hooks;
8. reuse existing services;
9. validate each migration unit;
10. migrate more coupled screens;
11. perform full-project audit;
12. verify hook-count requirement;
13. prepare final delivery report.

Do not globally move folders before understanding dependencies.

---

# 26. Definition of done

The migration is complete only when:

- `app` is effectively routing-only;
- screens and feature UI live under `src`;
- large screens are meaningfully segmented;
- custom hooks contain appropriate state/effect/API/form/repeated logic;
- hooks use the `use` prefix;
- hook return values are minimal;
- `src` organization is coherent;
- correctly migrated screens remain intact;
- incorrect prior migrations were not touched without authorization;
- navigation is preserved;
- styles are preserved;
- behavior is preserved;
- migration-caused errors are resolved;
- no unrelated work was performed;
- assignment-specific hook and commit requirements are accounted for.

If an approval-blocked migrated screen still violates the requirements, do **not** claim the migration is fully complete.

Instead state that completion is blocked by that explicitly identified item.

---

# 27. Final report template

At the end, return:

```md
# Migration Completion Report

## Migrated
- `app/...` -> `src/...`
- ...

## Already compliant and intentionally left unchanged
- ...
- ...

## Components extracted
- ...
- ...

## Custom hooks added/extracted
- `use...`
- `use...`

## Validation performed
- type check:
- lint:
- tests:
- app/build:
- navigation:
- behavior comparison:

## Assignment requirements
- app routing-only: PASS / FAIL
- components organized under src: PASS / FAIL
- custom hook separation: PASS / FAIL
- minimum 3 hooks per team member: PASS / NOT VERIFIED / FAIL
- progressive commits: PASS / NOT APPLICABLE / NOT VERIFIED

## Approval-blocked existing migration issues
- None

## Unrelated issues discovered but intentionally not modified
- None
```

---

# 28. Prime directive

When a decision is ambiguous, use this priority order:

1. Preserve observable behavior.
2. Do not exceed the migration scope.
3. Inspect before editing.
4. Preserve already-correct migrated work.
5. Report and lock incorrect prior migrations until authorized.
6. Keep `app` routing-only.
7. Put screen/feature implementation in `src`.
8. Put meaningful behavior in custom hooks.
9. Keep components and hooks narrowly responsible.
10. Reuse the project's existing architecture.
11. Make the smallest necessary change.
12. Validate before proceeding.

Do not perform unrelated improvements simply because you see an opportunity.
