"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Zod schema for product validation
const productSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100),
  descricao: z.string().optional().nullable(),
  preco: z.coerce.number().min(0, "O preço não pode ser negativo").optional(),
  estoque: z.coerce.number().min(-1, "Estoque inválido").optional(),
  imagem_url: z.string().url("URL de imagem inválida").optional().or(z.literal("")).nullable(),
  categoria_id: z.string().optional(),
  categoria_nova: z.string().optional(),
  pais_origem: z.string().optional().nullable(),
  teor_alcolico: z.coerce.number().optional().nullable(),
  volume_ml: z.coerce.number().optional().nullable(),
  serve_pessoas: z.coerce.number().optional().nullable(),
  tipo_vinho: z.string().optional().nullable(),
  ml_taca: z.coerce.number().optional().nullable(),
  subcategoria: z.string().optional().nullable(),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  grupo_id_sabor: z.string().optional().nullable(),
  nome_curto_sabor: z.string().optional().nullable(),
  is_master_sabor: z.boolean().optional(),
  var_imagem_url: z.string().optional().or(z.literal("")).nullable(),
  var_descricao: z.string().optional().nullable(),
});

export async function saveProductAction(rawData: any, isCreating: boolean, editingItem: any) {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Sua sessão expirou ou não foi enviada para o servidor. Faça login novamente." };
    }

    // Validate data using Zod
    const parsed = productSchema.safeParse(rawData);
    if (!parsed.success) {
        return { error: "Dados inválidos: " + parsed.error.issues[0].message };
    }
    const data = parsed.data;

    let finalCatId = data.categoria_id;

    if (data.categoria_nova) {
        const { data: newCat, error: catError } = await supabase
            .from("categorias")
            .insert({ nome: data.categoria_nova, ativo: true })
            .select("id")
            .single();
        if (newCat) finalCatId = newCat.id;
        else return { error: "Erro ao criar categoria: " + catError?.message };
    }

    if (isCreating) {
        // Gera um slug básico a partir do nome
        const generatedSlug = data.nome
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        // Cria produto
        const { data: newProd, error: prodError } = await supabase
            .from("produtos")
            .insert({
                nome: data.nome,
                slug: generatedSlug,
                descricao: data.descricao,
                imagem_url: data.imagem_url,
                categoria_id: finalCatId,
                pais_origem: data.pais_origem,
                teor_alcolico: data.teor_alcolico,
                volume_ml: data.volume_ml,
                serve_pessoas: data.serve_pessoas,
                tipo_vinho: data.tipo_vinho,
                ml_taca: data.ml_taca,
                subcategoria: data.subcategoria,
                rating: data.rating,
                grupo_id_sabor: data.grupo_id_sabor || null,
                nome_curto_sabor: data.nome_curto_sabor || null,
                is_master_sabor: data.is_master_sabor || false,
                disponivel: true,
                eh_combo: false
            })
            .select("id")
            .single();
            
        if (prodError) {
            console.error("Erro ao criar produto:", prodError);
            return { error: "Erro ao criar produto: " + prodError.message };
        }

        // Cria variacao "Única" para o produto novo
        const { error: varError } = await supabase
            .from("variacoes_produto")
            .insert({
                produto_id: newProd.id,
                nome: "Única",
                preco: data.preco,
                estoque: data.estoque,
                imagem_url: data.var_imagem_url || "",
                descricao: data.var_descricao || "",
                ativo: true
            });
            
        if (varError) {
            console.error("Erro ao criar variação:", varError);
            return { error: "Erro ao criar variação: " + varError.message };
        }
    } else {
        // Edita produto
        const { error: prodError } = await supabase
            .from("produtos")
            .update({
                nome: data.nome,
                descricao: data.descricao,
                imagem_url: data.imagem_url,
                categoria_id: finalCatId,
                pais_origem: data.pais_origem,
                teor_alcolico: data.teor_alcolico,
                volume_ml: data.volume_ml,
                serve_pessoas: data.serve_pessoas,
                tipo_vinho: data.tipo_vinho,
                ml_taca: data.ml_taca,
                subcategoria: data.subcategoria,
                rating: data.rating,
                grupo_id_sabor: data.grupo_id_sabor || null,
                nome_curto_sabor: data.nome_curto_sabor || null,
                is_master_sabor: data.is_master_sabor || false,
            })
            .eq("id", editingItem.produto_id);

        const { error: varError } = await supabase
            .from("variacoes_produto")
            .update({
                preco: data.preco,
                estoque: data.estoque,
                imagem_url: data.var_imagem_url,
                descricao: data.var_descricao
            })
            .eq("id", editingItem.variacao_id);

        if (prodError || varError) {
            console.error("Erro ao salvar:", prodError || varError);
            return { error: "Erro ao salvar: " + (prodError?.message || varError?.message) };
        }
    }

    return { success: true };
}

export async function deleteProductAction(produtoId: string) {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Sua sessão expirou ou não foi enviada para o servidor. Faça login novamente." };
    }

    // Attempt to delete variacoes first (since ON DELETE is NO ACTION)
    const { error: varError } = await supabase
        .from("variacoes_produto")
        .delete()
        .eq("produto_id", produtoId);

    if (varError) {
        console.error("Erro ao deletar variações:", varError);
        if (varError.code === '23503') { // Foreign key violation
            return { error: "Este produto já possui pedidos vinculados e não pode ser excluído permanentemente. Para retirar do cardápio, marque-o como Indisponível." };
        }
        return { error: "Erro ao excluir variações do produto: " + varError.message };
    }

    // Now attempt to delete the parent product
    const { error: prodError } = await supabase
        .from("produtos")
        .delete()
        .eq("id", produtoId);

    if (prodError) {
        console.error("Erro ao deletar produto:", prodError);
        if (prodError.code === '23503') { // Foreign key violation
            return { error: "Este produto já possui histórico vinculado e não pode ser excluído permanentemente. Para retirar do cardápio, marque-o como Indisponível." };
        }
        return { error: "Erro ao excluir produto: " + prodError.message };
    }

    return { success: true };
}
