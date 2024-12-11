from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

size = 5

# Game state: 3D Tic Tac Toe grid (3x3x3), None for empty cells
grid = [[[None for _ in range(size)] for _ in range(size)] for _ in range(size)]
current_player = "X"    

def check_winner():
    # Directions for all 26 possible moves (faces, edges, corners)
    directions = [
        (1, 0, 0), ( -1, 0, 0),  # Horizontal (X-axis)
        (0, 1, 0), (0, -1, 0),   # Vertical (Y-axis)
        (0, 0, 1), (0, 0, -1),   # Depth (Z-axis)
        (1, 1, 0), (-1, 1, 0),   # Diagonal on XY plane
        (1, -1, 0), (-1, -1, 0), # Anti-diagonal on XY plane
        (1, 0, 1), (-1, 0, 1),   # Diagonal on XZ plane
        (1, 1, 1), (-1, 1, 1),   # Diagonal on XYZ space
        (1, -1, 1), (-1, -1, 1), # Anti-diagonal on XYZ space
        (0, 1, 1), (0, -1, 1),   # Diagonal on YZ plane
        (0, 1, -1), (0, -1, -1), # Anti-diagonal on YZ plane
        (1, 1, -1), (-1, 1, -1), # Top-back
        (1, -1, -1), (-1, -1, -1), # Bottom-back
    ]
    
    for z in range(size):
        for y in range(size):
            for x in range(size):
                if grid[z][y][x] is not None: 
                    current_value = grid[z][y][x]
                    
                    for dx, dy, dz in directions:
                        count = 1
                        
                        for i in range(1, size):
                            nx, ny, nz = x + dx * i, y + dy * i, z + dz * i
                            if 0 <= nx < size and 0 <= ny < size and 0 <= nz < size and grid[nz][ny][nx] == current_value:
                                count += 1
                            else:
                                break
                        
                        for i in range(1, size):
                            nx, ny, nz = x - dx * i, y - dy * i, z - dz * i
                            if 0 <= nx < size and 0 <= ny < size and 0 <= nz < size and grid[nz][ny][nx] == current_value:
                                count += 1
                            else:
                                break
                        
                        if count == size:
                            return current_value

    return None


@app.route('/')
def index():
    # Serve the main HTML file
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/move', methods=['POST'])
def make_move():
    global current_player
    data = request.get_json()
    x, y, z = int(data['x']), int(data['y']), int(data['z'])

    # Validate move
    if grid[x][y][z] is not None:
        return jsonify(success=False, message="Cell already occupied!")

    # Place the move
    grid[x][y][z] = current_player

    # Check for winner
    winner = check_winner()

    # Switch player if no winner yet

    just_moved = current_player
    if winner is None:
        current_player = "O" if current_player == "X" else "X"

    return jsonify(success=True, player=just_moved, winner=winner)

@app.route('/reset', methods=['POST'])
def reset_game():
    global grid, current_player
    grid = [[[None for _ in range(size)] for _ in range(size)] for _ in range(size)]  # Reset grid
    current_player = "X"  # Reset starting player
    return jsonify(success=True, message="Game reset successfully")

if __name__ == '__main__':
    app.run(debug=True)
