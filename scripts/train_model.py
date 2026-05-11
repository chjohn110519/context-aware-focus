"""
이진분류 모델 학습 + TF.js 변환 (Keras 2 포맷, TF.js 호환)
사용법: python train_model.py
"""
import os, sys, json, shutil, tempfile
import numpy as np

try:
    import tensorflow as tf
    import tf_keras
except ImportError as e:
    print(f"pip install tensorflow==2.15.0 tf_keras  ({e})")
    sys.exit(1)

# ─── 설정 ──────────────────────────────────────────────────────────
IMG_SIZE   = 224
BATCH_SIZE = 4
EPOCHS     = 50
ROOT       = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
DATA_DIR   = os.path.join(ROOT, "data")
# 체크포인트는 ASCII 경로에 영구 보존
CKPT_DIR   = os.path.join(os.path.expanduser("~"), "AppData", "Local", "ml_ckpts")
OUTPUT_DIR = os.path.join(ROOT, "public", "model")
os.makedirs(CKPT_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── 데이터 확인 ───────────────────────────────────────────────────
for cls in ["studying", "not_studying"]:
    imgs = [f for f in os.listdir(os.path.join(DATA_DIR, cls))
            if f.lower().endswith((".png", ".jpg", ".jpeg"))]
    print(f"  {cls}: {len(imgs)}장")

# TF file I/O가 비ASCII 경로/파일명을 처리 못하므로 임시 디렉터리에 ASCII 이름으로 복사
_tmp_root = tempfile.mkdtemp(prefix="ml_train_")
DATA_DIR_TF = os.path.join(_tmp_root, "data")
for cls in ["studying", "not_studying"]:
    dst_cls = os.path.join(DATA_DIR_TF, cls)
    os.makedirs(dst_cls, exist_ok=True)
    idx = 0
    for fname in os.listdir(os.path.join(DATA_DIR, cls)):
        if fname.lower().endswith((".png", ".jpg", ".jpeg")):
            ext = os.path.splitext(fname)[1].lower()
            shutil.copy2(os.path.join(DATA_DIR, cls, fname),
                         os.path.join(dst_cls, f"img_{idx:04d}{ext}"))
            idx += 1
print(f"  (임시 경로: {DATA_DIR_TF})")

# ─── Data Augmentation ─────────────────────────────────────────────
augmentation = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal"),
    tf.keras.layers.RandomRotation(0.1),
    tf.keras.layers.RandomZoom(0.15),
    tf.keras.layers.RandomBrightness(0.2),
    tf.keras.layers.RandomContrast(0.2),
], name="augmentation")

# ─── 데이터셋 로드 ─────────────────────────────────────────────────
print("\n데이터 로드 중...")
full_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR_TF,
    image_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    label_mode="binary",
    shuffle=True, seed=42,
)
class_names = full_ds.class_names
print(f"클래스: {class_names}")

normalize = tf.keras.layers.Rescaling(1.0 / 255)
train_ds = full_ds.map(
    lambda x, y: (augmentation(normalize(x), training=True), y),
    num_parallel_calls=tf.data.AUTOTUNE,
).cache().repeat().prefetch(tf.data.AUTOTUNE)
val_ds = full_ds.map(
    lambda x, y: (normalize(x), y),
    num_parallel_calls=tf.data.AUTOTUNE,
).prefetch(tf.data.AUTOTUNE)

total = sum(
    len([f for f in os.listdir(os.path.join(DATA_DIR_TF, c))
         if f.lower().endswith((".png", ".jpg", ".jpeg"))])
    for c in class_names
)
steps_per_epoch = max(1, total // BATCH_SIZE)

# ─── 모델 구성 (tf.keras로 학습) ──────────────────────────────────
base = tf.keras.applications.MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3), include_top=False, weights="imagenet"
)
base.trainable = False

inputs  = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
x       = base(inputs, training=False)
x       = tf.keras.layers.GlobalAveragePooling2D()(x)
x       = tf.keras.layers.Dropout(0.3)(x)
outputs = tf.keras.layers.Dense(1, activation="sigmoid")(x)
model   = tf.keras.Model(inputs, outputs)
model.compile(optimizer=tf.keras.optimizers.Adam(1e-3),
              loss="binary_crossentropy", metrics=["accuracy"])

# ─── 1단계: top layer 학습 ─────────────────────────────────────────
ckpt_path = os.path.join(CKPT_DIR, "best_model.keras")
print("\n[1단계] Top layer 학습...")
model.fit(
    train_ds, steps_per_epoch=steps_per_epoch, epochs=EPOCHS,
    validation_data=val_ds,
    callbacks=[
        tf.keras.callbacks.ModelCheckpoint(
            ckpt_path, monitor="loss", save_best_only=True, verbose=0),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="loss", factor=0.5, patience=5, verbose=0),
    ],
    verbose=1,
)

# ─── 2단계: fine-tuning ────────────────────────────────────────────
print("\n[2단계] Fine-tuning...")
base.trainable = True
for layer in base.layers[:-30]:
    layer.trainable = False
model.compile(optimizer=tf.keras.optimizers.Adam(1e-5),
              loss="binary_crossentropy", metrics=["accuracy"])
model.fit(
    train_ds, steps_per_epoch=steps_per_epoch, epochs=20,
    validation_data=val_ds,
    callbacks=[
        tf.keras.callbacks.ModelCheckpoint(
            ckpt_path, monitor="loss", save_best_only=True, verbose=0),
        tf.keras.callbacks.EarlyStopping(
            monitor="loss", patience=10, restore_best_weights=True),
    ],
    verbose=1,
)

# ─── 최고 체크포인트 로드 ─────────────────────────────────────────
print(f"\n최고 체크포인트 로드: {ckpt_path}")
best = tf.keras.models.load_model(ckpt_path)
weights = [w.numpy() for w in best.weights]
print(f"  가중치 텐서: {len(weights)}개")

# ─── tf_keras(Keras 2)로 재구성 → TF.js 호환 포맷 출력 ───────────
print("\ntf_keras(Keras 2)로 재구성 중...")
base_v2 = tf_keras.applications.MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3), include_top=False, weights=None
)
base_v2.trainable = True
for layer in base_v2.layers[:-30]:
    layer.trainable = False

inp_v2  = tf_keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
x_v2    = base_v2(inp_v2, training=False)
x_v2    = tf_keras.layers.GlobalAveragePooling2D()(x_v2)
x_v2    = tf_keras.layers.Dropout(0.3)(x_v2)
out_v2  = tf_keras.layers.Dense(1, activation="sigmoid")(x_v2)
model_v2 = tf_keras.Model(inp_v2, out_v2)
model_v2.set_weights(weights)
print(f"  tf_keras 모델 가중치: {len(model_v2.weights)}개")

print("\nTF.js 변환 중...")
TF_OUTPUT_TMP = os.path.join(_tmp_root, "tfjs_output")
os.makedirs(TF_OUTPUT_TMP, exist_ok=True)

weight_specs  = []
weights_bytes = bytearray()
for var in model_v2.weights:
    arr = var.numpy().astype(np.float32)
    weights_bytes.extend(arr.tobytes())
    weight_specs.append({"name": var.name.split(":")[0], "shape": list(arr.shape), "dtype": "float32"})

shard = "group1-shard1of1.bin"
with open(os.path.join(TF_OUTPUT_TMP, shard), "wb") as f:
    f.write(bytes(weights_bytes))

# Keras 2 포맷: model_config 래핑 → TF.js loadLayersModel 호환
model_config = json.loads(model_v2.to_json())
model_json = {
    "modelTopology": {
        "keras_version": "2.15.0",
        "backend": "tensorflow",
        "model_config": model_config,
    },
    "weightsManifest": [{"paths": [shard], "weights": weight_specs}],
    "format": "layers-model",
    "generatedBy": tf.__version__,
    "convertedBy": "custom_converter_v2_keras2",
}
with open(os.path.join(TF_OUTPUT_TMP, "model.json"), "w") as f:
    json.dump(model_json, f, indent=2)

# 최종 경로로 복사
os.makedirs(OUTPUT_DIR, exist_ok=True)
for fname in os.listdir(TF_OUTPUT_TMP):
    shutil.copy2(os.path.join(TF_OUTPUT_TMP, fname), os.path.join(OUTPUT_DIR, fname))

mb = len(weights_bytes) / 1024 / 1024
print(f"  가중치 {len(weight_specs)}개 ({mb:.1f} MB)")
print(f"  체크포인트 보존: {ckpt_path}")
print(f"  TF.js 출력: {OUTPUT_DIR}")

shutil.rmtree(_tmp_root, ignore_errors=True)
print("\n✅ 완료! npm run dev 후 C2/C3 세션에서 자동 로드됩니다.")
