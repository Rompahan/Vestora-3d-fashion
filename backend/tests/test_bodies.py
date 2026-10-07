import json
import subprocess
import tempfile
import re
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

BLENDER_EXE = Path(
    r"C:\Program Files\Blender Foundation\Blender 4.5\blender.exe"
)

BASE_BLEND = PROJECT_ROOT / "backend" / "blender" / "base_human.blend"
GENERATOR = PROJECT_ROOT / "backend" / "blender" / "generate_body.py"
OUTPUT_DIR = PROJECT_ROOT / "backend" / "generated" / "tests"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# TEST BODIES
# ============================================================

TEST_BODIES = [
    {
        "name": "small",
        "height": 165,
        "chest": 82,
        "waist": 68,
        "hips": 86,
        "shoulders": 42,
        "neck": 36,
        "arm_length": 58,
        "inseam": 76,
    },
    {
        "name": "medium",
        "height": 175,
        "chest": 90,
        "waist": 78,
        "hips": 92,
        "shoulders": 46,
        "neck": 39,
        "arm_length": 62,
        "inseam": 84,
    },
    {
        "name": "tall",
        "height": 182,
        "chest": 100,
        "waist": 84,
        "hips": 98,
        "shoulders": 48,
        "neck": 41,
        "arm_length": 65,
        "inseam": 88,
    },
    {
        "name": "large",
        "height": 190,
        "chest": 110,
        "waist": 90,
        "hips": 105,
        "shoulders": 50,
        "neck": 43,
        "arm_length": 68,
        "inseam": 92,
    },
    {
        "name": "waist_range_test",
        "height": 190,
        "chest": 110,
        "waist": 95,
        "hips": 105,
        "shoulders": 50,
        "neck": 43,
        "arm_length": 68,
        "inseam": 92,
    },
]


# ============================================================
# RESULT PARSER
# ============================================================

def parse_final_measurements(output):
    marker = "---------- POST-CALIBRATION CHECK ----------"

    if marker not in output:
        return None

    section = output.split(marker, 1)[1]

    patterns = {
        "height": r"Height\s*:\s*([\d.]+)\s*cm",
        "waist": r"Waist\s*:\s*([\d.]+)\s*cm",
        "chest": r"Chest\s*:\s*([\d.]+)\s*cm",
        "hips": r"Hips\s*:\s*([\d.]+)\s*cm",
    }

    result = {}

    for key, pattern in patterns.items():
        match = re.search(pattern, section)

        if not match:
            return None

        result[key] = float(match.group(1))

    return result


# ============================================================
# RUN ONE BODY
# ============================================================

def run_body(body):
    print()
    print("=" * 70)
    print(f"TESTING: {body['name']}")
    print(
        f"{body['height']} / "
        f"{body['chest']} / "
        f"{body['waist']} / "
        f"{body['hips']}"
    )
    print("=" * 70)

    output_glb = OUTPUT_DIR / f"{body['name']}.glb"

    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".json",
        delete=False,
        encoding="utf-8",
    ) as temp_file:

        json.dump(body, temp_file)

        measurements_path = Path(temp_file.name)

    command = [
        str(BLENDER_EXE),
        "--background",
        str(BASE_BLEND),
        "--python",
        str(GENERATOR),
        "--",
        "--measurements",
        str(measurements_path),
        "--output",
        str(output_glb),
    ]

    try:
        process = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=180,
        )

        full_output = (
            (process.stdout or "")
            + "\n"
            + (process.stderr or "")
        )

        if process.returncode != 0:
            reason = "Generator failed"

            for line in full_output.splitlines():
                if "RuntimeError:" in line:
                    reason = line.strip()

            return {
                "name": body["name"],
                "status": "FAIL",
                "reason": reason,
            }

        actual = parse_final_measurements(full_output)

        if actual is None:
            return {
                "name": body["name"],
                "status": "FAIL",
                "reason": "Could not parse final measurements",
            }

        errors = {
            key: abs(actual[key] - float(body[key]))
            for key in ("height", "chest", "waist", "hips")
        }

        max_error = max(errors.values())

        status = (
            "PASS"
            if max_error <= 0.1
            else "FAIL"
        )

        return {
            "name": body["name"],
            "status": status,
            "actual": actual,
            "errors": errors,
            "max_error": max_error,
        }

    except subprocess.TimeoutExpired:
        return {
            "name": body["name"],
            "status": "FAIL",
            "reason": "Blender timeout",
        }

    finally:
        measurements_path.unlink(missing_ok=True)


# ============================================================
# RUN TEST SUITE
# ============================================================

results = []

for body in TEST_BODIES:
    result = run_body(body)
    results.append(result)

    if result["status"] == "PASS":
        print(
            f"RESULT: PASS | "
            f"max error = {result['max_error']:.3f} cm"
        )
    else:
        print(
            f"RESULT: FAIL | "
            f"{result.get('reason', 'Measurement error')}"
        )


# ============================================================
# SUMMARY
# ============================================================

print()
print()
print("=" * 90)
print("VESTORA BODY ENGINE TEST SUMMARY")
print("=" * 90)

print(
    f"{'BODY':<20}"
    f"{'STATUS':<10}"
    f"{'HEIGHT':<12}"
    f"{'CHEST':<12}"
    f"{'WAIST':<12}"
    f"{'HIPS':<12}"
)

print("-" * 90)

for result in results:

    if result["status"] == "PASS":

        errors = result["errors"]

        print(
            f"{result['name']:<20}"
            f"{'PASS':<10}"
            f"{errors['height']:<12.3f}"
            f"{errors['chest']:<12.3f}"
            f"{errors['waist']:<12.3f}"
            f"{errors['hips']:<12.3f}"
        )

    else:

        print(
            f"{result['name']:<20}"
            f"{'FAIL':<10}"
            f"{'-':<12}"
            f"{'-':<12}"
            f"{'-':<12}"
            f"{'-':<12}"
        )

print("=" * 90)

passed = sum(
    result["status"] == "PASS"
    for result in results
)

print()
print(
    f"PASSED: {passed}/{len(results)}"
)