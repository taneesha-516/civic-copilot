# Civic Copilot - Pre-Demo Checklist

## Run 30 minutes before presenting

### Technical verification
- [ ] Open app in incognito tab (no cached state)
- [ ] Run freshMockData.js to update timestamps
- [ ] Verify confetti fires on complaint submission
- [ ] Verify AI animation runs completely (all 5 phases)
- [ ] Verify stat counters animate on dashboard load
- [ ] Click 3 different complaints - modals open correctly
- [ ] Map heatmap renders (not blank)
- [ ] Predictions page loads and markers pulse
- [ ] "Alert Department" button fires toast
- [ ] WhatsApp button generates correct share text
- [ ] Test on mobile (open Vercel URL on your phone)
- [ ] Test on a second browser (Edge or Firefox)
- [ ] MOCK_MODE is ON in Vercel env vars

### Demo environment
- [ ] Laptop is plugged in (no battery anxiety)
- [ ] Browser zoom is at 100%
- [ ] Notifications are off (Do Not Disturb on)
- [ ] Only the app tab is open - close all others
- [ ] Have the Vercel URL copied and ready to share
- [ ] Have a phone ready to demo the mobile flow if asked

## 90-second demo script (practice this 5 times)

[0:00] Open the citizen view on a mobile screen OR
       open browser at 375px width using DevTools

[0:08] Say: "Any Delhi resident can submit a complaint
       from their phone in under 60 seconds"
       Type: "Large pothole near Karol Bagh metro station,
       gate 2. Bikes are falling."

[0:22] Drag in the pothole photo.
       Say: "They upload a photo - our AI will analyze it."

[0:28] Click Submit.
       SAY NOTHING. Let the animation speak.
       Watch Phase 1 -> 2 -> 3 -> 4 -> 5 unfold silently.

[0:52] Success screen appears with confetti.
       Say: "Ticket generated, department assigned,
       citizen notified - automatically."

[1:02] Switch to the Authority Dashboard.
       Pause for 3 seconds. Let them see the heatmap.
       Say: "On the other side, officials see
       every complaint on a live priority heatmap."

[1:14] Click the Connaught Place cluster on the map.
       The map zooms in. Click the top complaint in the queue.
       Modal opens. Say: "Full AI analysis, formal complaint
       drafted, ready to act on."

[1:28] Navigate to Predictions.
       Say: "But Civic Copilot doesn't just react -
       it predicts. These are areas likely to develop
       critical issues in the next 14 days, based on
       historical patterns."

[1:38] Click a prediction marker. Popup appears.
       Click "Alert Department". Toast fires.
       Say: "One click to notify the department proactively."

[1:48] END. Stop talking. Let it land.
