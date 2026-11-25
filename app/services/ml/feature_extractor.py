class FeatureExtractor:
    @staticmethod
    def extract(analysis_result):
        risk = (analysis_result or {}).get("risk", {})
        emerging = (analysis_result or {}).get("emerging_threat", {})
        vt = (analysis_result or {}).get("virustotal", {})
        abuse = (analysis_result or {}).get("abuseipdb", {})
        otx = (analysis_result or {}).get("alienvault_otx", {})
        urlhaus = (analysis_result or {}).get("urlhaus", {})
        correlation = (analysis_result or {}).get("correlation", {})
        features = {
            "risk_score": float(risk.get("risk_score", 0) or 0),
            "confidence": float(risk.get("confidence", 0) or 0),
            "malicious_count": int(vt.get("malicious", 0) or 0),
            "suspicious_count": int(vt.get("suspicious", 0) or 0),
            "abuse_score": int(abuse.get("abuse_confidence_score", 0) or 0),
            "otx_reputation": int(otx.get("reputation", 0) or 0),
            "pulse_count": int((otx.get("pulse_info") or {}).get("count", 0) or 0),
            "urlhaus_listed": 1 if (str(urlhaus.get("query_status")) == "listed" or bool(urlhaus.get("listed"))) else 0,
            "provider_count": int(correlation.get("available_provider_count", 0) or 0),
            "agreement_ratio": float(correlation.get("agreement_ratio", 0) or 0),
            "emerging_score": float(emerging.get("emerging_threat_score", 0) or 0),
            "related_indicator_count": int((analysis_result or {}).get("related_indicator_count", 0) or 0),
        }
        return features
