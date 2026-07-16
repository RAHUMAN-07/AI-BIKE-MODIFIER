import json
import struct
import os

def create_bike_glb(output_path):
    """
    Creates a valid binary GLB (glTF 2.0) file containing 3D meshes for motorcycle parts.
    Ensures compatibility with Three.js GLTFLoader / @react-three/drei useGLTF.
    """
    parts_def = [
        {"name": "fuel_tank", "pos": [0.0, 1.1, 0.2], "scale": [0.35, 0.3, 0.5]},
        {"name": "fairing", "pos": [0.0, 1.2, 0.8], "scale": [0.4, 0.45, 0.4]},
        {"name": "seat", "pos": [0.0, 1.0, -0.4], "scale": [0.3, 0.15, 0.5]},
        {"name": "frame", "pos": [0.0, 0.7, 0.0], "scale": [0.3, 0.4, 0.9]},
        {"name": "engine", "pos": [0.0, 0.5, 0.1], "scale": [0.32, 0.35, 0.4]},
        {"name": "exhaust", "pos": [0.25, 0.35, -0.4], "scale": [0.1, 0.1, 0.7]},
        {"name": "front_wheel", "pos": [0.0, 0.4, 1.1], "scale": [0.15, 0.4, 0.4]},
        {"name": "rear_wheel", "pos": [0.0, 0.4, -1.0], "scale": [0.18, 0.4, 0.4]},
        {"name": "front_rim", "pos": [0.0, 0.4, 1.1], "scale": [0.12, 0.3, 0.3]},
        {"name": "rear_rim", "pos": [0.0, 0.4, -1.0], "scale": [0.14, 0.3, 0.3]},
        {"name": "handlebar", "pos": [0.0, 1.35, 0.6], "scale": [0.7, 0.05, 0.08]},
        {"name": "headlight", "pos": [0.0, 1.25, 1.05], "scale": [0.2, 0.2, 0.1]},
        {"name": "taillight", "pos": [0.0, 1.05, -0.9], "scale": [0.15, 0.1, 0.08]},
        {"name": "mudguard_front", "pos": [0.0, 0.65, 1.1], "scale": [0.22, 0.15, 0.45]},
        {"name": "swingarm", "pos": [0.0, 0.45, -0.5], "scale": [0.25, 0.1, 0.6]},
    ]

    box_positions = [
        -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
        -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
        -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
        -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
         0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
        -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5
    ]

    box_normals = [
        0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
        0, 0,-1,  0, 0,-1,  0, 0,-1,  0, 0,-1,
        0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
        0,-1, 0,  0,-1, 0,  0,-1, 0,  0,-1, 0,
        1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
       -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
    ]

    box_indices = [
        0, 1, 2,  0, 2, 3,
        4, 5, 6,  4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23
    ]

    bin_data = bytearray()

    pos_bytes = struct.pack(f'{len(box_positions)}f', *box_positions)
    pos_offset = len(bin_data)
    bin_data.extend(pos_bytes)

    norm_bytes = struct.pack(f'{len(box_normals)}f', *box_normals)
    norm_offset = len(bin_data)
    bin_data.extend(norm_bytes)

    idx_bytes = struct.pack(f'{len(box_indices)}H', *box_indices)
    idx_offset = len(bin_data)
    bin_data.extend(idx_bytes)
    while len(bin_data) % 4 != 0:
        bin_data.append(0)

    total_bin_length = len(bin_data)

    buffer_views = [
        {"buffer": 0, "byteOffset": pos_offset, "byteLength": len(pos_bytes), "target": 34962},
        {"buffer": 0, "byteOffset": norm_offset, "byteLength": len(norm_bytes), "target": 34962},
        {"buffer": 0, "byteOffset": idx_offset, "byteLength": len(idx_bytes), "target": 34963}
    ]

    accessors = [
        {
            "bufferView": 0, "byteOffset": 0, "componentType": 5126, "count": 24, "type": "VEC3",
            "min": [-0.5, -0.5, -0.5], "max": [0.5, 0.5, 0.5]
        },
        {
            "bufferView": 1, "byteOffset": 0, "componentType": 5126, "count": 24, "type": "VEC3",
            "min": [-1.0, -1.0, -1.0], "max": [1.0, 1.0, 1.0]
        },
        {
            "bufferView": 2, "byteOffset": 0, "componentType": 5123, "count": 36, "type": "SCALAR",
            "min": [0], "max": [23]
        }
    ]

    materials = [
        {"name": "BikeMaterial", "pbrMetallicRoughness": {"baseColorFactor": [0.8, 0.8, 0.8, 1.0], "roughnessFactor": 0.3, "metallicFactor": 0.5}}
    ]

    meshes = []
    nodes = []
    scene_nodes = []

    for i, p in enumerate(parts_def):
        mesh_index = len(meshes)
        meshes.append({
            "name": p["name"],
            "primitives": [{
                "attributes": {"POSITION": 0, "NORMAL": 1},
                "indices": 2,
                "material": 0
            }]
        })

        node_index = len(nodes)
        nodes.append({
            "name": p["name"],
            "mesh": mesh_index,
            "translation": p["pos"],
            "scale": p["scale"]
        })
        scene_nodes.append(node_index)

    gltf_dict = {
        "asset": {"version": "2.0", "generator": "MotoForge Binary GLB Exporter"},
        "scenes": [{"nodes": scene_nodes}],
        "scene": 0,
        "nodes": nodes,
        "meshes": meshes,
        "materials": materials,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{"byteLength": total_bin_length}]
    }

    json_str = json.dumps(gltf_dict)
    json_bytes = json_str.encode('utf-8')
    while len(json_bytes) % 4 != 0:
        json_bytes += b' '

    magic = b'glTF'
    version = 2
    json_chunk_type = 0x4E4F534A
    bin_chunk_type = 0x00414942

    json_chunk_len = len(json_bytes)
    bin_chunk_len = len(bin_data)

    total_size = 12 + (8 + json_chunk_len) + (8 + bin_chunk_len)

    header = struct.pack('<4sII', magic, version, total_size)
    json_chunk_header = struct.pack('<II', json_chunk_len, json_chunk_type)
    bin_chunk_header = struct.pack('<II', bin_chunk_len, bin_chunk_type)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as f:
        f.write(header)
        f.write(json_chunk_header)
        f.write(json_bytes)
        f.write(bin_chunk_header)
        f.write(bin_data)

    print(f"Valid GLB generated: {output_path} ({total_size} bytes)")
