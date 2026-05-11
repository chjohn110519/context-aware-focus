"""
기존 .keras 체크포인트에서 가중치를 추출해서
tf_keras(Keras 2) 토폴로지로 TF.js 호환 포맷으로 재출력.
사용법: python reexport_tfjs.py
"""
import os, json
import numpy as np

import tensorflow as tf
import tf_keras

ROOT       = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
CKPT       = os.path.join(ROOT, "checkpoints", "best_model.keras")
OUTPUT_DIR = os.path.join(ROOT, "public", "model")
IMG_SIZE   = 224

print("1) 기존 체크포인트 로드 (Keras 3)...")
old_model = tf.keras.models.load_model(CKPT)
weights = [w.numpy() for w in old_model.weights]
print(f"   가중치 텐서 수: {len(weights)}")

print("2) tf_keras(Keras 2)로 동일 구조 재구성...")
base = tf_keras.applications.MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3), include_top=False, weights=None
)
base.trainable = True
for layer in base.layers[:-30]:
    layer.trainable = False

inputs  = tf_keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
x       = base(inputs, training=False)
x       = tf_keras.layers.GlobalAveragePooling2D()(x)
x       = tf_keras.layers.Dropout(0.3)(x)
outputs = tf_keras.layers.Dense(1, activation="sigmoid")(x)
new_model = tf_keras.Model(inputs, outputs)

print(f"   새 모델 가중치 수: {len(new_model.weights)}")
new_model.set_weights(weights)
print("   가중치 로드 완료")

print("3) TF.js LayersModel (Keras 2 포맷) 저장...")
os.makedirs(OUTPUT_DIR, exist_ok=True)

weight_specs  = []
weights_bytes = bytearray()
for var in new_model.weights:
    arr = var.numpy().astype(np.float32)
    weights_bytes.extend(arr.tobytes())
    weight_specs.append({"name": var.name, "shape": list(arr.shape), "dtype": "float32"})

shard = "group1-shard1of1.bin"
with open(os.path.join(OUTPUT_DIR, shard), "wb") as f:
    f.write(bytes(weights_bytes))

# Keras 2 포맷: model_config 래핑
model_config = json.loads(new_model.to_json())
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
with open(os.path.join(OUTPUT_DIR, "model.json"), "w") as f:
    json.dump(model_json, f, indent=2)

mb = len(weights_bytes) / 1024 / 1024
print(f"   가중치 {len(weight_specs)}개 ({mb:.1f} MB) 저장 완료")
print(f"   경로: {OUTPUT_DIR}")
print("\n✅ 완료!")
