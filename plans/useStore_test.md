# Resolution Plan: useStore.test.ts

## Issues to Resolve
- **Incomplete Coverage**: The test suite is extremely sparse. Expand tests to cover core functionality like state mutations, cart logic integration, config updates, and computed helpers (`cartTotal`, `cartCount`).
- **Mocking Anti-pattern**: The file uses `globalThis as any.fetch` to mock the fetch API. Refactor this to use Vitest's `vi.stubGlobal('fetch', mockFetch)` to maintain type safety and avoid global environment bleeding.
