import os
import base64
import requests

from dotenv import load_dotenv


load_dotenv()


VIRUSTOTAL_API_URL = "https://www.virustotal.com/api/v3"


def get_virustotal_headers():
    """
    Create HTTP headers for VirusTotal API requests.
    """

    api_key = os.getenv("VIRUSTOTAL_API_KEY")

    if not api_key:
        raise RuntimeError(
            "VIRUSTOTAL_API_KEY is not configured"
        )

    return {
        "x-apikey": api_key,
        "Accept": "application/json"
    }


def _get(url):
    """
    Send a GET request to VirusTotal.
    """

    headers = get_virustotal_headers()

    response = requests.get(
        url,
        headers=headers,
        timeout=15
    )

    return {
        "status_code": response.status_code,
        "data": response.json()
    }


def lookup_ip(ip_address):
    """
    Look up an IP address in VirusTotal.
    """

    url = (
        f"{VIRUSTOTAL_API_URL}/"
        f"ip_addresses/{ip_address}"
    )

    return _get(url)


def lookup_domain(domain):
    """
    Look up a domain in VirusTotal.
    """

    url = (
        f"{VIRUSTOTAL_API_URL}/"
        f"domains/{domain}"
    )

    return _get(url)


def lookup_hash(file_hash):
    """
    Look up an MD5, SHA1 or SHA256 file hash
    in VirusTotal.
    """

    url = (
        f"{VIRUSTOTAL_API_URL}/"
        f"files/{file_hash}"
    )

    return _get(url)


def lookup_url(url_value):
    """
    Look up a URL in VirusTotal.

    VirusTotal uses a URL identifier generated
    from URL-safe Base64 encoding without padding.
    """

    url_id = base64.urlsafe_b64encode(
        url_value.encode("utf-8")
    ).decode("utf-8").rstrip("=")

    url = (
        f"{VIRUSTOTAL_API_URL}/"
        f"urls/{url_id}"
    )

    return _get(url)


def extract_analysis_stats(vt_result):
    """
    Extract VirusTotal analysis statistics
    from a successful response.
    """

    if vt_result.get("status_code") != 200:
        return {}

    data = vt_result.get(
        "data",
        {}
    )

    attributes = (
        data.get("data", {})
        .get("attributes", {})
    )

    return attributes.get(
        "last_analysis_stats",
        {}
    )