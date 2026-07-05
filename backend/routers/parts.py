from fastapi import APIRouter

router = APIRouter()

# Mocked database of parts
MOCK_PARTS = {
    "tyres": [
        {"id": "t1", "brand": "Pirelli", "model": "Diablo Rosso IV", "price": 250, "image": "/images/parts/tyre_pirelli.png"},
        {"id": "t2", "brand": "Michelin", "model": "Road 6", "price": 220, "image": "/images/parts/tyre_michelin.png"},
        {"id": "t3", "brand": "Dunlop", "model": "Mutant", "price": 200, "image": "/images/parts/tyre_dunlop.png"}
    ],
    "exhaust": [
        {"id": "e1", "brand": "Akrapovic", "model": "Slip-On Line (Carbon)", "price": 800, "image": "/images/parts/exhaust_akra.png"},
        {"id": "e2", "brand": "SC Project", "model": "CR-T Muffler", "price": 750, "image": "/images/parts/exhaust_sc.png"},
        {"id": "e3", "brand": "Yoshimura", "model": "Alpha T", "price": 600, "image": "/images/parts/exhaust_yoshi.png"}
    ],
    "mirrors": [
        {"id": "m1", "brand": "Rizoma", "model": "Tomok", "price": 150, "image": "/images/parts/mirror_rizoma.png"},
        {"id": "m2", "brand": "Puig", "model": "Hi-Tech 4", "price": 120, "image": "/images/parts/mirror_puig.png"}
    ],
    "headlight": [
        {"id": "h1", "brand": "JW Speaker", "model": "8790 Adaptive", "price": 500, "image": "/images/parts/headlight_jw.png"},
        {"id": "h2", "brand": "Kuryakyn", "model": "Orbit", "price": 200, "image": "/images/parts/headlight_kur.png"}
    ],
    "seat": [
        {"id": "s1", "brand": "Corbin", "model": "Gunfighter", "price": 450, "image": "/images/parts/seat_corbin.png"},
        {"id": "s2", "brand": "Saddlemen", "model": "Step-Up", "price": 400, "image": "/images/parts/seat_saddle.png"}
    ]
}

@router.get("/parts")
async def get_all_parts():
    """Returns all available parts categorized."""
    return MOCK_PARTS

@router.get("/parts/{category}")
async def get_parts_by_category(category: str):
    """Returns available parts for a specific category."""
    if category in MOCK_PARTS:
        return MOCK_PARTS[category]
    return []
