# Invoice Templates: Usage and Addition Guide

## Purpose
This guide explains how to use invoice templates (including GST Logistics) in the app and how to add new templates safely.

## Using Templates (End-to-End)

- **List templates (frontend)**
  - File: `frontend/src/lib/api.ts`
  - Function: `apiListGstInvoiceTemplates()`
  - Returns DB rows with numeric `id`, string `template_id`, `paper_sizes`, etc.

- **Preview/Download invoice PDF**
  - File: `frontend/src/components/PDFViewer.tsx`
  - Select template and paper size from dropdowns.
  - Calls `apiGetInvoicePDF(invoiceId, templateId?: number, paperSize?: 'A4'|'A5')`.
  - Ensures `content-type` is PDF; shows errors otherwise.

- **Pass initial selection from page**
  - File: `frontend/src/pages/Invoices.tsx`
  - Reads `template_id` and `paper_size` from URL params and passes them to `PDFViewer` as `initialTemplateId` and `initialPaperSize`.

- **Backend PDF generation**
  - File: `backend/app/main_routers.py`
  - Endpoint: `GET /api/invoices/{invoice_id}/pdf?template_id=<numeric>&paper_size=<A4|A5>`
  - Loads template by numeric DB `id` and renders using `template_config` JSON.

- **Fetch raw template config (optional)**
  - File: `frontend/src/lib/api.ts`
  - Function: `apiGetGstTemplateConfig(templateId: string)`
  - Endpoint: `GET /api/gst-invoice-templates/config/{template_id}` (string `template_id` like `GST_LOGISTICS_A4_V1`).

## Adding a New Template

1. **Define template config**
   - File: `backend/app/template_configs.py`
   - Create a JSON-serializable dict similar to `GST_LOGISTICS_TEMPLATE`.
   - Reuse base via inheritance to avoid duplication:
     ```python
     NEW_TEMPLATE = {
       "template_id": "GST_MY_TEMPLATE_A4_V1",
       "requires": {"gst": True, "title": "Tax Invoice", "hsn_required": True},
       "validation": {"inherit": "GST_TABULAR_A4A5_V1.validation"},
       "tax_logic": {"inherit": "GST_TABULAR_A4A5_V1.tax_logic"},
       "layout": {
         "paper": {"A4": {"font_pt": 10, "margins_mm": 15}},
         "sections": [
           {"id": "header", "type": "inherit", "from_template": "GST_TABULAR_A4A5_V1.header"},
           {"id": "meta", "type": "inherit", "from_template": "GST_TABULAR_A4A5_V1.meta"},
           # Add custom sections here
           {"id": "items_table", "type": "inherit", "from_template": "GST_TABULAR_A4A5_V1.items_table"},
           {"id": "summary", "type": "inherit", "from_template": "GST_TABULAR_A4A5_V1.summary"},
           {"id": "payment", "type": "inherit", "from_template": "GST_TABULAR_A4A5_V1.payment"},
           {"id": "sign", "type": "inherit", "from_template": "GST_TABULAR_A4A5_V1.sign"}
         ]
       }
     }
     ```

2. **Register in the registry**
   - In `GST_INVOICE_TEMPLATES`, add an entry:
     ```python
     "GST_MY_TEMPLATE_A4_V1": {
       "name": "My GST Template (A4)",
       "description": "Custom GST invoice variant.",
       "template_config": json.dumps(NEW_TEMPLATE),
       "requires_gst": True,
       "requires_hsn": True,
       "title": "Tax Invoice",
       "paper_sizes": "A4",  # or "A4,A5"
       "sort_order": 7
     }
     ```

3. **Deploy/restart backend**
   - On `GET /api/gst-invoice-templates`, the backend seeds new templates into the DB if missing.

4. **Verify in UI**
   - Open invoice PDF preview; your template should appear in the dropdown.
   - Optionally, open the page with `?template_id=<dbNumericId>&paper_size=A4` to preselect.

## Paper Size and Responsiveness

- Ensure `paper_sizes` matches keys in `layout.paper`.
- The base `GST_TABULAR_A4A5_V1` provides A4/A5 responsive columns; inherit it to keep layout consistent.

## API Reference (Quick)

- List templates: `GET /api/gst-invoice-templates`
- Get default: `GET /api/gst-invoice-templates/default`
- Get by DB id: `GET /api/gst-invoice-templates/{id}`
- Get config by string id: `GET /api/gst-invoice-templates/config/{template_id}`
- Set default: `POST /api/gst-invoice-templates/{id}/set-default`
- Generate PDF: `GET /api/invoices/{invoice_id}/pdf?template_id=<numeric>&paper_size=<A4|A5>`

## Tips

- Prefer inheritance (`type: inherit`) to keep styles and GST logic aligned with base templates.
- Keep `requires`, `validation`, `tax_logic` in sync with compliance expectations.
- For JSON-only authoring, consider a future admin upload endpoint; current pattern is Python dicts serialized via `json.dumps`.

## Related Docs

- `docs/GST_TEMPLATE_IMPLEMENTATION.md` — Implementation details and testing
- `docs/GST_TEMPLATE_ARCHITECTURE_AND_EXTENSIBILITY.md` — Architecture and extensibility overview
