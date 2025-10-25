# Lean Product Requirements Document (PRD)

## Product Overview
- **Product Name (Working Title):** FieldPulse Diagnostics
- **Owner:** Network Diagnostics Squad
- **Revision:** 0.1 (2025-03-14)
- **Goal:** Deliver a cross-platform, sideloadable React Native application that streamlines WiFi and network diagnostics for cybersecurity consultants conducting onsite engagements.

## Problem Statement
Field teams supporting security assessments must correlate WiFi scan data, VPN states, and packet capture artifacts across heterogeneous tools. This fragmentation leads to inconsistent documentation, slower triage, and compliance risk when logs are stored without governance.

## Success Metrics
1. Reduce average time to baseline a client environment from 45 minutes to 30 minutes within 90 days of deployment.
2. Achieve Net Promoter Score (NPS) ≥ 35 among pilot consultants after two weeks of use.
3. Ensure 95% of diagnostic sessions export compliant audit bundles (PII-scrubbed, encrypted, and tagged).

## Core User Stories & Core Loop
1. **Plan Diagnostic Session**
   - As a consultant, I select or create a client site profile, download the latest playbook, and review prerequisites before arrival.
2. **Capture Environment Snapshot**
   - I initiate a guided workflow that sequences WiFi scans, VPN checks, and optional tethered captures via rvictl/tcpdump. Results surface in a consolidated dashboard.
3. **Annotate & Export**
   - I tag anomalies, attach photos or notes, and export an encrypted bundle to the SOC repository once back online.
4. **Review & Iterate**
   - The SOC analyst reviews exports, provides feedback within the app, and updates playbooks, closing the loop for the next engagement.

The **core loop** revolves around preparing, capturing, annotating, and reviewing diagnostic sessions with rapid iteration cycles between consultants and analysts.

## Feature Requirements
### 1. Guided Diagnostics Playbooks
- Sequenced checklists combining WiFi scan requests, VPN state checks, traceroute tests, and tethered capture prompts.
- Offline caching of playbooks with versioning and automatic sync when connectivity returns.
- Contextual instructions for enabling necessary permissions (CoreWLAN, WifiManager, NetworkExtension, VpnService).

### 2. Unified Session Dashboard
- Real-time aggregation of scan results, latency metrics, and manual notes.
- Support for attaching imported pcap files from tethered captures.
- Highlight compliance exceptions (missing notes, untagged anomalies).

### 3. Secure Session Storage & Export
- Encrypted local store (SQLCipher/WatermelonDB) with per-session data retention policies.
- Export wizard generating `.zip` bundles containing JSON summaries, sanitized logs, and optional pcap attachments.
- Configurable upload adapters (SFTP, secure HTTPS endpoint) with retry logic.

### 4. Cross-Platform Sideload Toolkit
- Step-by-step instructions and scripts for Xcode, AltStore, and Android CLI installs.
- Automated entitlement validation for iOS (NetworkExtension, Access WiFi Information).
- Build-time checks ensuring compliance with platform security guidelines.

## Retention Hooks
- Session timeline with streak tracking for recurring client visits.
- Analyst feedback loop notifications prompting consultants to revisit unresolved issues.
- Library of reusable remediation snippets surfaced contextually during diagnostics.

## Monetization Approach
- **Primary Model:** Annual per-seat subscription for security consultancies, billed via enterprise contract.
- **Add-ons:**
  - Compliance bundle (automated report templates, legal review support).
  - Advanced analytics dashboard with historical trend comparisons.
- **Free Tier:** Limited to three active client profiles and manual exports to encourage trial use.

## Assumptions
- Enterprise customers can provision Apple enterprise certificates and approve necessary entitlements.
- Consultants operate in compliance with client NDAs and have authority to capture WiFi metadata.
- Field devices run iOS 17+/Android 14+ with sideloading enabled via MDM or developer options.

## Dependencies
- React Native 0.74 baseline with TypeScript and React Navigation 7.
- Native modules for CoreWLAN access (iOS) and WifiManager (Android) implemented via TurboModules.
- Secure storage leveraging `@nozbe/watermelondb` with SQLCipher plugin.
- Server-side SFTP endpoints managed by client SOC teams.

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| NetworkExtension entitlement rejection | Provide detailed use-case justification, prepare fallback using tethered rvictl captures with Mac relay. |
| Data loss in offline mode | Implement local write-ahead logging and background sync verification on reconnect. |
| Complex onboarding | Deliver guided sideload scripts and tutorial videos, integrate with existing MDM tooling. |

## Release Milestones
1. **M0 – Research Handoff (complete)**: Interviews synthesized, product brief approved.
2. **M1 – Prototype (4 weeks):** Deliver clickable prototype covering guided playbook and session dashboard core loop.
3. **M2 – Alpha (10 weeks):** Ship sideloadable builds, enable offline session storage, basic exports, and feedback loop.
4. **M3 – Beta (16 weeks):** Harden security, add monetization gates, integrate analytics add-on, conduct compliance review.

## Analytics & Telemetry
- Track session creation, export completion, playbook version adoption, and permission failure events.
- Log anonymized error stacks to secure endpoint with opt-in toggle per client.

## Open Questions
- What MDM solutions dominate target consultancies, and how can we streamline sideload configuration per vendor?
- Are there regulatory constraints for storing WiFi SSIDs in certain regions even when hashed?
- Should we bundle desktop companion tooling or rely on existing rvictl/tcpdump setups?
