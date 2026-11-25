import re
import ipaddress
from urllib.parse import urlparse


def is_ip_address(value):
    """
    Check whether the IOC is a valid IPv4 or IPv6 address.
    """

    try:
        ipaddress.ip_address(value)
        return True
    except ValueError:
        return False


def is_url(value):
    """
    Check whether the IOC is a valid HTTP/HTTPS URL, including defanged schemes.
    """

    try:
        parsed = urlparse(value)
        hostname = parsed.hostname
        if (
            parsed.scheme not in ("http", "https", "hxxp", "hxxps")
            or not parsed.netloc
            or not hostname
            or any(character.isspace() for character in hostname)
        ):
            return False

        parsed.port
        return True

    except Exception:
        return False


def normalize_ioc_for_lookup(value, ioc_type):
    if ioc_type != "URL":
        return value

    scheme, separator, remainder = value.partition("://")
    if separator and scheme.lower() in ("hxxp", "hxxps"):
        normalized_scheme = "https" if scheme.lower() == "hxxps" else "http"
        return f"{normalized_scheme}://{remainder}"

    return value


def is_domain(value):
    """
    Check whether the IOC looks like a valid domain name.
    """

    pattern = r"^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"

    return bool(re.match(pattern, value))


def is_md5(value):
    """
    Check whether the IOC is an MD5 hash.
    """

    pattern = r"^[a-fA-F0-9]{32}$"

    return bool(re.match(pattern, value))


def is_sha1(value):
    """
    Check whether the IOC is a SHA1 hash.
    """

    pattern = r"^[a-fA-F0-9]{40}$"

    return bool(re.match(pattern, value))


def is_sha256(value):
    """
    Check whether the IOC is a SHA256 hash.
    """

    pattern = r"^[a-fA-F0-9]{64}$"

    return bool(re.match(pattern, value))


def is_email(value):
    """
    Check whether the IOC looks like an email address.
    """

    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

    return bool(re.match(pattern, value))


def identify_ioc_type(value):
    """
    Identify the type of IOC.

    Returns:
        IP
        URL
        DOMAIN
        MD5
        SHA1
        SHA256
        EMAIL
        UNKNOWN
    """

    value = value.strip()

    if is_ip_address(value):
        return "IP"

    if is_url(value):
        return "URL"

    if is_md5(value):
        return "MD5"

    if is_sha1(value):
        return "SHA1"

    if is_sha256(value):
        return "SHA256"

    if is_email(value):
        return "EMAIL"

    if is_domain(value):
        return "DOMAIN"

    return "UNKNOWN"