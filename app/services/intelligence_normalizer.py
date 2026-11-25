def normalize_virustotal(data):
    """
    Normalize VirusTotal intelligence into
    a common evidence structure.
    """

    data = data or {}

    malicious = int(
        data.get("malicious", 0) or 0
    )

    suspicious = int(
        data.get("suspicious", 0) or 0
    )

    harmless = int(
        data.get("harmless", 0) or 0
    )

    undetected = int(
        data.get("undetected", 0) or 0
    )

    timeout = int(
        data.get("timeout", 0) or 0
    )

    total = (
        malicious
        + suspicious
        + harmless
        + undetected
        + timeout
    )

    if total > 0:

        risk_signal = (
            (
                malicious * 100
            )
            + (
                suspicious * 50
            )
        ) / total

    else:

        risk_signal = 0.0

    risk_signal = round(
        min(
            max(
                risk_signal,
                0.0
            ),
            100.0
        ),
        2
    )

    positive_evidence = (
        malicious > 0
        or suspicious > 0
    )

    evidence = []

    if malicious > 0:

        evidence.append(
            f"{malicious} VirusTotal security "
            "engine(s) reported malicious activity."
        )

    if suspicious > 0:

        evidence.append(
            f"{suspicious} VirusTotal security "
            "engine(s) reported suspicious activity."
        )

    if malicious == 0 and suspicious == 0:

        evidence.append(
            "VirusTotal reported no malicious or "
            "suspicious detections."
        )

    return {
        "provider": "VirusTotal",
        "available": total > 0,
        "risk_signal": risk_signal,
        "positive_evidence": positive_evidence,
        "evidence": evidence,
        "details": {
            "malicious": malicious,
            "suspicious": suspicious,
            "harmless": harmless,
            "undetected": undetected,
            "timeout": timeout,
            "total_engines": total
        }
    }


def normalize_abuseipdb(data):
    """
    Normalize AbuseIPDB intelligence into
    a common evidence structure.
    """

    data = data or {}

    abuse_score = int(
        data.get(
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

    total_reports = data.get(
        "total_reports"
    )

    positive_evidence = (
        abuse_score > 0
    )

    evidence = [
        (
            "AbuseIPDB abuse confidence score: "
            f"{abuse_score}/100."
        )
    ]

    if total_reports is not None:

        evidence.append(
            f"AbuseIPDB has {total_reports} "
            "reported event(s) for this IP."
        )

    return {
        "provider": "AbuseIPDB",
        "available": bool(data),
        "risk_signal": abuse_score,
        "positive_evidence": positive_evidence,
        "evidence": evidence,
        "details": {
            "abuse_confidence_score": abuse_score,
            "total_reports": total_reports,
            "country_code": data.get(
                "country_code"
            ),
            "isp": data.get(
                "isp"
            ),
            "domain": data.get(
                "domain"
            ),
            "usage_type": data.get(
                "usage_type"
            )
        }
    }


def normalize_otx(data):
    """
    Normalize AlienVault OTX intelligence into
    a common evidence structure.
    """

    data = data or {}

    reputation = int(
        data.get(
            "reputation",
            0
        ) or 0
    )

    pulse_info = (
        data.get(
            "pulse_info",
            {}
        ) or {}
    )

    pulse_count = int(
        pulse_info.get(
            "count",
            0
        ) or 0
    )

    otx_score = 0

    if reputation > 0:

        otx_score += min(
            reputation,
            50
        )

    if pulse_count >= 10:

        otx_score += 50

    elif pulse_count >= 5:

        otx_score += 30

    elif pulse_count >= 1:

        otx_score += 15

    otx_score = min(
        otx_score,
        100
    )

    positive_evidence = (
        reputation > 0
        or pulse_count > 0
    )

    evidence = [
        f"AlienVault OTX reputation: {reputation}.",
        f"AlienVault OTX pulse count: {pulse_count}."
    ]

    if pulse_count > 0:

        evidence.append(
            "AlienVault OTX contains "
            "threat-intelligence pulse evidence "
            "for this IOC."
        )

    else:

        evidence.append(
            "AlienVault OTX returned no associated "
            "threat-intelligence pulses."
        )

    return {
        "provider": "AlienVault OTX",
        "available": bool(data),
        "risk_signal": round(
            otx_score,
            2
        ),
        "positive_evidence": positive_evidence,
        "evidence": evidence,
        "details": {
            "reputation": reputation,
            "pulse_count": pulse_count,
            "indicator": data.get(
                "indicator"
            ),
            "type": data.get(
                "type"
            ),
            "country_code": data.get(
                "country_code"
            ),
            "country_name": data.get(
                "country_name"
            ),
            "asn": data.get(
                "asn"
            )
        }
    }


def normalize_urlhaus(data):
    """
    Normalize URLHaus intelligence into
    a common evidence structure.
    """

    data = data or {}

    query_status = data.get(
        "query_status"
    )

    listed = False

    if query_status == "listed":

        listed = True

    elif (
        data.get("url")
        or data.get("id")
        or data.get("threat")
    ):

        listed = True

    risk_signal = 100 if listed else 0

    positive_evidence = listed

    evidence = []

    if query_status == "no_results":

        evidence.append(
            "URLHaus successfully checked the URL "
            "but found no matching listing."
        )

    elif listed:

        evidence.append(
            "URLHaus contains a listing for this URL."
        )

    else:

        evidence.append(
            "URLHaus returned a response without "
            "clear positive listing evidence."
        )

    return {
        "provider": "URLHaus",
        "available": bool(data),
        "risk_signal": risk_signal,
        "positive_evidence": positive_evidence,
        "evidence": evidence,
        "details": {
            "query_status": query_status,
            "listed": listed
        }
    }


def normalize_talos_reference(data):
    """
    Normalize a Cisco Talos reference result.

    Talos currently provides a public web-based
    Reputation Center lookup rather than a documented
    public JSON REST lookup for this workflow.

    Therefore the reference itself is available,
    but it is NOT treated as automated threat
    intelligence and does NOT receive a risk score.
    """

    data = data or {}

    lookup_url = data.get(
        "lookup_url"
    )

    ioc = data.get(
        "ioc"
    )

    ioc_type = data.get(
        "ioc_type"
    )

    evidence = []

    if lookup_url:

        evidence.append(
            "Cisco Talos Reputation Center lookup "
            "reference is available for this IOC."
        )

    else:

        evidence.append(
            "Cisco Talos reference data is available, "
            "but no lookup URL was provided."
        )

    return {
        "provider": "Cisco Talos",
        "available": False,
        "reference_available": bool(
            lookup_url
        ),
        "risk_signal": None,
        "positive_evidence": False,
        "evidence": evidence,
        "details": {
            "ioc": ioc,
            "ioc_type": ioc_type,
            "lookup_url": lookup_url,
            "automated_lookup": data.get(
                "automated_lookup",
                False
            )
        }
    }


def normalize_provider_result(
    service_name,
    data
):
    """
    Normalize a provider result based on
    the provider name.
    """

    if service_name == "VirusTotal":

        return normalize_virustotal(data)

    if service_name == "AbuseIPDB":

        return normalize_abuseipdb(data)

    if service_name == "AlienVault OTX":

        return normalize_otx(data)

    if service_name == "URLHaus":

        return normalize_urlhaus(data)

    if service_name == "Cisco Talos":

        return normalize_talos_reference(data)

    return {
        "provider": service_name,
        "available": bool(data),
        "risk_signal": 0.0,
        "positive_evidence": False,
        "evidence": [
            (
                f"No normalizer is currently "
                f"defined for {service_name}."
            )
        ],
        "details": {}
    }


def normalize_provider_results(
    provider_results
):
    """
    Normalize multiple provider results.

    Expected input:

        [
            {
                "service_name": "...",
                "status": "success",
                "data": {...}
            }
        ]

    Cisco Talos may return:

        {
            "service_name": "Cisco Talos",
            "status": "reference",
            "data": {...}
        }

    Reference results are preserved so that the
    dashboard/report layer can expose the lookup URL,
    but they are not treated as automated intelligence.
    """

    normalized_results = []

    for result in provider_results:

        if not result:

            continue

        service_name = result.get(
            "service_name",
            "Unknown"
        )

        status = result.get(
            "status"
        )

        # --------------------------------------------------
        # Cisco Talos reference result
        # --------------------------------------------------

        if (
            service_name == "Cisco Talos"
            and status == "reference"
        ):

            data = result.get(
                "data",
                {}
            )

            normalized = normalize_talos_reference(
                data
            )

            normalized_results.append(
                normalized
            )

            continue

        # --------------------------------------------------
        # Other providers
        # --------------------------------------------------

        if status != "success":

            continue

        data = result.get(
            "data",
            {}
        )

        normalized = normalize_provider_result(
            service_name,
            data
        )

        normalized_results.append(
            normalized
        )

    return normalized_results
