<template>
  <RouterView />
  <GlobalAlertsProvider />
</template>

<script setup>
import { RouterView } from 'vue-router';
import GlobalAlertsProvider from './components/GlobalAlertsProvider.vue';
</script>
<style>
/* ==========================================================================
   Theme-Preserving Sticky Columns for System Tables (RTL)
   ========================================================================== */

/* 1. First Column: Row Number (#) */
.table-responsive table th:first-child,
.table-responsive table td:first-child {
  position: sticky !important;
  right: 0 !important;
  z-index: 4 !important;
  width: 54px !important;
  min-width: 54px !important;
  max-width: 54px !important;
  box-sizing: border-box !important;
  text-align: center !important;
  padding-left: 4px !important;
  padding-right: 4px !important;
  background-color: #0e153f !important;
}

/* 2. Second Column: Entity Identifier (Client / User / Plan / Task / etc.) */
.table-responsive table th:nth-child(2),
.table-responsive table td:nth-child(2) {
  position: sticky !important;
  right: 54px !important;
  z-index: 4 !important;
  background-color: #0e153f !important;
  border-left: 1px solid rgba(138, 152, 222, 0.15) !important;
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.22) !important;
}

/* 3. Headers: higher z-index to stay above body cells during scroll */
.table-responsive table thead th:first-child,
.table-responsive table thead th:nth-child(2) {
  z-index: 8 !important;
  background-color: #0b1134 !important;
}

/* 4. Table Row Hover States: subtle theme-matched hover */
.table-responsive table tbody tr:hover td:first-child,
.table-responsive table tbody tr:hover td:nth-child(2) {
  background-color: #141c4f !important;
}

/* 5. Special states: Danger & Warning rows */
.table-responsive table tbody tr.row-danger td:first-child,
.table-responsive table tbody tr.row-danger td:nth-child(2) {
  background-color: #1e1335 !important;
}
.table-responsive table tbody tr.row-warning td:first-child,
.table-responsive table tbody tr.row-warning td:nth-child(2) {
  background-color: #211c34 !important;
}

/* 6. Loading and Empty states with colspan: do not stick or constrain width */
.table-responsive table tbody tr td[colspan] {
  position: static !important;
  width: auto !important;
  min-width: auto !important;
  max-width: none !important;
  box-shadow: none !important;
  background-color: transparent !important;
}

/* ==========================================================================
   Spreadsheet Board Sticky Columns (Excel-like Light Theme)
   ========================================================================== */
.spreadsheet-container .row-num-header,
.spreadsheet-container tbody td:first-child {
  position: sticky !important;
  right: 0 !important;
  z-index: 5 !important;
  width: 45px !important;
  min-width: 45px !important;
  max-width: 45px !important;
  background-color: #f1f3f4 !important;
  text-align: center !important;
}
.spreadsheet-container thead tr:nth-child(2) th:first-child,
.spreadsheet-container tbody td:nth-child(2) {
  position: sticky !important;
  right: 45px !important;
  z-index: 5 !important;
  background-color: #f1f3f4 !important;
  border-left: 1px solid #cbd5e1 !important;
  box-shadow: -3px 0 6px rgba(0, 0, 0, 0.08) !important;
}

.spreadsheet-container .row-num-header {
  z-index: 12 !important;
  background-color: #e0e0e0 !important;
}
.spreadsheet-container thead tr:nth-child(2) th:first-child {
  z-index: 12 !important;
  background-color: #f4cccc !important;
}

.spreadsheet-container tbody tr:hover td:first-child,
.spreadsheet-container tbody tr:hover td:nth-child(2) {
  background-color: #e8ecf0 !important;
}
.spreadsheet-container tbody tr.urgent-row td:first-child,
.spreadsheet-container tbody tr.urgent-row td:nth-child(2) {
  background-color: #ffe4e6 !important;
}
.spreadsheet-container tbody tr.urgent-row:hover td:first-child,
.spreadsheet-container tbody tr.urgent-row:hover td:nth-child(2) {
  background-color: #fecdd3 !important;
}

.spreadsheet-container tbody tr td[colspan] {
  position: static !important;
  box-shadow: none !important;
  background-color: transparent !important;
}

/* ==========================================================================
   Global Responsive & UX Enhancements
   ========================================================================== */

/* 1. Prevent accidental horizontal viewport spill */
html, body {
  overflow-x: hidden;
  -webkit-tap-highlight-color: transparent;
  scroll-behavior: smooth;
}

/* 2. Sleek Custom Scrollbars (Webkit & Firefox) */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(125, 140, 224, 0.28) rgba(10, 16, 48, 0.4);
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(10, 16, 48, 0.4);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(125, 140, 224, 0.28);
  border-radius: 4px;
  transition: background 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(125, 232, 222, 0.6);
}

/* 3. Universal Table Responsiveness with Touch Momentum */
.table-responsive {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  border-radius: 12px;
}

/* 4. Universal Responsive Modals */
.modal-overlay,
.details-overlay,
.quick-task-modal-overlay {
  position: fixed;
  inset: 0 !important;
  z-index: 1000 !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  padding: clamp(10px, 3vw, 24px) !important;
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch;
  backdrop-filter: blur(8px);
}

.modal-content,
.modal-card,
.modal-container,
.details-modal,
.quick-task-modal {
  width: 100% !important;
  max-width: min(calc(100vw - 20px), var(--modal-max-width, 720px)) !important;
  max-height: calc(100dvh - 30px) !important;
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch;
  margin: auto !important;
}

/* 5. Mobile Form Input Zoom Prevention (iOS Safari & Chrome) */
@media (max-width: 768px) {
  input:not([type="checkbox"]):not([type="radio"]),
  select,
  textarea {
    font-size: 16px !important;
  }

  /* Optimize touch target sizes */
  button,
  .btn,
  .action-btn,
  .icon-btn,
  .nav-item {
    touch-action: manipulation;
  }
}
</style>
