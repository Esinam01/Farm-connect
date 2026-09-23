import { Platform } from "react-native";

const CLOUDINARY_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET;

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
};

export const uploadToCloudinary = async (localUri: string): Promise<string> => {
  if (!CLOUDINARY_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary is not configured. Check EXPO_PUBLIC_CLOUDINARY_NAME and EXPO_PUBLIC_CLOUDINARY_PRESET.",
    );
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/image/upload`;

  // data:/blob: URIs (web) have no usable filename, so generate one
  const hasRealFilename =
    !localUri.startsWith("data:") && !localUri.startsWith("blob:");
  const filename = hasRealFilename
    ? localUri.split("?")[0].split("/").pop() || `upload-${Date.now()}.jpg`
    : `upload-${Date.now()}.jpg`;

  const ext = /\.(\w+)$/.exec(filename)?.[1]?.toLowerCase() ?? "jpg";
  const mimeType = MIME_BY_EXT[ext] ?? "image/jpeg";

  const formData = new FormData();

  if (Platform.OS === "web") {
    // Web needs a real Blob/File, not {uri, name, type}
    const fileResponse = await fetch(localUri);
    const blob = await fileResponse.blob();
    formData.append("file", blob, filename);
  } else {
    // iOS/Android accept this RN-specific shape (not in the DOM FormData types)
    formData.append("file", {
      uri: localUri,
      name: filename,
      type: mimeType,
    } as any);
  }

  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.warn(
      "Cloudinary upload failed:",
      response.status,
      data?.error?.message,
    );
    throw new Error(data?.error?.message || "Cloudinary upload failed");
  }

  return data.secure_url as string;
};
