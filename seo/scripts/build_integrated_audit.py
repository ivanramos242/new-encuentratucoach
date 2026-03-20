from __future__ import annotations

import argparse
import csv
import math
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import urlparse, urlunparse
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile
import xml.etree.ElementTree as ET


BASE_URL = "https://encuentratucoach.es"
DEFAULT_GSC_CANDIDATES = [
    Path("/mnt/data/encuentratucoach.es-Performance-on-Search-2026-03-20.xlsx"),
    Path("C:/Users/Ivan Ramos/Downloads/encuentratucoach.es-Performance-on-Search-2026-03-20.xlsx"),
]
DEFAULT_SPIDER_CANDIDATES = [
    Path("/mnt/data/internos_todo.xlsx"),
    Path("C:/Users/Ivan Ramos/Desktop/internos_todo.xlsx"),
]
MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"


@dataclass
class SheetInfo:
    name: str
    target: str


def simplify_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    return "".join(ch for ch in normalized if not unicodedata.combining(ch)).strip().lower()


def pick_input_path(explicit: str | None, candidates: list[Path], label: str) -> Path:
    if explicit:
        path = Path(explicit)
        if path.exists():
            return path
        raise FileNotFoundError(f"{label} not found: {path}")

    for candidate in candidates:
        if candidate.exists():
            return candidate
    joined = ", ".join(str(candidate) for candidate in candidates)
    raise FileNotFoundError(f"{label} not found. Checked: {joined}")


def column_index_from_ref(cell_ref: str) -> int:
    letters = "".join(ch for ch in cell_ref if ch.isalpha())
    index = 0
    for ch in letters:
        index = index * 26 + (ord(ch.upper()) - 64)
    return max(index - 1, 0)


def read_shared_strings(archive: ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return ["".join(node.itertext()) for node in root]


def load_workbook_sheets(path: Path) -> list[SheetInfo]:
    with ZipFile(path) as archive:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))

    rel_map = {}
    for rel in rels:
        rel_id = rel.attrib.get("Id")
        target = rel.attrib.get("Target", "")
        if rel_id:
            rel_map[rel_id] = target.replace("../", "")

    sheets = []
    for sheet in workbook.findall(f"{{{MAIN_NS}}}sheets/{{{MAIN_NS}}}sheet"):
        rel_id = sheet.attrib.get(f"{{{REL_NS}}}id")
        name = sheet.attrib.get("name", "")
        target = rel_map.get(rel_id, "")
        if target:
            sheets.append(SheetInfo(name=name, target=f"xl/{target}"))
    return sheets


def parse_cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    value_node = cell.find(f"{{{MAIN_NS}}}v")
    inline_node = cell.find(f"{{{MAIN_NS}}}is")

    if cell_type == "inlineStr" and inline_node is not None:
        return "".join(inline_node.itertext())
    if cell_type == "s" and value_node is not None and value_node.text is not None:
        index = int(value_node.text)
        return shared_strings[index] if 0 <= index < len(shared_strings) else ""
    if value_node is not None and value_node.text is not None:
        return value_node.text
    return ""


def read_sheet_rows(path: Path, sheet_name: str | None = None, fallback_index: int = 0) -> list[dict[str, str]]:
    sheets = load_workbook_sheets(path)
    if not sheets:
        return []

    selected = None
    if sheet_name:
        target_name = simplify_text(sheet_name)
        for sheet in sheets:
            if simplify_text(sheet.name) == target_name:
                selected = sheet
                break
    if selected is None:
        selected = sheets[min(fallback_index, len(sheets) - 1)]

    with ZipFile(path) as archive:
        shared_strings = read_shared_strings(archive)
        root = ET.fromstring(archive.read(selected.target))

    rows = root.find(f"{{{MAIN_NS}}}sheetData")
    if rows is None:
        return []

    matrix: list[list[str]] = []
    for row in rows.findall(f"{{{MAIN_NS}}}row"):
        cells: dict[int, str] = {}
        max_index = -1
        for cell in row.findall(f"{{{MAIN_NS}}}c"):
            ref = cell.attrib.get("r", "")
            col_index = column_index_from_ref(ref)
            cells[col_index] = parse_cell_value(cell, shared_strings)
            max_index = max(max_index, col_index)
        if max_index < 0:
            continue
        values = [cells.get(index, "") for index in range(max_index + 1)]
        matrix.append(values)

    if not matrix:
        return []

    headers = [value.strip() or f"column_{index + 1}" for index, value in enumerate(matrix[0])]
    records: list[dict[str, str]] = []
    for row in matrix[1:]:
        padded = row + [""] * (len(headers) - len(row))
        record = {header: padded[index].strip() for index, header in enumerate(headers)}
        if any(value for value in record.values()):
            records.append(record)
    return records


def pick_sheet_name(path: Path, expected_name: str, fallback_index: int) -> tuple[str | None, int]:
    sheets = load_workbook_sheets(path)
    expected = simplify_text(expected_name)
    for index, sheet in enumerate(sheets):
        if simplify_text(sheet.name) == expected:
            return sheet.name, index
    return None, fallback_index


def parse_float(value: str | None) -> float | None:
    if value is None:
        return None
    text = value.strip().replace("%", "").replace(",", ".")
    if not text:
        return None
    try:
        parsed = float(text)
    except ValueError:
        return None
    if math.isnan(parsed) or math.isinf(parsed):
        return None
    return parsed


def parse_int(value: str | None) -> int | None:
    parsed = parse_float(value)
    if parsed is None:
        return None
    return int(round(parsed))


def normalize_url(value: str | None) -> str:
    if not value:
        return ""

    raw = value.strip()
    if not raw:
        return ""

    if raw.startswith("/"):
        raw = f"{BASE_URL}{raw}"
    elif not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", raw):
        raw = f"{BASE_URL}/{raw.lstrip('/')}"

    parsed = urlparse(raw)
    host = parsed.netloc.lower()
    path = parsed.path or "/"
    path = re.sub(r"/{2,}", "/", path)
    if path != "/":
        path = path.rstrip("/")
        if not path.startswith("/"):
            path = f"/{path}"

    cleaned = parsed._replace(scheme="https", netloc=host, path=path, query="", fragment="")
    return urlunparse(cleaned)


def get_first(record: dict[str, str], candidates: Iterable[str], default: str = "") -> str:
    for candidate in candidates:
        if candidate in record and record[candidate] != "":
            return record[candidate]
    return default


def build_gsc_rows(path: Path) -> list[dict[str, object]]:
    sheet_name, fallback = pick_sheet_name(path, "Paginas", 2)
    rows = read_sheet_rows(path, sheet_name, fallback)

    output = []
    for row in rows:
        source_url = get_first(row, ["Páginas principales", "Pages", "Page"])
        normalized_url = normalize_url(source_url)
        if not normalized_url:
            continue

        clicks = parse_int(get_first(row, ["Clics", "Clicks"]))
        impressions = parse_int(get_first(row, ["Impresiones", "Impressions"]))
        ctr = parse_float(get_first(row, ["CTR"]))
        position = parse_float(get_first(row, ["Posición", "Position"]))

        output.append(
            {
                "source_url": source_url,
                "normalized_url": normalized_url,
                "clicks": clicks if clicks is not None else 0,
                "impressions": impressions if impressions is not None else 0,
                "ctr": ctr if ctr is not None else 0.0,
                "position": position if position is not None else 0.0,
            }
        )
    return output


def build_spider_rows(path: Path) -> list[dict[str, object]]:
    rows = read_sheet_rows(path, "1 - Todo", 0)

    output = []
    for row in rows:
        source_url = get_first(row, ["Dirección", "Address"])
        normalized_url = normalize_url(source_url)
        if not normalized_url:
            continue

        canonical_raw = get_first(row, ["Elemento de enlace canónico 1", "Canonical Link Element 1"])
        redirect_raw = get_first(row, ["URL de redirección", "Redirect URL"])
        structured_data = get_first(
            row,
            ["Datos estructurados", "Structured Data", "Structured Data 1"],
            "UNSPECIFIED",
        )
        hreflang = get_first(
            row,
            ["Hreflang", "Hreflang 1", "Enlace alternativo móvil"],
            "UNSPECIFIED",
        )

        output.append(
            {
                "source_url": source_url,
                "normalized_url": normalized_url,
                "content_type": get_first(row, ["Tipo de contenido", "Content Type"]),
                "status_code": parse_int(get_first(row, ["Código de respuesta", "Status Code"])),
                "response_text": get_first(row, ["Respuesta", "Status"]),
                "indexability": get_first(row, ["Indexabilidad", "Indexability"]),
                "indexability_status": get_first(
                    row,
                    ["Estado de indexabilidad", "Indexability Status"],
                ),
                "title": get_first(row, ["Título 1", "Title 1"]),
                "meta_description": get_first(
                    row,
                    ["Meta description 1", "Meta Description 1"],
                ),
                "h1": get_first(row, ["H1-1"]),
                "meta_robots": get_first(row, ["Meta robots 1", "Meta Robots 1"]),
                "x_robots_tag": get_first(row, ["X-Robots-Tag 1"]),
                "canonical_url": normalize_url(canonical_raw),
                "canonical_url_raw": canonical_raw,
                "word_count": parse_int(get_first(row, ["Recuento de palabras", "Word Count"])),
                "internal_links": parse_int(get_first(row, ["Enlaces internos", "Inlinks"])),
                "unique_internal_links": parse_int(
                    get_first(row, ["Enlaces internos únicos", "Unique Inlinks"])
                ),
                "response_time_seconds": parse_float(
                    get_first(row, ["Tiempo de respuesta", "Response Time"])
                ),
                "redirect_url": normalize_url(redirect_raw),
                "redirect_url_raw": redirect_raw,
                "redirect_type": get_first(row, ["Tipo de redirección", "Redirect Type"]),
                "language": get_first(row, ["Language"]),
                "http_version": get_first(row, ["Versión HTTP", "HTTP Version"]),
                "structured_data": structured_data or "UNSPECIFIED",
                "hreflang": hreflang or "UNSPECIFIED",
                "crawl_timestamp": get_first(row, ["Marca temporal del rastreo", "Crawl Timestamp"]),
            }
        )
    return output


def follow_redirect_chain(start_url: str, redirect_map: dict[str, str]) -> tuple[list[str], str, bool]:
    visited = [start_url]
    seen = {start_url}
    current = start_url

    while current in redirect_map and redirect_map[current]:
        next_url = redirect_map[current]
        visited.append(next_url)
        if next_url in seen:
            return visited, next_url, True
        seen.add(next_url)
        current = next_url

    return visited, visited[-1], False


def build_redirect_chains(spider_rows: list[dict[str, object]]) -> list[dict[str, object]]:
    redirect_map = {
        row["normalized_url"]: row["redirect_url"]
        for row in spider_rows
        if row.get("status_code") in {301, 302, 307, 308}
        and row.get("redirect_url")
        and row["normalized_url"] != row["redirect_url"]
    }
    status_map = {row["normalized_url"]: row.get("status_code") for row in spider_rows}

    chains = []
    for source_url in sorted(redirect_map):
        chain_urls, final_url, loop_detected = follow_redirect_chain(source_url, redirect_map)
        hops = max(len(chain_urls) - 1, 0)
        if hops < 2:
            continue

        chains.append(
            {
                "source_url": source_url,
                "chain_path": " -> ".join(chain_urls),
                "hop_count": hops,
                "final_url": final_url,
                "final_status_code": status_map.get(final_url) or "",
                "loop_detected": "YES" if loop_detected else "NO",
            }
        )
    return chains


def build_merged_rows(
    gsc_rows: list[dict[str, object]],
    spider_rows: list[dict[str, object]],
) -> list[dict[str, object]]:
    gsc_map = {row["normalized_url"]: row for row in gsc_rows}
    spider_map = {row["normalized_url"]: row for row in spider_rows}
    all_urls = sorted(
        set(gsc_map).union(spider_map),
        key=lambda url: (
            -(gsc_map.get(url, {}).get("clicks", 0) or 0),
            -(gsc_map.get(url, {}).get("impressions", 0) or 0),
            url,
        ),
    )

    merged = []
    for url in all_urls:
        gsc = gsc_map.get(url, {})
        spider = spider_map.get(url, {})
        merged.append(
            {
                "normalized_url": url,
                "gsc_source_url": gsc.get("source_url", ""),
                "spider_source_url": spider.get("source_url", ""),
                "in_gsc": "YES" if gsc else "NO",
                "in_spider": "YES" if spider else "NO",
                "clicks": gsc.get("clicks", 0),
                "impressions": gsc.get("impressions", 0),
                "ctr": gsc.get("ctr", 0.0),
                "position": gsc.get("position", 0.0),
                "status_code": spider.get("status_code", ""),
                "content_type": spider.get("content_type", ""),
                "indexability": spider.get("indexability", ""),
                "indexability_status": spider.get("indexability_status", ""),
                "canonical_url": spider.get("canonical_url", ""),
                "meta_robots": spider.get("meta_robots", ""),
                "x_robots_tag": spider.get("x_robots_tag", ""),
                "title": spider.get("title", ""),
                "meta_description": spider.get("meta_description", ""),
                "h1": spider.get("h1", ""),
                "word_count": spider.get("word_count", ""),
                "internal_links": spider.get("internal_links", ""),
                "unique_internal_links": spider.get("unique_internal_links", ""),
                "redirect_url": spider.get("redirect_url", ""),
                "redirect_type": spider.get("redirect_type", ""),
                "structured_data": spider.get("structured_data", "UNSPECIFIED"),
                "hreflang": spider.get("hreflang", "UNSPECIFIED"),
            }
        )
    return merged


def build_issue_rows(
    merged_rows: list[dict[str, object]],
    redirect_chains: list[dict[str, object]],
    spider_rows: list[dict[str, object]],
) -> list[dict[str, object]]:
    issues: list[dict[str, object]] = []
    spider_url_map = {row["normalized_url"]: row for row in spider_rows}

    for row in merged_rows:
        url = str(row["normalized_url"])
        clicks = int(row.get("clicks", 0) or 0)
        impressions = int(row.get("impressions", 0) or 0)
        status_code = row.get("status_code")
        content_type = str(row.get("content_type", "") or "")
        canonical_url = str(row.get("canonical_url", "") or "")
        meta_robots = str(row.get("meta_robots", "") or "")
        x_robots_tag = str(row.get("x_robots_tag", "") or "")

        if row.get("in_gsc") == "YES" and row.get("in_spider") == "NO":
            issues.append(
                {
                    "issue_type": "GSC_URL_MISSING_IN_SPIDER",
                    "url": url,
                    "clicks": clicks,
                    "impressions": impressions,
                    "details": "URL con demanda en GSC pero ausente del crawl integrado.",
                }
            )

        if status_code in {404, 410, 500} and (clicks > 0 or impressions > 0):
            issues.append(
                {
                    "issue_type": "GSC_URL_NON_200",
                    "url": url,
                    "clicks": clicks,
                    "impressions": impressions,
                    "details": f"URL con demanda en GSC y respuesta {status_code}.",
                }
            )

        if status_code == 200 and content_type.startswith("text/html") and not canonical_url:
            issues.append(
                {
                    "issue_type": "HTML_200_MISSING_CANONICAL",
                    "url": url,
                    "clicks": clicks,
                    "impressions": impressions,
                    "details": "Pagina HTML 200 sin canonical declarada.",
                }
            )

        if status_code == 200 and canonical_url and canonical_url != url:
            issues.append(
                {
                    "issue_type": "CANONICAL_TO_OTHER_URL",
                    "url": url,
                    "clicks": clicks,
                    "impressions": impressions,
                    "details": f"Canonical declarada a {canonical_url}.",
                }
            )

        if status_code == 200 and canonical_url:
            canonical_row = spider_url_map.get(canonical_url)
            if canonical_row and canonical_row.get("status_code") in {301, 302, 307, 308}:
                issues.append(
                    {
                        "issue_type": "CANONICAL_TARGET_REDIRECTS",
                        "url": url,
                        "clicks": clicks,
                        "impressions": impressions,
                        "details": f"La canonical apunta a {canonical_url}, que redirige.",
                    }
                )

        if "/_next/image" in url and "noindex" not in x_robots_tag.lower():
            issues.append(
                {
                    "issue_type": "INTERNAL_ENDPOINT_INDEXABLE",
                    "url": url,
                    "clicks": clicks,
                    "impressions": impressions,
                    "details": "Endpoint tecnico rastreable sin X-Robots-Tag noindex.",
                }
            )

        if status_code == 200 and content_type.startswith("text/html") and "noindex" in (
            f"{meta_robots} {x_robots_tag}".lower()
        ) and clicks > 0:
            issues.append(
                {
                    "issue_type": "GSC_DEMAND_ON_NOINDEX_URL",
                    "url": url,
                    "clicks": clicks,
                    "impressions": impressions,
                    "details": "URL con clicks en GSC marcada noindex en crawl.",
                }
            )

    for chain in redirect_chains:
        issues.append(
            {
                "issue_type": "REDIRECT_CHAIN_GTE_2",
                "url": chain["source_url"],
                "clicks": 0,
                "impressions": 0,
                "details": chain["chain_path"],
            }
        )

    grouped: dict[str, dict[str, object]] = {}
    for issue in issues:
        issue_type = str(issue["issue_type"])
        if issue_type not in grouped:
            grouped[issue_type] = {
                "issue_type": issue_type,
                "count": 0,
                "total_clicks": 0,
                "total_impressions": 0,
                "sample_urls": [],
                "details": issue["details"],
            }
        item = grouped[issue_type]
        item["count"] = int(item["count"]) + 1
        item["total_clicks"] = int(item["total_clicks"]) + int(issue.get("clicks", 0) or 0)
        item["total_impressions"] = int(item["total_impressions"]) + int(
            issue.get("impressions", 0) or 0
        )
        samples = item["sample_urls"]
        if isinstance(samples, list) and len(samples) < 5:
            samples.append(issue["url"])

    summary_rows = []
    for issue_type, item in sorted(grouped.items()):
        samples = item["sample_urls"]
        summary_rows.append(
            {
                "issue_type": issue_type,
                "count": item["count"],
                "total_clicks": item["total_clicks"],
                "total_impressions": item["total_impressions"],
                "sample_urls": " | ".join(samples if isinstance(samples, list) else []),
                "details": item["details"],
            }
        )
    return summary_rows


def build_gsc_missing_rows(
    gsc_rows: list[dict[str, object]],
    spider_rows: list[dict[str, object]],
) -> list[dict[str, object]]:
    spider_urls = {row["normalized_url"] for row in spider_rows}
    missing = [row for row in gsc_rows if row["normalized_url"] not in spider_urls]
    missing.sort(key=lambda row: (-(row["clicks"] or 0), -(row["impressions"] or 0), row["normalized_url"]))
    return missing


def write_csv_file(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(rows[0].keys()) if rows else []
    with path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        if fieldnames:
            writer.writeheader()
            writer.writerows(rows)


def excel_column_name(index: int) -> str:
    letters = ""
    current = index + 1
    while current:
        current, remainder = divmod(current - 1, 26)
        letters = chr(65 + remainder) + letters
    return letters


def sanitize_sheet_name(name: str, used: set[str]) -> str:
    cleaned = re.sub(r"[\[\]\*:/\\?]", "-", name).strip() or "Sheet"
    cleaned = cleaned[:31]
    candidate = cleaned
    counter = 1
    while candidate in used:
        suffix = f"_{counter}"
        candidate = f"{cleaned[: 31 - len(suffix)]}{suffix}"
        counter += 1
    used.add(candidate)
    return candidate


def build_sheet_xml(headers: list[str], rows: list[dict[str, object]]) -> str:
    lines = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        f'<worksheet xmlns="{MAIN_NS}"><sheetData>',
    ]

    matrix = [headers]
    for row in rows:
        matrix.append([row.get(header, "") for header in headers])

    for row_index, values in enumerate(matrix, start=1):
        lines.append(f'<row r="{row_index}">')
        for col_index, raw_value in enumerate(values):
            cell_ref = f"{excel_column_name(col_index)}{row_index}"
            value = "" if raw_value is None else raw_value
            if isinstance(value, bool):
                lines.append(f'<c r="{cell_ref}" t="b"><v>{1 if value else 0}</v></c>')
            elif isinstance(value, (int, float)) and not isinstance(value, bool):
                if isinstance(value, float) and math.isnan(value):
                    lines.append(f'<c r="{cell_ref}" t="inlineStr"><is><t></t></is></c>')
                else:
                    lines.append(f'<c r="{cell_ref}"><v>{value}</v></c>')
            else:
                text = escape(str(value))
                lines.append(
                    f'<c r="{cell_ref}" t="inlineStr"><is><t xml:space="preserve">{text}</t></is></c>'
                )
        lines.append("</row>")

    lines.append("</sheetData></worksheet>")
    return "".join(lines)


def write_xlsx_file(path: Path, sheets: list[tuple[str, list[dict[str, object]]]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    used_names: set[str] = set()
    sheet_defs = []
    for index, (raw_name, rows) in enumerate(sheets, start=1):
        name = sanitize_sheet_name(raw_name, used_names)
        headers = list(rows[0].keys()) if rows else []
        sheet_defs.append((index, name, headers, rows))

    content_types = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
        '<Default Extension="xml" ContentType="application/xml"/>',
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
    ]
    for index, _, _, _ in sheet_defs:
        content_types.append(
            f'<Override PartName="/xl/worksheets/sheet{index}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        )
    content_types.append("</Types>")

    rels_root = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<Relationships xmlns="{PKG_REL_NS}">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        "</Relationships>"
    )

    workbook_xml = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        f'<workbook xmlns="{MAIN_NS}" xmlns:r="{REL_NS}"><sheets>',
    ]
    workbook_rels = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        f'<Relationships xmlns="{PKG_REL_NS}">',
    ]
    for index, name, _, _ in sheet_defs:
        workbook_xml.append(f'<sheet name="{escape(name)}" sheetId="{index}" r:id="rId{index}"/>')
        workbook_rels.append(
            f'<Relationship Id="rId{index}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{index}.xml"/>'
        )
    workbook_xml.append("</sheets></workbook>")
    workbook_rels.append("</Relationships>")

    styles_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<styleSheet xmlns="{MAIN_NS}">'
        '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>'
        '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>'
        '<borders count="1"><border/></borders>'
        '<cellStyleXfs count="1"><xf/></cellStyleXfs>'
        '<cellXfs count="1"><xf xfId="0"/></cellXfs>'
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
        '</styleSheet>'
    )

    with ZipFile(path, "w", compression=ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", "".join(content_types))
        archive.writestr("_rels/.rels", rels_root)
        archive.writestr("xl/workbook.xml", "".join(workbook_xml))
        archive.writestr("xl/_rels/workbook.xml.rels", "".join(workbook_rels))
        archive.writestr("xl/styles.xml", styles_xml)
        for index, _, headers, rows in sheet_defs:
            archive.writestr(f"xl/worksheets/sheet{index}.xml", build_sheet_xml(headers, rows))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Integrate GSC and Screaming Frog audits into reproducible CSV and XLSX outputs."
    )
    parser.add_argument("--gsc", help="Path to the GSC Performance export XLSX.")
    parser.add_argument("--spider", help="Path to the Screaming Frog crawl XLSX.")
    parser.add_argument(
        "--outdir",
        default=str(Path(__file__).resolve().parents[1] / "audits"),
        help="Output directory for CSV/XLSX files.",
    )
    args = parser.parse_args()

    gsc_path = pick_input_path(args.gsc, DEFAULT_GSC_CANDIDATES, "GSC export")
    spider_path = pick_input_path(args.spider, DEFAULT_SPIDER_CANDIDATES, "SEO Spider export")
    outdir = Path(args.outdir)

    gsc_rows = build_gsc_rows(gsc_path)
    spider_rows = build_spider_rows(spider_path)
    merged_rows = build_merged_rows(gsc_rows, spider_rows)
    redirect_chains = build_redirect_chains(spider_rows)
    gsc_missing_rows = build_gsc_missing_rows(gsc_rows, spider_rows)
    issues_summary = build_issue_rows(merged_rows, redirect_chains, spider_rows)

    csv_targets = {
        "merged_gsc_spyder.csv": merged_rows,
        "issues_summary.csv": issues_summary,
        "redirect_chains.csv": redirect_chains,
        "gsc_urls_missing_in_spyder.csv": gsc_missing_rows,
    }

    for filename, rows in csv_targets.items():
        write_csv_file(outdir / filename, rows)

    write_xlsx_file(
        outdir / "appendix_integrated_gsc_spyder.xlsx",
        [
            ("merged_gsc_spyder", merged_rows),
            ("issues_summary", issues_summary),
            ("redirect_chains", redirect_chains),
            ("gsc_missing_in_spyder", gsc_missing_rows),
        ],
    )

    print(f"GSC input: {gsc_path}")
    print(f"Spider input: {spider_path}")
    print(f"Output directory: {outdir}")
    for filename in csv_targets:
        print(f"Generated {filename}")
    print("Generated appendix_integrated_gsc_spyder.xlsx")


if __name__ == "__main__":
    main()
