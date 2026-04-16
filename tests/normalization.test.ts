import test from 'node:test';
import assert from 'node:assert/strict';
import {
  inferDenialCategory,
  inferInsurerFromNarrativeText,
  normalizeDenialReasonText,
  normalizeInsurerName,
  normalizeLegacyDenial,
  normalizePlanType,
  normalizeProcedureLabel,
} from '../src/lib/normalization';

test('normalizes common insurer aliases into canonical carriers', () => {
  assert.equal(normalizeInsurerName('UHC Choice Plus'), 'UnitedHealthcare');
  assert.equal(normalizeInsurerName('Anthem BCBS PPO'), 'Blue Cross Blue Shield');
  assert.equal(normalizeInsurerName('Florida Blue marketplace plan'), 'Blue Cross Blue Shield');
  assert.equal(normalizeInsurerName('Express Scripts through Cigna'), 'Cigna');
});

test('infers insurer from plan, PBM, and narrative clues', () => {
  assert.equal(inferInsurerFromNarrativeText('Choice Plus PPO denied my Taltz refill'), 'UnitedHealthcare');
  assert.equal(inferInsurerFromNarrativeText('CVS Caremark said the drug needs fail first therapy'), 'Aetna');
  assert.equal(inferInsurerFromNarrativeText('Medicare Advantage plan keeps cutting off rehab days'), 'Medicare Advantage organizations');
});

test('does not let long narrative text become an insurer or plan label', () => {
  const noisyNarrative =
    "How do I get my autistic adult brother into an adult day program in Houston? I have a younger brother and I want to put him into an adult day care center during the day.";

  assert.equal(inferInsurerFromNarrativeText(noisyNarrative), 'Unknown');
  assert.equal(normalizeInsurerName(noisyNarrative), 'Unknown');
  assert.equal(normalizePlanType(noisyNarrative), 'Unknown');
});

test('normalizes plan names and plan types into reusable buckets', () => {
  assert.equal(normalizePlanType('UHC Choice Plus PPO'), 'Choice Plus PPO');
  assert.equal(normalizePlanType('my employer HMO plan'), 'Employer Sponsored');
  assert.equal(normalizePlanType('ACA marketplace silver plan'), 'Marketplace');
  assert.equal(normalizePlanType('Medicare Advantage PPO'), 'Medicare Advantage');
});

test('collapses denial reason variants into a canonical phrase', () => {
  assert.equal(normalizeDenialReasonText('Coverage denied pending prior authorization review'), 'Prior authorization required');
  assert.equal(normalizeDenialReasonText('Service is not medically necessary according to plan policy'), 'Not medically necessary');
  assert.equal(normalizeDenialReasonText('Claim denied because this benefit is excluded under your plan'), 'Coverage exclusion');
  assert.equal(
    normalizeDenialReasonText('My doctor told me that last time there was a prior auth but now the pharmacy says they need paperwork again and I am panicking'),
    'Prior authorization required',
  );
});

test('groups same care fights together even when the wording differs', () => {
  assert.equal(normalizeProcedureLabel('Taltz was denied again after step therapy'), 'Specialty medication');
  assert.equal(normalizeProcedureLabel('Need Ozempic coverage through my plan'), 'GLP-1 medication');
  assert.equal(normalizeProcedureLabel('ABA therapy hours were denied'), 'ABA therapy');
  assert.equal(normalizeProcedureLabel('Remicade infusion denied at Mount Sinai'), 'Infusion therapy');
  assert.equal(
    normalizeProcedureLabel('How do I get my autistic adult brother into an adult day program and what place can pick him up and drop him off?'),
    'Insurance denial evidence',
  );
});

test('normalizes a legacy denial into denser canonical fields', () => {
  const normalized = normalizeLegacyDenial({
    insurer: 'anthem bcbs',
    planType: 'choice plus ppo',
    procedure: 'Taltz injection',
    denialReason: 'Coverage denied pending prior authorization review',
    narrative: 'My doctor sent in the prescription, but the insurer says prior auth is still required.',
  });

  assert.equal(normalized.insurer, 'Blue Cross Blue Shield');
  assert.equal(normalized.planType, 'Choice Plus PPO');
  assert.equal(normalized.procedure, 'Specialty medication');
  assert.equal(normalized.denialReason, 'Prior authorization required');
  assert.equal(normalized.denial_category, 'Prior Authorization');
});

test('infers denial category from broader narrative language', () => {
  assert.equal(
    inferDenialCategory({
      summary: 'My insurer says this is out of network now',
      narrative: 'I may miss my next infusion because the hospital is suddenly out of network.',
    }),
    'Out of Network',
  );
});
