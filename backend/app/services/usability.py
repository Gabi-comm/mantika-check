"""Usability sessions for the research overview and reporting screens.

A mean is withheld until five consented vendors. Practice sessions stay out of that mean.
"""

from pydantic import BaseModel, ConfigDict

from app.models import UsabilitySession

MINIMUM_SESSIONS = 5
TASKS = ("log", "scan", "history")


class UsabilityIn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    consented: bool = False
    sus: float
    tasks: dict


class UsabilityError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def record_session(db, body: dict) -> UsabilitySession:
    tasks = body.get("tasks")
    if not isinstance(tasks, dict):
        raise UsabilityError("tasks_missing", "Send the three task results.")
    cleaned = {}
    for key in TASKS:
        item = tasks.get(key)
        if not isinstance(item, dict) or "success" not in item or "seconds" not in item:
            raise UsabilityError("task_incomplete", f"Task {key} needs success and seconds.")
        seconds = item["seconds"]
        if isinstance(seconds, bool) or not isinstance(seconds, (int, float)) or seconds < 0:
            raise UsabilityError("task_seconds", f"Task {key} needs a completion time of zero or more seconds.")
        cleaned[key] = {"success": bool(item["success"]), "seconds": int(seconds)}
    try:
        sus = float(body["sus"])
    except (KeyError, TypeError, ValueError) as exc:
        raise UsabilityError("sus_missing", "Send a System Usability Scale score from 0 to 100.") from exc
    if sus < 0 or sus > 100:
        raise UsabilityError("sus_range", "The System Usability Scale score must be from 0 to 100.")
    consented = bool(body.get("consented"))
    row = UsabilitySession(
        consented=consented,
        practice=not consented,
        sus=sus,
        tasks_json=cleaned,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def summary(rows: list[UsabilitySession]) -> dict:
    consented = [row for row in rows if row.consented and not row.practice]
    report = {
        "minimum_sessions": MINIMUM_SESSIONS,
        "consented_sessions": len(consented),
        "practice_sessions_excluded": sum(1 for row in rows if row.practice or not row.consented),
        "finding": False,
        "status": "not_started" if not consented else "in_progress",
        "mean_sus": None,
        "task_success": None,
        "fills_screens": ["v2-WOverview", "v2-WReporting"],
    }
    if len(consented) < MINIMUM_SESSIONS:
        return report
    report["finding"] = True
    report["status"] = "ready"
    report["mean_sus"] = round(sum(row.sus for row in consented) / len(consented), 1)

    def rate(key: str) -> dict:
        success = sum(1 for row in consented if row.tasks_json[key]["success"])
        return {"success": success, "of": len(consented)}

    report["task_success"] = {key: rate(key) for key in TASKS}
    return report
