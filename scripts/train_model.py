"""
이진분류 모델 학습 스크립트 (공부중 / 공부중아님)
사용법:
  python train_model.py

데이터 폴더 구조 (scripts/ 기준 상위):
  data/
    not_studying/   (label 0)
    studying/       (label 1)

출력:
  ../public/model/model.json  (TF.js 형식)
  ../public/model/group1-shard1of1.bin
"""

import os
import sys

try:
    import tensorflow as tf
    import tensorflowjs as tfjs
except ImportError:
    print("필요 패키지 설치: pip install -r requirements.txt")
    sys.exit(1)

# ─── 하이퍼파라미터 ───────────────────────────────────────────────
IMG_SIZE   = 224
BATCH_SIZE = 16
EPOCHS     = 15
DATA_DIR   = os.path.join(os.path.dirname(__file__), "..", "data")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "model")

# ─── 데이터 로드 ─────────────────────────────────────────────────
print("데이터 로드 중...")

train_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR,
    validation_split=0.2,
    subset="training",
    seed=42,
    image_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    label_mode="binary",
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR,
    validation_split=0.2,
    subset="validation",
    seed=42,
    image_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    label_mode="binary",
)

print(f"클래스: {train_ds.class_names}")  # ['not_studying', 'studying']

# 픽셀 정규화 (0~255 → 0~1)
normalize = tf.keras.layers.Rescaling(1.0 / 255)
train_ds = train_ds.map(lambda x, y: (normalize(x), y), num_parallel_calls=tf.data.AUTOTUNE)
val_ds   = val_ds.map(lambda x, y: (normalize(x), y), num_parallel_calls=tf.data.AUTOTUNE)

train_ds = train_ds.cache().shuffle(1000).prefetch(tf.data.AUTOTUNE)
val_ds   = val_ds.cache().prefetch(tf.data.AUTOTUNE)

# ─── 모델 구성 ───────────────────────────────────────────────────
base = tf.keras.applications.MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights="imagenet",
)
base.trainable = False  # ImageNet 가중치 동결

model = tf.keras.Sequential([
    base,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(1, activation="sigmoid"),
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-3),
    loss="binary_crossentropy",
    metrics=["accuracy"],
)

model.summary()

# ─── 학습 ────────────────────────────────────────────────────────
print("\n학습 시작...")
history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True),
    ],
)

val_acc = max(history.history["val_accuracy"])
print(f"\n최고 Validation Accuracy: {val_acc:.3f}")

# ─── TF.js 형식으로 저장 ─────────────────────────────────────────
os.makedirs(OUTPUT_DIR, exist_ok=True)
tfjs.converters.save_keras_model(model, OUTPUT_DIR)
print(f"\n모델 저장 완료: {OUTPUT_DIR}/")
print("  → 앱을 실행하면 /model/model.json 에서 자동 로드됩니다.")
