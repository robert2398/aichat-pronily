import os
import json
from datetime import datetime

EXCLUDE_FOLDERS = {".git", "node_modules"}


def get_directory_structure(rootdir):
    """
    Builds a directory tree for a React project.
    Includes file sizes and modified time for files.
    """
    dir_structure = {}
    for dirpath, dirnames, filenames in os.walk(rootdir):
        # filter out excluded dirs
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_FOLDERS]

        folder = os.path.relpath(dirpath, rootdir)
        subdir = dir_structure
        if folder != ".":
            for part in folder.split(os.sep):
                subdir = subdir.setdefault(part, {})

        for f in filenames:
            file_path = os.path.join(dirpath, f)
            try:
                size = os.path.getsize(file_path)
                mtime = os.path.getmtime(file_path)
                subdir[f] = {
                    "size_kb": round(size / 1024, 2),
                    "last_modified": datetime.fromtimestamp(mtime).strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                }
            except OSError:
                subdir[f] = {"error": "Could not retrieve info"}
    return dir_structure


def save_structure_as_json(structure, output_file="react_project_structure.json"):
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(structure, f, indent=4)


def save_structure_as_text(structure, output_file="react_project_structure.txt"):
    def write_subtree(subtree, level=0):
        lines = []
        for key, value in subtree.items():
            if isinstance(value, dict) and not (
                "size_kb" in value and "last_modified" in value
            ):
                lines.append("    " * level + f"📂 {key}")
                lines.extend(write_subtree(value, level + 1))
            else:
                if isinstance(value, dict):
                    lines.append(
                        "    " * level + f"📄 {key} "
                        f"(size: {value['size_kb']} KB, modified: {value['last_modified']})"
                    )
                else:
                    lines.append("    " * level + f"📄 {key}")
        return lines

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(write_subtree(structure)))


if __name__ == "__main__":
    root_directory = r"D:\Documents\GitHub\pronily-ui"  # change this path
    structure = get_directory_structure(root_directory)

    save_structure_as_json(structure)
    save_structure_as_text(structure)

    print(
        "✅ React project directory exported to react_project_structure.json and .txt (excluding .git & node_modules)"
    )
