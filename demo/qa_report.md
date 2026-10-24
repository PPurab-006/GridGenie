# GridGenie Demo Video Quality Assurance Report

**Project**: GridGenie — Autonomous Renewable Energy Microgrid Optimizer & 3D Digital Twin  
**Competition**: IEEE ClimateChain Global Hackathon  
**Live Deployed Application**: [https://ieee-theta-ten.vercel.app](https://ieee-theta-ten.vercel.app)  
**GitHub Repository**: [https://github.com/PPurab-006/GridGenie](https://github.com/PPurab-006/GridGenie)  
**Production Date**: October 24, 2026  
**Final Deliverable Path**: `demo/GridGenie_Demo.mp4`  

---

## 1. Executive Summary
A submission-ready, high-definition demonstration video was recorded and produced for **GridGenie**, capturing real interactions with the live deployed application. The demo showcases the full functional suite: the real-time 3D miniature microgrid digital twin, cinematic asset inspection, 24-hour physical simulation playback, adverse weather stress testing (Cloud Shock Event), linear programming dispatch comparison via SciPy HiGHS, machine learning forecast auditing with scikit-learn Ridge regression, and multi-objective parameter configuration.

The video features synchronized studio-quality narration, branded opening and closing title cards, and burned-in high-contrast subtitles positioned within safe margins to ensure complete legibility without obscuring key application UI.

---

## 2. Technical Specifications

| Parameter | Specification | Measured Value | Status |
| :--- | :--- | :--- | :--- |
| **Duration** | 3 – 5 minutes (180 – 300s) | **3 min 51.9 sec** (231.96s) | ✅ Pass |
| **Video Resolution** | 1080p (Full HD) | **1920 × 1080** | ✅ Pass |
| **Framerate** | 30 FPS | **30.000 FPS** (Constant) | ✅ Pass |
| **Video Codec** | H.264 / AVC (High Profile) | `libx264`, yuv420p, Level 4.0 | ✅ Pass |
| **Audio Format** | AAC Stereo | `mp4a`, 48,000 Hz, 140 kb/s | ✅ Pass |
| **Average Bitrate** | 800 – 1200 kb/s | **821.8 kb/s** | ✅ Pass |
| **File Size** | Lightweight streaming target | **23.8 MB** (23,822,772 bytes) | ✅ Pass |
| **Subtitles** | Burned-in + Standalone SRT | Burned via `libass` (PlayRes 1080p) + `GridGenie_Demo.srt` | ✅ Pass |
| **Audio Loudness** | Broadcast Standard (-24 to -18 dB) | Mean: **-20.8 dB**, Max Peak: **-2.2 dB** (0 clipping) | ✅ Pass |

---

## 3. Scene Breakdown & Timing

| Scene | Timestamp | Duration | Core Feature Highlighted |
| :--- | :---: | :---: | :--- |
| **Opening Title** | `00:00 – 00:03.5` | 3.5s | Branded opening title card with hackathon track credentials |
| **Scene 1: Introduction** | `00:03.5 – 00:35.8` | 32.3s | Overview of microgrid dispatch challenges & look-ahead value |
| **Scene 2: 3D Digital Twin** | `00:35.8 – 01:07.0` | 31.2s | Cinematic inspection of Solar, Wind, Battery, Load, and Substation |
| **Scene 3: Operations Clock** | `01:07.0 – 01:35.3` | 28.3s | 24h scrubber, animated particle flows, and physical balance check |
| **Scene 4: Cloud Shock Test** | `01:35.3 – 01:44.0` | 28.7s | 75% midday solar drop, battery response, peak tariff avoidance |
| **Scene 5: Performance Lab** | `01:44.0 – 02:35.2` | 31.2s | HiGHS LP solver vs heuristic: 12.4% cost savings, 45.9% peak shave |
| **Scene 6: ML Forecast Audit**| `02:35.2 – 03:00.8` | 25.6s | Scikit-learn Ridge regression metrics (Demand, Solar, Wind, Tariff) |
| **Scene 7: Parameter Tuning** | `03:00.8 – 03:26.0` | 25.2s | Microgrid Configuration Studio: battery capacity & carbon tax weight |
| **Scene 8: Evening Twin** | `03:26.0 – 03:47.4` | 21.4s | Sunset microgrid state, battery discharge powering facility |
| **Closing Frame** | `03:47.4 – 03:51.9` | 4.5s | Branded outro with GitHub repository and live application links |

---

## 4. Production Tools & Methodology

1. **Browser Recording**: Playwright (v1.62.1) driving Chromium Headless Shell with hardware WebGL acceleration (`--enable-webgl --use-gl=angle --use-angle=swiftshader`) at native 1920×1080 viewport.
2. **Text-to-Speech Engine**: Microsoft Neural Voice `en-US-ChristopherNeural` (professional documentary cadence, studio clarity).
3. **Graphic Design**: Custom title and outro cards rendered in 1080p using Python Pillow matching GridGenie brand palette (`#121A15`, `#1D3D2D`, `#00E599`, `#FAF8F5`).
4. **Video Processing & Assembly**: FFmpeg (v8.0.1) with `libx264`, `libass`, `aac` audio encoder, and `subtitles` filter.
5. **Subtitle Synchronization**: Millisecond-accurate word boundary alignment converted from neural TTS cues into standard SRT format.

---

## 5. Quality Verification Results

### A. Full Stream Decoding Test
```bash
ffmpeg -v error -i demo/GridGenie_Demo.mp4 -f null -
# Exit code: 0 (Zero frame corruption, zero PTS/DTS discontinuities)
```

### B. Audio Levels Analysis (`volumedetect`)
- **Total Samples Analyzed**: 22,294,528
- **Mean Volume**: `-20.8 dB`
- **Max Peak Volume**: `-2.2 dB`
- **Clipping Samples (0 dB)**: `0` (Zero clipping detected; clear audio headroom)

### C. Visual Inspection & Subtitle Placement
Extracted sample frames across critical transitions (`00:15`, `00:45`, `01:15`, `01:40`, `01:55`, `02:20`) confirm:
- Subtitles are rendered in crisp Liberation Sans bold typography with clean dark outlines (`MarginV=40`).
- Text remains strictly within the lower safe margin, clear of 3D asset tags, HUD controls, and data cards.
- Colors and lighting across the 3D twin, performance charts, and parameter sliders match the production application.

---

## 6. Deliverables Index

The following deliverables are organized within the `demo/` directory:
- [GridGenie_Demo.mp4](file:///home/purab/Purab/Projects/competitions/ieee/demo/GridGenie_Demo.mp4): Final 1080p master video with burned-in subtitles and synchronized audio.
- [GridGenie_Demo.srt](file:///home/purab/Purab/Projects/competitions/ieee/demo/GridGenie_Demo.srt): Synchronized English subtitle file.
- [narration_script.md](file:///home/purab/Purab/Projects/competitions/ieee/demo/narration_script.md): Full scene-by-scene script with timestamps and visual directions.
- [qa_report.md](file:///home/purab/Purab/Projects/competitions/ieee/demo/qa_report.md): This quality assurance report.
