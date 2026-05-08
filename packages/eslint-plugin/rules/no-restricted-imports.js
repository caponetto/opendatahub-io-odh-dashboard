const { Linter } = require('eslint');
const micromatch = require('micromatch');

const baseNoRestrictedImports = new Linter().getRules().get('no-restricted-imports');

module.exports = {
  ...baseNoRestrictedImports,
  meta: {
    ...baseNoRestrictedImports.meta,
    schema: {
      type: 'array',
      items: { type: 'object', additionalProperties: true },
    },
  },
  create(context) {
    const options = context.options || [];

    const processedOptions = options.map((option) => {
      if (option && option.patterns) {
        return {
          ...option,
          patterns: option.patterns.map((pattern) => {
            if (pattern.group) {
              const allowPatterns = pattern.group.filter((p) => p.startsWith('!'));
              const restrictPatterns = pattern.group.filter((p) => !p.startsWith('!'));

              const { allowTypeImports, ...rest } = pattern;
              return {
                ...rest,
                group: restrictPatterns,
                _allowPatterns: allowPatterns.map((p) => p.slice(1)),
                _allowTypeImports: allowTypeImports,
              };
            }
            return pattern;
          }),
        };
      }
      return option;
    });

    const baseRule = baseNoRestrictedImports.create({
      ...context,
      options: processedOptions,
    });

    return {
      ImportDeclaration(node) {
        const importSource = node.source.value;
        const isTypeOnly = node.importKind === 'type';

        const isAllowed = processedOptions.some((option) =>
          option?.patterns?.some(
            (pattern) =>
              pattern._allowPatterns && micromatch.isMatch(importSource, pattern._allowPatterns),
          ),
        );

        if (isAllowed) {
          return;
        }

        if (isTypeOnly) {
          const typeAllowed = processedOptions.some((option) =>
            option?.patterns?.some(
              (pattern) =>
                pattern._allowTypeImports &&
                pattern.group &&
                micromatch.isMatch(importSource, pattern.group),
            ),
          );
          if (typeAllowed) {
            return;
          }
        }

        if (baseRule.ImportDeclaration) {
          baseRule.ImportDeclaration(node);
        }
      },
    };
  },
};
