import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { tokens } from "../src/theme/tokens";

const projectRoot = process.cwd();
const requireProject = createRequire(join(projectRoot, "package.json"));
const colorLiteral = /#[\da-f]{3,8}(?![\da-z])|\b(?:rgba?|hsla?)\s*\(/i;
const arbitraryUtility = /\b[a-z][\w-]*-\[[^\]]+\]|\[&[^\]]+\]:/;
const designUtility =
  /^(?:(?:first|last|odd|even|active|disabled|hover|focus|focus-visible|dark|sm|md|lg|xl|2xl):)*-?(?:bg|text|border|rounded|shadow|clay|font|leading|tracking|p[xytrblse]?|m[xytrblse]?|gap|w|h|min-w|max-w|min-h|max-h|flex|grow|shrink|items|justify|self|overflow|opacity|z)(?:-|$)/;
const visualProperty =
  /^(?:size|width|height|minWidth|maxWidth|minHeight|maxHeight|flex(?:Basis|Grow|Shrink)?|padding\w*|margin\w*|gap|rowGap|columnGap|fontSize|fontWeight|fontFamily|lineHeight|letterSpacing|border\w*|shadow\w*|textShadow\w*|elevation|opacity|activeOpacity|zIndex|hitSlop|extraScrollHeight|keyboardVerticalOffset)$/;
const colorProperty = /(?:color|colors)$/i;
const scalarString = /^-?\d+(?:\.\d+)?(?:px|rem|em|%|pt)?$/;
const zeroGeometry = new Set([
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "keyboardVerticalOffset",
]);
const fractionGeometry = new Set(["flex", "flexGrow", "flexShrink"]);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory()
        ? sourceFiles(path)
        : /\.(?:js|jsx|ts|tsx)$/.test(entry.name) &&
            path !== join(projectRoot, "src/theme/design-tokens.js")
          ? [path]
          : [];
    })
    .sort();
}

function numericValue(node: ts.Node): number | undefined {
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    return node.operator === ts.SyntaxKind.MinusToken
      ? -Number(node.operand.text)
      : Number(node.operand.text);
  }
  return undefined;
}

function designViolations(source: string, file: string): string[] {
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const issues: string[] = [];
  const report = (node: ts.Node, message: string) => {
    const line = ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
    issues.push(`${file}:${line}: ${message}`);
  };
  const inspectValue = (node: ts.Node, name: string, value: ts.Node) => {
    const number = numericValue(value);
    if (number !== undefined) {
      if (number === 0 && zeroGeometry.has(name)) return;
      if ((number === 0 || number === 1) && fractionGeometry.has(name)) return;
      if (visualProperty.test(name))
        report(node, `${name} must use a token or Tailwind utility`);
    }
    if (ts.isStringLiteralLike(value)) {
      if (colorProperty.test(name))
        report(node, `${name} must reference the shared palette`);
      if (visualProperty.test(name)) {
        const fullGeometry =
          /^(?:min|max)?(?:Width|Height)$/.test(name) ||
          name === "width" ||
          name === "height";
        if (fullGeometry && (value.text === "100%" || value.text === "0%"))
          return;
        if (
          scalarString.test(value.text) ||
          ["size", "fontWeight", "fontFamily"].includes(name)
        ) {
          report(node, `${name} must use a shared design token`);
        }
      }
    }
  };
  const visit = (node: ts.Node) => {
    if (
      ts.isStringLiteralLike(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      if (colorLiteral.test(node.text))
        report(node, "literal color belongs in design-tokens.js");
      if (arbitraryUtility.test(node.text))
        report(node, "arbitrary Tailwind values bypass the shared scales");
    }
    if (ts.isPropertyAssignment(node)) {
      const name =
        ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)
          ? node.name.text
          : node.name.getText(ast);
      inspectValue(node, name, node.initializer);
    }
    if (
      ts.isBindingElement(node) &&
      node.initializer &&
      ts.isIdentifier(node.name)
    ) {
      inspectValue(node, node.name.text, node.initializer);
    }
    if (ts.isJsxAttribute(node) && node.initializer) {
      const name = node.name.getText(ast);
      const value = ts.isJsxExpression(node.initializer)
        ? node.initializer.expression
        : node.initializer;
      if (value) inspectValue(node, name, value);
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return issues;
}

function flattenValues(value: unknown): unknown[] {
  return value && typeof value === "object"
    ? Object.values(value).flatMap(flattenValues)
    : [value];
}

test("UI and theme adapters cannot introduce colors, arbitrary utilities, or literal design metrics", () => {
  const files = ["app", "src"].flatMap((directory) =>
    sourceFiles(join(projectRoot, directory)),
  );
  assert.ok(files.some((file) => file.endsWith("DialogCard.tsx")));
  assert.ok(
    files.some((file) => file.endsWith("AppointmentSchedulePicker.tsx")),
  );
  const violations = files.flatMap((file) =>
    designViolations(readFileSync(file, "utf8"), relative(projectRoot, file)),
  );
  assert.deepEqual(violations, [], violations.join("\n"));
});

test("the guard catches style sheets and icon props while allowing runtime geometry and business numbers", () => {
  const invalid = `
    const styles = StyleSheet.create({ card: { padding: 12, borderRadius: 20, backgroundColor: 'white' } });
    const variants = { large: 'rounded-[20px] p-[12px]' };
    const node = <Icon size={18} color="#259487" />;
    const spinner = <ActivityIndicator size="small" />;
  `;
  const invalidIssues = designViolations(invalid, "example.tsx");
  for (const property of [
    "padding",
    "borderRadius",
    "backgroundColor",
    "size",
  ]) {
    assert.ok(
      invalidIssues.some((issue) => issue.includes(property)),
      property,
    );
  }
  assert.ok(invalidIssues.some((issue) => issue.includes("literal color")));
  assert.ok(
    invalidIssues.some((issue) => issue.includes("arbitrary Tailwind")),
  );
  assert.ok(
    invalidIssues.some((issue) => issue.includes("example.tsx:5: size")),
  );
  const valid = `
    const styles = { flex: 1, flexGrow: 0, minWidth: 0, maxWidth: '100%', height: viewport.height - insets.bottom };
    const node = <Field maxLength={100} numberOfLines={4} iconSize={tokens.iconSize[18]} className="p-4 rounded-clay" />;
    const appointment = { patientId: 123, duration: 30 };
    const path = '/appointments/[id]';
  `;
  assert.deepEqual(designViolations(valid, "example.tsx"), []);
});

test("runtime tokens, Tailwind, and native configuration consume the same palette source", () => {
  const design = requireProject("./src/theme/design-tokens.js") as Record<
    string,
    unknown
  >;
  const palette = new Set(
    flattenValues(design).filter(
      (value): value is string => typeof value === "string",
    ),
  );
  assert.ok(palette.has(tokens.colors.primary));
  assert.ok(palette.has(tokens.colors.secondary));
  assert.equal(tokens.colors.primary.toLowerCase(), "#259487");
  assert.equal(tokens.colors.secondary.toLowerCase(), "#4682b4");
  for (const file of [
    "tailwind.config.js",
    "src/theme/tokens.ts",
    "app.config.js",
  ]) {
    const source = readFileSync(join(projectRoot, file), "utf8");
    assert.match(
      source,
      /(?:from\s*|require\s*\(\s*)['"][^'"]*design-tokens\.js['"]/,
      file,
    );
    assert.doesNotMatch(source, colorLiteral, `${file} duplicates the palette`);
  }
  const config = requireProject("./tailwind.config.js");
  const resolveConfig = requireProject("tailwindcss/resolveConfig");
  const theme = resolveConfig(config).theme;
  const primary =
    typeof theme.colors.primary === "string"
      ? theme.colors.primary
      : theme.colors.primary.DEFAULT;
  assert.equal(primary.toLowerCase(), tokens.colors.primary.toLowerCase());
  const native = requireProject("./app.config.js");
  const configuration = native.default ?? native;
  const expo = configuration.expo ?? configuration;
  assert.equal(expo.splash.backgroundColor, tokens.colors.bg);
  assert.equal(expo.android.adaptiveIcon.backgroundColor, tokens.colors.bg);
  assert.doesNotMatch(
    readFileSync(join(projectRoot, "app.json"), "utf8"),
    colorLiteral,
    "app.json must consume native colors through app.config.js",
  );
});

test("Tailwind typography, spacing, shape, and state scales match the runtime definitions", () => {
  const definitions = requireProject(
    "./src/theme/design-tokens.js",
  ) as typeof tokens;
  const resolveConfig = requireProject("tailwindcss/resolveConfig");
  const theme = resolveConfig(requireProject("./tailwind.config.js")).theme;
  for (const [key, value] of Object.entries(definitions.spacingScale)) {
    assert.equal(theme.spacing[key], `${value}px`, `spacing.${key}`);
  }
  for (const [key, value] of Object.entries(definitions.fontSize)) {
    const lineHeight =
      definitions.lineHeight[key as keyof typeof definitions.lineHeight];
    assert.ok(
      value > 0 && lineHeight >= value,
      `Readable font metrics: ${key}`,
    );
    assert.equal(theme.fontSize[key][0], `${value}px`, `fontSize.${key}`);
    assert.equal(
      theme.fontSize[key][1].lineHeight,
      `${lineHeight}px`,
      `lineHeight.${key}`,
    );
  }
  for (const [key, value] of Object.entries(definitions.radius)) {
    assert.equal(theme.borderRadius[key], `${value}px`, `borderRadius.${key}`);
  }
  for (const [key, value] of Object.entries(definitions.borderWidth)) {
    assert.equal(theme.borderWidth[key], `${value}px`, `borderWidth.${key}`);
  }
  for (const key of [
    "fontWeight",
    "letterSpacing",
    "opacity",
    "zIndex",
  ] as const) {
    for (const [name, value] of Object.entries(definitions[key])) {
      assert.equal(theme[key][name], value, `${key}.${name}`);
    }
  }
  assert.ok(
    tokens.layout.touch >= 44,
    "Touch targets must retain an accessible minimum size",
  );
  assert.ok(
    tokens.layout.search >= 44,
    "Search fields must retain an accessible minimum size",
  );
});

test("every static design utility used by the UI compiles against the configured token scales", () => {
  const resolveConfig = requireProject("tailwindcss/resolveConfig");
  const { createContext } = requireProject(
    "tailwindcss/lib/lib/setupContextUtils",
  );
  const { generateRules } = requireProject("tailwindcss/lib/lib/generateRules");
  const configuration = requireProject("./tailwind.config.js");
  const context = createContext(resolveConfig(configuration));
  const candidates = new Map<string, string[]>();
  for (const file of ["app", "src"].flatMap((directory) =>
    sourceFiles(join(projectRoot, directory)),
  )) {
    const source = readFileSync(file, "utf8");
    const ast = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const visit = (node: ts.Node) => {
      if (
        ts.isStringLiteralLike(node) ||
        ts.isTemplateHead(node) ||
        ts.isTemplateMiddle(node) ||
        ts.isTemplateTail(node)
      ) {
        for (
          let parent: ts.Node | undefined = node.parent;
          parent;
          parent = parent.parent
        ) {
          if (ts.isJsxAttribute(parent)) {
            if (!/className$/i.test(parent.name.getText(ast))) return;
            break;
          }
          if (
            ts.isPropertyAssignment(parent) &&
            /^(?:justifyContent|alignContent|alignItems|alignSelf|flexDirection|display|position|overflow|name|icon|iconName|activeIcon)$/.test(
              parent.name.getText(ast),
            )
          )
            return;
        }
        for (const candidate of node.text
          .split(/\s+/)
          .filter((value) => designUtility.test(value))) {
          if (candidate.endsWith("-") || candidate.endsWith(":")) continue;
          const line =
            ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
          const references = candidates.get(candidate) ?? [];
          references.push(`${relative(projectRoot, file)}:${line}`);
          candidates.set(candidate, references);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  const missing = [...candidates]
    .filter(
      ([candidate]) =>
        [...generateRules(new Set([candidate]), context)].length === 0,
    )
    .map(
      ([candidate, references]) =>
        `${candidate}: ${[...new Set(references)].join(", ")}`,
    );
  assert.deepEqual(
    missing,
    [],
    `Utilities without a token-backed rule:\n${missing.join("\n")}`,
  );
  const { black, extrabold, ...withoutHeavyWeights } =
    configuration.theme.fontWeight;
  const incompleteContext = createContext(
    resolveConfig({
      ...configuration,
      theme: { ...configuration.theme, fontWeight: withoutHeavyWeights },
    }),
  );
  for (const candidate of ["font-black", "font-extrabold"]) {
    assert.ok(
      [...generateRules(new Set([candidate]), context)].length > 0,
      candidate,
    );
    assert.equal(
      [...generateRules(new Set([candidate]), incompleteContext)].length,
      0,
      candidate,
    );
  }
});

test("NativeWind clay utilities retain every native and web shadow layer with an older Android fallback", async () => {
  const source = readFileSync(join(projectRoot, "src/theme/clay.ts"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const loadClasses = (OS: string, Version: number | string) => {
    const module = {
      exports: {} as {
        clayClasses: Record<string, string>;
        clayPressedClass: string;
      },
    };
    runInNewContext(compiled, {
      module,
      exports: module.exports,
      require: (name: string) => {
        if (name === "react-native") return { Platform: { OS, Version } };
        if (name === "./tokens") return { tokens };
        throw new Error(`Unexpected clay dependency: ${name}`);
      },
    });
    return module.exports;
  };
  const ios = loadClasses("ios", "18.0");
  const android = loadClasses("android", tokens.layout.androidBoxShadowApi);
  const legacy = loadClasses("android", tokens.layout.androidBoxShadowApi - 1);
  const web = loadClasses("web", "");
  const configuration = requireProject("./tailwind.config.js");
  const postcss = requireProject("postcss");
  const tailwindcss = requireProject("tailwindcss");
  const { cssToReactNativeRuntime } = requireProject(
    "react-native-css-interop/css-to-rn",
  );
  const compileUtilities = async (platform: string, classes: string[]) => {
    const previousPlatform = process.env.NATIVEWIND_OS;
    process.env.NATIVEWIND_OS = platform;
    try {
      return await postcss([
        tailwindcss({
          ...configuration,
          content: [{ raw: classes.join(" "), extension: "html" }],
        }),
      ]).process("@tailwind utilities;", { from: undefined });
    } finally {
      if (previousPlatform === undefined) delete process.env.NATIVEWIND_OS;
      else process.env.NATIVEWIND_OS = previousPlatform;
    }
  };
  const nativeCss = await compileUtilities("android", [
    ...Object.values(android.clayClasses),
    ...Object.values(legacy.clayClasses),
    android.clayPressedClass,
    legacy.clayPressedClass,
  ]);
  const nativeRules = cssToReactNativeRuntime(nativeCss.css).rules;
  const webCss = await compileUtilities("web", [
    ...Object.values(web.clayClasses),
    web.clayPressedClass,
  ]);
  const shadowsInRule = (rule: unknown): string[] => {
    if (!rule || typeof rule !== "object") return [];
    return Object.entries(rule).flatMap(([key, value]) =>
      key === "boxShadow" && typeof value === "string"
        ? [value]
        : shadowsInRule(value),
    );
  };
  for (const [depth, value] of Object.entries(tokens.boxShadow)) {
    assert.equal(ios.clayClasses[depth], `clay-${depth}`);
    assert.equal(android.clayClasses[depth], ios.clayClasses[depth]);
    assert.equal(web.clayClasses[depth], `shadow-clay-${depth}`);
    const nativeRule = nativeRules[android.clayClasses[depth]];
    assert.ok(nativeRule, `Missing NativeWind rule: ${depth}`);
    assert.deepEqual(
      shadowsInRule(nativeRule),
      [value],
      `NativeWind lost shadow layers: ${depth}`,
    );
    assert.deepEqual(
      nativeRule.warnings ?? [],
      [],
      `Invalid native style: ${depth}`,
    );
    assert.ok(
      nativeRules[legacy.clayClasses[depth]],
      `Missing legacy fallback: ${depth}`,
    );
    assert.deepEqual(nativeRules[legacy.clayClasses[depth]].warnings ?? [], []);
    assert.match(legacy.clayClasses[depth], /^shadow-/);
    let webShadow: string | undefined;
    webCss.root.walkRules(
      `.${web.clayClasses[depth]}`,
      (rule: {
        walkDecls: (
          property: string,
          visitor: (declaration: { value: string }) => void,
        ) => void;
      }) => {
        rule.walkDecls("--tw-shadow", (declaration) => {
          webShadow = declaration.value;
        });
      },
    );
    assert.equal(webShadow, value, `Web lost shadow layers: ${depth}`);
    assert.match(
      value,
      /inset/,
      `Clay ${depth} needs an inner highlight or shade`,
    );
    assert.ok(
      value.split(/,(?![^()]*\))/).length >= 2,
      `Clay ${depth} needs multiple layers`,
    );
  }
  assert.deepEqual(shadowsInRule(nativeRules[android.clayPressedClass]), [
    tokens.boxShadow.pressed,
  ]);
  assert.equal(nativeRules[android.clayPressedClass].active, true);
  assert.equal(ios.clayPressedClass, android.clayPressedClass);
  assert.equal(web.clayPressedClass, "active:shadow-clay-pressed");
  assert.equal(legacy.clayPressedClass, "active:shadow-none");
});
