/**
 * English translations for TapTrao server-side messages.
 * Keys are grouped by domain: routes.*, lc.*
 */
export const en: Record<string, string> = {
  // ── Auth & Session ──
  "routes.auth_required": "Authentication required",
  "routes.invalid_input": "Invalid input",
  "routes.account_exists": "An account with this email already exists",
  "routes.session_linked": "This session is already linked to an account. Please log in.",
  "routes.invalid_credentials": "Invalid email or password",
  "routes.logout_failed": "Logout failed",
  "routes.logged_out": "Logged out",
  "routes.valid_email_required": "Please enter a valid email address",
  "routes.password_reset_sent": "If an account with that email exists, we've sent a password reset link.",
  "routes.reset_link_invalid": "This reset link is invalid or has expired. Please request a new one.",
  "routes.password_reset_success": "Your password has been reset. You can now log in with your new password.",
  "routes.something_went_wrong": "Something went wrong. Please try again.",
  "routes.invalid_admin_password": "Invalid admin password",
  "routes.unauthorized": "Unauthorized",
  "routes.admin_only": "Admin only",

  // ── Token & Payments ──
  "routes.invalid_pack": "Invalid pack. Choose: shield_single, shield_3, shield_5, lc_standalone",
  "routes.stripe_not_configured": "Stripe is not configured",
  "routes.session_id_required": "session_id is required",
  "routes.payment_not_completed": "Payment not completed",
  "routes.insufficient_tokens": "Insufficient tokens",

  // ── Compliance ──
  "routes.compliance_fields_required": "commodityId, originId, and destinationId are required",

  // ── Lookups ──
  "routes.lookup_not_found": "Lookup not found",

  // ── LC Checks ──
  "routes.lc_invalid_request": "Invalid request",
  "routes.lc_recheck_limit": "Free re-checks used ({{limit}}). Additional re-checks cost 1 trade credit.",
  "routes.lc_credit_required": "LC checks require a trade credit. Purchase a trade pack to continue.",
  "routes.lc_check_not_found": "LC check not found",
  "routes.lc_case_not_found": "LC case not found",
  "routes.lc_case_no_lookup": "No LC case found for this lookup",
  "routes.lc_check_not_found_for_case": "LC check not found for case",
  "routes.lookupids_required": "lookupIds array required",
  "routes.channel_discrepancy_required": "channel and discrepancyCount required",

  // ── Trades ──
  "routes.trade_not_found": "Trade not found",
  "routes.invalid_status": "Invalid status",
  "routes.trade_not_found_no_changes": "Trade not found or no changes",

  // ── Templates ──
  "routes.template_fields_required": "name, commodityId, originIso2, destIso2, and snapshotJson are required",
  "routes.template_exists": "A template for this corridor already exists",
  "routes.template_not_found": "Template not found",
  "routes.not_your_template": "Not your template",
  "routes.commodity_no_longer_exists": "Commodity no longer exists",
  "routes.origin_dest_no_longer_exists": "Origin or destination no longer exists",
  "routes.template_not_found_or_not_yours": "Template not found or not yours",

  // ── Company Profile ──
  "routes.company_fields_required": "companyName, registeredAddress, and countryIso2 are required",
  "routes.profile_required": "Complete your company profile at /settings/profile before downloading TwinLog Trail records.",
  "routes.lookupid_or_result_required": "lookupId or complianceResult is required",

  // ── TwinLog / Verify ──
  "routes.reference_not_found": "Reference not found",
  "routes.pdf_generation_failed": "PDF generation failed",

  // ── Supplier Inbox ──
  "routes.lookupid_required": "lookupId is required",
  "routes.channel_required": "channel must be whatsapp, email, or link",
  "routes.supplier_request_not_found": "Supplier request not found",
  "routes.invalid_request_id": "Invalid request ID",
  "routes.not_authorized": "Not authorized",
  "routes.doc_type_required": "doc_type is required",
  "routes.invalid_doc_type": "Invalid document type for this request",
  "routes.no_file_uploaded": "No file uploaded",

  // ── Supplier Upload (public) ──
  "routes.upload_link_not_found": "Upload link not found",
  "routes.upload_link_expired": "Upload link has expired",

  // ── Upload Verification ──
  "routes.invalid_upload_id": "Invalid upload ID",
  "routes.upload_not_found": "Upload not found",
  "routes.verified_required": "verified (boolean) is required",

  // ── AI Scan ──
  "routes.ai_not_configured": "AI scanning not configured. Set ANTHROPIC_API_KEY to enable.",
  "routes.ai_scan_failed": "AI scan failed. Please try again or verify manually.",
  "routes.ai_scan_unparseable": "AI scan returned unparseable results. Please verify manually.",
  "routes.file_not_found_on_disk": "File not found on disk",

  // ── Alerts ──
  "routes.alert_fields_required": "commodityId and destIso2 are required",
  "routes.alert_free_limit": "Free limit reached. You can watch up to 3 corridors.",
  "routes.summary_required": "summary is required",

  // ── LC Extract ──
  "routes.rate_limit_extract": "Too many extraction requests. Please try again later.",
  "routes.invalid_document_type": "Invalid document type",

  // ── EUDR ──
  "routes.eudr_not_found": "EUDR record not found",

  // ── CBAM ──
  "routes.cbam_not_found": "CBAM record not found",

  // ── Promo Codes ──
  "routes.code_required": "code is required",
  "routes.code_already_exists": "Code already exists",
  "routes.invalid_promo_code": "Invalid promo code",
  "routes.promo_inactive": "This promo code is no longer active",
  "routes.promo_expired": "This promo code has expired",

  // ── Feature Requests ──
  "routes.not_found": "Not found",
  "routes.feature_paying_only": "Feature requests are available to paying customers",
  "routes.feature_title_min": "Title must be at least 3 characters",

  // ── Document Validation ──
  "routes.invalid_requirement_index": "Invalid requirement index",
  "routes.requirement_out_of_range": "Requirement index out of range",
  "routes.validation_not_found": "Validation not found",
  "routes.verdict_reason_required": "verdict and reason are required",
  "routes.validation_access_denied": "Validation not found or access denied",
  "routes.file_no_longer_available": "Original file no longer available",

  // ── API v1 ──
  "routes.api_unauthorized": "Invalid or missing API key. Use Authorization: Bearer tt_live_...",
  "routes.api_rate_limited": "Rate limit exceeded. Retry after {{retryAfter}}s.",
  "routes.api_insufficient_credits": "Insufficient credits",
  "routes.api_fields_required": "commodityId, originId, and destinationId are required",
  "routes.api_key_name_required": "name is required",
  "routes.api_key_not_found": "API key not found",

  // ═══════════════════════════════════════════
  // LC Engine — explanation strings
  // ═══════════════════════════════════════════

  // ── compareNames ──
  "lc.name_empty": "Document field is empty. Bank will reject — UCP 600 Art. 14(d) requires consistency across documents.",
  "lc.name_exact_match": "Exact match with LC terms.",
  "lc.name_case_insensitive": "Case-insensitive match — acceptable under UCP 600 Art. 14(d).",
  "lc.name_normalized_match": "Match after normalizing common business abbreviations (Ltd/Limited, &/and, SARL, etc.).",
  "lc.name_partial_match": "Partial match detected. Names are similar but not identical. Bank may query — review carefully per UCP 600 Art. 14(d).",
  "lc.name_mismatch": "Name MISMATCH. The name on this document does not match the LC beneficiary. Bank will almost certainly reject — UCP 600 Art. 14(d).",

  // ── compareAmounts ──
  "lc.amount_missing": "Invoice amount is missing or zero. Cannot verify against LC amount.",
  "lc.amount_exceeds": "Invoice amount ({{docAmount}}) exceeds LC amount ({{lcAmount}}). The amount drawn must not exceed the credit amount. Bank will reject.",
  "lc.amount_ok": "Invoice amount does not exceed LC amount.",

  // ── compareQuantities ──
  "lc.qty_not_specified": "Quantity not specified on this document.",
  "lc.qty_exact_match": "Quantity matches LC terms exactly.",
  "lc.qty_within_tolerance": "Quantity difference is {{diffPct}}% (within \u00b1{{tolerancePct}}% tolerance). ISBP 745 tolerance may apply for bulk goods.",
  "lc.qty_exceeds_tolerance": "Quantity difference is {{diffPct}}% (exceeds \u00b1{{tolerancePct}}% tolerance). Documents are inconsistent. Bank will reject.",

  // ── compareGoodsDescription ──
  "lc.goods_missing": "Goods description is missing on one document. Cannot verify consistency.",
  "lc.goods_exact_match": "Goods descriptions match exactly across documents.",
  "lc.goods_substantial": "Goods descriptions substantially correspond across documents.",
  "lc.goods_partial": "Goods descriptions partially match. Review wording carefully — UCP 600 Art. 14(d) requires data must not conflict.",
  "lc.goods_mismatch": "Goods descriptions do not match across documents. Bank will reject — UCP 600 Art. 14(d).",

  // ── compareCountryOfOrigin ──
  "lc.country_missing": "Country of origin is missing on one document.",
  "lc.country_match": "Country of origin matches across documents.",
  "lc.country_mismatch": "Country of origin MISMATCH across documents. Bank will reject — UCP 600 Art. 14(d).",

  // ── comparePortNames ──
  "lc.port_missing": "Port name is missing on one document.",
  "lc.port_match": "Port names match across documents.",
  "lc.port_partial": "Port names partially match. Verify consistency across documents.",
  "lc.port_mismatch": "Port names do not match across documents. Bank will reject — UCP 600 Art. 14(d).",

  // ── compareNumericWithTolerance ──
  "lc.numeric_both_zero": "Both values are zero or not specified.",
  "lc.numeric_one_missing": "One value is missing or zero. Cannot compare.",
  "lc.numeric_exact_match": "Values match exactly across documents.",
  "lc.numeric_within_tolerance": "Difference is {{diffPct}}% (within \u00b1{{tolerancePct}}% tolerance). Check if this variance is acceptable.",
  "lc.numeric_exceeds_tolerance": "Difference is {{diffPct}}% (exceeds \u00b1{{tolerancePct}}% tolerance). Documents are inconsistent — bank will reject.",

  // ── Insurance validations ──
  "lc.insurance_coverage_ok": "Insurance coverage ({{coverageAmt}}) meets the minimum {{requiredPct}}% requirement{{cifCipSuffix}}.",
  "lc.insurance_coverage_below": "Insurance coverage ({{coverageAmt}}) is BELOW the minimum {{requiredPct}}% of LC amount ({{requiredAmount}}){{cifCipSuffix}}. Bank will reject.",
  "lc.insurance_currency_mismatch": "Insurance currency ({{insCurrency}}) does not match LC currency ({{lcCurrency}}). Bank will reject.",
  "lc.insurance_currency_match": "Insurance currency matches LC terms.",
  "lc.cif_cip_suffix": " for CIF/CIP terms",
  "lc.cif_cip_required_suffix": " required for CIF/CIP terms",

  // ── HS Code validations ──
  "lc.hs_heading_match": "HS code heading matches LC terms.",
  "lc.hs_heading_mismatch_eudr": "EUDR HS heading ({{docHs}}) does not match LC HS heading ({{lcHs}}). Product classification mismatch.",
  "lc.hs_heading_mismatch_cbam": "CBAM HS heading ({{docHs}}) does not match LC HS heading ({{lcHs}}). Product classification mismatch.",

  // ── Cross-document: Invoice vs B/L ──
  "lc.bl_goods_relaxed": "B/L goods description differs from invoice. Note: per UCP 600 Art. 20(a)(vi), B/L may use general terms. Review if descriptions conflict.",

  // ── Cross-document: Invoice vs Packing List ──
  "lc.packages_match_inv_pl": "Number of packages matches between invoice and packing list.",
  "lc.packages_differ_inv_pl": "Number of packages differs between invoice and packing list. Packing list is the authoritative source — review.",

  // ── Cross-document: B/L vs Packing List ──
  "lc.packages_match_bl_pl": "Number of packages matches between B/L and packing list.",
  "lc.packages_mismatch_bl_pl": "Package count mismatch: B/L shows {{blPackages}}, packing list shows {{plPackages}}. Bank will reject — UCP 600 Art. 14(d).",

  // ── Cross-document: Invoice vs Insurance ──
  "lc.cross_currency_mismatch_inv_ins": "Invoice currency ({{invCurrency}}) does not match insurance currency ({{insCurrency}}). Bank will reject.",
  "lc.cross_currency_match_inv_ins": "Currency matches between invoice and insurance certificate.",
  "lc.coverage_covers_invoice": "Insurance coverage ({{coverageAmt}}) covers the invoice amount ({{invAmount}}).",
  "lc.coverage_below_invoice": "Insurance coverage ({{coverageAmt}}) is LESS than invoice amount ({{invAmount}}). Goods are under-insured.",

  // ── Cross-document: B/L vs Weight ──
  "lc.vessel_match": "Vessel name matches between B/L and weight certificate.",
  "lc.vessel_mismatch": "Vessel name mismatch: B/L shows \"{{blVessel}}\", weight certificate shows \"{{wtVessel}}\". Bank will reject.",
  "lc.bl_weight_goods_relaxed": "Goods description differs between B/L and weight certificate. B/L may use general terms — review if descriptions conflict.",

  // ── Cross-document: EUDR vs Traceability ──
  "lc.gps_match": "GPS coordinates match between EUDR declaration and traceability certificate.",
  "lc.gps_partial": "GPS coordinates partially overlap. Verify geolocation data is consistent.",
  "lc.gps_mismatch": "GPS coordinates do NOT match between EUDR declaration and traceability certificate. Geolocation data is inconsistent.",
  "lc.plots_match": "Plot identifiers match exactly between EUDR declaration and traceability certificate.",
  "lc.plots_partial": "Plot identifiers partially overlap ({{intersection}} common out of {{eudrSize}} EUDR / {{traceSize}} Traceability). Verify all plots are accounted for.",
  "lc.plots_mismatch": "Plot identifiers have NO overlap between EUDR declaration and traceability certificate. Data is inconsistent.",

  // ── runLcCrossCheck main ──
  "lc.lc_ref_empty": "LC reference number is empty. Ensure this is populated for traceability.",
  "lc.currency_mismatch": "Invoice currency ({{invCurrency}}) does not match LC currency ({{lcCurrency}}). Bank will reject.",
  "lc.currency_match": "Currency matches LC terms.",
  "lc.goods_invoice_exact": "Goods description on invoice corresponds exactly with LC.",
  "lc.goods_invoice_substantial": "Goods description on invoice substantially corresponds with LC terms.",
  "lc.goods_invoice_partial": "Goods description partially matches LC terms. Invoice must correspond with LC — review wording carefully.",
  "lc.goods_invoice_mismatch": "Goods description on invoice does not correspond with LC terms. Bank will reject — Art. 18(c) requires the invoice description to correspond with the credit.",
  "lc.incoterms_mismatch": "Invoice Incoterms ({{docIncoterms}}) do not match LC Incoterms ({{lcIncoterms}}). This is a critical discrepancy — bank will reject.",
  "lc.incoterms_match": "Incoterms on invoice match LC terms.",

  // ── B/L specific ──
  "lc.port_loading_match": "Port of loading matches LC terms.",
  "lc.port_loading_partial": "Port of loading partially matches. Verify the port name is consistent with LC terms.",
  "lc.port_loading_mismatch": "Port of loading on B/L does not match LC. Bank will reject.",
  "lc.port_discharge_match": "Port of discharge matches LC terms.",
  "lc.port_discharge_partial": "Port of discharge partially matches. Verify consistency.",
  "lc.port_discharge_mismatch": "Port of discharge on B/L does not match LC. Bank will reject.",
  "lc.shipment_date_ok": "B/L shipped date is on or before LC latest shipment date.",
  "lc.shipment_date_late": "B/L shipped date ({{shippedDate}}) is AFTER LC latest shipment date ({{latestDate}}). Late shipment — bank will reject.",
  "lc.presentation_exceeded": "Presentation deadline exceeded. {{days}} days have passed since B/L date. UCP 600 Art. 14(c) requires presentation within 21 calendar days of shipment.",
  "lc.presentation_ok": "{{days}} days since shipment — within 21-day presentation period.",
  "lc.bl_number_empty": "B/L number is empty. Ensure this reference is populated for document tracking.",

  // ── Certificate of Origin ──
  "lc.coo_origin_match": "Country of origin on CoO matches LC.",
  "lc.coo_origin_mismatch": "Country of origin on CoO does not match LC. Bank will reject.",

  // ── CHED Reference ──
  "lc.ched_format_invalid": "CHED reference format appears incorrect. Expected: GBCHDYYYY.NNNNNNN (e.g. GBCHD2026.0012345).",
  "lc.ched_format_valid": "CHED reference format is valid.",

  // ── generateCorrectionEmail ──
  "lc.correction_subject": "Subject: URGENT \u2014 Document Discrepancies Found \u2014 Please Amend",
  "lc.correction_greeting": "Dear {{beneficiary}},",
  "lc.correction_intro": "We have reviewed the documents submitted against LC reference {{lcRef}} and found the following critical discrepancies that will cause the bank to reject the presentation:",
  "lc.correction_item_doc_shows": "   Your document shows: {{value}}",
  "lc.correction_item_lc_requires": "   The LC requires: {{value}}",
  "lc.correction_item_rule": "   Rule: {{rule}}",
  "lc.correction_item_amend": "   Please amend and reissue.",
  "lc.correction_closing": "Please correct these discrepancies and resubmit the amended documents as soon as possible.",
  "lc.correction_regards": "Best regards",
  "lc.correction_wa_header": "*URGENT \u2014 Document Discrepancies*",
  "lc.correction_wa_shows": "   Shows: {{value}}",
  "lc.correction_wa_lc_requires": "   LC requires: {{value}}",
  "lc.correction_wa_amend": "   _Please amend and reissue._",
  "lc.correction_wa_closing": "Please correct and resend ASAP.",
};
