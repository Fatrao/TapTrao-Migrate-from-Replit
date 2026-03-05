/**
 * French translations for TapTrao server-side messages.
 * Keys are grouped by domain: routes.*, lc.*
 */
export const fr: Record<string, string> = {
  // ── Auth & Session ──
  "routes.auth_required": "Authentification requise",
  "routes.invalid_input": "Saisie invalide",
  "routes.account_exists": "Un compte avec cet e-mail existe d\u00e9j\u00e0",
  "routes.session_linked": "Cette session est d\u00e9j\u00e0 li\u00e9e \u00e0 un compte. Veuillez vous connecter.",
  "routes.invalid_credentials": "Adresse e-mail ou mot de passe incorrect",
  "routes.logout_failed": "\u00c9chec de la d\u00e9connexion",
  "routes.logged_out": "D\u00e9connect\u00e9",
  "routes.valid_email_required": "Veuillez saisir une adresse e-mail valide",
  "routes.password_reset_sent": "Si un compte avec cet e-mail existe, nous avons envoy\u00e9 un lien de r\u00e9initialisation du mot de passe.",
  "routes.reset_link_invalid": "Ce lien de r\u00e9initialisation est invalide ou a expir\u00e9. Veuillez en demander un nouveau.",
  "routes.password_reset_success": "Votre mot de passe a \u00e9t\u00e9 r\u00e9initialis\u00e9. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
  "routes.something_went_wrong": "Un probl\u00e8me est survenu. Veuillez r\u00e9essayer.",
  "routes.invalid_admin_password": "Mot de passe administrateur invalide",
  "routes.unauthorized": "Non autoris\u00e9",
  "routes.admin_only": "R\u00e9serv\u00e9 aux administrateurs",

  // ── Token & Payments ──
  "routes.invalid_pack": "Pack invalide. Choisissez : shield_single, shield_3, shield_5, lc_standalone",
  "routes.stripe_not_configured": "Stripe n\u2019est pas configur\u00e9",
  "routes.session_id_required": "session_id est requis",
  "routes.payment_not_completed": "Paiement non finalis\u00e9",
  "routes.insufficient_tokens": "Cr\u00e9dits insuffisants",

  // ── Compliance ──
  "routes.compliance_fields_required": "commodityId, originId et destinationId sont requis",

  // ── Lookups ──
  "routes.lookup_not_found": "Recherche introuvable",

  // ── LC Checks ──
  "routes.lc_invalid_request": "Requ\u00eate invalide",
  "routes.lc_recheck_limit": "Rev\u00e9rifications gratuites \u00e9puis\u00e9es ({{limit}}). Les rev\u00e9rifications suppl\u00e9mentaires co\u00fbtent 1 cr\u00e9dit.",
  "routes.lc_credit_required": "Les v\u00e9rifications LC n\u00e9cessitent un cr\u00e9dit. Achetez un pack pour continuer.",
  "routes.lc_check_not_found": "V\u00e9rification LC introuvable",
  "routes.lc_case_not_found": "Dossier LC introuvable",
  "routes.lc_case_no_lookup": "Aucun dossier LC trouv\u00e9 pour cette recherche",
  "routes.lc_check_not_found_for_case": "V\u00e9rification LC introuvable pour ce dossier",
  "routes.lookupids_required": "Le tableau lookupIds est requis",
  "routes.channel_discrepancy_required": "channel et discrepancyCount sont requis",

  // ── Trades ──
  "routes.trade_not_found": "Op\u00e9ration introuvable",
  "routes.invalid_status": "Statut invalide",
  "routes.trade_not_found_no_changes": "Op\u00e9ration introuvable ou aucune modification",

  // ── Templates ──
  "routes.template_fields_required": "name, commodityId, originIso2, destIso2 et snapshotJson sont requis",
  "routes.template_exists": "Un mod\u00e8le pour ce corridor existe d\u00e9j\u00e0",
  "routes.template_not_found": "Mod\u00e8le introuvable",
  "routes.not_your_template": "Ce mod\u00e8le ne vous appartient pas",
  "routes.commodity_no_longer_exists": "La marchandise n\u2019existe plus",
  "routes.origin_dest_no_longer_exists": "L\u2019origine ou la destination n\u2019existe plus",
  "routes.template_not_found_or_not_yours": "Mod\u00e8le introuvable ou ne vous appartient pas",

  // ── Company Profile ──
  "routes.company_fields_required": "companyName, registeredAddress et countryIso2 sont requis",
  "routes.profile_required": "Veuillez compl\u00e9ter votre profil d\u2019entreprise dans /settings/profile avant de t\u00e9l\u00e9charger les documents TwinLog Trail.",
  "routes.lookupid_or_result_required": "lookupId ou complianceResult est requis",

  // ── TwinLog / Verify ──
  "routes.reference_not_found": "R\u00e9f\u00e9rence introuvable",
  "routes.pdf_generation_failed": "\u00c9chec de la g\u00e9n\u00e9ration du PDF",

  // ── Supplier Inbox ──
  "routes.lookupid_required": "lookupId est requis",
  "routes.channel_required": "Le canal doit \u00eatre whatsapp, email ou link",
  "routes.supplier_request_not_found": "Demande fournisseur introuvable",
  "routes.invalid_request_id": "Identifiant de demande invalide",
  "routes.not_authorized": "Non autoris\u00e9",
  "routes.doc_type_required": "doc_type est requis",
  "routes.invalid_doc_type": "Type de document invalide pour cette demande",
  "routes.no_file_uploaded": "Aucun fichier t\u00e9l\u00e9charg\u00e9",

  // ── Supplier Upload (public) ──
  "routes.upload_link_not_found": "Lien de t\u00e9l\u00e9chargement introuvable",
  "routes.upload_link_expired": "Le lien de t\u00e9l\u00e9chargement a expir\u00e9",

  // ── Upload Verification ──
  "routes.invalid_upload_id": "Identifiant de t\u00e9l\u00e9chargement invalide",
  "routes.upload_not_found": "T\u00e9l\u00e9chargement introuvable",
  "routes.verified_required": "verified (bool\u00e9en) est requis",

  // ── AI Scan ──
  "routes.ai_not_configured": "L\u2019analyse IA n\u2019est pas configur\u00e9e. D\u00e9finissez ANTHROPIC_API_KEY pour l\u2019activer.",
  "routes.ai_scan_failed": "L\u2019analyse IA a \u00e9chou\u00e9. Veuillez r\u00e9essayer ou v\u00e9rifier manuellement.",
  "routes.ai_scan_unparseable": "L\u2019analyse IA a renvoy\u00e9 des r\u00e9sultats illisibles. Veuillez v\u00e9rifier manuellement.",
  "routes.file_not_found_on_disk": "Fichier introuvable sur le disque",

  // ── Alerts ──
  "routes.alert_fields_required": "commodityId et destIso2 sont requis",
  "routes.alert_free_limit": "Limite gratuite atteinte. Vous pouvez surveiller jusqu\u2019\u00e0 3 corridors.",
  "routes.summary_required": "Le r\u00e9sum\u00e9 est requis",

  // ── LC Extract ──
  "routes.rate_limit_extract": "Trop de demandes d\u2019extraction. Veuillez r\u00e9essayer plus tard.",
  "routes.invalid_document_type": "Type de document invalide",

  // ── EUDR ──
  "routes.eudr_not_found": "Enregistrement EUDR introuvable",

  // ── CBAM ──
  "routes.cbam_not_found": "Enregistrement CBAM introuvable",

  // ── Promo Codes ──
  "routes.code_required": "Le code est requis",
  "routes.code_already_exists": "Ce code existe d\u00e9j\u00e0",
  "routes.invalid_promo_code": "Code promotionnel invalide",
  "routes.promo_inactive": "Ce code promotionnel n\u2019est plus actif",
  "routes.promo_expired": "Ce code promotionnel a expir\u00e9",

  "routes.not_found": "Introuvable",

  // ── Feature Requests ──
  "routes.feature_paying_only": "Les demandes de fonctionnalit\u00e9s sont r\u00e9serv\u00e9es aux clients payants",
  "routes.feature_title_min": "Le titre doit comporter au moins 3 caract\u00e8res",

  // ── Document Validation ──
  "routes.invalid_requirement_index": "Index d\u2019exigence invalide",
  "routes.requirement_out_of_range": "Index d\u2019exigence hors limites",
  "routes.validation_not_found": "Validation introuvable",
  "routes.verdict_reason_required": "Le verdict et le motif sont requis",
  "routes.validation_access_denied": "Validation introuvable ou acc\u00e8s refus\u00e9",
  "routes.file_no_longer_available": "Le fichier original n\u2019est plus disponible",

  // ── API v1 ──
  "routes.api_unauthorized": "Cl\u00e9 API invalide ou manquante. Utilisez Authorization: Bearer tt_live_...",
  "routes.api_rate_limited": "Limite de requ\u00eates d\u00e9pass\u00e9e. R\u00e9essayez dans {{retryAfter}} s.",
  "routes.api_insufficient_credits": "Cr\u00e9dits insuffisants",
  "routes.api_fields_required": "commodityId, originId et destinationId sont requis",
  "routes.api_key_name_required": "Le nom est requis",
  "routes.api_key_not_found": "Cl\u00e9 API introuvable",

  // ═══════════════════════════════════════════
  // LC Engine — textes d'explication
  // ═══════════════════════════════════════════

  // ── compareNames ──
  "lc.name_empty": "Champ du document vide. La banque rejettera \u2014 UCP 600 Art. 14(d) exige la coh\u00e9rence entre les documents.",
  "lc.name_exact_match": "Correspondance exacte avec les termes du cr\u00e9dit documentaire.",
  "lc.name_case_insensitive": "Correspondance insensible \u00e0 la casse \u2014 acceptable selon UCP 600 Art. 14(d).",
  "lc.name_normalized_match": "Correspondance apr\u00e8s normalisation des abr\u00e9viations courantes (Ltd/Limited, &/and, SARL, etc.).",
  "lc.name_partial_match": "Correspondance partielle d\u00e9tect\u00e9e. Les noms sont similaires mais pas identiques. La banque peut demander des pr\u00e9cisions \u2014 v\u00e9rifiez selon UCP 600 Art. 14(d).",
  "lc.name_mismatch": "NON-CONCORDANCE du nom. Le nom sur ce document ne correspond pas au b\u00e9n\u00e9ficiaire du cr\u00e9dit documentaire. La banque rejettera presque certainement \u2014 UCP 600 Art. 14(d).",

  // ── compareAmounts ──
  "lc.amount_missing": "Le montant de la facture est manquant ou nul. Impossible de v\u00e9rifier par rapport au montant du cr\u00e9dit documentaire.",
  "lc.amount_exceeds": "Le montant de la facture ({{docAmount}}) d\u00e9passe le montant du cr\u00e9dit documentaire ({{lcAmount}}). Le montant tir\u00e9 ne doit pas d\u00e9passer le montant du cr\u00e9dit. La banque rejettera.",
  "lc.amount_ok": "Le montant de la facture ne d\u00e9passe pas le montant du cr\u00e9dit documentaire.",

  // ── compareQuantities ──
  "lc.qty_not_specified": "Quantit\u00e9 non sp\u00e9cifi\u00e9e sur ce document.",
  "lc.qty_exact_match": "La quantit\u00e9 correspond exactement aux termes du cr\u00e9dit documentaire.",
  "lc.qty_within_tolerance": "L\u2019\u00e9cart de quantit\u00e9 est de {{diffPct}} % (dans la tol\u00e9rance de \u00b1{{tolerancePct}} %). La tol\u00e9rance ISBP 745 peut s\u2019appliquer aux marchandises en vrac.",
  "lc.qty_exceeds_tolerance": "L\u2019\u00e9cart de quantit\u00e9 est de {{diffPct}} % (d\u00e9passe la tol\u00e9rance de \u00b1{{tolerancePct}} %). Les documents sont incoh\u00e9rents. La banque rejettera.",

  // ── compareGoodsDescription ──
  "lc.goods_missing": "La description des marchandises est manquante sur un document. Impossible de v\u00e9rifier la coh\u00e9rence.",
  "lc.goods_exact_match": "Les descriptions des marchandises correspondent exactement entre les documents.",
  "lc.goods_substantial": "Les descriptions des marchandises correspondent substantiellement entre les documents.",
  "lc.goods_partial": "Les descriptions des marchandises correspondent partiellement. V\u00e9rifiez attentivement la formulation \u2014 UCP 600 Art. 14(d) exige que les donn\u00e9es ne soient pas contradictoires.",
  "lc.goods_mismatch": "Les descriptions des marchandises ne correspondent pas entre les documents. La banque rejettera \u2014 UCP 600 Art. 14(d).",

  // ── compareCountryOfOrigin ──
  "lc.country_missing": "Le pays d\u2019origine est manquant sur un document.",
  "lc.country_match": "Le pays d\u2019origine correspond entre les documents.",
  "lc.country_mismatch": "NON-CONCORDANCE du pays d\u2019origine entre les documents. La banque rejettera \u2014 UCP 600 Art. 14(d).",

  // ── comparePortNames ──
  "lc.port_missing": "Le nom du port est manquant sur un document.",
  "lc.port_match": "Les noms de port correspondent entre les documents.",
  "lc.port_partial": "Les noms de port correspondent partiellement. V\u00e9rifiez la coh\u00e9rence entre les documents.",
  "lc.port_mismatch": "Les noms de port ne correspondent pas entre les documents. La banque rejettera \u2014 UCP 600 Art. 14(d).",

  // ── compareNumericWithTolerance ──
  "lc.numeric_both_zero": "Les deux valeurs sont nulles ou non sp\u00e9cifi\u00e9es.",
  "lc.numeric_one_missing": "Une valeur est manquante ou nulle. Impossible de comparer.",
  "lc.numeric_exact_match": "Les valeurs correspondent exactement entre les documents.",
  "lc.numeric_within_tolerance": "L\u2019\u00e9cart est de {{diffPct}} % (dans la tol\u00e9rance de \u00b1{{tolerancePct}} %). V\u00e9rifiez si cette variance est acceptable.",
  "lc.numeric_exceeds_tolerance": "L\u2019\u00e9cart est de {{diffPct}} % (d\u00e9passe la tol\u00e9rance de \u00b1{{tolerancePct}} %). Les documents sont incoh\u00e9rents \u2014 la banque rejettera.",

  // ── Insurance validations ──
  "lc.insurance_coverage_ok": "La couverture d\u2019assurance ({{coverageAmt}}) atteint le minimum de {{requiredPct}} % requis{{cifCipSuffix}}.",
  "lc.insurance_coverage_below": "La couverture d\u2019assurance ({{coverageAmt}}) est EN DESSOUS du minimum de {{requiredPct}} % du montant du cr\u00e9dit documentaire ({{requiredAmount}}){{cifCipSuffix}}. La banque rejettera.",
  "lc.insurance_currency_mismatch": "La devise d\u2019assurance ({{insCurrency}}) ne correspond pas \u00e0 la devise du cr\u00e9dit documentaire ({{lcCurrency}}). La banque rejettera.",
  "lc.insurance_currency_match": "La devise d\u2019assurance correspond aux termes du cr\u00e9dit documentaire.",
  "lc.cif_cip_suffix": " pour les conditions CIF/CIP",
  "lc.cif_cip_required_suffix": " requis pour les conditions CIF/CIP",

  // ── HS Code validations ──
  "lc.hs_heading_match": "La position SH correspond aux termes du cr\u00e9dit documentaire.",
  "lc.hs_heading_mismatch_eudr": "La position SH EUDR ({{docHs}}) ne correspond pas \u00e0 la position SH du cr\u00e9dit documentaire ({{lcHs}}). Erreur de classification du produit.",
  "lc.hs_heading_mismatch_cbam": "La position SH CBAM ({{docHs}}) ne correspond pas \u00e0 la position SH du cr\u00e9dit documentaire ({{lcHs}}). Erreur de classification du produit.",

  // ── Cross-document: Invoice vs B/L ──
  "lc.bl_goods_relaxed": "La description des marchandises sur le B/L diff\u00e8re de la facture. Note : selon UCP 600 Art. 20(a)(vi), le B/L peut utiliser des termes g\u00e9n\u00e9raux. V\u00e9rifiez s\u2019il y a conflit.",

  // ── Cross-document: Invoice vs Packing List ──
  "lc.packages_match_inv_pl": "Le nombre de colis correspond entre la facture et la liste de colisage.",
  "lc.packages_differ_inv_pl": "Le nombre de colis diff\u00e8re entre la facture et la liste de colisage. La liste de colisage fait r\u00e9f\u00e9rence \u2014 \u00e0 v\u00e9rifier.",

  // ── Cross-document: B/L vs Packing List ──
  "lc.packages_match_bl_pl": "Le nombre de colis correspond entre le B/L et la liste de colisage.",
  "lc.packages_mismatch_bl_pl": "Non-concordance du nombre de colis : le B/L indique {{blPackages}}, la liste de colisage indique {{plPackages}}. La banque rejettera \u2014 UCP 600 Art. 14(d).",

  // ── Cross-document: Invoice vs Insurance ──
  "lc.cross_currency_mismatch_inv_ins": "La devise de la facture ({{invCurrency}}) ne correspond pas \u00e0 la devise de l\u2019assurance ({{insCurrency}}). La banque rejettera.",
  "lc.cross_currency_match_inv_ins": "La devise correspond entre la facture et le certificat d\u2019assurance.",
  "lc.coverage_covers_invoice": "La couverture d\u2019assurance ({{coverageAmt}}) couvre le montant de la facture ({{invAmount}}).",
  "lc.coverage_below_invoice": "La couverture d\u2019assurance ({{coverageAmt}}) est INF\u00c9RIEURE au montant de la facture ({{invAmount}}). Les marchandises sont sous-assur\u00e9es.",

  // ── Cross-document: B/L vs Weight ──
  "lc.vessel_match": "Le nom du navire correspond entre le B/L et le certificat de poids.",
  "lc.vessel_mismatch": "Non-concordance du nom du navire : le B/L indique \u00ab {{blVessel}} \u00bb, le certificat de poids indique \u00ab {{wtVessel}} \u00bb. La banque rejettera.",
  "lc.bl_weight_goods_relaxed": "La description des marchandises diff\u00e8re entre le B/L et le certificat de poids. Le B/L peut utiliser des termes g\u00e9n\u00e9raux \u2014 v\u00e9rifiez s\u2019il y a conflit.",

  // ── Cross-document: EUDR vs Traceability ──
  "lc.gps_match": "Les coordonn\u00e9es GPS correspondent entre la d\u00e9claration EUDR et le certificat de tra\u00e7abilit\u00e9.",
  "lc.gps_partial": "Les coordonn\u00e9es GPS se chevauchent partiellement. V\u00e9rifiez la coh\u00e9rence des donn\u00e9es de g\u00e9olocalisation.",
  "lc.gps_mismatch": "Les coordonn\u00e9es GPS NE correspondent PAS entre la d\u00e9claration EUDR et le certificat de tra\u00e7abilit\u00e9. Donn\u00e9es de g\u00e9olocalisation incoh\u00e9rentes.",
  "lc.plots_match": "Les identifiants de parcelle correspondent exactement entre la d\u00e9claration EUDR et le certificat de tra\u00e7abilit\u00e9.",
  "lc.plots_partial": "Les identifiants de parcelle se chevauchent partiellement ({{intersection}} en commun sur {{eudrSize}} EUDR / {{traceSize}} Tra\u00e7abilit\u00e9). V\u00e9rifiez que toutes les parcelles sont prises en compte.",
  "lc.plots_mismatch": "Les identifiants de parcelle n\u2019ont AUCUN chevauchement entre la d\u00e9claration EUDR et le certificat de tra\u00e7abilit\u00e9. Donn\u00e9es incoh\u00e9rentes.",

  // ── runLcCrossCheck main ──
  "lc.lc_ref_empty": "Le num\u00e9ro de r\u00e9f\u00e9rence du cr\u00e9dit documentaire est vide. Assurez-vous qu\u2019il est renseign\u00e9 pour la tra\u00e7abilit\u00e9.",
  "lc.currency_mismatch": "La devise de la facture ({{invCurrency}}) ne correspond pas \u00e0 la devise du cr\u00e9dit documentaire ({{lcCurrency}}). La banque rejettera.",
  "lc.currency_match": "La devise correspond aux termes du cr\u00e9dit documentaire.",
  "lc.goods_invoice_exact": "La description des marchandises sur la facture correspond exactement au cr\u00e9dit documentaire.",
  "lc.goods_invoice_substantial": "La description des marchandises sur la facture correspond substantiellement aux termes du cr\u00e9dit documentaire.",
  "lc.goods_invoice_partial": "La description des marchandises correspond partiellement aux termes du cr\u00e9dit documentaire. La facture doit correspondre au cr\u00e9dit \u2014 v\u00e9rifiez attentivement la formulation.",
  "lc.goods_invoice_mismatch": "La description des marchandises sur la facture ne correspond pas aux termes du cr\u00e9dit documentaire. La banque rejettera \u2014 Art. 18(c) exige que la description de la facture corresponde au cr\u00e9dit.",
  "lc.incoterms_mismatch": "Les Incoterms de la facture ({{docIncoterms}}) ne correspondent pas aux Incoterms du cr\u00e9dit documentaire ({{lcIncoterms}}). C\u2019est une divergence critique \u2014 la banque rejettera.",
  "lc.incoterms_match": "Les Incoterms de la facture correspondent aux termes du cr\u00e9dit documentaire.",

  // ── B/L specific ──
  "lc.port_loading_match": "Le port de chargement correspond aux termes du cr\u00e9dit documentaire.",
  "lc.port_loading_partial": "Le port de chargement correspond partiellement. V\u00e9rifiez la coh\u00e9rence avec les termes du cr\u00e9dit documentaire.",
  "lc.port_loading_mismatch": "Le port de chargement sur le B/L ne correspond pas au cr\u00e9dit documentaire. La banque rejettera.",
  "lc.port_discharge_match": "Le port de d\u00e9chargement correspond aux termes du cr\u00e9dit documentaire.",
  "lc.port_discharge_partial": "Le port de d\u00e9chargement correspond partiellement. V\u00e9rifiez la coh\u00e9rence.",
  "lc.port_discharge_mismatch": "Le port de d\u00e9chargement sur le B/L ne correspond pas au cr\u00e9dit documentaire. La banque rejettera.",
  "lc.shipment_date_ok": "La date d\u2019exp\u00e9dition sur le B/L est ant\u00e9rieure ou \u00e9gale \u00e0 la date limite d\u2019exp\u00e9dition du cr\u00e9dit documentaire.",
  "lc.shipment_date_late": "La date d\u2019exp\u00e9dition du B/L ({{shippedDate}}) est POST\u00c9RIEURE \u00e0 la date limite d\u2019exp\u00e9dition du cr\u00e9dit documentaire ({{latestDate}}). Exp\u00e9dition tardive \u2014 la banque rejettera.",
  "lc.presentation_exceeded": "D\u00e9lai de pr\u00e9sentation d\u00e9pass\u00e9. {{days}} jours se sont \u00e9coul\u00e9s depuis la date du B/L. UCP 600 Art. 14(c) exige la pr\u00e9sentation dans les 21 jours calendaires suivant l\u2019exp\u00e9dition.",
  "lc.presentation_ok": "{{days}} jours depuis l\u2019exp\u00e9dition \u2014 dans le d\u00e9lai de pr\u00e9sentation de 21 jours.",
  "lc.bl_number_empty": "Le num\u00e9ro de B/L est vide. Assurez-vous que cette r\u00e9f\u00e9rence est renseign\u00e9e pour le suivi des documents.",

  // ── Certificate of Origin ──
  "lc.coo_origin_match": "Le pays d\u2019origine sur le certificat d\u2019origine correspond au cr\u00e9dit documentaire.",
  "lc.coo_origin_mismatch": "Le pays d\u2019origine sur le certificat d\u2019origine ne correspond pas au cr\u00e9dit documentaire. La banque rejettera.",

  // ── CHED Reference ──
  "lc.ched_format_invalid": "Le format de la r\u00e9f\u00e9rence CHED semble incorrect. Format attendu : GBCHDYYYY.NNNNNNN (ex. GBCHD2026.0012345).",
  "lc.ched_format_valid": "Le format de la r\u00e9f\u00e9rence CHED est valide.",

  // ── generateCorrectionEmail ──
  "lc.correction_subject": "Objet : URGENT \u2014 Divergences documentaires d\u00e9tect\u00e9es \u2014 Veuillez corriger",
  "lc.correction_greeting": "Cher/Ch\u00e8re {{beneficiary}},",
  "lc.correction_intro": "Nous avons examin\u00e9 les documents soumis pour le cr\u00e9dit documentaire r\u00e9f\u00e9rence {{lcRef}} et avons trouv\u00e9 les divergences critiques suivantes qui entra\u00eeneront le rejet par la banque :",
  "lc.correction_item_doc_shows": "   Votre document indique : {{value}}",
  "lc.correction_item_lc_requires": "   Le cr\u00e9dit documentaire exige : {{value}}",
  "lc.correction_item_rule": "   R\u00e8gle : {{rule}}",
  "lc.correction_item_amend": "   Veuillez corriger et r\u00e9\u00e9mettre.",
  "lc.correction_closing": "Veuillez corriger ces divergences et soumettre \u00e0 nouveau les documents modifi\u00e9s d\u00e8s que possible.",
  "lc.correction_regards": "Cordialement",
  "lc.correction_wa_header": "*URGENT \u2014 Divergences documentaires*",
  "lc.correction_wa_shows": "   Indique : {{value}}",
  "lc.correction_wa_lc_requires": "   Le cr\u00e9dit exige : {{value}}",
  "lc.correction_wa_amend": "   _Veuillez corriger et r\u00e9\u00e9mettre._",
  "lc.correction_wa_closing": "Veuillez corriger et renvoyer au plus vite.",
};
