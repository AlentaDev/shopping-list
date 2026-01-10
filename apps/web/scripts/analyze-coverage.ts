#!/usr/bin/env node
/**
 * Analiza el reporte de coverage según la estrategia 100/80/0
 *
 * CORE (100%): Estado crítico y lógica de negocio
 * IMPORTANT (80%): Features visibles y lógica de presentación
 * INFRASTRUCTURE (0%): TypeScript auto-validable (excluido)
 */

import { readFileSync } from "fs";
import { join } from "path";

interface FileCoverage {
  lines: { total: number; covered: number; pct: number };
  functions: { total: number; covered: number; pct: number };
  statements: { total: number; covered: number; pct: number };
  branches: { total: number; covered: number; pct: number };
}

interface CoverageSummary {
  [filePath: string]: FileCoverage;
}

interface CoverageReport {
  total: FileCoverage;
  [key: string]: FileCoverage | CoverageSummary;
}

type CategoryName = "CORE" | "IMPORTANT" | "INFRASTRUCTURE";

interface CategoryMetrics {
  files: string[];
  lines: { total: number; covered: number };
  functions: { total: number; covered: number };
  statements: { total: number; covered: number };
  branches: { total: number; covered: number };
}

type CategorizedMetrics = Record<CategoryName, CategoryMetrics>;

// Patrones de clasificación según estrategia 100/80/0
const CORE_PATTERNS = [
  /[/\\]context[/\\]/,
  /[/\\]features[/\\][^/\\]+[/\\]services[/\\]/,
  /[/\\]shared[/\\]utils[/\\]/,
];

const IMPORTANT_PATTERNS = [
  /[/\\]features[/\\][^/\\]+[/\\]components[/\\]/,
  /[/\\]App\.tsx$/,
  /[/\\]features[/\\][^/\\]+[/\\][^/\\]+\.tsx$/,
];

const INFRASTRUCTURE_PATTERNS = [
  /[/\\]providers[/\\]/,
  /[/\\]infrastructure[/\\]/,
  /[/\\]main\.tsx$/,
  /[/\\]index\.ts$/,
];

function categorizeFile(filePath: string): CategoryName {
  // INFRASTRUCTURE primero (excluido pero puede aparecer si se testa)
  if (INFRASTRUCTURE_PATTERNS.some((pattern) => pattern.test(filePath))) {
    return "INFRASTRUCTURE";
  }

  // CORE: Lógica crítica
  if (CORE_PATTERNS.some((pattern) => pattern.test(filePath))) {
    return "CORE";
  }

  // IMPORTANT: Features visibles
  if (IMPORTANT_PATTERNS.some((pattern) => pattern.test(filePath))) {
    return "IMPORTANT";
  }

  // Por defecto, lo consideramos IMPORTANT si no está excluido
  return "IMPORTANT";
}

function initMetrics(): CategoryMetrics {
  return {
    files: [],
    lines: { total: 0, covered: 0 },
    functions: { total: 0, covered: 0 },
    statements: { total: 0, covered: 0 },
    branches: { total: 0, covered: 0 },
  };
}

function calculatePercentage(covered: number, total: number): string {
  if (total === 0) return "N/A";
  return ((covered / total) * 100).toFixed(2);
}

function addToCategory(
  metrics: CategoryMetrics,
  filePath: string,
  coverage: FileCoverage
): void {
  metrics.files.push(filePath);
  metrics.lines.total += coverage.lines.total;
  metrics.lines.covered += coverage.lines.covered;
  metrics.functions.total += coverage.functions.total;
  metrics.functions.covered += coverage.functions.covered;
  metrics.statements.total += coverage.statements.total;
  metrics.statements.covered += coverage.statements.covered;
  metrics.branches.total += coverage.branches.total;
  metrics.branches.covered += coverage.branches.covered;
}

function analyzeCoverage(): void {
  const coveragePath = join(process.cwd(), "coverage", "coverage-summary.json");

  let coverageData: CoverageReport;
  try {
    const rawData = readFileSync(coveragePath, "utf-8");
    coverageData = JSON.parse(rawData) as CoverageReport;
  } catch {
    console.error("❌ No se encontró el reporte de coverage");
    console.error("   Ejecuta primero: pnpm test:coverage");
    process.exit(1);
  }

  const categorized: CategorizedMetrics = {
    CORE: initMetrics(),
    IMPORTANT: initMetrics(),
    INFRASTRUCTURE: initMetrics(),
  };

  // Clasificar cada archivo
  Object.entries(coverageData).forEach(([filePath, coverage]) => {
    if (filePath === "total") return;

    const category = categorizeFile(filePath);
    addToCategory(categorized[category], filePath, coverage as FileCoverage);
  });

  // Imprimir resultados
  console.log("\n");
  console.log("═".repeat(80));
  console.log("  📊 ANÁLISIS DE COVERAGE - Estrategia 100/80/0");
  console.log("═".repeat(80));
  console.log();

  // CORE (100%)
  const coreMetrics = categorized.CORE;
  const coreLinesPct = calculatePercentage(
    coreMetrics.lines.covered,
    coreMetrics.lines.total
  );
  const coreFuncsPct = calculatePercentage(
    coreMetrics.functions.covered,
    coreMetrics.functions.total
  );
  const coreStmtsPct = calculatePercentage(
    coreMetrics.statements.covered,
    coreMetrics.statements.total
  );
  const coreBranchesPct = calculatePercentage(
    coreMetrics.branches.covered,
    coreMetrics.branches.total
  );

  const coreStatus =
    parseFloat(coreLinesPct) >= 100 &&
    parseFloat(coreFuncsPct) >= 100 &&
    parseFloat(coreStmtsPct) >= 100
      ? "✅"
      : "⚠️";

  console.log(`${coreStatus} CORE (Target: 100%)`);
  console.log("  Estado crítico y lógica de negocio");
  console.log(`  Archivos: ${coreMetrics.files.length}`);
  console.log(
    `  Lines:      ${coreLinesPct}% (${coreMetrics.lines.covered}/${coreMetrics.lines.total})`
  );
  console.log(
    `  Functions:  ${coreFuncsPct}% (${coreMetrics.functions.covered}/${coreMetrics.functions.total})`
  );
  console.log(
    `  Statements: ${coreStmtsPct}% (${coreMetrics.statements.covered}/${coreMetrics.statements.total})`
  );
  console.log(
    `  Branches:   ${coreBranchesPct}% (${coreMetrics.branches.covered}/${coreMetrics.branches.total})`
  );
  console.log();

  // IMPORTANT (80%)
  const importantMetrics = categorized.IMPORTANT;
  const impLinesPct = calculatePercentage(
    importantMetrics.lines.covered,
    importantMetrics.lines.total
  );
  const impFuncsPct = calculatePercentage(
    importantMetrics.functions.covered,
    importantMetrics.functions.total
  );
  const impStmtsPct = calculatePercentage(
    importantMetrics.statements.covered,
    importantMetrics.statements.total
  );
  const impBranchesPct = calculatePercentage(
    importantMetrics.branches.covered,
    importantMetrics.branches.total
  );

  const impStatus =
    parseFloat(impLinesPct) >= 80 &&
    parseFloat(impFuncsPct) >= 80 &&
    parseFloat(impStmtsPct) >= 80
      ? "✅"
      : "⚠️";

  console.log(`${impStatus} IMPORTANT (Target: 80%)`);
  console.log("  Features visibles y lógica de presentación");
  console.log(`  Archivos: ${importantMetrics.files.length}`);
  console.log(
    `  Lines:      ${impLinesPct}% (${importantMetrics.lines.covered}/${importantMetrics.lines.total})`
  );
  console.log(
    `  Functions:  ${impFuncsPct}% (${importantMetrics.functions.covered}/${importantMetrics.functions.total})`
  );
  console.log(
    `  Statements: ${impStmtsPct}% (${importantMetrics.statements.covered}/${importantMetrics.statements.total})`
  );
  console.log(
    `  Branches:   ${impBranchesPct}% (${importantMetrics.branches.covered}/${importantMetrics.branches.total})`
  );
  console.log();

  // INFRASTRUCTURE (0% - excluido)
  const infraMetrics = categorized.INFRASTRUCTURE;
  console.log("ℹ️  INFRASTRUCTURE (Target: 0% - Excluido)");
  console.log("  TypeScript auto-validable");
  console.log(`  Archivos detectados: ${infraMetrics.files.length}`);
  if (infraMetrics.files.length > 0) {
    console.log(
      "  ⚠️  Nota: Estos archivos deberían estar excluidos del coverage"
    );
  }
  console.log();

  console.log("─".repeat(80));

  // Resumen de archivos CORE que necesitan atención
  if (parseFloat(coreLinesPct) < 100) {
    console.log("\n⚠️  CORE: Archivos que necesitan 100% coverage:");
    coreMetrics.files.forEach((file) => {
      const fileCoverage = coverageData[file] as FileCoverage;
      if (
        fileCoverage.lines.pct < 100 ||
        fileCoverage.functions.pct < 100 ||
        fileCoverage.statements.pct < 100
      ) {
        const shortPath = file.split(/[/\\]src[/\\]/).pop() || file;
        console.log(
          `   • src/${shortPath} - Lines: ${fileCoverage.lines.pct}%, Functions: ${fileCoverage.functions.pct}%, Statements: ${fileCoverage.statements.pct}%`
        );
      }
    });
  }

  // Resumen de archivos IMPORTANT que necesitan atención
  if (parseFloat(impLinesPct) < 80) {
    console.log("\n⚠️  IMPORTANT: Archivos por debajo del 80%:");
    importantMetrics.files.forEach((file) => {
      const fileCoverage = coverageData[file] as FileCoverage;
      if (
        fileCoverage.lines.pct < 80 ||
        fileCoverage.functions.pct < 80 ||
        fileCoverage.statements.pct < 80
      ) {
        const shortPath = file.split(/[/\\]src[/\\]/).pop() || file;
        console.log(
          `   • src/${shortPath} - Lines: ${fileCoverage.lines.pct}%`
        );
      }
    });
  }

  console.log();
  console.log("═".repeat(80));

  // Resumen final
  const corePass = parseFloat(coreLinesPct) >= 100;
  const importantPass = parseFloat(impLinesPct) >= 80;

  console.log();
  if (corePass && importantPass) {
    console.log("✅ COVERAGE PASS: Cumple estrategia 100/80/0");
    console.log("   • CORE: 100% ✓");
    console.log("   • IMPORTANT: ≥80% ✓");
  } else if (!importantPass) {
    console.log("❌ COVERAGE FAIL: No cumple umbrales mínimos");
    console.log(`   • IMPORTANT: ${impLinesPct}% (requerido: ≥80%)`);
    if (!corePass) {
      console.log(`   • CORE: ${coreLinesPct}% (target: 100%)`);
    }
    console.log();
    console.log("   Ejecuta tests específicos para mejorar coverage:");
    console.log("   pnpm test <archivo>");
    console.log();
    process.exit(1);
  } else if (!corePass) {
    console.log(
      "⚠️  COVERAGE WARNING: IMPORTANT cumple, pero CORE necesita atención"
    );
    console.log(`   • IMPORTANT: ${impLinesPct}% ✓`);
    console.log(`   • CORE: ${coreLinesPct}% (target: 100%)`);
    console.log();
    console.log(
      "   CORE requiere validación manual. Revisa los archivos listados arriba."
    );
  }

  console.log();
  console.log("═".repeat(80));
  console.log();
}

analyzeCoverage();
