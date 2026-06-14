import { dirname, normalize } from "node:path";
import ts from "typescript";

const stripExtension = (value: string) => value.replace(/\.(?:ts|tsx|js|jsx)$/, "");

const isFeaturePublicEntrypoint = (target: string) => {
  const normalizedTarget = stripExtension(target);
  return /^features\/[^/]+(?:\/index)?$/.test(normalizedTarget);
};

const getCallExpressionPropertyName = (expression: ts.LeftHandSideExpression) => {
  if (!ts.isPropertyAccessExpression(expression)) {
    return null;
  }

  return ts.isIdentifier(expression.expression) && expression.expression.text === "vi"
    ? expression.name.text
    : null;
};

export const collectModuleDependencySpecifiers = (content: string): string[] => {
  const sourceFile = ts.createSourceFile(
    "appShellImportBoundary.ts",
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const specifiers: string[] = [];

  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (ts.isCallExpression(node)) {
      const calleeName = getCallExpressionPropertyName(node.expression);
      const [firstArgument] = node.arguments;

      if (
        (calleeName === "mock" || calleeName === "doMock" || calleeName === "unmock") &&
        firstArgument &&
        ts.isStringLiteral(firstArgument)
      ) {
        specifiers.push(firstArgument.text);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return specifiers;
};

export const resolveImportTarget = (
  importerRelativePath: string,
  specifier: string,
): string => {
  if (specifier.startsWith("@src/") || specifier.startsWith("@/")) {
    return specifier.replace(/^@(?:src)?\//, "");
  }

  if (specifier.startsWith(".")) {
    return normalize(`${dirname(importerRelativePath)}/${specifier}`).replaceAll("\\", "/");
  }

  return specifier;
};

export const violatesAppShellFeatureBoundary = (
  importerRelativePath: string,
  resolvedTarget: string,
): boolean => {
  if (!importerRelativePath.startsWith("app-shell/")) {
    return false;
  }

  if (!resolvedTarget.startsWith("features/")) {
    return false;
  }

  return !isFeaturePublicEntrypoint(resolvedTarget);
};

export const violatesCrossFeatureInternalBoundary = (
  importerRelativePath: string,
  resolvedTarget: string,
): boolean => {
  const currentFeature = importerRelativePath.match(/^features\/([^/]+)\//)?.[1];

  if (!currentFeature) {
    return false;
  }

  if (resolvedTarget.startsWith("app-shell/")) {
    return true;
  }

  const importedFeature = resolvedTarget.match(/^features\/([^/]+)(?:\/(.+))?$/);

  if (!importedFeature) {
    return false;
  }

  const [, targetFeature] = importedFeature;

  if (targetFeature === currentFeature) {
    return false;
  }

  return !isFeaturePublicEntrypoint(resolvedTarget);
};
