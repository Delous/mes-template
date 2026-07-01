USER_ROLES = {
    "admin",
    "operator",
    "reviewer",
}

TASK_TYPES = {
    "warehouse_delivery",
    "operation",
    "quality_review",
    "transfer",
}

TASK_STATUSES = {
    "waiting",
    "to_do",
    "in_progress",
    "blocked",
    "done",
    "cancelled",
}

LOGISTICS_TASK_TYPES = {
    "warehouse_delivery",
    "transfer",
}

OPERATOR_TASK_TYPES = {
    "operation",
    *LOGISTICS_TASK_TYPES,
}

TransitionRuleType = dict[str, set[str]]
StatusTransitionsType = dict[str, TransitionRuleType]
TaskStatusFlowType = dict[str, StatusTransitionsType]


TASK_STATUS_FLOW: TaskStatusFlowType = {
    "waiting": {
        "to_do": {
            "roles": {"admin"},
        },
        "cancelled": {
            "roles": {"admin"},
        },
    },
    "to_do": {
        "in_progress": {
            "roles": {"operator", "reviewer"},
        },
        "done": {
            "roles": {"operator", "reviewer"},
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
            "roles": {"operator", "reviewer"},
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
