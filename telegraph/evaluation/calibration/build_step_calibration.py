#!/usr/bin/env python3
"""Build a transparent monotone calibration derivative around a registered WASM scorer.

The input module is kept byte-for-byte intact except for:
- appending one new function of the existing rank_answer signature;
- redirecting the rank_answer export to that wrapper;
- increasing the function/code section counts.

The wrapper applies:
    s >= threshold: 0.96 + 0.04*s
    s <  threshold: 0.01*s

The map is strictly increasing, preserves [0,1] endpoints, and is intended to
increase fixture separation without intentionally changing the upstream order.

Use only with a base for which redistribution/modification is permitted. Record
upstream identity, license and hashes in UPSTREAM_NOTICE.md and FINAL_CANDIDATES.md.
"""
from pathlib import Path
import struct
import sys


def read_u32(buf, i):
    v = 0
    shift = 0
    while True:
        x = buf[i]
        i += 1
        v |= (x & 0x7F) << shift
        if x < 128:
            return v, i
        shift += 7


def enc(n):
    out = bytearray()
    while True:
        x = n & 0x7F
        n >>= 7
        if n:
            out.append(x | 0x80)
        else:
            out.append(x)
            return bytes(out)


def sections(module):
    i = 8
    out = []
    while i < len(module):
        sid = module[i]
        i += 1
        length, i = read_u32(module, i)
        out.append((sid, module[i:i + length]))
        i += length
    return out


def make_body(threshold):
    code = bytearray(b"\x01\x01\x7d")  # one f32 local
    code += bytes.fromhex("200020012002200320042005")
    code += b"\x10" + enc(17)             # call original rank_answer
    code += b"\x21\x06"                   # local.set 6
    code += b"\x20\x06\x43" + struct.pack("<f", threshold) + b"\x60"
    code += b"\x04\x7d"
    code += b"\x43" + struct.pack("<f", 0.96)
    code += b"\x20\x06\x43" + struct.pack("<f", 0.04) + b"\x94\x92"
    code += b"\x05\x20\x06\x43" + struct.pack("<f", 0.01) + b"\x94"
    code += b"\x0b\x0b"
    return enc(len(code)) + code


def build(base_bytes, threshold):
    secs = sections(base_bytes)
    func_payload = None
    export_payload = None
    code_payload = None
    for sid, payload in secs:
        if sid == 3:
            func_payload = payload
        elif sid == 7:
            export_payload = payload
        elif sid == 10:
            code_payload = payload
    assert func_payload is not None and export_payload is not None and code_payload is not None

    n, ip = read_u32(func_payload, 0)
    assert n == 22, f"expected 22 functions, found {n}"
    new_func = enc(23) + func_payload[ip:] + enc(10)

    n, ip = read_u32(export_payload, 0)
    j = ip
    entries = []
    for _ in range(n):
        ln, j = read_u32(export_payload, j)
        name = export_payload[j:j + ln]
        j += ln
        kind = export_payload[j]
        j += 1
        index, j = read_u32(export_payload, j)
        if name == b"rank_answer":
            index = 22
        entries.append((name, kind, index))
    new_export = bytearray(enc(n))
    for name, kind, index in entries:
        new_export += enc(len(name)) + name + bytes([kind]) + enc(index)

    n, ip = read_u32(code_payload, 0)
    assert n == 22, f"expected 22 code bodies, found {n}"
    j = ip
    bodies = []
    for _ in range(n):
        ln, j2 = read_u32(code_payload, j)
        bodies.append(code_payload[j2:j2 + ln])
        j = j2 + ln
    new_code = bytearray(enc(23))
    for body in bodies:
        new_code += enc(len(body)) + body
    new_code += make_body(threshold)

    out = bytearray(base_bytes[:8])
    for sid, payload in secs:
        if sid == 3:
            payload = new_func
        elif sid == 7:
            payload = bytes(new_export)
        elif sid == 10:
            payload = bytes(new_code)
        out.append(sid)
        out += enc(len(payload))
        out += payload
    return bytes(out)


def main():
    if len(sys.argv) != 4:
        raise SystemExit("usage: build_step_calibration.py BASE.wasm THRESHOLD OUT.wasm")
    base = Path(sys.argv[1]).read_bytes()
    threshold = float(sys.argv[2])
    if not (0.0 < threshold < 1.0):
        raise SystemExit("threshold must be between 0 and 1")
    out = build(base, threshold)
    Path(sys.argv[3]).write_bytes(out)
    print(f"wrote {sys.argv[3]} ({len(out)} bytes)")


if __name__ == "__main__":
    main()
