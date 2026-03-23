import asyncio
import json
import sqlite3
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional

from aiohttp import web


@dataclass(frozen=True)
class ProductionEntry:
    terminal: Optional[str]
    productionLine: Optional[str]
    packer: Optional[str]
    presentation: Optional[str]
    uniqueN: Optional[int]
    registeredOn: str

    @property
    def registered_on_dt(self) -> datetime:
        return datetime.fromisoformat(self.registeredOn)


@dataclass(frozen=True)
class EmployeeEntry:
    id: str
    name: Optional[str]
    lastName: Optional[str]
    sLastName: Optional[str]
    groupName: Optional[str]
    isPacker: Optional[int]


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "metrics_anonymized.sqlite"
PRODUCTION_TABLE = "ProductionLog"
EMPLOYEES_TABLE = "EmployeesEmployee"
HOST = "127.0.0.1"
PORT = 8000
REPLAY_SPEED = 10.0


@web.middleware
async def cors_middleware(request: web.Request, handler):
    if request.method == "OPTIONS":
        response = web.Response(status=204)
    else:
        response = await handler(request)

    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


def load_entries(db_path: Path, table_name: str, limit: Optional[int] = None) -> list[ProductionEntry]:
    query = (
        f"SELECT terminal, productionLine, packer, presentation, uniqueN, registeredOn "
        f"FROM \"{table_name}\" "
        f"WHERE registeredOn IS NOT NULL "
        f"ORDER BY registeredOn ASC, rowid ASC"
    )
    if limit is not None:
        query += f" LIMIT {int(limit)}"

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(query).fetchall()

    return [
        ProductionEntry(
            terminal=row["terminal"],
            productionLine=row["productionLine"],
            packer=row["packer"],
            presentation=row["presentation"],
            uniqueN=row["uniqueN"],
            registeredOn=row["registeredOn"],
        )
        for row in rows
    ]


def load_employees(db_path: Path, table_name: str) -> list[EmployeeEntry]:
    query = (
        f"SELECT id, name, lastName, sLastName, groupName, isPacker "
        f"FROM \"{table_name}\" "
        f"ORDER BY CAST(id AS INTEGER), id"
    )

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(query).fetchall()

    return [
        EmployeeEntry(
            id=row["id"],
            name=row["name"],
            lastName=row["lastName"],
            sLastName=row["sLastName"],
            groupName=row["groupName"],
            isPacker=row["isPacker"],
        )
        for row in rows
    ]


async def replay_to_websocket(websocket: web.WebSocketResponse, entries: list[ProductionEntry], speed: float) -> int:
    if speed <= 0:
        raise ValueError("speed must be > 0")

    if not entries:
        return 0

    base_time = entries[0].registered_on_dt
    previous_offset = 0.0

    for entry in entries:
        offset_seconds = (entry.registered_on_dt - base_time).total_seconds() / speed
        wait_seconds = max(0.0, offset_seconds - previous_offset)
        if wait_seconds > 0:
            await asyncio.sleep(wait_seconds)
        await websocket.send_str(json.dumps(asdict(entry), ensure_ascii=False))
        previous_offset = offset_seconds

    return len(entries)


async def get_employees(_: web.Request) -> web.Response:
    employees = load_employees(DB_PATH, EMPLOYEES_TABLE)
    return web.json_response([asdict(employee) for employee in employees])


async def ws_production(request: web.Request) -> web.WebSocketResponse:
    websocket = web.WebSocketResponse()
    await websocket.prepare(request)

    try:
        entries = load_entries(DB_PATH, PRODUCTION_TABLE, limit=None)
        replayed = await replay_to_websocket(websocket, entries, REPLAY_SPEED)
        await websocket.send_str(json.dumps({"type": "replay_completed", "dispatchedRows": replayed}))
    except Exception:
        pass
    finally:
        await websocket.close()

    return websocket


def create_app() -> web.Application:
    app = web.Application(middlewares=[cors_middleware])
    app.router.add_get("/employees", get_employees)
    app.router.add_get("/ws/production", ws_production)
    return app


def main() -> None:
    app = create_app()
    web.run_app(app, host=HOST, port=PORT)


if __name__ == "__main__":
    main()