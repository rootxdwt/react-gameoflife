import React from "react";
import "./Game.css";

const CELL_SIZE = 20;
const WIDTH = 5000;
const HEIGHT = 5000;

class Cell extends React.Component {
  render() {
    const { x, y } = this.props;
    return (
      <div
        className="Cell"
        style={{
          left: `${CELL_SIZE * x + 1}px`,
          top: `${CELL_SIZE * y + 1}px`,
          width: `${CELL_SIZE - 1}px`,
          height: `${CELL_SIZE - 1}px`,
        }}
      />
    );
  }
}

class Game extends React.Component {
  constructor() {
    super();
    this.rows = HEIGHT / CELL_SIZE;
    this.cols = WIDTH / CELL_SIZE;

    this.board = this.makeEmptyBoard();

    this.mousePrevPos = [0, 0];
  }

  state = {
    cells: [],
    isRunning: false,
    interval: 100,
    fileNames: [],
  };

  makeEmptyBoard() {
    let board = [];
    for (let y = 0; y < this.rows; y++) {
      board[y] = [];
      for (let x = 0; x < this.cols; x++) {
        board[y][x] = false;
      }
    }

    return board;
  }

  getElementOffset() {
    const rect = this.boardRef.getBoundingClientRect();
    const doc = document.documentElement;

    return {
      x: rect.left + window.pageXOffset - doc.clientLeft,
      y: rect.top + window.pageYOffset - doc.clientTop,
    };
  }

  makeCells() {
    let cells = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.board[y][x]) {
          cells.push({ x, y });
        }
      }
    }

    return cells;
  }

  handleClick = (event) => {
    const elemOffset = this.getElementOffset();
    const offsetX = event.clientX - elemOffset.x;
    const offsetY = event.clientY - elemOffset.y;

    const x = Math.floor(offsetX / CELL_SIZE);
    const y = Math.floor(offsetY / CELL_SIZE);

    if (x >= 0 && x <= this.cols && y >= 0 && y <= this.rows) {
      this.board[y][x] = !this.board[y][x];
    }

    this.setState({ cells: this.makeCells() });
  };

  runGame = () => {
    this.setState({ isRunning: true });
    this.runIteration();
  };

  stopGame = () => {
    this.setState({ isRunning: false });
    if (this.timeoutHandler) {
      window.clearTimeout(this.timeoutHandler);
      this.timeoutHandler = null;
    }
  };

  runIteration() {
    let newBoard = this.makeEmptyBoard();

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        let neighbors = this.calculateNeighbors(this.board, x, y);
        if (this.board[y][x]) {
          if (neighbors === 2 || neighbors === 3) {
            newBoard[y][x] = true;
          } else {
            newBoard[y][x] = false;
          }
        } else {
          if (!this.board[y][x] && neighbors === 3) {
            newBoard[y][x] = true;
          }
        }
      }
    }

    this.board = newBoard;
    this.setState({ cells: this.makeCells() });

    this.timeoutHandler = window.setTimeout(() => {
      this.runIteration();
    }, this.state.interval);
  }

  /**
   * Calculate the number of neighbors at point (x, y)
   * @param {Array} board
   * @param {int} x
   * @param {int} y
   */
  calculateNeighbors(board, x, y) {
    let neighbors = 0;
    const dirs = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
      [1, 0],
      [1, -1],
      [0, -1],
    ];
    for (let i = 0; i < dirs.length; i++) {
      const dir = dirs[i];
      let y1 = y + dir[0];
      let x1 = x + dir[1];

      if (
        x1 >= 0 &&
        x1 < this.cols &&
        y1 >= 0 &&
        y1 < this.rows &&
        board[y1][x1]
      ) {
        neighbors++;
      }
    }

    return neighbors;
  }

  handleIntervalChange = (event) => {
    this.setState({ interval: event.target.value });
  };

  handleClear = () => {
    this.board = this.makeEmptyBoard();
    this.setState({ cells: this.makeCells() });
  };

  mouseDown = () => {
    this.setState({ isMouseDown: true });
  };
  mouseUp = () => {
    this.setState({ isMouseDown: false });
  };

  mouseMove = (event) => {
    if (this.state.isMouseDown) {
      const elemOffset = this.getElementOffset();
      const offsetX = event.clientX - elemOffset.x;
      const offsetY = event.clientY - elemOffset.y;

      const x = Math.floor(offsetX / CELL_SIZE);
      const y = Math.floor(offsetY / CELL_SIZE);

      if (x >= 0 && x <= this.cols && y >= 0 && y <= this.rows) {
        this.board[y][x] = this.state.isDeleting ? false : true;
        this.mousePrevPos = [y, x];
      }

      this.setState({ cells: this.makeCells() });
    }
  };

  Delete = () => {
    this.setState({ isDeleting: this.state.isDeleting ? false : true });
  };

  loadJson = async (e) => {
    if (e.target.value != "Select") {
      this.handleClear();
      var name = e.target.value;
      var names = await fetch(
        `https://raw.githubusercontent.com/rootxdwt/gameoflife-lexicon/main/datas/${name}`
      );
      var jsn = await names.json();
      for (var i = 0; i < jsn.length; i++) {
        this.board[jsn[i]["y"]][jsn[i]["x"]] = true;
      }
      this.setState({ cells: this.makeCells() });
    }
  };

  componentDidMount = async () => {
    var names = await fetch(
      "https://raw.githubusercontent.com/rootxdwt/gameoflife-lexicon/main/names.json"
    );
    var q = await names.json();
    this.setState({ fileNames: q });
  };
  render() {
    const { cells, interval, isRunning } = this.state;
    return (
      <div className="container">
        <div className="BoardCont">
          <div
            className="Board"
            style={{
              width: WIDTH,
              height: HEIGHT,
              backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
            }}
            onClick={this.handleClick}
            onMouseDown={this.mouseDown}
            onMouseUp={this.mouseUp}
            onMouseMove={this.mouseMove}
            ref={(n) => {
              this.boardRef = n;
            }}
          >
            {cells.map((cell) => (
              <Cell x={cell.x} y={cell.y} key={`${cell.x},${cell.y}`} />
            ))}
          </div>
        </div>

        <div className="controls">
        Interval:{" "}
          <input
            value={this.state.interval}
            onChange={this.handleIntervalChange}
            placeholder={"msecs"}
          />{" "}
          {isRunning ? (
            <button className="button" onClick={this.stopGame}>
              Stop
            </button>
          ) : (
            <button className="button" onClick={this.runGame}>
              Run
            </button>
          )}
          <button className="button" onClick={this.Delete}>
            {this.state.isDeleting ? "Cancel" : "Delete multiple"}
          </button>
          <button className="button" onClick={this.handleClear}>
            Clear
          </button>
          <select onChange={this.loadJson}>
            <option>Select</option>
            {this.state.fileNames.map((elem, i) => {
              return <option key={i}>{elem}</option>;
            })}
          </select>
        </div>
      </div>
    );
  }
}

export default Game;
