USER_ROLES = {
    "admin",
    "operator",
    "reviewer",
    "storekeeper",
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
            "roles": {"operator", "reviewer", "storekeeper"},
        },
        "done": {
            "roles": {"reviewer", "storekeeper"},
        },
        "cancelled": {
            "roles": {"admin"},
        },
    },
    "in_progress": {
        "blocked": {
            "roles": {"operator", "storekeeper", "admin"},
        },
        "done": {
            "roles": {"operator", "reviewer", "storekeeper"},
        },
    },
    "blocked": {
        "in_progress": {
            "roles": {"operator", "storekeeper", "admin"},
        },
        "cancelled": {
            "roles": {"admin"},
        },
    },
    "done": {},
    "cancelled": {},
}
