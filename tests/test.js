"use strict";

/* ============================================================
   テスト対象のコード（index.html より抜粋）
   ============================================================ */

let data = { items: [], settings: {}, updatedAt: 0 };

function validateData(d) {
  return d !== null &&
    typeof d === "object" &&
    Array.isArray(d.items) &&
    typeof d.settings === "object";
}

function getItem(jan) {
  return data.items.find(item => item.jan === jan) || null;
}

function applyDelta(jan, name, delta) {
  const item = getItem(jan);
  if (item) {
    item.qty += delta;
    if (name && name !== jan) item.name = name;
  } else {
    data.items.push({ jan, name: name || jan, qty: delta });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let buffer = {};
let history = [];

function undo() {
  const last = history.pop();
  if (!last) return;
  buffer[last]--;
  if (buffer[last] === 0) delete buffer[last];
}

function resetBuffer() {
  buffer  = {};
  history = [];
}

/* ============================================================
   テストケース
   ============================================================ */

describe("validateData", () => {
  test("正常なデータを受け入れる", () => {
    expect(validateData({ items: [], settings: {} })).toBe(true);
  });
  test("items が配列でない場合は失敗", () => {
    expect(validateData({ items: "not-array", settings: {} })).toBe(false);
  });
  test("settings がオブジェクトでない場合は失敗", () => {
    expect(validateData({ items: [], settings: "bad" })).toBe(false);
  });
  test("null を拒否する", () => {
    expect(validateData(null)).toBe(false);
  });
  test("空オブジェクトを拒否する", () => {
    expect(validateData({})).toBe(false);
  });
});

describe("getItem", () => {
  beforeEach(() => {
    data = { items: [{ jan: "4901234567890", name: "テスト商品", qty: 5 }], settings: {}, updatedAt: 0 };
  });
  test("存在する JAN コードで商品を取得できる", () => {
    expect(getItem("4901234567890")).toEqual({ jan: "4901234567890", name: "テスト商品", qty: 5 });
  });
  test("存在しない JAN コードは null を返す", () => {
    expect(getItem("0000000000000")).toBeNull();
  });
});

describe("applyDelta", () => {
  beforeEach(() => {
    data = { items: [], settings: {}, updatedAt: 0 };
  });
  test("新規アイテムを追加できる", () => {
    applyDelta("1111111111111", "新商品A", 3);
    expect(getItem("1111111111111")).toEqual({ jan: "1111111111111", name: "新商品A", qty: 3 });
  });
  test("既存アイテムの数量を加算できる", () => {
    applyDelta("1111111111111", "新商品A", 3);
    applyDelta("1111111111111", "新商品A", 2);
    expect(getItem("1111111111111").qty).toBe(5);
  });
  test("既存アイテムの数量を減算できる", () => {
    applyDelta("1111111111111", "新商品A", 5);
    applyDelta("1111111111111", "新商品A", -3);
    expect(getItem("1111111111111").qty).toBe(2);
  });
  test("name が null の場合は JAN コードを名前として使用する", () => {
    applyDelta("2222222222222", null, 1);
    expect(getItem("2222222222222").name).toBe("2222222222222");
  });
});

describe("escapeHtml", () => {
  test("& をエスケープする", () => {
    expect(escapeHtml("A&B")).toBe("A&amp;B");
  });
  test("< をエスケープする", () => {
    expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
  });
  test("> をエスケープする", () => {
    expect(escapeHtml("a>b")).toBe("a&gt;b");
  });
  test('" をエスケープする', () => {
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
  });
  test("エスケープ不要な文字はそのまま", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});

describe("undo", () => {
  beforeEach(() => {
    buffer  = { "9999999999991": 2, "9999999999992": 1 };
    history = ["9999999999991", "9999999999992", "9999999999991"];
  });
  test("直近のスキャンを取り消す（数量 -1）", () => {
    undo();
    expect(buffer["9999999999991"]).toBe(1);
  });
  test("数量が 0 になったアイテムはバッファから削除される", () => {
    undo();
    undo();
    expect(buffer["9999999999992"]).toBeUndefined();
  });
  test("残りのアイテムも取り消せる", () => {
    undo(); undo(); undo();
    expect(buffer["9999999999991"]).toBeUndefined();
  });
});

describe("resetBuffer", () => {
  test("バッファがクリアされる", () => {
    buffer = { "1234567890123": 3 };
    history = ["1234567890123"];
    resetBuffer();
    expect(Object.keys(buffer).length).toBe(0);
  });
  test("履歴がクリアされる", () => {
    buffer = { "1234567890123": 3 };
    history = ["1234567890123"];
    resetBuffer();
    expect(history.length).toBe(0);
  });
});
