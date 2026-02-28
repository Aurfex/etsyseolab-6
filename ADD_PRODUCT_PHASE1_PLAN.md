# Add Product Rebuild — Phase 1 (Isolated)

## Goal
Rebuild only `Add Product` safely, without touching other modules.

## Scope (Phase 1)
1. Make backend create flow production-ready:
   - `create_listing` action in `/api/etsy-proxy`
   - `upload_image` action in `/api/etsy-proxy`
2. Add image upload guardrails:
   - max 20 images
   - normalized safe filenames before upload
3. Add required alt-text pipeline:
   - each uploaded image must have alt text
   - editable in Add Product UI before publish
4. Keep all changes isolated to Add Product paths only.

## Non-Goals (for now)
- No changes to SEO Optimizer module
- No changes to Pricing module
- No global refactors

## Deliverables
- Working Add Product publish to Etsy (listing + images)
- Filenames normalized and stable
- Alt text included for each image upload
- Basic validation + clear toasts for failures

## Safety
- Work in branch: `feature/add-product-rebuild`
- Merge to `main` only after manual test passes

## Test Checklist
- [ ] Create listing with required fields
- [ ] Upload 1..20 images
- [ ] Verify Etsy receives images with clean names
- [ ] Verify Etsy receives alt text for each image
- [ ] Verify errors are shown clearly on bad payloads
