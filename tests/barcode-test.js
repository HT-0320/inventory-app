"use strict";

const Jimp = require("jimp");
const { BrowserMultiFormatReader, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } = require("@zxing/library");
const path = require("path");

async function scanBarcode(imagePath) {
  console.log(`\n📷 画像を読み込み中: ${imagePath}`);

  const image = await Jimp.read(imagePath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  console.log(`   画像サイズ: ${width} x ${height}`);

  // RGBAバッファからRGB輝度データを生成
  const buffer = image.bitmap.data;
  const luminances = new Uint8ClampedArray(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = buffer[i * 4];
    const g = buffer[i * 4 + 1];
    const b = buffer[i * 4 + 2];
    luminances[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  const luminanceSource = new RGBLuminanceSource(luminances, width, height);
  const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

  const reader = new BrowserMultiFormatReader();
  try {
    const result = reader.decodeBitmap(binaryBitmap);
    console.log(`\n✅ バーコード読み取り成功！`);
    console.log(`   テキスト  : ${result.getText()}`);
    console.log(`   フォーマット: ${result.getBarcodeFormat()}`);
    return result;
  } catch (e) {
    console.log(`\n❌ バーコードを読み取れませんでした: ${e.message}`);
    return null;
  }
}

(async () => {
  const imagePath = path.join(__dirname, "../IMG_2908.jpeg");
  const result = await scanBarcode(imagePath);

  if (result) {
    console.log(`\n🎉 テスト成功: バーコード値 = ${result.getText()}`);
    process.exit(0);
  } else {
    console.log(`\n⚠️ テスト結果: バーコードが検出されませんでした`);
    process.exit(1);
  }
})();
