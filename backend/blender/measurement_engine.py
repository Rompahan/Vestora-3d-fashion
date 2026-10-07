from mathutils import Vector
from collections import defaultdict


EPSILON = 0.0001




def _intersect_edge(v1, v2, z):
    z1 = v1.z
    z2 = v2.z

    if (z1 < z and z2 < z) or (z1 > z and z2 > z):
        return None

    dz = z2 - z1

    if abs(dz) < 1e-9:
        return None

    t = (z - z1) / dz

    if not 0.0 <= t <= 1.0:
        return None

    p = v1.lerp(v2, t)

    return Vector((p.x, p.y))


from mathutils import Vector
from collections import defaultdict


EPSILON = 0.0001


def _point_key(p):
    return (
        round(p.x / EPSILON),
        round(p.y / EPSILON)
    )


def _intersect_edge(v1, v2, z):
    z1 = v1.z
    z2 = v2.z

    if (z1 < z and z2 < z) or (z1 > z and z2 > z):
        return None

    dz = z2 - z1

    if abs(dz) < 1e-9:
        return None

    t = (z - z1) / dz

    if not 0.0 <= t <= 1.0:
        return None

    p = v1.lerp(v2, t)

    return Vector((p.x, p.y))


def measure_horizontal_circumference(obj, z):
    """
    Measure the main closed torso contour produced by
    intersecting the evaluated body mesh with a
    horizontal plane at local coordinate Z.

    Returns circumference in centimeters.
    """

    depsgraph = obj.evaluated_get(
        __import__("bpy").context.evaluated_depsgraph_get()
    )

    mesh = depsgraph.to_mesh()

    try:
        segments = []

        for polygon in mesh.polygons:
            intersections = []
            vertices = polygon.vertices

            for i in range(len(vertices)):
                a = mesh.vertices[vertices[i]].co
                b = mesh.vertices[
                    vertices[(i + 1) % len(vertices)]
                ].co

                p = _intersect_edge(a, b, z)

                if p is None:
                    continue

                if not any(
                    (existing - p).length < EPSILON
                    for existing in intersections
                ):
                    intersections.append(p)

            if len(intersections) == 2:
                p1, p2 = intersections

                if (p1 - p2).length > EPSILON:
                    segments.append((p1, p2))

        points = {}
        graph = defaultdict(set)

        for p1, p2 in segments:
            k1 = _point_key(p1)
            k2 = _point_key(p2)

            points[k1] = p1
            points[k2] = p2

            graph[k1].add(k2)
            graph[k2].add(k1)


        # ------------------------------------------
        # Repair tiny numerical gaps
        # ------------------------------------------
        #
        # A valid mesh-plane intersection should form
        # closed loops. Floating-point noise can leave
        # two endpoints extremely close to each other
        # without connecting them.
        #
        # Only degree-1 endpoints are considered, so
        # normal contour topology is not modified.

        GAP_REPAIR_EPSILON = 0.001  # 1 mm

        endpoints = [
            key
            for key in graph
            if len(graph[key]) == 1
        ]

        repaired = set()

        for i, key_a in enumerate(endpoints):

            if key_a in repaired:
                continue

            point_a = points[key_a]

            best_key = None
            best_distance = float("inf")

            for key_b in endpoints[i + 1:]:

                if key_b in repaired:
                    continue

                point_b = points[key_b]

                distance = (
                    point_a - point_b
                ).length

                if (
                    distance < best_distance
                    and distance <= GAP_REPAIR_EPSILON
                ):
                    best_distance = distance
                    best_key = key_b

            if best_key is not None:

                graph[key_a].add(best_key)
                graph[best_key].add(key_a)

                repaired.add(key_a)
                repaired.add(best_key)


        visited = set()
        candidates = []

        for start in graph:
            if start in visited:
                continue

            stack = [start]
            component = set()

            while stack:
                current = stack.pop()

                if current in visited:
                    continue

                visited.add(current)
                component.add(current)

                for neighbor in graph[current]:
                    if neighbor not in visited:
                        stack.append(neighbor)

            closed = all(
                len(graph[key]) == 2
                for key in component
            )

            if not closed:
                continue

            center = Vector((0.0, 0.0))

            for key in component:
                center += points[key]

            center /= len(component)

            # Ignore arms / disconnected side contours
            if abs(center.x) >= 0.10:
                continue

            perimeter = 0.0
            counted_edges = set()

            for key in component:
                for neighbor in graph[key]:
                    edge_id = tuple(
                        sorted((key, neighbor))
                    )

                    if edge_id in counted_edges:
                        continue

                    counted_edges.add(edge_id)

                    perimeter += (
                        points[key] -
                        points[neighbor]
                    ).length

            candidates.append(perimeter * 100.0)

        if not candidates:

            degree_counts = defaultdict(int)

            for key in graph:
                degree_counts[
                    len(graph[key])
                ] += 1
            
            raise RuntimeError(
                f"No torso contour found at Z={z:.3f}. "
                f"Segments={len(segments)}, "
                f"Nodes={len(graph)}, "
                f"Degrees={dict(degree_counts)}"
            )

        return max(candidates)

    finally:
        depsgraph.to_mesh_clear()


def get_horizontal_contours(obj, z):
    """
    Returns all closed horizontal contours at Z.

    Each contour:
    {
        "perimeter": centimeters,
        "center_x": meters,
        "center_y": meters,
        "min_x": meters,
        "max_x": meters,
        "min_y": meters,
        "max_y": meters,
        "point_count": int
    }
    """

    bpy = __import__("bpy")

    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated_obj = obj.evaluated_get(depsgraph)
    mesh = evaluated_obj.to_mesh()

    try:
        segments = []

        for polygon in mesh.polygons:
            intersections = []
            vertices = polygon.vertices

            for i in range(len(vertices)):
                a = mesh.vertices[vertices[i]].co
                b = mesh.vertices[
                    vertices[(i + 1) % len(vertices)]
                ].co

                p = _intersect_edge(a, b, z)

                if p is None:
                    continue

                if not any(
                    (existing - p).length < EPSILON
                    for existing in intersections
                ):
                    intersections.append(p)

            if len(intersections) == 2:
                p1, p2 = intersections

                if (p1 - p2).length > EPSILON:
                    segments.append((p1, p2))

        points = {}
        graph = defaultdict(set)

        for p1, p2 in segments:
            k1 = _point_key(p1)
            k2 = _point_key(p2)

            points[k1] = p1
            points[k2] = p2

            graph[k1].add(k2)
            graph[k2].add(k1)

        visited = set()
        contours = []

        for start in graph:

            if start in visited:
                continue

            stack = [start]
            component = set()

            while stack:
                current = stack.pop()

                if current in visited:
                    continue

                visited.add(current)
                component.add(current)

                for neighbor in graph[current]:
                    if neighbor not in visited:
                        stack.append(neighbor)

            closed = all(
                len(graph[key]) == 2
                for key in component
            )

            if not closed:
                continue

            contour_points = [
                points[key]
                for key in component
            ]

            center = Vector((0.0, 0.0))

            for point in contour_points:
                center += point

            center /= len(contour_points)

            perimeter = 0.0
            counted_edges = set()

            for key in component:
                for neighbor in graph[key]:

                    edge_id = tuple(
                        sorted((key, neighbor))
                    )

                    if edge_id in counted_edges:
                        continue

                    counted_edges.add(edge_id)

                    perimeter += (
                        points[key] -
                        points[neighbor]
                    ).length

            xs = [p.x for p in contour_points]
            ys = [p.y for p in contour_points]

            contours.append({
                "perimeter": perimeter * 100.0,

                "center_x": center.x,
                "center_y": center.y,

                "min_x": min(xs),
                "max_x": max(xs),

                "min_y": min(ys),
                "max_y": max(ys),

                "point_count": len(contour_points)
            })

        return contours

    finally:
        evaluated_obj.to_mesh_clear()

def measure_hips_circumference(obj):
    """
    Automatically measures the widest valid central
    pelvis contour.

    Returns circumference in centimeters.
    """

    height_cm = obj.dimensions.z * 100.0

    # Reference scan range calibrated on ~181.97 cm body
    scale = height_cm / 181.97

    z_start = 0.86 * scale
    z_end = 1.02 * scale
    step = 0.005 * scale

    candidates = []

    z = z_start

    while z <= z_end + 1e-9:

        contours = get_horizontal_contours(
            obj,
            z
        )

        central = [
            c for c in contours
            if abs(c["center_x"]) < 0.03
            and c["min_x"] < 0
            and c["max_x"] > 0
        ]

        if central:

            contour = max(
                central,
                key=lambda c:
                    c["max_x"] - c["min_x"]
            )

            width = (
                contour["max_x"] -
                contour["min_x"]
            )

            candidates.append({
                "z": z,
                "width": width,
                "circumference": contour["perimeter"]
            })

        z += step

    if not candidates:
        raise RuntimeError(
            "VESTORA: Could not find hips contour"
        )

    hips = max(
        candidates,
        key=lambda item: item["width"]
    )

    return hips["circumference"]


def _get_evaluated_vertex_group_z(obj, group_name):
    """
    Returns weighted Z center of an anatomical vertex group
    after shape keys have been evaluated.

    Topology-changing modifiers are temporarily disabled so
    MakeHuman's original vertex indices remain valid.
    """

    bpy = __import__("bpy")

    group = obj.vertex_groups.get(group_name)

    if group is None:
        raise RuntimeError(
            f"VESTORA: Vertex group not found: {group_name}"
        )

    group_index = group.index

    modifier_states = []

    for modifier in obj.modifiers:
        modifier_states.append(
            (modifier, modifier.show_viewport)
        )
        modifier.show_viewport = False

    evaluated_obj = None

    try:
        bpy.context.view_layer.update()

        depsgraph = bpy.context.evaluated_depsgraph_get()
        evaluated_obj = obj.evaluated_get(depsgraph)
        mesh = evaluated_obj.to_mesh()

        if len(mesh.vertices) != len(obj.data.vertices):
            raise RuntimeError(
                "VESTORA: Cannot evaluate anatomical landmark. "
                f"Topology mismatch: "
                f"{len(obj.data.vertices)} -> "
                f"{len(mesh.vertices)}"
            )

        weighted_z = 0.0
        total_weight = 0.0

        for vertex in obj.data.vertices:

            for membership in vertex.groups:

                if membership.group != group_index:
                    continue

                weight = membership.weight

                weighted_z += (
                    mesh.vertices[vertex.index].co.z
                    * weight
                )

                total_weight += weight
                break

        if total_weight == 0.0:
            raise RuntimeError(
                f"VESTORA: Vertex group is empty: {group_name}"
            )

        return weighted_z / total_weight

    finally:

        if evaluated_obj is not None:
            evaluated_obj.to_mesh_clear()

        for modifier, state in modifier_states:
            modifier.show_viewport = state

        bpy.context.view_layer.update()


def measure_chest_circumference(obj):
    """
    Measures chest/bust circumference using the evaluated
    MakeHuman nippleTip anatomical landmark.

    1. Evaluate current MPFB shape keys.
    2. Determine dynamic nippleTip Z.
    3. Measure the horizontal torso contour at that level.

    Returns circumference in centimeters.
    """

    chest_z = _get_evaluated_vertex_group_z(
        obj,
        "nippleTip"
    )

    return measure_horizontal_circumference(
        obj,
        chest_z
    )

def get_horizontal_contours(obj, z):
    """
    Returns all closed horizontal contours at Z.

    Each contour:
    {
        "perimeter": centimeters,
        "center_x": meters,
        "center_y": meters,
        "min_x": meters,
        "max_x": meters,
        "min_y": meters,
        "max_y": meters,
        "point_count": int
    }
    """

    bpy = __import__("bpy")

    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated_obj = obj.evaluated_get(depsgraph)
    mesh = evaluated_obj.to_mesh()

    try:
        segments = []

        for polygon in mesh.polygons:
            intersections = []
            vertices = polygon.vertices

            for i in range(len(vertices)):
                a = mesh.vertices[vertices[i]].co
                b = mesh.vertices[
                    vertices[(i + 1) % len(vertices)]
                ].co

                p = _intersect_edge(a, b, z)

                if p is None:
                    continue

                if not any(
                    (existing - p).length < EPSILON
                    for existing in intersections
                ):
                    intersections.append(p)

            if len(intersections) == 2:
                p1, p2 = intersections

                if (p1 - p2).length > EPSILON:
                    segments.append((p1, p2))

        points = {}
        graph = defaultdict(set)

        for p1, p2 in segments:
            k1 = _point_key(p1)
            k2 = _point_key(p2)

            points[k1] = p1
            points[k2] = p2

            graph[k1].add(k2)
            graph[k2].add(k1)

        visited = set()
        contours = []

        for start in graph:

            if start in visited:
                continue

            stack = [start]
            component = set()

            while stack:
                current = stack.pop()

                if current in visited:
                    continue

                visited.add(current)
                component.add(current)

                for neighbor in graph[current]:
                    if neighbor not in visited:
                        stack.append(neighbor)

            closed = all(
                len(graph[key]) == 2
                for key in component
            )

            if not closed:
                continue

            contour_points = [
                points[key]
                for key in component
            ]

            center = Vector((0.0, 0.0))

            for point in contour_points:
                center += point

            center /= len(contour_points)

            perimeter = 0.0
            counted_edges = set()

            for key in component:
                for neighbor in graph[key]:

                    edge_id = tuple(
                        sorted((key, neighbor))
                    )

                    if edge_id in counted_edges:
                        continue

                    counted_edges.add(edge_id)

                    perimeter += (
                        points[key] -
                        points[neighbor]
                    ).length

            xs = [p.x for p in contour_points]
            ys = [p.y for p in contour_points]

            contours.append({
                "perimeter": perimeter * 100.0,

                "center_x": center.x,
                "center_y": center.y,

                "min_x": min(xs),
                "max_x": max(xs),

                "min_y": min(ys),
                "max_y": max(ys),

                "point_count": len(contour_points)
            })

        return contours

    finally:
        evaluated_obj.to_mesh_clear()

def measure_hips_circumference(obj):
    """
    Automatically measures the widest valid central
    pelvis contour.

    Returns circumference in centimeters.
    """

    height_cm = obj.dimensions.z * 100.0

    # Reference scan range calibrated on ~181.97 cm body
    scale = height_cm / 181.97

    z_start = 0.86 * scale
    z_end = 1.02 * scale
    step = 0.005 * scale

    candidates = []

    z = z_start

    while z <= z_end + 1e-9:

        contours = get_horizontal_contours(
            obj,
            z
        )

        central = [
            c for c in contours
            if abs(c["center_x"]) < 0.03
            and c["min_x"] < 0
            and c["max_x"] > 0
        ]

        if central:

            contour = max(
                central,
                key=lambda c:
                    c["max_x"] - c["min_x"]
            )

            width = (
                contour["max_x"] -
                contour["min_x"]
            )

            candidates.append({
                "z": z,
                "width": width,
                "circumference": contour["perimeter"]
            })

        z += step

    if not candidates:
        raise RuntimeError(
            "VESTORA: Could not find hips contour"
        )

    hips = max(
        candidates,
        key=lambda item: item["width"]
    )

    return hips["circumference"]


def _get_evaluated_vertex_group_z(obj, group_name):
    """
    Returns weighted Z center of an anatomical vertex group
    after shape keys have been evaluated.

    Topology-changing modifiers are temporarily disabled so
    MakeHuman's original vertex indices remain valid.
    """

    bpy = __import__("bpy")

    group = obj.vertex_groups.get(group_name)

    if group is None:
        raise RuntimeError(
            f"VESTORA: Vertex group not found: {group_name}"
        )

    group_index = group.index

    modifier_states = []

    for modifier in obj.modifiers:
        modifier_states.append(
            (modifier, modifier.show_viewport)
        )
        modifier.show_viewport = False

    evaluated_obj = None

    try:
        bpy.context.view_layer.update()

        depsgraph = bpy.context.evaluated_depsgraph_get()
        evaluated_obj = obj.evaluated_get(depsgraph)
        mesh = evaluated_obj.to_mesh()

        if len(mesh.vertices) != len(obj.data.vertices):
            raise RuntimeError(
                "VESTORA: Cannot evaluate anatomical landmark. "
                f"Topology mismatch: "
                f"{len(obj.data.vertices)} -> "
                f"{len(mesh.vertices)}"
            )

        weighted_z = 0.0
        total_weight = 0.0

        for vertex in obj.data.vertices:

            for membership in vertex.groups:

                if membership.group != group_index:
                    continue

                weight = membership.weight

                weighted_z += (
                    mesh.vertices[vertex.index].co.z
                    * weight
                )

                total_weight += weight
                break

        if total_weight == 0.0:
            raise RuntimeError(
                f"VESTORA: Vertex group is empty: {group_name}"
            )

        return weighted_z / total_weight

    finally:

        if evaluated_obj is not None:
            evaluated_obj.to_mesh_clear()

        for modifier, state in modifier_states:
            modifier.show_viewport = state

        bpy.context.view_layer.update()


def measure_chest_circumference(obj):
    """
    Measures chest/bust circumference using the evaluated
    MakeHuman nippleTip anatomical landmark.

    1. Evaluate current MPFB shape keys.
    2. Determine dynamic nippleTip Z.
    3. Measure the horizontal torso contour at that level.

    Returns circumference in centimeters.
    """

    chest_z = _get_evaluated_vertex_group_z(
        obj,
        "nippleTip"
    )

    return measure_horizontal_circumference(
        obj,
        chest_z
    )