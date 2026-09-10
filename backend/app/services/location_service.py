"""Simulated threat-location generator for demo/presentation use.

This module does NOT determine a caller's real physical location. It creates a
stable, plausible-looking point near a selected Indian city for the UI demo.

The selection is deterministic and uses hashlib only; no random module is used.
The same session_id always produces the same simulated location.
"""

import hashlib

CITIES = [
    ("Delhi", 28.6139, 77.2090),
    ("Mumbai", 19.0760, 72.8777),
    ("Bengaluru", 12.9716, 77.5946),
    ("Hyderabad", 17.3850, 78.4866),
    ("Chennai", 13.0827, 80.2707),
    ("Kolkata", 22.5726, 88.3639),
    ("Pune", 18.5204, 73.8567),
    ("Ahmedabad", 23.0225, 72.5714),
    ("Jaipur", 26.9124, 75.7873),
    ("Lucknow", 26.8467, 80.9462),
    ("Chandigarh", 30.7333, 76.7794),
    ("Bhopal", 23.2599, 77.4126),
    ("Noida", 28.5355, 77.3910),
    ("Gurugram", 28.4595, 77.0266),
    ("Kochi", 9.9312, 76.2673),
]

def _stable_number(session_id: str, salt: str) -> int:
    """Convert session_id + salt into a stable non-negative integer."""
    digest = hashlib.sha256(
        f"{session_id}:{salt}".encode("utf-8")
    ).digest()
    return int.from_bytes(digest[:8], "big")

def get_simulated_threat_location(session_id: str) -> dict:
    """Return one stable simulated location for the whole call session."""
    if not session_id:
        session_id = "voiceguardian-demo"

    city_index = _stable_number(session_id, "city") % len(CITIES)
    city, latitude, longitude = CITIES[city_index]

    lat_unit = _stable_number(session_id, "latitude") / float(2**64 - 1)
    lon_unit = _stable_number(session_id, "longitude") / float(2**64 - 1)

    latitude += (lat_unit - 0.5) * 0.09
    longitude += (lon_unit - 0.5) * 0.09

    return {
        "city": city,
        "latitude": round(latitude, 5),
        "longitude": round(longitude, 5),
        "simulated": True,
    }
