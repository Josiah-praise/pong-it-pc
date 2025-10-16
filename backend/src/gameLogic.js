const BALL_SPEED = 340;
// const PADDLE_HEIGHT = 0.2;
// const PADDLE_WIDTH = 0.02;
// const BALL_SIZE = 0.12;
// const MAX_HITS = 20;
// const HIT_SPEED_INCREASE = 1.05;
class GameLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.ballPos = { x: 0, y: 0 };
    this.ballVelocity = {
      x: Math.random() > 0.5 ? BALL_SPEED / 1000 : -BALL_SPEED / 1000,
      y: (Math.random() * 2 - 1) * (BALL_SPEED / 2000)
    };
    this.paddles = {
      player1: { y: 0 },
      player2: { y: 0 }
    };
    this.score = [0, 0];
    this.hits = 0;
    this.startTime = Date.now();
    this.gameOver = false;
  }

}

module.exports = GameLogic; 