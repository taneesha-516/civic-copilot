DEPARTMENT_MAP = {
    "Road": "PWD",
    "Garbage": "Municipal Corporation",
    "Water": "Water Department",
    "Electricity": "Electricity Department",
    "Streetlight": "Municipal Electrical Division",
    "Drainage": "Drainage Department"
}

def route_department(issue_type):
    return DEPARTMENT_MAP.get(
        issue_type,
        "Municipal Corporation"
    )