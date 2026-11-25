def calculate_risk(
    vt_stats,
    abuseipdb_data=None,
    otx_data=None,
    urlhaus_data=None
):
    """
    Calculate a unified risk score using
    multiple threat-intelligence providers.

    Providers currently included:

        1. VirusTotal
        2. AbuseIPDB
        3. AlienVault OTX
        4. URLHaus

    Returns:

        risk_score
        classification
        confidence
        reasons
        sources
    """

    # --------------------------------------------------
    # 1. VirusTotal statistics
    # --------------------------------------------------

    malicious = int(
        vt_stats.get(
            "malicious",
            0
        ) or 0
    )

    suspicious = int(
        vt_stats.get(
            "suspicious",
            0
        ) or 0
    )

    harmless = int(
        vt_stats.get(
            "harmless",
            0
        ) or 0
    )

    undetected = int(
        vt_stats.get(
            "undetected",
            0
        ) or 0
    )

    timeout = int(
        vt_stats.get(
            "timeout",
            0
        ) or 0
    )

    total = (
        malicious
        + suspicious
        + harmless
        + undetected
        + timeout
    )

    # --------------------------------------------------
    # 2. VirusTotal risk
    # --------------------------------------------------

    if total > 0:

        malicious_weight = 100
        suspicious_weight = 50

        vt_risk = (
            (malicious * malicious_weight)
            + (suspicious * suspicious_weight)
        ) / total

        vt_risk = min(
            vt_risk,
            100.0
        )

    else:

        vt_risk = 0.0

    # --------------------------------------------------
    # 3. AbuseIPDB risk
    # --------------------------------------------------

    abuse_score = 0

    if abuseipdb_data:

        abuse_score = int(
            abuseipdb_data.get(
                "abuse_confidence_score",
                0
            ) or 0
        )

        abuse_score = max(
            0,
            min(
                abuse_score,
                100
            )
        )

    # --------------------------------------------------
    # 4. AlienVault OTX evidence
    # --------------------------------------------------

    otx_score = 0
    otx_pulse_count = 0
    otx_reputation = 0

    if otx_data:

        otx_reputation = int(
            otx_data.get(
                "reputation",
                0
            ) or 0
        )

        pulse_info = otx_data.get(
            "pulse_info",
            {}
        ) or {}

        otx_pulse_count = int(
            pulse_info.get(
                "count",
                0
            ) or 0
        )

        # OTX reputation is treated as
        # supporting evidence.
        #
        # Pulse count is also treated as
        # supporting evidence.
        #
        # We do not automatically treat
        # every OTX pulse as malicious.

        if otx_reputation > 0:

            otx_score += min(
                otx_reputation,
                50
            )

        if otx_pulse_count >= 10:

            otx_score += 50

        elif otx_pulse_count >= 5:

            otx_score += 30

        elif otx_pulse_count >= 1:

            otx_score += 15

        otx_score = min(
            otx_score,
            100
        )

    # --------------------------------------------------
    # 5. URLHaus evidence
    # --------------------------------------------------

    urlhaus_score = 0
    urlhaus_status = None
    urlhaus_listing = None

    if urlhaus_data:

        urlhaus_status = urlhaus_data.get(
            "query_status"
        )

        # URLHaus successfully checked the URL
        # but did not find a listing.
        if urlhaus_status == "no_results":

            urlhaus_score = 0

        # A URLHaus lookup that returns a URL
        # record represents positive evidence.
        elif urlhaus_status == "listed":

            urlhaus_score = 100
            urlhaus_listing = True

        # Some URLHaus responses may contain
        # URL metadata even when query_status
        # is not explicitly "listed".
        elif (
            urlhaus_data.get("url")
            or urlhaus_data.get("id")
            or urlhaus_data.get("threat")
        ):

            urlhaus_score = 100
            urlhaus_listing = True

        else:

            urlhaus_score = 0

    # --------------------------------------------------
    # 6. Determine available intelligence sources
    # --------------------------------------------------

    available_sources = 0

    if total > 0:

        available_sources += 1

    if abuseipdb_data:

        available_sources += 1

    if otx_data:

        available_sources += 1

    if urlhaus_data:

        available_sources += 1

    # --------------------------------------------------
    # 7. Intelligence Fusion
    # --------------------------------------------------

    # Project-defined heuristic weights:
    #
    # VirusTotal = 50%
    # AbuseIPDB  = 20%
    # OTX        = 15%
    # URLHaus    = 15%
    #
    # These are project-defined heuristic
    # weights, not an industry standard.

    weighted_components = []
    total_weight = 0.0

    if total > 0:

        weighted_components.append(
            vt_risk * 0.50
        )

        total_weight += 0.50

    if abuseipdb_data:

        weighted_components.append(
            abuse_score * 0.20
        )

        total_weight += 0.20

    if otx_data:

        weighted_components.append(
            otx_score * 0.15
        )

        total_weight += 0.15

    if urlhaus_data:

        weighted_components.append(
            urlhaus_score * 0.15
        )

        total_weight += 0.15

    if total_weight > 0:

        risk_score = (
            sum(weighted_components)
            / total_weight
        )

    else:

        risk_score = 0.0

    risk_score = round(
        min(
            max(
                risk_score,
                0.0
            ),
            100.0
        ),
        2
    )

    # --------------------------------------------------
    # 8. Classification
    # --------------------------------------------------

    if available_sources == 0:

        classification = "UNKNOWN"
        risk_score = 0.0

    elif risk_score >= 80:

        classification = "CRITICAL"

    elif risk_score >= 60:

        classification = "HIGH"

    elif risk_score >= 30:

        classification = "MEDIUM"

    elif risk_score > 0:

        classification = "LOW"

    else:

        classification = "SAFE"

    # --------------------------------------------------
    # 9. Confidence
    # --------------------------------------------------

    if available_sources > 0:

        confidence = round(
            (
                available_sources / 4
            ) * 100,
            2
        )

    else:

        confidence = 0.0

    # --------------------------------------------------
    # 10. Explanation
    # --------------------------------------------------

    reasons = []

    # --------------------------------------------------
    # VirusTotal explanation
    # --------------------------------------------------

    if total > 0:

        if malicious > 0:

            reasons.append(
                f"{malicious} VirusTotal security "
                "engine(s) reported malicious activity."
            )

        elif suspicious > 0:

            reasons.append(
                f"{suspicious} VirusTotal security "
                "engine(s) reported suspicious activity."
            )

        else:

            reasons.append(
                "VirusTotal reported no malicious or "
                "suspicious detections."
            )

        if harmless > 0:

            reasons.append(
                f"{harmless} VirusTotal security "
                "engine(s) classified the IOC as harmless."
            )

        if undetected > 0:

            reasons.append(
                f"{undetected} VirusTotal security "
                "engine(s) returned no detection."
            )

    # --------------------------------------------------
    # AbuseIPDB explanation
    # --------------------------------------------------

    if abuseipdb_data:

        reasons.append(
            f"AbuseIPDB abuse confidence score: "
            f"{abuse_score}/100."
        )

        total_reports = abuseipdb_data.get(
            "total_reports"
        )

        if total_reports is not None:

            reasons.append(
                f"AbuseIPDB has {total_reports} "
                "reported event(s) for this IP."
            )

    # --------------------------------------------------
    # OTX explanation
    # --------------------------------------------------

    if otx_data:

        reasons.append(
            f"AlienVault OTX reputation: "
            f"{otx_reputation}."
        )

        reasons.append(
            f"AlienVault OTX pulse count: "
            f"{otx_pulse_count}."
        )

        if otx_pulse_count > 0:

            reasons.append(
                "AlienVault OTX contains "
                "threat-intelligence pulse evidence "
                "for this IOC."
            )

        else:

            reasons.append(
                "AlienVault OTX returned no associated "
                "threat-intelligence pulses."
            )

    # --------------------------------------------------
    # URLHaus explanation
    # --------------------------------------------------

    if urlhaus_data:

        if urlhaus_status == "no_results":

            reasons.append(
                "URLHaus successfully checked the URL "
                "but found no matching listing."
            )

        elif urlhaus_listing:

            reasons.append(
                "URLHaus contains a listing for this URL."
            )

        else:

            reasons.append(
                "URLHaus returned a response without "
                "clear positive listing evidence."
            )

    # --------------------------------------------------
    # Final fusion explanation
    # --------------------------------------------------

    if available_sources > 0:

        reasons.append(
            "Final risk score combines the available "
            "threat-intelligence sources."
        )

    else:

        reasons.append(
            "No threat-intelligence sources were available for this IOC; "
            "risk remains unknown rather than marked safe."
        )

    # --------------------------------------------------
    # 11. Return result
    # --------------------------------------------------

    return {
        "risk_score": risk_score,

        "classification": classification,

        "confidence": confidence,

        "reasons": reasons,

        "sources": {
            "virustotal_risk": round(
                vt_risk,
                2
            ),

            "abuseipdb_risk": abuse_score,

            "otx_risk": round(
                otx_score,
                2
            ),

            "urlhaus_risk": round(
                urlhaus_score,
                2
            )
        }
    }