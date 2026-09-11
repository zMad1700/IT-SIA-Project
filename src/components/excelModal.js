// Interactive Excel Import Modal Component
import { icon, escapeHtml } from '../utils/dom.js';

export const excelImportModalMarkup = () => `
<div class="modal-backdrop-modern" id="excel-import-modal">
  <section class="modal-card-modern excel-modal-card" role="dialog" aria-modal="true" aria-labelledby="excel-modal-title">
    <div class="modal-card-header">
      <div class="modal-title-wrap">
        <div class="modal-icon-badge icon-emerald">
          ${icon('file-spreadsheet', 20)}
        </div>
        <div>
          <h2 id="excel-modal-title" class="modal-title">Import Scholars Spreadsheet</h2>
          <p class="modal-subtitle">Upload official university renewal records in .xlsx, .xls, or .csv format.</p>
        </div>
      </div>
      <button class="modal-close-pill" type="button" data-close-excel-modal aria-label="Close">${icon('x', 18)}</button>
    </div>

    <div class="excel-modal-body">
      <!-- Drag & Drop Zone -->
      <div class="excel-dropzone" id="excel-dropzone" tabindex="0" role="button" aria-label="Upload Excel File">
        <input type="file" id="excel-file-input" accept=".xlsx, .xls, .csv" hidden>
        <div class="dropzone-inner">
          <div class="dropzone-icon-circle">
            ${icon('upload-cloud', 28)}
          </div>
          <strong class="dropzone-title">Click to browse or drag and drop spreadsheet here</strong>
          <p class="dropzone-subtitle">Supports Cor Jesu College, UM, and all partner school renewal formats (.xlsx, .xls, .csv)</p>
          <div class="dropzone-pills-row">
            <span class="file-ext-pill">XLSX</span>
            <span class="file-ext-pill">XLS</span>
            <span class="file-ext-pill">CSV</span>
          </div>
        </div>
      </div>

      <!-- Quick Template & Guide Row -->
      <div class="template-help-row">
        <div class="template-help-text">
          ${icon('info', 15)}
          <span>Headers like <code>Last Name</code>, <code>First Name</code>, <code>Course</code>, and <code>School</code> will be auto-detected.</span>
        </div>
        <button type="button" class="template-download-link" data-download-template>
          ${icon('download', 14)}
          <span>Download Sample Template</span>
        </button>
      </div>

      <!-- Live File Preview Container (revealed on file selection) -->
      <div class="excel-preview-container" id="excel-preview-container" style="display: none;">
        <div class="preview-header-bar">
          <div class="preview-file-info">
            <div class="file-icon-badge">${icon('file-check', 16)}</div>
            <strong id="preview-filename">CJC-Renewal-1st-sem-2026-27.xlsx</strong>
          </div>
          <div class="preview-stats-row">
            <span class="stat-badge-pill pill-done" id="preview-valid-count">0 Valid Scholars</span>
          </div>
        </div>

        <div class="preview-table-wrap">
          <table class="modern-mini-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>SCHOOL</th>
                <th>COURSE</th>
                <th>YEAR</th>
                <th>PHONE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody id="preview-table-body">
              <!-- Populated by JavaScript preview -->
            </tbody>
          </table>
        </div>
        <p class="preview-table-note" id="preview-table-note">Showing preview of first 5 records.</p>
      </div>
    </div>

    <div class="modal-actions-row">
      <button class="secondary-pill-btn" type="button" data-close-excel-modal>Cancel</button>
      <button class="primary-pill-btn" type="button" id="excel-confirm-btn" disabled>
        ${icon('check', 16)}
        <span id="excel-confirm-text">Select File to Import</span>
      </button>
    </div>
  </section>
</div>
`;
