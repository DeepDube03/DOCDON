# VerifiQ - Peer-to-Peer & Office Document Verification System

**VerifiQ** is a comprehensive, multi-role identity and document verification web application built directly from the wireframe sketch and product specifications. It supports end-to-end peer-to-peer verification (Person A to Person B), live camera scanning with real-time OCR extraction, biometric identity gates, explicit privacy consent, automated AI verification, manual human review escalation, and office compliance queue management.

---

## 🌟 Key Features & Specification Mapping

### 1. Person A: Requester Portal
- **Create Verification Requests**: Send requests by generating a secure request ID (`REQ-XXXX`) and 4-digit PIN.
- **AI Document Advisor Dialog**: A conversational assistant that interviews the requester to understand their scenario (e.g. *Residential Tenancy*, *Corporate Employment*, *International Visa Clearance*) and automatically prescribes the exact required document checklist.
- **Real-Time Outbound Tracking**: Track pending submissions, inspection progress, and final certification status.

### 2. Person B: Submitter / Document Holder Portal
- **Identity & Biometric Authentication Gate (Addition #2)**: Intended recipient verification via simulated Face Biometrics (liveness match) and 4-digit security PIN before documents can be viewed or submitted.
- **Explicit Consent Sheet (Addition #1)**: Mandatory pre-sharing authorization detailing who is requesting, authorized purpose, 30-day retention period, and restricted access rights.
- **Interactive Camera Scanner**:
  - **Live Webcam Support**: Click *"Live Webcam"* to activate your physical camera (`getUserMedia`) with scanning HUD, laser line, and corner brackets.
  - **High-Fidelity Sample Presets**: 1-click test presets for instant testing (Valid Passport, Near-Expiry Visa, Expired & Blurry License).
- **Dynamic Required Documents Checklist**: Updates in real-time as documents are captured, displaying status badges (`Ready`, `Missing`, `Issues Detected`).
- **Store in App Vault**: Attach pre-stored documents from the internal App Vault as sketched in the notebook.
- **Conditional "Verify" Button**: Only unlocks when all required documents have been scanned and pass basic integrity criteria.

### 3. Verification Engine: "The Golden Flow"
The application implements the complete multi-stage decision pipeline:
1. **AI OCR & Field Extraction**: Optical extraction of Legal Full Name, Document Identifier, Date of Birth, Expiry Date, Issuing Authority, and Readability Score.
2. **Automated Fraud & Expiry Analysis**: Flags documents that are expired, have poor optical clarity, or present name discrepancies.
3. **Smart Escalation**:
   - **High Confidence ($\ge 90\%$)**: Automatically verified.
   - **Uncertain / Edge Cases (e.g. Expiry $< 6$ months, middle initial differences)**: **Escalates to Human Review Officer** rather than immediate rejection.
   - **Critical Failures (Expired, blurry)**: Flagged with explicit failure reasons.
4. **Final Decision & Record**: Immutable cryptographic audit record generated.
5. **Dual Notification Dispatch (Addition #9)**: Both Person A and Person B receive real-time status updates and completion toasts.

### 4. Office / Admin Interface (Compliance Portal)
- **Search Engine**: Search by applicant legal name, request ID, or purpose.
- **Pending Metrics**: Live counter badges for total pending, needs human review, and verified cases.
- **Compulsory Queue Discipline (FIFO Enforcement)**: Implements the notebook rule (*"The Document have to verify compulsory. If the old request not done then don't open further new"*). When toggled on, reviewers must process the oldest case before opening newer ones.
- **Side-by-Side OCR Inspection**: Visual document card compared against extracted structured fields.
- **Emergency / Issue Notice Dispatcher (Addition #4 & Sketch)**: One-click canned issue templates (*Expired Document*, *Name Mismatch*, *Unreadable/Blurry*, *Missing Page*) that immediately display an emergency red alert banner on Person B's screen.

### 5. Trust, Privacy & Audit Additions
- **Verification Badges (Addition #3)**: `✅ Verified`, `⚠️ Needs review`, `❌ Rejected`, `⏳ Pending`.
- **Privacy & Access Control Sheet (Addition #6)**: View access transparency, AES-256 encryption status, auto-purge timers, and instant *"Revoke Access"* button.
- **Cryptographic Audit History Trail (Addition #7)**: Complete immutable timeline of every event, timestamp, and actor.
- **Document Expiry & Validity Warnings (Addition #8)**: Color-coded alerts calculating exact days until expiration (e.g., flagging visas with $< 6$ months validity).

---

## 🚀 How to Run and Test

1. Open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari) by double-clicking the file or opening it via your file manager:
   ```
   file:///c:/Users/A/Documents/New folder/index.html
   ```
2. Or serve it using any local static server if desired.

### Testing Scenarios Pre-Loaded:
- **Case 1: David Miller (`REQ-1001`) - Happy Path**:
  1. Switch to **Person B (Submitter)**.
  2. Complete face scan and approve consent.
  3. Scan the remaining documents or test the camera scanner.
  4. Click **Complete & Submit for Verification** to watch the Golden Flow in action.
- **Case 2: Elena Rostova (`REQ-1002`) - Human Review Escalation**:
  1. Switch to **Office / Admin Review**.
  2. Select Elena Rostova. Note that the AI score is $76.8\%$ due to an upcoming visa expiry ($41$ days remaining).
  3. Click **Approve & Certify** or dispatch an **Issue / Emergency Message**.
- **Case 3: Alex Chen (`REQ-1003`) - Emergency Issue Alert**:
  1. Switch to **Person B (Submitter)** and observe the emergency alert banner informing the applicant of their expired license and poor scan clarity.
  2. Switch to **Office / Admin Review** to see reviewer notes and audit history.
