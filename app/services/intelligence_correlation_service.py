def _safe_number(value, default=0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def correlate_intelligence(normalized_results):
    normalized_results = normalized_results if isinstance(normalized_results, list) else []
    provider_status = {}
    positive_providers = []
    negative_providers = []
    available_providers = []
    evidence_items = []

    for result in normalized_results:
        if not isinstance(result, dict):
            continue
        provider = result.get("provider", "Unknown")
        available = bool(result.get("available", False))
        positive_evidence = bool(result.get("positive_evidence", False))
        risk_signal = result.get("risk_signal")
        evidence = result.get("evidence", [])
        reference_available = bool(result.get("reference_available", False))

        if provider == "Cisco Talos":
            provider_status[provider] = {"available": available, "reference_available": reference_available, "positive_evidence": False, "risk_signal": None}
            if reference_available:
                evidence_items.append({"provider": provider, "type": "reference", "message": "Cisco Talos Reputation Center reference is available."})
            continue

        provider_status[provider] = {"available": available, "reference_available": False, "positive_evidence": positive_evidence, "risk_signal": risk_signal}
        if available:
            available_providers.append(provider)

        if positive_evidence:
            positive_providers.append(provider)
            evidence_items.append({"provider": provider, "type": "positive", "risk_signal": risk_signal, "evidence": evidence})
        elif available:
            negative_providers.append(provider)
            evidence_items.append({"provider": provider, "type": "negative", "risk_signal": risk_signal, "evidence": evidence})

    positive_providers = list(dict.fromkeys(positive_providers))
    negative_providers = list(dict.fromkeys(negative_providers))
    available_providers = list(dict.fromkeys(available_providers))

    positive_provider_count = len(positive_providers)
    negative_provider_count = len(negative_providers)
    total_automated_providers = positive_provider_count + negative_provider_count

    agreement_ratio = round((positive_provider_count / total_automated_providers) * 100, 2) if total_automated_providers else 0.0
    multi_source_confirmation = positive_provider_count >= 2
    strong_multi_source_confirmation = positive_provider_count >= 3
    conflicting_evidence = positive_provider_count > 0 and negative_provider_count > 0

    evidence_strength = 0.0
    if positive_provider_count >= 3:
        evidence_strength += 45
    elif positive_provider_count == 2:
        evidence_strength += 30
    elif positive_provider_count == 1:
        evidence_strength += 15

    if agreement_ratio >= 75:
        evidence_strength += 25
    elif agreement_ratio >= 50:
        evidence_strength += 15
    elif agreement_ratio > 0:
        evidence_strength += 5

    strong_signal_providers = []
    for result in normalized_results:
        if not isinstance(result, dict) or result.get("provider") == "Cisco Talos":
            continue
        risk_signal = _safe_number(result.get("risk_signal"))
        if risk_signal >= 70:
            strong_signal_providers.append(result.get("provider"))
    strong_signal_providers = list(dict.fromkeys(strong_signal_providers))
    if strong_signal_providers:
        evidence_strength += min(len(strong_signal_providers) * 10, 30)
    evidence_strength = min(round(evidence_strength, 2), 100.0)

    reasons = []
    if positive_provider_count >= 3:
        reasons.append(f"{positive_provider_count} independent threat-intelligence providers supplied positive evidence.")
    elif positive_provider_count == 2:
        reasons.append("2 independent threat-intelligence providers supplied positive evidence.")
    elif positive_provider_count == 1:
        reasons.append("1 threat-intelligence provider supplied positive evidence.")
    else:
        reasons.append("No automated provider supplied positive threat evidence.")

    if multi_source_confirmation:
        reasons.append("Multiple independent providers confirmed threat-related evidence.")
    if strong_multi_source_confirmation:
        reasons.append("Three or more independent providers confirmed threat-related evidence.")
    if conflicting_evidence:
        reasons.append("Threat intelligence is conflicting: some providers supplied positive evidence while other available providers did not.")
    if strong_signal_providers:
        reasons.append("Strong risk signals were observed from: " + ", ".join(strong_signal_providers) + ".")

    if strong_multi_source_confirmation:
        correlation_classification = "STRONG_MULTI_SOURCE"
    elif multi_source_confirmation:
        correlation_classification = "MULTI_SOURCE"
    elif conflicting_evidence:
        correlation_classification = "CONFLICTING"
    elif positive_provider_count == 1:
        correlation_classification = "SINGLE_SOURCE"
    else:
        correlation_classification = "NO_POSITIVE_EVIDENCE"

    return {
        "correlation_classification": correlation_classification,
        "available_provider_count": len(available_providers),
        "positive_provider_count": positive_provider_count,
        "negative_provider_count": negative_provider_count,
        "positive_providers": positive_providers,
        "negative_providers": negative_providers,
        "agreement_ratio": agreement_ratio,
        "multi_source_confirmation": multi_source_confirmation,
        "strong_multi_source_confirmation": strong_multi_source_confirmation,
        "conflicting_evidence": conflicting_evidence,
        "strong_signal_providers": strong_signal_providers,
        "evidence_strength": evidence_strength,
        "provider_status": provider_status,
        "evidence": evidence_items,
        "reasons": reasons,
    }
