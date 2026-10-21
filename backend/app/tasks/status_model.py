USER_ROLES = {
    "admin",
    "operator",
    "reviewer",
}

TASK_TYPES = {"operation", "quality_review"}

TASK_STATUSES = {
    "waiting",
    "to_do",
    "in_progress",
    "blocked",
    "done",
    "cancelled",
}

OPERATOR_TASK_TYPES = {"operation"}

TransitionRuleType = dict[str, set[str]]
StatusTransitionsType = dict[str, TransitionRuleType]
TaskStatusFlowType = dict[str, StatusTransitionsType]


TASK_STATUS_FLOW: TaskStatusFlowType = {
    "waiting": {
        "cancelled": {
            "roles": {"admin"},
        },
    },
    "to_do": {
        "in_progress": {
            "roles": {"operator", "reviewer", "admin"},
        },
        "done": {
            "roles": {"operator", "reviewer", "admin"},
        },
        "cancelled": {
            "roles": {"admin"},
        },
    },
    "in_progress": {
        "blocked": {
            "roles": {"operator", "admin"},
        },
        "done": {
            "roles": {"operator", "reviewer", "admin"},
        },
    },
    "blocked": {
        "in_progress": {
            "roles": {"operator", "admin"},
        },
        "cancelled": {
            "roles": {"admin"},
        },
    },
    "done": {},
    "cancelled": {},
}
