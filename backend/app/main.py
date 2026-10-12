import json
import subprocess
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from fastapi.middleware.cors import CORSMiddleware


# ==================================================
# PATHS
# ==================================================

BACKEND_DIR = Path(__file__).resolve().parent.parent

BLENDER_DIR = BACKEND_DIR / "blender"

GENERATED_DIR = BACKEND_DIR / "generated"

BASE_HUMAN_PATH = (
    BLENDER_DIR / "base_human.blend"
)

GENERATE_SCRIPT_PATH = (
    BLENDER_DIR / "generate_body.py"
)


BLENDER_EXECUTABLE = Path(
    r"C:\Program Files\Blender Foundation"
    r"\Blender 4.5\blender.exe"
)


GENERATED_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ==================================================
# FASTAPI
# ==================================================

app = FastAPI(
    title="VESTORA API",
    version="0.2.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated GLB files
app.mount(
    "/generated",
    StaticFiles(
        directory=str(GENERATED_DIR)
    ),
    name="generated"
)


# ==================================================
# MODELS
# ==================================================

class BodyMeasurements(BaseModel):

    height: float = Field(
        gt=100,
        lt=250
    )

    chest: float = Field(
        gt=40,
        lt=200
    )

    waist: float = Field(
        gt=40,
        lt=200
    )

    hips: float = Field(
        gt=40,
        lt=200
    )

    shoulders: float = Field(
        gt=20,
        lt=100
    )

    neck: float = Field(
        gt=20,
        lt=100
    )

    arm_length: float = Field(
        gt=20,
        lt=120
    )

    inseam: float = Field(
        gt=30,
        lt=150
    )


# ==================================================
# HEALTH
# ==================================================

@app.get("/api/health")
def health():

    return {
        "status": "ok",
        "service": "VESTORA Body Engine"
    }


# ==================================================
# BODY GENERATION
# ==================================================

@app.post("/api/body/generate")
def generate_body(
    measurements: BodyMeasurements
):

    # ----------------------------------------------
    # Unique generation ID
    # ----------------------------------------------

    body_id = uuid.uuid4().hex


    measurements_path = (
        GENERATED_DIR /
        f"body_{body_id}.json"
    )

    output_path = (
        GENERATED_DIR /
        f"body_{body_id}.glb"
    )


    # ----------------------------------------------
    # Save measurements
    # ----------------------------------------------

    with open(
        measurements_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            measurements.model_dump(),
            file,
            indent=2
        )


    # ----------------------------------------------
    # Blender command
    # ----------------------------------------------

    command = [
        str(BLENDER_EXECUTABLE),

        "--background",

        str(BASE_HUMAN_PATH),

        "--python",
        str(GENERATE_SCRIPT_PATH),

        "--",

        "--measurements",
        str(measurements_path),

        "--output",
        str(output_path)
    ]


    print()
    print("====================================")
    print("VESTORA API: Starting Blender")
    print(f"Body ID: {body_id}")
    print("====================================")


    try:

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=120
        )

    except subprocess.TimeoutExpired:

        measurements_path.unlink(
            missing_ok=True
        )

        raise HTTPException(
            status_code=504,
            detail="Body generation timed out"
        )


    # ----------------------------------------------
    # Blender error
    # ----------------------------------------------

    if result.returncode != 0:

        print(result.stdout)
        print(result.stderr)

        measurements_path.unlink(
            missing_ok=True
        )

        output_path.unlink(
            missing_ok=True
        )

        raise HTTPException(
            status_code=500,
            detail={
                "message":
                    "Blender body generation failed",

                "stderr":
                    result.stderr[-3000:],

                "stdout":
                    result.stdout[-3000:]
            }
        )


    # ----------------------------------------------
    # Verify GLB
    # ----------------------------------------------

    if not output_path.exists():

        measurements_path.unlink(
            missing_ok=True
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Blender finished but "
                "GLB was not generated"
            )
        )


    print(
        f"VESTORA API: Generated "
        f"{output_path.name}"
    )


    # We don't need the temporary JSON anymore
    measurements_path.unlink(
        missing_ok=True
    )


    # ----------------------------------------------
    # Response
    # ----------------------------------------------

    return {
        "success": True,

        "body_id": body_id,

        "model_url":
            f"/generated/{output_path.name}",

        "measurements":
            measurements.model_dump()
    }