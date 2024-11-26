import os
from collections import Counter
import json

MOVES = ["F", "R", "U", "L", "B", "D",
         "F'", "R'", "U'", "L'", "B'", "D'",
         "F2", "R2", "U2", "L2", "B2", "D2"]

def parse_training_files(folder_path):
    move_data = {}

    for filename in os.listdir(folder_path):
        if filename.startswith("training.") and not filename.startswith("training.seq."):
            move_counter = Counter()
            with open(os.path.join(folder_path, filename), 'r') as file:
                lines = file.readlines()
                for i in range(1, len(lines), 2):  
                    moves = lines[i].strip().split()
                    move_counter.update(moves)

            ordered_counts = {move: move_counter.get(move, 0) for move in MOVES}
            move_data[filename] = ordered_counts

    return move_data

def parse_common_sequences(folder_path, sequence_length=3):
    file_sequence_data = {}

    for filename in os.listdir(folder_path):
        if filename.startswith("training.") and not filename.startswith("training.seq."):
            sequence_counter = Counter()
            with open(os.path.join(folder_path, filename), 'r') as file:
                lines = file.readlines()
                for i in range(1, len(lines), 2):  
                    moves = lines[i].strip().split()
                    for j in range(len(moves) - sequence_length + 1):
                        sequence = tuple(moves[j:j + sequence_length])
                        sequence_counter[sequence] += 1

            file_sequence_data[filename] = dict(sequence_counter)

    return file_sequence_data

def save_move_frequency(file_move_data, output_file):
    with open(output_file, 'w') as json_file:
        json.dump(file_move_data, json_file, indent=4)

def save_common_sequences(file_sequence_data, output_file, top_n=10):
    formatted_data = {}
    for filename, sequences in file_sequence_data.items():
        most_common_sequences = Counter(sequences).most_common(top_n)
        formatted_data[filename] = [{"sequence": list(seq), "count": count} for seq, count in most_common_sequences]

    with open(output_file, 'w') as json_file:
        json.dump(formatted_data, json_file, indent=4)

if __name__ == "__main__":
    folder_path = "dataset"

    # move frequency
    move_frequency_file = "data/move_frequency.json"
    move_frequency= parse_training_files(folder_path)
    save_move_frequency(move_frequency, move_frequency_file)
    print(f"Move frequency by file data saved to {move_frequency_file}")

    # common sequences
    sequence_length = 3
    common_sequences_file = "data/common_sequences.json"
    common_sequences = parse_common_sequences(folder_path, sequence_length)
    save_common_sequences(common_sequences, common_sequences_file, top_n=15)
    print(f"Common sequences by file data saved to {common_sequences_file}")
