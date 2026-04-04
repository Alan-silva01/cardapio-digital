export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      adicionais_produto: {
        Row: {
          ativo: boolean | null
          estoque: number | null
          estoque_minimo: number | null
          id: string
          nome: string
          preco: number
          produto_id: string
          qtd_maxima: number | null
        }
        Insert: {
          ativo?: boolean | null
          estoque?: number | null
          estoque_minimo?: number | null
          id?: string
          nome: string
          preco: number
          produto_id: string
          qtd_maxima?: number | null
        }
        Update: {
          ativo?: boolean | null
          estoque?: number | null
          estoque_minimo?: number | null
          id?: string
          nome?: string
          preco?: number
          produto_id?: string
          qtd_maxima?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "adicionais_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_alertas: {
        Row: {
          audio_url: string
          created_at: string | null
          id: string
          mesa_numero: number
          tipo: string
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          id?: string
          mesa_numero: number
          tipo: string
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          id?: string
          mesa_numero?: number
          tipo?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number | null
          slug: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number | null
          slug: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          slug?: string
        }
        Relationships: []
      }
      comandas: {
        Row: {
          aberta_em: string | null
          aberta_por: string | null
          couvert_ativo: boolean | null
          fechada_em: string | null
          id: string
          mesa_id: string
          qtd_pessoas: number | null
          status: string | null
          subtotal: number | null
          total: number | null
          valor_couvert: number | null
        }
        Insert: {
          aberta_em?: string | null
          aberta_por?: string | null
          couvert_ativo?: boolean | null
          fechada_em?: string | null
          id?: string
          mesa_id: string
          qtd_pessoas?: number | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          valor_couvert?: number | null
        }
        Update: {
          aberta_em?: string | null
          aberta_por?: string | null
          couvert_ativo?: boolean | null
          fechada_em?: string | null
          id?: string
          mesa_id?: string
          qtd_pessoas?: number | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          valor_couvert?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comandas_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          atualizado_em: string | null
          cantor_ativo: boolean | null
          cantor_fim: string | null
          cantor_inicio: string | null
          cantor_nome: string | null
          couvert_ativo: boolean | null
          id: string
          mensagem_fechamento: string | null
          metodos_pagamento: Json | null
          modo_funcionamento: string | null
          nome_estabelecimento: string | null
          programacao_semanal: Json | null
          promocao_ativa: boolean | null
          promocao_fim: string | null
          promocao_imagem_url: string | null
          promocao_inicio: string | null
          promocao_preco: number | null
          promocao_produto_id: string | null
          promocao_rodape: string | null
          promocao_titulo: string | null
          promocoes: Json | null
          taxa_servico_ativa: boolean | null
          taxa_servico_percentual: number | null
          valor_couvert: number | null
        }
        Insert: {
          atualizado_em?: string | null
          cantor_ativo?: boolean | null
          cantor_fim?: string | null
          cantor_inicio?: string | null
          cantor_nome?: string | null
          couvert_ativo?: boolean | null
          id?: string
          mensagem_fechamento?: string | null
          metodos_pagamento?: Json | null
          modo_funcionamento?: string | null
          nome_estabelecimento?: string | null
          programacao_semanal?: Json | null
          promocao_ativa?: boolean | null
          promocao_fim?: string | null
          promocao_imagem_url?: string | null
          promocao_inicio?: string | null
          promocao_preco?: number | null
          promocao_produto_id?: string | null
          promocao_rodape?: string | null
          promocao_titulo?: string | null
          promocoes?: Json | null
          taxa_servico_ativa?: boolean | null
          taxa_servico_percentual?: number | null
          valor_couvert?: number | null
        }
        Update: {
          atualizado_em?: string | null
          cantor_ativo?: boolean | null
          cantor_fim?: string | null
          cantor_inicio?: string | null
          cantor_nome?: string | null
          couvert_ativo?: boolean | null
          id?: string
          mensagem_fechamento?: string | null
          metodos_pagamento?: Json | null
          modo_funcionamento?: string | null
          nome_estabelecimento?: string | null
          programacao_semanal?: Json | null
          promocao_ativa?: boolean | null
          promocao_fim?: string | null
          promocao_imagem_url?: string | null
          promocao_inicio?: string | null
          promocao_preco?: number | null
          promocao_produto_id?: string | null
          promocao_rodape?: string | null
          promocao_titulo?: string | null
          promocoes?: Json | null
          taxa_servico_ativa?: boolean | null
          taxa_servico_percentual?: number | null
          valor_couvert?: number | null
        }
        Relationships: []
      }
      curtidas: {
        Row: {
          criado_em: string | null
          id: string
          pessoa_id: string
          produto_id: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          pessoa_id: string
          produto_id: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          pessoa_id?: string
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curtidas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          ativo: boolean | null
          auth_id: string | null
          cargo: string | null
          criado_em: string | null
          criado_por: string | null
          email: string
          foto_url: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          auth_id?: string | null
          cargo?: string | null
          criado_em?: string | null
          criado_por?: string | null
          email: string
          foto_url?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean | null
          auth_id?: string | null
          cargo?: string | null
          criado_em?: string | null
          criado_por?: string | null
          email?: string
          foto_url?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios_funcionamento: {
        Row: {
          aberto: boolean | null
          atualizado_em: string | null
          dia_semana: number
          hora_abertura: string | null
          hora_fechamento: string | null
          id: string
        }
        Insert: {
          aberto?: boolean | null
          atualizado_em?: string | null
          dia_semana: number
          hora_abertura?: string | null
          hora_fechamento?: string | null
          id?: string
        }
        Update: {
          aberto?: boolean | null
          atualizado_em?: string | null
          dia_semana?: number
          hora_abertura?: string | null
          hora_fechamento?: string | null
          id?: string
        }
        Relationships: []
      }
      itens_pedido: {
        Row: {
          adicionais: Json | null
          id: string
          nome_produto: string | null
          nome_variacao: string | null
          observacao: string | null
          observacoes: string | null
          pedido_id: string
          preco_total: number | null
          preco_unitario: number | null
          produto_id: string | null
          quantidade: number | null
          servido: boolean | null
          variacao_id: string | null
        }
        Insert: {
          adicionais?: Json | null
          id?: string
          nome_produto?: string | null
          nome_variacao?: string | null
          observacao?: string | null
          observacoes?: string | null
          pedido_id: string
          preco_total?: number | null
          preco_unitario?: number | null
          produto_id?: string | null
          quantidade?: number | null
          servido?: boolean | null
          variacao_id?: string | null
        }
        Update: {
          adicionais?: Json | null
          id?: string
          nome_produto?: string | null
          nome_variacao?: string | null
          observacao?: string | null
          observacoes?: string | null
          pedido_id?: string
          preco_total?: number | null
          preco_unitario?: number | null
          produto_id?: string | null
          quantidade?: number | null
          servido?: boolean | null
          variacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "variacoes_produto"
            referencedColumns: ["id"]
          },
        ]
      }
      mesa_layout: {
        Row: {
          criado_em: string | null
          grupo_id: string | null
          id: string
          numero_mesa: number
          pos_x: number
          pos_y: number
        }
        Insert: {
          criado_em?: string | null
          grupo_id?: string | null
          id?: string
          numero_mesa: number
          pos_x?: number
          pos_y?: number
        }
        Update: {
          criado_em?: string | null
          grupo_id?: string | null
          id?: string
          numero_mesa?: number
          pos_x?: number
          pos_y?: number
        }
        Relationships: []
      }
      mesas: {
        Row: {
          altura: number | null
          capacidade: number | null
          chamando_garcom: boolean | null
          formato: string | null
          id: string
          largura: number | null
          numero: number
          pos_x: number | null
          pos_y: number | null
          qr_code_url: string | null
          rotacao: number | null
          solicitando_conta: boolean | null
          status: string | null
          token: string
        }
        Insert: {
          altura?: number | null
          capacidade?: number | null
          chamando_garcom?: boolean | null
          formato?: string | null
          id: string
          largura?: number | null
          numero: number
          pos_x?: number | null
          pos_y?: number | null
          qr_code_url?: string | null
          rotacao?: number | null
          solicitando_conta?: boolean | null
          status?: string | null
          token?: string
        }
        Update: {
          altura?: number | null
          capacidade?: number | null
          chamando_garcom?: boolean | null
          formato?: string | null
          id?: string
          largura?: number | null
          numero?: number
          pos_x?: number | null
          pos_y?: number | null
          qr_code_url?: string | null
          rotacao?: number | null
          solicitando_conta?: boolean | null
          status?: string | null
          token?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          comanda_id: string
          criado_em: string | null
          criado_por: string | null
          id: string
          metodo: string | null
          pessoa_id: string | null
          tipo: string | null
          valor: number
        }
        Insert: {
          comanda_id: string
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          metodo?: string | null
          pessoa_id?: string | null
          tipo?: string | null
          valor: number
        }
        Update: {
          comanda_id?: string
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          metodo?: string | null
          pessoa_id?: string | null
          tipo?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          atualizado_em: string | null
          comanda_id: string
          criado_em: string | null
          forma_pagamento: Json | null
          id: string
          nome_pessoa: string | null
          numero_mesa: number | null
          numero_pedido: number | null
          observacoes: string | null
          order_id: string | null
          order_number: string | null
          pessoa_id: string | null
          status: string | null
          total: number | null
        }
        Insert: {
          atualizado_em?: string | null
          comanda_id: string
          criado_em?: string | null
          forma_pagamento?: Json | null
          id?: string
          nome_pessoa?: string | null
          numero_mesa?: number | null
          numero_pedido?: number | null
          observacoes?: string | null
          order_id?: string | null
          order_number?: string | null
          pessoa_id?: string | null
          status?: string | null
          total?: number | null
        }
        Update: {
          atualizado_em?: string | null
          comanda_id?: string
          criado_em?: string | null
          forma_pagamento?: Json | null
          id?: string
          nome_pessoa?: string | null
          numero_mesa?: number | null
          numero_pedido?: number | null
          observacoes?: string | null
          order_id?: string | null
          order_number?: string | null
          pessoa_id?: string | null
          status?: string | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria_id: string | null
          criado_em: string | null
          curtidas: number | null
          descricao: string | null
          disponivel: boolean | null
          eh_combo: boolean | null
          grupo_id_sabor: string | null
          id: string
          imagem_url: string | null
          is_master_sabor: boolean | null
          ml_taca: number | null
          nome: string
          nome_curto_sabor: string | null
          ordem: number | null
          pais_origem: string | null
          rating: number | null
          serve_pessoas: number | null
          slug: string
          subcategoria: string | null
          tempo_preparo_min: number | null
          teor_alcolico: number | null
          tipo_vinho: string | null
          visivel_app: boolean | null
          volume_ml: number | null
          whiskey_base_id: string | null
        }
        Insert: {
          categoria_id?: string | null
          criado_em?: string | null
          curtidas?: number | null
          descricao?: string | null
          disponivel?: boolean | null
          eh_combo?: boolean | null
          grupo_id_sabor?: string | null
          id?: string
          imagem_url?: string | null
          is_master_sabor?: boolean | null
          ml_taca?: number | null
          nome: string
          nome_curto_sabor?: string | null
          ordem?: number | null
          pais_origem?: string | null
          rating?: number | null
          serve_pessoas?: number | null
          slug: string
          subcategoria?: string | null
          tempo_preparo_min?: number | null
          teor_alcolico?: number | null
          tipo_vinho?: string | null
          visivel_app?: boolean | null
          volume_ml?: number | null
          whiskey_base_id?: string | null
        }
        Update: {
          categoria_id?: string | null
          criado_em?: string | null
          curtidas?: number | null
          descricao?: string | null
          disponivel?: boolean | null
          eh_combo?: boolean | null
          grupo_id_sabor?: string | null
          id?: string
          imagem_url?: string | null
          is_master_sabor?: boolean | null
          ml_taca?: number | null
          nome?: string
          nome_curto_sabor?: string | null
          ordem?: number | null
          pais_origem?: string | null
          rating?: number | null
          serve_pessoas?: number | null
          slug?: string
          subcategoria?: string | null
          tempo_preparo_min?: number | null
          teor_alcolico?: number | null
          tipo_vinho?: string | null
          visivel_app?: boolean | null
          volume_ml?: number | null
          whiskey_base_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_whiskey_base_id_fkey"
            columns: ["whiskey_base_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      seq_order_number: {
        Row: {
          current_value: number
          id: number
          last_business_date: string
        }
        Insert: {
          current_value?: number
          id?: number
          last_business_date?: string
        }
        Update: {
          current_value?: number
          id?: number
          last_business_date?: string
        }
        Relationships: []
      }
      tipos_vinho: {
        Row: {
          criado_em: string | null
          imagem_taca_url: string
          tipo: string
        }
        Insert: {
          criado_em?: string | null
          imagem_taca_url: string
          tipo: string
        }
        Update: {
          criado_em?: string | null
          imagem_taca_url?: string
          tipo?: string
        }
        Relationships: []
      }
      variacoes_produto: {
        Row: {
          ativo: boolean | null
          descricao: string | null
          estoque: number | null
          estoque_minimo: number | null
          id: string
          imagem_url: string | null
          nome: string
          ordem: number | null
          preco: number
          produto_id: string
          serve_pessoas: number | null
        }
        Insert: {
          ativo?: boolean | null
          descricao?: string | null
          estoque?: number | null
          estoque_minimo?: number | null
          id?: string
          imagem_url?: string | null
          nome: string
          ordem?: number | null
          preco: number
          produto_id: string
          serve_pessoas?: number | null
        }
        Update: {
          ativo?: boolean | null
          descricao?: string | null
          estoque?: number | null
          estoque_minimo?: number | null
          id?: string
          imagem_url?: string | null
          nome?: string
          ordem?: number | null
          preco?: number
          produto_id?: string
          serve_pessoas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "variacoes_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adicionar_item_comanda_admin: {
        Args: {
          p_comanda_id: string
          p_nome_pessoa: string
          p_observacao: string
          p_produto_id: string
          p_quantidade: number
          p_variacao_id: string
        }
        Returns: Json
      }
      chamar_servico: {
        Args: { p_mesa_token: string; p_tipo: string }
        Returns: Json
      }
      criar_pedido_seguro: {
        Args: { p_itens: Json; p_mesa_token: string; p_nome_pessoa: string }
        Returns: Json
      }
      generate_order_id: { Args: never; Returns: string }
      get_staff_role: { Args: never; Returns: string }
      increment_likes: { Args: { product_id: string }; Returns: undefined }
      is_establishment_open: { Args: never; Returns: Json }
      nanoid: { Args: { size?: number }; Returns: string }
      obter_cargo_funcionario: { Args: never; Returns: string }
      registrar_pessoa_mesa: {
        Args: { p_mesa_token: string; p_nome_pessoa: string }
        Returns: Json
      }
      remover_item_comanda: { Args: { p_item_id: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
