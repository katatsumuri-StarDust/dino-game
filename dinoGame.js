const canvas = document.getElementById('canvas'); // HTML の ID属性に canvas が設定されているタグを取得する。
const ctx = canvas.getContext('2d'); // 2D 描画用のオブジェクト(コンテキスト：context と呼ばれている)を呼び出す。
const imageNames = ['bird', 'cactus', 'dino'];

// グローバルな game オブジェクト
const game = {
  counter: 0,
  backGrounds: [],
  bgm1: new Audio('bgm/fieldSong.mp3'),
  bgm2: new Audio('bgm/jump.mp3'),
  enemys: [],
  enemyCountdown: 0,
  image: {},
  score: 0,
  state: 'loading', // state 変数に 'loading' を設定する。
  timer: null
};
game.bgm1.loop = true;

// 複数画像読み込み
let imageLoadCounter = 0;
for (const imageName of imageNames) { // imageNames 配列をループさせ、 画像のロードを開始させる。
  const imagePath = `image/${imageName}.png`;
  game.image[imageName] = new Image();
  game.image[imageName].src = imagePath;
  game.image[imageName].onload = () => {
    imageLoadCounter += 1; // 画像がロードされる度に imageLoadCounter 変数の値を 1 ずつ増やす。
    if (imageLoadCounter === imageNames.length) {
      console.log('画像のロードが完了しました。');
      init(); // 全ての画像がロードされた場合 init() を実行する。
    }
  }
}

function init() { // 各パラメータの初期化を行う。
  game.counter    = 0;
  game.enemys     = [];
  game.enemyCountdown = 0;
  game.isGameOver = false;
  game.score      = 0;
  game.state      = 'init';
  // 画面クリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 恐竜の表示
  createDino(); // 恐竜の初期位置などを設定する。
  drawDino();
  // 背景の描画
  createBackGround();
  drawBackGrounds();
  // 文章の表示
  ctx.fillStyle = 'black';
  ctx.font = 'bold 60px serif';
  ctx.fillText(`Press Space key`, 60, 150);
  ctx.fillText(`to start.`, 150, 230);
}

function start() {
  game.state = 'gaming';
  game.bgm1.play();
  game.timer = setInterval(ticker, 30);  // ticker() を、30ミリ秒 間隔で実行する。
}

function ticker() {
  // 画面クリア
  ctx.clearRect(0, 0, canvas.width, canvas.height); // 左上の座標から Canvas のサイズの分消す。

  // 背景の作成
  if (game.counter % 10 === 0) {
    createBackGround();
  }
  // 敵キャラクタの生成
  createEnemys();

  // キャラクタの移動
  moveBackGrounds(); // 背景の移動
  moveDino(); // 恐竜の移動
  moveEnemys(); // 敵キャラクタの移動

  //描画
  drawBackGrounds(); // 背景の描画
  drawDino();// 恐竜の描画
  drawEnemys(); // 敵キャラクタの描画
  drawScore(); // スコアの描画

  // あたり判定
  hitCheck();

  // カウンタの更新
  game.score += 1; // 毎回 1 ずつ加算する。
  game.counter = (game.counter + 1) % 1000000; // カウンタの数を 1 ずつ増やし、毎秒 33 回も実行される関数なので、値が大きくなりすぎたら 0 からまた数え始める。
  game.enemyCountdown -= 1;
}

function createDino() {
  game.dino = {
    x: game.image.dino.width / 2,
    y: canvas.height - game.image.dino.height / 2,
    moveY: 0,
    width: game.image.dino.width,
    height: game.image.dino.height,
    image: game.image.dino
  }
}

function createBackGround() {
  game.backGrounds = [];
  for (let x = 0; x <= canvas.width; x+=200) {
    game.backGrounds.push({
      x: x,
      y: canvas.height,
      width: 200,
      moveX: -20,
    });
  }
}

function createCactus(createX) { // 引数が x 座標 となる。
  game.enemys.push({
    x: createX,
    y: canvas.height - game.image.cactus.height / 2,
    width: game.image.cactus.width,
    height: game.image.cactus.height,
    moveX: -10,
    image: game.image.cactus
  });
}

function createBird() {
  const birdY = Math.random() * (300 - game.image.bird.height) + 150;
  game.enemys.push({
      x: canvas.width + game.image.bird.width / 2,
      y: birdY,
      width: game.image.bird.width,
      height: game.image.bird.height,
      moveX: -15,
      image: game.image.bird
  });
}

function createEnemys() {  // カウントダウンが 0 になったら敵キャラクタを作成する。
  if (game.enemyCountdown === 0) { // カウントダウンが 0 になったら敵キャラクタを作成する
    game.enemyCountdown = 60 - Math.floor(game.score / 100); // カウントダウンを 60 に戻し、スコアによってゲームの難易度が変わるように、100 点ごとにカウントダウンが 1 ずつ少なくなるようにする。
    if(game.enemyCountdown <= 30) game.enemyCountdown = 30; // ある一定値 (30) よりは少なくならないようにする。
    switch(Math.floor(Math.random() * 3)) { // ランダムな値(乱数)を使って、3 パターン用意する。
      case 0:
        createCactus(canvas.width + game.image.cactus.width / 2); // case 0 の時 サボテンが 1 つ出現する。
        break;
      case 1:
        createCactus(canvas.width + game.image.cactus.width / 2); // case 1 の時 サボテンが 2 つ出現する。
        createCactus(canvas.width + game.image.cactus.width * 3 / 2);
        break;
      case 2:
        createBird(); // case 2 の時 鳥が 1 つ出現する。
        break;
    }
  }
}

function moveBackGrounds() {
  for (const backGround of game.backGrounds) { // 全ての背景オブジェクトの x 座標を、移動速度分だけ移動させる。
    backGround.x += backGround.moveX;
  }
}

function moveDino() {
  game.dino.y += game.dino.moveY; // 恐竜は縦にしか移動しないため、恐竜の移動は Y 座標 を移動速度分だけ移動させる。
  if (game.dino.y >= canvas.height - game.dino.height / 2) {
      game.dino.y = canvas.height - game.dino.height / 2;
      game.dino.moveY = 0; // 恐竜が地面についた時は移動を止めたいため、移動速度を 0 に設定する。
  } else {
      game.dino.moveY += 3; // 重力があるので、Y 座標への移動速度は下の方向に大きくなっていく。
  }
}

function moveEnemys() {
  for (const enemy of game.enemys) {
    enemy.x += enemy.moveX;
  }
  // 画面の外に出たキャラクタを配列から削除
  game.enemys = game.enemys.filter(enemy => enemy.x > -enemy.width);
}

function drawBackGrounds(){
  ctx.fillStyle = 'sienna';
  for (const backGround of game.backGrounds) {
    ctx.fillRect(backGround.x, backGround.y - 5, backGround.width, 5);
    ctx.fillRect(backGround.x+20, backGround.y - 10, backGround.width - 40, 5);
    ctx.fillRect(backGround.x+50, backGround.y - 15, backGround.width - 100, 5);
  }
}

function drawDino() {
  ctx.drawImage(game.image.dino, game.dino.x - game.dino.width / 2, game.dino.y - game.dino.height / 2);
}

function drawEnemys() {
  for (const enemy of game.enemys) {
      ctx.drawImage(enemy.image, enemy.x - enemy.width / 2, enemy.y - enemy.height / 2);
  }
}

function drawScore() {
  ctx.fillStyle = 'black';
  ctx.font = '24px serif';
  ctx.fillText(`score: ${game.score}`, 0, 30);
}

function hitCheck() {
  for (const enemy of game.enemys) {
    if (
      Math.abs(game.dino.x - enemy.x) < game.dino.width * 0.8 / 2 + enemy.width * 0.9 / 2 &&
      Math.abs(game.dino.y - enemy.y) < game.dino.height * 0.5 / 2 + enemy.height * 0.9 / 2 // 判定における恐竜などのキャラクタの横幅と縦幅をより狭く変更した。
    ) {
      game.state = 'gameover';
      game.bgm1.pause(); // pause() を使用して、BGM を止める処理をする。
      ctx.fillStyle = 'black';
      ctx.font = 'bold 100px serif';
      ctx.fillText(`Game Over!`, 150, 200);
      clearInterval(game.timer);
    }
  }
}

document.onkeydown = function(e) {
  if(e.key === ' ' && game.state === 'init') {
    start(); // ゲーム初期画面の時 ゲームを開始する。
  }
  if(e.key === ' ' && game.dino.moveY === 0) { // スペースキーが入力されて、かつ、恐竜が静止している 場合 恐竜が跳ねるようにする。
    game.dino.moveY = -41; // 値を微調整することでジャンプの軌道(きどう)を調整できる。
    game.bgm2.play(); // ジャンプ用の BGM を再生する。
  }
  if(e.key === 'Enter' && game.state === 'gameover') {
    init();
  }
};



/*
  new Image() : 新たな img 要素を作成する。
  dinoImage.src = `image/画像の名前.png` : src 属性に画像のパスを設定する。
  ctx.drawImage(イメージオブジェクト, x座標, y座標) : 画像を描画(びょうが)する。
  Math.abs(数値) : 数値の絶対値を計算する。
  ctx.font : 文字の大きさや太さ、書体の設定する。
  ctx.fillText(文章, x, y) : 文章を表示させる。
*/
/*
  Canvas の座標系は左上を原点とし、 右方向に X軸、 下方向に Y軸となっています。

    x,y座標 の指定は、描画したい図形の左上の座標を指定します。
    文字などは左下の座標を指定したりなど一部例外はあります。



  ゲームに使用するデータや画像データなどを入れておく game オブジェクトをグローバルな位置に作成しましょう。

    ・counter : ゲーム開始から何フレーム目かを数えておくための数値です。
    ・enemys : フィールドに履いてされる敵キャラクタを入れておく配列です。
    ・image : ゲームに使用するイメージデータを入れておくオブジェクトです。
    ・isGameOver : ゲーム中かどうかを判断する真偽値です。
    ・score : ゲームの特典を数える数値です。
    ・timer : ゲームのフレーム切り替えを管理するタイマーです。


  game.dino = { } で、恐竜の表示位置や、移動速度などのデータを持つオブジェクトを作成します。

    ・x : 恐竜の位置を示すX座標の数値で、画像の中心としてます。表示位置は左端。
    ・y : 恐竜の位置を示すY座標の数値で、画像の中心としてます。表示位置は一番下。
    ・moveY : 恐竜のY軸の移動速度の数値
    ・width : 恐竜の画像の横幅の数値
    ・height : 恐竜の画像の縦幅の数値
    ・image : 恐竜の画像のイメージオブジェクト

  続いて恐竜の移動のアニメーションを作成していきましょう。

    アニメーションの仕組みですが、パラパラ漫画のように、少しつず移動させる事でアニメーションを作成しています。
    30ミリ秒事に実行される ticker() 関数で毎回(毎フレーム)描画を行います。

      1. 画面のクリア
      2. 敵キャラクタの生成
      3. キャラクタの移動
      4. キャラクタの描画
      5. あたり判定
      6. カウンタなどの更新

  次は、恐竜の描画をする drawDino() 関数を作成しましょう。

    画像の描画には drawImage(image, x, y); を使用します。
    指定した x と y の値は画像の左上になる事を注意しましょう。
    恐竜の座標は中心の座標でしたので、画像の横幅半分と高さの半分を左上にずらす必要があります。

  ticker() 関数に敵キャラクタの生成と、敵キャラクタの移動と、敵キャラクタの描画を追加していきましょう。

    敵キャラクタは ticker() 関数が実行されるたびに抽選され、ランダムな確率で出現するようにします。

  続いて、各敵キャラクタを速度分だけ横に移動させていきます。
  移動させたあと、画面の外に出たキャラクタは削除していきましょう。

    配列.filter() は、配列の各要素の内、条件に合うものだけの要素に絞った新しい配列を作成してくれます。
    敵キャラクタの x 座標 が画像の横幅分をこえて外にでたら削除したいため、まだ外にはみ出てない物だけをの残すようにしています。

  続いてあたり判定をする hitCheck() 関数を作成しましょう。

    現在、恐竜や敵キャラクタなどの座標は画像の中心であるため、 当たり判定は2 つの座標の距離が、
      ・X軸に関して、恐竜の横幅の半分 + 敵キャラクタの横幅の半分 以下
      ・Y軸に関して、恐竜の縦幅の半分 + 敵キャラクタの縦幅の半分 以下
    という 2 つの条件を満たすと、当たったと判定できます。

    今の状態は厳密には、画像と画像が衝突したという判定であり、恐竜のイラストと敵キャラクタのイラストが衝突したようには思えない事が起こります。
    つまり、時として疑惑の判定が行われてしまいます。

*/