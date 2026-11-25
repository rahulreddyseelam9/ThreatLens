import os
import requests


ABUSEIPDB_URL = "https://api.abuseipdb.com/api/v2/check"


def check_ip(ip_address):
    api_key = os.getenv("ABUSEIPDB_API_KEY")

    if not api_key:
        return {
            "status": "error",
            "service": "AbuseIPDB",
            "message": "AbuseIPDB API key is not configured"
        }

    headers = {
        "Accept": "application/json",
        "Key": api_key
    }

    params = {
        "ipAddress": ip_address,
        "maxAgeInDays": 90
    }

    try:
        response = requests.get(
            ABUSEIPDB_URL,
            headers=headers,
            params=params,
            timeout=15
        )

        if response.status_code != 200:
            return {
                "status": "error",
                "service": "AbuseIPDB",
                "http_status": response.status_code,
                "message": response.text
            }

        data = response.json().get("data", {})

        return {
            "status": "success",
            "service": "AbuseIPDB",
            "data": {
                "ip_address": data.get("ipAddress"),
                "is_public": data.get("isPublic"),
                "ip_version": data.get("ipVersion"),
                "country_code": data.get("countryCode"),
                "usage_type": data.get("usageType"),
                "isp": data.get("isp"),
                "domain": data.get("domain"),
                "total_reports": data.get("totalReports"),
                "abuse_confidence_score": data.get("abuseConfidenceScore"),
                "last_reported_at": data.get("lastReportedAt")
            }
        }

    except requests.RequestException as e:
        return {
            "status": "error",
            "service": "AbuseIPDB",
            "message": str(e)
        }