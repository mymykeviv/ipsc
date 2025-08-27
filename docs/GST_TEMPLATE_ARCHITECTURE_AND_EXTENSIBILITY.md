# GST Invoice Template Architecture and Extensibility

## Overview
This document explains how GST invoice templates are defined, registered, exposed via APIs, rendered for PDFs, and how to add new templates safely. It complements `docs/GST_TEMPLATE_IMPLEMENTATION.md` by focusing on architecture and future extensibility.

## Core Components

- __Backend config source__: `backend/app/template_configs.py`
  - Defines JSON-serializable Python dicts for each template (e.g., `GST_TABULAR_TEMPLATE`, `GST_LOGISTICS_TEMPLATE`).
  - Registry `GST_INVOICE_TEMPLATES` maps a string `template_id` (e.g., `GST_LOGISTICS_A4_V1`) to metadata and the `template_config` JSON string.
  - Helpers:
    - `get_template_config(template_id: str)` → returns parsed JSON config by string ID.
    - `get_all_templates()` → returns the registry for seeding/sync.

- __Backend APIs__ (FastAPI): defined across `backend/app/main_routers.py` and `backend/app/routers.py`.
  - `GET /api/gst-invoice-templates` → list active templates (DB). If DB empty, seeds from `get_all_templates()`.
  - `GET /api/gst-invoice-templates/{id}` → get one template by numeric DB id.
  - `GET /api/gst-invoice-templates/default` → get default template (DB flag `is_default`).
  - `POST /api/gst-invoice-templates/{id}/set-default` → set a template as default.
  - `GET /api/gst-invoice-templates/config/{template_id}` → get raw JSON config by string `template_id` from the registry.
  - `GET /api/invoices/{invoice_id}/pdf?template_id=<numeric>&paper_size=<A4|A5>` → generate PDF using the selected DB template id and paper size.

- __Frontend usage__: `frontend/src/lib/api.ts`, `frontend/src/components/PDFViewer.tsx`, `frontend/src/pages/Invoices.tsx`
  - API wrappers:
    - `apiListGstInvoiceTemplates()`
    - `apiGetGstTemplateConfig(templateId: string)`
    - `apiGetInvoicePDF(invoiceId: number, templateId?: number, paperSize?: 'A4'|'A5')`
  - UI:
    - `PDFViewer.tsx` lists templates, lets the user pick paper size, and calls `apiGetInvoicePDF`.
    - `Invoices.tsx` can pass `initialTemplateId` and `initialPaperSize` (e.g., from URL params) to `PDFViewer`.

## Template Structure

Templates are dicts that serialize to JSON and contain:
- __template_id__: unique string (e.g., `GST_LOGISTICS_A4_V1`).
- __requires__: GST/title/HSN requirements.
- __validation__: rules; can inherit from a base (`{"inherit": "GST_TABULAR_A4A5_V1.validation"}`).
- __tax_logic__: GST split rules; can inherit from a base.
- __layout__:
  - `paper`: per-size settings like font and margins: `{ "A4": {"font_pt": 10, "margins_mm": 15}, "A5": {...} }`.
  - `sections`: ordered list; each section is either:
    - Fresh block (`type`: `block` | `grid` | `table` | `inline` | `box` | `repeat` | `totals`).
    - Inheritance (`type`: `inherit`, `from_template`: e.g., `"GST_TABULAR_A4A5_V1.header"`).

Example snippet (logistics-specific inline section):
```python
{
  "id": "transport",
  "type": "inline",
  "fields": [
    "invoice.transport.mode",
    "invoice.transport.vehicle_no",
    "invoice.transport.lr_no",
    "invoice.eway_bill_no"
  ]
}
```

## DB Synchronization

- On first call to `GET /api/gst-invoice-templates`, templates from `get_all_templates()` are inserted into `gst_invoice_templates` if the table is empty. Subsequent calls also ensure any newly added configs are inserted (sync logic present in both `backend/app/routers.py` and `backend/app/main_routers.py`).
- DB rows store:
  - Numeric `id` (used by `/invoices/{id}/pdf?template_id=<numeric>`)
  - String `template_id`, `name`, `description`, `template_config` (JSON), `paper_sizes`, flags, sorting, timestamps.

## Adding a New Template

1. __Define config__ in `backend/app/template_configs.py`:
   - Create a new dict following existing patterns (reuse sections via `type: inherit`).
   - Declare `layout.paper` keys to match supported sizes, e.g., `"A4"`, `"A5"`.

2. __Register__ in `GST_INVOICE_TEMPLATES`:
   - Add an entry with `template_id`, `name`, `description`, `template_config`: `json.dumps(YOUR_TEMPLATE)`, `paper_sizes` (comma list), `sort_order`.

3. __Deploy/Restart backend__.
   - On `GET /api/gst-invoice-templates`, the new template is seeded if missing.

4. __Use in UI__.
   - It will appear in the template dropdown. Selecting it will pass the numeric DB id to `/invoices/{invoice_id}/pdf`.

No frontend code changes are needed if the new template follows the contract.

## Paper Size Considerations

- Keep `paper_sizes` (registry) consistent with `layout.paper` keys (config).
- `PDFViewer.tsx` filters available sizes based on `paper_sizes`.
- Ensure A5 column sets fit: the base `GST_TABULAR_A4A5_V1` provides responsive columns; reuse where possible.

## JSON-Driven Extensibility (Optional Future)

If you want authoring outside Python files:
- __Short term__: Author configs as JSON and paste into `template_configs.py` dicts (they are serialized with `json.dumps`).
- __Future enhancement__: Add an admin endpoint to create templates from raw JSON without code changes:
  - `POST /api/gst-invoice-templates/custom` with body `{ template_id, name, description?, requires_gst, requires_hsn, title, paper_sizes, template_config: <JSON> }`.
  - Validate schema (required fields, allowed `paper` keys, section structure) and insert a `GSTInvoiceTemplate` row.
  - Optionally support `PUT` for updates and soft delete/deactivation.

This would let you upload a JSON file and start using it immediately; the PDF generator already consumes `template_config` from DB.

## Related Files
- `backend/app/template_configs.py` — source of truth for predefined templates and registry.
- `backend/app/main_routers.py` — endpoints including `/invoices/{invoice_id}/pdf` and template listing/default routes.
- `backend/app/routers.py` — duplicate/supplemental template routes and seeding logic.
- `frontend/src/lib/api.ts` — API wrappers for list/config/pdf.
- `frontend/src/components/PDFViewer.tsx` — template/paper selection UI and PDF fetch.
- `frontend/src/pages/Invoices.tsx` — passes initial template/paper (e.g., via URL) to `PDFViewer`.

## Testing Checklist
- __API__: list templates, get default, get config, set default.
- __PDF__: A4 and A5 output for each template; verify headings, columns, totals.
- __UI__: template dropdown populates; selection triggers PDF reload; error handling for non-PDF responses.

## Changelog
- Update `docs/CHANGELOG.md` when adding or modifying templates, noting:
  - Template ID(s) and purpose
  - Paper sizes
  - Any new sections or inherited overrides
