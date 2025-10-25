# Beta Distribution, Feedback, and Roadmap Operations

This playbook describes how to deliver signed builds for iOS and Android outside public app stores, establish high-signal in-app feedback loops, and continuously prioritize improvements based on beta learnings. All steps align with the network diagnostics focus of FieldPulse Diagnostics and respect enterprise security constraints.

## Signed Build Distribution

### iOS (AltStore Sideloading)

1. **Provisioning**
   - Create an _App ID_ that matches the React Native bundle identifier (e.g. `com.fieldpulse.diagnostics`).
   - Generate a development provisioning profile with the `Access WiFi Information`, `Hotspot Configuration`, and `NetworkExtension` entitlements enabled. Include all tester device UDIDs.
   - Export the `.mobileprovision` profile and install it locally.
2. **Prepare AltStore**
   - Install [AltServer](https://altstore.io) on macOS/Windows and sign in with an Apple ID that has an app-specific password.
   - Connect the iOS device via USB (or ensure Wi-Fi sync is active) and trust the workstation.
3. **Build the `.ipa`**
   - From the project root, run `npx expo prebuild` (if using Expo) and `npx react-native bundle --platform ios --dev false` to pre-bundle JS.
   - Archive the app in Xcode: _Product ▸ Archive ▸ Distribute App ▸ Development_ and ensure “Rebuild from Bitcode” remains unchecked for faster iterations.
   - Export the build as an `.ipa`, selecting the provisioning profile created above.
4. **Sideload via AltStore**
   - In AltServer, choose _Install AltStore_ to refresh the on-device helper and then _Install .ipa_.
   - Browse to the exported `.ipa`; AltServer handles signing with the attached provisioning profile and pushes the build to the device.
   - Communicate that builds expire in seven days under free accounts; schedule weekly refreshes or use an Apple Developer Enterprise Program account to extend validity.

### iOS (Direct Xcode Sideload)

1. Install Xcode 16+ and log in with the Apple Developer account that created the provisioning profile.
2. Open `ios/FieldPulseDiagnostics.xcworkspace`, select the physical device, and ensure the _Signing & Capabilities_ tab references the correct team and profile.
3. Run `npm run ios -- --device "Tester Device"` for CLI-driven installs or press the _Run_ button in Xcode.
4. After deployment, verify entitlements via _Window ▸ Devices and Simulators ▸ Installed Apps ▸ Show Provisioning Profile_ to confirm `com.apple.developer.networking.networkextension` is present.

### Android (Google Play Testing Tracks)

1. **Upload Keystore**
   - Generate a secure release keystore (`android/app/fieldpulse-release.keystore`) and record the alias and passwords in the secrets manager.
   - Update `android/gradle.properties` with `MYAPP_RELEASE_STORE_FILE`, `MYAPP_RELEASE_KEY_ALIAS`, etc., and ensure they load from environment variables in CI.
2. **Configure Play Console**
   - Create _Internal_, _Closed_, and _Open_ testing tracks. Add QA devices to the Internal track for smoke verification, security researchers to Closed, and enterprise partners to Open once stable.
   - Enable `Managed Google Play` artifact retention for compliance.
3. **Build and Upload**
   - Run `cd android && ./gradlew bundleRelease` to produce an `.aab` signed with the release keystore.
   - Upload the `.aab` to the Internal track, attach release notes highlighting network entitlement requirements, and roll out.
4. **Automated Delivery**
   - Use `fastlane supply` or the Play Developer Publishing API from CI. Gate promotions between tracks on automated regression results plus NPS/retention score thresholds (see Dashboards section).

## In-App Feedback & Analytics Instrumentation

### Embedded Feedback Channels

- **Session Feedback Drawer**: Extend the diagnostics session summary screen with a persistent “Send Feedback” button. Tapping opens a modal that:
  - Captures screenshot/console logs via `react-native-view-shot` and the existing logging buffer.
  - Collects structured metadata (session ID, feature tags, severity) and free-form notes.
  - Posts payloads to `feedback` collection in Supabase or a secure API gateway. Include retry with exponential backoff and offline caching (`@react-native-async-storage/async-storage`).
- **Shake-to-Report**: Integrate `@react-native-community/react-native-shake` to expose the same modal when testers shake the device.
- **Passive Surveys**: Schedule in-app microsurveys (one question at session completion) using `react-native-in-app-review` on Android and `SKStoreReviewController` prompts on iOS, throttled to avoid fatigue.

### Metric Definitions & Event Schema

| Metric                        | Definition                                                         | Instrumentation                                                                                                |
| ----------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Daily/Weekly Active Users** | Count of unique users opening the app per day/week.                | Track `app_open` event on launch (Segment track call with `userId`/`anonymousId`).                             |
| **D1/D7 Retention**           | % of new users returning on day 1/7.                               | Emit `session_completed` with `sessionOrdinal` and compute cohorts in the warehouse.                           |
| **Churn Rate**                | Users inactive for ≥14 days ÷ total active users in prior 14 days. | Scheduled dbt model over `session_completed` events.                                                           |
| **Net Promoter Score (NPS)**  | %Promoters − %Detractors on 0–10 question.                         | Embed NPS form quarterly; store responses in `nps_responses` table with `score`, `comment`, `release_channel`. |

### Analytics & Dashboard Stack

1. **Collection**: Use Segment as the client SDK. Configure `src/services/analytics.ts` to send events with context (platform, app version, build channel).
2. **Warehousing**: Route Segment to BigQuery. Partition tables on event date for retention analysis.
3. **Modeling**: Build dbt models `fct_sessions`, `fct_feedback`, `fct_nps`. Calculate retention/churn metrics with incremental refreshes.
4. **Visualization**: Publish Looker Studio dashboards:
   - _Adoption Overview_: DAU/WAU, retention curves, track-level comparison (AltStore vs Xcode vs Play).
   - _Quality Signals_: Crash-free sessions (from Sentry), top feedback themes (Supabase tags), outstanding blockers.
   - _NPS & Satisfaction_: Trend of NPS by cohort, open text drill-down linked back to session artifacts.
5. **Alerting**: Configure Looker data alerts or Segment Protocols rules to ping Slack `#beta-watch` when churn > target or NPS < 20.

## Living Roadmap from Beta Insights

1. **Intake & Classification**
   - Sync feedback submissions, crash reports, and analytics anomalies nightly into a shared `beta_backlog` table.
   - Auto-tag entries with `component`, `severity`, and `impact_score` (`impact = affected_users × severity_weight`).
2. **Triage Cadence**
   - Run a twice-weekly triage meeting with engineering, product, and security research leads.
   - Review the top 20 items by impact score plus any SLA-breaching critical bugs (severity ≥ S1 or NPS detractors citing blockers).
   - Promote accepted items into the roadmap tool (Linear/Jira) with linked reproduction data and owner.
3. **Prioritization Framework**
   - Score items on **Reach**, **Impact**, **Confidence**, and **Effort** (RICE). Augment with **Compliance Risk** for anything touching data handling flows.
   - Require measurable success criteria (e.g., “Reduce capture wizard crash rate to <1%” or “Increase session completion rate by 10%”).
4. **Roadmap Publication**
   - Maintain a shared Notion/Confluence board titled “Beta Iteration Roadmap” with swimlanes: _Now_, _Next_, _Later_, _Monitoring_.
   - Embed live charts (retention, NPS) alongside roadmap sections for immediate context.
   - Include AltStore/Xcode/Play track build numbers for each roadmap item so testers know where fixes land.
5. **Feedback Loop Closure**
   - Once a fix ships, notify the original reporters through in-app messaging and Slack digest, referencing the exact build number and track.
   - Update the backlog entry with outcome metrics (e.g., retention delta) to validate ROI.

## Operational Checklist

- [ ] Provision and rotate signing assets every quarter; audit expired certificates monthly.
- [ ] Automate `.ipa` and `.aab` generation in CI with environment-aware entitlements.
- [ ] Validate analytics events in Segment Protocols before each beta launch.
- [ ] Refresh dashboards daily; export weekly summary PDF to stakeholders.
- [ ] Review roadmap status after each beta wave and capture learnings in the release retrospective.
