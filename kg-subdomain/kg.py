from __future__ import annotations

import argparse
import json
import sys
from collections import deque
from pathlib import Path
from typing import Any


def load_json(path: str | Path) -> Any:
    with Path(path).open("r", encoding="utf-8") as fh:
        return json.load(fh)


def validate_graph(graph: Any, schema: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(graph, dict):
        return ["graph must be a JSON object"]
    if not isinstance(schema, dict):
        return ["schema must be a JSON object"]

    entities = graph.get("entities")
    relations = graph.get("relations")
    if not isinstance(entities, list):
        errors.append("entities must be a list")
        entities = []
    if not isinstance(relations, list):
        errors.append("relations must be a list")
        relations = []

    allowed_entity_types = set(schema.get("entity_types", []))
    allowed_relation_types = set(schema.get("relation_types", []))
    entity_required = schema.get("required_entity_fields", [])
    relation_required = schema.get("required_relation_fields", [])
    evidence_required = schema.get("required_evidence_fields", [])
    permission_fields = schema.get("permission_fields", [])

    entity_ids: set[str] = set()
    for index, entity in enumerate(entities):
        where = "entity[%d]" % index
        if not isinstance(entity, dict):
            errors.append(where + ": must be an object")
            continue
        for field in entity_required:
            if field not in entity or entity[field] in (None, "", [], {}):
                errors.append(where + ": missing required field " + field)
        eid = entity.get("id")
        if isinstance(eid, str):
            if eid in entity_ids:
                errors.append(where + ": duplicate id " + eid)
            entity_ids.add(eid)
        else:
            errors.append(where + ": id must be a string")
        if entity.get("type") not in allowed_entity_types:
            errors.append(where + ": unknown type " + repr(entity.get("type")))
        if not isinstance(entity.get("aliases"), list):
            errors.append(where + ": aliases must be a list")
        if not isinstance(entity.get("properties"), dict):
            errors.append(where + ": properties must be an object")
        permission = entity.get("permission")
        if not isinstance(permission, dict):
            errors.append(where + ": permission must be an object")
        else:
            for field in permission_fields:
                if not permission.get(field):
                    errors.append(where + ": permission missing " + field)

    relation_ids: set[str] = set()
    for index, relation in enumerate(relations):
        where = "relation[%d]" % index
        if not isinstance(relation, dict):
            errors.append(where + ": must be an object")
            continue
        for field in relation_required:
            if field not in relation or relation[field] in (None, "", [], {}):
                errors.append(where + ": missing required field " + field)
        rid = relation.get("id")
        if isinstance(rid, str):
            if rid in relation_ids:
                errors.append(where + ": duplicate id " + rid)
            relation_ids.add(rid)
        else:
            errors.append(where + ": id must be a string")
        if relation.get("type") not in allowed_relation_types:
            errors.append(where + ": unknown type " + repr(relation.get("type")))
        for endpoint in ("from", "to"):
            value = relation.get(endpoint)
            if value not in entity_ids:
                errors.append(where + ": dangling " + endpoint + " " + repr(value))
        if relation.get("from") == relation.get("to"):
            errors.append(where + ": self relation is not allowed")
        evidence = relation.get("evidence")
        if not isinstance(evidence, list) or not evidence:
            errors.append(where + ": evidence must be a non-empty list")
            continue
        for ev_index, item in enumerate(evidence):
            ev_where = where + ".evidence[%d]" % ev_index
            if not isinstance(item, dict):
                errors.append(ev_where + ": must be an object")
                continue
            for field in evidence_required:
                if not item.get(field):
                    errors.append(ev_where + ": missing " + field)
            locator = item.get("locator")
            if isinstance(locator, str) and "://" not in locator:
                errors.append(ev_where + ": locator must include a scheme")
            source_id = item.get("source_id")
            if isinstance(source_id, str) and source_id.strip().lower() in {"todo", "tbd", "unknown"}:
                errors.append(ev_where + ": source_id is a placeholder")
    return errors


def entity_view(graph: dict[str, Any], entity_id: str) -> dict[str, Any] | None:
    entity = next((e for e in graph.get("entities", []) if e.get("id") == entity_id), None)
    if entity is None:
        return None
    incident = [r for r in graph.get("relations", []) if r.get("from") == entity_id or r.get("to") == entity_id]
    return {"entity": entity, "relations": incident, "relation_count": len(incident)}


def relation_view(graph: dict[str, Any], relation_type: str) -> dict[str, Any]:
    rows = [r for r in graph.get("relations", []) if r.get("type") == relation_type]
    return {"relation_type": relation_type, "count": len(rows), "relations": rows}


def find_path(graph: dict[str, Any], start: str, end: str) -> dict[str, Any]:
    ids = {e.get("id") for e in graph.get("entities", [])}
    if start not in ids or end not in ids:
        return {"found": False, "error": "start or end entity does not exist"}
    if start == end:
        return {"found": True, "nodes": [start], "relations": []}
    adjacency: dict[str, list[tuple[str, str]]] = {eid: [] for eid in ids if isinstance(eid, str)}
    for relation in graph.get("relations", []):
        left = relation.get("from")
        right = relation.get("to")
        if left in adjacency and right in adjacency:
            adjacency[left].append((right, relation.get("id")))
            adjacency[right].append((left, relation.get("id")))
    queue = deque([(start, [start], [])])
    seen = {start}
    while queue:
        node, nodes, edges = queue.popleft()
        for neighbour, rid in adjacency.get(node, []):
            if neighbour in seen:
                continue
            next_nodes = nodes + [neighbour]
            next_edges = edges + [rid]
            if neighbour == end:
                return {"found": True, "nodes": next_nodes, "relations": next_edges}
            seen.add(neighbour)
            queue.append((neighbour, next_nodes, next_edges))
    return {"found": False, "nodes": [], "relations": []}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Synthetic knowledge-graph subdomain validator and query CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    validate = sub.add_parser("validate", help="validate graph structure and evidence")
    validate.add_argument("--graph", default="data/sample_graph.json")
    validate.add_argument("--schema", default="schema.json")

    load = sub.add_parser("load", help="load graph and print counts")
    load.add_argument("--graph", default="data/sample_graph.json")

    query = sub.add_parser("query", help="query entities, relations or a path")
    query.add_argument("--graph", default="data/sample_graph.json")
    query.add_argument("--entity")
    query.add_argument("--relation")
    query.add_argument("--path-from")
    query.add_argument("--path-to")

    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    graph = load_json(args.graph)

    if args.command == "validate":
        schema = load_json(args.schema)
        errors = validate_graph(graph, schema)
        result = {
            "ok": not errors,
            "graph_id": graph.get("graph_id"),
            "entities": len(graph.get("entities", [])),
            "relations": len(graph.get("relations", [])),
            "errors": errors,
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if not errors else 1

    if args.command == "load":
        result = {
            "graph_id": graph.get("graph_id"),
            "entities": len(graph.get("entities", [])),
            "relations": len(graph.get("relations", [])),
            "entity_ids": [e.get("id") for e in graph.get("entities", [])],
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0

    if args.command == "query":
        modes = [bool(args.entity), bool(args.relation), bool(args.path_from or args.path_to)]
        if sum(modes) != 1:
            print("use exactly one of --entity, --relation, --path-from/--path-to", file=sys.stderr)
            return 2
        if args.entity:
            result = entity_view(graph, args.entity)
            if result is None:
                print(json.dumps({"found": False, "entity": args.entity}, ensure_ascii=False, indent=2))
                return 1
            print(json.dumps({"found": True, **result}, ensure_ascii=False, indent=2))
            return 0
        if args.relation:
            print(json.dumps(relation_view(graph, args.relation), ensure_ascii=False, indent=2))
            return 0
        if not args.path_from or not args.path_to:
            print("--path-from and --path-to are both required", file=sys.stderr)
            return 2
        print(json.dumps(find_path(graph, args.path_from, args.path_to), ensure_ascii=False, indent=2))
        return 0

    return 2


if __name__ == "__main__":
    raise SystemExit(main())
