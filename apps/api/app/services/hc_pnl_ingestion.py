import io

import openpyxl
import pandas as pd

HC_PNL_SHEET_NAMES = {"Project Level", "Resource Level"}

_MONTH_INDEX = {
    "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
    "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12,
}

_PROJECT_HEADER_ROW = 5
_PROJECT_YEAR_ROW = 2
_ACCOUNT_COL = 3
_PROGRAM_NAME_COL = 6
_PROJECT_ID_COL = 4
_KPI_COL = 7

_RESOURCE_HEADER_ROW = 2

_MONTH_ABBREV = {"Aug": "August", "Sep": "September", "Oct": "October", "Nov": "November"}


def is_hc_pnl_workbook(filename: str, content: bytes) -> bool:
    if not filename.lower().endswith((".xlsx", ".xlsm")):
        return False
    try:
        wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    except Exception:  # noqa: BLE001 - not a workbook we can inspect, so not this format
        return False
    return HC_PNL_SHEET_NAMES.issubset(set(wb.sheetnames))


def _month_total_columns(ws) -> dict[int, tuple[int, int]]:
    """Map column index -> (year, month) for each "<Month> Total" column in the Project Level sheet.

    The "Total" column's own header rows hold a quarter/year, not the month, so the month name is
    read from the header text itself (abbreviated for Aug-Nov) and the year from the column to its
    left, which belongs to the same month's ONSHORE/OFFSHORE/NEARSHORE group.
    """
    columns: dict[int, tuple[int, int]] = {}
    for col in range(2, ws.max_column + 1):
        header = ws.cell(row=_PROJECT_HEADER_ROW, column=col).value
        if not isinstance(header, str) or not header.endswith(" Total"):
            continue
        month_name = _MONTH_ABBREV.get(header[: -len(" Total")], header[: -len(" Total")])
        if month_name not in _MONTH_INDEX:
            continue
        year = ws.cell(row=_PROJECT_YEAR_ROW, column=col - 1).value
        if year:
            columns[col] = (int(year), _MONTH_INDEX[month_name])
    return columns


def parse_hc_pnl_financial(content: bytes) -> pd.DataFrame:
    """Unpivot the 'Project Level' sheet's Income/Expense KPI rows into one row per project per month."""
    wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    ws = wb["Project Level"]
    month_columns = _month_total_columns(ws)

    buckets: dict[tuple[str, str, int, int], dict[str, float]] = {}
    for row in range(_PROJECT_HEADER_ROW + 1, ws.max_row + 1):
        kpi = ws.cell(row=row, column=_KPI_COL).value
        if kpi not in ("Income", "Expense"):
            continue
        account = ws.cell(row=row, column=_ACCOUNT_COL).value
        program = ws.cell(row=row, column=_PROGRAM_NAME_COL).value
        if not account or not program:
            continue
        for col, (year, month) in month_columns.items():
            value = ws.cell(row=row, column=col).value
            if value is None or isinstance(value, str):
                continue
            key = (str(account), str(program), year, month)
            bucket = buckets.setdefault(key, {"revenue": 0.0, "cost": 0.0})
            bucket["revenue" if kpi == "Income" else "cost"] += float(value)

    rows = [
        {
            "account_name": account,
            "program_name": program,
            "period": f"{year:04d}-{month:02d}-01",
            "revenue": bucket["revenue"],
            "cost": bucket["cost"],
        }
        for (account, program, year, month), bucket in buckets.items()
    ]
    return pd.DataFrame(rows, columns=["account_name", "program_name", "period", "revenue", "cost"])


def _project_id_to_program_name(ws) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for row in range(_PROJECT_HEADER_ROW + 1, ws.max_row + 1):
        project_id = ws.cell(row=row, column=_PROJECT_ID_COL).value
        program = ws.cell(row=row, column=_PROGRAM_NAME_COL).value
        if project_id and program:
            mapping[str(project_id)] = str(program)
    return mapping


def parse_hc_pnl_utilization(content: bytes) -> pd.DataFrame:
    """Read the 'Resource Level' sheet (already one row per employee per month) into the canonical shape.

    The sheet has no year column, so periods use the single fiscal year found on the Project Level
    sheet's header row, and no explicit bench flag, so on_bench is inferred from zero billed headcount.
    """
    wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    project_ws = wb["Project Level"]
    project_id_to_program = _project_id_to_program_name(project_ws)
    year = next(iter(_month_total_columns(project_ws).values()), (None, None))[0]

    ws = wb["Resource Level"]
    header = {ws.cell(row=_RESOURCE_HEADER_ROW, column=c).value: c for c in range(1, ws.max_column + 1)}

    def cell(row: int, name: str):
        col = header.get(name)
        return ws.cell(row=row, column=col).value if col else None

    rows = []
    for row in range(_RESOURCE_HEADER_ROW + 1, ws.max_row + 1):
        project_id = cell(row, "Project ID")
        resource_name = cell(row, "Employee Name")
        month_name = cell(row, "Month")
        if not project_id or not resource_name or month_name not in _MONTH_INDEX:
            continue
        program_name = project_id_to_program.get(str(project_id))
        if program_name is None:
            continue
        allocation_pct = cell(row, "Adj Utilization%") or 0.0
        billed_headcount = cell(row, "Billed Headcount") or 0
        rows.append(
            {
                "program_name": program_name,
                "resource_name": str(resource_name),
                "period": f"{year:04d}-{_MONTH_INDEX[month_name]:02d}-01",
                "allocation_pct": float(allocation_pct),
                "on_bench": billed_headcount == 0,
            }
        )
    return pd.DataFrame(rows, columns=["program_name", "resource_name", "period", "allocation_pct", "on_bench"])
