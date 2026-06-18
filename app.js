"use strict";

const SVG_NS = "http://www.w3.org/2000/svg";
const HEX_RADIUS = 10;
const HEX_SIZE = 31;
const ACTION_BAR_LENGTH = 1000;
const BATTLEFIELD_TIME_SPEED = 100;
const BATTLEFIELD_TIME_ID = "battlefield-time";
const SQRT_3 = Math.sqrt(3);
const LIGHT_ORB_ASSET = "assets/ni-guang-q-light-orb.svg";
const HOURGLASS_ASSET = "assets/沙漏.svg";
const ICON_ASSETS = {
  attack: "assets/攻击.svg",
  skill: "assets/技能.svg",
  move: "assets/移动.svg",
  time: "assets/时间.svg",
  heal: "assets/治疗.svg",
  shield: "assets/护盾.svg",
  action: "assets/行动.svg",
  skip: "assets/跳过.svg",
  health: "assets/生命.svg",
  attackRange: "assets/攻击距离.svg",
};
const LINE_HEX_MIN_INTERSECTION = HEX_SIZE * 0.28;

const DIRECTIONS = [
  { q: 1, r: 0, name: "东" },
  { q: 1, r: -1, name: "东北" },
  { q: 0, r: -1, name: "西北" },
  { q: -1, r: 0, name: "西" },
  { q: -1, r: 1, name: "西南" },
  { q: 0, r: 1, name: "东南" },
];

const HEROES = {
  lux: {
    name: "你光",
    asset: "assets/lux.webp",
    hp: 100,
    actionSpeed: 150,
    attackType: "ranged",
    attackDamage: 10,
    attackRange: 4,
    projectileSpeed: 2,
    moveRange: 2,
    moveMode: "自由移动",
    passive: {
      name: "光芒四射",
      description: "伤害性技能会使目标获得【光芒四射】，持续3个回合。拉克丝的普通攻击或终极闪光会消耗该状态，造成额外12点伤害；终极闪光命中后会重新施加【光芒四射】。",
    },
    skills: {
      q: skill("Q", "光之束缚", "direction", "非指向性 / 投射物 / 控制", "选择任意方向发射光球，光球会飞至最远射程。对命中的前两个敌人造成18点伤害，并使其获得【禁锢】，持续2个回合。", 3, 18, 6, { projectileSpeed: 2, rootDuration: 2, maxDistance: 6, maxHits: 2 }),
      w: skill("W", "棱光护盾", "shieldLine", "投射物 / 护盾", "选择任意方向投出护盾光球，光球会飞至最远射程。拉克丝自身与光球经过的友军获得20点护盾，持续3个回合。", 4, 0, 6, { shield: 20, duration: 3, maxDistance: 6 }),
      e: skill("E", "光辉领域", "luxField", "范围 / 持续 / 减速 / 引爆", "选择4格内目标点生成光辉领域，目标格及相邻1格成为领域范围，持续2个回合。领域内敌人行动速度降低30%。领域存在时再次施放会引爆领域，造成22点伤害并结束领域。", 4, 22, 4, { areaRadius: 1, duration: 2, slow: 0.3 }),
      r: skill("R", "终极闪光", "beam", "方向 / 射线", "选择任意方向发射射程无限的直线射线，对路径上的所有敌人造成28点伤害。命中时先消耗【光芒四射】，再重新施加【光芒四射】。", 10, 28, 99, { maxDistance: 26 }),
      flash: flashSkill(),
    },
  },
  yasuo: {
    name: "压缩",
    asset: "assets/yasuo_0.png",
    hp: 120,
    actionSpeed: 200,
    attackType: "melee",
    attackDamage: 14,
    attackRange: 1,
    moveRange: 2,
    moveMode: "自由移动",
    passive: {
      name: "浪客之道",
      description: "技能命中敌人会积攒旋风烈斩。2层后，Q和E会变为强化技能并消耗所有层数。",
    },
    skills: {
      q: skill("Q", "斩钢闪", "yasuoQ", "方向 / 近战", "选择任意方向，斩击直线路径上2格范围内的所有敌人，造成14点伤害。若命中敌人，获得1层【旋风烈斩】；达到2层时，本技能变为【旋风斩】。", 1, 14, 2, { empoweredName: "旋风斩", empoweredRange: 6, airborneDuration: 2 }),
      w: skill("W", "风之障壁", "windWall", "屏障 / 持续", "在相邻边界生成宽度3的风墙，持续3个回合。风墙会阻挡敌方投射物。", 3, 0, 1, { duration: 3, width: 3 }),
      e: skill("E", "踏前斩", "yasuoE", "方向 / 位移 / 近战", "选择任意方向上距离3格的空格作为落点，沿直线路径突进并斩击经过的敌人，造成12点伤害。若命中敌人，获得1层【旋风烈斩】；达到2层时，本技能变为【旋风击】。", 1, 12, 3, { empoweredName: "旋风击", empoweredRange: 2, airborneDuration: 2 }),
      r: skill("R", "狂风绝息斩", "yasuoR", "浮空 / 位移 / 爆发", "选择10格内处于【浮空】的敌人，瞬移到其身边，对目标及周围2格内的敌人造成30点伤害，并移除命中敌人的【浮空】。", 6, 30, 10, { areaRadius: 2 }),
      flash: flashSkill(),
    },
  },
  mf: {
    name: "女枪",
    asset: "assets/miss_fortune.png",
    hp: 105,
    actionSpeed: 160,
    attackType: "ranged",
    attackDamage: 11,
    attackRange: 4,
    projectileSpeed: 3,
    moveRange: 2,
    moveMode: "自由移动",
    passive: {
      name: "厄运的眷顾",
      description: "女枪攻击一个新目标时，额外造成7点伤害。",
    },
    skills: {
      q: skill("Q", "一箭双雕", "mfQ", "投射物 / 弹射", "选择攻击范围内一名敌人发射炮弹，造成14点伤害。命中后，若目标身后2格锥形范围内存在其他敌人，则弹射至距离最近的目标并造成12点伤害。", 3, 14, 4, { projectileSpeed: 3 }),
      w: skill("W", "大步流星", "mfW", "瞬发 / 加速", "被动：未受到伤害时，女枪逐步获得行动速度加成。\n主动：立刻获得50%行动速度加成，直到受到伤害。", 6, 0, 0),
      e: skill("E", "枪林弹雨", "zone", "范围 / 持续 / 减速", "选择目标点降下弹雨，半径2范围内的敌人立刻受到8点伤害。弹雨持续2个回合。每个回合结算时再次造成8点伤害；范围内敌人行动速度降低20%。", 6, 8, 4, { areaRadius: 2, duration: 2, slow: 0.2 }),
      r: skill("R", "弹幕时间", "cone", "范围 / 引导", "选择任意方向开始扫射，对该方向30度夹角内5格范围的敌人造成12点伤害。至多引导2个回合。每次继续引导时，再次结算伤害。", 12, 12, 5, { duration: 2, coneAngle: 30 }),
      flash: flashSkill(),
    },
  },
  zoe: {
    name: "佐伊",
    asset: "assets/zoe.png",
    hp: 90,
    actionSpeed: 170,
    attackType: "ranged",
    attackDamage: 9,
    attackRange: 4,
    projectileSpeed: 3,
    moveRange: 2,
    moveMode: "自由移动",
    passive: {
      name: "烟火四射",
      description: "佐伊施放技能后的下一次普通攻击额外造成8点伤害。",
    },
    skills: {
      q: skill("Q", "飞星乱入", "zoeQ", "投射物 / 爆发", "首次施放：选择4格内目标点发射飞星。飞星每飞行1格，伤害提高15%。命中敌人后，造成16点基础伤害，并对目标1格范围内其他敌人造成50%溅射伤害。飞星抵达目标点后停留2个回合。\n再次施放：在飞星停留期间，重新指定飞星飞向新的目标点。", 3, 16, 4, { projectileSpeed: 4, recastWindow: 2, pauseDuration: 2, damagePerCell: 0.15 }),
      w: skill("W", "窃法巧手", "zoeW", "法术碎片", "被动：佐伊可以拾取地图上的法术碎片。\n主动：若持有法术碎片，消耗碎片并施放对应效果。本版本的法术碎片为一次性闪现。", 0, 0, 0),
      e: skill("E", "催眠气泡", "zoeE", "投射物 / 控制 / 陷阱", "选择攻击范围内目标点发射气泡。气泡命中敌人或陷阱触发时，使目标获得【困倦】；下个回合结算时，【困倦】转化为【昏睡】，持续2个回合。若气泡抵达目标点时未命中敌人，则生成半径1的陷阱，持续2个回合。", 5, 0, 4, { projectileSpeed: 1, trapDuration: 2 }),
      r: skill("R", "折返跃迁", "zoeR", "位移 / 瞬发", "选择4格内指定位置，立刻传送到该位置。佐伊会在下次行动结束后返回原位置。", 6, 0, 4),
      flash: flashSkill(),
    },
  },
};

const HERO_ORDER = ["lux", "yasuo", "mf", "zoe"];
const SKILL_ORDER = ["q", "w", "e", "r"];

const HERO_PROFILES = {
  lux: { role: "后排法师", summary: "远程控制 / 护盾保护 / 区域压制" },
  yasuo: { role: "近战剑客", summary: "直线斩击 / 位移穿插 / 浮空爆发" },
  mf: { role: "火力射手", summary: "弹射收割 / 范围压制 / 引导扫射" },
  zoe: { role: "机动法师", summary: "飞星爆发 / 催眠控制 / 折返位移" },
};

const els = {
  startMenu: document.getElementById("startMenu"),
  allyCount: document.getElementById("allyCount"),
  enemyCount: document.getElementById("enemyCount"),
  heroPicker: document.getElementById("heroPicker"),
  startButton: document.getElementById("startButton"),
  board: document.getElementById("board"),
  boardZoom: document.getElementById("boardZoom"),
  tick: document.getElementById("battleTick"),
  intensity: document.getElementById("intensity"),
  currentActor: document.getElementById("currentActor"),
  intensityFill: document.getElementById("intensityFill"),
  intensityText: document.getElementById("intensityText"),
  fighterList: document.getElementById("fighterList"),
  eventToast: document.getElementById("eventToast"),
  targetHint: document.getElementById("targetHint"),
  actionPanel: document.getElementById("actionPanel"),
  restartButton: document.getElementById("restartButton"),
  battleLog: document.getElementById("battleLog"),
  timelineTokens: document.getElementById("timelineTokens"),
  floatingTooltip: document.getElementById("floatingTooltip"),
  gameResultOverlay: document.getElementById("gameResultOverlay"),
  gameResultTitle: document.getElementById("gameResultTitle"),
  gameResultHeroes: document.getElementById("gameResultHeroes"),
  gameResultButton: document.getElementById("gameResultButton"),
};

let gridLayer;
let zoneLayer;
let wallLayer;
let shardLayer;
let markerLayer;
let projectileLayer;
let unitLayer;
let effectLayer;

const cellEls = new Map();
const unitEls = new Map();
const projectileEls = new Map();
const tokenEls = new Map();
let selectedHeroKeys = ["lux", "mf"];
let state = createState([]);
let zoneTooltipTimer = null;

function skill(key, name, kind, tags, description, cooldown, damage, range, extra = {}) {
  return {
    key,
    name,
    kind,
    tags,
    description,
    cooldown,
    currentCooldown: 0,
    damage,
    range,
    tickCost: false,
    ...extra,
  };
}

function flashSkill() {
  return skill("闪现", "闪现", "flash", "召唤师技能 / 位移", "移动至3格范围内任意空格。释放后可立即再次行动。禁锢或晕眩时不可用。", 6, 0, 3);
}

function createState(characters) {
  const cells = buildCells();
  return {
    cells,
    cellMap: new Map(cells.map((cell) => [coordKey(cell), cell])),
    characters,
    battleTick: 0,
    timeProgress: 0,
    currentActorId: null,
    selection: null,
    hoverPreview: null,
    projectiles: [],
    zones: [],
    windWalls: [],
    shards: [],
    log: [],
    isAnimating: false,
    isBattlefieldSettling: false,
    gameOver: false,
    started: characters.length > 0,
    orderCounter: 1,
    idCounter: 1,
    unitClasses: {},
    baseViewBox: null,
    viewCenter: null,
    boardDrag: null,
    suppressBoardClick: false,
    zoom: 1,
    pendingLog: null,
  };
}

function buildCells() {
  const cells = [];
  for (let q = -HEX_RADIUS; q <= HEX_RADIUS; q += 1) {
    const r1 = Math.max(-HEX_RADIUS, -q - HEX_RADIUS);
    const r2 = Math.min(HEX_RADIUS, -q + HEX_RADIUS);
    for (let r = r1; r <= r2; r += 1) cells.push({ q, r });
  }
  return cells;
}

function init() {
  renderStartMenu();
  buildBoard();
  bindEvents();
  renderAll();
  els.targetHint.textContent = "请先在开始菜单选择阵容";
}

function bindEvents() {
  els.allyCount.addEventListener("change", syncHeroSelectionLimit);
  els.startButton.addEventListener("click", startGameFromMenu);
  els.restartButton.addEventListener("click", showStartMenu);
  els.gameResultButton.addEventListener("click", showStartMenu);
  els.board.addEventListener("mousedown", handleBoardDragStart);
  els.board.addEventListener("mousemove", handleBoardPointerMove);
  els.board.addEventListener("click", handleBoardPointerClick);
  window.addEventListener("mousemove", handleBoardDragMove);
  window.addEventListener("mouseup", handleBoardDragEnd);
  window.addEventListener("wheel", handleTooltipWheel, { passive: false });
  els.boardZoom.addEventListener("input", () => {
    state.viewCenter = currentViewCenter();
    state.zoom = Number(els.boardZoom.value);
    applyBoardViewBox();
  });
}

function renderStartMenu() {
  els.heroPicker.innerHTML = "";
  HERO_ORDER.forEach((key) => {
    const hero = HEROES[key];
    const profile = HERO_PROFILES[key] || { role: "英雄", summary: "战术单位" };
    const button = document.createElement("button");
    button.type = "button";
    button.className = `hero-card ${selectedHeroKeys.includes(key) ? "selected" : ""}`;
    button.dataset.hero = key;
    button.innerHTML = `
      <span class="hero-card-pick">已选择</span>
      <img src="${hero.asset}" alt="" />
      <strong>${hero.name}</strong>
      <span class="hero-card-type">${hero.attackType === "ranged" ? "远程攻击" : "近战攻击"} · ${profile.role}</span>
      <span class="hero-card-summary">${profile.summary}</span>
    `;
    button.addEventListener("click", () => toggleHeroSelection(key));
    attachFloatingTooltip(button, heroTooltipContent(key));
    els.heroPicker.append(button);
  });
  syncHeroSelectionLimit();
}

function toggleHeroSelection(key) {
  if (selectedHeroKeys.includes(key)) {
    selectedHeroKeys = selectedHeroKeys.filter((item) => item !== key);
  } else {
    const limit = Number(els.allyCount.value);
    if (selectedHeroKeys.length >= limit) selectedHeroKeys.shift();
    selectedHeroKeys.push(key);
  }
  renderStartMenu();
}

function syncHeroSelectionLimit() {
  const limit = Number(els.allyCount.value);
  const maxEnemies = Math.max(1, HERO_ORDER.length - limit);
  const enemyOptions = els.enemyCount.options ? [...els.enemyCount.options] : [...els.enemyCount.children];
  enemyOptions.forEach((option) => {
    option.disabled = Number(option.value) > maxEnemies;
  });
  if (Number(els.enemyCount.value) > maxEnemies) els.enemyCount.value = String(maxEnemies);
  selectedHeroKeys = selectedHeroKeys.slice(0, limit);
  els.startButton.disabled = selectedHeroKeys.length !== limit;
  [...els.heroPicker.children].forEach((button) => {
    button.classList.toggle("selected", selectedHeroKeys.includes(button.dataset.hero));
  });
}

function startGameFromMenu() {
  const allyCount = Number(els.allyCount.value);
  const enemyCount = Number(els.enemyCount.value);
  if (selectedHeroKeys.length !== allyCount) return;

  const enemyPool = HERO_ORDER.filter((key) => !selectedHeroKeys.includes(key));
  const enemyKeys = pickRandom(enemyPool.length ? enemyPool : HERO_ORDER, enemyCount);
  const characters = [
    ...selectedHeroKeys.map((key, index) => createCharacter(key, "player", index)),
    ...enemyKeys.map((key, index) => createCharacter(key, "enemy", index)),
  ];

  state = createState(characters);
  tokenEls.clear();
  els.timelineTokens.innerHTML = "";
  placeTeams();
  buildBoard();
  els.startMenu.classList.add("hidden");
  hideGameResultOverlay();
  els.restartButton.hidden = true;
  renderAll();
  addLog(`战斗开始：友军 ${selectedHeroKeys.map((key) => HEROES[key].name).join("、")}；敌方 ${enemyKeys.map((key) => HEROES[key].name).join("、")}。`);
  void scheduleNextTurn();
}

function showStartMenu() {
  state = createState([]);
  unitEls.clear();
  projectileEls.clear();
  tokenEls.clear();
  els.timelineTokens.innerHTML = "";
  buildBoard();
  renderAll();
  els.startMenu.classList.remove("hidden");
  hideGameResultOverlay();
  els.restartButton.hidden = true;
  els.targetHint.textContent = "请先在开始菜单选择阵容";
}

function createCharacter(heroKey, team, index) {
  const hero = HEROES[heroKey];
  const skills = {};
  Object.entries(hero.skills).forEach(([key, value]) => {
    skills[key] = { ...value, currentCooldown: 0 };
  });
  return {
    id: `${team}-${heroKey}-${index + 1}`,
    heroKey,
    name: hero.name,
    team,
    asset: hero.asset,
    hp: hero.hp,
    maxHp: hero.hp,
    actionSpeed: hero.actionSpeed,
    actionProgress: team === "player" ? 780 + index * 45 : 690 + index * 55,
    position: { q: 0, r: 0 },
    attackType: hero.attackType,
    attackDamage: hero.attackDamage,
    attackRange: hero.attackRange,
    projectileSpeed: hero.projectileSpeed || 2,
    moveRange: hero.moveRange,
    moveMode: hero.moveMode,
    passive: hero.passive,
    skills,
    statuses: [],
    temp: {},
    isAlive: true,
    isDying: false,
    lastAttackTick: -1,
    lastDamagedTick: -1,
  };
}

function placeTeams() {
  const used = new Set();
  const playerCells = state.cells.filter((cell) => cell.q <= -2 && cell.r >= 0);
  const enemyCells = state.cells.filter((cell) => cell.q >= 2 && cell.r <= 0);
  state.characters.forEach((character) => {
    const pool = character.team === "player" ? playerCells : enemyCells;
    const cell = randomEmptyCell(pool, used);
    character.position = cloneCoord(cell);
    used.add(coordKey(cell));
  });
}

function randomEmptyCell(pool, used) {
  const available = pool.filter((cell) => !used.has(coordKey(cell)));
  return available[Math.floor(Math.random() * available.length)] || state.cells[0];
}

function buildBoard() {
  els.board.innerHTML = "";
  cellEls.clear();
  unitEls.clear();
  projectileEls.clear();

  const points = state.cells.map(hexToPixel);
  const minX = Math.min(...points.map((point) => point.x)) - HEX_SIZE * 1.35;
  const maxX = Math.max(...points.map((point) => point.x)) + HEX_SIZE * 1.35;
  const minY = Math.min(...points.map((point) => point.y)) - HEX_SIZE * 1.35;
  const maxY = Math.max(...points.map((point) => point.y)) + HEX_SIZE * 1.35;
  state.baseViewBox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

  zoneLayer = svgEl("g", { class: "zone-layer" });
  gridLayer = svgEl("g", { class: "grid-layer" });
  wallLayer = svgEl("g", { class: "wall-layer" });
  shardLayer = svgEl("g", { class: "shard-layer" });
  markerLayer = svgEl("g", { class: "marker-layer" });
  projectileLayer = svgEl("g", { class: "projectile-layer" });
  unitLayer = svgEl("g", { class: "unit-layer" });
  effectLayer = svgEl("g", { class: "effect-layer" });
  els.board.append(zoneLayer, gridLayer, wallLayer, shardLayer, markerLayer, projectileLayer, unitLayer, effectLayer);

  state.cells.forEach((cell) => {
    const center = hexToPixel(cell);
    const group = svgEl("g", { class: "hex-cell", "data-key": coordKey(cell) });
    group.append(svgEl("polygon", { points: hexPoints(center).map(pointToString).join(" ") }));
    group.addEventListener("click", (event) => handleCellClick(cell, event));
    group.addEventListener("mouseenter", (event) => handleCellPointerEnter(cell, event));
    group.addEventListener("mousemove", (event) => handleCellPointerMove(cell, event));
    group.addEventListener("mouseleave", handleCellPointerLeave);
    gridLayer.append(group);
    cellEls.set(coordKey(cell), group);
  });
  applyBoardViewBox();
}

function applyBoardViewBox() {
  if (!state.baseViewBox) return;
  const base = state.baseViewBox;
  const zoom = Math.max(1, state.zoom || 1);
  const center = focusPoint();
  const width = base.width / zoom;
  const height = base.height / zoom;
  const x = clamp(center.x - width / 2, base.x, base.x + base.width - width);
  const y = clamp(center.y - height / 2, base.y, base.y + base.height - height);
  els.board.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
}

function focusPoint() {
  if (state.viewCenter) return state.viewCenter;
  const actor = getCurrentActor() || firstAlive("player") || firstAlive("enemy");
  if (actor) return hexToPixel(actor.position);
  return { x: state.baseViewBox.x + state.baseViewBox.width / 2, y: state.baseViewBox.y + state.baseViewBox.height / 2 };
}

function currentViewBox() {
  const value = els.board.getAttribute("viewBox");
  if (!value) return null;
  const [x, y, width, height] = value.split(/\s+/).map(Number);
  if ([x, y, width, height].some((item) => !Number.isFinite(item))) return null;
  return { x, y, width, height };
}

function currentViewCenter() {
  const box = currentViewBox();
  if (box) return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  return focusPoint();
}

function clearManualViewCenter() {
  state.viewCenter = null;
  state.boardDrag = null;
}

function renderAll() {
  renderUi();
  renderHighlights();
  renderZones();
  renderWindWalls();
  renderShards();
  renderCellMarkers();
  renderProjectiles();
  renderUnits();
  applyBoardViewBox();
}

function renderUi() {
  els.tick.textContent = String(state.battleTick);
  const timeProgress = clamp(state.timeProgress, 0, ACTION_BAR_LENGTH);
  const timeText = `${Math.round(timeProgress)} / ${ACTION_BAR_LENGTH}`;
  els.intensity.setAttribute("aria-valuenow", String(Math.round(timeProgress)));
  els.intensityFill.style.width = `${(timeProgress / ACTION_BAR_LENGTH) * 100}%`;
  els.intensityText.textContent = timeText;
  const actor = getCurrentActor();
  if (state.gameOver) {
    els.currentActor.textContent = allAlive("enemy").length ? "失败" : "胜利";
  } else if (actor) {
    els.currentActor.textContent = `${actor.name}（${actor.team === "player" ? "玩家" : "敌方 AI"}）`;
  } else {
    els.currentActor.textContent = state.started ? "行动条推进中" : "未开始";
  }
  renderFighterList();
  renderTimeline();
  renderActionPanel();
}

function renderFighterList() {
  els.fighterList.innerHTML = "";
  state.characters.forEach((character) => {
    const card = document.createElement("div");
    card.className = `fighter-status ${character.team === "enemy" ? "enemy-card" : ""} ${character.id === state.currentActorId ? "active" : ""}`;
    const heading = document.createElement("div");
    heading.className = "fighter-heading";
    const avatar = document.createElement("img");
    avatar.src = character.asset;
    avatar.alt = "";
    const name = document.createElement("span");
    name.textContent = character.name;
    const hp = document.createElement("strong");
    hp.append(uiIconNode("health", "fighter-hp-icon"));
    hp.append(document.createTextNode(`${Math.max(0, character.hp)} / ${character.maxHp}`));
    heading.append(avatar, name, hp);

    const meter = document.createElement("meter");
    meter.min = "0";
    meter.max = String(character.maxHp);
    meter.value = String(Math.max(0, character.hp));

    const statMini = document.createElement("div");
    statMini.setAttribute("class", "stat-mini");
    statMini.append(
      statChip("攻", character.attackDamage),
      statChip("速", Math.round(effectiveActionSpeed(character))),
      statChip("距", character.attackRange),
      statChip("移", character.moveRange),
    );
    attachFloatingTooltip(statMini, characterDetailTooltip(character));

    const passive = document.createElement("span");
    passive.className = "passive-pill";
    passive.textContent = `被动：${character.passive.name}`;
    attachFloatingTooltip(passive, passiveTooltipContent(character));

    const row = document.createElement("div");
    row.className = "status-row";
    const mfPassive = missFortunePassiveInfo(character);
    if (mfPassive) {
      const pill = document.createElement("span");
      pill.className = "status-pill mf-passive";
      pill.textContent = `流星 ${mfPassive.layers}层`;
      attachFloatingTooltip(pill, {
        eyebrow: "被动状态",
        title: "大步流星",
        subtitle: "女枪当前行动速度加成",
        sections: [
          { title: "效果", rows: [["行动速度", `+${Math.round(mfPassive.bonus * 100)}%`], ["层数", `${mfPassive.layers}层`]] },
        ],
      });
      row.append(pill);
    }
    character.statuses.filter((status) => status.remaining > 0).forEach((status) => {
      const pill = document.createElement("span");
      pill.className = `status-pill ${status.type}`;
      pill.textContent = statusLabel(status);
      attachFloatingTooltip(pill, statusTooltipContent(status, character));
      row.append(pill);
    });
    card.append(heading, meter, statMini, passive, row);
    els.fighterList.append(card);
  });
}

function renderTimeline() {
  const liveIds = new Set([...state.characters.map((character) => character.id), BATTLEFIELD_TIME_ID]);
  state.characters.forEach((character, index) => {
    let token = tokenEls.get(character.id);
    if (!token) {
      token = document.createElement("div");
      token.className = `timeline-token ${character.team === "player" ? "player-token" : "enemy-token"}`;
      token.innerHTML = `<img src="${character.asset}" alt="" /><span>${character.name}</span>`;
      els.timelineTokens.append(token);
      tokenEls.set(character.id, token);
    }
    token.style.left = `${Math.min(100, (character.actionProgress / ACTION_BAR_LENGTH) * 100)}%`;
    token.style.setProperty("--lane", String(index % 3));
    token.hidden = !character.isAlive && !character.isDying;
  });
  let timeToken = tokenEls.get(BATTLEFIELD_TIME_ID);
  if (!timeToken) {
    timeToken = document.createElement("div");
    timeToken.className = "timeline-token time-token";
    timeToken.innerHTML = `<img class="timeline-icon icon-time" src="${ICON_ASSETS.time}" alt="" /><span>战斗回合</span>`;
    els.timelineTokens.append(timeToken);
    tokenEls.set(BATTLEFIELD_TIME_ID, timeToken);
  }
  timeToken.style.left = `${Math.min(100, (state.timeProgress / ACTION_BAR_LENGTH) * 100)}%`;
  timeToken.style.setProperty("--lane", "3");
  timeToken.hidden = !state.started || state.gameOver;
  tokenEls.forEach((token, id) => {
    if (!liveIds.has(id)) {
      token.remove();
      tokenEls.delete(id);
    }
  });
}

function renderActionPanel() {
  els.actionPanel.innerHTML = "";
  const actor = getCurrentActor();
  if (state.gameOver) {
    els.restartButton.hidden = true;
    els.targetHint.textContent = allAlive("enemy").length ? "失败" : "胜利";
    renderActionWaiting("战斗结束");
    return;
  }
  els.restartButton.hidden = true;

  if (!state.started) {
    renderActionWaiting("等待中");
    return;
  }

  if (!actor || actor.team !== "player") {
    renderActionWaiting("等待中");
    return;
  }

  const disabled = state.isAnimating || !actor.isAlive;
  if (disabled) {
    renderActionWaiting("等待中");
    return;
  }
  const channel = getChannelStatus(actor);
  if (channel) {
    renderChannelPanel(actor, channel, disabled);
    return;
  }
  if (state.selection?.menu === "skills") {
    renderSkillMenu(actor, disabled);
    return;
  }

  addActionButton("移动", "普通移动：选择移动距离内空格。", () => prepareMove(actor), !canMove(actor), "primary", { icon: "move", preview: () => buildMovePreview(actor) });
  addActionButton("攻击", basicAttackTooltip(actor), () => prepareAttack(actor), !canAttack(actor), "warn", { icon: "attack", cooldown: canAttack(actor) ? "可用" : "后摇中", preview: () => buildAttackPreview(actor) });
  addActionButton("技能", "打开技能子菜单。技能标签会显示在各技能 tooltip 中。", () => showSkillMenu(actor), hasStatus(actor, "stun"), "", { icon: "skill" });
  addActionButton("跳过", "不移动、不攻击，仅结束当前行动轮次。", () => waitAction(actor), false, "", { icon: "skip" });
}

function renderActionWaiting(text) {
  const wait = document.createElement("div");
  wait.className = "action-waiting";
  wait.append(uiIconNode("action", "action-waiting-icon"));
  wait.append(textEl("strong", "", text));
  els.actionPanel.append(wait);
}

function renderChannelPanel(actor, channel, disabled) {
  const skillName = channel.skillName || "引导技能";
  addActionButton(`继续引导${skillName}`, `结算一次${skillName}的引导效果，并结束当前行动轮次。`, () => continueChannelAction(actor), disabled, "primary", { icon: "skill", cooldown: `${channel.remaining}次` });
  addActionButton("结束引导", `立刻结束引导中：${skillName}，本轮次可继续选择常规行动。`, () => endChannelAction(actor), disabled, "warn", { icon: "skip" });
}

function renderSkillMenu(actor, disabled) {
  ["q", "w", "e", "r", "flash"].forEach((key) => {
    const currentSkill = getEffectiveSkill(actor, key);
    if (!currentSkill) return;
    const luxField = actor.heroKey === "lux" && key === "e" ? getLuxField(actor) : null;
    const label = luxField ? `${currentSkill.key} 引爆光辉领域` : key === "flash" ? "闪现" : `${currentSkill.key} ${currentSkill.name}`;
    const meta = skillButtonMeta(currentSkill);
    if (luxField) {
      meta.cooldownValue = luxField.remaining;
      meta.cooldownLabel = "领域剩余";
      meta.cooldownState = "field";
      meta.bottomRight = "";
    }
    meta.preview = () => buildSkillPreview(actor, key);
    addActionButton(label, skillTooltip(currentSkill), () => prepareSkill(actor, key), disabled || !skillUsable(actor, key), key === "q" ? "primary" : key === "flash" ? "warn" : "", meta);
  });
  addActionButton("返回", "返回主行动菜单。", () => {
    state.selection = null;
    els.targetHint.textContent = "请选择行动";
    renderAll();
  }, disabled, "", {});
}

function addActionButton(label, tooltip, handler, disabled = false, className = "", meta = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `action-button ${className}`.trim();
  button.disabled = disabled;
  if (meta.top) button.append(actionSpan("action-meta action-tag", meta.top));
  const cooldown = actionCooldownNode(meta);
  if (cooldown) button.append(cooldown);
  button.append(actionNameNode(label, meta.icon));
  if (meta.damage) button.append(actionSpan("action-damage", meta.damage));
  if (meta.bottomRight || meta.tick) button.append(richTextEl("span", "action-tick", meta.bottomRight || meta.tick));
  if (handler && !disabled) button.addEventListener("click", handler);
  attachFloatingTooltip(button, actionTooltipContent(label, tooltip, meta));
  if (meta.preview && !disabled) {
    button.addEventListener("mouseenter", () => showButtonPreview(meta.preview));
    button.addEventListener("mouseleave", clearButtonPreview);
  }
  els.actionPanel.append(button);
}

function actionCooldownNode(meta = {}) {
  if (meta.cooldownValue !== undefined) {
    const chip = cooldownChip(meta.cooldownValue, meta.cooldownLabel || "冷却", `action-meta action-cooldown ${meta.cooldownState || ""}`);
    return chip;
  }
  if (meta.cooldown || meta.cooldown === 0) return actionSpan("action-meta action-cooldown", meta.cooldown);
  return null;
}

function actionNameNode(label, iconName) {
  const span = actionSpan("action-name", label);
  if (iconName) span.append(uiIconNode(iconName, "action-name-icon"));
  return span;
}

function actionTooltipContent(label, tooltip, meta = {}) {
  if (tooltip && typeof tooltip === "object") return tooltip;
  const cooldownText = meta.cooldownValue !== undefined ? `${meta.cooldownLabel || "冷却"} ${meta.cooldownValue}` : meta.cooldown || "-";
  const rows = [
    ["类型", meta.top || "行动"],
    ["冷却", cooldownText],
    ["数值", meta.damage || "-"],
  ];
  return {
    eyebrow: "行动",
    title: label,
    subtitle: meta.top || "战术指令",
    sections: [
      { title: "参数", rows },
      { title: "说明", text: tooltip || "无额外说明。" },
    ],
  };
}

function actionSpan(className, text) {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

function showButtonPreview(factory) {
  const preview = typeof factory === "function" ? factory() : null;
  state.hoverPreview = preview;
  renderHighlights();
}

function clearButtonPreview() {
  state.hoverPreview = null;
  renderHighlights();
}

function buildMovePreview(actor) {
  if (!actor || !canMove(actor)) return null;
  const cells = getReachableCells(actor);
  return {
    rangeKeys: new Set(cells.map(coordKey)),
    selectableKeys: new Set(cells.map(coordKey)),
    highlightClass: "move",
  };
}

function buildAttackPreview(actor) {
  if (!actor) return null;
  const rangeCells = getCellsInRange(actor.position, actor.attackRange).filter((cell) => hexDistance(actor.position, cell) > 0);
  const targets = allAlive(oppositeTeam(actor.team)).filter((target) => hexDistance(actor.position, target.position) <= actor.attackRange);
  return {
    rangeKeys: new Set(rangeCells.map(coordKey)),
    selectableKeys: new Set(targets.map((target) => coordKey(target.position))),
    highlightClass: "attack",
  };
}

function buildSkillPreview(actor, skillKey) {
  const currentSkill = getEffectiveSkill(actor, skillKey);
  if (!actor || !currentSkill) return null;
  const luxField = actor.heroKey === "lux" && skillKey === "e" ? getLuxField(actor) : null;
  if (luxField) {
    const cells = getZoneCells(luxField);
    return { rangeKeys: new Set(cells.map(coordKey)), selectableKeys: new Set(cells.map(coordKey)), effectKeys: new Set(cells.map(coordKey)), highlightClass: "skill" };
  }
  if (currentSkill.kind === "flash" || currentSkill.kind === "zoeR") {
    const cells = getCellsInRange(actor.position, currentSkill.range).filter((cell) => hexDistance(actor.position, cell) > 0 && !getCharacterAt(cell));
    return { rangeKeys: new Set(cells.map(coordKey)), selectableKeys: new Set(cells.map(coordKey)), highlightClass: "move" };
  }
  if (currentSkill.kind === "beam") {
    return buildFreeRayPreview(actor, currentSkill);
  }
  if (isFixedDistanceDirectionSkill(currentSkill)) {
    return buildFixedLinePreview(actor, currentSkill);
  }
  if (isLineTargetSkill(currentSkill)) {
    return buildLineTargetPreview(actor, currentSkill);
  }
  if (currentSkill.kind === "cone") {
    return buildFreeConePreview(actor, currentSkill);
  }
  if (currentSkill.kind === "windWall") {
    return buildDirectionPreview(actor, currentSkill);
  }
  if (currentSkill.kind === "dash" || currentSkill.kind === "mfQ" || currentSkill.kind === "yasuoR") {
    const targets = targetableEnemiesForSkill(actor, currentSkill);
    const rangeCells = getCellsInRange(actor.position, currentSkill.range).filter((cell) => hexDistance(actor.position, cell) > 0);
    return { rangeKeys: new Set(rangeCells.map(coordKey)), selectableKeys: new Set(targets.map((target) => coordKey(target.position))), highlightClass: "skill" };
  }
  if (currentSkill.kind === "spin" || currentSkill.kind === "yasuoE3") {
    const cells = getCellsInRange(actor.position, currentSkill.range).filter((cell) => hexDistance(actor.position, cell) > 0);
    return { rangeKeys: new Set(cells.map(coordKey)), selectableKeys: new Set(cells.map(coordKey)), effectKeys: new Set(cells.map(coordKey)), highlightClass: "skill" };
  }
  if (currentSkill.kind === "shield" || currentSkill.kind === "mfW" || currentSkill.kind === "placeholder" || currentSkill.kind === "zoeW") {
    return { rangeKeys: new Set([coordKey(actor.position)]), selectableKeys: new Set([coordKey(actor.position)]), highlightClass: "skill" };
  }
  const cells = getCellsInRange(actor.position, currentSkill.range);
  const previewTarget = chooseLinePreviewTarget(actor.position, cells);
  const effectCells = previewTarget ? pointSkillEffectCells(actor, currentSkill, previewTarget) : [];
  return { rangeKeys: new Set(cells.map(coordKey)), selectableKeys: new Set(cells.map(coordKey)), effectKeys: new Set(effectCells.map(coordKey)), highlightClass: "skill" };
}

function buildDirectionPreview(actor, currentSkill) {
  const maxDistance = currentSkill.maxDistance || currentSkill.range || HEX_RADIUS * 2;
  const directionMap = new Map();
  const directionKeys = new Set();
  DIRECTIONS.forEach((direction) => {
    for (let step = 1; step <= maxDistance; step += 1) {
      const cell = addCoords(actor.position, scaleDirection(direction, step));
      if (!cellExists(cell)) break;
      directionMap.set(coordKey(cell), direction);
      directionKeys.add(coordKey(cell));
    }
  });
  const previewCell = chooseLinePreviewTarget(actor.position, [...directionMap.keys()].map((key) => state.cellMap.get(key)).filter(Boolean));
  const previewDirection = previewCell ? directionMap.get(coordKey(previewCell)) : null;
  const effectCells = previewDirection ? directionSkillEffectCells(actor, currentSkill, previewDirection) : [];
  return { directionMap, directionKeys, effectKeys: new Set(effectCells.map(coordKey)), highlightClass: "skill" };
}

function buildFreeConePreview(actor, currentSkill, targetPoint = null) {
  const cells = getCellsInRange(actor.position, currentSkill.range).filter((cell) => hexDistance(actor.position, cell) > 0);
  const point = targetPoint || defaultConeTargetPoint(actor, currentSkill);
  const effectCells = coneCellsFromPoint(actor.position, point, currentSkill.range, currentSkill.coneAngle || 30);
  return {
    type: "freeCone",
    rangeKeys: new Set(cells.map(coordKey)),
    selectableKeys: new Set(cells.map(coordKey)),
    effectKeys: new Set(effectCells.map(coordKey)),
    targetPoint: point,
    highlightClass: "skill",
    hoverText: "选择方向",
  };
}

function buildFreeRayPreview(actor, currentSkill, targetPoint = null) {
  const cells = getCellsInRange(actor.position, currentSkill.maxDistance || HEX_RADIUS * 2).filter((cell) => hexDistance(actor.position, cell) > 0);
  const point = targetPoint || defaultRayTargetPoint(actor, currentSkill);
  const pathCells = rayCellsFromPoint(actor.position, point, currentSkill.maxDistance || HEX_RADIUS * 2);
  return {
    type: "freeRay",
    rangeKeys: new Set(cells.map(coordKey)),
    selectableKeys: new Set(cells.map(coordKey)),
    pathKeys: new Set(pathCells.map(coordKey)),
    targetPoint: point,
    highlightClass: "skill",
    hoverText: "选择方向",
  };
}

function isFixedDistanceDirectionSkill(currentSkill) {
  return currentSkill?.kind === "direction" || currentSkill?.kind === "shieldLine";
}

function buildFixedLinePreview(actor, currentSkill, targetPoint = null) {
  const maxDistance = currentSkill.maxDistance || currentSkill.range || HEX_RADIUS * 2;
  const cells = getCellsInRange(actor.position, maxDistance).filter((cell) => hexDistance(actor.position, cell) > 0);
  const line = fixedDistanceLine(actor, currentSkill, targetPoint || defaultRayTargetPoint(actor, currentSkill));
  return {
    type: "fixedLine",
    rangeKeys: new Set(cells.map(coordKey)),
    selectableKeys: new Set(cells.map(coordKey)),
    pathKeys: new Set(line.pathCells.map(coordKey)),
    targetPoint: line.targetPoint,
    targetCell: line.targetCell,
    highlightClass: "skill",
    hoverText: "选择方向",
  };
}

function isLineTargetSkill(currentSkill) {
  return currentSkill?.kind === "zoeQ" || currentSkill?.kind === "zoeE" || currentSkill?.kind === "yasuoQ" || currentSkill?.kind === "yasuoQ3" || currentSkill?.kind === "yasuoE";
}

function buildLineTargetPreview(actor, currentSkill, targetCell = null) {
  const cells = getLineTargetCells(actor, currentSkill);
  const previewTarget = targetCell || chooseLinePreviewTarget(actor.position, cells);
  const pathCells = previewTarget ? lineTargetEffectCells(actor, currentSkill, previewTarget) : [];
  return {
    type: "lineTarget",
    rangeKeys: new Set(cells.map(coordKey)),
    selectableKeys: new Set(cells.map(coordKey)),
    pathKeys: new Set(pathCells.map(coordKey)),
    highlightClass: "skill",
    hoverText: "选择目标点",
  };
}

function getLineTargetCells(actor, currentSkill) {
  const maxDistance = currentSkill.maxDistance || currentSkill.range || HEX_RADIUS * 2;
  if (currentSkill.kind === "yasuoE") {
    return state.cells.filter((cell) => hexDistance(actor.position, cell) === currentSkill.range && !getCharacterAt(cell));
  }
  return getCellsInRange(actor.position, maxDistance).filter((cell) => hexDistance(actor.position, cell) > 0);
}

function lineTargetEffectCells(actor, currentSkill, targetCell) {
  if (!actor || !currentSkill || !targetCell) return [];
  if (currentSkill.kind === "yasuoQ" || currentSkill.kind === "yasuoQ3" || currentSkill.kind === "yasuoE") {
    return yasuoLineCells(actor, currentSkill, targetCell);
  }
  return projectileLinePath(actor.position, targetCell, currentSkill.maxDistance || currentSkill.range);
}

function chooseLinePreviewTarget(origin, cells) {
  return [...cells].sort((a, b) => hexDistance(origin, b) - hexDistance(origin, a))[0] || null;
}

function pointSkillEffectCells(actor, currentSkill, center) {
  if (!currentSkill || !center) return [];
  if (currentSkill.areaRadius || currentSkill.kind === "luxField" || currentSkill.kind === "zone") {
    return getCellsInRange(center, currentSkill.areaRadius || 0);
  }
  return [center];
}

function directionSkillEffectCells(actor, currentSkill, direction) {
  if (!actor || !currentSkill || !direction) return [];
  return [];
}

function getEffectiveSkill(actor, key) {
  const currentSkill = actor?.skills?.[key];
  if (!actor || !currentSkill) return currentSkill;
  if (actor.heroKey === "yasuo" && key === "q" && yasuoWindStacks(actor) >= 2) {
    return {
      ...currentSkill,
      name: currentSkill.empoweredName || "旋风斩",
      kind: "yasuoQ3",
      tags: "方向 / 控制 / 强化",
      description: "消耗所有【旋风烈斩】，选择任意方向，斩击直线路径上6格范围内的所有敌人，造成14点伤害，并使其获得【浮空】，持续2个回合。",
      range: currentSkill.empoweredRange || 6,
      currentCooldown: currentSkill.currentCooldown,
    };
  }
  if (actor.heroKey === "yasuo" && key === "e" && yasuoWindStacks(actor) >= 2) {
    return {
      ...currentSkill,
      name: currentSkill.empoweredName || "旋风击",
      kind: "yasuoE3",
      tags: "范围 / 控制 / 强化",
      description: "消耗所有【旋风烈斩】，对自身2格范围内的所有敌人造成12点伤害，并使其获得【浮空】，持续2个回合。",
      range: currentSkill.empoweredRange || 2,
      currentCooldown: currentSkill.currentCooldown,
    };
  }
  return currentSkill;
}

function targetableEnemiesForSkill(actor, currentSkill) {
  const enemies = allAlive(oppositeTeam(actor.team)).filter((target) => hexDistance(actor.position, target.position) <= currentSkill.range);
  if (currentSkill.kind === "yasuoR") return enemies.filter((target) => hasStatus(target, "airborne"));
  return enemies;
}

function statChip(label, value) {
  const chip = document.createElement("span");
  const iconName = shortStatIconName(label);
  if (iconName) chip.append(uiIconNode(iconName, "stat-icon"));
  chip.append(textEl("b", "", label));
  chip.append(document.createTextNode(String(value)));
  return chip;
}

function uiIconNode(name, className = "ui-icon") {
  const img = document.createElement("img");
  img.className = `${className} icon-${name}`;
  img.src = ICON_ASSETS[name] || ICON_ASSETS.action;
  img.alt = "";
  return img;
}

function shortStatIconName(label) {
  if (label === "命") return "health";
  if (label === "攻") return "attack";
  if (label === "速") return "action";
  if (label === "距") return "attackRange";
  if (label === "移") return "move";
  return "";
}

function propertyIconName(label) {
  if (label === "生命") return "health";
  if (label === "攻击" || label === "普攻") return "attack";
  if (label === "攻击范围") return "attackRange";
  if (label === "行动速度" || label === "行动条") return "action";
  if (label === "移动距离") return "move";
  return "";
}

function iconAfterLabel(label) {
  return false;
}

function rowLabelNode(label, options = {}) {
  const node = document.createElement("span");
  node.className = "tooltip-row-label";
  const iconName = propertyIconName(label);
  const iconAfter = iconAfterLabel(label);
  if (iconName && !iconAfter) {
    node.append(uiIconNode(iconName, "tooltip-row-icon"));
  } else if (options.reserveLeadingIcon) {
    node.append(textEl("span", "tooltip-row-icon-placeholder", ""));
  }
  node.append(document.createTextNode(String(label)));
  if (iconName && iconAfter) node.append(uiIconNode(iconName, "tooltip-row-icon"));
  return node;
}

function rowValueNode(value) {
  const node = document.createElement("span");
  node.className = "tooltip-row-value";
  node.textContent = value;
  return node;
}

function richTextEl(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  const pattern = /(行动速度|战斗回合|回合|行动轮次|轮次|行动)/g;
  String(text).split(pattern).filter((part) => part !== "").forEach((part) => {
    if (part === "战斗回合" || part === "回合") {
      node.append(document.createTextNode(part));
      node.append(uiIconNode("time", "inline-keyword-icon"));
    } else if (part === "行动速度") {
      node.append(document.createTextNode(part));
      node.append(uiIconNode("action", "inline-keyword-icon"));
    } else if (part === "行动轮次" || part === "轮次" || part === "行动") {
      node.append(document.createTextNode(part));
      node.append(uiIconNode("action", "inline-keyword-icon"));
    } else {
      node.append(document.createTextNode(part));
    }
  });
  return node;
}

function skillEntries(skills) {
  return SKILL_ORDER.map((key) => [key, skills[key]]).filter(([, currentSkill]) => Boolean(currentSkill));
}

function skillKeyLabel(key, currentSkill) {
  if (key === "flash" || currentSkill?.kind === "flash") return "闪";
  return (key || currentSkill?.key || "").toUpperCase();
}

function skillBlockData(key, currentSkill, options = {}) {
  return {
    key: skillKeyLabel(key, currentSkill),
    name: currentSkill.name,
    tags: parseSkillTags(currentSkill.tags),
    cooldownValue: options.cooldownValue ?? currentSkill.cooldown,
    cooldownLabel: options.cooldownLabel || "冷却",
    cooldownState: options.cooldownState || "base",
    text: currentSkill.description,
  };
}

function parseSkillTags(tags) {
  return String(tags || "技能")
    .split("/")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function heroTooltipContent(heroKey) {
  const hero = HEROES[heroKey];
  const profile = HERO_PROFILES[heroKey] || { role: "英雄", summary: "战术单位" };
  const skills = skillEntries(hero.skills).map(([key, currentSkill]) => skillBlockData(key, currentSkill, { cooldownValue: currentSkill.cooldown, cooldownLabel: "冷却" }));
  return {
    eyebrow: "英雄档案",
    title: hero.name,
    subtitle: `${hero.attackType === "ranged" ? "远程攻击" : "近战攻击"} · ${profile.role}`,
    sections: [
      { title: "定位", text: profile.summary },
      { title: "基础属性", rows: [["生命", hero.hp], ["攻击", hero.attackDamage], ["攻击范围", hero.attackRange], ["行动速度", hero.actionSpeed], ["移动距离", hero.moveRange]] },
      { title: `被动：${hero.passive.name}`, text: hero.passive.description },
      { title: "技能", skills },
    ],
  };
}

function characterDetailTooltip(character) {
  const team = character.team === "player" ? "友军" : "敌方";
  const statuses = character.statuses.filter((status) => status.remaining > 0).map(statusLabel).join("、") || "无";
  const mfPassive = missFortunePassiveInfo(character);
  const skills = skillEntries(character.skills)
    .map(([key, currentSkill]) => {
      const effectiveSkill = getEffectiveSkill(character, key);
      return skillBlockData(key, effectiveSkill, {
        cooldownValue: currentSkill.currentCooldown > 0 ? currentSkill.currentCooldown : 0,
        cooldownLabel: currentSkill.currentCooldown > 0 ? "剩余冷却" : "可用",
        cooldownState: currentSkill.currentCooldown > 0 ? "cooling" : "ready",
      });
    });
  const rows = [
    ["生命", `${Math.max(0, character.hp)} / ${character.maxHp}`],
    ["攻击", `${character.attackType === "ranged" ? "远程" : "近战"} · ${character.attackDamage}`],
    ["攻击范围", character.attackRange],
    ["行动速度", `${Math.round(effectiveActionSpeed(character))} / 基础 ${character.actionSpeed}`],
    ["行动条", `${Math.round(character.actionProgress)} / ${ACTION_BAR_LENGTH}`],
    ["移动距离", character.moveRange],
    ["普攻", canAttack(character) ? "可用" : "后摇或控制中"],
  ];
  return {
    eyebrow: "角色详情",
    title: character.name,
    subtitle: team,
    sections: [
      { title: "基础属性", rows },
      { title: `被动：${character.passive.name}`, text: character.passive.description },
      mfPassive ? { title: "当前加成", rows: [["大步流星", `${mfPassive.layers}层`], ["行动速度", `+${Math.round(mfPassive.bonus * 100)}%`]] } : null,
      { title: "当前状态", text: statuses },
      { title: "技能", skills },
    ].filter(Boolean),
  };
}

function attachFloatingTooltip(node, text) {
  node.addEventListener("mouseenter", (event) => showFloatingTooltip(text, event));
  node.addEventListener("mousemove", (event) => positionFloatingTooltip(event));
  node.addEventListener("mouseleave", hideFloatingTooltip);
}

function showFloatingTooltip(content, event) {
  if (!els.floatingTooltip) return;
  els.floatingTooltip.replaceChildren(buildTooltipNode(normalizeTooltipContent(content)));
  els.floatingTooltip.classList.add("show");
  positionFloatingTooltip(event);
}

function positionFloatingTooltip(event) {
  if (!els.floatingTooltip || !event) return;
  const margin = 12;
  const rect = els.floatingTooltip.getBoundingClientRect();
  const width = rect.width || 460;
  const height = rect.height || 80;
  const x = Math.min(window.innerWidth - width - margin, event.clientX + margin);
  const y = Math.min(window.innerHeight - height - margin, event.clientY + margin);
  els.floatingTooltip.style.transform = `translate(${Math.max(margin, x)}px, ${Math.max(margin, y)}px)`;
}

function hideFloatingTooltip() {
  if (!els.floatingTooltip) return;
  els.floatingTooltip.classList.remove("show");
  els.floatingTooltip.style.transform = "translate(-9999px, -9999px)";
}

function handleTooltipWheel(event) {
  if (!els.floatingTooltip?.classList.contains("show")) return;
  const body = els.floatingTooltip.querySelector(".tooltip-body");
  if (!body || body.scrollHeight <= body.clientHeight) return;
  body.scrollTop += event.deltaY;
  event.preventDefault();
}

function normalizeTooltipContent(content) {
  if (content && typeof content === "object" && !Array.isArray(content)) return content;
  const text = String(content || "无额外说明。");
  const blocks = text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  if (blocks.length > 1) {
    return {
      eyebrow: "格子要素",
      title: "当前格",
      sections: blocks.map((block) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        return { title: lines[0] || "详情", text: lines.slice(1).join("\n") || lines[0] || "" };
      }),
    };
  }
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length > 1) {
    return { eyebrow: "详情", title: lines[0], sections: [{ title: "说明", text: lines.slice(1).join("\n") }] };
  }
  return { eyebrow: "详情", title: "说明", sections: [{ title: "内容", text }] };
}

function buildTooltipNode(content) {
  const root = document.createElement("div");
  root.className = "tooltip-card";
  const header = document.createElement("div");
  header.className = "tooltip-header";
  if (content.eyebrow) header.append(textEl("span", "tooltip-eyebrow", content.eyebrow));
  header.append(textEl("strong", "tooltip-title", content.title || "详情"));
  if (content.subtitle) header.append(textEl("span", "tooltip-subtitle", content.subtitle));
  root.append(header);
  const body = document.createElement("div");
  body.className = "tooltip-body";
  (content.sections || []).forEach((section) => body.append(buildTooltipSection(section)));
  root.append(body);
  return root;
}

function buildTooltipSection(section) {
  const node = document.createElement("section");
  node.className = "tooltip-section";
  if (section.title) node.append(textEl("h3", "", section.title));
  if (section.text) node.append(richTextEl("p", "", section.text));
  if (section.rows?.length) {
    const rows = document.createElement("div");
    rows.className = "tooltip-rows";
    const reserveLeadingIcon = section.rows.some(([label]) => propertyIconName(label) && !iconAfterLabel(label));
    section.rows.forEach(([label, value]) => {
      rows.append(rowLabelNode(label, { reserveLeadingIcon }));
      rows.append(rowValueNode(value));
    });
    node.append(rows);
  }
  if (section.items?.length) {
    const list = document.createElement("ul");
    list.className = "tooltip-list";
    section.items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    });
    node.append(list);
  }
  if (section.skills?.length) {
    const skills = document.createElement("div");
    skills.className = "tooltip-skills";
    section.skills.forEach((skillData) => skills.append(buildSkillBlock(skillData)));
    node.append(skills);
  }
  if (section.skill) node.append(buildSkillBlock(section.skill));
  return node;
}

function buildSkillBlock(skillData) {
  const block = document.createElement("article");
  block.className = "tooltip-skill";
  const header = document.createElement("div");
  header.className = "tooltip-skill-header";
  const title = document.createElement("div");
  title.className = "tooltip-skill-title";
  title.append(textEl("span", "skill-key", skillData.key));
  title.append(textEl("strong", "skill-name", skillData.name));
  const tags = document.createElement("div");
  tags.className = "skill-tags";
  (skillData.tags || []).forEach((tag) => tags.append(textEl("span", "skill-tag", tag)));
  title.append(tags);
  header.append(title);
  header.append(cooldownChip(skillData.cooldownValue, skillData.cooldownLabel, `skill-cooldown ${skillData.cooldownState || ""}`));
  block.append(header);
  block.append(richTextEl("p", "tooltip-skill-text", skillData.text));
  return block;
}

function cooldownChip(value, label = "冷却", className = "") {
  const chip = document.createElement("span");
  chip.className = `cooldown-chip ${className}`.trim();
  chip.setAttribute("aria-label", `${label} ${value}`);
  const icon = document.createElement("img");
  icon.src = HOURGLASS_ASSET;
  icon.alt = "";
  chip.append(icon);
  chip.append(textEl("span", "cooldown-value", String(value)));
  return chip;
}

function textEl(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function scheduleZoneTooltip(cell, event) {
  clearZoneTooltipTimer();
  const text = cellElementTooltip(cell);
  if (!text) {
    hideFloatingTooltip();
    return;
  }
  zoneTooltipTimer = setTimeout(() => {
    zoneTooltipTimer = null;
    showFloatingTooltip(text, event);
  }, 420);
}

function clearZoneTooltipTimer() {
  if (!zoneTooltipTimer) return;
  clearTimeout(zoneTooltipTimer);
  zoneTooltipTimer = null;
}

function skillButtonMeta(currentSkill) {
  const cooldownValue = currentSkill.currentCooldown > 0 ? currentSkill.currentCooldown : currentSkill.cooldown;
  return {
    icon: "skill",
    cooldownValue,
    cooldownLabel: currentSkill.currentCooldown > 0 ? "剩余冷却" : "冷却",
    cooldownState: currentSkill.currentCooldown > 0 ? "cooling" : "base",
    bottomRight: currentSkill.currentCooldown > 0 ? `剩余${currentSkill.currentCooldown}回合` : "",
  };
}

function skillTooltip(currentSkill) {
  return skillTooltipContent(currentSkill);
}

function skillTooltipContent(currentSkill) {
  const cooldownValue = currentSkill.currentCooldown > 0 ? currentSkill.currentCooldown : currentSkill.cooldown;
  const cooldownLabel = currentSkill.currentCooldown > 0 ? "剩余冷却" : "冷却";
  const rows = [
    ["范围", currentSkill.range || "自身"],
  ];
  if (currentSkill.damage) rows.push(["伤害", currentSkill.damage]);
  if (currentSkill.shield) rows.push(["护盾", currentSkill.shield]);
  if (currentSkill.duration) rows.push(["持续", `${currentSkill.duration}个回合`]);
  return {
    eyebrow: "技能",
    title: `${currentSkill.key} ${currentSkill.name}`,
    subtitle: currentSkill.tags || "战术技能",
    sections: [
      { skill: skillBlockData(null, currentSkill, { cooldownValue, cooldownLabel, cooldownState: currentSkill.currentCooldown > 0 ? "cooling" : "base" }) },
      { title: "参数", rows },
    ],
  };
}

function basicAttackTooltip(actor) {
  return basicAttackTooltipContent(actor);
}

function basicAttackTooltipContent(actor) {
  return {
    eyebrow: "普通攻击",
    title: actor.attackType === "ranged" ? "远程普攻" : "近战普攻",
    subtitle: "每个战斗回合同一角色只能普通攻击一次",
    sections: [
      { title: "参数", rows: [["伤害", expectedBasicDamage(actor)], ["范围", actor.attackRange], ["状态", canAttack(actor) ? "可用" : "后摇或控制中"]] },
      { title: "规则", text: "可攻击次数会在下一个战斗回合恢复。" },
    ],
  };
}

function expectedBasicDamage(actor) {
  if (actor.heroKey === "yasuo") return `${actor.attackDamage}（50%概率 ${actor.attackDamage * 2}）`;
  if (actor.heroKey === "mf") return `${actor.attackDamage}（新目标 +7）`;
  if (actor.heroKey === "zoe" && actor.temp.sparkReady) return `${actor.attackDamage + 8}`;
  return actor.attackDamage;
}

function statusLabel(status) {
  if (status.type === "root") return `禁锢 ${status.remaining}`;
  if (status.type === "stun") return `晕眩 ${status.remaining}`;
  if (status.type === "shield") return `护盾 ${status.amount}/${status.remaining}`;
  if (status.type === "channel") return `引导中：${status.skillName || "技能"} ${status.remaining}`;
  if (status.type === "illumination") return `光芒 ${status.remaining}`;
  if (status.type === "drowsy") return `困倦 ${status.remaining}`;
  if (status.type === "sleep") return `昏睡 ${status.remaining}`;
  if (status.type === "zoeSpark") return "烟火四射";
  if (status.type === "mfTarget") return "厄运的眷顾";
  if (status.type === "yasuoWind") return `旋风烈斩 ${status.stacks || 1}层`;
  if (status.type === "airborne") return `浮空 ${status.remaining}`;
  return `状态 ${status.remaining}`;
}

function statusTooltip(status) {
  const duration = Number.isFinite(status.remaining) ? `剩余 ${status.remaining}个回合。` : "无持续时间，会在条件变化时移除。";
  if (status.type === "root") return `禁锢：不能移动或使用位移。${duration}`;
  if (status.type === "stun") return `晕眩：跳过行动，不能攻击、移动或施放技能。${duration}`;
  if (status.type === "shield") return `护盾：吸收伤害。当前护盾值 ${status.amount}，${duration}`;
  if (status.type === "channel") return `引导中：${status.skillName || "技能"}。剩余 ${status.remaining} 次，可继续引导或结束。`;
  if (status.type === "illumination") return `光芒四射：拉克丝普通攻击或终极闪光会引爆，造成额外伤害。${duration}`;
  if (status.type === "drowsy") return `困倦：下次战斗回合结算后转为昏睡。${duration}`;
  if (status.type === "sleep") return `昏睡：受到伤害时破除，本次伤害翻倍。${duration}`;
  if (status.type === "zoeSpark") return "烟火四射：佐伊下一次普通攻击造成额外8点伤害。";
  if (status.type === "mfTarget") return "厄运的眷顾：这是女枪的最新目标。女枪攻击不具有该状态的目标时会造成额外7点伤害，并将此状态转移给新目标。";
  if (status.type === "yasuoWind") return `旋风烈斩：当前 ${status.stacks || 1} 层。达到2层后，亚索的Q和E变为强化技能。`;
  if (status.type === "airborne") return `浮空：行动条暂停，不能行动。${duration}`;
  return `${statusLabel(status)}。${duration}`;
}

function passiveTooltipContent(character) {
  return {
    eyebrow: "被动",
    title: character.passive.name,
    subtitle: character.name,
    sections: [
      { title: "效果", text: character.passive.description },
    ],
  };
}

function statusTooltipContent(status, holder = null) {
  const duration = Number.isFinite(status.remaining) ? `剩余 ${status.remaining}个回合` : "无固定持续时间";
  const rows = [["状态", statusLabel(status)], ["持续", duration]];
  if (status.amount) rows.push(["数值", status.amount]);
  if (status.stacks) rows.push(["层数", status.stacks]);
  const source = status.sourceId ? getCharacter(status.sourceId) : null;
  if (source && source.id !== holder?.id) rows.push(["来源", source.name]);
  return {
    eyebrow: "状态",
    title: statusLabel(status).replace(/\s.*/, ""),
    subtitle: duration,
    sections: [
      { title: "概览", rows },
      { title: "效果", text: statusTooltip(status) },
    ],
  };
}

function renderHighlights() {
  const zoneKeys = cellElementKeys();
  cellEls.forEach((group, key) => {
    const classes = ["hex-cell"];
    if (zoneKeys.has(key)) classes.push("zone");
    applyHighlightClasses(classes, state.hoverPreview, key, false);
    applyHighlightClasses(classes, state.selection, key, true);
    group.setAttribute("class", classes.join(" "));
  });
}

function applyHighlightClasses(classes, source, key, selectable) {
  if (!source) return;
  if (source.rangeKeys?.has(key)) classes.push(source.highlightClass);
  if (source.pathKeys?.has(key)) classes.push("direction");
  if (source.effectKeys?.has(key)) classes.push("effect");
  if (source.selectableKeys?.has(key)) {
    if (selectable) classes.push("selectable");
    classes.push(source.highlightClass);
  }
  if (source.directionKeys?.has(key)) {
    if (selectable) classes.push("selectable");
    classes.push("direction");
  }
}

function renderZones() {
  zoneLayer.innerHTML = "";
  const overlapCounts = new Map();
  state.zones.filter((zone) => !zone.removed).forEach((zone) => {
    getZoneCells(zone).forEach((cell) => {
      const key = coordKey(cell);
      const overlapIndex = overlapCounts.get(key) || 0;
      overlapCounts.set(key, overlapIndex + 1);
      const center = hexToPixel(cell);
      zoneLayer.append(svgEl("polygon", {
        class: `zone-cell ${zoneClass(zone)} overlap-${Math.min(2, overlapIndex)}`,
        points: hexPoints(center, HEX_SIZE * Math.max(0.58, 0.92 - overlapIndex * 0.12)).map(pointToString).join(" "),
      }));
    });
  });
}

function zoneClass(zone) {
  const classes = [zone.team === "enemy" ? "enemy-zone" : "player-zone"];
  if (zone.effect === "luxField") classes.push("lux-zone");
  if (zone.effect === "bubbleTrap") classes.push("bubble-zone");
  if (zone.channelOwnerId) classes.push("channel-zone");
  return classes.join(" ");
}

function zonesAtCell(cell) {
  return state.zones.filter((zone) => !zone.removed && getZoneCells(zone).some((zoneCell) => coordsEqual(zoneCell, cell)));
}

function cellElementsAtCell(cell) {
  return [
    ...zonesAtCell(cell).map((zone) => ({ type: "zone", zone })),
    ...zoeStarMarkersAtCell(cell).map((projectile) => ({ type: "zoeStar", projectile })),
    ...zoeReturnMarkersAtCell(cell).map((actor) => ({ type: "zoeReturn", actor })),
  ];
}

function cellElementKeys() {
  const keys = new Set();
  state.zones.filter((zone) => !zone.removed).forEach((zone) => getZoneCells(zone).forEach((cell) => keys.add(coordKey(cell))));
  state.projectiles.filter(isPausedZoeStar).forEach((projectile) => keys.add(coordKey(projectile.pos)));
  state.characters.filter(hasZoeReturnMarker).forEach((actor) => keys.add(coordKey(actor.temp.returnPortal)));
  return keys;
}

function zoneCellTooltip(cell) {
  return cellElementTooltip(cell);
}

function cellElementTooltip(cell) {
  const elements = cellElementsAtCell(cell);
  if (!elements.length) return "";
  return elements.map(cellElementTooltipText).join("\n\n");
}

function cellElementTooltipText(element) {
  if (element.type === "zone") return zoneTooltip(element.zone);
  if (element.type === "zoeStar") return zoeStarTooltip(element.projectile);
  if (element.type === "zoeReturn") return zoeReturnTooltip(element.actor);
  return "";
}

function zoneTooltip(zone) {
  const owner = getCharacter(zone.ownerId);
  const parts = [
    `${zone.name}（${owner?.name || "未知来源"}）`,
    `阵营：${zone.team === "player" ? "友军" : "敌方"}`,
  ];
  if (Number.isFinite(zone.remaining)) parts.push(`剩余：${zone.remaining}个回合`);
  if (zone.damage > 0) parts.push(`伤害：每次结算 ${zone.damage}`);
  if (zone.detonateDamage > 0) parts.push(`再次施放可引爆：${zone.detonateDamage} 伤害`);
  if (zone.slow > 0) parts.push(`减速：${Math.round(zone.slow * 100)}%`);
  if (zone.effect === "bubbleTrap") parts.push("效果：敌人进入后施加困倦，随后转为昏睡");
  if (zone.channelOwnerId) parts.push("类型：引导型持续范围");
  return parts.join("\n");
}

function isPausedZoeStar(projectile) {
  return projectile?.effect === "zoeQ" && projectile.type === "star" && projectile.paused && !projectile.removed;
}

function zoeStarMarkersAtCell(cell) {
  return state.projectiles.filter((projectile) => isPausedZoeStar(projectile) && coordsEqual(projectile.pos, cell));
}

function zoeStarTooltip(projectile) {
  const owner = getCharacter(projectile.ownerId);
  const parts = [
    `飞星乱入停留点（${owner?.name || "佐伊"}）`,
    `阵营：${projectile.team === "player" ? "友军" : "敌方"}`,
  ];
  if (Number.isFinite(projectile.remaining)) parts.push(`剩余：${projectile.remaining}个回合`);
  parts.push("效果：佐伊可以在持续期间再次施放Q，将飞星重新导引到新的目标点。");
  return parts.join("\n");
}

function hasZoeReturnMarker(actor) {
  return actor?.isAlive && actor.heroKey === "zoe" && actor.temp.returnPortal;
}

function zoeReturnMarkersAtCell(cell) {
  return state.characters.filter((actor) => hasZoeReturnMarker(actor) && coordsEqual(actor.temp.returnPortal, cell));
}

function zoeReturnTooltip(actor) {
  return [
    `折返跃迁返回点（${actor.name}）`,
    `阵营：${actor.team === "player" ? "友军" : "敌方"}`,
    "剩余：下次行动结束后返回",
    "效果：佐伊会在下一次行动结束后尝试回到此格。",
  ].join("\n");
}

function renderWindWalls() {
  wallLayer.innerHTML = "";
  state.windWalls.forEach((wall) => {
    const points = sharedEdgePoints(wall.a, wall.b);
    if (points.length < 2) return;
    wallLayer.append(svgEl("line", { class: "wind-wall", x1: points[0].x, y1: points[0].y, x2: points[1].x, y2: points[1].y }));
  });
}

function renderShards() {
  shardLayer.innerHTML = "";
  state.shards.forEach((shard) => {
    const point = hexToPixel(shard.position);
    const group = svgEl("g", { class: "spell-shard" });
    group.append(svgEl("circle", { cx: point.x, cy: point.y, r: 8 }));
    group.append(svgEl("text", { x: point.x, y: point.y + 3 }));
    group.lastChild.textContent = "闪";
    shardLayer.append(group);
  });
}

function renderCellMarkers() {
  markerLayer.innerHTML = "";
  state.projectiles.filter(isPausedZoeStar).forEach((projectile) => {
    const point = hexToPixel(projectile.pos);
    const group = svgEl("g", { class: `cell-marker zoe-star-marker ${projectile.team}` });
    group.append(svgEl("circle", { cx: point.x, cy: point.y, r: 15 }));
    group.append(svgEl("text", { x: point.x, y: point.y + 4 }));
    group.lastChild.textContent = "Q";
    markerLayer.append(group);
  });
  state.characters.filter(hasZoeReturnMarker).forEach((actor) => {
    const point = hexToPixel(actor.temp.returnPortal);
    const group = svgEl("g", { class: `cell-marker zoe-return-marker ${actor.team}`, transform: `translate(${point.x} ${point.y})` });
    group.append(svgEl("circle", { r: 20 }));
    const image = svgEl("image", { class: "zoe-return-avatar", href: actor.asset, x: -23, y: -28, width: 46, height: 46, preserveAspectRatio: "xMidYMid meet" });
    setSvgHref(image, actor.asset);
    group.append(image);
    group.append(svgEl("text", { x: 0, y: 21 }));
    group.lastChild.textContent = "返";
    markerLayer.append(group);
  });
}

function renderProjectiles() {
  const activeIds = new Set();
  state.projectiles.forEach((projectile) => {
    if (projectile.removed) return;
    activeIds.add(projectile.id);
    let group = projectileEls.get(projectile.id);
    if (!group) {
      group = svgEl("g", { class: `projectile ${projectile.team}` });
      const size = projectile.type === "star" ? { width: 38, height: 58 } : { width: 30, height: 45 };
      const image = svgEl("image", { class: "projectile-image", x: -size.width / 2, y: -size.height / 2, width: size.width, height: size.height, preserveAspectRatio: "xMidYMid meet" });
      setSvgHref(image, LIGHT_ORB_ASSET);
      group.append(image);
      projectileLayer.append(group);
      projectileEls.set(projectile.id, group);
    }
    const point = projectile.pixelPos || hexToPixel(projectile.pos);
    group.setAttribute("transform", `translate(${point.x} ${point.y}) rotate(${projectileAngle(projectile)})`);
  });
  projectileEls.forEach((group, id) => {
    if (!activeIds.has(id)) {
      group.remove();
      projectileEls.delete(id);
    }
  });
}

function renderUnits() {
  const visibleIds = new Set();
  state.characters.forEach((character) => {
    if (!character.isAlive && !character.isDying) return;
    visibleIds.add(character.id);
    let group = unitEls.get(character.id);
    if (!group) {
      group = svgEl("g", { class: `unit ${character.team}` });
      group.style.transformOrigin = "0 0";
      group.addEventListener("click", (event) => {
        event.stopPropagation();
        handleUnitClick(character.id, event);
      });
      group.addEventListener("mouseenter", (event) => handleUnitPointerEnter(character, event));
      group.addEventListener("mousemove", (event) => handleUnitPointerMove(character, event));
      group.addEventListener("mouseleave", handleCellPointerLeave);
      unitLayer.append(group);
      unitEls.set(character.id, group);
    }
    const point = hexToPixel(character.position);
    group.style.transform = `translate(${point.x}px, ${point.y}px)`;
    const tempClass = state.unitClasses[character.id] || "";
    const targetable = isUnitTargetable(character) ? "targetable" : "";
    group.setAttribute("class", `unit ${character.team} ${character.isDying ? "dead" : ""} ${tempClass} ${targetable}`.trim());
    group.innerHTML = unitMarkup(character);
  });
  unitEls.forEach((group, id) => {
    if (!visibleIds.has(id)) {
      group.remove();
      unitEls.delete(id);
    }
  });
}

function unitMarkup(character) {
  const statuses = character.statuses
    .filter((status) => status.remaining > 0)
    .slice(0, 4)
    .map((status, index) => {
      const label = status.type === "root" ? "禁" : status.type === "stun" ? "晕" : status.type === "sleep" ? "睡" : status.type === "illumination" ? "光" : status.type === "channel" ? "引" : status.type === "zoeSpark" ? "火" : status.type === "mfTarget" ? "厄" : status.type === "yasuoWind" ? "旋" : status.type === "airborne" ? "浮" : "盾";
      const x = -23 + index * 15;
      return `<g class="status-badge" transform="translate(${x} -35)"><circle r="7"></circle><text y="1">${label}</text></g>`;
    })
    .join("");
  return `
    <circle class="unit-avatar-frame" r="24"></circle>
    <image class="unit-avatar" href="${character.asset}" x="-29" y="-35" width="58" height="58" preserveAspectRatio="xMidYMid meet"></image>
    <g transform="translate(-19 23)">
      <rect class="hp-chip" x="0" y="0" width="38" height="15" rx="2"></rect>
      <text class="hp-text" x="19" y="8">${Math.max(0, character.hp)}</text>
    </g>
    ${statuses}
  `;
}

function handleUnitClick(characterId, event = null) {
  if (state.gameOver || state.isAnimating || !state.selection) return;
  const character = getCharacter(characterId);
  if (!character || !character.isAlive) return;
  handleCellClick(character.position, event);
}

function handleUnitPointerEnter(character, event) {
  event?.stopPropagation();
  handleUnitHover(character, event);
  scheduleZoneTooltip(character.position, event);
}

function handleUnitPointerMove(character, event) {
  event?.stopPropagation();
  handleUnitHover(character, event);
  if (zoneCellTooltip(character.position)) {
    clearZoneTooltipTimer();
    scheduleZoneTooltip(character.position, event);
  } else {
    clearZoneTooltipTimer();
  }
  if (els.floatingTooltip?.classList.contains("show")) positionFloatingTooltip(event);
}

function handleUnitHover(character, event = null) {
  if (!character?.isAlive) return false;
  if (updateTargetUnitPreview(character)) return true;
  handleCellHover(character.position, event);
  return false;
}

function updateTargetUnitPreview(character) {
  const selection = state.selection;
  if (!selection || selection.type !== "target" || state.isAnimating || state.gameOver) return false;
  const actor = getCharacter(selection.actorId);
  const currentSkill = getEffectiveSkill(actor, selection.skillKey);
  if (!actor || !currentSkill || currentSkill.kind !== "mfQ") return false;
  const key = coordKey(character.position);
  if (!selection.selectableKeys?.has(key) || character.team === actor.team) return false;
  selection.resolvedCell = cloneCoord(character.position);
  selection.effectKeys = new Set(missFortuneQSecondHitCells(actor, character).map(coordKey));
  els.targetHint.textContent = `${currentSkill.name}：${character.name}`;
  renderHighlights();
  return true;
}

function isUnitTargetable(character) {
  if (!state.selection || state.gameOver || state.isAnimating) return false;
  const key = coordKey(character.position);
  return Boolean(state.selection.selectableKeys?.has(key) || state.selection.directionMap?.has(key) || state.selection.directionKeys?.has(key));
}

function handleCellPointerEnter(cell, event) {
  handleCellHover(cell, event);
  scheduleZoneTooltip(cell, event);
}

function handleCellPointerMove(cell, event) {
  handleCellHover(cell, event);
  if (zoneCellTooltip(cell)) {
    clearZoneTooltipTimer();
    scheduleZoneTooltip(cell, event);
  } else {
    clearZoneTooltipTimer();
  }
  if (els.floatingTooltip?.classList.contains("show")) positionFloatingTooltip(event);
}

function handleCellPointerLeave() {
  clearZoneTooltipTimer();
  hideFloatingTooltip();
}

function handleCellHover(cell, event = null) {
  if (!state.selection || state.isAnimating || state.gameOver) return;
  const key = coordKey(cell);
  if (updateSelectionPreview(cell, event ? boardPointFromEvent(event) : null)) {
    return;
  } else if (state.selection.type === "direction" && state.selection.directionMap.has(key)) {
    els.targetHint.textContent = `方向：${state.selection.directionMap.get(key).name}`;
  } else if (state.selection.selectableKeys?.has(key)) {
    els.targetHint.textContent = state.selection.hoverText || "选择目标";
  }
}

function handleCellClick(cell, event = null) {
  if (consumeSuppressedBoardClick()) return;
  if (state.gameOver || state.isAnimating || !state.selection) return;
  const actor = getCharacter(state.selection.actorId);
  if (!actor || actor.team !== "player" || actor.id !== state.currentActorId) return;
  const key = coordKey(cell);
  const selection = state.selection;

  if (selection.type === "move" && selection.selectableKeys.has(key)) void moveAction(actor, cell);
  if (selection.type === "attack" && selection.selectableKeys.has(key)) {
    const target = getEnemyAt(cell, actor.team);
    if (target) void basicAttack(actor, target);
  }
  if (selection.type === "target" && selection.selectableKeys.has(key)) {
    const target = getEnemyAt(cell, actor.team);
    if (target) void castTargetSkill(actor, selection.skillKey, target);
  }
  if (selection.type === "lineTarget") {
    const targetCell = resolveNearestSelectionCell(selection, cell);
    if (targetCell) void castLineTargetSkill(actor, selection.skillKey, targetCell);
  }
  if (selection.type === "fixedLine") {
    const point = event ? boardPointFromEvent(event) : hexToPixel(cell);
    if (point) void castFixedLineSkill(actor, selection.skillKey, point);
  }
  if (selection.type === "freeRay") {
    const point = event ? boardPointFromEvent(event) : hexToPixel(cell);
    void castFreeRaySkill(actor, selection.skillKey, point);
  }
  if (selection.type === "direction") {
    const targetCell = resolveNearestSelectionCell(selection, cell);
    const direction = targetCell ? selection.directionMap.get(coordKey(targetCell)) : null;
    if (direction) void castDirectionSkill(actor, selection.skillKey, direction);
  }
  if (selection.type === "freeCone") {
    const point = event ? boardPointFromEvent(event) : hexToPixel(cell);
    void castFreeConeSkill(actor, selection.skillKey, point);
  }
  if (selection.type === "zone") {
    const targetCell = resolveNearestSelectionCell(selection, cell);
    if (targetCell) void castPointSkill(actor, selection.skillKey, targetCell);
  }
  if (selection.type === "flash" && selection.selectableKeys.has(key)) void flashAction(actor, cell, selection.skillKey || "flash");
}

function handleBoardDragStart(event) {
  if (event.button !== 0 || state.selection || state.isAnimating || state.gameOver) return;
  const box = currentViewBox();
  if (!box) return;
  state.boardDrag = {
    startClient: { x: event.clientX, y: event.clientY },
    startCenter: currentViewCenter(),
    viewBox: box,
    moved: false,
  };
  els.board.classList.add("dragging");
}

function handleBoardDragMove(event) {
  const drag = state.boardDrag;
  if (!drag) return;
  const rect = els.board.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dx = event.clientX - drag.startClient.x;
  const dy = event.clientY - drag.startClient.y;
  if (Math.hypot(dx, dy) > 3) drag.moved = true;
  const scaleX = drag.viewBox.width / rect.width;
  const scaleY = drag.viewBox.height / rect.height;
  state.viewCenter = {
    x: drag.startCenter.x - dx * scaleX,
    y: drag.startCenter.y - dy * scaleY,
  };
  applyBoardViewBox();
  event.preventDefault();
}

function handleBoardDragEnd() {
  if (state.boardDrag?.moved) state.suppressBoardClick = true;
  state.boardDrag = null;
  els.board.classList.remove("dragging");
}

function consumeSuppressedBoardClick() {
  if (!state.suppressBoardClick) return false;
  state.suppressBoardClick = false;
  return true;
}

function handleBoardPointerMove(event) {
  if (eventFromInteractiveBoardItem(event)) return;
  if (!state.selection || state.isAnimating || state.gameOver) return;
  const point = boardPointFromEvent(event);
  if (point) updateSelectionPreview(null, point);
}

function handleBoardPointerClick(event) {
  if (consumeSuppressedBoardClick()) return;
  if (eventFromInteractiveBoardItem(event)) return;
  if (state.gameOver || state.isAnimating || !state.selection) return;
  const actor = getCharacter(state.selection.actorId);
  if (!actor || actor.team !== "player" || actor.id !== state.currentActorId) return;
  const point = boardPointFromEvent(event);
  if (state.selection.type === "freeRay") {
    if (point) void castFreeRaySkill(actor, state.selection.skillKey, point);
    return;
  }
  if (state.selection.type === "fixedLine") {
    if (point) void castFixedLineSkill(actor, state.selection.skillKey, point);
    return;
  }
  const targetCell = point ? resolveNearestSelectionCell(state.selection, null, point) : null;
  if (!targetCell) return;
  if (state.selection.type === "lineTarget") void castLineTargetSkill(actor, state.selection.skillKey, targetCell);
  if (state.selection.type === "zone") void castPointSkill(actor, state.selection.skillKey, targetCell);
  if (state.selection.type === "freeCone") void castFreeConeSkill(actor, state.selection.skillKey, point);
  if (state.selection.type === "direction") {
    const direction = state.selection.directionMap.get(coordKey(targetCell));
    if (direction) void castDirectionSkill(actor, state.selection.skillKey, direction);
  }
}

function updateSelectionPreview(cell = null, point = null) {
  const selection = state.selection;
  if (!selection || !["target", "lineTarget", "fixedLine", "zone", "direction", "freeCone", "freeRay"].includes(selection.type)) return false;
  const actor = getCharacter(selection.actorId);
  const currentSkill = getEffectiveSkill(actor, selection.skillKey);
  if (!actor || !currentSkill) return false;
  if (selection.type === "target") {
    selection.effectKeys = new Set();
    if (currentSkill.kind === "mfQ" && cell) {
      const key = coordKey(cell);
      const target = selection.selectableKeys?.has(key) ? getEnemyAt(cell, actor.team) : null;
      if (target) {
        selection.resolvedCell = cloneCoord(cell);
        selection.effectKeys = new Set(missFortuneQSecondHitCells(actor, target).map(coordKey));
        els.targetHint.textContent = `${currentSkill.name}：${target.name}`;
        renderHighlights();
        return true;
      }
    }
    renderHighlights();
    return false;
  }
  if (selection.type === "freeRay") {
    const targetPoint = resolveRayTargetPoint(actor, currentSkill, point || (cell ? hexToPixel(cell) : null));
    const pathCells = rayCellsFromPoint(actor.position, targetPoint, currentSkill.maxDistance || HEX_RADIUS * 2);
    selection.targetPoint = targetPoint;
    selection.pathKeys = new Set(pathCells.map(coordKey));
    selection.effectKeys = new Set();
    els.targetHint.textContent = selection.hoverText || "选择方向";
    renderHighlights();
    return true;
  }
  if (selection.type === "fixedLine") {
    const line = fixedDistanceLine(actor, currentSkill, point || (cell ? hexToPixel(cell) : null));
    selection.targetPoint = line.targetPoint;
    selection.targetCell = line.targetCell;
    selection.pathKeys = new Set(line.pathCells.map(coordKey));
    selection.effectKeys = new Set();
    els.targetHint.textContent = selection.hoverText || "选择方向";
    renderHighlights();
    return true;
  }
  const targetCell = resolveNearestSelectionCell(selection, cell, point);
  if (!targetCell) return false;
  const key = coordKey(targetCell);
  selection.resolvedCell = cloneCoord(targetCell);
  if (selection.type === "lineTarget") {
    const pathCells = lineTargetEffectCells(actor, currentSkill, targetCell);
    selection.pathKeys = new Set(pathCells.map(coordKey));
    selection.effectKeys = new Set();
  } else if (selection.type === "zone") {
    const effectCells = pointSkillEffectCells(actor, currentSkill, targetCell);
    selection.effectKeys = new Set(effectCells.map(coordKey));
  } else if (selection.type === "direction") {
    const direction = selection.directionMap.get(key);
    const effectCells = directionSkillEffectCells(actor, currentSkill, direction);
    selection.effectKeys = new Set(effectCells.map(coordKey));
  } else if (selection.type === "freeCone") {
    const targetPoint = resolveConeTargetPoint(actor, currentSkill, point || hexToPixel(targetCell));
    const effectCells = coneCellsFromPoint(actor.position, targetPoint, currentSkill.range, currentSkill.coneAngle || 30);
    selection.targetPoint = targetPoint;
    selection.effectKeys = new Set(effectCells.map(coordKey));
  }
  els.targetHint.textContent = selection.hoverText || "选择目标";
  renderHighlights();
  return true;
}

function resolveNearestSelectionCell(selection, cell = null, point = null) {
  const legalCells = selectionLegalCells(selection);
  if (!legalCells.length) return null;
  if (cell) {
    const key = coordKey(cell);
    if (selection.selectableKeys?.has(key) || selection.directionKeys?.has(key)) return cell;
    point = hexToPixel(cell);
  }
  if (!point) return legalCells[0];
  return legalCells.sort((a, b) => distance(hexToPixel(a), point) - distance(hexToPixel(b), point))[0] || null;
}

function selectionLegalCells(selection) {
  const keys = selection.type === "direction" ? selection.directionKeys : selection.selectableKeys;
  if (!keys) return [];
  return [...keys].map((key) => state.cellMap.get(key)).filter(Boolean);
}

function boardPointFromEvent(event) {
  const matrix = els.board.getScreenCTM?.();
  if (!matrix) return null;
  const point = els.board.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(matrix.inverse());
}

function eventFromInteractiveBoardItem(event) {
  let node = event.target;
  while (node && node !== els.board) {
    if (node.classList?.contains("hex-cell") || node.classList?.contains("unit")) return true;
    node = node.parentNode;
  }
  return false;
}

function showSkillMenu(actor) {
  state.selection = { menu: "skills", actorId: actor.id };
  state.hoverPreview = null;
  els.targetHint.textContent = "选择技能";
  renderAll();
}

function prepareMove(actor) {
  const cells = getReachableCells(actor);
  state.hoverPreview = null;
  state.selection = { type: "move", actorId: actor.id, rangeKeys: new Set(cells.map(coordKey)), selectableKeys: new Set(cells.map(coordKey)), highlightClass: "move", hoverText: "移动到此格" };
  els.targetHint.textContent = cells.length ? "选择移动目标" : "没有可移动格";
  renderAll();
}

function prepareAttack(actor) {
  const rangeCells = getCellsInRange(actor.position, actor.attackRange).filter((cell) => hexDistance(actor.position, cell) > 0);
  const targets = allAlive(oppositeTeam(actor.team)).filter((target) => hexDistance(actor.position, target.position) <= actor.attackRange);
  state.hoverPreview = null;
  state.selection = { type: "attack", actorId: actor.id, rangeKeys: new Set(rangeCells.map(coordKey)), selectableKeys: new Set(targets.map((target) => coordKey(target.position))), highlightClass: "attack", hoverText: "攻击目标" };
  els.targetHint.textContent = targets.length ? "选择攻击目标" : "目标不在攻击范围";
  renderAll();
}

function prepareSkill(actor, key) {
  const currentSkill = getEffectiveSkill(actor, key);
  if (!currentSkill) return;
  if (actor.heroKey === "lux" && key === "e" && getLuxField(actor)) {
    void detonateLuxFieldAction(actor, key);
    return;
  }
  if (currentSkill.kind === "shield" || currentSkill.kind === "mfW" || currentSkill.kind === "spin" || currentSkill.kind === "placeholder" || currentSkill.kind === "zoeW" || currentSkill.kind === "yasuoE3") {
    void castSelfSkill(actor, key);
    return;
  }
  if (currentSkill.kind === "flash" || currentSkill.kind === "zoeR") {
    prepareFlash(actor, key);
    return;
  }
  if (currentSkill.kind === "beam") {
    prepareFreeRaySkill(actor, key);
    return;
  }
  if (isFixedDistanceDirectionSkill(currentSkill)) {
    prepareFixedLineSkill(actor, key);
    return;
  }
  if (isLineTargetSkill(currentSkill)) {
    prepareLineTargetSkill(actor, key);
    return;
  }
  if (currentSkill.kind === "cone") {
    prepareFreeConeSkill(actor, key);
    return;
  }
  if (currentSkill.kind === "windWall") {
    prepareDirectionSkill(actor, key);
    return;
  }
  if (currentSkill.kind === "dash" || currentSkill.kind === "mfQ" || currentSkill.kind === "yasuoR") {
    prepareTargetSkill(actor, key);
    return;
  }
  preparePointSkill(actor, key);
}

function prepareDirectionSkill(actor, skillKey) {
  const currentSkill = getEffectiveSkill(actor, skillKey);
  const preview = buildDirectionPreview(actor, currentSkill);
  state.hoverPreview = null;
  state.selection = { ...preview, type: "direction", actorId: actor.id, skillKey, menu: "skills" };
  els.targetHint.textContent = `选择${currentSkill.name}方向`;
  renderAll();
}

function prepareFreeConeSkill(actor, skillKey) {
  const currentSkill = getEffectiveSkill(actor, skillKey);
  const preview = buildFreeConePreview(actor, currentSkill);
  state.hoverPreview = null;
  state.selection = { ...preview, type: "freeCone", actorId: actor.id, skillKey, menu: "skills" };
  els.targetHint.textContent = `选择${currentSkill.name}方向`;
  renderAll();
}

function prepareFreeRaySkill(actor, skillKey) {
  const currentSkill = getEffectiveSkill(actor, skillKey);
  const preview = buildFreeRayPreview(actor, currentSkill);
  state.hoverPreview = null;
  state.selection = { ...preview, type: "freeRay", actorId: actor.id, skillKey, menu: "skills" };
  els.targetHint.textContent = `选择${currentSkill.name}方向`;
  renderAll();
}

function prepareFixedLineSkill(actor, skillKey) {
  const currentSkill = getEffectiveSkill(actor, skillKey);
  const preview = buildFixedLinePreview(actor, currentSkill);
  state.hoverPreview = null;
  state.selection = { ...preview, type: "fixedLine", actorId: actor.id, skillKey, menu: "skills" };
  els.targetHint.textContent = `选择${currentSkill.name}方向`;
  renderAll();
}

function prepareLineTargetSkill(actor, skillKey) {
  const currentSkill = getEffectiveSkill(actor, skillKey);
  const preview = buildLineTargetPreview(actor, currentSkill);
  state.hoverPreview = null;
  state.selection = { ...preview, type: "lineTarget", actorId: actor.id, skillKey, menu: "skills" };
  els.targetHint.textContent = preview.selectableKeys.size ? `选择${currentSkill.name}目标点` : "没有可选目标点";
  renderAll();
}

function prepareTargetSkill(actor, skillKey) {
  const currentSkill = getEffectiveSkill(actor, skillKey);
  const targets = targetableEnemiesForSkill(actor, currentSkill);
  const rangeCells = getCellsInRange(actor.position, currentSkill.range).filter((cell) => hexDistance(actor.position, cell) > 0);
  state.hoverPreview = null;
  state.selection = { type: "target", actorId: actor.id, skillKey, menu: "skills", rangeKeys: new Set(rangeCells.map(coordKey)), selectableKeys: new Set(targets.map((target) => coordKey(target.position))), highlightClass: "skill", hoverText: "选择目标" };
  els.targetHint.textContent = targets.length ? `选择${currentSkill.name}目标` : "没有可选目标";
  renderAll();
}

function preparePointSkill(actor, skillKey) {
  const currentSkill = getEffectiveSkill(actor, skillKey);
  const cells = getCellsInRange(actor.position, currentSkill.range);
  const previewTarget = chooseLinePreviewTarget(actor.position, cells);
  const effectCells = previewTarget ? pointSkillEffectCells(actor, currentSkill, previewTarget) : [];
  state.hoverPreview = null;
  state.selection = { type: "zone", actorId: actor.id, skillKey, menu: "skills", rangeKeys: new Set(cells.map(coordKey)), selectableKeys: new Set(cells.map(coordKey)), effectKeys: new Set(effectCells.map(coordKey)), highlightClass: "skill", hoverText: "选择目标格" };
  els.targetHint.textContent = `选择${currentSkill.name}目标点`;
  renderAll();
}

function prepareFlash(actor, skillKey = "flash") {
  const currentSkill = actor.skills[skillKey];
  const cells = getCellsInRange(actor.position, currentSkill.range).filter((cell) => hexDistance(actor.position, cell) > 0 && !getCharacterAt(cell));
  state.hoverPreview = null;
  state.selection = { type: "flash", actorId: actor.id, skillKey, menu: "skills", rangeKeys: new Set(cells.map(coordKey)), selectableKeys: new Set(cells.map(coordKey)), highlightClass: "move", hoverText: "位移到此格" };
  els.targetHint.textContent = cells.length ? "选择位移目标" : "没有可位移空格";
  renderAll();
}

async function moveAction(actor, targetCell) {
  await performAction(actor, {
    name: "普通移动",
    tickCost: false,
    unitClass: "casting",
    effect: async () => {
      actor.position = cloneCoord(targetCell);
      pickupShard(actor);
      renderUnits();
      await sleep(420);
    },
  });
}

async function waitAction(actor) {
  await performAction(actor, { name: "跳过", tickCost: false, unitClass: "casting", effect: async () => { addFloating(actor.position, "等待", "control"); await sleep(220); } });
}

async function continueChannelAction(actor) {
  const channel = getChannelStatus(actor);
  const zone = findChannelZone(actor, channel);
  if (!channel || !zone) {
    removeStatus(actor, "channel");
    renderAll();
    return;
  }
  await performAction(actor, {
    name: `继续引导${channel.skillName || "技能"}`,
    tickCost: false,
    unitClass: "casting",
    effect: async () => {
      await applyZoneEffect(zone, true);
      addFloating(actor.position, "继续引导", "shield");
      await sleep(220);
    },
  });
}

async function detonateLuxFieldAction(actor, skillKey) {
  const currentSkill = actor.skills[skillKey];
  const zone = getLuxField(actor);
  if (!zone || !currentSkill) return;
  await performAction(actor, {
    name: "引爆光辉领域",
    tickCost: false,
    unitClass: "casting",
    effect: async () => {
      markSpellCast(actor);
      const affected = sortTargetsByDistanceClockwise(actor, allAlive(oppositeTeam(actor.team)).filter((target) => getZoneCells(zone).some((cell) => coordsEqual(cell, target.position))));
      if (!affected.length) addLog(`战斗回合 ${state.battleTick}：光辉领域引爆，范围内暂无敌人。`);
      affected.forEach((target) => {
        dealDamage(actor, target, currentSkill.damage, "光辉领域", { skillDamage: true });
        addImpact(target.position);
      });
      zone.removed = true;
      startZoneCooldown(zone);
      cleanupEntities();
      renderAll();
      await sleep(260);
    },
  });
}

function endChannelAction(actor) {
  const channel = getChannelStatus(actor);
  if (!channel || state.isAnimating) return;
  removeStatus(actor, "channel");
  cleanupEntities();
  state.selection = null;
  state.hoverPreview = null;
  addFloating(actor.position, "结束引导", "control");
  addLog(`战斗回合 ${state.battleTick}：${actor.name}结束引导${channel.skillName || "技能"}。`);
  els.targetHint.textContent = `请选择 ${actor.name} 的行动`;
  renderAll();
}

async function basicAttack(actor, target) {
  await performAction(actor, {
    name: "普通攻击",
    tickCost: false,
    unitClass: "attacking",
    effect: async () => {
      actor.lastAttackTick = state.battleTick;
      let damage = actor.attackDamage;
      if (actor.heroKey === "yasuo" && Math.random() < 0.5) {
        damage *= 2;
        addFloating(actor.position, "双倍", "control");
      }
      if (actor.heroKey === "zoe" && actor.temp.sparkReady) {
        damage += 8;
        actor.temp.sparkReady = false;
        removeStatus(actor, "zoeSpark");
      }
      if (actor.heroKey === "lux" && getStatus(target, "illumination")) {
        removeStatus(target, "illumination");
        damage += 12;
        addFloating(target.position, "光芒引爆", "control");
      }
      if (actor.attackType === "melee") {
        dealDamage(actor, target, damage, "普通攻击");
        addImpact(target.position);
      } else {
        const direction = directionToward(actor.position, target.position);
        const startPos = direction ? addCoords(actor.position, direction) : cloneCoord(actor.position);
        const projectile = createProjectile({
          name: "远程普攻",
          type: "homing",
          actor,
          targetId: target.id,
          direction,
          startPos: cellExists(startPos) ? startPos : actor.position,
          initialTraveled: cellExists(startPos) ? 1 : 0,
          speed: actor.projectileSpeed || 2,
          maxDistance: actor.attackRange + 8,
          damage,
        });
        state.projectiles.push(projectile);
        const immediateHit = projectileHitTarget(projectile);
        if (immediateHit) await resolveProjectileHit(projectile, immediateHit);
        await advanceProjectileToEnd(projectile);
        addLog(`战斗回合 ${state.battleTick}：${actor.name}发射远程普攻，目标 ${target.name}。`);
      }
      await sleep(260);
    },
  });
}

async function castSelfSkill(actor, skillKey) {
  const currentSkill = getEffectiveSkill(actor, skillKey);
  await performAction(actor, {
    name: currentSkill.name,
    tickCost: currentSkill.tickCost,
    unitClass: "casting",
    effect: async () => {
      setCooldown(actor, skillKey);
      markSpellCast(actor);
      if (currentSkill.kind === "shield") {
        applyShield(actor, currentSkill.shield, currentSkill.duration, { sourceId: actor.id });
        addFloating(actor.position, `盾+${currentSkill.shield}`, "shield");
      } else if (currentSkill.kind === "mfW") {
        actor.temp.mfWBoost = 0.5;
        addFloating(actor.position, "加速50%", "shield");
      } else if (currentSkill.kind === "spin") {
        sortTargetsByDistanceClockwise(actor, allAlive(oppositeTeam(actor.team)).filter((target) => hexDistance(actor.position, target.position) <= currentSkill.range)).forEach((target) => {
          dealDamage(actor, target, currentSkill.damage, currentSkill.name, { skillDamage: true });
          applyStatus(target, "stun", currentSkill.stunDuration || 1, { sourceId: actor.id });
          addFloating(target.position, "晕眩", "control");
        });
      } else if (currentSkill.kind === "yasuoE3") {
        castYasuoWhirlwindStrike(actor, currentSkill);
      } else if (currentSkill.kind === "zoeW") {
        if (actor.temp.spellShard === "flash") {
          actor.temp.spellShard = null;
          const target = chooseFlashAway(actor, nearestEnemy(actor));
          if (target) actor.position = cloneCoord(target);
          addFloating(actor.position, "碎片闪现", "shield");
        } else {
          addFloating(actor.position, "无碎片", "control");
        }
      } else {
        addFloating(actor.position, "占位", "control");
      }
      await sleep(280);
    },
  });
}

async function castTargetSkill(actor, skillKey, target) {
  const currentSkill = getEffectiveSkill(actor, skillKey);
  if (currentSkill.kind === "dash") {
    const landing = chooseDashLanding(actor, target);
    if (!landing) return;
    await performAction(actor, {
      name: currentSkill.name,
      tickCost: false,
      unitClass: "attacking",
      effect: async () => {
        setCooldown(actor, skillKey);
        markSpellCast(actor);
        actor.position = cloneCoord(landing);
        renderUnits();
        await sleep(260);
        dealDamage(actor, target, currentSkill.damage, currentSkill.name, { skillDamage: true });
      },
    });
    return;
  }

  if (currentSkill.kind === "mfQ") {
    await performAction(actor, {
      name: currentSkill.name,
      tickCost: false,
      unitClass: "casting",
      effect: async () => {
        setCooldown(actor, skillKey);
        markSpellCast(actor);
        const projectile = createProjectile({ name: currentSkill.name, type: "homing", actor, targetId: target.id, speed: currentSkill.projectileSpeed, maxDistance: 12, damage: currentSkill.damage, effect: "mfQ" });
        state.projectiles.push(projectile);
        await advanceProjectileToEnd(projectile);
        await sleep(220);
      },
    });
  }

  if (currentSkill.kind === "yasuoR") {
    if (!hasStatus(target, "airborne")) return;
    await performAction(actor, {
      name: currentSkill.name,
      tickCost: false,
      unitClass: "attacking",
      effect: async () => {
        setCooldown(actor, skillKey);
        markSpellCast(actor);
        const landing = chooseDashLanding(actor, target, false) || actor.position;
        actor.position = cloneCoord(landing);
        renderUnits();
        await sleep(180);
        const affected = sortTargetsByDistanceClockwise(actor, allAlive(oppositeTeam(actor.team)).filter((enemy) => hexDistance(target.position, enemy.position) <= (currentSkill.areaRadius || 2)));
        affected.forEach((enemy) => {
          dealDamage(actor, enemy, currentSkill.damage, currentSkill.name, { skillDamage: true });
          removeStatus(enemy, "airborne");
          addImpact(enemy.position);
        });
      },
    });
  }
}

async function castLineTargetSkill(actor, skillKey, targetCell) {
  const currentSkill = getEffectiveSkill(actor, skillKey);
  if (currentSkill.kind === "zoeQ" || currentSkill.kind === "zoeE") {
    await castPointSkill(actor, skillKey, targetCell);
    return;
  }
  await castDirectionSkill(actor, skillKey, targetCell);
}

async function castFreeRaySkill(actor, skillKey, targetPoint) {
  const currentSkill = actor.skills[skillKey];
  const resolvedPoint = resolveRayTargetPoint(actor, currentSkill, targetPoint);
  await performAction(actor, {
    name: currentSkill.name,
    tickCost: false,
    unitClass: "casting",
    effect: async () => {
      setCooldown(actor, skillKey);
      markSpellCast(actor);
      castBeam(actor, currentSkill, resolvedPoint);
      await sleep(240);
    },
  });
}

async function castFreeConeSkill(actor, skillKey, targetPoint) {
  const currentSkill = actor.skills[skillKey];
  const resolvedPoint = resolveConeTargetPoint(actor, currentSkill, targetPoint);
  await performAction(actor, {
    name: currentSkill.name,
    tickCost: false,
    unitClass: "casting",
    effect: async () => {
      setCooldown(actor, skillKey);
      markSpellCast(actor);
      const cells = coneCellsFromPoint(actor.position, resolvedPoint, currentSkill.range, currentSkill.coneAngle || 30);
      const zone = createZone(actor, currentSkill, actor.position, { cells, remaining: currentSkill.duration, channelOwnerId: actor.id, channelSkillName: currentSkill.name });
      state.zones.push(zone);
      applyStatus(actor, "channel", currentSkill.duration, { skillName: currentSkill.name, zoneId: zone.id, damage: currentSkill.damage });
      await applyZoneEffect(zone, true);
      await sleep(240);
    },
  });
}

async function castFixedLineSkill(actor, skillKey, targetPoint) {
  const currentSkill = getEffectiveSkill(actor, skillKey);
  const line = fixedDistanceLine(actor, currentSkill, targetPoint);
  if (!line.pathCells.length && !line.targetCell) return;
  await performAction(actor, {
    name: currentSkill.name,
    tickCost: false,
    unitClass: "casting",
    effect: async () => {
      setCooldown(actor, skillKey);
      markSpellCast(actor);
      if (currentSkill.kind === "shieldLine") {
        await castShieldLine(actor, currentSkill, line);
      } else {
        const projectile = createProjectile({ name: currentSkill.name, type: "linear", actor, targetCell: line.targetCell, speed: currentSkill.projectileSpeed, maxDistance: currentSkill.maxDistance, damage: currentSkill.damage, rootDuration: currentSkill.rootDuration, maxHits: currentSkill.maxHits || 1, canBeBlocked: true, effect: actor.heroKey === "lux" ? "luxSkill" : null });
        projectile.path = line.pathCells.map(cloneCoord);
        projectile.pathIndex = -1;
        projectile.pathStart = cloneCoord(actor.position);
        projectile.pathTarget = line.targetCell ? cloneCoord(line.targetCell) : null;
        projectile.pathTargetPoint = { ...line.targetPoint };
        state.projectiles.push(projectile);
        await advanceProjectileToEnd(projectile);
      }
      await sleep(240);
    },
  });
}

async function castDirectionSkill(actor, skillKey, targetOrDirection) {
  const currentSkill = getEffectiveSkill(actor, skillKey);
  await performAction(actor, {
    name: currentSkill.name,
    tickCost: false,
    unitClass: "casting",
    effect: async () => {
      setCooldown(actor, skillKey);
      markSpellCast(actor);
      if (currentSkill.kind === "windWall") {
        const direction = targetOrDirection;
        state.windWalls.push(...createWindWalls(actor, direction, currentSkill.duration, currentSkill.width || 1));
        addLog(`战斗回合 ${state.battleTick}：${actor.name}架起风墙。`);
      } else if (currentSkill.kind === "yasuoQ" || currentSkill.kind === "yasuoQ3") {
        castYasuoSteelTempest(actor, currentSkill, targetOrDirection);
      } else if (currentSkill.kind === "yasuoE") {
        castYasuoSweepingBlade(actor, currentSkill, targetOrDirection);
      } else if (currentSkill.kind === "shieldLine") {
        await castShieldLine(actor, currentSkill, targetOrDirection);
      } else if (currentSkill.kind === "beam") {
        castBeam(actor, currentSkill, hexToPixel(targetOrDirection));
      } else if (currentSkill.kind === "cone") {
        const direction = targetOrDirection;
        const start = hexToPixel(actor.position);
        const directionPoint = hexToPixel(addCoords(actor.position, direction));
        const targetPoint = {
          x: start.x + (directionPoint.x - start.x) * currentSkill.range,
          y: start.y + (directionPoint.y - start.y) * currentSkill.range,
        };
        const cells = coneCellsFromPoint(actor.position, targetPoint, currentSkill.range, currentSkill.coneAngle || 30);
        const zone = createZone(actor, currentSkill, actor.position, { cells, remaining: currentSkill.duration, channelOwnerId: actor.id, channelSkillName: currentSkill.name });
        state.zones.push(zone);
        applyStatus(actor, "channel", currentSkill.duration, { skillName: currentSkill.name, zoneId: zone.id, damage: currentSkill.damage });
        await applyZoneEffect(zone, true);
      } else {
        const projectile = createProjectile({ name: currentSkill.name, type: "linear", actor, targetCell: targetOrDirection, speed: currentSkill.projectileSpeed, maxDistance: currentSkill.maxDistance, damage: currentSkill.damage, rootDuration: currentSkill.rootDuration, maxHits: currentSkill.maxHits || 1, canBeBlocked: true, effect: actor.heroKey === "lux" ? "luxSkill" : null });
        state.projectiles.push(projectile);
        await advanceProjectileToEnd(projectile);
      }
      await sleep(240);
    },
  });
}

function castYasuoSteelTempest(actor, currentSkill, direction) {
  const cells = yasuoLineCells(actor, currentSkill, direction);
  const targets = targetsOnCells(actor, cells);
  const empowered = currentSkill.kind === "yasuoQ3";
  if (empowered) consumeYasuoWind(actor);
  if (!targets.length) {
    addLog(`战斗回合 ${state.battleTick}：${currentSkill.name}未命中目标。`);
    return;
  }
  targets.forEach((target) => {
    dealDamage(actor, target, currentSkill.damage, currentSkill.name, { skillDamage: true });
    addImpact(target.position);
    if (empowered && target.isAlive) {
      applyStatus(target, "airborne", currentSkill.airborneDuration || 2, { sourceId: actor.id });
      addFloating(target.position, "浮空", "control");
    }
  });
  if (!empowered) gainYasuoWind(actor);
}

function castYasuoSweepingBlade(actor, currentSkill, direction) {
  const destination = yasuoDashLandingCell(actor, direction, currentSkill);
  if (!destination) {
    addLog(`战斗回合 ${state.battleTick}：${currentSkill.name}没有合法落点。`);
    return;
  }
  const cells = yasuoLineCells(actor, currentSkill, destination);
  const targets = targetsOnCells(actor, cells);
  actor.position = cloneCoord(destination);
  pickupShard(actor);
  targets.forEach((target) => {
    dealDamage(actor, target, currentSkill.damage, currentSkill.name, { skillDamage: true });
    addImpact(target.position);
  });
  if (targets.length) gainYasuoWind(actor);
  renderUnits();
}

function castYasuoWhirlwindStrike(actor, currentSkill) {
  consumeYasuoWind(actor);
  const targets = sortTargetsByDistanceClockwise(actor, allAlive(oppositeTeam(actor.team)).filter((target) => hexDistance(actor.position, target.position) <= currentSkill.range));
  if (!targets.length) {
    addLog(`战斗回合 ${state.battleTick}：${currentSkill.name}未命中目标。`);
    return;
  }
  targets.forEach((target) => {
    dealDamage(actor, target, currentSkill.damage, currentSkill.name, { skillDamage: true });
    applyStatus(target, "airborne", currentSkill.airborneDuration || 2, { sourceId: actor.id });
    addFloating(target.position, "浮空", "control");
    addImpact(target.position);
  });
}

function directionLineCells(origin, direction, range) {
  const cells = [];
  for (let step = 1; step <= range; step += 1) {
    const cell = addCoords(origin, scaleDirection(direction, step));
    if (!cellExists(cell)) break;
    cells.push(cell);
  }
  return cells;
}

function yasuoLineCells(actor, currentSkill, targetOrDirection) {
  if (!actor || !currentSkill || !targetOrDirection) return [];
  if (targetOrDirection.name) return directionLineCells(actor.position, targetOrDirection, currentSkill.range);
  return projectileLinePath(actor.position, targetOrDirection, currentSkill.range).filter((cell) => hexDistance(actor.position, cell) <= currentSkill.range);
}

function yasuoDashLandingCell(actor, targetOrDirection, currentSkill) {
  if (!actor || !targetOrDirection || !currentSkill) return null;
  const landing = targetOrDirection.name ? addCoords(actor.position, scaleDirection(targetOrDirection, currentSkill.range)) : cloneCoord(targetOrDirection);
  if (hexDistance(actor.position, landing) !== currentSkill.range) return null;
  if (!cellExists(landing) || getCharacterAt(landing)) return null;
  return landing;
}

function targetsOnCells(actor, cells) {
  return cells
    .map((cell) => getEnemyAt(cell, actor.team))
    .filter(Boolean);
}

async function castPointSkill(actor, skillKey, center) {
  const currentSkill = actor.skills[skillKey];
  await performAction(actor, {
    name: currentSkill.name,
    tickCost: false,
    unitClass: "casting",
    effect: async () => {
      if (currentSkill.kind !== "luxField" && currentSkill.kind !== "zoeQ") setCooldown(actor, skillKey);
      markSpellCast(actor);
      if (currentSkill.kind === "luxField") {
        const zone = createZone(actor, currentSkill, center, { damage: 0, slow: currentSkill.slow || 0.3, effect: "luxField", cooldownSkillKey: skillKey, detonateDamage: currentSkill.damage });
        state.zones.push(zone);
        addLog(`战斗回合 ${state.battleTick}：${actor.name}布下光辉领域。`);
      } else if (currentSkill.kind === "zone") {
        const zone = createZone(actor, currentSkill, center, { slow: currentSkill.slow || 0 });
        state.zones.push(zone);
        await applyZoneEffect(zone, true);
      } else if (currentSkill.kind === "zoeQ") {
        await castZoeQ(actor, currentSkill, center);
      } else if (currentSkill.kind === "zoeE") {
        const projectile = createProjectile({ name: currentSkill.name, type: "bubble", actor, targetCell: center, speed: currentSkill.projectileSpeed, maxDistance: actor.attackRange + 4, damage: 0, effect: "bubble", trapDuration: currentSkill.trapDuration });
        state.projectiles.push(projectile);
        await advanceProjectileToEnd(projectile);
      }
      await sleep(240);
    },
  });
}

async function flashAction(actor, targetCell, skillKey = "flash") {
  const currentSkill = actor.skills[skillKey];
  await performAction(actor, {
    name: currentSkill.name,
    tickCost: false,
    keepTurn: skillKey === "flash",
    unitClass: "casting",
    effect: async () => {
      setCooldown(actor, skillKey);
      if (actor.team === "enemy") dropShard(actor.position);
      if (skillKey === "r" && actor.heroKey === "zoe") {
        actor.temp.returnPortal = cloneCoord(actor.position);
        actor.temp.returnReady = false;
      }
      actor.position = cloneCoord(targetCell);
      pickupShard(actor);
      markSpellCast(actor);
      addFloating(actor.position, currentSkill.name, "shield");
      await sleep(300);
    },
  });
}

function createProjectile({ name, type, actor, targetId = null, targetCell = null, direction = null, startPos = null, initialTraveled = 0, speed = 2, maxDistance = 8, damage = 0, damagePerCell = 0, rootDuration = 0, maxHits = 1, canBeBlocked = true, effect = null, trapDuration = 0, pauseDuration = 0 }) {
  return {
    id: nextId("projectile"),
    name,
    type,
    team: actor.team,
    ownerId: actor.id,
    targetId,
    targetCell: targetCell ? cloneCoord(targetCell) : null,
    pos: cloneCoord(startPos || actor.position),
    direction: direction || (targetId ? directionToward(actor.position, getCharacter(targetId).position) : directionToward(actor.position, targetCell)),
    path: null,
    pathIndex: -1,
    pathStart: null,
    pathTarget: null,
    pathTargetPoint: null,
    pixelPos: null,
    speed,
    maxDistance,
    traveled: initialTraveled,
    damage,
    damagePerCell,
    rootDuration,
    maxHits,
    hitIds: new Set(),
    canBeBlocked,
    effect,
    trapDuration,
    pauseDuration,
    createdOrder: nextOrder(),
    removed: false,
    paused: false,
    remaining: 0,
  };
}

function createZone(actor, currentSkill, center, overrides = {}) {
  return {
    id: nextId("zone"),
    name: currentSkill.name,
    team: actor.team,
    ownerId: actor.id,
    center: cloneCoord(center),
    areaRadius: currentSkill.areaRadius || 1,
    damage: currentSkill.damage || 0,
    remaining: currentSkill.duration || overrides.remaining || 1,
    createdTick: state.battleTick,
    createdOrder: nextOrder(),
    removed: false,
    slow: 0,
    ...overrides,
  };
}

async function castShieldLine(actor, currentSkill, targetCellOrLine) {
  const line = targetCellOrLine?.pathCells ? targetCellOrLine : null;
  const targetCell = line?.targetCell || targetCellOrLine;
  const pathCells = line?.pathCells?.map(cloneCoord) || projectileLinePath(actor.position, targetCell, currentSkill.maxDistance || currentSkill.range || 6);
  const shielded = new Set([actor.id]);
  applyShield(actor, currentSkill.shield, currentSkill.duration, { sourceId: actor.id });
  addFloating(actor.position, `盾+${currentSkill.shield}`, "shield");
  const projectile = {
    id: nextId("projectile"),
    name: currentSkill.name,
    type: "shieldLine",
    team: actor.team,
    ownerId: actor.id,
    targetId: null,
    targetCell: targetCell ? cloneCoord(targetCell) : null,
    pos: cloneCoord(actor.position),
    direction: directionToward(actor.position, targetCell),
    path: pathCells,
    pathIndex: -1,
    pathStart: cloneCoord(actor.position),
    pathTarget: targetCell ? cloneCoord(targetCell) : null,
    pathTargetPoint: line?.targetPoint ? { ...line.targetPoint } : null,
    pixelPos: null,
    speed: 1,
    maxDistance: currentSkill.maxDistance || currentSkill.range || 6,
    traveled: 0,
    damage: 0,
    rootDuration: 0,
    canBeBlocked: true,
    effect: "shieldLine",
    createdOrder: nextOrder(),
    removed: false,
    paused: false,
    remaining: 0,
  };
  state.projectiles.push(projectile);
  renderProjectiles();
  await sleep(70);

  for (const next of pathCells) {
    if (isBlockedByWindWall(projectile, projectile.pos, next)) {
      projectile.removed = true;
      addLog(`战斗回合 ${state.battleTick}：${currentSkill.name}被风墙阻挡并消散。`);
      break;
    }
    projectile.pos = cloneCoord(next);
    projectile.traveled += 1;
    projectile.pathIndex += 1;
    projectile.pixelPos = projectilePathPoint(projectile, next);
    const ally = state.characters.find((character) => character.isAlive && character.team === actor.team && coordsEqual(character.position, projectile.pos));
    if (ally && !shielded.has(ally.id)) {
      shielded.add(ally.id);
      applyShield(ally, currentSkill.shield, currentSkill.duration, { sourceId: actor.id });
      addFloating(ally.position, `盾+${currentSkill.shield}`, "shield");
    }
    renderProjectiles();
    await sleep(90);
  }

  projectile.removed = true;
  cleanupEntities();
  renderAll();
}

function castBeam(actor, currentSkill, targetPoint) {
  let hit = 0;
  const pathCells = rayCellsFromPoint(actor.position, targetPoint, currentSkill.maxDistance || HEX_RADIUS * 2);
  for (const cell of pathCells) {
    const target = getEnemyAt(cell, actor.team);
    if (target) {
      hit += 1;
      dealDamage(actor, target, currentSkill.damage, currentSkill.name, { skillDamage: true, luxUltimate: true });
      addImpact(target.position);
    }
  }
  if (!hit) addLog(`战斗回合 ${state.battleTick}：${currentSkill.name}未命中目标。`);
}

async function castZoeQ(actor, currentSkill, center) {
  const existing = activeZoeQStar(actor);
  if (existing && actor.temp.zoeQRecastUntil >= state.battleTick) {
    existing.targetCell = cloneCoord(center);
    existing.paused = false;
    existing.remaining = 0;
    existing.direction = directionToward(existing.pos, center);
    existing.path = null;
    existing.pathIndex = -1;
    existing.pixelPos = null;
    addLog(`战斗回合 ${state.battleTick}：${actor.name}重新导引飞星。`);
    await advanceProjectileToEnd(existing);
    return;
  }
  actor.temp.zoeQRecastUntil = state.battleTick + currentSkill.recastWindow;
  const projectile = createProjectile({ name: currentSkill.name, type: "star", actor, targetCell: center, speed: currentSkill.projectileSpeed, maxDistance: 40, damage: currentSkill.damage, damagePerCell: currentSkill.damagePerCell || 0.15, canBeBlocked: false, effect: "zoeQ", pauseDuration: currentSkill.pauseDuration || 2 });
  state.projectiles.push(projectile);
  await advanceProjectileToEnd(projectile);
}

async function performAction(actor, action) {
  if (state.gameOver || state.isAnimating || !actor.isAlive) return;
  state.isAnimating = true;
  state.selection = null;
  state.hoverPreview = null;
  renderAll();
  showToast(`${actor.team === "player" ? "玩家" : "敌方 AI"}使用：${action.name}`);
  beginActionLog(actor, action);
  setTempUnitClass(actor.id, action.unitClass);
  await sleep(150);
  await action.effect();
  flushActionLog(actor, action);
  renderAll();
  await sleep(300);
  setTempUnitClass(actor.id, "");
  if (action.keepTurn) {
    await resumeCurrentTurn(actor);
    return;
  }
  await completeAction(actor);
}

async function resumeCurrentTurn(actor) {
  cleanupEntities();
  checkGameOver();
  state.isAnimating = false;
  state.currentActorId = actor.id;
  state.selection = null;
  state.hoverPreview = null;
  els.targetHint.textContent = actor.team === "player" ? `请选择 ${actor.name} 的行动` : "敌方 AI 思考中";
  renderAll();
  if (!state.gameOver && actor.team === "enemy") {
    await sleep(260);
    await runEnemyTurn(actor);
  }
}

async function completeAction(actor) {
  if (state.gameOver) {
    state.isAnimating = false;
    renderAll();
    return;
  }
  if (state.currentActorId === actor.id) actor.actionProgress = 0;
  handleReturnPortal(actor);
  cleanupEntities();
  checkGameOver();
  state.isAnimating = false;
  renderAll();
  if (!state.gameOver) await scheduleNextTurn();
}

async function advanceBattlefieldTime(reason) {
  showToast(reason);
  await sleep(180);
  state.battleTick += 1;
  state.isBattlefieldSettling = true;
  addLog(`战斗回合 ${state.battleTick}：${reason}。`);
  spawnPeriodicShard();
  await resolveZones();
  tickDurations();
  cleanupEntities();
  reduceCooldowns();
  state.isBattlefieldSettling = false;
  checkGameOver();
  renderAll();
  await sleep(160);
}

async function resolveZones() {
  const zones = [...state.zones].sort((a, b) => a.createdOrder - b.createdOrder);
  for (const zone of zones) {
    if (state.gameOver || zone.removed) continue;
    if (zone.channelOwnerId) continue;
    await applyZoneEffect(zone, false);
    zone.remaining -= 1;
    if (zone.remaining <= 0) {
      zone.removed = true;
      addLog(`战斗回合 ${state.battleTick}：${zone.name}结束。`);
    }
    cleanupEntities();
    checkGameOver();
    renderAll();
    await sleep(100);
  }
}

async function applyZoneEffect(zone, immediate) {
  if (zone.removed) return;
  if (zone.effect === "bubbleTrap") {
    const target = allAlive(oppositeTeam(zone.team)).find((character) => getZoneCells(zone).some((cell) => coordsEqual(cell, character.position)));
    if (target) {
      const owner = getCharacter(zone.ownerId);
      applyStatus(target, "drowsy", 1, { sourceId: zone.ownerId });
      zone.removed = true;
      addFloating(target.position, "困倦", "control");
      recordEffectTargetLog(owner, target, zone.name);
    }
    return;
  }
  const owner = getCharacter(zone.ownerId);
  const affected = sortTargetsByDistanceClockwise(owner, allAlive(oppositeTeam(zone.team)).filter((character) => getZoneCells(zone).some((cell) => coordsEqual(cell, character.position))));
  if (!affected.length && immediate) addLog(`战斗回合 ${state.battleTick}：${zone.name}展开，范围内暂无敌人。`);
  const externalLog = !state.pendingLog && owner && affected.length && zone.damage > 0;
  if (externalLog) beginActionLog(owner, { name: zone.name, logType: "skill" });
  affected.forEach((target) => {
    if (zone.damage > 0) {
      dealDamage(owner, target, zone.damage, zone.name, { skillDamage: true });
      addImpact(target.position);
    }
  });
  if (externalLog) flushActionLog(owner, { name: zone.name });
  if (affected.length) await sleep(150);
}

async function advanceProjectileToEnd(projectile) {
  if (!projectile || projectile.removed) return;
  if (projectile.targetCell) ensureProjectileLinePath(projectile);
  renderProjectiles();
  await sleep(70);
  const remainingPathSteps = projectile.path ? projectile.path.length - projectile.pathIndex - 1 : projectile.maxDistance - projectile.traveled;
  const maxSteps = Math.max(1, remainingPathSteps);
  await advanceProjectile(projectile, maxSteps, "释放推进");
  cleanupEntities();
  renderAll();
}

async function advanceProjectile(projectile, steps, source) {
  if (projectile.paused) return;
  for (let i = 0; i < steps; i += 1) {
    if (projectile.removed || state.gameOver) return;
    const next = nextProjectileCell(projectile);
    if (!next || !cellExists(next)) {
      projectile.removed = true;
      if (projectile.path && projectile.pathIndex >= projectile.path.length - 1) {
        addLog(`战斗回合 ${state.battleTick}：${projectile.name}到达终点并消失。`);
      } else {
        addLog(`战斗回合 ${state.battleTick}：${projectile.name}飞出棋盘并消失。`);
      }
      return;
    }
    if (projectile.canBeBlocked && isBlockedByWindWall(projectile, projectile.pos, next)) {
      projectile.removed = true;
      addScreenImpact(midpoint(hexToPixel(projectile.pos), hexToPixel(next)));
      addLog(`战斗回合 ${state.battleTick}：${projectile.name}被风墙阻挡并消散。`);
      await sleep(120);
      return;
    }
    projectile.pos = cloneCoord(next);
    projectile.traveled += 1;
    if (projectile.path) {
      projectile.pathIndex += 1;
      projectile.pixelPos = projectilePathPoint(projectile, next);
    }
    renderProjectiles();
    await sleep(source === "释放推进" ? 90 : 120);
    const hitTarget = projectileHitTarget(projectile);
    if (hitTarget) {
      await resolveProjectileHit(projectile, hitTarget);
      await sleep(120);
      if (projectile.removed) return;
    }
    if ((projectile.type === "star" || projectile.type === "bubble") && projectile.targetCell && coordsEqual(projectile.pos, projectile.targetCell)) {
      if (projectile.type === "star") {
        projectile.paused = true;
        projectile.remaining = projectile.pauseDuration || 2;
        addLog(`战斗回合 ${state.battleTick}：飞星到达目标点并停留 ${projectile.remaining}个回合。`);
        return;
      }
      if (projectile.type === "bubble") {
        projectile.removed = true;
        await createBubbleTrap(projectile);
        return;
      }
    }
    if (!projectile.path && projectile.traveled >= projectile.maxDistance) {
      projectile.removed = true;
      addLog(`战斗回合 ${state.battleTick}：${projectile.name}达到最大距离并消失。`);
      return;
    }
  }
  if (projectile.path && !projectile.paused && !projectile.removed) {
    projectile.removed = true;
    addLog(`战斗回合 ${state.battleTick}：${projectile.name}到达终点并消失。`);
  }
}

function nextProjectileCell(projectile) {
  if (projectile.type === "homing") {
    const target = projectile.targetId ? getCharacter(projectile.targetId) : null;
    if (target?.isAlive) projectile.direction = directionToward(projectile.pos, target.position) || projectile.direction;
    return projectile.direction ? addCoords(projectile.pos, projectile.direction) : null;
  }
  if (projectile.path) {
    const next = projectile.path[projectile.pathIndex + 1] || null;
    if (next) projectile.direction = directionToward(projectile.pos, next) || projectile.direction;
    return next;
  }
  if (projectile.targetCell) {
    ensureProjectileLinePath(projectile);
    const next = projectile.path?.[projectile.pathIndex + 1] || null;
    if (next) projectile.direction = directionToward(projectile.pos, next) || directionToward(projectile.pos, projectile.targetCell) || projectile.direction;
    return next;
  }
  return projectile.direction ? addCoords(projectile.pos, projectile.direction) : null;
}

function projectileHitTarget(projectile) {
  if (projectile.type === "homing" && projectile.targetId) {
    const target = getCharacter(projectile.targetId);
    return target?.isAlive && !projectile.hitIds.has(target.id) && coordsEqual(projectile.pos, target.position) ? target : null;
  }
  return allAlive(oppositeTeam(projectile.team)).find((character) => !projectile.hitIds.has(character.id) && coordsEqual(character.position, projectile.pos));
}

async function resolveProjectileHit(projectile, target) {
  projectile.hitIds.add(target.id);
  projectile.removed = projectile.hitIds.size >= (projectile.maxHits || 1);
  if (projectile.effect === "bubble") {
    projectile.removed = true;
    const owner = getCharacter(projectile.ownerId);
    applyStatus(target, "drowsy", 1, { sourceId: owner?.id });
    addFloating(target.position, "困倦", "control");
    recordEffectTargetLog(owner, target, projectile.name);
    return;
  }
  const owner = getCharacter(projectile.ownerId);
  let damage = projectile.damage;
  if (projectile.effect === "zoeQ") damage = Math.round(damage * (1 + projectile.traveled * (projectile.damagePerCell || 0.1)));
  dealDamage(owner, target, damage, projectile.name, { skillDamage: projectile.effect === "luxSkill" || projectile.effect === "zoeQ" || projectile.effect === "mfQ" || projectile.effect === "mfQBounce" });
  addImpact(target.position);
  if (projectile.effect === "zoeQ") splashZoeQ(owner, target, damage);
  if (projectile.rootDuration && target.isAlive) {
    applyStatus(target, "root", projectile.rootDuration, { sourceId: owner?.id });
    addFloating(target.position, "禁锢", "control");
  }
  if (projectile.effect === "mfQ") await bounceMissFortuneQ(owner, target, projectile);
}

function splashZoeQ(owner, primaryTarget, primaryDamage) {
  if (!owner || !primaryTarget || primaryDamage <= 0) return;
  const splashDamage = Math.max(1, Math.round(primaryDamage * 0.5));
  const targets = sortTargetsByDistanceClockwise(owner, allAlive(oppositeTeam(owner.team)).filter((target) => target.id !== primaryTarget.id && hexDistance(primaryTarget.position, target.position) <= 1));
  targets.forEach((target) => {
    dealDamage(owner, target, splashDamage, "飞星乱入·溅射", { skillDamage: true });
    addImpact(target.position);
  });
}

async function bounceMissFortuneQ(actor, firstTarget, projectile) {
  const cells = missFortuneQSecondHitCells(actor, firstTarget);
  const candidates = allAlive(oppositeTeam(actor.team)).filter((target) => target.id !== firstTarget.id && cells.some((cell) => coordsEqual(cell, target.position)));
  if (!candidates.length) return;
  const nextTarget = candidates.sort((a, b) => hexDistance(firstTarget.position, a.position) - hexDistance(firstTarget.position, b.position))[0];
  const bounceProjectile = createProjectile({
    name: "一箭双雕·弹射",
    type: "homing",
    actor,
    targetId: nextTarget.id,
    direction: directionToward(firstTarget.position, nextTarget.position),
    startPos: firstTarget.position,
    speed: projectile.speed || actor.projectileSpeed || 3,
    maxDistance: 6,
    damage: Math.max(1, projectile.damage - 2),
    effect: "mfQBounce",
  });
  state.projectiles.push(bounceProjectile);
  renderProjectiles();
  await sleep(120);
  await advanceProjectileToEnd(bounceProjectile);
}

function missFortuneQSecondHitCells(actor, firstTarget) {
  const away = directionToward(actor.position, firstTarget.position);
  if (!away) return [];
  const targetPoint = hexToPixel(addCoords(firstTarget.position, scaleDirection(away, 2)));
  return coneCellsFromPoint(firstTarget.position, targetPoint, 2, 80);
}

async function createBubbleTrap(projectile) {
  const owner = getCharacter(projectile.ownerId);
  const trapSkill = { name: "催眠气泡陷阱", damage: 0, areaRadius: 1, duration: projectile.trapDuration || 2 };
  const zone = createZone(owner, trapSkill, projectile.pos, { effect: "bubbleTrap", remaining: projectile.trapDuration || 2 });
  state.zones.push(zone);
  addLog(`战斗回合 ${state.battleTick}：催眠气泡形成陷阱。`);
  await applyZoneEffect(zone, true);
}

function tickDurations() {
  state.characters.forEach((character) => {
    if (!character.isAlive) return;
    character.statuses.forEach((status) => {
      if (status.appliedTick < state.battleTick) status.remaining -= 1;
    });
    character.statuses.forEach((status) => {
      if (status.type === "drowsy" && status.remaining <= 0) {
        status.type = "sleep";
        status.remaining = 2;
        status.appliedTick = state.battleTick;
        removeStatus(character, "channel");
        addFloating(character.position, "昏睡", "control");
      }
    });
    character.statuses.filter((status) => status.remaining <= 0).forEach((status) => {
      if (status.type === "channel") removeChannelZone(character);
      addLog(`战斗回合 ${state.battleTick}：${character.name}的${statusLabel(status).replace(/\s.*/, "")}结束。`);
    });
    character.statuses = character.statuses.filter((status) => status.remaining > 0);
  });
  state.windWalls.forEach((wall) => {
    if (wall.createdTick < state.battleTick) wall.remaining -= 1;
    if (wall.remaining <= 0) {
      wall.removed = true;
      addLog(`战斗回合 ${state.battleTick}：风墙消散。`);
    }
  });
  state.projectiles.forEach((projectile) => {
    if (projectile.paused && projectile.remaining > 0) {
      projectile.remaining -= 1;
      if (projectile.remaining <= 0) projectile.removed = true;
    }
  });
}

function reduceCooldowns() {
  state.characters.forEach((character) => {
    Object.values(character.skills).forEach((currentSkill) => {
      if (currentSkill.currentCooldown > 0) currentSkill.currentCooldown -= 1;
    });
  });
}

async function scheduleNextTurn() {
  if (state.gameOver || !state.started) return;
  state.currentActorId = null;
  state.selection = null;
  state.hoverPreview = null;
  els.targetHint.textContent = "行动条推进中";
  renderAll();
  await sleep(140);

  const alive = state.characters.filter((character) => character.isAlive);
  const advancing = alive.filter((character) => !hasStatus(character, "sleep") && !hasStatus(character, "airborne"));
  let timeToNext = Infinity;
  advancing.forEach((character) => {
    const speed = effectiveActionSpeed(character);
    const need = Math.max(0, ACTION_BAR_LENGTH - character.actionProgress);
    timeToNext = Math.min(timeToNext, need / speed);
  });
  const timeNeed = Math.max(0, ACTION_BAR_LENGTH - state.timeProgress);
  timeToNext = Math.min(timeToNext, timeNeed / BATTLEFIELD_TIME_SPEED);
  if (!Number.isFinite(timeToNext)) return;
  advancing.forEach((character) => {
    character.actionProgress = Math.min(ACTION_BAR_LENGTH, character.actionProgress + effectiveActionSpeed(character) * timeToNext);
  });
  state.timeProgress = Math.min(ACTION_BAR_LENGTH, state.timeProgress + BATTLEFIELD_TIME_SPEED * timeToNext);
  renderUi();
  await sleep(260);

  if (state.timeProgress >= ACTION_BAR_LENGTH - 0.01) {
    state.timeProgress = 0;
    await advanceBattlefieldTime("战斗回合结算");
    if (!state.gameOver) await scheduleNextTurn();
    return;
  }

  const actor = advancing.filter((character) => character.actionProgress >= ACTION_BAR_LENGTH - 0.01).sort((a, b) => effectiveActionSpeed(b) - effectiveActionSpeed(a))[0];
  if (!actor) return;
  state.currentActorId = actor.id;
  clearManualViewCenter();
  els.targetHint.textContent = actor.team === "player" ? `请选择 ${actor.name} 的行动` : "敌方 AI 思考中";
  renderAll();
  if (hasStatus(actor, "stun")) {
    await skipStunnedTurn(actor);
    return;
  }
  if (actor.team === "enemy") {
    await sleep(480);
    await runEnemyTurn(actor);
  }
}

async function skipStunnedTurn(actor) {
  state.isAnimating = true;
  showToast(`${actor.name}被晕眩，无法行动`);
  addFloating(actor.position, "晕眩", "control");
  addLog({ type: "skip", tick: state.battleTick, actorId: actor.id, text: `${actor.name}被晕眩，跳过行动。` });
  await sleep(600);
  await completeAction(actor, false);
}

async function runEnemyTurn(actor) {
  if (state.gameOver || !actor.isAlive) return;
  if (getChannelStatus(actor)) return continueChannelAction(actor);
  const target = nearestEnemy(actor);
  if (!target) return;
  const distance = hexDistance(actor.position, target.position);
  if (actor.hp < 40 && flashUsable(actor)) {
    const cell = chooseFlashAway(actor, target);
    if (cell) return flashAction(actor, cell);
  }
  if (distance <= actor.attackRange && canAttack(actor)) return basicAttack(actor, target);
  const qSkill = getEffectiveSkill(actor, "q");
  if (qSkill && skillUsable(actor, "q")) {
    if (qSkill.kind === "yasuoQ" || qSkill.kind === "yasuoQ3") {
      const qTarget = targetableLineCellsForAi(actor, qSkill).find((cell) => targetsOnCells(actor, yasuoLineCells(actor, qSkill, cell)).length);
      if (qTarget) return castLineTargetSkill(actor, "q", qTarget);
    }
    if (qSkill.kind === "dash" && distance <= qSkill.range && chooseDashLanding(actor, target)) return castTargetSkill(actor, "q", target);
    if (qSkill.kind === "mfQ" && distance <= qSkill.range) return castTargetSkill(actor, "q", target);
  }
  const rSkill = getEffectiveSkill(actor, "r");
  if (rSkill?.kind === "yasuoR" && skillUsable(actor, "r")) {
    const rTarget = targetableEnemiesForSkill(actor, rSkill).sort((a, b) => hexDistance(actor.position, a.position) - hexDistance(actor.position, b.position))[0];
    if (rTarget) return castTargetSkill(actor, "r", rTarget);
  }
  const incoming = findIncomingProjectile(actor);
  if (incoming && actor.skills.w?.kind === "windWall" && skillUsable(actor, "w")) return castDirectionSkill(actor, "w", directionToward(actor.position, incoming.pos) || DIRECTIONS[3]);
  const eSkill = getEffectiveSkill(actor, "e");
  if (eSkill?.kind === "yasuoE3" && skillUsable(actor, "e") && distance <= eSkill.range) return castSelfSkill(actor, "e");
  if (eSkill?.kind === "yasuoE" && skillUsable(actor, "e")) {
    const eTarget = targetableLineCellsForAi(actor, eSkill).find((cell) => targetsOnCells(actor, yasuoLineCells(actor, eSkill, cell)).length);
    if (eTarget) return castLineTargetSkill(actor, "e", eTarget);
  }
  if (eSkill?.kind === "spin" && skillUsable(actor, "e") && distance <= eSkill.range) return castSelfSkill(actor, "e");
  if (eSkill?.kind === "zone" && skillUsable(actor, "e") && distance <= eSkill.range) return castPointSkill(actor, "e", target.position);
  return enemyMoveOrWait(actor, target);
}

function targetableLineCellsForAi(actor, currentSkill) {
  return getLineTargetCells(actor, currentSkill).sort((a, b) => {
    const target = nearestEnemy(actor);
    const aDistance = target ? hexDistance(a, target.position) : hexDistance(actor.position, a);
    const bDistance = target ? hexDistance(b, target.position) : hexDistance(actor.position, b);
    return aDistance - bDistance || hexDistance(actor.position, a) - hexDistance(actor.position, b);
  });
}

async function enemyMoveOrWait(actor, target) {
  const cells = getReachableCells(actor);
  const best = cells.filter((cell) => !getCharacterAt(cell)).sort((a, b) => hexDistance(a, target.position) - hexDistance(b, target.position))[0];
  if (best && hexDistance(best, target.position) < hexDistance(actor.position, target.position)) return moveAction(actor, best);
  return waitAction(actor);
}

function dealDamage(source, target, amount, reason, options = {}) {
  if (!target?.isAlive) return;
  let remaining = amount;
  const mfBonus = applyMissFortuneTargetPassive(source, target, amount, options);
  if (mfBonus > 0) remaining += mfBonus;
  if (hasStatus(target, "sleep")) {
    remaining *= 2;
    removeStatus(target, "sleep");
    addFloating(target.position, "昏睡破除", "control");
  }
  if (options.luxUltimate && getStatus(target, "illumination")) {
    removeStatus(target, "illumination");
    remaining += 12;
  }
  const incoming = remaining;
  const shields = target.statuses.filter((status) => status.type === "shield" && status.amount > 0);
  for (const shield of shields) {
    if (remaining <= 0) break;
    const blocked = Math.min(shield.amount, remaining);
    shield.amount -= blocked;
    remaining -= blocked;
    addFloating(target.position, `盾-${blocked}`, "shield");
    if (shield.amount <= 0) shield.remaining = 0;
  }
  if (remaining > 0) {
    target.hp -= remaining;
    target.lastDamagedTick = state.battleTick;
    target.temp.mfWBoost = 0;
    addFloating(target.position, `-${remaining}`, "damage");
    recordDamageLog(source, target, remaining, { reason, type: isBasicAttackReason(reason) ? "attack" : "skill" });
  } else {
    recordDamageLog(source, target, incoming, { reason, blocked: true, type: isBasicAttackReason(reason) ? "attack" : "skill" });
  }
  if (options.skillDamage && source?.heroKey === "lux" && target.isAlive) applyStatus(target, "illumination", 3, { sourceId: source.id });
  if (target.hp <= 0) killCharacter(target, source);
}

function isBasicAttackReason(reason) {
  return String(reason || "").includes("普攻") || String(reason || "").includes("普通攻击");
}

function applyMissFortuneTargetPassive(source, target, amount, options = {}) {
  if (!source || source.heroKey !== "mf" || amount <= 0 || options.missFortunePassive === false) return 0;
  if (source.team === target.team || hasStatus(target, "mfTarget")) return 0;
  state.characters.forEach((character) => removeStatus(character, "mfTarget"));
  applyStatus(target, "mfTarget", Infinity, { sourceId: source.id });
  addFloating(target.position, "厄运+7", "control");
  return 7;
}

function yasuoWindStacks(actor) {
  return getStatus(actor, "yasuoWind")?.stacks || 0;
}

function gainYasuoWind(actor) {
  if (!actor || actor.heroKey !== "yasuo") return;
  const current = getStatus(actor, "yasuoWind");
  const stacks = Math.min(2, (current?.stacks || 0) + 1);
  applyStatus(actor, "yasuoWind", Infinity, { stacks });
  addFloating(actor.position, `旋风${stacks}`, "control");
}

function consumeYasuoWind(actor) {
  removeStatus(actor, "yasuoWind");
}

function killCharacter(target, source) {
  if (!target.isAlive) return;
  removeStatus(target, "channel");
  target.isAlive = false;
  target.isDying = true;
  target.hp = 0;
  addLog(`战斗回合 ${state.battleTick}：${target.name}被${source?.name || "效果"}击败。`);
  state.projectiles.forEach((projectile) => {
    if (projectile.type === "homing" && projectile.targetId === target.id) {
      projectile.targetId = null;
      projectile.direction = directionToward(projectile.pos, target.position) || projectile.direction;
    }
  });
  setTimeout(() => {
    target.isDying = false;
    renderUnits();
  }, 420);
  checkGameOver();
}

function applyStatus(target, type, duration, extra = {}) {
  const existing = getStatus(target, type);
  if (existing) {
    existing.remaining = Math.max(existing.remaining, duration);
    existing.appliedTick = state.battleTick;
    Object.assign(existing, extra);
  } else {
    target.statuses.push({ type, remaining: duration, appliedTick: state.battleTick, ...extra });
  }
  if (type === "stun") removeStatus(target, "channel");
  if (type === "sleep") removeStatus(target, "channel");
}

function applyShield(target, amount, duration, extra = {}) {
  const source = extra.sourceId ? getCharacter(extra.sourceId) : target;
  const existing = getStatus(target, "shield");
  if (existing) {
    existing.amount = Math.max(existing.amount, amount);
    existing.remaining = Math.max(existing.remaining, duration);
    existing.appliedTick = state.battleTick;
    Object.assign(existing, extra);
  } else {
    target.statuses.push({ type: "shield", amount, remaining: duration, appliedTick: state.battleTick, ...extra });
  }
  recordShieldLog(source, target, amount, "护盾技能");
}

function removeStatus(target, type) {
  if (type === "channel") removeChannelZone(target);
  target.statuses = target.statuses.filter((status) => status.type !== type);
}

function markSpellCast(actor) {
  if (actor.heroKey === "zoe") {
    actor.temp.sparkReady = true;
    applyStatus(actor, "zoeSpark", Infinity);
  }
}

function canMove(actor) {
  return actor.isAlive && !hasStatus(actor, "root") && !hasStatus(actor, "stun") && !hasStatus(actor, "sleep") && !hasStatus(actor, "airborne");
}

function canAttack(actor) {
  return actor.isAlive && !hasStatus(actor, "stun") && !hasStatus(actor, "sleep") && !hasStatus(actor, "airborne") && actor.lastAttackTick !== state.battleTick;
}

function skillUsable(actor, key) {
  const currentSkill = getEffectiveSkill(actor, key);
  if (!currentSkill || currentSkill.disabled) return false;
  if (!actor.isAlive || hasStatus(actor, "stun") || hasStatus(actor, "sleep") || hasStatus(actor, "airborne")) return false;
  if ((currentSkill.kind === "dash" || currentSkill.kind === "yasuoE") && hasStatus(actor, "root")) return false;
  if ((currentSkill.kind === "flash" || currentSkill.kind === "zoeR") && hasStatus(actor, "root")) return false;
  if (actor.heroKey === "lux" && key === "e" && getLuxField(actor)) return true;
  if (actor.heroKey === "zoe" && key === "q" && activeZoeQStar(actor)) return actor.temp.zoeQRecastUntil >= state.battleTick;
  return currentSkill.currentCooldown <= 0 || (actor.heroKey === "zoe" && key === "q" && actor.temp.zoeQRecastUntil >= state.battleTick);
}

function flashUsable(actor) {
  return skillUsable(actor, "flash");
}

function setCooldown(actor, skillKey) {
  const currentSkill = actor.skills[skillKey];
  if (currentSkill && !(actor.heroKey === "zoe" && skillKey === "q" && actor.temp.zoeQRecastUntil >= state.battleTick)) {
    currentSkill.currentCooldown = currentSkill.cooldown;
  }
}

function activeZoeQStar(actor) {
  if (!actor) return null;
  return state.projectiles.find((projectile) => projectile.ownerId === actor.id && projectile.effect === "zoeQ" && !projectile.removed);
}

function effectiveActionSpeed(character) {
  let speed = character.actionSpeed;
  const mfPassive = missFortunePassiveInfo(character);
  if (mfPassive) speed *= 1 + mfPassive.bonus;
  state.zones.forEach((zone) => {
    if (!zone.removed && zone.slow && zone.team !== character.team && getZoneCells(zone).some((cell) => coordsEqual(cell, character.position))) speed *= 1 - zone.slow;
  });
  return speed;
}

function missFortunePassiveInfo(character) {
  if (!character || character.heroKey !== "mf") return null;
  let bonus = 0;
  if (character.lastDamagedTick < state.battleTick) {
    const safeTicks = Math.max(0, state.battleTick - Math.max(0, character.lastDamagedTick));
    bonus = Math.min(0.5, 0.2 + Math.max(0, safeTicks - 1) * 0.05);
  }
  if (character.temp.mfWBoost) bonus = Math.max(bonus, character.temp.mfWBoost);
  return {
    bonus,
    layers: Math.round(bonus / 0.05),
  };
}

function getReachableCells(actor) {
  if (!canMove(actor)) return [];
  const visited = new Set([coordKey(actor.position)]);
  const result = [];
  let frontier = [{ cell: actor.position, distance: 0 }];
  while (frontier.length) {
    const nextFrontier = [];
    frontier.forEach(({ cell, distance }) => {
      if (distance >= actor.moveRange) return;
      DIRECTIONS.forEach((direction) => {
        const next = addCoords(cell, direction);
        const key = coordKey(next);
        if (visited.has(key) || !cellExists(next) || getCharacterAt(next)) return;
        visited.add(key);
        result.push(next);
        nextFrontier.push({ cell: next, distance: distance + 1 });
      });
    });
    frontier = nextFrontier;
  }
  return result;
}

function getCellsInRange(center, range) {
  return state.cells.filter((cell) => hexDistance(center, cell) <= range);
}

function getZoneCells(zone) {
  if (zone.cells) return zone.cells;
  return getCellsInRange(zone.center, zone.areaRadius);
}

function coneCellsFromPoint(origin, targetPoint, range, coneAngle = 30) {
  const start = hexToPixel(origin);
  const resolved = resolveConeTargetPoint({ position: origin }, { range }, targetPoint);
  const centerAngle = Math.atan2(resolved.y - start.y, resolved.x - start.x);
  const halfAngle = ((coneAngle / 2) * Math.PI) / 180;
  const sampleCount = Math.max(3, Math.ceil(coneAngle / 2) + 1);
  const length = hexRangePixelDistance(range);
  const cells = new Map();
  for (let i = 0; i < sampleCount; i += 1) {
    const ratio = sampleCount === 1 ? 0.5 : i / (sampleCount - 1);
    const angle = centerAngle - halfAngle + ratio * halfAngle * 2;
    const end = {
      x: start.x + Math.cos(angle) * length,
      y: start.y + Math.sin(angle) * length,
    };
    linePathFromPixels(origin, start, end, range).forEach((cell) => cells.set(coordKey(cell), cell));
  }
  return [...cells.values()].sort((a, b) => hexDistance(origin, a) - hexDistance(origin, b) || clockwiseAngleFromTop(origin, a) - clockwiseAngleFromTop(origin, b));
}

function linePathFromPixels(origin, start, end, maxDistance) {
  const segmentLength = distance(start, end);
  if (!segmentLength) return [];
  return state.cells
    .map((cell) => ({
      cell,
      length: lineHexIntersectionLength(start, end, cell),
      order: pointSegmentProjectionRatio(hexToPixel(cell), start, end),
    }))
    .filter((item) => !coordsEqual(item.cell, origin))
    .filter((item) => hexDistance(origin, item.cell) <= maxDistance)
    .filter((item) => item.length >= LINE_HEX_MIN_INTERSECTION)
    .sort((a, b) => a.order - b.order || hexDistance(origin, a.cell) - hexDistance(origin, b.cell))
    .map((item) => cloneCoord(item.cell));
}

function rayCellsFromPoint(origin, targetPoint, maxDistance = HEX_RADIUS * 2) {
  const start = hexToPixel(origin);
  const end = resolveRayTargetPoint({ position: origin }, { maxDistance }, targetPoint);
  return linePathFromPixels(origin, start, end, maxDistance);
}

function fixedDistanceLine(actor, currentSkill, targetPoint = null) {
  const maxDistance = currentSkill.maxDistance || currentSkill.range || HEX_RADIUS * 2;
  const start = hexToPixel(actor.position);
  const end = resolveRayTargetPoint(actor, { maxDistance }, targetPoint);
  let pathCells = linePathFromPixels(actor.position, start, end, maxDistance);
  const targetCell = pathCells[pathCells.length - 1] || nearestCellToPointInRange(actor.position, end, maxDistance);
  if (!pathCells.length && targetCell) pathCells = [cloneCoord(targetCell)];
  return { targetPoint: end, targetCell, pathCells };
}

function nearestCellToPointInRange(origin, point, maxDistance) {
  return getCellsInRange(origin, maxDistance)
    .filter((cell) => hexDistance(origin, cell) > 0)
    .sort((a, b) => {
      const aDistance = hexDistance(origin, a);
      const bDistance = hexDistance(origin, b);
      const farthestFirst = bDistance - aDistance;
      if (farthestFirst) return farthestFirst;
      return distance(hexToPixel(a), point) - distance(hexToPixel(b), point);
    })[0] || null;
}

function defaultRayTargetPoint(actor, currentSkill) {
  const start = hexToPixel(actor.position);
  return { x: start.x + hexRangePixelDistance(currentSkill.maxDistance || HEX_RADIUS * 2), y: start.y };
}

function resolveRayTargetPoint(actor, currentSkill, targetPoint) {
  const start = hexToPixel(actor.position);
  const fallback = defaultRayTargetPoint(actor, currentSkill);
  const raw = targetPoint || fallback;
  const dx = raw.x - start.x;
  const dy = raw.y - start.y;
  const length = Math.hypot(dx, dy);
  const rayLength = hexRangePixelDistance(currentSkill.maxDistance || HEX_RADIUS * 2);
  if (length < 0.001) return fallback;
  return {
    x: start.x + (dx / length) * rayLength,
    y: start.y + (dy / length) * rayLength,
  };
}

function defaultConeTargetPoint(actor, currentSkill) {
  const start = hexToPixel(actor.position);
  return { x: start.x + hexRangePixelDistance(currentSkill.range), y: start.y };
}

function resolveConeTargetPoint(actor, currentSkill, targetPoint) {
  const start = hexToPixel(actor.position);
  const fallback = defaultConeTargetPoint(actor, currentSkill);
  const raw = targetPoint || fallback;
  const dx = raw.x - start.x;
  const dy = raw.y - start.y;
  const length = Math.hypot(dx, dy);
  const maxLength = hexRangePixelDistance(currentSkill.range);
  if (length < 0.001) return fallback;
  const clampedLength = Math.min(maxLength, length);
  return {
    x: start.x + (dx / length) * clampedLength,
    y: start.y + (dy / length) * clampedLength,
  };
}

function hexRangePixelDistance(range) {
  return range * HEX_SIZE * SQRT_3;
}

function projectileLinePath(from, to, maxDistance = HEX_RADIUS * 2) {
  if (!to || coordsEqual(from, to)) return [];
  const start = hexToPixel(from);
  const end = hexToPixel(to);
  const segmentLength = distance(start, end);
  if (!segmentLength) return [];
  const cells = state.cells
    .map((cell) => {
      const length = lineHexIntersectionLength(start, end, cell);
      const isTarget = coordsEqual(cell, to);
      return {
        cell,
        length,
        order: pointSegmentProjectionRatio(hexToPixel(cell), start, end),
        isTarget,
      };
    })
    .filter((item) => !coordsEqual(item.cell, from))
    .filter((item) => hexDistance(from, item.cell) <= Math.max(maxDistance, hexDistance(from, to)))
    .filter((item) => item.length >= LINE_HEX_MIN_INTERSECTION || item.isTarget)
    .sort((a, b) => a.order - b.order || hexDistance(from, a.cell) - hexDistance(from, b.cell));
  if (!cells.some((item) => item.isTarget)) {
    cells.push({ cell: cloneCoord(to), length: 0, order: 1, isTarget: true });
  }
  return cells.map((item) => cloneCoord(item.cell));
}

function ensureProjectileLinePath(projectile) {
  if (projectile.path) return;
  if (!projectile.targetCell) return;
  projectile.pathStart = cloneCoord(projectile.pos);
  projectile.pathTarget = cloneCoord(projectile.targetCell);
  projectile.path = projectileLinePath(projectile.pathStart, projectile.pathTarget, projectile.maxDistance);
  projectile.pathIndex = -1;
}

function projectilePathPoint(projectile, cell) {
  const start = hexToPixel(projectile.pathStart || projectile.pos);
  const end = projectile.pathTargetPoint || hexToPixel(projectile.pathTarget || projectile.targetCell || cell);
  if (projectile.targetCell && coordsEqual(cell, projectile.targetCell)) return end;
  const ratio = pointSegmentProjectionRatio(hexToPixel(cell), start, end);
  return {
    x: start.x + (end.x - start.x) * ratio,
    y: start.y + (end.y - start.y) * ratio,
  };
}

function lineHexIntersectionLength(start, end, cell) {
  return segmentInsidePolygonLength(start, end, hexPoints(hexToPixel(cell)));
}

function segmentInsidePolygonLength(start, end, polygon) {
  const direction = { x: end.x - start.x, y: end.y - start.y };
  const totalLength = Math.hypot(direction.x, direction.y);
  if (!totalLength) return 0;
  const orientation = Math.sign(polygonSignedArea(polygon)) || 1;
  let tMin = 0;
  let tMax = 1;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const edge = { x: b.x - a.x, y: b.y - a.y };
    const numerator = cross(edge, { x: start.x - a.x, y: start.y - a.y }) * orientation;
    const denominator = cross(edge, direction) * orientation;
    if (Math.abs(denominator) < 0.0001) {
      if (numerator < -0.0001) return 0;
      continue;
    }
    const t = (-0.0001 - numerator) / denominator;
    if (denominator > 0) tMin = Math.max(tMin, t);
    else tMax = Math.min(tMax, t);
    if (tMin - tMax > 0.0001) return 0;
  }
  return Math.max(0, tMax - tMin) * totalLength;
}

function pointSegmentProjectionRatio(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return 0;
  return clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
}

function polygonSignedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
}

function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

function chooseDashLanding(actor, target, enforceSkillRange = true) {
  return DIRECTIONS
    .map((direction) => addCoords(target.position, direction))
    .filter((cell) => cellExists(cell) && !getCharacterAt(cell))
    .filter((cell) => !enforceSkillRange || hexDistance(actor.position, cell) <= actor.skills.q.range)
    .sort((a, b) => hexDistance(actor.position, a) - hexDistance(actor.position, b))[0];
}

function chooseFlashAway(actor, threat) {
  if (!threat) return null;
  return getCellsInRange(actor.position, actor.skills.flash.range)
    .filter((cell) => hexDistance(actor.position, cell) > 0 && !getCharacterAt(cell))
    .sort((a, b) => hexDistance(b, threat.position) - hexDistance(a, threat.position))[0];
}

function findIncomingProjectile(actor) {
  return state.projectiles.find((projectile) => projectile.canBeBlocked && !projectile.removed && projectile.team !== actor.team && (projectile.targetId === actor.id || hexDistance(projectile.pos, actor.position) <= 3));
}

function createWindWalls(actor, direction, duration, width = 1) {
  const directionIndex = DIRECTIONS.findIndex((item) => item.q === direction.q && item.r === direction.r);
  const sideA = DIRECTIONS[(directionIndex + 2 + DIRECTIONS.length) % DIRECTIONS.length];
  const sideB = DIRECTIONS[(directionIndex - 2 + DIRECTIONS.length) % DIRECTIONS.length];
  const offsets = width >= 3 ? [{ q: 0, r: 0 }, sideA, sideB] : [{ q: 0, r: 0 }];
  return offsets
    .map((offset) => addCoords(actor.position, offset))
    .filter(cellExists)
    .map((base) => {
      const outside = addCoords(base, direction);
      return { id: nextId("wall"), team: actor.team, ownerId: actor.id, a: cloneCoord(base), b: outside, edgeKey: edgeKey(base, outside), remaining: duration, createdTick: state.battleTick, createdOrder: nextOrder(), removed: false };
    });
}

function isBlockedByWindWall(projectile, from, to) {
  const key = edgeKey(from, to);
  return state.windWalls.some((wall) => !wall.removed && wall.team !== projectile.team && wall.edgeKey === key);
}

function pickupShard(actor) {
  if (actor.heroKey !== "zoe") return;
  const shard = state.shards.find((item) => coordsEqual(item.position, actor.position));
  if (!shard) return;
  actor.temp.spellShard = shard.spell;
  state.shards = state.shards.filter((item) => item.id !== shard.id);
  addLog(`战斗回合 ${state.battleTick}：${actor.name}拾取法术碎片：闪现。`);
}

function dropShard(position) {
  state.shards.push({ id: nextId("shard"), spell: "flash", position: cloneCoord(position), createdTick: state.battleTick });
}

function spawnPeriodicShard() {
  if (state.battleTick > 0 && state.battleTick % 3 === 0) {
    dropShard(randomEmptyCell(state.cells, new Set(state.characters.filter((c) => c.isAlive).map((c) => coordKey(c.position)))));
    addLog(`战斗回合 ${state.battleTick}：地图上生成一个法术碎片。`);
  }
}

function handleReturnPortal(actor) {
  if (!actor.temp.returnPortal) return;
  if (!actor.temp.returnReady) {
    actor.temp.returnReady = true;
    return;
  }
  const back = actor.temp.returnPortal;
  actor.temp.returnPortal = null;
  actor.temp.returnReady = false;
  if (actor.isAlive && !getCharacterAt(back)) {
    actor.position = cloneCoord(back);
    addLog(`战斗回合 ${state.battleTick}：${actor.name}折返跃迁回到原位。`);
  }
}

function cleanupEntities() {
  state.projectiles.forEach((projectile) => {
    if (projectile.removed && projectile.effect === "zoeQ") startZoeQCooldown(projectile);
  });
  state.projectiles = state.projectiles.filter((projectile) => !projectile.removed);
  state.zones.forEach((zone) => {
    if (zone.removed) startZoneCooldown(zone);
  });
  state.zones = state.zones.filter((zone) => !zone.removed);
  state.windWalls = state.windWalls.filter((wall) => !wall.removed);
  state.characters.forEach((character) => {
    character.statuses = character.statuses.filter((status) => status.remaining > 0);
  });
}

function startZoeQCooldown(projectile) {
  if (!projectile || projectile.cooldownStarted) return;
  const owner = getCharacter(projectile.ownerId);
  const currentSkill = owner?.skills?.q;
  if (!owner || owner.heroKey !== "zoe" || !currentSkill) return;
  projectile.cooldownStarted = true;
  owner.temp.zoeQRecastUntil = -Infinity;
  const offset = state.isBattlefieldSettling ? 1 : 0;
  currentSkill.currentCooldown = Math.max(currentSkill.currentCooldown, currentSkill.cooldown + offset);
  addLog(`战斗回合 ${state.battleTick}：${currentSkill.name}结束，Q技能进入冷却。`);
}

function startZoneCooldown(zone) {
  if (!zone?.cooldownSkillKey || zone.cooldownStarted) return;
  const owner = getCharacter(zone.ownerId);
  const currentSkill = owner?.skills?.[zone.cooldownSkillKey];
  if (!currentSkill) return;
  zone.cooldownStarted = true;
  const offset = state.isBattlefieldSettling ? 1 : 0;
  currentSkill.currentCooldown = Math.max(currentSkill.currentCooldown, currentSkill.cooldown + offset);
  addLog(`战斗回合 ${state.battleTick}：${zone.name}消失，${currentSkill.key}技能进入冷却。`);
}

function checkGameOver() {
  if (state.gameOver || !state.started) return;
  const players = allAlive("player");
  const enemies = allAlive("enemy");
  if (!players.length || !enemies.length) {
    state.gameOver = true;
    state.currentActorId = null;
    state.selection = null;
    const didWin = !enemies.length;
    showToast(didWin ? "胜利" : "失败");
    addLog(enemies.length ? "失败：全部友军倒下。" : "胜利：全部敌人倒下。");
    showGameResultOverlay(didWin);
    renderAll();
  }
}

function showGameResultOverlay(didWin) {
  if (!els.gameResultOverlay) return;
  els.gameResultTitle.textContent = didWin ? "胜利！" : "失败";
  els.gameResultHeroes.replaceChildren();
  state.characters.filter((character) => character.team === "player").forEach((character) => {
    const item = document.createElement("div");
    item.className = "game-result-hero";
    const img = document.createElement("img");
    img.src = character.asset;
    img.alt = "";
    item.append(img, textEl("span", "", character.name));
    els.gameResultHeroes.append(item);
  });
  els.gameResultOverlay.hidden = false;
}

function hideGameResultOverlay() {
  if (!els.gameResultOverlay) return;
  els.gameResultOverlay.hidden = true;
}

function setTempUnitClass(id, className) {
  state.unitClasses[id] = className || "";
  const group = unitEls.get(id);
  if (!group) return;
  group.classList.remove("attacking", "casting");
  if (className) group.classList.add(className);
}

function showToast(message) {
  els.eventToast.textContent = message;
  els.eventToast.classList.remove("show");
  void els.eventToast.offsetWidth;
  els.eventToast.classList.add("show");
}

function addLog(entry) {
  const normalized = normalizeLogEntry(entry);
  if (state.pendingLog && typeof entry === "string") {
    state.pendingLog.note = normalized.text;
    return;
  }
  state.log.push(normalized);
  renderBattleLog();
}

function renderBattleLog() {
  els.battleLog.innerHTML = "";
  state.log.forEach((entry) => {
    els.battleLog.append(renderLogEntry(entry));
  });
  els.battleLog.scrollTop = els.battleLog.scrollHeight;
}

function normalizeLogEntry(entry) {
  if (entry && typeof entry === "object") {
    return {
      tick: entry.tick ?? state.battleTick,
      type: entry.type || "action",
      actorId: entry.actorId || null,
      actionName: entry.actionName || "",
      results: entry.results || [],
      text: entry.text || "",
    };
  }
  const raw = String(entry || "");
  const match = raw.match(/^战斗回合\s*(\d+)：(.+)$/);
  return {
    tick: match ? Number(match[1]) : state.battleTick,
    type: inferLogTypeFromText(raw),
    actorId: null,
    actionName: "",
    results: [],
    text: match ? match[2] : raw,
  };
}

function inferLogTypeFromText(text) {
  const raw = String(text || "");
  if (raw.includes("战斗回合结算")) return "time";
  if (raw.includes("移动")) return "move";
  if (raw.includes("护盾")) return "shield";
  if (raw.includes("治疗")) return "heal";
  if (raw.includes("攻击") || raw.includes("普攻")) return "attack";
  const skillTerms = ["法术碎片", "技能", "领域", "光辉", "飞星", "气泡", "陷阱", "风墙", "弹幕", "枪林弹雨", "弹雨", "一箭双雕", "终极闪光", "棱光护盾", "斩钢闪", "踏前斩", "折返跃迁", "消散", "消失", "达到最大距离"];
  if (skillTerms.some((term) => raw.includes(term))) return "skill";
  return "action";
}

function renderLogEntry(entry) {
  const item = document.createElement("li");
  item.className = `log-entry ${entry.type || "action"}`;
  const visual = document.createElement("div");
  visual.className = "log-visual";
  visual.append(logTimeNode(entry.tick));
  const actor = entry.actorId ? getCharacter(entry.actorId) : null;
  if (actor) visual.append(logAvatarNode(actor));
  visual.append(uiIconNode(logIconName(entry.type), "log-action-icon"));
  (entry.results || []).forEach((result) => visual.append(logResultNode(result)));
  const text = textEl("span", "log-text", entry.text || "事件发生。");
  item.append(visual, text);
  return item;
}

function logTimeNode(tick) {
  const node = document.createElement("span");
  node.className = "log-time";
  node.append(uiIconNode("time", "log-time-icon"));
  node.append(textEl("b", "", tick));
  return node;
}

function logAvatarNode(character) {
  const img = document.createElement("img");
  img.className = `log-avatar ${character.team === "player" ? "player" : "enemy"}`;
  img.src = character.asset;
  img.alt = "";
  return img;
}

function logResultNode(result) {
  const node = document.createElement("span");
  node.className = "log-result";
  const target = getCharacter(result.targetId);
  if (target) node.append(logAvatarNode(target));
  if (result.value === null || result.value === undefined) return node;
  const value = Number(result.value || 0);
  const number = textEl("strong", `log-number ${result.kind || "damage"} ${result.blocked ? "blocked" : ""}`, logSignedValue(value, result.kind));
  node.append(number);
  return node;
}

function logSignedValue(value, kind) {
  if (kind === "heal" || kind === "shield") return `+${value}`;
  return `-${value}`;
}

function logIconName(type) {
  if (type === "attack") return "attack";
  if (type === "skill") return "skill";
  if (type === "move") return "move";
  if (type === "time") return "time";
  if (type === "heal") return "heal";
  if (type === "shield") return "shield";
  if (type === "skip") return "skip";
  return "action";
}

function beginActionLog(actor, action) {
  state.pendingLog = {
    tick: state.battleTick,
    actorId: actor.id,
    actionName: action.name,
    type: action.logType || inferActionLogType(action.name),
    results: [],
    note: "",
  };
}

function inferActionLogType(actionName) {
  if (actionName.includes("移动")) return "move";
  if (actionName.includes("普通攻击")) return "attack";
  if (actionName.includes("跳过") || actionName.includes("原地不动")) return "skip";
  return "skill";
}

function recordDamageLog(source, target, value, options = {}) {
  if (!source || !target) return;
  const result = { targetId: target.id, value: Math.max(0, Math.round(value)), kind: "damage", blocked: Boolean(options.blocked) };
  const pending = state.pendingLog && state.pendingLog.actorId === source.id ? state.pendingLog : null;
  if (pending) {
    pending.type = pending.type === "attack" ? "attack" : "skill";
    pending.results.push(result);
    return;
  }
  const type = options.type || (isBasicAttackReason(options.reason) ? "attack" : "skill");
  addLog({
    type,
    tick: state.battleTick,
    actorId: source.id,
    actionName: options.reason || "",
    results: [result],
    text: type === "attack" ? `${source.name}攻击了${target.name}。` : `${source.name}施放${options.reason || "技能"}击中了${target.name}。`,
  });
}

function recordEffectTargetLog(source, target, reason = "技能") {
  if (!source || !target) return;
  const result = { targetId: target.id, value: null, kind: "effect" };
  const pending = state.pendingLog && state.pendingLog.actorId === source.id ? state.pendingLog : null;
  if (pending) {
    pending.type = "skill";
    pending.results.push(result);
    return;
  }
  addLog({
    type: "skill",
    tick: state.battleTick,
    actorId: source.id,
    actionName: reason,
    results: [result],
    text: `${source.name}施放${reason}击中了${target.name}。`,
  });
}

function recordShieldLog(source, target, value, reason = "技能") {
  if (!source || !target || value <= 0) return;
  const result = { targetId: target.id, value: Math.round(value), kind: "shield" };
  const pending = state.pendingLog && state.pendingLog.actorId === source.id ? state.pendingLog : null;
  if (pending) {
    pending.type = "shield";
    pending.results.push(result);
    return;
  }
  addLog({
    type: "shield",
    tick: state.battleTick,
    actorId: source.id,
    actionName: reason,
    results: [result],
    text: `${source.name}施放${reason}为${target.name}提供了护盾。`,
  });
}

function recordHealLog(source, target, value, reason = "技能") {
  if (!source || !target || value <= 0) return;
  const result = { targetId: target.id, value: Math.round(value), kind: "heal" };
  const pending = state.pendingLog && state.pendingLog.actorId === source.id ? state.pendingLog : null;
  if (pending) {
    pending.type = "heal";
    pending.results.push(result);
    return;
  }
  addLog({
    type: "heal",
    tick: state.battleTick,
    actorId: source.id,
    actionName: reason,
    results: [result],
    text: `${source.name}施放${reason}治疗了${target.name}。`,
  });
}

function flushActionLog(actor, action) {
  const pending = state.pendingLog;
  if (!pending || pending.actorId !== actor.id) return;
  state.pendingLog = null;
  addLog({
    type: pending.type,
    tick: pending.tick,
    actorId: actor.id,
    actionName: pending.actionName,
    results: pending.results,
    text: buildActionLogText(actor, action, pending),
  });
}

function buildActionLogText(actor, action, pending) {
  const targets = pending.results.map((result) => getCharacter(result.targetId)).filter(Boolean);
  const names = joinNames([...new Set(targets.map((target) => target.name))]);
  if (pending.type === "move") return `${actor.name}进行了移动。`;
  if (pending.type === "skip") return `${actor.name}跳过了行动。`;
  if (pending.type === "attack") return targets.length ? `${actor.name}攻击了${names}。` : `${actor.name}进行了攻击。`;
  if (pending.type === "shield") return targets.length ? `${actor.name}施放${action.name}为${names}提供了护盾。` : `${actor.name}施放了${action.name}。`;
  if (pending.type === "heal") return targets.length ? `${actor.name}施放${action.name}治疗了${names}。` : `${actor.name}施放了${action.name}。`;
  if (targets.length) return `${actor.name}施放${action.name}击中了${names}。`;
  return `${actor.name}施放了${action.name}。`;
}

function joinNames(names) {
  if (!names.length) return "";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join("、")}和${names[names.length - 1]}`;
}

function addFloating(coord, text, type) {
  const point = hexToPixel(coord);
  const node = svgEl("text", { class: `float-text ${type}`, x: point.x, y: point.y - 28 });
  node.textContent = text;
  effectLayer.append(node);
  setTimeout(() => node.remove(), 1000);
}

function addImpact(coord) {
  addScreenImpact(hexToPixel(coord));
}

function addScreenImpact(point) {
  const circle = svgEl("circle", { class: "impact-ring", cx: point.x, cy: point.y, r: 8 });
  effectLayer.append(circle);
  setTimeout(() => circle.remove(), 620);
}

function getCurrentActor() {
  return state.currentActorId ? getCharacter(state.currentActorId) : null;
}

function getCharacter(id) {
  return state.characters.find((character) => character.id === id);
}

function getCharacterAt(coord) {
  return state.characters.find((character) => character.isAlive && coordsEqual(character.position, coord));
}

function getEnemyAt(coord, team) {
  return state.characters.find((character) => character.isAlive && character.team !== team && coordsEqual(character.position, coord));
}

function firstAlive(team) {
  return state.characters.find((character) => character.team === team && character.isAlive);
}

function allAlive(team) {
  return state.characters.filter((character) => character.team === team && character.isAlive);
}

function oppositeTeam(team) {
  return team === "player" ? "enemy" : "player";
}

function nearestEnemy(actor) {
  return sortTargetsByDistanceClockwise(actor, allAlive(oppositeTeam(actor.team)))[0];
}

function sortTargetsByDistanceClockwise(source, targets) {
  if (!source) return [...targets];
  return [...targets].sort((a, b) => compareTargetsByDistanceClockwise(source, a, b));
}

function compareTargetsByDistanceClockwise(source, a, b) {
  const distanceDiff = hexDistance(source.position, a.position) - hexDistance(source.position, b.position);
  if (distanceDiff) return distanceDiff;
  const angleDiff = clockwiseAngleFromTop(source.position, a.position) - clockwiseAngleFromTop(source.position, b.position);
  if (Math.abs(angleDiff) > 0.0001) return angleDiff;
  return a.id.localeCompare(b.id);
}

function clockwiseAngleFromTop(origin, coord) {
  const originPoint = hexToPixel(origin);
  const point = hexToPixel(coord);
  const angle = Math.atan2(point.y - originPoint.y, point.x - originPoint.x);
  const top = -Math.PI / 2;
  return (angle - top + Math.PI * 2) % (Math.PI * 2);
}

function hasStatus(character, type) {
  return Boolean(getStatus(character, type));
}

function getStatus(character, type) {
  return character.statuses.find((status) => status.type === type && status.remaining > 0);
}

function getChannelStatus(character) {
  return getStatus(character, "channel");
}

function getLuxField(actor) {
  if (!actor) return null;
  return state.zones.find((zone) => !zone.removed && zone.effect === "luxField" && zone.ownerId === actor.id);
}

function findChannelZone(character, channel = getChannelStatus(character)) {
  if (!character || !channel) return null;
  return state.zones.find((zone) => !zone.removed && zone.channelOwnerId === character.id && (!channel.zoneId || zone.id === channel.zoneId));
}

function removeChannelZone(character) {
  if (!character) return;
  state.zones.forEach((zone) => {
    if (zone.channelOwnerId === character.id) zone.removed = true;
  });
}

function cellExists(coord) {
  return state.cellMap.has(coordKey(coord));
}

function coordKey(coord) {
  return `${coord.q},${coord.r}`;
}

function edgeKey(a, b) {
  return [coordKey(a), coordKey(b)].sort().join("|");
}

function coordText(coord) {
  return `(${coord.q}, ${coord.r})`;
}

function cloneCoord(coord) {
  return { q: coord.q, r: coord.r };
}

function coordsEqual(a, b) {
  return a.q === b.q && a.r === b.r;
}

function addCoords(a, b) {
  return { q: a.q + b.q, r: a.r + b.r };
}

function scaleDirection(direction, scale) {
  return { q: direction.q * scale, r: direction.r * scale };
}

function hexDistance(a, b) {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = -a.q - a.r - (-b.q - b.r);
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(ds)) / 2;
}

function directionToward(from, to) {
  if (!to || coordsEqual(from, to)) return null;
  return [...DIRECTIONS].sort((a, b) => hexDistance(addCoords(from, a), to) - hexDistance(addCoords(from, b), to))[0];
}

function projectileAngle(projectile) {
  if (projectile.pathStart && projectile.pathTargetPoint) {
    return angleBetweenPoints(hexToPixel(projectile.pathStart), projectile.pathTargetPoint);
  }
  if (projectile.pathStart && projectile.pathTarget) {
    return angleBetweenPoints(hexToPixel(projectile.pathStart), hexToPixel(projectile.pathTarget));
  }
  if (projectile.targetCell) return angleBetweenPoints(hexToPixel(projectile.pos), hexToPixel(projectile.targetCell));
  if (projectile.targetId) {
    const target = getCharacter(projectile.targetId);
    if (target?.isAlive) return angleBetweenPoints(hexToPixel(projectile.pos), hexToPixel(target.position));
  }
  return directionToAngle(projectile.direction);
}

function angleBetweenPoints(from, to) {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI + 90;
}

function directionToAngle(direction) {
  if (!direction) return 0;
  const origin = hexToPixel({ q: 0, r: 0 });
  const target = hexToPixel(direction);
  return angleBetweenPoints(origin, target);
}

function hexToPixel(coord) {
  return {
    x: HEX_SIZE * 1.5 * coord.q,
    y: HEX_SIZE * SQRT_3 * (coord.r + coord.q / 2),
  };
}

function hexPoints(center, radius = HEX_SIZE) {
  const points = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i);
    points.push({ x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) });
  }
  return points;
}

function sharedEdgePoints(a, b) {
  const pointsA = hexPoints(hexToPixel(a));
  const pointsB = hexPoints(hexToPixel(b));
  const shared = [];
  pointsA.forEach((pointA) => {
    const match = pointsB.find((pointB) => distance(pointA, pointB) < 0.5);
    if (match) shared.push(pointA);
  });
  if (shared.length >= 2) return shared.slice(0, 2);
  const centerA = hexToPixel(a);
  const centerB = hexToPixel(b);
  const mid = midpoint(centerA, centerB);
  const dx = centerB.x - centerA.x;
  const dy = centerB.y - centerA.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return [
    { x: mid.x + nx * HEX_SIZE * 0.48, y: mid.y + ny * HEX_SIZE * 0.48 },
    { x: mid.x - nx * HEX_SIZE * 0.48, y: mid.y - ny * HEX_SIZE * 0.48 },
  ];
}

function pointToString(point) {
  return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pickRandom(items, count) {
  const result = [];
  const pool = [...items];
  for (let i = 0; i < count; i += 1) {
    if (!pool.length) pool.push(...items);
    const index = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(index, 1)[0]);
  }
  return result;
}

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function setSvgHref(node, href) {
  node.setAttribute("href", href);
  if (node.setAttributeNS) node.setAttributeNS("http://www.w3.org/1999/xlink", "href", href);
}

function nextOrder() {
  const order = state.orderCounter;
  state.orderCounter += 1;
  return order;
}

function nextId(prefix) {
  const id = `${prefix}-${state.idCounter}`;
  state.idCounter += 1;
  return id;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

init();
