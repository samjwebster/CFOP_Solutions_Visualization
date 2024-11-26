import os
import json
from collections import defaultdict

MOVES = ["F", "R", "U", "L", "B", "D",
         "F'", "R'", "U'", "L'", "B'", "D'",
         "F2", "R2", "U2", "L2", "B2", "D2"]

FACES = ["L", "U", "F", "D", "R", "B"]
COLORS = {"[r]": "0", "[y]": "1", "[g]": "2", "[w]": "3", "[o]": "4", "[b]": "5"}
FACE_COLOR = {"L": "0", "U": "1", "F": "2", "D": "3", "R": "4", "B": "5"}

def parse_cube_state(cube_state):
    cube_state = cube_state.split()

    face_matrices = {
        FACES[i]: [cube_state[i * 9:(i * 9) + 3],
                   cube_state[(i * 9) + 3:(i * 9) + 6],
                   cube_state[(i * 9) + 6:(i * 9) + 9]]
        for i in range(6)
    }

    # for face, matrix in face_matrices.items():
    #     print(f"{face}:")
    #     for row in matrix:
    #         print(" ".join(row))
    #     print()

    return face_matrices

# (init) => cross => f2l => oll => pll (solved)
def identify_next_phase(current_phase, cube_faces):
    """
    Identify the next phase of the solution based on the current cube state.
    
    Args:
        current_phase (str): The current phase (e.g., "cross").
        cube_faces (dict): A dictionary mapping face names to 3x3 matrices.

    Returns:
        str: The next phase ("cross", "f2l", etc.).
    """
    def check_cross(cube_faces):
        # check D faces for a cross
        d_face = cube_faces["D"]
        cross_positions = [(0, 1), (1, 0), (1, 1), (1, 2), (2, 1)]
        if not all(d_face[x][y] == FACE_COLOR["D"] for x, y in cross_positions):
            return False
        
        # check L, F, R, B faces
        positions = {
            "L": [(1, 1), (2, 1)],
            "F": [(1, 1), (2, 1)],
            "R": [(1, 1), (2, 1)],
            "B": [(1, 1), (2, 1)],
        }
        
        for face, positions in positions.items():
            if not all(cube_faces[face][x][y] == FACE_COLOR[face] for x, y in positions):
                return False
        
        return True

    def check_f2l(cube_faces):
        positions = {
            "L": [(1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)],
            "F": [(1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)],
            "D": [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)],
            "R": [(1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)],
            "B": [(1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)]
        }

        for face, positions in positions.items():
            if not all(cube_faces[face][x][y] == FACE_COLOR[face] for x, y in positions):
                return False
        return True
    
    def check_oll(cube_faces):
        positions = {
            "L": [(1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)],
            "U": [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)],
            "F": [(1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)],
            "D": [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)],
            "R": [(1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)],
            "B": [(1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)]
        }

        for face, positions in positions.items():
            if not all(cube_faces[face][x][y] == FACE_COLOR[face] for x, y in positions):
                return False
        return True
    
    def check_pll(cube_faces):
        positions = {
            "L": [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)],
            "U": [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)],
            "F": [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)],
            "D": [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)],
            "R": [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)],
            "B": [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)]
        }

        for face, positions in positions.items():
            if not all(cube_faces[face][x][y] == FACE_COLOR[face] for x, y in positions):
                return False
        return True
    
    next_phase = current_phase
    if current_phase == "cross" and check_cross(cube_faces): # check for the end of cross phase
        next_phase = "f2l"
    if current_phase == "f2l" and check_f2l(cube_faces): # check for the end of f2l phase
        next_phase = "oll"
    if current_phase == "oll" and check_oll(cube_faces): # check for the end of oll phase
        next_phase = "pll"
    if current_phase == "pll" and check_pll(cube_faces): # check of the end of pll phase (solved)
        next_phase = "solved"
    return next_phase


def parse_solution_file(filepath):
    """
    Parse a solution file and compute move frequency for each phase transition.
    """
    phase_move_counts = defaultdict(lambda: {move: 0 for move in MOVES})

    with open(filepath, 'r') as file:
        lines = file.readlines()

    current_phase = "cross"
    current_moves = []
    for line in lines:
        line = line.strip()

        if len(line.split()) == 54:  # cube state line
            cube_faces = parse_cube_state(line)
            next_phase = identify_next_phase(current_phase, cube_faces)
            if next_phase != current_phase:
                for move in current_moves:
                    phase_move_counts[current_phase][move] += 1
                current_phase = next_phase
                current_moves = []
        elif line in MOVES: # move line
            current_moves.append(line)

        if line == "#" and current_phase == "solved": # end of solution
            for move in current_moves:
                phase_move_counts["pll"][move] += 1
            current_phase = "cross"
            current_moves = []

    return phase_move_counts


def process_all_files(folder_path):
    """
    Process all solution files in the folder and aggregate move counts.
    """
    aggregated_counts = {}

    for filename in os.listdir(folder_path):
        if filename.startswith("training.seq."):
            training_file = f"training.{filename.split('.')[-1]}"
            aggregated_counts[training_file] = defaultdict(lambda: defaultdict(int))
            filepath = os.path.join(folder_path, filename)
            file_counts = parse_solution_file(filepath)

            for phase, moves in file_counts.items():
                for move, count in moves.items():
                    aggregated_counts[training_file][phase][move] += count

    return aggregated_counts


def save_to_json(data, output_file):
    """
    Save the aggregated move counts to a JSON file.
    """
    with open(output_file, 'w') as file:
        json.dump(data, file, indent=4)


if __name__ == "__main__":
    folder_path = "dataset" 
    output_file = "data/cfop_distribution.json"

    move_counts = process_all_files(folder_path)
    save_to_json(move_counts, output_file)

    print(f"CFOP move distribution saved to {output_file}")
