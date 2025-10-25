# Market Analysis Interviews & Product Brief

## Research Objectives
- Understand how mid-sized cybersecurity consultancies monitor distributed client networks.
- Identify unmet needs around cross-platform WiFi diagnostics on field devices.
- Validate appetite for a sideloadable React Native companion app that pairs with tethered packet capture workflows.

## Methodology
- **Format:** Semi-structured 45-minute video interviews.
- **Participants:** 6 professionals (3 security consultants, 2 network engineers, 1 SOC analyst) recruited from existing partner channels.
- **Timing:** Conducted between 2025-03-04 and 2025-03-12.
- **Artifacts:** Interview notes, anonymized transcripts, and experience maps stored in shared research drive (internal reference: `NRD-2025-03`).
- **Assumptions:** Participants have experience with rvictl- or tcpdump-based packet capture and routinely sideload diagnostic tools for field testing.

## Key Interview Insights
1. **Fragmented Tooling**
   - Consultants juggle native macOS tools for CoreWLAN data, Android WifiManager utilities, and manual spreadsheets, resulting in lost time aligning session metadata.
   - Cross-device parity is valued more than deep raw packet inspection on-device; most teams offload pcap analysis to laptops.
2. **Operational Constraints**
   - Customer NDAs restrict persistent data storage. Participants want session-by-session exports with automatic scrubbing of personally identifiable information.
   - Limited connectivity at client sites necessitates fully offline workflows with later sync to secure storage.
3. **Desired Automations**
   - Automatic correlation between WiFi scan snapshots, traceroute latency spikes, and VPN tunnel status to spot environmental causes.
   - Guided capture checklists to ensure technicians follow consistent steps before escalating issues.
4. **Adoption Drivers & Barriers**
   - **Drivers:** Consolidated view, quick sharing, compliance-safe logging, cross-platform parity.
   - **Barriers:** Sideload friction (especially for iOS), concerns about entitlements for NetworkExtension usage, and ensuring vendor-neutral reporting formats.

## Competitive Landscape Summary
| Competitor | Strengths | Gaps relative to opportunity |
|------------|-----------|------------------------------|
| Airtool (macOS) | Deep packet capture controls, mature community | macOS-only, no mobile companion, limited workflow guidance |
| Ekahau Mobile Survey | Strong heatmapping for WiFi pros | Focused on AP planning, lacks security diagnostics integration |
| Fing | Easy-to-use mobile scanning | Consumer-oriented, insufficient logging for audits |

## Target Segment Prioritization
1. **Primary:** Cybersecurity consultants conducting short-term onsite assessments (25–200 employees per client) needing fast incident triage.
2. **Secondary:** Managed security service providers offering recurring wireless health checks for distributed retail chains.
3. **Tertiary:** In-house enterprise SecOps teams piloting zero-trust rollouts and needing ad-hoc validation tools.

## Product Brief
- **Value Proposition:** "Deliver consistent, compliant WiFi and network diagnostics from any field device, synchronized with your existing packet capture workflows."
- **Key Outcomes:** Reduce onsite triage time by 30%, improve documentation completeness, and de-risk compliance audits by centralizing anonymized logs.
- **Core Capabilities:**
  1. Unified WiFi scan dashboard with environment tagging.
  2. Guided diagnostic playbooks combining CoreWLAN, WifiManager, and rvictl tethered capture steps.
  3. Offline-first session logging with encrypted export to SOC endpoints.
  4. Cross-platform sideload toolkits (Xcode project, AltStore package, Android APK) including entitlement guidance.
- **Differentiators:** Cross-platform parity, audit-friendly logging, and extensibility via modular diagnostic scripts.

## Open Questions & Risks
- Feasibility of obtaining necessary NetworkExtension entitlements for enterprise distribution.
- Battery impact of prolonged background scans on Android and iOS devices.
- Legal review requirements for storing anonymized WiFi metadata in various jurisdictions.

## Next Steps
1. Prototype guided workflow module using React Navigation and context providers for session state.
2. Validate offline storage strategy using SQLite/WatermelonDB with encryption plugins.
3. Draft compliance checklist templates aligned with SOC 2 and ISO 27001 requirements.
