from fastapi import APIRouter

router = APIRouter()

# ─── Part catalog database ───
# Maps bike part IDs (matching YOLOv8 detection + bikeStore) to aftermarket options
PARTS_CATALOG: dict[str, list[dict]] = {
    "exhaust": [
        {"id": "exhaust_akra_carbon", "brand": "Akrapovic", "model": "Slip-On Line (Carbon)", "style": "sport", "price": 850, "compatible": True, "icon": "💨"},
        {"id": "exhaust_sc_crt",     "brand": "SC Project", "model": "CR-T Muffler",          "style": "sport", "price": 780, "compatible": True, "icon": "💨"},
        {"id": "exhaust_yoshi",      "brand": "Yoshimura",  "model": "Alpha T Stainless",       "style": "retro", "price": 620, "compatible": True, "icon": "💨"},
        {"id": "exhaust_leo_evo",    "brand": "Leo Vince",  "model": "LV-10 Full System",       "style": "sport", "price": 700, "compatible": False, "icon": "💨"},
    ],
    "seat": [
        {"id": "seat_corbin",    "brand": "Corbin",      "model": "Gunfighter Solo",  "style": "custom", "price": 460, "compatible": True,  "icon": "🪑"},
        {"id": "seat_saddle",    "brand": "Saddlemen",   "model": "Step-Up",          "style": "retro",  "price": 410, "compatible": True,  "icon": "🪑"},
        {"id": "seat_low_gel",   "brand": "Airhawk",     "model": "Comfort Seat",     "style": "oem",    "price": 200, "compatible": True,  "icon": "🪑"},
    ],
    "headlight": [
        {"id": "hl_jw_speaker",  "brand": "JW Speaker",  "model": "8790 Adaptive",   "style": "sport",  "price": 510, "compatible": True,  "icon": "💡"},
        {"id": "hl_denali",      "brand": "Denali",       "model": "M5 LED Pod",       "style": "sport",  "price": 290, "compatible": True,  "icon": "💡"},
        {"id": "hl_custom_halo", "brand": "Custom",       "model": "Halo DRL Ring",    "style": "custom", "price": 180, "compatible": True,  "icon": "💡"},
    ],
    "mirror_left": [
        {"id": "mirror_rizoma",  "brand": "Rizoma",       "model": "Tomok",            "style": "sport",  "price": 160, "compatible": True,  "icon": "🪞"},
        {"id": "mirror_puig",    "brand": "Puig",         "model": "Hi-Tech 4",        "style": "sport",  "price": 125, "compatible": True,  "icon": "🪞"},
    ],
    "mirror_right": [
        {"id": "mirror_rizoma",  "brand": "Rizoma",       "model": "Tomok",            "style": "sport",  "price": 160, "compatible": True,  "icon": "🪞"},
        {"id": "mirror_puig",    "brand": "Puig",         "model": "Hi-Tech 4",        "style": "sport",  "price": 125, "compatible": True,  "icon": "🪞"},
    ],
    "front_wheel": [
        {"id": "wheel_marchesini", "brand": "Marchesini",  "model": "M10RS Kompe",    "style": "sport",  "price": 2100, "compatible": False, "icon": "⚙️"},
        {"id": "wheel_excel_ssr",  "brand": "Excel",        "model": "SSR Supermotard","style": "custom", "price": 950,  "compatible": True,  "icon": "⚙️"},
    ],
    "rear_wheel": [
        {"id": "wheel_marchesini_r","brand": "Marchesini", "model": "M10RS Kompe",    "style": "sport",  "price": 2100, "compatible": False, "icon": "⚙️"},
        {"id": "wheel_excel_ssr_r", "brand": "Excel",       "model": "SSR Supermotard","style": "custom", "price": 1100, "compatible": True,  "icon": "⚙️"},
    ],
    "handlebar": [
        {"id": "bar_renthal_twn",  "brand": "Renthal",      "model": "Twinwall 996",   "style": "sport",  "price": 185, "compatible": True,  "icon": "🏍️"},
        {"id": "bar_rizoma_tpe",   "brand": "Rizoma",        "model": "TPE Clip-ons",   "style": "sport",  "price": 310, "compatible": True,  "icon": "🏍️"},
        {"id": "bar_drag_low",     "brand": "Drag Specialties","model": "Low Drag Bar", "style": "retro",  "price": 90,  "compatible": True,  "icon": "🏍️"},
    ],
    "fairing": [
        {"id": "fairing_race_abs", "brand": "Hotbodies", "model": "Race Fairing ABS",  "style": "sport",  "price": 600, "compatible": True,  "icon": "🏁"},
        {"id": "fairing_carbon_fp","brand": "Carbonin",  "model": "Avio Carbon",        "style": "sport",  "price": 1400,"compatible": False, "icon": "🏁"},
    ],
    "fuel_tank": [
        {"id": "tank_unit_garage", "brand": "Unit Garage","model": "Scrambler Tank",   "style": "retro",  "price": 750, "compatible": False, "icon": "⛽"},
        {"id": "tank_carbon_wrap", "brand": "3M",         "model": "Carbon Fiber Wrap", "style": "custom", "price": 120, "compatible": True,  "icon": "⛽"},
    ],
}

# Fallback suggestions shown when no specific catalog exists for that part
GENERIC_SUGGESTIONS = [
    {"id": "generic_wrap",   "brand": "3M",      "model": "Gloss Black Vinyl Wrap",  "style": "custom", "price": 60,  "compatible": True, "icon": "🎨"},
    {"id": "generic_polish", "brand": "Meguiar's","model": "Ultimate Polish Kit",     "style": "oem",    "price": 30,  "compatible": True, "icon": "✨"},
]


@router.get("/parts")
async def get_all_parts():
    """Returns all available parts in the catalog."""
    return PARTS_CATALOG


@router.get("/parts/{part_id}")
async def get_parts_by_id(part_id: str):
    """Returns catalog entries for a specific part ID (e.g. exhaust, seat, headlight)."""
    return PARTS_CATALOG.get(part_id, [])


@router.get("/parts/{part_id}/suggest")
async def suggest_parts(part_id: str, style: str = "all"):
    """
    AI-powered part suggestion endpoint.
    Returns curated aftermarket alternatives for the given part, optionally filtered by style.
    In a real implementation, this would query a vector embedding DB
    (e.g. Pinecone) to find visually or functionally similar parts.
    """
    catalog = PARTS_CATALOG.get(part_id, GENERIC_SUGGESTIONS)

    if style != "all":
        filtered = [p for p in catalog if p.get("style") == style]
        catalog = filtered if filtered else catalog

    return {
        "part_id": part_id,
        "suggestions": catalog,
        "total": len(catalog),
        "powered_by": "catalog_lookup",  # would be 'vector_embedding' in production
    }
