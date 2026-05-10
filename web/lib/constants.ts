import type { ClassMeta, ClassName, ModelId } from "./types";

export const CLASS_META: Record<ClassName, ClassMeta> = {
  glioma: {
    label: "Glioma",
    code: "G-01",
    blurb: "Tumors arising from glial cells in the brain or spine.",
  },
  meningioma: {
    label: "Meningioma",
    code: "M-02",
    blurb: "Slow-growing tumors of the meninges membrane.",
  },
  pituitary: {
    label: "Pituitary",
    code: "P-03",
    blurb: "Abnormal growths within the pituitary gland.",
  },
  notumor: {
    label: "No Tumor",
    code: "N-00",
    blurb: "Healthy scan classification baseline.",
  },
};

export const MODEL_LABELS: Record<ModelId, string> = {
  xception: "Xception",
  resnet: "ResNet50V2",
  cnn: "Custom CNN",
};
