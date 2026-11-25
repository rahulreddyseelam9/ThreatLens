def calculate_risk_score(analysis_stats):
    """
    Calculate a risk score from VirusTotal analysis statistics.

    The score is based primarily on malicious and suspicious
    detections.
    """

    malicious = analysis_stats.get("malicious", 0)
    suspicious = analysis_stats.get("suspicious", 0)
    harmless = analysis_stats.get("harmless", 0)
    undetected = analysis_stats.get("undetected", 0)
    timeout = analysis_stats.get("timeout", 0)

    total_engines = (
        malicious
        + suspicious
        + harmless
        + undetected
        + timeout
    )

    if total_engines == 0:
        return 0.0

    # Malicious detections carry the highest weight.
    malicious_weight = 10

    # Suspicious detections carry a lower weight.
    suspicious_weight = 5

    raw_score = (
        (malicious * malicious_weight)
        + (suspicious * suspicious_weight)
    )

    # Normalize the score to 0-100.
    max_possible_score = total_engines * malicious_weight

    risk_score = (
        raw_score / max_possible_score
    ) * 100

    return round(min(risk_score, 100), 2)


def classify_risk(risk_score):
    """
    Convert the numerical risk score into a classification.
    """

    if risk_score >= 70:
        return "MALICIOUS"

    if risk_score >= 30:
        return "SUSPICIOUS"

    return "SAFE"