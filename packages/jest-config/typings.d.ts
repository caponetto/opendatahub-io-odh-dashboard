interface ImportMeta {
  /** Absolute path of the directory containing the current module (Node.js >= 21.2). */
  dirname: string;
  /** Absolute path of the current module file (Node.js >= 21.2). */
  filename: string;
}

declare namespace jest {
  interface Expect {
    isIdentityEqual: <T>(expected: T) => T;
  }

  interface Matchers<R, T> {
    hookToBe: (expected: unknown) => R;
    hookToStrictEqual: (expected: unknown) => R;
    hookToHaveUpdateCount: (expected: number) => R;
    hookToBeStable: <
      V extends T extends Pick<
        import('./types').RenderHookResultExt<
          infer Result,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          any
        >,
        'result'
      >
        ? import('./types').BooleanValues<Result>
        : never,
    >(
      expected?: V,
    ) => R;
  }

  interface Expect {
    isIdentityEqual: (expected: unknown) => AsymmetricMatcher;
  }
}
