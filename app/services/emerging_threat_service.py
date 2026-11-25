from datetime import datetime, timedelta


def calculate_emerging_threat(
    risk_score,
    malicious,
    suspicious,
    first_seen,
    recent_observations=0,
    related_ioc_count=0,
    provider_evidence_count=0
):
    """
    Calculate an explainable emerging-threat score.

    Parameters:

        risk_score:
            Final risk score produced by the
            intelligence fusion engine.

        malicious:
            Number of VirusTotal engines that
            classified the IOC as malicious.

        suspicious:
            Number of VirusTotal engines that
            classified the IOC as suspicious.

        first_seen:
            Timestamp when the IOC was first observed.

        recent_observations:
            Number of recent observations associated
            with the IOC.

        related_ioc_count:
            Number of related IOCs.

        provider_evidence_count:
            Number of independent threat-intelligence
            providers that supplied positive threat
            evidence.

    Returns:

        emerging_threat_score
        classification
        confidence
        reasons
    """

    score = 0.0
    reasons = []

    # --------------------------------------------------
    # 1. Overall risk score
    # --------------------------------------------------

    if risk_score >= 80:

        score += 25

        reasons.append(
            "The IOC has a critical risk score."
        )

    elif risk_score >= 60:

        score += 20

        reasons.append(
            "The IOC has a high risk score."
        )

    elif risk_score >= 30:

        score += 10

        reasons.append(
            "The IOC has a medium risk score."
        )

    # --------------------------------------------------
    # 2. VirusTotal malicious detections
    # --------------------------------------------------
    #
    # IMPORTANT:
    # malicious represents VirusTotal security
    # engine detections, not independent providers.
    # --------------------------------------------------

    if malicious >= 5:

        score += 25

        reasons.append(
            f"{malicious} VirusTotal security engine(s) "
            "reported malicious activity."
        )

    elif malicious > 0:

        score += 15

        reasons.append(
            f"{malicious} VirusTotal security engine(s) "
            "reported malicious activity."
        )

    # --------------------------------------------------
    # 3. VirusTotal suspicious detections
    # --------------------------------------------------

    if suspicious >= 5:

        score += 15

        reasons.append(
            f"{suspicious} VirusTotal security engine(s) "
            "reported suspicious activity."
        )

    elif suspicious > 0:

        score += 8

        reasons.append(
            f"{suspicious} VirusTotal security engine(s) "
            "reported suspicious activity."
        )

    # --------------------------------------------------
    # 4. Independent provider evidence
    # --------------------------------------------------

    if provider_evidence_count >= 3:

        score += 20

        reasons.append(
            f"{provider_evidence_count} independent "
            "threat-intelligence provider(s) supplied "
            "positive threat evidence."
        )

    elif provider_evidence_count == 2:

        score += 12

        reasons.append(
            "2 independent threat-intelligence providers "
            "supplied positive threat evidence."
        )

    elif provider_evidence_count == 1:

        score += 6

        reasons.append(
            "1 independent threat-intelligence provider "
            "supplied positive threat evidence."
        )

    # --------------------------------------------------
    # 5. Novelty
    # --------------------------------------------------

    if first_seen:

        age = datetime.utcnow() - first_seen

        if age <= timedelta(days=1):

            score += 20

            reasons.append(
                "The IOC was first observed within "
                "the last 24 hours."
            )

        elif age <= timedelta(days=7):

            score += 10

            reasons.append(
                "The IOC was first observed within "
                "the last 7 days."
            )

    # --------------------------------------------------
    # 6. Recent activity
    # --------------------------------------------------

    if recent_observations >= 20:

        score += 15

        reasons.append(
            "Recent observations indicate rapidly "
            "increasing activity."
        )

    elif recent_observations >= 10:

        score += 10

        reasons.append(
            "Recent observations indicate "
            "increased activity."
        )

    elif recent_observations > 0:

        score += 5

        reasons.append(
            "Recent activity has been observed."
        )

    # --------------------------------------------------
    # 7. Related IOCs
    # --------------------------------------------------

    if related_ioc_count >= 10:

        score += 15

        reasons.append(
            "The IOC is associated with a growing "
            "set of related indicators."
        )

    elif related_ioc_count >= 5:

        score += 10

        reasons.append(
            "The IOC has multiple related indicators."
        )

    elif related_ioc_count > 0:

        score += 5

        reasons.append(
            "The IOC has related indicators."
        )

    # --------------------------------------------------
    # 8. Keep score between 0 and 100
    # --------------------------------------------------

    score = min(
        round(score, 2),
        100.0
    )

    # --------------------------------------------------
    # 9. Classification
    # --------------------------------------------------

    if score >= 70:

        classification = "EMERGING"

    elif score >= 40:

        classification = "POTENTIAL"

    else:

        classification = "NORMAL"

    # --------------------------------------------------
    # 10. Confidence
    # --------------------------------------------------
    #
    # Confidence is based on different evidence
    # categories rather than treating malicious and
    # suspicious engine counts as separate providers.
    #
    # Maximum evidence categories:
    #
    #   1. Malicious detections
    #   2. Suspicious detections
    #   3. Independent provider evidence
    #   4. Recent/novel activity
    #   5. Related IOC evidence
    # --------------------------------------------------

    evidence_count = 0

    if malicious > 0:

        evidence_count += 1

    if suspicious > 0:

        evidence_count += 1

    if provider_evidence_count > 0:

        evidence_count += 1

    if first_seen:

        evidence_count += 1

    if recent_observations > 0:

        evidence_count += 1

    if related_ioc_count > 0:

        evidence_count += 1

    confidence = min(
        round(
            (
                evidence_count / 6
            ) * 100,
            2
        ),
        100.0
    )

    # --------------------------------------------------
    # 11. No evidence
    # --------------------------------------------------

    if not reasons:

        reasons.append(
            "Insufficient evidence to identify "
            "an emerging threat."
        )

    # --------------------------------------------------
    # 12. Return result
    # --------------------------------------------------

    return {

        "emerging_threat_score": score,

        "classification": classification,

        "confidence": confidence,

        "reasons": reasons
    }
    