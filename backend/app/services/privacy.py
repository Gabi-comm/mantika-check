from app.limitations import GROUPING_RULE

MINIMUM_STALLS = 5


def area_summary(stall_count: int, session_count: int, strip_count: int) -> dict:
    if stall_count < MINIMUM_STALLS:
        return {
            "suppressed": True,
            "minimum_stalls": MINIMUM_STALLS,
            "message": "Pilot-area summaries are withheld when fewer than five stalls are in the group.",
        }
    return {
        "suppressed": False,
        "minimum_stalls": MINIMUM_STALLS,
        "stalls": stall_count,
        "sessions": session_count,
        "strips": strip_count,
    }


def split_leaks(train_ids: list[str], test_ids: list[str]) -> list[str]:
    return sorted(set(train_ids) & set(test_ids))


def split_report(train_ids: list[str], test_ids: list[str]) -> dict:
    leaks = split_leaks(train_ids, test_ids)
    return {
        "ok": not leaks,
        "leaks": leaks,
        "grouping_rule": GROUPING_RULE,
    }
