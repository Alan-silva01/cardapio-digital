"use server";

import { v2 as cloudinary } from "cloudinary";

// Configuração do Cloudinary
// As variáveis devem estar no .env.local
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImageAction(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { error: "Nenhum arquivo encontrado." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imageUrl = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "estoque_produtos" },
        (error, result) => {
          if (error || !result) {
            console.error("Cloudinary Error:", error);
            reject(error || new Error("Erro desconhecido no upload."));
          } else {
            resolve(result.secure_url);
          }
        }
      );
      uploadStream.end(buffer);
    });

    return { url: imageUrl };
  } catch (error: any) {
    console.error("Erro no uploadImageAction:", error);
    return { error: error.message || "Falha no upload da imagem." };
  }
}
