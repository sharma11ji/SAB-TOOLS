# SAB TOOLS (Android)

Smart Tools for Carpenters & Furniture Workers — Native Android application built with Kotlin and Jetpack Compose.

SAB TOOLS provides essential woodworking, saw mill, and furniture business utilities designed for speed, precision, and complete offline capability.

## Features

### 1. Wood Calculators
- **Round Wood (Logs)**: Imperial (CFT) and Metric (CBM) using the standard forestry quarter-girth formula:
  - CFT: `Length(ft) × Girth(in)² ÷ 2304`
  - CBM: `Length(m) × (Girth(cm) ÷ 400)²`
- **Multi-Log Logbook & Table**: Add multiple tree logs with live total volume, pieces count, unit rate, and total amount calculation.
- **Size Wood (Sawn Planks)**: Rectangular lumber calculation:
  - CFT: `Length(ft) × Width(in) × Thickness(in) ÷ 144`
  - CBM: `Length(m) × (Width(cm) ÷ 100) × (Thickness(cm) ÷ 100)`
- **Flush Door & Plywood Area**: Surface area calculation in square feet and square metres.

### 2. Timber Billing & Invoicing
- Full-featured timber sales invoice generator:
  - Shop & saw mill branding, receipt number, date.
  - Customer name, mobile number, and village address.
  - Multi-item timber log lines with individual measurements and rates.
  - Wood value, labour charges, transport charges, advance paid, and balance due.
  - "Save as Paid" or "Save as Pending" payment classification.

### 3. 2D Guillotine Cutting Optimizer
- Multi-start guillotine sheet packing algorithm.
- Input stock sheets and required cut parts with grain direction and rotation preferences.
- Configurable blade kerf loss and edge trim margins.
- Visual canvas sheet diagram preview with parts placed and cut lines.
- Material efficiency metrics (% used vs % waste) and reusable offcuts list.

### 4. Baki Hisab (Credit / Ledger Management)
- Tracks outstanding customer balances from timber receipts.
- Segregated tabs for "Pending" and "Paid" history.
- Quick "Mark Paid" and partial payment collection with instant balance reconciliation.

### 5. Customer Directory & Sales Reports
- **Customer List**: Automatically aggregated from saved receipts with phone dialing and purchase history.
- **Sale Report**: Financial performance analytics for Today, This Week, This Month, and All Time, including top customer rankings.

### 6. Workshop Tools
- **Bubble Level**: Hardware accelerometer spirit level with tilt readouts, level indicator (within 2°), and surface zero-calibration.
- **User Manual**: Reference guide and mathematical formulas for carpenters.

## Architecture & Technology Stack
- **UI Framework**: Jetpack Compose with Material Design 3 (M3).
- **Architecture**: MVVM with unidirectional data flow and Kotlin Coroutines/Flow.
- **Local Persistence**: Room SQLite database (`AppDatabase`) with reactive DAO queries.
- **Sensors**: Android `SensorManager` with `Sensor.TYPE_ACCELEROMETER` for real-time bubble level tilt.
- **Language**: Kotlin 2.1.0 with Gradle Kotlin DSL (`build.gradle.kts`).
- **SDK Target**: Min SDK 26 (Android 8.0), Target SDK 35.
