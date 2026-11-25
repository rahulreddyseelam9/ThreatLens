from datetime import datetime

from app import db
from app.models.scan import Scan
from app.models.api_result import ApiResult

from app.services.risk_service import calculate_risk
from app.services.emerging_threat_service import (
    calculate_emerging_threat
)
from app.services.intelligence_correlation_service import (
    correlate_intelligence
)
from app.services.intelligence_normalizer import (
    normalize_provider_results
)
from app.services.ml.explainer import Explainer
from app.services.ml.predictor import ThreatPredictor
from app.services.recommendation_service import RecommendationService


def analyze_scan(scan_id):
    """
    Analyze a completed scan using stored
    threat-intelligence results.

    Flow:

        API Results
             ↓
        Intelligence Normalizer
             ↓
        Intelligence Correlation
             ↓
        Intelligence Fusion
             ↓
        Risk Engine
             ↓
        Emerging Threat Engine
             ↓
        scans table
             ↓
        Final Analysis Response

    Cisco Talos reference results are preserved
    for dashboard/report usage but are NOT used
    as an automated risk signal.
    """

    # --------------------------------------------------
    # 1. Find the scan
    # --------------------------------------------------

    scan = Scan.query.get(scan_id)

    if not scan:
        raise ValueError(
            f"Scan with ID {scan_id} was not found."
        )

    # --------------------------------------------------
    # 2. Get provider results
    #
    # Normal automated providers use:
    #     status = "success"
    #
    # Cisco Talos currently uses:
    #     status = "reference"
    #
    # We need BOTH so that Talos can reach the
    # normalization layer.
    # --------------------------------------------------

    provider_results = ApiResult.query.filter(
        ApiResult.scan_id == scan_id,
        ApiResult.status.in_(
            [
                "success",
                "reference"
            ]
        )
    ).all()

    if not provider_results:
        raise ValueError(
            "No usable threat-intelligence results "
            f"were found for scan {scan_id}."
        )

    # --------------------------------------------------
    # 3. Convert database records into common format
    # --------------------------------------------------

    raw_provider_results = []

    for provider_result in provider_results:
        raw_provider_results.append(
            {
                "service_name": provider_result.service_name,
                "status": provider_result.status,
                "data": provider_result.result_data or {}
            }
        )

    # --------------------------------------------------
    # 4. Normalize provider intelligence
    # --------------------------------------------------

    normalized_results = normalize_provider_results(
        raw_provider_results
    )

    # --------------------------------------------------
    # 5. Intelligence Correlation
    # --------------------------------------------------

    correlation_result = correlate_intelligence(
        normalized_results
    )

    # --------------------------------------------------
    # 6. Prepare provider data containers
    # --------------------------------------------------

    vt_stats = {}

    abuseipdb_data = {}

    otx_data = {}

    urlhaus_data = {}

    talos_reference = {
        "available": False,
        "reference_available": False,
        "risk_signal": None,
        "positive_evidence": False,
        "evidence": [],
        "details": {}
    }

    # --------------------------------------------------
    # 7. Extract individual provider data
    # --------------------------------------------------

    for normalized_result in normalized_results:

        provider_name = normalized_result.get(
            "provider"
        )

        details = normalized_result.get(
            "details",
            {}
        )

        if provider_name == "VirusTotal":

            vt_stats = {
                "malicious": details.get(
                    "malicious",
                    0
                ),
                "suspicious": details.get(
                    "suspicious",
                    0
                ),
                "harmless": details.get(
                    "harmless",
                    0
                ),
                "undetected": details.get(
                    "undetected",
                    0
                ),
                "timeout": details.get(
                    "timeout",
                    0
                )
            }

        elif provider_name == "AbuseIPDB":

            abuseipdb_data = {
                "abuse_confidence_score": details.get(
                    "abuse_confidence_score",
                    0
                ),
                "total_reports": details.get(
                    "total_reports"
                ),
                "country_code": details.get(
                    "country_code"
                ),
                "isp": details.get(
                    "isp"
                ),
                "domain": details.get(
                    "domain"
                ),
                "usage_type": details.get(
                    "usage_type"
                )
            }

        elif provider_name == "AlienVault OTX":

            otx_data = {
                "reputation": details.get(
                    "reputation",
                    0
                ),
                "pulse_info": {
                    "count": details.get(
                        "pulse_count",
                        0
                    )
                },
                "indicator": details.get(
                    "indicator"
                ),
                "type": details.get(
                    "type"
                ),
                "country_code": details.get(
                    "country_code"
                ),
                "country_name": details.get(
                    "country_name"
                ),
                "asn": details.get(
                    "asn"
                )
            }

        elif provider_name == "URLHaus":

            urlhaus_data = {
                "query_status": details.get(
                    "query_status"
                ),
                "listed": details.get(
                    "listed",
                    False
                )
            }

        elif provider_name == "Cisco Talos":

            talos_reference = {
                "available": normalized_result.get(
                    "available",
                    False
                ),
                "reference_available": normalized_result.get(
                    "reference_available",
                    False
                ),
                "risk_signal": normalized_result.get(
                    "risk_signal"
                ),
                "positive_evidence": normalized_result.get(
                    "positive_evidence",
                    False
                ),
                "evidence": normalized_result.get(
                    "evidence",
                    []
                ),
                "details": details
            }

    # --------------------------------------------------
    # 8. Extract VirusTotal statistics
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

    # --------------------------------------------------
    # 9. Risk calculation
    #
    # Cisco Talos is intentionally NOT passed into
    # calculate_risk because the current Talos adapter
    # only provides a reference URL and does not provide
    # automated reputation data.
    # --------------------------------------------------

    risk_result = calculate_risk(
        vt_stats=vt_stats,
        abuseipdb_data=abuseipdb_data,
        otx_data=otx_data,
        urlhaus_data=urlhaus_data
    )

    risk_score = risk_result[
        "risk_score"
    ]

    classification = risk_result[
        "classification"
    ]

    # --------------------------------------------------
    # 10. Correlation-based provider evidence
    #
    # The correlation engine determines how many
    # independent providers supplied positive evidence.
    # --------------------------------------------------

    provider_evidence_count = correlation_result.get(
        "positive_provider_count",
        0
    )

    # --------------------------------------------------
    # 11. Emerging Threat Analysis
    #
    # Historical observations and related IOC analysis
    # will be added in the next phase.
    # --------------------------------------------------

    emerging_result = calculate_emerging_threat(
        risk_score=risk_score,
        malicious=malicious,
        suspicious=suspicious,
        first_seen=None,
        recent_observations=0,
        related_ioc_count=0,
        provider_evidence_count=provider_evidence_count
    )

    # --------------------------------------------------
    # 12. Update scan
    # --------------------------------------------------

    scan.risk_score = risk_score

    scan.classification = classification

    db.session.commit()

    # --------------------------------------------------
    # 13. Build normalized intelligence response
    # --------------------------------------------------

    normalized_intelligence = []

    for normalized_result in normalized_results:

        normalized_intelligence.append(
            {
                "provider": normalized_result.get(
                    "provider"
                ),
                "available": normalized_result.get(
                    "available"
                ),
                "reference_available": normalized_result.get(
                    "reference_available",
                    False
                ),
                "risk_signal": normalized_result.get(
                    "risk_signal"
                ),
                "positive_evidence": normalized_result.get(
                    "positive_evidence"
                ),
                "evidence": normalized_result.get(
                    "evidence",
                    []
                ),
                "details": normalized_result.get(
                    "details",
                    {}
                )
            }
        )

    # --------------------------------------------------
    # 14. Build final response
    # --------------------------------------------------

    result = {
        "scan_id": scan.id,

        "ioc": scan.ioc,

        "ioc_type": scan.ioc_type,

        # --------------------------------------------------
        # Risk
        # --------------------------------------------------

        "risk": {
            "risk_score": risk_score,

            "classification": classification,

            "confidence": risk_result[
                "confidence"
            ],

            "reasons": risk_result[
                "reasons"
            ]
        },

        # --------------------------------------------------
        # Emerging Threat
        # --------------------------------------------------

        "emerging_threat": emerging_result,

        # --------------------------------------------------
        # Intelligence Correlation
        # --------------------------------------------------

        "correlation": correlation_result,

        # --------------------------------------------------
        # Normalized Intelligence
        # --------------------------------------------------

        "normalized_intelligence": (
            normalized_intelligence
        ),

        # --------------------------------------------------
        # VirusTotal
        # --------------------------------------------------

        "virustotal": {
            "available": any(
                item.get("provider")
                == "VirusTotal"
                for item in normalized_results
            ),

            "malicious": malicious,

            "suspicious": suspicious,

            "harmless": harmless,

            "undetected": undetected,

            "timeout": timeout
        },

        # --------------------------------------------------
        # AbuseIPDB
        # --------------------------------------------------

        "abuseipdb": {
            "available": any(
                item.get("provider")
                == "AbuseIPDB"
                for item in normalized_results
            ),

            "abuse_confidence_score": (
                abuseipdb_data.get(
                    "abuse_confidence_score"
                )
            ),

            "total_reports": (
                abuseipdb_data.get(
                    "total_reports"
                )
            ),

            "country_code": (
                abuseipdb_data.get(
                    "country_code"
                )
            ),

            "isp": (
                abuseipdb_data.get(
                    "isp"
                )
            ),

            "domain": (
                abuseipdb_data.get(
                    "domain"
                )
            ),

            "usage_type": (
                abuseipdb_data.get(
                    "usage_type"
                )
            )
        },

        # --------------------------------------------------
        # AlienVault OTX
        # --------------------------------------------------

        "alienvault_otx": {
            "available": any(
                item.get("provider")
                == "AlienVault OTX"
                for item in normalized_results
            ),

            "reputation": (
                otx_data.get(
                    "reputation"
                )
            ),

            "pulse_count": (
                (
                    otx_data.get(
                        "pulse_info",
                        {}
                    ) or {}
                ).get(
                    "count"
                )
            ),

            "indicator": (
                otx_data.get(
                    "indicator"
                )
            ),

            "type": (
                otx_data.get(
                    "type"
                )
            ),

            "country_code": (
                otx_data.get(
                    "country_code"
                )
            ),

            "country_name": (
                otx_data.get(
                    "country_name"
                )
            ),

            "asn": (
                otx_data.get(
                    "asn"
                )
            )
        },

        # --------------------------------------------------
        # URLHaus
        # --------------------------------------------------

        "urlhaus": {
            "available": any(
                item.get("provider")
                == "URLHaus"
                for item in normalized_results
            ),

            "query_status": (
                urlhaus_data.get(
                    "query_status"
                )
            ),

            "listed": (
                urlhaus_data.get(
                    "listed",
                    False
                )
            )
        },

        # --------------------------------------------------
        # Cisco Talos
        #
        # Reference-only integration.
        # No automated risk score is assigned.
        # --------------------------------------------------

        "cisco_talos": {
            "available": talos_reference.get(
                "available",
                False
            ),

            "reference_available": (
                talos_reference.get(
                    "reference_available",
                    False
                )
            ),

            "risk_signal": (
                talos_reference.get(
                    "risk_signal"
                )
            ),

            "positive_evidence": (
                talos_reference.get(
                    "positive_evidence",
                    False
                )
            ),

            "evidence": (
                talos_reference.get(
                    "evidence",
                    []
                )
            ),

            "details": (
                talos_reference.get(
                    "details",
                    {}
                )
            )
        },

        # --------------------------------------------------
        # Intelligence Fusion
        # --------------------------------------------------

        "fusion": {
            "virustotal_risk": (
                risk_result[
                    "sources"
                ][
                    "virustotal_risk"
                ]
            ),

            "abuseipdb_risk": (
                risk_result[
                    "sources"
                ][
                    "abuseipdb_risk"
                ]
            ),

            "otx_risk": (
                risk_result[
                    "sources"
                ][
                    "otx_risk"
                ]
            ),

            "urlhaus_risk": (
                risk_result[
                    "sources"
                ][
                    "urlhaus_risk"
                ]
            ),

            # Cisco Talos currently provides no
            # automated risk signal.
            "cisco_talos_risk": None
        },

        # --------------------------------------------------
        # Analysis timestamp
        # --------------------------------------------------

        "analyzed_at": (
            datetime.utcnow().isoformat()
        )
    }

    return result
