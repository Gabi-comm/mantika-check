CONTRACT_VERSION = "1"

META = {
    "name": "MANTIKA CHECK",
    "contract_version": CONTRACT_VERSION,
    "phase": 1,
    "docs": "/docs",
    "openapi": "/openapi.json",
    "platforms": {
        "vendor": "Responsive web first. A dedicated mobile app can call the same routes later.",
        "research": "Web application for datasets, models, strip review, and pilot records.",
    },
    "services_are_separate": ["strip_color", "tpc_forecast"],
    "flags": {
        "vendor_hours_remaining": False,
        "strip_photograph_is_tpc": False,
        "pathogen_detection": False,
        "regulatory_compliance": False,
    },
    "roles": ["vendor", "researcher", "administrator"],
    "languages": ["en", "fil"],
    "error_shape": {"detail": {"code": "string", "message": "string"}},
    "idempotency": "Send client_mutation_id on oil sessions, events, and strip uploads. A retry returns the original record.",
    "do_not_overlay": "Vendor observations and published laboratory series are separate endpoints on purpose.",
    "ui_rules": [
        "If reporting_block is not null, show it. Do not relabel those numbers as Li (2020).",
        "If a crossing status is not_reached, show those words. Do not replace them with an hour estimate.",
        "If label_status is incomplete or needs_review, show that state.",
        "If a pilot summary has suppressed true, show the message and do not guess the hidden count.",
        "Do not draw vendor observations on the published laboratory chart.",
        "Render limitation and consent strings from the API in English and Filipino.",
    ],
    "phase_2_not_in_this_api": [
        "Native camera",
        "Offline SQLite on the phone",
        "Background sync",
    ],
}
