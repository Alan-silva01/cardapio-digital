"use server";

import { v2 as cloudinary } from "cloudinary";

// Configuração do Cloudinary
// É seguro instanciar lazily para que possa ler do ambiente em runtime na Vercel
function getCloudinary() {
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error("Variáveis de ambiente do Cloudinary ausentes.");
  }
  
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function uploadImageAction(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const cdn = getCloudinary();
    
    const file = formData.get("file") as File;
    if (!file) {
      return { error: "Nenhum arquivo encontrado." };
    }

    // Security: validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF." };
    }

    // Security: validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return { error: "Arquivo muito grande. O tamanho máximo é 5MB." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imageUrl = await new Promise<string>((resolve, reject) => {
      const uploadStream = cdn.uploader.upload_stream(
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
