"""Time a single setup command and report its process tree during long waits."""
import datetime
import os
import subprocess
import sys
import time


def stamp():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="milliseconds")


def show_processes(root):
    listing = subprocess.run(
        ["ps", "-e", "-o", "pid=,ppid=,stat=,etime=,comm=", "--forest"],
        text=True, capture_output=True,
    )
    selected = {str(root)}
    for row in listing.stdout.splitlines():
        fields = row.split(None, 4)
        if len(fields) == 5 and (fields[0] in selected or fields[1] in selected):
            selected.add(fields[0])
            print(row.strip(), flush=True)


def main():
    label, *command = sys.argv[1:]
    start = time.monotonic()
    print(f"PROBE_START {label} {stamp()}", flush=True)
    proc = subprocess.Popen(command)
    interval = 120
    while True:
        try:
            code = proc.wait(timeout=interval)
            break
        except subprocess.TimeoutExpired:
            print(f"PROBE_WAIT {label} elapsed={time.monotonic() - start:.1f}s", flush=True)
            show_processes(proc.pid)
            interval = 60

    elapsed = time.monotonic() - start
    print(f"PROBE_END {label} {stamp()} seconds={elapsed:.3f} exit={code}", flush=True)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as handle:
            handle.write(f"- {label}: {elapsed:.3f} s (exit {code})\n")
    return code if code >= 0 else 128 - code


if __name__ == "__main__":
    sys.exit(main())
