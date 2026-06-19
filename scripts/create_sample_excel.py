"""Create a sample Excel file matching the Vault/VBA export format."""

from pathlib import Path

from openpyxl import Workbook

OUTPUT = Path(__file__).resolve().parent.parent / "samples" / "sample-lifecycle.xlsx"

TRANSITION_HEADERS = [
    "Id",
    "LifeCycleDefinition",
    "From State",
    "To State",
    "Security",
    "Custom JobTypes",
]

TRANSITION_ROWS = [
    [
        "1",
        "Basic Release Process",
        "Work In Progress",
        "For Review",
        "Engineer:Allow;Manager:Allow;Everyone:Deny",
        "",
    ],
    [
        "2",
        "Basic Release Process",
        "For Review",
        "Released",
        "Manager:Allow;Engineer:Deny;Everyone:Deny",
        "Release Job",
    ],
    [
        "3",
        "Basic Release Process",
        "For Review",
        "Work In Progress",
        "Engineer:Allow;Manager:Allow;Everyone:Deny",
        "",
    ],
    [
        "4",
        "Basic Release Process",
        "Released",
        "Obsolete",
        "Manager:Allow;Everyone:Deny",
        "",
    ],
    [
        "5",
        "Basic Release Process",
        "Work In Progress",
        "Released",
        "Manager:Allow;Engineer:Deny;Everyone:Deny",
        "Fast Track",
    ],
]

STATE_HEADERS = [
    "Id",
    "LifeCycleDefinition",
    "State DisplayName",
    "State Security",
]

STATE_ROWS = [
    [
        "10",
        "Basic Release Process",
        "Work In Progress",
        "Engineer: Read: Allow, Write: Allow, Delete: Deny, Download: Allow; "
        "Manager: Read: Allow, Write: Allow, Delete: Allow, Download: Allow",
    ],
    [
        "11",
        "Basic Release Process",
        "For Review",
        "Engineer: Read: Allow, Write: Deny, Delete: Deny, Download: Allow; "
        "Manager: Read: Allow, Write: Allow, Delete: Allow, Download: Allow",
    ],
    [
        "12",
        "Basic Release Process",
        "Released",
        "Engineer: Read: Allow, Write: Deny, Delete: Deny, Download: Allow; "
        "Manager: Read: Allow, Write: Allow, Delete: Allow, Download: Allow; "
        "Everyone: Read: Allow, Write: Deny, Delete: Deny, Download: Deny",
    ],
    [
        "13",
        "Basic Release Process",
        "Obsolete",
        "Manager: Read: Allow, Write: Allow, Delete: Allow, Download: Allow; "
        "Everyone: Read: Allow, Write: Deny, Delete: Deny, Download: Deny",
    ],
]


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    workbook = Workbook()
    transitions = workbook.active
    transitions.title = "LifeCycleDefinitionTransitions"
    transitions.append(TRANSITION_HEADERS)
    for row in TRANSITION_ROWS:
        transitions.append(row)

    states = workbook.create_sheet("LifeCycleDefinitionStates")
    states.append(STATE_HEADERS)
    for row in STATE_ROWS:
        states.append(row)

    workbook.save(OUTPUT)
    print(f"Sample file created: {OUTPUT}")


if __name__ == "__main__":
    main()
