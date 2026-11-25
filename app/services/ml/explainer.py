class Explainer:
    @staticmethod
    def explain(analysis_result, prediction):
        risk = (analysis_result or {}).get("risk", {})
        vt = (analysis_result or {}).get("virustotal", {})
        abuse = (analysis_result or {}).get("abuseipdb", {})
        correlation = (analysis_result or {}).get("correlation", {})
        reasons = []

        if risk.get("risk_score", 0) >= 80:
            reasons.append("Risk score is high enough to indicate material threat exposure.")
        if vt.get("malicious", 0):
            reasons.append("VirusTotal detected malicious engines for this indicator.")
        if abuse.get("abuse_confidence_score", 0) >= 70:
            reasons.append("AbuseIPDB abuse confidence score was high.")
        if correlation.get("positive_provider_count", 0) >= 2:
            reasons.append("Multiple providers confirmed the same threat signal.")
        if not reasons:
            reasons.append("Evidence is limited and the model is relying mostly on low-signal indicators.")
        return {"prediction": prediction.get("prediction"), "reasons": reasons}
