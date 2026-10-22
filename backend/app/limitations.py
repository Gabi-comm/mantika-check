"""Wording the interfaces must show. Screens render these strings; they do not invent claims."""

CONSENT_VERSION = "consent-2026-10"
TPC_BENCHMARK = 25.0

VENDOR_LIMITATIONS = {
    "en": [
        "A strip photograph is not a laboratory measurement of total polar compounds.",
        "This application does not detect pathogens, diagnose illness, or show that reused oil caused an outbreak.",
        "It does not certify legal or regulatory compliance.",
        "Automated color bands are experimental until they are checked against the strip reference.",
        "Logged frying time is only what was entered. It is not a laboratory age of the oil.",
        "No estimate is given for how many hours the oil has left.",
    ],
    "fil": [
        "Ang litrato ng test strip ay hindi sukat ng total polar compounds sa laboratoryo.",
        "Hindi natutukoy ng aplikasyong ito ang mga mikrobyo, hindi ito nagsasabi ng sakit, at hindi nito pinatutunayan na ang muling ginamit na mantika ang sanhi ng pagkalason.",
        "Hindi ito katibayan ng pagsunod sa batas o regulasyon.",
        "Eksperimental ang awtomatikong banda hanggang maikumpara ito sa reference ng strip.",
        "Ang naitalang oras ng prito ay ang ipinasok na oras lamang. Hindi ito edad ng mantika mula sa laboratoryo.",
        "Walang taya kung ilang oras pang magagamit ang mantika.",
    ],
}

LAB_LIMITATIONS = {
    "en": [
        "Li et al. (2020) measured potato-chip frying at 160, 175, 190, 205, and 220°C for 0–30 hours. The paper's methods describe soybean oil and no fresh-oil replenishment. Those curves do not establish accuracy for a Philippine street-food stall.",
        "The crossing threshold in this project is 25% TPC. It is a research benchmark. Li et al. also discuss 27% TPC from a Chinese hygienic standard. Neither number is a Philippine legal limit.",
        "Acid value and carbonyl value are separate measurements. They are not used as TPC.",
        "A 25% crossing is reported only when neighboring observations support it. Otherwise the result is not reached. The line is not extended past the last observed hour.",
        "Strip photographs are not an input to these models.",
        "Vendor-specific hours remaining stay off, including after a laboratory TPC value is recorded.",
    ],
    "fil": [
        "Ang Li et al. (2020) ay sukat ng pagprito ng potato chip sa 160, 175, 190, 205, at 220°C, mula 0 hanggang 30 oras. Inilalarawan ng pamamaraan ang soybean oil at walang dagdag na sariwang mantika. Hindi nito pinatutunayan ang katumpakan para sa isang puwesto sa Pilipinas.",
        "Ang hangganan sa proyektong ito ay 25% TPC. Pananda ito sa pananaliksik. Tinalakay din ng Li et al. ang 27% TPC mula sa isang pamantayang pangkalusugan ng China. Hindi legal na hangganan sa Pilipinas ang alinman sa dalawa.",
        "Hiwalay na sukat ang acid value at carbonyl value. Hindi sila ginagamit bilang TPC.",
        "Inuulat ang tawiran sa 25% lamang kapag may katabing obserbasyon na sumusuporta. Kung wala, ang resulta ay not reached. Hindi hinahaba ang linya lampas sa huling oras na nasukat.",
        "Ang mga litrato ng strip ay hindi input ng mga modelong ito.",
        "Mananatiling sarado ang taya ng natitirang oras para sa isang nagtitinda, kahit may naitalang laboratory TPC.",
    ],
}

SIMULATED_BLOCK = {
    "en": "These rows are simulated wiring data, not Li (2020). Do not report the metrics as study results.",
    "fil": "Gawang-dato ito para masubok ang sistema, hindi Li (2020). Huwag itong iulat bilang resulta ng pag-aaral.",
}

PROVENANCE_NOTE = {
    "en": "Provenance is declared by the person who imported the file. The server does not certify that the file is the Mendeley release 10.17632/4k7b395yxx.",
    "fil": "Ang pinagmulan ay ipinahayag ng nag-import ng file. Hindi pinatutunayan ng server na ito ang Mendeley release 10.17632/4k7b395yxx.",
}

ACCUMULATED_DEFINITION = (
    "Sum of heating_minutes on oil-use sessions plus duration_minutes on heat and reuse events. "
    "Replenishment and replacement are stored and do not add minutes. "
    "This is logged frying time, not a laboratory age of the oil."
)

GROUPING_RULE = (
    "Photographs that share a physical_strip_id are one physical strip. "
    "Keep that group together when splitting data so the same strip cannot land in both train and test."
)

CONSENT_TEXT = {
    "en": (
        "I volunteer to record frying-oil use and chemical test-strip photographs in MANTIKA CHECK. "
        "I understand this is research. It is not a medical test, not a pathogen test, and not a legal or safety certificate for the oil. "
        "My name and stall details are stored apart from the analysis tables. Analysis uses a pseudonym. "
        "I can withdraw. Withdrawal stops new collection. I can ask for the research records to be deleted."
    ),
    "fil": (
        "Kusang-loob akong sasali sa pagtatala ng paggamit ng mantika at mga litrato ng chemical test strip sa MANTIKA CHECK. "
        "Naiintindihan kong pananaliksik ito. Hindi ito pagsusuring medikal, hindi ito pagtuklas ng mikrobyo, at hindi ito katibayan na ligtas o legal ang mantika. "
        "Ang pangalan at detalye ng puwesto ay hiwalay sa talahanayan ng pagsusuri. Pseudonym ang gamit sa pagsusuri. "
        "Maaari akong umatras. Kapag umatras ako, hihinto ang bagong tala. Maaari kong hilingin na burahin ang mga tala ng pananaliksik."
    ),
}

GUIDE_STEPS = {
    "en": [
        "Use a compatible chemical test strip. A photograph of the oil itself is not a reading.",
        "Include the reference color card in the same photograph.",
        "Use even light. Avoid a strong shadow and a colored lamp when you can.",
        "Fill the guide and hold the phone still.",
        "If the photo is too dark, blown out, or unclear, retake it before relying on the band.",
    ],
    "fil": [
        "Gumamit ng katugmang chemical test strip. Ang litrato ng mantika mismo ay hindi basa.",
        "Isama ang reference color card sa parehong litrato.",
        "Gumamit ng pantay na liwanag. Iwasan ang malakas na anino at may kulay na ilaw kung maaari.",
        "Punuin ang gabay at huwag galawin ang telepono.",
        "Kung madilim, sobrang liwanag, o hindi malinaw ang litrato, kuhanan muli bago umasa sa banda.",
    ],
}

UI_RULES = [
    "If reporting_block is not null, show it. Do not relabel those numbers as Li (2020).",
    "If a crossing status is not_reached, show those words. Do not replace them with an hour estimate.",
    "If label_status is incomplete or needs_review, show that state.",
    "If a pilot summary has suppressed true, show the message and do not guess the hidden count.",
    "Vendor observations and the published laboratory series stay on separate screens. The API will not join them.",
    "Render limitation and consent strings from the API in English and Filipino.",
]


def band_copy(source: str, band: str | None, calibration_status: str) -> dict[str, str]:
    shown = band or "unreadable"
    placeholder = calibration_status == "schematic_placeholder"
    if source == "manual":
        en = (
            f"A person set this band to {shown}. The automated reading is kept beside it. "
            "This is still not a total polar compound measurement or a safety decision."
        )
        fil = (
            f"Itinakda ng isang tao ang banda sa {shown}. Nananatili ang awtomatikong basa sa tabi nito. "
            "Hindi pa rin ito sukat ng total polar compounds o hatol ng kaligtasan."
        )
    else:
        en = (
            f"Closest reference patch: {shown}. This is an experimental color group for the photograph. "
            "It is not a total polar compound measurement or a safety decision."
        )
        fil = (
            f"Pinakamalapit na reference patch: {shown}. Eksperimental na grupo ng kulay ito para sa litrato. "
            "Hindi ito sukat ng total polar compounds o hatol ng kaligtasan."
        )
    if placeholder:
        en += " The active calibration is a schematic placeholder, not a chemical standard."
        fil += " Ang aktibong calibration ay placeholder lamang, hindi chemical standard."
    return {"en": en, "fil": fil}
