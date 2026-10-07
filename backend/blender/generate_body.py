import bpy
import json
import os
import sys
import importlib


# ==================================================
# PATH SETUP
# ==================================================

SCRIPT_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

BACKEND_DIR = os.path.dirname(
    SCRIPT_DIR
)

# Blender does not automatically add the script
# directory to sys.path when using --python.
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)


from measurement_engine import (
    measure_horizontal_circumference,
    measure_chest_circumference,
    _get_evaluated_vertex_group_z
)

# ==================================================
# VESTORA BODY ENGINE
#
# measurements.json
#       ↓
# MPFB parametric body
#       ↓
# measurement calibration
#       ↓
# GLB
# ==================================================


# ==================================================
# INPUT / OUTPUT
# ==================================================

def get_cli_argument(name):
    if "--" not in sys.argv:
        return None

    args = sys.argv[
        sys.argv.index("--") + 1:
    ]

    if name not in args:
        return None

    index = args.index(name)

    if index + 1 >= len(args):
        return None

    return args[index + 1]


MEASUREMENTS_PATH = get_cli_argument(
    "--measurements"
)

OUTPUT_PATH = get_cli_argument(
    "--output"
)


# Fallback for manual development
if MEASUREMENTS_PATH is None:
    MEASUREMENTS_PATH = os.path.join(
        SCRIPT_DIR,
        "measurements.json"
    )

if OUTPUT_PATH is None:
    OUTPUT_PATH = os.path.join(
        BACKEND_DIR,
        "generated",
        "test_body.glb"
    )


MEASUREMENTS_PATH = os.path.abspath(
    MEASUREMENTS_PATH
)

OUTPUT_PATH = os.path.abspath(
    OUTPUT_PATH
)

# ==================================================
# MPFB IMPORT
# ==================================================

def dynamic_import(package_end, key):

    for module_name in sys.modules:

        if module_name.endswith(package_end):

            module = importlib.import_module(
                module_name
            )

            if hasattr(module, key):
                return getattr(module, key)

    raise RuntimeError(
        f"VESTORA: Could not find "
        f"{key} in {package_end}"
    )


HumanObjectProperties = dynamic_import(
    "mpfb.entities.objectproperties",
    "HumanObjectProperties"
)

TargetService = dynamic_import(
    "mpfb.services.targetservice",
    "TargetService"
)


# ==================================================
# LOAD MEASUREMENTS
# ==================================================

with open(
    MEASUREMENTS_PATH,
    "r",
    encoding="utf-8"
) as file:

    measurements = json.load(file)


requested_height = float(
    measurements["height"]
)

requested_chest = float(
    measurements["chest"]
)

requested_waist = float(
    measurements["waist"]
)

requested_hips = float(
    measurements["hips"]
)


print()
print("==============================================")
print("           VESTORA BODY ENGINE")
print("==============================================")

print(
    f"Requested height : "
    f"{requested_height:.2f} cm"
)

print(
    f"Requested chest  : "
    f"{requested_chest:.2f} cm"
)

print(
    f"Requested waist  : "
    f"{requested_waist:.2f} cm"
)

print(
    f"Requested hips   : "
    f"{requested_hips:.2f} cm"
)

# ==================================================
# HUMAN
# ==================================================

obj = bpy.data.objects.get("Human")

if obj is None:
    raise RuntimeError(
        "VESTORA: Human object not found"
    )


print(
    f"Human object     : {obj.name}"
)


# ==================================================
# HEIGHT
# ==================================================

def get_height_cm():

    bpy.context.view_layer.update()

    return (
        obj.dimensions.z * 100.0
    )


def set_height(value):

    HumanObjectProperties.set_value(
        "height",
        float(value),
        entity_reference=obj
    )

    TargetService.reapply_macro_details(
        obj,
        remove_zero_weight_targets=True
    )

    bpy.context.view_layer.update()


def calibrate_height(
    requested_cm,
    tolerance_cm=0.1
):

    print()
    print(
        "---------- HEIGHT CALIBRATION ----------"
    )

    low = 0.0
    high = 1.0

    best_value = None
    best_height = None
    best_error = float("inf")

    for iteration in range(20):

        mid = (
            low + high
        ) / 2.0

        set_height(mid)

        current = get_height_cm()

        error = abs(
            current - requested_cm
        )

        print(
            f"{iteration + 1:02d}: "
            f"MPFB={mid:.6f} -> "
            f"{current:.2f} cm "
            f"(error={error:.3f})"
        )

        if error < best_error:

            best_error = error
            best_value = mid
            best_height = current

        if error <= tolerance_cm:
            break

        if current < requested_cm:
            low = mid

        else:
            high = mid


    if best_value is None:

        raise RuntimeError(
            "VESTORA: Height calibration failed"
        )


    # Apply best result
    set_height(best_value)

    final_height = get_height_cm()


    print()
    print("HEIGHT RESULT")

    print(
        f"Requested : "
        f"{requested_cm:.2f} cm"
    )

    print(
        f"Actual    : "
        f"{final_height:.2f} cm"
    )

    print(
        f"MPFB      : "
        f"{best_value:.6f}"
    )

    print(
        f"Error     : "
        f"{abs(final_height-requested_cm):.3f} cm"
    )


    return {
        "requested": requested_cm,
        "actual": final_height,
        "mpfb": best_value,
        "error": abs(
            final_height - requested_cm
        )
    }


# ==================================================
# WAIST
# ==================================================

WAIST_INCR_TARGET = (
    "measure-waist-circ-incr"
)

WAIST_DECR_TARGET = (
    "measure-waist-circ-decr"
)


def get_waist_measurement_z():

    """
    Temporary VESTORA waist landmark.

    1.085 m was established experimentally for
    approximately 182 cm body height.

    Scale it relative to generated height.

    IMPORTANT:
    This is temporary until the final anatomical
    measurement-landmark system is implemented.
    """

    reference_height = 181.97
    reference_z = 1.085

    current_height = get_height_cm()

    return (
        reference_z *
        current_height /
        reference_height
    )


def set_waist_targets(
    incr=0.0,
    decr=0.0
):

    TargetService.set_target_value(
        obj,
        WAIST_INCR_TARGET,
        float(incr)
    )

    TargetService.set_target_value(
        obj,
        WAIST_DECR_TARGET,
        float(decr)
    )

    bpy.context.view_layer.update()


def set_waist_incr(value):
    set_waist_targets(incr=value)


def measure_waist():

    waist_z = get_waist_measurement_z()

    return measure_horizontal_circumference(
        obj,
        waist_z
    )


def calibrate_waist(
    requested_cm,
    tolerance_cm=0.1
):
    print()
    print(
        "---------- WAIST CALIBRATION ----------"
    )

    if not TargetService.has_target(
        obj,
        WAIST_INCR_TARGET
    ):
        raise RuntimeError(
            "VESTORA: Waist INCR target "
            "is not available"
        )

    if not TargetService.has_target(
        obj,
        WAIST_DECR_TARGET
    ):
        raise RuntimeError(
            "VESTORA: Waist DECR target "
            "is not available"
        )

    # ------------------------------------------
    # Start from neutral waist
    # ------------------------------------------

    set_waist_targets()

    initial_waist = measure_waist()
    waist_z = get_waist_measurement_z()

    initial_error = abs(
        initial_waist - requested_cm
    )

    print(
        f"Measurement Z : "
        f"{waist_z:.4f} m"
    )

    print(
        f"Initial waist : "
        f"{initial_waist:.2f} cm"
    )

    print(
        f"Requested     : "
        f"{requested_cm:.2f} cm"
    )

    # ------------------------------------------
    # Already within tolerance
    # ------------------------------------------

    if initial_error <= tolerance_cm:

        print()
        print("WAIST RESULT")

        print(
            f"Requested : "
            f"{requested_cm:.2f} cm"
        )

        print(
            f"Actual    : "
            f"{initial_waist:.2f} cm"
        )

        print(
            "Direction : neutral"
        )

        print(
            "Target    : 0.000000"
        )

        print(
            f"Error     : "
            f"{initial_error:.3f} cm"
        )

        return {
            "requested": requested_cm,
            "actual": initial_waist,
            "target": 0.0,
            "direction": "neutral",
            "error": initial_error,
            "z": waist_z
        }

    # ------------------------------------------
    # Decide direction and check target range
    # ------------------------------------------

    if requested_cm > initial_waist:
        direction = "INCR"
    else:
        direction = "DECR"

    def apply_waist(value):
        if direction == "INCR":
            set_waist_targets(incr=value, decr=0.0)
        else:
            set_waist_targets(incr=0.0, decr=value)

    apply_waist(1.0)

    limit_waist = measure_waist()

    print(
        f"{direction} limit   : "
        f"{limit_waist:.2f} cm"
    )

    if (
        (direction == "INCR" and requested_cm > limit_waist)
        or (direction == "DECR" and requested_cm < limit_waist)
    ):
        set_waist_targets()

        raise RuntimeError(
            f"VESTORA: Requested waist "
            f"{requested_cm:.2f} cm exceeds "
            f"current {direction} target range "
            f"({limit_waist:.2f} cm)."
        )

    # ------------------------------------------
    # Binary search
    # ------------------------------------------

    low = 0.0
    high = 1.0

    best_value = 0.0
    best_waist = initial_waist
    best_error = initial_error

    for iteration in range(20):

        mid = (
            low + high
        ) / 2.0

        apply_waist(mid)

        # --------------------------------------
        # Measure current waist
        # --------------------------------------

        try:
            current = measure_waist()

        except RuntimeError as measurement_error:

            if (
                "No torso contour found"
                not in str(measurement_error)
            ):
                raise

            print(
                f"{iteration + 1:02d}: "
                f"{direction}={mid:.6f} -> "
                f"measurement failed"
            )

            print(
                f"DEBUG: {measurement_error}"
            )

            # The current deformation produced
            # an unstable contour.
            #
            # Continue searching toward the
            # smaller deformation range.
            high = mid

            continue

        # --------------------------------------
        # Valid measurement
        # --------------------------------------

        error = abs(
            current - requested_cm
        )

        print(
            f"{iteration + 1:02d}: "
            f"{direction}={mid:.6f} -> "
            f"{current:.2f} cm "
            f"(error={error:.3f})"
        )

        # --------------------------------------
        # Save best result
        # --------------------------------------

        if error < best_error:

            best_error = error
            best_value = mid
            best_waist = current

        # --------------------------------------
        # Target reached
        # --------------------------------------

        if error <= tolerance_cm:
            break

        # --------------------------------------
        # Binary search direction
        # --------------------------------------

        if direction == "INCR":
            if current < requested_cm:
                low = mid
            else:
                high = mid
        else:
            # More DECR => smaller waist
            if current > requested_cm:
                low = mid
            else:
                high = mid

    # ------------------------------------------
    # Apply best result
    # ------------------------------------------

    apply_waist(
        best_value
    )

    final_waist = measure_waist()

    final_error = abs(
        final_waist - requested_cm
    )

    print()
    print("WAIST RESULT")

    print(
        f"Requested : "
        f"{requested_cm:.2f} cm"
    )

    print(
        f"Actual    : "
        f"{final_waist:.2f} cm"
    )

    print(
        f"Direction : {direction}"
    )

    print(
        f"Target    : "
        f"{best_value:.6f}"
    )

    print(
        f"Error     : "
        f"{final_error:.3f} cm"
    )

    return {
        "requested": requested_cm,
        "actual": final_waist,
        "target": best_value,
        "direction": direction,
        "error": final_error,
        "z": waist_z
    }

# ==================================================
# CHEST
# ==================================================

CHEST_INCR_TARGET = "measure-bust-circ-incr"
CHEST_DECR_TARGET = "measure-bust-circ-decr"


def set_chest_targets(
    incr=0.0,
    decr=0.0
):
    TargetService.set_target_value(
        obj,
        CHEST_INCR_TARGET,
        float(incr)
    )

    TargetService.set_target_value(
        obj,
        CHEST_DECR_TARGET,
        float(decr)
    )

    bpy.context.view_layer.update()


def measure_chest():
    return measure_chest_circumference(obj)


def calibrate_chest(
    requested_cm,
    tolerance_cm=0.1
):
    print()
    print(
        "---------- CHEST CALIBRATION ----------"
    )

    if not TargetService.has_target(
        obj,
        CHEST_INCR_TARGET
    ):
        raise RuntimeError(
            "VESTORA: Chest INCR target "
            "is not available"
        )

    if not TargetService.has_target(
        obj,
        CHEST_DECR_TARGET
    ):
        raise RuntimeError(
            "VESTORA: Chest DECR target "
            "is not available"
        )

    # Neutral chest
    set_chest_targets()

    initial_chest = measure_chest()

    print(
        f"Initial chest : "
        f"{initial_chest:.2f} cm"
    )

    print(
        f"Requested     : "
        f"{requested_cm:.2f} cm"
    )

    initial_error = abs(
        initial_chest - requested_cm
    )

    if initial_error <= tolerance_cm:
        print()
        print("CHEST RESULT")
        print(
            f"Requested : {requested_cm:.2f} cm"
        )
        print(
            f"Actual    : {initial_chest:.2f} cm"
        )
        print("Target    : neutral")
        print(
            f"Error     : {initial_error:.3f} cm"
        )

        return {
            "requested": requested_cm,
            "actual": initial_chest,
            "target": 0.0,
            "direction": "neutral",
            "error": initial_error
        }

    # Decide direction
    if requested_cm > initial_chest:
        target_name = CHEST_INCR_TARGET
        direction = "INCR"
    else:
        target_name = CHEST_DECR_TARGET
        direction = "DECR"

    # Check maximum available deformation
    if direction == "INCR":
        set_chest_targets(
            incr=1.0,
            decr=0.0
        )
    else:
        set_chest_targets(
            incr=0.0,
            decr=1.0
        )

    limit_chest = measure_chest()

    print(
        f"{direction} limit   : "
        f"{limit_chest:.2f} cm"
    )

    if (
        direction == "INCR"
        and requested_cm > limit_chest
    ):
        set_chest_targets()

        raise RuntimeError(
            f"VESTORA: Requested chest "
            f"{requested_cm:.2f} cm exceeds "
            f"INCR target range "
            f"({limit_chest:.2f} cm)."
        )

    if (
        direction == "DECR"
        and requested_cm < limit_chest
    ):
        set_chest_targets()

        raise RuntimeError(
            f"VESTORA: Requested chest "
            f"{requested_cm:.2f} cm exceeds "
            f"DECR target range "
            f"({limit_chest:.2f} cm)."
        )

    # Binary search
    low = 0.0
    high = 1.0

    best_value = 0.0
    best_chest = initial_chest
    best_error = initial_error

    for iteration in range(20):

        mid = (low + high) / 2.0

        if direction == "INCR":
            set_chest_targets(
                incr=mid,
                decr=0.0
            )
        else:
            set_chest_targets(
                incr=0.0,
                decr=mid
            )

        current = measure_chest()

        error = abs(
            current - requested_cm
        )

        print(
            f"{iteration + 1:02d}: "
            f"{direction}={mid:.6f} -> "
            f"{current:.2f} cm "
            f"(error={error:.3f})"
        )

        if error < best_error:
            best_error = error
            best_value = mid
            best_chest = current

        if error <= tolerance_cm:
            break

        if direction == "INCR":

            if current < requested_cm:
                low = mid
            else:
                high = mid

        else:

            # More DECR => smaller chest
            if current > requested_cm:
                low = mid
            else:
                high = mid

    # Apply best result
    if direction == "INCR":
        set_chest_targets(
            incr=best_value,
            decr=0.0
        )
    else:
        set_chest_targets(
            incr=0.0,
            decr=best_value
        )

    final_chest = measure_chest()

    print()
    print("CHEST RESULT")

    print(
        f"Requested : "
        f"{requested_cm:.2f} cm"
    )

    print(
        f"Actual    : "
        f"{final_chest:.2f} cm"
    )

    print(
        f"Direction : {direction}"
    )

    print(
        f"Target    : "
        f"{best_value:.6f}"
    )

    print(
        f"Error     : "
        f"{abs(final_chest-requested_cm):.3f} cm"
    )

    return {
        "requested": requested_cm,
        "actual": final_chest,
        "target": best_value,
        "direction": direction,
        "error": abs(
            final_chest - requested_cm
        )
    }



# ==================================================
# HIPS
# ==================================================

HIPS_INCR_TARGET = "measure-hips-circ-incr"
HIPS_DECR_TARGET = "measure-hips-circ-decr"


def set_hips_targets(
    incr=0.0,
    decr=0.0
):
    TargetService.set_target_value(
        obj,
        HIPS_INCR_TARGET,
        float(incr)
    )

    TargetService.set_target_value(
        obj,
        HIPS_DECR_TARGET,
        float(decr)
    )

    bpy.context.view_layer.update()


def get_hips_measurement_z():
    return _get_evaluated_vertex_group_z(
        obj,
        "joint-pelvis"
    )


def measure_hips():

    hips_z = get_hips_measurement_z()

    return measure_horizontal_circumference(
        obj,
        hips_z
    )


def calibrate_hips(
    requested_cm,
    tolerance_cm=0.1
):
    print()
    print(
        "---------- HIPS CALIBRATION ----------"
    )

    if not TargetService.has_target(
        obj,
        HIPS_INCR_TARGET
    ):
        raise RuntimeError(
            "VESTORA: Hips INCR target "
            "is not available"
        )

    if not TargetService.has_target(
        obj,
        HIPS_DECR_TARGET
    ):
        raise RuntimeError(
            "VESTORA: Hips DECR target "
            "is not available"
        )

    # Neutral hips targets.
    # Existing height / waist / chest remain applied.
    set_hips_targets()

    hips_z = get_hips_measurement_z()
    initial_hips = measure_hips()

    print(
        f"Measurement Z : "
        f"{hips_z:.4f} m"
    )

    print(
        f"Initial hips  : "
        f"{initial_hips:.2f} cm"
    )

    print(
        f"Requested     : "
        f"{requested_cm:.2f} cm"
    )

    initial_error = abs(
        initial_hips - requested_cm
    )

    if initial_error <= tolerance_cm:

        print()
        print("HIPS RESULT")

        print(
            f"Requested : {requested_cm:.2f} cm"
        )

        print(
            f"Actual    : {initial_hips:.2f} cm"
        )

        print("Target    : neutral")

        print(
            f"Error     : {initial_error:.3f} cm"
        )

        return {
            "requested": requested_cm,
            "actual": initial_hips,
            "target": 0.0,
            "direction": "neutral",
            "error": initial_error,
            "z": hips_z
        }

    if requested_cm > initial_hips:
        direction = "INCR"
    else:
        direction = "DECR"

    # Find reachable limit.
    if direction == "INCR":
        set_hips_targets(
            incr=1.0,
            decr=0.0
        )
    else:
        set_hips_targets(
            incr=0.0,
            decr=1.0
        )

    limit_hips = measure_hips()

    print(
        f"{direction} limit   : "
        f"{limit_hips:.2f} cm"
    )

    if (
        direction == "INCR"
        and requested_cm > limit_hips
    ):
        set_hips_targets()

        raise RuntimeError(
            f"VESTORA: Requested hips "
            f"{requested_cm:.2f} cm exceeds "
            f"INCR target range "
            f"({limit_hips:.2f} cm)."
        )

    if (
        direction == "DECR"
        and requested_cm < limit_hips
    ):
        set_hips_targets()

        raise RuntimeError(
            f"VESTORA: Requested hips "
            f"{requested_cm:.2f} cm exceeds "
            f"DECR target range "
            f"({limit_hips:.2f} cm)."
        )

    # Binary search
    low = 0.0
    high = 1.0

    best_value = 0.0
    best_hips = initial_hips
    best_error = initial_error

    for iteration in range(20):

        mid = (low + high) / 2.0

        if direction == "INCR":
            set_hips_targets(
                incr=mid,
                decr=0.0
            )
        else:
            set_hips_targets(
                incr=0.0,
                decr=mid
            )

        current = measure_hips()

        error = abs(
            current - requested_cm
        )

        print(
            f"{iteration + 1:02d}: "
            f"{direction}={mid:.6f} -> "
            f"{current:.2f} cm "
            f"(error={error:.3f})"
        )

        if error < best_error:
            best_error = error
            best_value = mid
            best_hips = current

        if error <= tolerance_cm:
            break

        if direction == "INCR":

            if current < requested_cm:
                low = mid
            else:
                high = mid

        else:

            # More DECR => smaller circumference.
            if current > requested_cm:
                low = mid
            else:
                high = mid

    # Apply best result.
    if direction == "INCR":
        set_hips_targets(
            incr=best_value,
            decr=0.0
        )
    else:
        set_hips_targets(
            incr=0.0,
            decr=best_value
        )

    final_hips = measure_hips()
    final_z = get_hips_measurement_z()

    print()
    print("HIPS RESULT")

    print(
        f"Requested : "
        f"{requested_cm:.2f} cm"
    )

    print(
        f"Actual    : "
        f"{final_hips:.2f} cm"
    )

    print(
        f"Direction : {direction}"
    )

    print(
        f"Target    : "
        f"{best_value:.6f}"
    )

    print(
        f"Error     : "
        f"{abs(final_hips-requested_cm):.3f} cm"
    )

    return {
        "requested": requested_cm,
        "actual": final_hips,
        "target": best_value,
        "direction": direction,
        "error": abs(
            final_hips - requested_cm
        ),
        "z": final_z
    }

# ==================================================
# GENERATE BODY
# ==================================================

height_result = calibrate_height(
    requested_height
)

waist_result = calibrate_waist(
    requested_waist
)

chest_result = calibrate_chest(
    requested_chest
)

hips_result = calibrate_hips(
    requested_hips
)

print()
print("========== BODY REFINEMENT ==========")

REFINEMENT_TOLERANCE_CM = 0.1
MAX_REFINEMENT_PASSES = 5

for refinement_pass in range(
    1,
    MAX_REFINEMENT_PASSES + 1
):

    print()
    print(
        f"---------- REFINEMENT PASS "
        f"{refinement_pass} ----------"
    )

    waist_error = abs(
        measure_waist() - requested_waist
    )

    chest_error = abs(
        measure_chest() - requested_chest
    )

    hips_error = abs(
        measure_hips() - requested_hips
    )

    print(
        f"Before pass | "
        f"waist={waist_error:.3f} cm | "
        f"chest={chest_error:.3f} cm | "
        f"hips={hips_error:.3f} cm"
    )

    if max(
        waist_error,
        chest_error,
        hips_error
    ) <= REFINEMENT_TOLERANCE_CM:

        print(
            "VESTORA: Measurements converged."
        )

        break

    # Recalibrate only measurements
    # currently outside tolerance.

    if waist_error > REFINEMENT_TOLERANCE_CM:
        waist_result = calibrate_waist(
            requested_waist
        )

    if chest_error > REFINEMENT_TOLERANCE_CM:
        chest_result = calibrate_chest(
            requested_chest
        )

    if hips_error > REFINEMENT_TOLERANCE_CM:
        hips_result = calibrate_hips(
            requested_hips
        )

else:
    print()
    print(
        "VESTORA WARNING: Refinement reached "
        "maximum number of passes."
    )

print()
print("---------- POST-CALIBRATION CHECK ----------")

final_height_check = get_height_cm()
final_waist_check = measure_waist()
final_chest_check = measure_chest()
final_hips_check = measure_hips()

print(
    f"Height : {final_height_check:.2f} cm "
    f"(requested {requested_height:.2f})"
)

print(
    f"Waist  : {final_waist_check:.2f} cm "
    f"(requested {requested_waist:.2f})"
)

print(
    f"Chest  : {final_chest_check:.2f} cm "
    f"(requested {requested_chest:.2f})"
)

print(
    f"Hips   : {final_hips_check:.2f} cm "
    f"(requested {requested_hips:.2f})"
)

print(
    f"Waist drift : "
    f"{final_waist_check - requested_waist:+.3f} cm"
)

print(
    f"Chest drift : "
    f"{final_chest_check - requested_chest:+.3f} cm"
)

print(
    f"Hips drift  : "
    f"{final_hips_check - requested_hips:+.3f} cm"
)

# ==================================================
# EXPORT
# ==================================================

print()
print(
    "---------- GLB EXPORT ----------"
)


os.makedirs(
    os.path.dirname(
        OUTPUT_PATH
    ),
    exist_ok=True
)


bpy.ops.object.select_all(
    action="DESELECT"
)

obj.select_set(True)

bpy.context.view_layer.objects.active = obj


bpy.ops.export_scene.gltf(
    filepath=OUTPUT_PATH,
    export_format="GLB",
    use_selection=True
)


print(
    f"Exported: {OUTPUT_PATH}"
)


# ==================================================
# RESULT
# ==================================================

print()
print("==============================================")
print("              VESTORA RESULT")
print("==============================================")

print(
    f"Height : "
    f"{height_result['actual']:.2f} cm "
    f"(requested "
    f"{height_result['requested']:.2f})"
)

print(
    f"Waist  : "
    f"{waist_result['actual']:.2f} cm "
    f"(requested "
    f"{waist_result['requested']:.2f})"
)

print(
    f"Height error : "
    f"{height_result['error']:.3f} cm"
)

print(
    f"Waist error  : "
    f"{waist_result['error']:.3f} cm"
)

print(
    f"GLB : {OUTPUT_PATH}"
)

print("==============================================")
print()

print(
    "VESTORA: Body generated successfully."
)
