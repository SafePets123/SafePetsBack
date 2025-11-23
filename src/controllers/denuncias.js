const knex = require("./../database");
const bcrypt = require("bcrypt");

module.exports = {
  // 🔹 Criar uma nova denúncia
  async createDenuncia(req, res) {
    try {
      // O ID do usuário vem do middleware de autenticação
      const idUser = req.userId; 

      // Se o middleware falhar, idUser será undefined/null
      if (!idUser) {
        return res.status(401).json({
          erro: "Usuário não autenticado. Token inválido ou ausente.",
        });
      }

      const {
        denun_local,
        denun_hora,
        denun_data,
        dep_cod,
        denun_telefone,
        denun_endereco,
        denun_tipo_animal,
        denun_descricao,
        denun_midia_url,
      } = req.body;

      // 🔸 Validação de campos obrigatórios
      if (
        !denun_local ||
        !denun_hora ||
        !denun_data ||
        !dep_cod ||
        !denun_endereco ||
        !denun_tipo_animal ||
        !denun_descricao
      ) {
        return res.status(400).json({
          erro: "Todos os campos obrigatórios da denúncia devem ser preenchidos.",
        });
      }

      // 🔸 Inserção no banco
      const result = await knex("denuncia")
        .insert({
          den_cod: idUser, // FK para o denunciante
          denun_local,
          denun_hora,
          denun_data,
          dep_cod,
          denun_telefone: denun_telefone || null,
          denun_endereco,
          denun_tipo_animal,
          denun_descricao,
          denun_midia_url: denun_midia_url || null,
          denun_status: "Em Análise",
        })
        .returning("denun_cod");

      // Tratamento para garantir que o ID da denúncia seja extraído corretamente
      let denun_cod_inserido;
      if (Array.isArray(result) && result.length > 0) {
        denun_cod_inserido = result[0].denun_cod;
      } else if (typeof result === 'number') {
        denun_cod_inserido = result;
      } else {
        denun_cod_inserido = null;
      }

      if (!denun_cod_inserido) {
        return res.status(500).json({
          error: "Erro ao obter o código da denúncia após a inserção.",
        });
      }

      return res.status(201).json({
        message: "Denúncia registrada com sucesso!",
        denun_cod: denun_cod_inserido,
      });
    } catch (error) {
      console.error("Erro ao registrar denúncia:", error);
      return res.status(500).json({
        error: "Erro interno do servidor ao registrar denúncia.",
        detalhes: error.message,
      });
    }
  },

  // 🔹 Listar denúncias do usuário logado
  async listDenuncias(req, res) {
    try {
      const idUser = req.userId;

      const denuncias = await knex("denuncia")
        .join("departamento", "denuncia.dep_cod", "=", "departamento.dep_cod")
        .select(
          "denuncia.denun_cod",
          "denuncia.denun_local",
          "denuncia.denun_hora",
          "denuncia.denun_data",
          "departamento.dep_nome",
          "denuncia.denun_status"
        )
        .where("denuncia.den_cod", idUser)
        .orderBy("denuncia.denun_data", "desc");

      return res.status(200).json(denuncias);
    } catch (error) {
      console.error("Erro ao listar denúncias:", error);
      return res.status(500).json({
        error: "Erro interno do servidor ao buscar denúncias.",
        detalhes: error.message,
      });
    }
  },

  // 🔹 Atualizar perfil do denunciante (FUNÇÃO FALTANTE NO ARQUIVO ORIGINAL)
  async updateProfile(req, res) {
    try {
      const idUser = req.userId;
      const { nome, email, password } = req.body;

      const updateData = {};

      if (nome) updateData.den_nome = nome;
      if (email) updateData.den_email = email;
      if (password) updateData.den_senha = await bcrypt.hash(password, 10);

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "Nenhum dado para atualizar." });
      }

      // 🔸 Atualiza o usuário
      await knex("denunciante").where("den_cod", idUser).update(updateData);

      // 🔸 Retorna o novo perfil
      const updatedUser = await knex("denunciante")
        .select("den_nome", "den_email")
        .where("den_cod", idUser)
        .first();

      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      return res.status(500).json({
        error: "Erro interno do servidor ao atualizar perfil.",
        detalhes: error.message,
      });
    }
  },
};
