from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS_MAIN = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
NS_REL = {"rel": "http://schemas.openxmlformats.org/package/2006/relationships"}


def column_letters(cell_ref: str) -> str:
    match = re.match(r"([A-Z]+)", cell_ref or "")
    return match.group(1) if match else ""


def normalize_cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    value_node = cell.find("main:v", NS_MAIN)

    if cell_type == "inlineStr":
      inline_node = cell.find("main:is/main:t", NS_MAIN)
      return inline_node.text if inline_node is not None and inline_node.text is not None else ""

    if value_node is None or value_node.text is None:
        return ""

    raw_value = value_node.text

    if cell_type == "s":
        try:
            return shared_strings[int(raw_value)]
        except (ValueError, IndexError):
            return ""

    if cell_type == "b":
        return "TRUE" if raw_value == "1" else "FALSE"

    return raw_value


def load_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        shared_strings_xml = archive.read("xl/sharedStrings.xml")
    except KeyError:
        return []

    root = ET.fromstring(shared_strings_xml)
    values: list[str] = []

    for string_item in root.findall("main:si", NS_MAIN):
        texts = [node.text or "" for node in string_item.findall(".//main:t", NS_MAIN)]
        values.append("".join(texts))

    return values


def resolve_sheet_path(archive: zipfile.ZipFile, requested_sheet: str | None) -> tuple[str, str]:
    workbook_xml = archive.read("xl/workbook.xml")
    workbook_root = ET.fromstring(workbook_xml)

    sheets = workbook_root.findall("main:sheets/main:sheet", NS_MAIN)
    if not sheets:
        raise RuntimeError("Nenhuma worksheet encontrada no arquivo.")

    selected_sheet = None
    if requested_sheet:
        for sheet in sheets:
            if (sheet.attrib.get("name") or "").strip().lower() == requested_sheet.strip().lower():
                selected_sheet = sheet
                break
        if selected_sheet is None:
            raise RuntimeError(f"Aba '{requested_sheet}' nao encontrada na planilha.")
    else:
        selected_sheet = sheets[0]

    relationship_id = selected_sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
    if not relationship_id:
        raise RuntimeError("Nao foi possivel resolver o relationship id da worksheet.")

    rels_xml = archive.read("xl/_rels/workbook.xml.rels")
    rels_root = ET.fromstring(rels_xml)

    target = None
    for relationship in rels_root.findall("rel:Relationship", NS_REL):
        if relationship.attrib.get("Id") == relationship_id:
            target = relationship.attrib.get("Target")
            break

    if not target:
        raise RuntimeError("Nao foi possivel localizar o XML da worksheet selecionada.")

    normalized_target = target[1:] if target.startswith("/") else target
    worksheet_path = normalized_target if normalized_target.startswith("xl/") else f"xl/{normalized_target}"
    sheet_name = selected_sheet.attrib.get("name") or "Planilha1"
    return worksheet_path, sheet_name


def read_xlsx(file_path: Path, requested_sheet: str | None) -> dict:
    with zipfile.ZipFile(file_path, "r") as archive:
        shared_strings = load_shared_strings(archive)
        worksheet_path, sheet_name = resolve_sheet_path(archive, requested_sheet)
        worksheet_xml = archive.read(worksheet_path)

    worksheet_root = ET.fromstring(worksheet_xml)
    rows = worksheet_root.findall("main:sheetData/main:row", NS_MAIN)

    headers_by_column: dict[str, str] = {}
    parsed_rows: list[dict[str, str]] = []

    for row_index, row in enumerate(rows, start=1):
        values_by_column: dict[str, str] = {}

        for cell in row.findall("main:c", NS_MAIN):
            column = column_letters(cell.attrib.get("r", ""))
            values_by_column[column] = normalize_cell_value(cell, shared_strings)

        if row_index == 1:
            headers_by_column = {
                column: value.strip()
                for column, value in values_by_column.items()
                if value.strip()
            }
            continue

        if not headers_by_column:
            raise RuntimeError("Cabecalho da planilha nao encontrado.")

        mapped_row = {
            header: values_by_column.get(column, "")
            for column, header in headers_by_column.items()
        }
        mapped_row["__row_number__"] = str(row_index)
        parsed_rows.append(mapped_row)

    return {"sheetName": sheet_name, "rows": parsed_rows}


def read_csv_file(file_path: Path) -> dict:
    with file_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = []
        for row_index, row in enumerate(reader, start=2):
            normalized = {key or "": value or "" for key, value in row.items()}
            normalized["__row_number__"] = str(row_index)
            rows.append(normalized)

    return {"sheetName": file_path.stem, "rows": rows}


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True)
    parser.add_argument("--sheet")
    args = parser.parse_args()

    file_path = Path(args.file).expanduser().resolve()
    if not file_path.exists():
        print(json.dumps({"error": f"Arquivo nao encontrado: {file_path}"}))
        return 1

    suffix = file_path.suffix.lower()
    try:
        if suffix == ".xlsx":
            payload = read_xlsx(file_path, args.sheet)
        elif suffix == ".csv":
            payload = read_csv_file(file_path)
        else:
            raise RuntimeError("Formato suportado apenas para .xlsx e .csv.")
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": str(exc)}))
        return 1

    print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
