# Implementation Plan - Legal Retrieval Regression Investigation & Fact-Level Filtering

This document details the root cause investigation for why irrelevant Penal Code sections (358A, 288B, 352) were returned for physical abuse queries, and outlines the fact-level legal filtering solution.

## Investigation & Root Cause Analysis

### 1. Previous vs Current Retrieval Behavior

- **Previous Working Behavior**:
  - Test query: `"A 10-year-old child is repeatedly hit by a guardian, has visible injuries, and is afraid to stay at home."`
  - Correctly classified as: `physical_abuse` / `cruelty`
  - Expected returned law: Section 308A (Cruelty to children)
  - Irrelevant sections (358A, 288B, 352) excluded.

- **Current Regressed Behavior**:
  - Category returned: `kidnapping_abduction` (or broad unmatched candidate list)
  - Returned laws: Section 308A and Section 352 (and previously 358A / 288B if category was general/trafficking or allowed sections filtering was bypassed).

### 2. Exact Code / Data Changes That Caused Regression

1. **Category Keyword Overlap in `classifier_service.py`**:
   - `kidnapping_abduction` contained the standalone keyword `"guardian"`.
   - Any query describing abuse *by a guardian* (e.g., "hit by a guardian") triggered `kidnapping_abduction` before checking `physical_abuse` or `cruelty`.
   - Misclassifying the category to `kidnapping_abduction` gave Section 352 a `+0.08` category boost, artificially inflating its score to 0.471.

2. **Unenforced `CHILD_ABUSE_ALLOWED_SECTIONS` Pre-Filter in `rag_service.py`**:
   - `allowed_secs = CHILD_ABUSE_ALLOWED_SECTIONS.get(norm_category, [])` was defined at line 302, but **never evaluated** in candidate section filtering.
   - Consequently, all 20+ sections in `legal_sections.json` passed to semantic scoring regardless of category suitability.

3. **Missing Fact-Level Check for `required_facts`**:
   - `check_fact_compatibility` had hardcoded checks for sexual offences, 286A/B, 364A, 308, 288, 360D, 352, but **no checks** for Section 358A or Section 288B.
   - It also did not check the generic `section.required_facts` field present in `LegalSection` objects in `legal_sections.json`.

### 3. Why 358A & 288B Passed

- **Why Section 358A Passed**:
  - Section 358A (Debt bondage / forced labour / armed conflict) has `abuse_category: "trafficking"`.
  - Because `CHILD_ABUSE_ALLOWED_SECTIONS` was not enforced and `check_fact_compatibility` lacked fact rules for 358A (`forced labor`, `slavery`, `debt bondage`, `armed conflict`), Section 358A passed pre-filtering without checking if those mandatory facts existed in the query.

- **Why Section 288B Passed**:
  - Section 288B (Hiring/employing children to traffic in restricted articles) has `abuse_category: "trafficking"`.
  - Because no fact check existed for restricted articles / drugs / contraband / weapons (`drug`, `contraband`, `weapons`, `traffic`), Section 288B passed pre-filtering.

---

## User Review Required

> [!IMPORTANT]
> **Key Implementation Decision**:
> We will implement generic, data-driven `required_facts` filtering using `section.required_facts` directly in `check_fact_compatibility()`, supplemented by refining category keywords in `classifier_service.py`. This ensures no section with defined `required_facts` can pass unless at least one matching required fact is present in the user query.

---

## Proposed Changes

### [Component: legal-rag-backend]

#### [MODIFY] [classifier_service.py](file:///c:/Users/ASUS/Documents/GitHub/ChildSafety-Backend-API/legal-rag-backend/app/services/classifier_service.py)
- Refine `kidnapping_abduction` keywords by removing standalone `"guardian"` and replacing it with specific kidnapping phrases like `"lawful guardianship"`, `"kidnapped by guardian"`, `"abducted from guardian"`.

#### [MODIFY] [rag_service.py](file:///c:/Users/ASUS/Documents/GitHub/ChildSafety-Backend-API/legal-rag-backend/app/services/rag_service.py)
- Enhance `check_fact_compatibility(section, query_lower, norm_category)`:
  - Check `section.required_facts`. If non-empty, verify if `query_lower` contains any of the required fact terms.
  - Track `matched_facts` and `missing_required_facts`.
  - Reject the section if required facts are defined but missing from the query description.
- Enforce `CHILD_ABUSE_ALLOWED_SECTIONS` candidate filtering when category-specific allowed lists exist.
- Update debug logging to display:
  - `section_number`
  - `matched_facts`
  - `missing_required_facts`
  - `accepted/rejected`
  - `rejection_reason`

---

## Verification Plan

### Automated Tests
- Run `python test_user_query.py` to test the Sinhala physical abuse query.
- Run `python test_classification_retrieval.py` to ensure all 12 test scenarios pass without regressions.
- Verify candidate debug output format.

### Manual Verification
- Test English physical abuse test case: `"A 10-year-old child is repeatedly hit by a guardian, has visible injuries, and is afraid to stay at home."`
  - Verify Category: `physical_abuse` / `cruelty`
  - Verify Accepted: Section 308A
  - Verify Rejected: Sections 358A, 288B, 352 with clear missing facts debug output.
