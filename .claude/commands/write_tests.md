Write comprehensive Vitest tests for: $ARGUMENTS

## Steps

1. **Read the target file** — understand exports, props/params, logic branches, and edge cases.

2. **Locate or create the test file**:
   - Components: `src/components/<dir>/__tests__/<ComponentName>.test.tsx`
   - Lib/utils: `src/lib/__tests__/<filename>.test.ts`
   - If a test file already exists, extend it rather than replacing it.

3. **Use project conventions** (do not deviate):
   - Import from `vitest`: `test`, `expect`, `vi`, `afterEach`, `beforeEach`, `describe`
   - Import from `@testing-library/react`: `render`, `screen`, `fireEvent`, `cleanup`
   - Import from `@testing-library/user-event`: `userEvent`
   - Call `afterEach(() => { cleanup(); })` at the top of every component test file
   - No `describe` blocks unless grouping is genuinely needed for clarity
   - Flat `test("...")` style preferred

4. **Cover these cases in order**:
   - Renders / returns without throwing (smoke test)
   - Golden path: normal, expected usage
   - Prop/argument variants: different valid inputs produce correct outputs
   - Boundary conditions: empty string, zero, null/undefined where applicable
   - Error states and loading states if the component has them
   - User interactions: clicks, typing, keyboard shortcuts (Enter, Shift+Enter)
   - Any conditional logic branches visible in the source

5. **For pure functions** (lib/utils), skip React Testing Library and test inputs/outputs directly with `expect(fn(input)).toEqual(output)`.

6. **Mock only what crosses a real boundary** — network calls, `Date.now()`, randomness. Do not mock internal project modules unless they have side effects.

7. **Run the tests** after writing:
   ```
   cd uigen && npx vitest run <path-to-test-file>
   ```
   Fix any failures before finishing. If a test cannot pass due to a real bug in the source, note it in a comment but do not force-pass it.

8. **Report** the final test count and whether all passed.
