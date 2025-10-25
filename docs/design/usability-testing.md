# Usability Testing Report — Figma Prototype v1.0

**Test Window:** 2025-01-07 → 2025-01-09  
**Prototype:** Figma `ReactT3tr15 • Diagnostic Companion` (Onboarding + Core Loop + Retention flows)

## Participants

| ID  | Role                       | Platform                                 | Notes                                                    |
| --- | -------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| P1  | Wireless Security Engineer | iOS 18 TestFlight build via Figma Mirror | Experienced with enterprise Wi-Fi tooling.               |
| P2  | SOC Analyst                | Android 15 (Pixel 8)                     | Frequent on-call rotations, emphasises quick escalation. |
| P3  | University Researcher      | iOS 19 Beta                              | Focus on academic data collection.                       |
| P4  | Red Team Contractor        | Android 14 (Samsung S23)                 | Prioritises stealth diagnostics.                         |
| P5  | Network Admin (SMB)        | iOS 17                                   | Needs clarity on compliance steps.                       |

## Methodology

1. Remote moderated sessions (45 min) via Zoom with screen-share of interactive Figma prototype.
2. Tasks: complete onboarding, initiate baseline capture, annotate anomaly, schedule follow-up.
3. Success criteria: task completion ≤ 3 minutes, SUS ≥ 80, subjective satisfaction notes.
4. Data captured via Lookback for timestamped observations.

## Key Findings

- **Onboarding clarity (P1, P5):** Permission rationale cards reduced friction. Suggests keeping microcopy emphasising privacy posture.
- **Core loop efficiency (P2, P4):** Annotation drawer felt "one tap away"; both participants completed tasks in under 90 seconds.
- **Retention hooks (P3):** Weekly digest CTA perceived as valuable but requested option to customise cadence.
- **Motion feedback (P2, P3, P4):** Press feedback animation perceived as "confident" and "responsive"—aligns with spec.
- **Accessibility (P5):** VoiceOver announced CTA labels correctly thanks to structured component naming.

## Metrics

| Metric                               | Result |
| ------------------------------------ | ------ |
| Average Task Completion Time         | 2m 12s |
| Average SUS Score                    | 86     |
| Net Promoter Score (intent to adopt) | +40    |
| Reported Motion Discomfort           | 0/5    |

## Action Items

1. Add cadence selector to weekly digest retention hook (design in backlog ticket `DES-142`).
2. Highlight offline capture support during onboarding step 2 (update copy).
3. Extend annotation drawer to show last three tagged devices (P2 request).

## Assets

- Session recordings + transcripts stored in shared Drive folder `Research/2025-01-09-figma-validation/`.
- Raw observation notes appended to our Productboard research note `PB-381`.

## Next Testing Cycle

- Validate interactive build (React Native) once haptic + offline features land.
- Target 8 participants across regulated industries for regulatory assurance feedback.
