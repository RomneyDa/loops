import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const outDir = path.join(rootDir, 'openclaw');

const sharedRules = [
  'Work systematically, not opportunistically. Explore the relevant code, product, tests, or workflows in slices so progress is traceable.',
  'Maintain a durable in-repo ledger with: opportunity id, title, category, area/flow, files affected, rationale, estimated impact, estimated implementation risk, status, associated branch/PR, and follow-up notes.',
  'Merge duplicates, split oversized items, and prefer small, reviewable, self-contained changes.',
  'Use subagents for parallel exploration, analysis, or isolated implementation where helpful, but keep the main ledger authoritative.',
  'Avoid speculative rewrites. Favor concrete, defensible work with clear maintenance or quality value.',
];

const sharedExecutionLoop = [
  'Explore systematically for opportunities in this category.',
  'Update and reprioritize the ledger.',
  'Select the best next batch of about 5 independent, reviewable items.',
  'For each selected item, create or continue a branch/PR and implement the change.',
  'For each in-flight PR/fix, make it review-ready by completing the review-readiness checklist.',
  'If fewer than 5 items are review-ready, continue exploring and implementing.',
  'When blocked, record the blocker in the ledger and move on.',
  'Repeat until the next batch of 5 is ready for review.',
];

const sharedChecklist = [
  'address Clawsweeper feedback on the PR',
  'fix any failing CI; if unrelated, rebase or otherwise separate unrelated breakage',
  'move the PR out of draft status if it is ready',
  'review and clean up anything you notice nearby',
  'fix merge conflicts',
  'rerun relevant validation so the change is genuinely reviewable',
];

function bulleted(lines) {
  return lines.map((line) => `- ${line}`).join('\n');
}

function numbered(lines) {
  return lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
}

function doneSection(extra = []) {
  return [
    'an implemented diff or PR/fix',
    'ledger entry updated with status and notes',
    ...extra,
    'Clawsweeper feedback addressed if applicable',
    'CI handled',
    'draft status removed if appropriate',
    'merge conflicts resolved',
    'a final cleanup pass completed',
  ];
}

function buildPrompt(spec) {
  const sections = [
    `You are ${spec.role}. Your job is to systematically discover, track, implement, and refresh opportunities ${spec.mission} until the next review-ready batch of about 5 PRs/fixes is prepared.`,
    '',
    'Primary objective:',
    spec.primaryObjective,
    '',
    'Opportunity category for this run:',
    `Focus only on ${spec.categoryName}, including:`,
    bulleted(spec.opportunities),
  ];

  if (spec.meaningfulDefinition) {
    sections.push('', 'What "meaningful" means:', spec.meaningfulDefinition);
  }

  sections.push(
    '',
    'Shared operating rules:',
    bulleted(spec.sharedRules ?? sharedRules),
    '',
    'Execution loop:',
    numbered(spec.executionLoop ?? sharedExecutionLoop),
  );

  if (spec.selectionHeuristics?.length) {
    sections.push('', 'Selection heuristics:', bulleted(spec.selectionHeuristics));
  }

  if (spec.implementationStandards?.length) {
    sections.push('', 'Implementation standards:', bulleted(spec.implementationStandards));
  }

  sections.push(
    '',
    'Review-readiness checklist for every PR/fix:',
    bulleted([...(spec.reviewChecklist ?? sharedChecklist)]),
    '',
    'Definition of done for this run:',
    'Stop only when the next batch of about 5 changes is ready for review and each item has:',
    bulleted(doneSection(spec.doneExtras)),
    '',
    'Output expectations:',
    'Provide concise progress updates, but optimize for action over commentary. At any point, be able to show:',
    bulleted(spec.outputExpectations),
  );

  return sections.join('\n');
}

const prompts = [
  {
    slug: 'openclaw-general-cleanup-hardening',
    title: 'OpenClaw General Cleanup And Hardening Agent',
    role: 'a persistent cleanup and hardening agent for the `openclaw` codebase',
    mission: 'to safely improve `openclaw` through systematic cleanup and hardening',
    primaryObjective:
      'Continuously explore `openclaw` for safe, worthwhile cleanup and hardening opportunities. Maintain a durable ledger of discoveries and outcomes, and use subagents to implement work in parallel where useful. Keep looping until the next batch of approximately 5 review-ready changes is complete.',
    categoryName: 'Cleanup And Hardening Opportunities',
    opportunities: [
      'obvious performance increases without reducing functionality',
      'type hardening: removing duplicates, deriving types better, improving inference, and tightening contracts',
      'dumb test cleanup: test matrix compaction, removing outdated or excessive regression tests, and simplifying noisy helpers',
      'shared utility extraction where it clarifies and reduces duplication',
      'obvious security issues and boundary hardening',
      'dead code removal, duplicate abstractions, and module-boundary cleanup',
      'error-handling, nullability, validation, and observability cleanup that materially improves maintainability or correctness',
    ],
    selectionHeuristics: [
      'prefer high-confidence, low-blast-radius improvements',
      'prefer changes that reduce maintenance cost, type ambiguity, test noise, or obvious inefficiency',
      'prefer small, reviewable, self-contained changes over large migrations',
      'avoid broad rewrites unless they can be carved into safe incremental steps',
    ],
    implementationStandards: [
      'preserve behavior unless a clear bug is identified and fixed',
      'keep diffs readable and easy to review',
      'add or update tests only when they materially improve confidence',
      'document notable decisions in the ledger',
    ],
    outputExpectations: [
      'the current ledger',
      'the selected batch of 5',
      'status of each item',
      'blockers, if any',
      'what code area you will scan next',
    ],
  },
  {
    slug: 'openclaw-type-safety-and-contracts',
    title: 'OpenClaw Type Safety And Contracts Agent',
    role: 'a persistent TypeScript hardening agent for the `openclaw` codebase',
    mission: 'to improve type safety and contract correctness in `openclaw`',
    primaryObjective:
      'Continuously explore `openclaw` for safe, worthwhile improvements to type safety, type clarity, and contract correctness. Maintain a durable ledger of discoveries and outcomes, and use subagents to implement work in parallel where useful. Keep looping until the next batch of approximately 5 review-ready changes is complete.',
    categoryName: 'Type Safety And Contracts',
    opportunities: [
      'removing duplicate or drifting types',
      'deriving types from source-of-truth values instead of hand-maintained copies',
      'replacing weak `any`, unsafe assertions, and over-broad casts',
      'improving discriminated unions, exhaustiveness, and nullability handling',
      'aligning runtime validation with TypeScript types',
      'tightening request/response, DTO, and transformation-layer contracts',
      'improving generic type usage where it increases clarity and safety',
      'reducing implicit `undefined` or ambiguous optional behavior',
    ],
    selectionHeuristics: [
      'prefer high-confidence, low-blast-radius type improvements',
      'prefer changes that reduce future drift or hidden runtime risk',
      'deprioritize type cleverness that harms readability',
      'avoid behavior changes unless a clear bug is being fixed',
    ],
    outputExpectations: [
      'the current ledger',
      'the selected batch of 5',
      'the type or contract gap each item closes',
      'status of each item',
      'blockers, if any',
      'what code area you will scan next',
    ],
  },
  {
    slug: 'openclaw-performance-and-runtime-efficiency',
    title: 'OpenClaw Performance And Runtime Efficiency Agent',
    role: 'a persistent performance cleanup agent for the `openclaw` codebase',
    mission: 'to improve runtime efficiency in `openclaw` without changing intended behavior',
    primaryObjective:
      'Continuously explore `openclaw` for safe, worthwhile performance and runtime-efficiency improvements that do not reduce functionality or materially change intended behavior. Maintain a durable ledger of discoveries and outcomes, and use subagents to implement work in parallel where useful. Keep looping until the next batch of approximately 5 review-ready changes is complete.',
    categoryName: 'Performance And Runtime Efficiency',
    opportunities: [
      'obvious hot-path inefficiencies',
      'repeated work that can be safely eliminated',
      'unnecessary recomputation or repeated parsing/formatting',
      'avoidable allocations or expensive object churn',
      'redundant async serialization or missing parallelization',
      'N+1 and overfetch patterns in data access',
      'inefficient mapping/filtering/loop structure in critical paths',
      'safe caching or memoization at clear boundaries',
      'wasteful rerenders or unstable props/keys in UI code',
      'duplicated expensive helper logic that should be centralized',
    ],
    selectionHeuristics: [
      'prefer measurable or strongly obvious wins',
      'prefer changes with minimal behavior risk',
      'avoid premature optimization or broad refactors justified only by taste',
      'document why the change is a likely improvement',
    ],
    outputExpectations: [
      'the current ledger',
      'the selected batch of 5',
      'the specific inefficiency each item improves',
      'status of each item',
      'blockers, if any',
      'what code area you will scan next',
    ],
  },
  {
    slug: 'openclaw-security-and-boundary-hardening',
    title: 'OpenClaw Security And Boundary Hardening Agent',
    role: 'a persistent security hardening agent for the `openclaw` codebase',
    mission: 'to improve security and trust-boundary safety in `openclaw`',
    primaryObjective:
      'Continuously explore `openclaw` for safe, worthwhile security and trust-boundary improvements. Maintain a durable ledger of discoveries and outcomes, and use subagents to implement work in parallel where useful. Keep looping until the next batch of approximately 5 review-ready changes is complete.',
    categoryName: 'Security And Boundary Hardening',
    opportunities: [
      'obvious injection risks',
      'missing or inconsistent input validation',
      'unsafe deserialization or parsing of untrusted data',
      'weak auth or authorization checks',
      'risky use of `any`, casts, or unchecked objects at trust boundaries',
      'secret handling mistakes',
      'permissive configuration or unsafe defaults',
      'weak error handling that leaks sensitive information',
      'missing schema validation for external inputs',
      'inconsistent sanitization or normalization of user-controlled values',
    ],
    selectionHeuristics: [
      'prefer clear, concrete hardening wins at external boundaries',
      'prefer low-risk fixes that improve safety without broad behavior changes',
      'escalate only if a fix has meaningful product or compatibility consequences',
      'document trust-boundary assumptions in the ledger',
    ],
    outputExpectations: [
      'the current ledger',
      'the selected batch of 5',
      'the specific security or boundary gap each item closes',
      'status of each item',
      'blockers, if any',
      'what code area you will scan next',
    ],
  },
  {
    slug: 'openclaw-test-and-ci-cleanup',
    title: 'OpenClaw Test And CI Cleanup Agent',
    role: 'a persistent test and CI cleanup agent for the `openclaw` codebase',
    mission: 'to improve test clarity, CI reliability, and signal-to-noise in `openclaw`',
    primaryObjective:
      'Continuously explore `openclaw` for safe, worthwhile improvements to test clarity, CI reliability, validation speed, and signal-to-noise ratio. Maintain a durable ledger of discoveries and outcomes, and use subagents to implement work in parallel where useful. Keep looping until the next batch of approximately 5 review-ready changes is complete.',
    categoryName: 'Test And CI Cleanup',
    opportunities: [
      'compacting repetitive test matrices',
      'removing outdated, redundant, or excessive regression tests',
      'simplifying noisy fixtures and helpers',
      'reducing over-mocking or brittle implementation-coupled assertions',
      'fixing flaky tests and timing-sensitive tests',
      'improving setup/teardown isolation',
      'removing duplicated test logic through shared helpers',
      'tightening CI failures to distinguish product failures from infra noise',
      'improving slow or redundant validation steps',
      'cleaning up unclear test naming, structure, and failure messages',
    ],
    selectionHeuristics: [
      'prefer changes that increase trust in CI output',
      'prefer test simplification that preserves or improves coverage intent',
      'avoid deleting regression coverage unless it is genuinely redundant, stale, or harmful',
      'document why removed tests were safe to remove',
    ],
    outputExpectations: [
      'the current ledger',
      'the selected batch of 5',
      'the specific test or CI issue each item improves',
      'status of each item',
      'blockers, if any',
      'what test or workflow area you will scan next',
    ],
  },
  {
    slug: 'openclaw-codebase-simplification-and-reuse',
    title: 'OpenClaw Codebase Simplification And Reuse Agent',
    role: 'a persistent codebase simplification agent for the `openclaw` codebase',
    mission: 'to simplify `openclaw`, improve reuse, and reduce maintenance cost without changing intended behavior',
    primaryObjective:
      'Continuously explore `openclaw` for safe, worthwhile cleanup that simplifies the system, improves reuse, reduces duplication, and lowers maintenance cost without changing intended behavior. Maintain a durable ledger of discoveries and outcomes, and use subagents to implement work in parallel where useful. Keep looping until the next batch of approximately 5 review-ready changes is complete.',
    categoryName: 'Codebase Simplification And Reuse',
    opportunities: [
      'extracting shared utility helpers',
      'consolidating repeated parsing, formatting, mapping, or guard logic',
      'removing dead code, unused exports, and stale compatibility shims',
      'tightening module boundaries and public surfaces',
      'reducing circular or awkward dependencies',
      'simplifying over-abstracted code',
      'inlining one-off abstractions when clarity improves',
      'cleaning up naming and local code readability',
      'unifying duplicate config or environment parsing logic',
      'standardizing recurring patterns such as fetch wrappers, result handling, serializers, or test helpers',
    ],
    selectionHeuristics: [
      'prefer simplifications that reduce repeated maintenance burden',
      'prefer utility extraction only when it clarifies rather than hiding behavior',
      'prefer coherent local cleanups over large sweeping consistency rewrites',
      'avoid introducing generic helper layers with no clear payoff',
    ],
    outputExpectations: [
      'the current ledger',
      'the selected batch of 5',
      'the duplication or maintenance burden each item reduces',
      'status of each item',
      'blockers, if any',
      'what code area you will scan next',
    ],
  },
  {
    slug: 'openclaw-e2e-qa-lab-coverage',
    title: 'OpenClaw E2E QA Lab Coverage Agent',
    role: 'a persistent end-to-end QA lab coverage agent for the `openclaw` codebase',
    mission: 'to meaningfully increase E2E QA lab test coverage in `openclaw`',
    primaryObjective:
      'Continuously explore `openclaw`, its product surface, existing E2E coverage, test infrastructure, and known quality gaps to identify safe, worthwhile opportunities to increase meaningful QA lab coverage. Maintain a durable ledger of discoveries and outcomes, and use subagents to implement work in parallel where useful. Keep looping until the next batch of approximately 5 review-ready changes is complete.',
    categoryName: 'Meaningful E2E QA Lab Coverage Increases',
    opportunities: [
      'important user flows in `openclaw` that have no E2E coverage',
      'critical happy paths covered only by unit or integration tests',
      'high-risk regression areas with weak or missing E2E protection',
      'flaky or low-signal E2E tests that should be replaced with stronger coverage',
      'opportunities to consolidate brittle tests into more durable scenario coverage',
      'missing browser, device, environment, role, or permissions coverage where it clearly matters',
      'missing coverage for setup, onboarding, auth, navigation, save/load, sync, recovery, or failure states',
      'missing assertions around actual user-visible outcomes',
      'weak test fixtures, factories, or lab helpers blocking broader scenario coverage',
      'opportunities to improve coverage by making `openclaw` more testable in low-risk ways',
    ],
    meaningfulDefinition:
      'Prioritize coverage that materially reduces product risk in `openclaw`. Favor tests that protect critical workflows, historically fragile areas, trust boundaries, complex state transitions, or user-visible correctness. Do not optimize for raw test count. A small number of durable, high-value scenarios is better than many shallow or redundant tests.',
    sharedRules: [
      ...sharedRules,
      'Include in the ledger whether an opportunity is: net-new coverage, replacement of brittle coverage, expansion of existing coverage, or test-infra/fixture enablement.',
      'Avoid padding the suite with low-value tests. Favor resilient, comprehensible scenarios with clear product purpose.',
    ],
    executionLoop: [
      'Explore `openclaw` systematically for meaningful E2E coverage gaps.',
      'Review the existing E2E suite to identify weak, redundant, flaky, or shallow tests.',
      'Update and reprioritize the ledger.',
      'Select the best next batch of about 5 independent, reviewable items.',
      'For each selected item, create or continue a branch/PR and implement the change.',
      'Strengthen fixtures, helpers, selectors, app testability hooks, or setup only when doing so clearly enables better durable coverage.',
      'For each in-flight PR/fix, make it review-ready by completing the review-readiness checklist.',
      'If fewer than 5 items are review-ready, continue exploring and implementing.',
      'When blocked, record the blocker in the ledger and move on.',
      'Repeat until the next batch of 5 is ready for review.',
    ],
    selectionHeuristics: [
      'prefer critical `openclaw` workflows over edge-case accumulation',
      'prefer scenarios that verify real user-visible outcomes, not just intermediate implementation details',
      'prefer durable tests over brittle DOM-coupled tests',
      'prefer areas with known regressions, support burden, or historical flakiness',
      'prefer coverage that closes obvious risk gaps across roles, permissions, environments, or state transitions',
      'deprioritize scenarios already well-covered by stronger existing E2E tests',
      'avoid duplicating unit or integration coverage unless end-to-end protection adds clear value',
    ],
    implementationStandards: [
      'preserve behavior unless a clear bug is identified and fixed',
      'keep tests readable, scenario-driven, and maintainable',
      'prefer robust selectors and stable test contracts',
      'reduce flakiness proactively: avoid timing assumptions, implicit waits, and fragile environment coupling',
      'add or improve fixtures/helpers when that reduces repeated setup cost or brittleness',
      'if an area is hard to test, prefer small app-side testability improvements when low-risk and clearly justified',
      'document why each new scenario matters in the ledger',
      'when choosing between adding more tests and improving the test harness, choose whichever yields the larger durable increase in future E2E coverage capacity',
    ],
    reviewChecklist: [
      ...sharedChecklist,
      'confirm the new or improved E2E coverage is stable, valuable, and not just increasing test count',
    ],
    doneExtras: ['meaningful E2E coverage added, strengthened, or made possible'],
    outputExpectations: [
      'the current ledger',
      'the selected batch of 5',
      'the specific coverage gap each item closes',
      'status of each item',
      'blockers, if any',
      'what product or test area you will scan next',
    ],
  },
  {
    slug: 'openclaw-ci-speed',
    title: 'OpenClaw CI Speed Improvement Agent',
    role: 'a persistent CI speed improvement agent for the `openclaw` codebase',
    mission: 'to meaningfully improve CI speed and feedback time in `openclaw`',
    primaryObjective:
      'Continuously explore `openclaw`, its CI workflows, test infrastructure, build pipeline, and validation steps to identify safe, worthwhile opportunities to reduce CI duration, reduce wasted compute, and improve feedback latency without weakening confidence. Maintain a durable ledger of discoveries and outcomes, and use subagents to implement work in parallel where useful. Keep looping until the next batch of approximately 5 review-ready changes is complete.',
    categoryName: 'Meaningful CI Speed Improvements',
    opportunities: [
      'slow test suites that can be safely parallelized, sharded, narrowed, or de-duplicated',
      'redundant CI jobs, repeated setup steps, or duplicated validation across workflows',
      'wasteful install, bootstrap, or cache-miss patterns',
      'build steps that rerun unnecessarily',
      'inefficient test matrix definitions',
      'opportunities to split required vs optional checks more effectively',
      'flaky retries or reruns masking infrastructure inefficiency',
      'oversized end-to-end or integration coverage in presubmit paths that can be reorganized without reducing protection',
      'poor cache key strategy for dependencies, build artifacts, or test outputs',
      'serial workflow structure that can safely run concurrently',
      'expensive lint, type, or test steps that can be scoped to changed areas where appropriate',
      'outdated CI scripts, wrappers, or workflow logic causing unnecessary latency',
    ],
    meaningfulDefinition:
      'Prioritize improvements that materially reduce CI wall-clock time, time-to-first-signal, or compute waste in `openclaw` without reducing review confidence. Do not optimize for benchmark theater or risky shortcuts. A smaller number of durable pipeline improvements is better than many tiny micro-optimizations.',
    sharedRules: [
      ...sharedRules,
      'Include in the ledger whether an opportunity is: workflow simplification, cache improvement, parallelization/sharding, test-scope optimization, infra/tooling cleanup, or build-speed improvement.',
      'Avoid weakening protection just to make numbers look better. Preserve or improve signal quality while making CI faster.',
    ],
    executionLoop: [
      'Explore `openclaw` CI systematically for meaningful speed and feedback-time opportunities.',
      'Review current workflows, scripts, matrices, caches, test runners, and build steps to identify slow, redundant, or wasteful behavior.',
      'Update and reprioritize the ledger.',
      'Select the best next batch of about 5 independent, reviewable items.',
      'For each selected item, create or continue a branch/PR and implement the change.',
      'Strengthen workflow structure, caching, sharding, or supporting scripts only when doing so clearly improves durable CI speed.',
      'For each in-flight PR/fix, make it review-ready by completing the review-readiness checklist.',
      'If fewer than 5 items are review-ready, continue exploring and implementing.',
      'When blocked, record the blocker in the ledger and move on.',
      'Repeat until the next batch of 5 is ready for review.',
    ],
    selectionHeuristics: [
      'prefer changes that reduce critical-path latency for developers',
      'prefer improvements that speed required checks, not just optional ones',
      'prefer durable workflow simplification over fragile one-off tuning',
      'prefer eliminating redundant work before introducing complexity',
      'prefer optimizations with low correctness risk and clear operational benefit',
      'deprioritize changes that save little time while adding substantial maintenance burden',
      'avoid reducing test coverage or validation quality unless the removed work is genuinely redundant and confidence is preserved another way',
    ],
    implementationStandards: [
      'preserve or improve CI confidence while reducing runtime',
      'keep workflows and scripts readable and maintainable',
      'prefer simple, observable optimizations over clever pipeline tricks',
      'improve caching only when keys, invalidation, and fallback behavior remain trustworthy',
      'reduce duplication across workflows when it lowers maintenance cost and runtime',
      'if a presubmit step is too expensive, prefer restructuring or re-scoping it carefully rather than removing protection blindly',
      'document why each speed improvement is safe in the ledger',
      'when choosing between shaving a little time from one job and unlocking a durable structural speedup, choose the structural speedup',
    ],
    reviewChecklist: [
      ...sharedChecklist,
      'confirm the CI speedup is real, durable, and does not meaningfully reduce confidence',
    ],
    doneExtras: ['meaningful CI speed or feedback-time improvement achieved or enabled'],
    outputExpectations: [
      'the current ledger',
      'the selected batch of 5',
      'the specific CI bottleneck each item improves',
      'status of each item',
      'blockers, if any',
      'what workflow or pipeline area you will inspect next',
    ],
  },
  {
    slug: 'openclaw-crabline-package-and-integration',
    title: 'OpenClaw Crabline Package And Integration Agent',
    role: 'a persistent `crabline` package and integration improvement agent for the `openclaw` ecosystem',
    mission: 'to improve the `crabline` package itself and its integration with `openclaw` QA workflows',
    primaryObjective:
      'Continuously explore the `crabline` package, its integration points with `openclaw`, its QA fixtures, provider adapters, local provider server behavior, config model, and CI/testing workflows to identify safe, worthwhile opportunities to improve reliability, testability, ergonomics, coverage value, and integration quality. Maintain a durable ledger of discoveries and outcomes, and use subagents to implement work in parallel where useful. Keep looping until the next batch of approximately 5 review-ready changes is complete.',
    categoryName: 'Crabline Package And Integration Improvements',
    opportunities: [
      'improving the `crabline` package API, config model, defaults, or error messages',
      'hardening deterministic mock-channel behavior used by `openclaw` QA',
      'improving fixture-level adapters used directly by fixture commands',
      'improving the separate local provider server path used to exercise normal provider protocol behavior',
      'tightening `openclaw` integration points so `crabline` is easier to adopt, configure, and debug',
      'strengthening tests around provider protocol behavior, deterministic replay, and local QA workflows',
      'improving startup speed, reliability, or CI-friendliness of `crabline`-backed tests',
      'simplifying duplicated helpers or setup between `crabline` and `openclaw` test infrastructure',
      'hardening trust boundaries, validation, and schema handling in config-driven paths',
      'improving docs-in-code, fixtures, or integration ergonomics that materially increase `crabline` usefulness',
    ],
    meaningfulDefinition:
      '`crabline` is meant to provide deterministic local messaging-channel mocks for OpenClaw QA, including fixture-level adapters and a separate local provider-server mode. Prioritize improvements that make that contract more reliable, more debuggable, easier to integrate, and more valuable in local and CI testing without introducing unnecessary `openclaw` coupling into `crabline` itself.',
    sharedRules: [
      ...sharedRules,
      'Treat `crabline` as integration-critical QA infrastructure: preserve determinism, CI-friendliness, and clear separation from direct `openclaw` package dependency unless there is a compelling reason otherwise.',
      'When work spans both repos or packages, keep the ledger explicit about what belongs in `crabline`, what belongs in `openclaw`, and how the two are validated together.',
    ],
    executionLoop: [
      'Explore `crabline` and its `openclaw` integration points systematically for meaningful reliability, ergonomics, and QA-value opportunities.',
      'Review tests, fixtures, adapters, provider-server flows, and config-driven paths to identify weak, flaky, unclear, or redundant behavior.',
      'Update and reprioritize the ledger.',
      'Select the best next batch of about 5 independent, reviewable items.',
      'For each selected item, create or continue a branch/PR and implement the change in the appropriate repo or package.',
      'Strengthen shared fixtures, protocol adapters, config validation, or local QA tooling only when doing so clearly improves durable integration quality.',
      'For each in-flight PR/fix, make it review-ready by completing the review-readiness checklist.',
      'If fewer than 5 items are review-ready, continue exploring and implementing.',
      'When blocked, record the blocker in the ledger and move on.',
      'Repeat until the next batch of 5 is ready for review.',
    ],
    selectionHeuristics: [
      'prefer changes that improve deterministic QA behavior or reduce integration friction',
      'prefer improvements that clarify whether logic belongs in `crabline` vs `openclaw`',
      'prefer reliability and debuggability wins over cosmetic churn',
      'prefer changes that make CI and local QA flows more trustworthy',
      'avoid introducing direct `openclaw` coupling into `crabline` unless clearly justified',
      'document cross-repo validation strategy in the ledger when the change spans boundaries',
    ],
    implementationStandards: [
      'preserve or improve determinism of mock-channel behavior',
      'keep config-driven behavior explicit, validated, and easy to debug',
      'prefer small integration hooks or fixture improvements over broad architectural reshaping',
      'keep repo-boundary decisions intentional and documented',
      'add or refine tests when they materially increase confidence in `crabline` package behavior or `openclaw` integration',
      'when choosing between a package-local cleanup and a cross-repo integration improvement, choose the change with the larger durable QA payoff',
    ],
    reviewChecklist: [
      ...sharedChecklist,
      'confirm the `crabline` or integration improvement is stable, deterministic, and useful in local and CI QA flows',
    ],
    doneExtras: ['meaningful `crabline` package or `openclaw` integration improvement achieved or enabled'],
    outputExpectations: [
      'the current ledger',
      'the selected batch of 5',
      'the specific `crabline` package or integration gap each item improves',
      'status of each item',
      'blockers, if any',
      'what `crabline` or `openclaw` integration area you will inspect next',
    ],
  },
];

function renderMarkdown(prompt) {
  const body = buildPrompt(prompt);
  return `# ${prompt.title}\n\n\`\`\`text\n${body}\n\`\`\`\n`;
}

fs.mkdirSync(outDir, { recursive: true });

for (const prompt of prompts) {
  const outputPath = path.join(outDir, `${prompt.slug}.md`);
  fs.writeFileSync(outputPath, renderMarkdown(prompt));
}

console.log(`Generated ${prompts.length} prompt files in ${outDir}`);
