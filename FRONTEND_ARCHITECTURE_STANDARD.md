# Frontend Architecture Standard for Future Implementations

## Purpose

This document is the permanent frontend architecture contract to follow **after the current migration is complete**.

Its purpose is to ensure that future work does not slowly reintroduce the exact problems the migration is fixing.

Every future route, screen, feature, component, hook, and frontend change must follow this structure unless the user explicitly authorizes an exception.

This document should be treated as an implementation constraint, not as optional style guidance.

---

# 1. Fundamental architecture

The project follows this separation:

```text
app = routing layer
src = application implementation layer
```

The dependency direction is:

```text
app -> src
```

The architecture must not drift back toward:

```text
app = routing + screens + feature logic + API logic
```

---

# 2. `app` directory contract

The `app` directory is reserved for router-required files and route composition.

It may contain:

- route entry files;
- route groups;
- layout files;
- dynamic route files;
- router metadata/configuration;
- route parameter acquisition;
- route-specific navigation decisions;
- thin adapters that pass route information to a screen in `src`.

A normal route should be thin.

Example:

```tsx
import { ClinicsScreen } from '@/src/features/clinics/screens/ClinicsScreen';

export default function ClinicsRoute() {
  return <ClinicsScreen />;
}
```

Dynamic route example:

```tsx
import { useLocalSearchParams } from 'expo-router';
import { ClinicDetailsScreen } from '@/src/features/clinics/screens/ClinicDetailsScreen';

export default function ClinicDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ClinicDetailsScreen clinicId={id} />;
}
```

The exact router API and alias syntax must follow the real project.

---

# 3. Responsibilities forbidden inside route files

Do not implement the following in `app` unless it is genuinely route-specific:

- large JSX screen trees;
- screen sections;
- feature components;
- form implementation;
- form state;
- feature state;
- data-fetching state;
- service/API calls;
- screen behavior effects;
- validation rules;
- data transformations;
- domain/business logic;
- repeated feature logic;
- feature-specific event orchestration;
- reusable UI components.

If a future task appears to require any of these in `app`, create or use the appropriate implementation under `src` instead.

---

# 4. `src` directory contract

All application implementation belongs under `src`.

The exact top-level structure must follow the convention established by the completed migration.

A feature-oriented example:

```text
src/
  components/

  features/
    auth/
      screens/
      components/
      hooks/

    clinics/
      screens/
      components/
      hooks/

    appointments/
      screens/
      components/
      hooks/

  hooks/
  services/
  utils/
```

A screen-oriented project may instead use:

```text
src/
  components/
  screens/
  hooks/
  services/
  utils/
```

Do not invent a new parallel convention for each feature.

---

# 5. Inspect before implementing

Before adding or changing frontend code, inspect the existing repository.

At minimum inspect:

- a similar existing route;
- a similar existing screen/feature;
- hook placement conventions;
- shared component conventions;
- service/API conventions;
- import aliases;
- naming conventions.

The goal is to extend the established architecture, not create a new one each turn.

---

# 6. Consistency rule

When several technically valid designs are possible, prefer the one already used by correctly implemented neighboring code.

Examples:

- if feature hooks are colocated, colocate the new hook;
- if screens live under feature folders, follow that pattern;
- if services already expose an API wrapper, reuse it;
- if shared components use a particular naming convention, continue it.

Do not introduce a different architecture because it is personally preferred.

---

# 7. New screen implementation contract

Every new navigable screen must have:

1. a thin route under `app`;
2. a screen-level implementation under `src`;
3. meaningful child components when the screen has multiple responsibilities;
4. custom hooks for appropriate behavior;
5. existing service/API modules for external data operations.

Conceptual flow:

```text
app route
    ↓
screen
    ↓
feature/shared components
    ↓
custom hook(s)
    ↓
service/API layer
```

---

# 8. Screen responsibility

A screen should primarily compose presentation.

It may:

- call custom hooks;
- select which UI states to render;
- pass data into child components;
- pass actions into child components;
- compose feature sections.

It should not become a dumping ground for:

- all API behavior;
- all state;
- all validation;
- all effects;
- all visual sections;
- all transformations.

A readable screen should make the feature's structure clear at a glance.

---

# 9. Example of a healthy screen boundary

```tsx
export function AppointmentsScreen() {
  const {
    appointments,
    isLoading,
    error,
    refresh,
    selectAppointment,
  } = useAppointments();

  if (isLoading) {
    return <AppointmentsLoadingState />;
  }

  if (error) {
    return <AppointmentsErrorState onRetry={refresh} />;
  }

  return (
    <AppointmentsView
      appointments={appointments}
      onRefresh={refresh}
      onSelectAppointment={selectAppointment}
    />
  );
}
```

This is only an architectural example.

Do not force identical naming or file structure if the repository already uses another compliant convention.

---

# 10. Component single-responsibility rule

A component should have one main reason to change.

Good component boundaries often correspond to:

- header;
- form;
- list;
- card;
- details section;
- filter section;
- search section;
- empty state;
- loading state;
- error state;
- action panel.

Extract a component when it:

- represents a meaningful visual responsibility;
- is reusable;
- contains repeated JSX;
- has a clear interface;
- significantly improves screen readability.

Do not split trivial JSX into dozens of tiny components just to reduce line count.

---

# 11. Shared versus local component rule

## Put a component in `src/components` when

- it is generic;
- it has no strong feature ownership;
- unrelated features can legitimately reuse it.

Examples:

```text
Button
Input
Card
Avatar
Modal
LoadingIndicator
```

## Keep a component inside its feature/screen when

- its name has domain meaning;
- only one feature owns it;
- it contains feature-specific presentation;
- hypothetical future reuse is the only reason to share it.

Examples:

```text
ClinicCard
AppointmentTimePicker
LoginCredentialsForm
ProviderAvailabilityRow
```

Prefer local ownership over speculative reuse.

---

# 12. Custom hook standard

Custom hooks are the standard boundary for feature behavior that should not remain in presentation components.

Every custom hook must:

- begin with `use`;
- represent a coherent responsibility;
- expose only what its consumer needs;
- hide implementation details;
- reuse the project's existing service/API layer;
- avoid mixing unrelated feature concerns.

Examples:

```text
useLogin
useRegister
useClinics
useClinicDetails
useAppointments
useAppointmentForm
```

---

# 13. Logic that should normally live in hooks

Consider a custom hook for:

- feature/screen state;
- request state;
- loading state;
- error state;
- `useEffect` tied to feature behavior;
- service/API orchestration;
- form state;
- validation;
- submit logic;
- retry behavior;
- refresh behavior;
- subscriptions;
- feature timers;
- repeated behavior;
- derived domain state;
- non-trivial interaction orchestration.

The principle is:

> Components primarily express what to render. Hooks primarily manage how feature behavior works.

---

# 14. Logic that may remain inside a component

Not every line of logic needs a hook.

Simple presentation behavior may remain local, including:

- mapping already-prepared data into JSX;
- straightforward conditional rendering;
- direct event wiring;
- small visual-only calculations;
- small local UI toggles with no domain/business significance.

Do not create custom hooks merely to wrap trivial JSX behavior.

---

# 15. Hook cohesion rule

A hook should have one coherent purpose.

Good:

```text
useLogin
useAppointmentForm
useClinicDetails
```

Suspicious:

```text
useEverything
useScreenLogic
usePageManager
```

when those hooks own unrelated behavior.

Also avoid artificial micro-hooks such as one hook per simple state variable when no meaningful abstraction exists.

---

# 16. Hook public interface rule

Treat the return value of a hook as a public API.

Return only what the current consumer needs.

Good:

```ts
return {
  clinics,
  isLoading,
  error,
  refresh,
};
```

Avoid returning:

- unused state;
- raw service objects;
- private helper functions;
- internal request details;
- setters that bypass the hook's intended behavior;
- values included "just in case."

Before exposing a value, ask:

> Which component currently needs this, and why?

If there is no concrete consumer, keep it private.

---

# 17. Hook placement rule

Place feature-specific hooks with their feature:

```text
src/features/appointments/hooks/useAppointments.ts
```

or with the screen when that is the project's convention:

```text
src/screens/Appointments/hooks/useAppointments.ts
```

Use a global `src/hooks` area only for behavior genuinely shared across multiple unrelated features.

Do not globalize code based on hypothetical future reuse.

---

# 18. Service/API interaction standard

Presentation components should not make raw service/API calls.

Preferred direction:

```text
screen/component
    ↓
custom hook
    ↓
service/API module
```

If a service already exists, reuse it.

Do not duplicate endpoint construction, transport code, authentication headers, or response handling inside a new hook when the project already has a service abstraction.

---

# 19. Form standard

Forms must separate presentation from behavior.

## Presentation responsibilities

- render fields;
- render labels;
- render validation feedback;
- render buttons;
- show loading/disabled state;
- call handlers.

## Hook/behavior responsibilities

- field state, when appropriate;
- validation logic;
- validation error state;
- submit orchestration;
- service/API call;
- submission loading/error;
- domain-specific success handling.

Do not scatter substantial validation rules directly through JSX.

---

# 20. Routing isolation rule

Keep route knowledge close to the routing boundary.

Prefer passing explicit route-derived props:

```tsx
export default function ClinicRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ClinicScreen clinicId={id} />;
}
```

This is preferable to deeply coupling reusable components to route files.

Do not import route implementation modules from `app` into `src`.

---

# 21. Import direction

Preferred direction:

```text
app
  -> screens/features
    -> local components/hooks
      -> shared components/services/utils
```

Avoid:

```text
src -> app
```

Avoid circular feature dependencies.

If two unrelated features genuinely need the same generic code, extract the smallest truly shared piece.

Do not import one feature's internals into another feature simply to avoid creating a proper shared abstraction.

---

# 22. Data preparation rule

Complex domain transformations should not be buried in JSX.

If filtering, sorting, grouping, or deriving values represents feature behavior, place it in:

- the owning hook;
- a feature utility;
- another appropriate behavior layer.

Simple presentation mapping may remain in the component.

Bad pattern:

```tsx
{items
  .filter(/* multiple business rules */)
  .sort(/* domain ordering */)
  .map(/* render */)}
```

when those operations express domain behavior.

Prefer passing prepared data into the visual component.

---

# 23. Effect rule

Every `useEffect` must have a clear side-effect responsibility.

When adding an effect:

- understand why it exists;
- keep dependencies correct;
- avoid using effects for values that can be derived directly;
- place feature behavior effects in an appropriate custom hook.

Do not move an effect blindly during refactoring.

Preserve timing and observable behavior.

---

# 24. Loading and error-state rule

Hooks that own async behavior should normally expose presentation-ready request state.

Example:

```ts
const {
  data,
  isLoading,
  error,
  retry,
} = useFeatureData();
```

The component decides how to render those states.

Avoid duplicating the same async lifecycle across several visual components when one feature hook can own it coherently.

---

# 25. Validation rule

A validation rule should have one source of truth.

Do not:

- duplicate the same validation logic in multiple visual components;
- silently change validation while moving it;
- expose internal validation machinery the UI does not need.

Expose the validation state and actions required for presentation.

---

# 26. Repeated logic rule

When logic repeats:

1. confirm the behavior is genuinely the same;
2. determine whether one feature owns it;
3. extract to the narrowest appropriate hook or utility;
4. share it globally only when multiple unrelated features truly use it.

Do not create a global abstraction merely because two code blocks look superficially similar.

---

# 27. New feature workflow

Every future feature must follow this order.

## Step 1 — Inspect

Inspect comparable existing code.

## Step 2 — Identify layers

Determine:

- route;
- screen;
- feature components;
- shared components;
- hooks;
- service/API usage.

## Step 3 — Create thin route

Keep routing responsibilities under `app`.

## Step 4 — Implement screen under `src`

Do not implement the screen in `app`.

## Step 5 — Segment presentation

Extract meaningful components.

## Step 6 — Extract behavior

Use custom hooks for appropriate state/effects/API/form/repeated behavior.

## Step 7 — Reuse

Reuse existing components, hooks, services, utilities, and conventions where appropriate.

## Step 8 — Validate

Verify architecture, behavior, and existing project checks before declaring completion.

---

# 28. Existing feature modification workflow

When modifying an existing feature:

1. inspect its current structure;
2. determine whether it is already compliant;
3. make the requested change within the existing compliant architecture;
4. do not rewrite compliant architecture unnecessarily.

If the feature contains legacy unmigrated code and the requested change requires touching it, keep any architectural adjustment narrowly tied to the requested work unless the user explicitly asks for broader migration/refactoring.

---

# 29. Mandatory check for prior migrated code

Before altering a screen that appears to have been migrated previously, classify it as:

- `COMPLIANT`;
- `PARTIALLY_COMPLIANT`;
- `LEGACY_NOT_MIGRATED`;
- `INCORRECT_EXISTING_MIGRATION`.

Do not assume a previous agent's migration is correct.

---

# 30. Authorization gate for incorrect existing migrations

If an existing migration is incorrect:

1. identify the affected files;
2. explain the violated rule;
3. explain the current structure;
4. explain the proposed correction;
5. explain likely affected areas;
6. do not change that prior migration;
7. request explicit user authorization.

This applies even when the correction appears obvious.

Do not hide a prior migration fix inside a new feature task.

---

# 31. Exception policy

This architecture may be intentionally broken only when the user explicitly authorizes an exception.

When requesting an exception, state:

```md
## Architecture Exception Request

### Rule that would be broken
...

### Why the normal structure is insufficient
...

### Proposed exception
...

### Scope
...

### Long-term consequence
...

No exception has been implemented yet.
```

Do not create implicit exceptions.

---

# 32. No architectural churn

Do not reorganize compliant code merely because a different structure is also valid.

Prohibited without explicit authorization:

- converting every `screens` folder into `features`;
- converting every `features` folder into `screens`;
- renaming all hooks;
- moving all shared components;
- replacing the service layer;
- replacing state management;
- changing import aliases;
- swapping the router;
- introducing a new frontend framework pattern;
- adding broad abstractions unrelated to the requested task.

Consistency is more important than preference.

---

# 33. Change-scope discipline

For every task distinguish:

## Required changes

Changes necessary to satisfy the user's request while following this architecture.

## Incidental discoveries

Pre-existing issues noticed while working.

Incidental discoveries are not automatically authorized work.

Report them separately unless they block the requested change.

---

# 34. Preserve observable behavior during structural work

Structural changes must preserve:

- navigation;
- route paths;
- route parameters;
- query parameters;
- text;
- styles;
- assets;
- validation;
- API behavior;
- loading states;
- error states;
- empty states;
- interactions;
- persistence behavior;
- conditional UI;
- modal/sheet/drawer behavior.

Refactoring permission is not product-change permission.

---

# 35. Styling preservation

When extracting or moving components:

- preserve style values;
- preserve style composition/order;
- preserve responsive behavior;
- preserve conditional styling;
- preserve safe-area behavior;
- preserve keyboard behavior;
- preserve assets;
- preserve existing visual states.

Do not "improve" the design unless the task asks for design work.

---

# 36. Dependency rule

Do not add a new dependency merely to implement this architecture.

Before adding any frontend dependency:

1. verify the existing stack cannot reasonably solve the need;
2. verify the dependency is actually required by the user's requested feature;
3. explain why it is needed;
4. obtain authorization when dependency addition is not clearly implied by the request.

Architecture consistency should normally be achievable with the project's existing tools.

---

# 37. Naming rules

Follow the naming convention already established by compliant code.

Unless the repository clearly uses another convention:

- React components: `PascalCase`;
- screens: `SomethingScreen.tsx`;
- hooks: `useSomething.ts`;
- feature folders: stable domain names;
- route files: router-defined naming.

Never rename a route file in a way that changes its route unless route change is explicitly requested.

---

# 38. Component interface standard

Prefer explicit component contracts.

Example:

```ts
type ClinicCardProps = {
  clinic: Clinic;
  onPress: (clinicId: string) => void;
};
```

Avoid having generic presentation components reach into unrelated global state solely to avoid passing meaningful props.

At the same time, do not create excessive prop drilling when the project already has a justified context/state pattern.

Follow the established architecture.

---

# 39. New shared abstraction rule

Before creating a new shared component, hook, or utility, answer:

1. Which current features need it?
2. Is the behavior truly the same?
3. Is it domain-neutral enough to be shared?
4. Would colocating it with one feature be simpler?
5. Does a similar abstraction already exist?

If reuse is hypothetical, keep it local.

---

# 40. Pre-completion architecture checklist

Before declaring any future frontend task complete, verify:

## Routing

- [ ] New/changed route files contain routing responsibilities only
- [ ] Screen implementation is not embedded in `app`
- [ ] Route parameters are handled consistently
- [ ] `src` does not import route implementation files

## Screens/components

- [ ] Screen lives in the established `src` structure
- [ ] Large presentation areas are meaningfully segmented
- [ ] Shared components are genuinely reusable
- [ ] Feature-specific components remain feature-local

## Hooks/logic

- [ ] Relevant feature state is separated appropriately
- [ ] Relevant effects are separated appropriately
- [ ] API/service orchestration is not embedded in presentation
- [ ] Form validation is not scattered through JSX
- [ ] Repeated logic is extracted when useful
- [ ] Custom hook names start with `use`
- [ ] Hook return values are minimal

## Consistency

- [ ] Existing project conventions were inspected first
- [ ] No competing architecture was introduced
- [ ] No compliant code was reorganized unnecessarily
- [ ] No unrelated refactor was bundled into the task

## Behavior

- [ ] Navigation preserved unless intentionally changed
- [ ] Styling preserved unless intentionally changed
- [ ] Existing behavior preserved unless intentionally changed
- [ ] Relevant project checks pass

---

# 41. Agent self-review questions

Before finalizing a change, answer internally:

1. Did I put screen implementation inside `app`?
2. Did I leave significant API/state/effect/form logic in a presentation component?
3. Did I create a new pattern when an established one already existed?
4. Did I over-share a feature-specific component or hook?
5. Did I expose hook internals the component does not need?
6. Did I refactor something unrelated to the request?
7. Did I alter styling or behavior unintentionally?
8. Did I change an existing migrated structure without checking whether it was already correct?
9. If I found a wrong prior migration, did I get authorization before changing it?
10. Can the next agent understand where route, presentation, behavior, and services belong from the resulting structure?

If any answer indicates a violation, correct the current change before finishing, except for a prior incorrect migration that requires user authorization.

---

# 42. Architecture decision matrix

| Concern | Correct home |
|---|---|
| Route definition | `app` |
| Route group/layout | `app` |
| Route parameter acquisition | `app` or established route adapter |
| Screen implementation | `src/screens` or `src/features/.../screens` |
| Generic reusable UI | `src/components` |
| Feature-specific UI | owning screen/feature |
| Feature state | custom hook when appropriate |
| Feature `useEffect` | custom hook when appropriate |
| API/service orchestration | custom hook calling service layer |
| Raw endpoint/client implementation | existing service/API layer |
| Form validation | feature/form hook |
| Loading/error lifecycle | hook owns state, component renders it |
| Cross-feature hook | `src/hooks` |
| Feature-only hook | owning feature/screen |
| Complex domain data transformation | hook/feature utility |
| Simple display conditional | component |
| Router-specific navigation concern | route boundary |
| Unrelated cleanup | nowhere unless separately authorized |

---

# 43. Architecture anti-patterns

Do not reintroduce these patterns.

## Fat route

```text
app/login.tsx
  - form UI
  - state
  - validation
  - API call
  - navigation
```

Target:

```text
app/login.tsx
  -> LoginScreen

src/.../LoginScreen
  -> presentation

src/.../useLogin
  -> state + validation + service orchestration
```

## Monolithic screen

```text
One very large screen containing all sections, state, effects, requests, and validation.
```

Target:

```text
Screen
  -> meaningful child components
  -> coherent custom hook(s)
```

## Fake hook extraction

```text
useEmailState()
usePasswordState()
useButtonState()
```

created only to increase hook count.

Target:

```text
useLogin()
```

when those states are part of one coherent login behavior.

## Global dumping ground

```text
src/components/
  ClinicCard
  AppointmentForm
  LoginForm
  ProviderScheduleRow
```

when each belongs to one feature.

Target:

```text
src/features/<feature>/components/
```

## Hidden route coupling

Feature components importing route files or relying on `app` implementation internals.

Target:

```text
route passes explicit inputs to src
```

---

# 44. Required agent response when architecture conflict is discovered

If a future task conflicts with this standard, do not silently choose a new architecture.

Report:

```md
# Architecture Conflict

## Requested work
...

## Existing standard affected
...

## Why the normal implementation cannot be followed unchanged
...

## Option A — Remain compliant
...

## Option B — Architecture exception
...

No exception has been implemented without authorization.
```

Continue with the compliant option when one exists.

Only require user authorization if an actual exception or correction of prior migrated work is necessary.

---

# 45. Required architecture check in every future implementation

Before writing code, the agent must explicitly verify these questions against the repository:

```text
1. What existing feature is most structurally similar?
2. Where do its routes live?
3. Where does its screen implementation live?
4. Where are its feature components?
5. Where are its hooks?
6. Which service/API abstraction does it use?
7. Which shared UI primitives already exist?
8. Is the target feature already partially or fully migrated?
9. Would this task touch an incorrect prior migration?
10. Can the requested change be completed without an architecture exception?
```

This check exists to stop agents from inventing a new structure from scratch on each turn.

---

# 46. Permanent prime directive

For all future frontend work, use this priority order:

1. Follow the architecture already established by the completed migration.
2. Inspect before implementing.
3. Keep `app` routing-only.
4. Keep application implementation in `src`.
5. Keep components focused on presentation.
6. Put appropriate feature behavior in custom hooks.
7. Reuse existing services and shared primitives.
8. Prefer local ownership over speculative sharing.
9. Preserve behavior unless the task explicitly changes it.
10. Avoid unrelated refactors.
11. Do not rewrite compliant architecture based on preference.
12. Report incorrect prior migrations before changing them.
13. Require explicit authorization for exceptions.

The goal is a codebase where every future agent can predict where code belongs before writing it.
