import alertService from '@/services/alertService'

const BASE_PRINT_STYLES = `
  @page { size: A4 portrait; margin: 10mm 12mm; }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    margin: 0;
    padding: 0;
    font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
    background: #ffffff !important;
    color: #0f172a !important;
    direction: rtl;
    line-height: 1.45;
  }
  .no-print { display: none !important; }
  .official-voucher-paper {
    width: 100%;
    background: #ffffff !important;
    border: 1.5px solid #0f172a;
    border-radius: 6px;
    padding: 24px 28px;
  }
  .voucher-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }
  .company-brand { display: flex; align-items: center; gap: 16px; }
  .brand-logo-container { display: flex; align-items: center; }
  .company-logo-img { height: 52px; width: auto; max-width: 170px; object-fit: contain; display: block; }
  .brand-text h2, .company-name-ar { margin: 0; font-size: 18px; color: #0f172a; font-weight: 800; }
  .company-name-en { display: block; font-size: 11px; color: #475569; font-weight: 700; letter-spacing: 0.5px; margin-top: 1px; }
  .company-legal-tags { font-size: 10.5px; color: #64748b; margin-top: 4px; display: flex; align-items: center; gap: 8px; }
  .dot-separator { color: #cbd5e1; }
  .voucher-title-block { text-align: left; direction: ltr; }
  .voucher-title-badge {
    background: #0f172a;
    color: #ffffff;
    padding: 6px 14px;
    border-radius: 4px;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .voucher-title-ar { font-size: 13.5px; font-weight: 800; direction: rtl; display: block; }
  .voucher-title-en { font-size: 9px; font-weight: 700; letter-spacing: 0.8px; color: #94a3b8; display: block; }
  .voucher-reference-row { margin-top: 6px; font-size: 11px; color: #334155; display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
  .ref-label { color: #64748b; }
  .ref-code { font-family: 'JetBrains Mono', monospace; color: #0f172a; font-size: 12px; font-weight: 800; }
  .voucher-status-stamp {
    display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px;
    color: #047857; font-weight: 700; margin-top: 3px; direction: rtl;
  }
  .check-svg { width: 13px; height: 13px; }
  .voucher-divider-rule {
    height: 3px; border-top: 2px solid #0f172a; border-bottom: 1px solid #cbd5e1; margin: 16px 0 18px;
  }
  .voucher-meta-strip {
    display: grid; grid-template-columns: repeat(4, 1fr); background: #f8fafc;
    border: 1px solid #cbd5e1; border-radius: 6px; padding: 9px 16px; margin-bottom: 16px; gap: 12px;
  }
  .meta-item { display: flex; flex-direction: column; gap: 2px; }
  .meta-lbl { font-size: 10.5px; color: #64748b; font-weight: 600; }
  .meta-val { font-size: 12.5px; color: #0f172a; font-weight: 700; }
  .meta-val.hash { font-family: monospace; font-size: 11px; color: #475569; }
  .voucher-section-card {
    border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px 18px; margin-bottom: 16px; background: #ffffff;
  }
  .section-card-title {
    border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .section-title-text { display: flex; align-items: baseline; gap: 8px; justify-content: space-between; }
  .section-title-text h4 { margin: 0; font-size: 13px; font-weight: 800; color: #0f172a; }
  .sub-en { font-size: 9.5px; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
  .tasks-count-pill { background: #0f172a; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 700; }
  .employee-details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 14px; font-size: 11.5px; }
  .detail-cell { display: flex; flex-direction: column; gap: 2px; }
  .detail-label { font-size: 10px; color: #64748b; font-weight: 600; }
  .detail-value { font-size: 12px; color: #0f172a; font-weight: 600; }
  .detail-value.emp-name, .emp-name { font-size: 13px; font-weight: 800; }
  .ltr { direction: ltr; text-align: right; }
  .text-blue { color: #0284c7; }
  .text-green { color: #047857 !important; }
  .text-emerald { color: #047857 !important; }
  .font-mono { font-family: 'JetBrains Mono', monospace; }
  .net-salary-highlight-box {
    border: 1.5px solid #0f172a; background: #f8fafc; border-radius: 6px; padding: 14px 18px; margin-bottom: 16px;
  }
  .highlight-main {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid #cbd5e1; padding-bottom: 10px; margin-bottom: 10px; gap: 16px;
  }
  .amount-title { font-size: 10.5px; font-weight: 800; color: #475569; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
  .amount-figure { display: flex; align-items: baseline; gap: 6px; }
  .amount-figure .val { font-size: 26px; font-weight: 900; color: #0f172a; font-variant-numeric: tabular-nums; }
  .amount-figure .currency { font-size: 13px; font-weight: 800; color: #0f172a; }
  .tafqeet-side { max-width: 55%; text-align: right; direction: rtl; }
  .tafqeet-title { font-size: 10px; color: #64748b; font-weight: 700; display: block; }
  .tafqeet-text { margin: 2px 0 0; font-size: 12px; font-weight: 800; color: #0f172a; line-height: 1.4; }
  .payment-method-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 11px; }
  .pay-method-item { display: flex; flex-direction: column; gap: 2px; }
  .pay-method-item .lbl { font-size: 9.5px; color: #64748b; font-weight: 600; }
  .pay-method-item .val { color: #0f172a; font-size: 11.5px; font-weight: 700; }
  .pay-method-item .val.code { font-family: monospace; }
  .notes-sub-box { margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 11px; }
  .notes-sub-box .lbl { font-weight: 700; color: #475569; }
  .notes-sub-box p { margin: 2px 0 0; color: #1e293b; }
  .official-voucher-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  .official-voucher-table th, .official-voucher-table td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right; }
  .official-voucher-table th { background: #f1f5f9; color: #0f172a; font-weight: 800; font-size: 11px; }
  .task-type-tag { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; background: #e2e8f0; color: #334155; }
  .tag-project { background: #e0f2fe; color: #0369a1; }
  .tag-quick { background: #fef3c7; color: #92400e; }
  .total-label-cell { text-align: left !important; font-weight: 800; background: #f8fafc; }
  .total-val-cell { background: #f8fafc; font-size: 13px; color: #047857; }
  .voucher-signatures-container {
    display: flex; justify-content: space-between; align-items: center; margin-top: 18px;
    padding: 14px 18px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff;
  }
  .sig-block { text-align: center; width: 32%; }
  .sig-title { font-size: 11px; font-weight: 800; color: #0f172a; display: block; }
  .sig-sub { font-size: 8px; color: #64748b; font-weight: 700; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
  .sig-space { height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .sig-signature-name { font-size: 14px; font-weight: 800; color: #0f172a; }
  .sig-date { font-size: 9.5px; color: #64748b; }
  .sig-line { display: block; border-top: 1px solid #cbd5e1; padding-top: 4px; font-size: 10px; color: #64748b; }
  .sig-approved-stamp {
    border: 1.5px solid #047857; color: #047857; padding: 3px 10px; border-radius: 4px;
    font-size: 11px; font-weight: 800; display: inline-block;
  }
  .official-seal-wrapper { display: flex; align-items: center; justify-content: center; width: 30%; }
  .circular-seal {
    width: 82px; height: 82px; border: 1.5px solid #0f172a; border-radius: 50%;
    padding: 2.5px; display: flex; align-items: center; justify-content: center;
  }
  .seal-inner-circle {
    width: 100%; height: 100%; border: 1px dashed #334155; border-radius: 50%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; font-size: 7.5px; color: #0f172a; line-height: 1.15; padding: 2px;
  }
  .seal-company { font-weight: 800; font-size: 7px; letter-spacing: 0.3px; }
  .seal-dots { font-size: 7px; color: #475569; letter-spacing: 1px; line-height: 1; margin: 1px 0; }
  .seal-center { font-size: 9.5px; font-weight: 900; color: #0f172a; margin: 1px 0; }
  .seal-en-center { font-size: 6.5px; font-weight: 700; letter-spacing: 0.5px; display: block; color: #475569; }
  .seal-dept { font-size: 7px; color: #475569; font-weight: 600; }
  .voucher-footer { margin-top: 14px; padding-top: 8px; border-top: 1px solid #e2e8f0; text-align: center; }
  .disclaimer-text { font-size: 9px; color: #64748b; margin: 0 0 4px; line-height: 1.4; }
  .footer-meta-row { display: flex; justify-content: space-between; font-size: 8.5px; color: #94a3b8; }
`

const VARIANT_STYLES = {
  slate: '',
  emerald: `
    body { padding: 12px; line-height: 1.5; }
    .official-voucher-paper { max-width: 820px !important; margin: 0 auto !important; border: 1.5px solid #cbd5e1 !important; border-radius: 8px !important; }
    .voucher-header { align-items: flex-start; margin-bottom: 16px; }
    .company-name-ar { font-size: 17px; color: #020617; }
    .voucher-title-block { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .voucher-title-badge { background: #ecfdf5 !important; border: 1.5px solid #059669 !important; border-radius: 8px; padding: 5px 12px; display: inline-block; }
    .voucher-title-ar { font-size: 14px; color: #065f46 !important; }
    .voucher-title-en { color: #047857 !important; }
    .ref-code { color: #047857 !important; font-size: 13px; }
    .voucher-status-stamp { background: #d1fae5 !important; color: #065f46 !important; font-size: 10px; padding: 2px 8px; border-radius: 12px; border: 1px solid #10b981 !important; }
    .voucher-divider-rule { border: none; background: linear-gradient(90deg, #059669 0%, #cbd5e1 50%, #059669 100%) !important; margin: 14px 0 16px 0; border-radius: 2px; }
    .voucher-meta-strip { border-color: #e2e8f0 !important; border-radius: 8px; padding: 10px 14px; }
    .voucher-section-card { border-color: #e2e8f0 !important; border-radius: 8px; }
    .section-card-title { border-bottom-color: #f1f5f9; }
    .ltv-pill { font-size: 11px; color: #065f46; background: #ecfdf5 !important; padding: 3px 8px; border-radius: 6px; border: 1px solid #a7f3d0 !important; }
    .emp-name { color: #047857 !important; font-size: 14px; }
    .net-receipt-highlight-box { background: #ecfdf5 !important; border: 1.5px solid #10b981 !important; border-radius: 10px; padding: 16px 20px; margin-bottom: 18px; }
    .highlight-main-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #a7f3d0; padding-bottom: 12px; margin-bottom: 12px; }
    .highlight-sub-title { font-size: 12px; font-weight: 700; color: #065f46; display: block; margin-bottom: 4px; }
    .highlight-big-amount { display: flex; align-items: baseline; gap: 6px; }
    .amount-number { font-size: 26px; font-weight: 900; color: #064e3b; font-family: 'JetBrains Mono', monospace; }
    .currency-tag { font-size: 14px; font-weight: 800; color: #047857; }
    .highlight-details-group { display: flex; flex-direction: column; gap: 4px; text-align: left; }
    .detail-item { font-size: 12px; }
    .item-label { color: #065f46; font-weight: 600; margin-left: 6px; }
    .item-value { color: #064e3b; font-weight: 700; }
    .tafqeet-legal-box { display: flex; flex-direction: column; gap: 6px; background: #ffffff !important; border: 1px solid #a7f3d0 !important; border-radius: 6px; padding: 10px 14px; }
    .tafqeet-row { display: flex; align-items: baseline; gap: 8px; font-size: 13px; }
    .tafqeet-prefix { font-weight: 700; color: #047857; min-width: 90px; }
    .tafqeet-client-name { font-weight: 800; color: #0f172a; }
    .tafqeet-text { font-weight: 800; color: #065f46; }
    .tafqeet-description { font-weight: 600; color: #334155; }
    .voucher-authorization-strip { display: flex; justify-content: space-between; align-items: center; padding: 14px 10px 6px 10px; margin-bottom: 12px; }
    .signature-column { width: 170px; text-align: center; display: flex; flex-direction: column; align-items: center; }
    .sig-name { font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 18px; }
    .sig-line { width: 100%; border-top: none; border-bottom: 1.5px dashed #94a3b8; margin-bottom: 4px; }
    .sig-hint { font-size: 10px; color: #94a3b8; }
    .official-seal-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .corporate-digital-seal { width: 90px; height: 90px; border: 2px dashed #059669 !important; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 3px; }
    .seal-inner-circle { border: 1px solid #10b981 !important; padding: 3px; }
    .seal-top-text { font-size: 7px; font-weight: 800; color: #065f46; }
    .seal-dots { color: #10b981; font-size: 6px; letter-spacing: 2px; }
    .verified-tag { display: inline-flex; align-items: center; gap: 3px; }
    .inline-check-svg { width: 11px; height: 11px; color: #059669 !important; }
    .seal-badge-box { background: #059669 !important; color: #ffffff !important; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 3px; margin: 1px 0; }
    .seal-status-en { font-size: 6px; font-weight: 700; color: #047857; }
    .seal-bottom-text { font-size: 6px; font-weight: 700; color: #065f46; }
    .seal-sub-caption { font-size: 9px; color: #64748b; font-weight: 600; }
    .voucher-footer-notes { border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #64748b; }
    .footer-legal-notice p { margin-bottom: 6px; line-height: 1.4; }
    .footer-meta-row { justify-content: center; gap: 10px; font-size: 10px; }
  `,
  statement: `
    @page { size: A4 portrait; margin: 8mm 10mm; }
    body { padding: 10px; }
    .official-statement-paper { background: #ffffff !important; color: #0f172a !important; width: 100% !important; max-width: 860px !important; margin: 0 auto !important; padding: 20px 24px !important; border: 1.5px solid #cbd5e1 !important; border-radius: 8px !important; }
    .statement-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 12px; }
    .company-name-ar { font-size: 16px; color: #020617; }
    .company-name-en { font-size: 10.5px; font-weight: 600; margin-bottom: 4px; }
    .statement-title-block { text-align: left; display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
    .statement-title-badge { background: #eff6ff !important; border: 1.5px solid #2563eb !important; border-radius: 6px; padding: 4px 10px; text-align: center; display: inline-block; }
    .badge-title-ar { display: block; font-size: 13px; font-weight: 800; color: #1e40af !important; }
    .badge-title-en { display: block; font-size: 8.5px; font-weight: 700; color: #1d4ed8 !important; letter-spacing: 0.8px; }
    .statement-ref-row { font-size: 11px; color: #334155; margin-top: 2px; }
    .ref-code { color: #1d4ed8 !important; font-size: 12px; }
    .statement-status-stamp { display: inline-flex; align-items: center; gap: 4px; background: #dcfce7 !important; color: #15803d !important; font-size: 9.5px; font-weight: 700; padding: 2px 7px; border-radius: 10px; border: 1px solid #22c55e !important; }
    .check-svg { width: 12px; height: 12px; }
    .statement-divider-rule { height: 3px; background: linear-gradient(90deg, #2563eb 0%, #cbd5e1 50%, #2563eb 100%) !important; margin: 10px 0 12px 0; border-radius: 2px; }
    .statement-meta-strip { display: grid; grid-template-columns: repeat(4, 1fr); background: #f8fafc !important; border: 1px solid #e2e8f0 !important; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; gap: 10px; }
    .meta-lbl { font-size: 10px; }
    .meta-val { font-size: 12px; }
    .text-emerald { color: #059669 !important; }
    .statement-section-card { border: 1px solid #e2e8f0 !important; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; background: #ffffff !important; }
    .section-card-title { padding-bottom: 6px; margin-bottom: 8px; border-bottom-color: #f1f5f9; }
    .section-title-text h4 { font-size: 12.5px; }
    .sub-en { font-size: 8.5px; }
    .account-active-badge { font-size: 10px; color: #15803d; background: #dcfce7 !important; padding: 2px 7px; border-radius: 4px; border: 1px solid #86efac !important; }
    .client-details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 12px; }
    .client-name-highlight { color: #1d4ed8 !important; font-size: 13px; }
    .statement-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
    .kpi-card { border-radius: 6px; padding: 8px 10px; border: 1px solid #cbd5e1 !important; display: flex; align-items: center; gap: 8px; background: #f8fafc !important; }
    .kpi-icon-wrap { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #ffffff !important; border: 1px solid #e2e8f0; flex-shrink: 0; }
    .kpi-svg { width: 16px; height: 16px; }
    .gold-icon .kpi-svg { color: #d97706 !important; }
    .teal-icon .kpi-svg { color: #0d9488 !important; }
    .purple-icon .kpi-svg { color: #7c3aed !important; }
    .green-icon .kpi-svg { color: #059669 !important; }
    .badge-check-svg { width: 12px; height: 12px; }
    .title-with-icon { display: flex; align-items: center; gap: 6px; }
    .section-heading-svg { width: 15px; height: 15px; color: #2563eb !important; }
    .verified-cell-text { display: inline-flex; align-items: center; gap: 4px; }
    .cell-check-svg { width: 13px; height: 13px; color: #15803d !important; }
    .receipt-action-svg { width: 13px; height: 13px; }
    .kpi-content small { font-size: 9.5px; color: #475569; display: block; font-weight: 600; }
    .kpi-content strong { font-size: 14px; color: #0f172a; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
    .kpi-hint { display: none; }
    .tafqeet-summary-box { background: #f0fdf4 !important; border: 1px solid #86efac !important; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    .tafqeet-line { font-size: 11.5px; display: flex; align-items: baseline; gap: 6px; }
    .tafqeet-lbl { font-weight: 700; color: #166534; }
    .tafqeet-val { font-weight: 800; color: #14532d; }
    .last-pay-tag { font-size: 10.5px; color: #475569; }
    .statement-ledger-section { border: 1px solid #e2e8f0 !important; border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; background: #ffffff !important; }
    .statement-ledger-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .statement-ledger-table th { background: #f1f5f9 !important; color: #334155; font-weight: 700; padding: 6px 8px; border-bottom: 1.5px solid #cbd5e1 !important; text-align: right; }
    .statement-ledger-table td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0 !important; color: #1e293b; }
    .text-dark-bold { font-weight: 700; color: #0f172a; }
    .amount-cell { font-weight: 800; font-family: 'JetBrains Mono', monospace; }
    .status-stamp-pill { font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px; }
    .stamp-completed { background: #dcfce7 !important; color: #15803d !important; border: 1px solid #86efac; }
    .stamp-voided { background: #fee2e2 !important; color: #b91c1c !important; }
    .ledger-total-row td { background: #f8fafc !important; border-top: 1.5px solid #94a3b8 !important; font-weight: 800; font-size: 11.5px; }
    .total-amount-cell { color: #047857 !important; font-size: 13px; font-family: 'JetBrains Mono', monospace; }
    .total-status-note { font-size: 10px; color: #15803d; }
    .statement-authorization-strip { display: flex; justify-content: space-between; align-items: center; padding: 10px 10px 4px 10px; margin-bottom: 10px; }
    .sig-col { width: 160px; text-align: center; display: flex; flex-direction: column; align-items: center; }
    .sig-header { font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 2px; }
    .sig-person { font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 14px; }
    .sig-underline { width: 100%; border-bottom: 1.5px dashed #94a3b8; margin-bottom: 3px; }
    .sig-date { font-size: 9px; color: #94a3b8; }
    .official-seal-wrap { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .statement-digital-seal { width: 82px; height: 82px; border: 2px dashed #2563eb !important; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 2px; }
    .seal-inner-circle { border: 1px solid #3b82f6 !important; padding: 2px; }
    .seal-top-text { font-size: 6.5px; font-weight: 800; color: #1e40af; }
    .seal-dots { font-size: 6px; color: #3b82f6; letter-spacing: 2px; }
    .seal-badge-box { background: #2563eb !important; color: #ffffff !important; font-size: 7.5px; font-weight: 900; padding: 1px 3px; border-radius: 2px; margin: 1px 0; }
    .seal-status-en { font-size: 5.5px; font-weight: 700; color: #1d4ed8; }
    .seal-bottom-text { font-size: 5.5px; font-weight: 700; color: #1e40af; }
    .seal-sub-caption { font-size: 8px; color: #64748b; font-weight: 600; }
    .statement-footer-notes { border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 9px; color: #64748b; }
    .footer-legal-notice p { margin-bottom: 4px; line-height: 1.35; }
    .footer-meta-row { justify-content: center; gap: 8px; font-size: 9px; }
  `,
}

/**
 * Prints an official finance voucher or statement via an isolated hidden iframe
 * after waiting for embedded images (like /logo.png) to finish loading.
 */
export function printFinanceDocument({
  elementId,
  title = 'مستند مالي معتمد',
  variant = 'slate',
  fallbackToWindowPrint = false,
  notFoundMessage = 'تعذر العثور على الوثيقة للطباعة',
}) {
  const printableEl = document.getElementById(elementId)
  if (!printableEl) {
    if (fallbackToWindowPrint) window.print()
    else alertService.toast(notFoundMessage, 'error')
    return
  }

  const printIframe = document.createElement('iframe')
  Object.assign(printIframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: 'none',
    zIndex: '-9999',
  })
  document.body.appendChild(printIframe)

  const doc = printIframe.contentWindow.document
  const variantCss = VARIANT_STYLES[variant] || ''

  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
      <style>${BASE_PRINT_STYLES}\n${variantCss}</style>
    </head>
    <body>${printableEl.outerHTML}</body>
    </html>
  `)
  doc.close()

  const imgs = printIframe.contentWindow.document.getElementsByTagName('img')
  let triggered = false
  const triggerPrint = () => {
    if (triggered) return
    triggered = true
    setTimeout(() => {
      printIframe.contentWindow.focus()
      printIframe.contentWindow.print()
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe)
        }
      }, 2500)
    }, 300)
  }

  if (imgs.length === 0) {
    triggerPrint()
    return
  }

  let loadedCount = 0
  const markDone = () => {
    loadedCount++
    if (loadedCount >= imgs.length) triggerPrint()
  }

  for (let i = 0; i < imgs.length; i++) {
    if (imgs[i].complete) {
      markDone()
    } else {
      imgs[i].onload = markDone
      imgs[i].onerror = markDone
    }
  }
  setTimeout(triggerPrint, 1800)
}
