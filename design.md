# Mechanic Co-Pilot - Mobile App Interface Design

## Overview
AI-Powered Engineering Tool for automotive mechanics with OBD-II scanner integration, VIN decoder, voice input, and 37+ service functions. Support UDS, SW-CAN, MS-CAN protocols.

## Design Philosophy
- **Mobile-first**: Optimized for portrait orientation (9:16) and one-handed usage
- **Desktop-ready**: Responsive layout that adapts beautifully to larger screens
- **Professional Dark Theme**: Slate/Blue color scheme matching automotive industry standards
- **Apple HIG Compliant**: Native iOS feel with smooth animations and intuitive gestures

## Color Palette

### Primary Colors
- **Background**: `#0f172a` (slate-950) - Deep dark blue
- **Surface**: `#1e293b` (slate-800) - Card backgrounds
- **Border**: `#334155` (slate-700) - Subtle borders

### Accent Colors
- **Primary Blue**: `#3b82f6` (blue-500) - Main actions, buttons
- **Indigo**: `#6366f1` (indigo-500) - Engineering mode, HEX commands
- **Emerald**: `#10b981` (emerald-500) - Success, connected states
- **Amber**: `#f59e0b` (amber-500) - Warnings, service functions
- **Red**: `#ef4444` (red-500) - Errors, DTC codes

### Text Colors
- **Primary Text**: `#f1f5f9` (slate-100) - Main content
- **Secondary Text**: `#94a3b8` (slate-400) - Muted text
- **Tertiary Text**: `#64748b` (slate-500) - Hints, labels

## Screen List

### 1. Home/Workspace Screen (Main)
- **Purpose**: Primary diagnostic interface
- **Layout**:
  - Header with app logo, title, OBD status indicator
  - Chat message list (scrollable)
  - Input area with multimodal controls
  - Quick action buttons (Voice, Audio Record, Camera, Service Functions)
  - OBD Terminal (collapsible)

### 2. Job Card Screen (Result View)
- **Purpose**: Display detailed diagnostic results
- **Layout**:
  - Vehicle info header with image
  - Cost estimation summary cards
  - Diagnosis & DTC analysis section
  - Tabbed content (Specs, Parts, Wiring, Videos)
  - SOP steps timeline
  - Engineering Mode section (HEX commands)

### 3. Documentation/Knowledge Base Screen
- **Purpose**: User guide and workflow documentation
- **Layout**:
  - Tabbed navigation (Workflow, Guide, Tips)
  - Rich content with icons and visual guides
  - Searchable content

### 4. Disclaimer Modal
- **Purpose**: Professional liability agreement
- **Layout**:
  - Warning icon
  - Agreement text (scrollable)
  - Accept button

## Primary Content and Functionality

### Home Screen Content
1. **Header Bar**
   - App logo (gradient blue/indigo)
   - "Mechanic Co-Pilot" title
   - "Pro Scanner" badge
   - OBD connection status indicator
   - Clear history button

2. **Chat Area**
   - Empty state with microphone icon and feature description
   - User messages (blue bubble, right-aligned)
   - AI messages (slate bubble, left-aligned)
   - Media attachments (images, audio clips)
   - AI HEX command suggestions (inline)

3. **Input Area**
   - Context badges (decoded vehicle, selected media)
   - Multi-line text input
   - Toolbar buttons:
     - Voice dictation (microphone)
     - Audio recording (hold to record)
     - Image upload (camera)
     - Service functions grid (37+ options)
     - OBD connect button
   - Submit button ("Analisa")

4. **OBD Terminal**
   - Live data display (RPM, Temp, Voltage, Load)
   - Command log (TX/RX/INFO/ERR)
   - Command input field
   - Send button

5. **Service Functions Grid**
   - 4-column grid layout
   - Icon + label for each function
   - Categories: Oil Reset, EPB, SAS, DPF, BMS, Throttle, etc.

### Job Card Content
1. **Vehicle Header**
   - AI-generated vehicle image
   - Vehicle info (Year, Make, Model, Engine)
   - Component ID badge
   - Estimated work time
   - Text-to-speech button

2. **Cost Estimation**
   - Total estimate
   - Parts cost
   - Labor cost
   - Hourly rate

3. **Diagnosis Section**
   - Expert diagnosis list
   - Manual summary quote
   - DTC codes (clickable for details)
   - TSB references

4. **Technical Tabs**
   - Specs & Torque: Torque table, maintenance data
   - Parts & Tools: Required tools, aftermarket parts
   - Wiring: System description, search button
   - Videos: YouTube tutorial links

5. **SOP Steps**
   - Numbered timeline
   - Step-by-step instructions

6. **Engineering Mode**
   - Safety confirmation checkbox
   - HEX command cards with risk level
   - Load to terminal button

## Key User Flows

### Flow 1: Basic Diagnosis
1. User opens app → Disclaimer modal (first time)
2. User accepts disclaimer → Home screen
3. User types complaint or uses voice input
4. User taps "Analisa" button
5. Loading state with animation
6. Job Card appears with full diagnosis

### Flow 2: OBD-Connected Diagnosis
1. User taps OBD connect button
2. Bluetooth device selection
3. Connection established → Live data appears
4. User describes issue (live data auto-included)
5. AI analyzes with real-time vehicle data
6. HEX commands suggested if applicable

### Flow 3: Service Function Reset
1. User taps Service Functions button
2. Grid overlay appears
3. User selects function (e.g., "Oil Reset")
4. Pre-filled prompt appears
5. User taps "Analisa"
6. Step-by-step reset procedure with HEX commands

### Flow 4: VIN Decode
1. User enters VIN in input
2. VIN detected and decoded
3. Vehicle badge appears in context
4. All subsequent queries include vehicle context

## Responsive Breakpoints

### Mobile (< 768px)
- Single column layout
- Full-width cards
- Bottom sheet for service functions
- Collapsible terminal

### Tablet (768px - 1024px)
- Two-column layout on Job Card
- Side-by-side chat and result view
- Expanded service functions grid

### Desktop (> 1024px)
- Three-column layout possible
- Sidebar chat, main content, secondary panel
- Hover states and tooltips
- Keyboard shortcuts

## Animation Guidelines
- Use `react-native-reanimated` for smooth animations
- Fade-in for new content (200ms)
- Slide-up for modals (300ms)
- Pulse for loading states
- Scale on press for buttons (0.95)

## Accessibility
- Minimum touch target: 44x44px
- Color contrast ratio: 4.5:1 minimum
- Screen reader labels for all interactive elements
- Reduced motion support
