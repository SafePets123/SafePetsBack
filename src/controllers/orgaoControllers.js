const knex = require('./../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
  // cadastro de Órgão
  async create(req, res) {
    try {
      const { nome, email, password, telefone, tipo_orgao, num_identificacao_funcional, cidade_atuacao, estado } = req.body;

      if (!nome || !email || !password || !telefone || !tipo_orgao || !num_identificacao_funcional || !cidade_atuacao || !estado) {
        return res.status(400).send({ erro: 'Todos os campos (...) são obrigatórios para Órgão'});
      }

      const cleanedNumIdentificacao = num_identificacao_funcional.replace(/\D/g, '');
      if (cleanedNumIdentificacao.length === 0 || isNaN(cleanedNumIdentificacao)) {
        return res.status(400).send({ erro: 'Número de Identificação Funcional inválido. Deve conter apenas números.'});
      }
      const numIdentificacaoBigInt = BigInt(cleanedNumIdentificacao);

      // VERIFICAÇÃO DE UNICIDADE DO EMAIL
      const existenteEmail = await knex('orgao').where({ org_email: email }).first();
      if (existenteEmail) {
        return res.status(400).send({ erro: 'Email de Órgão já cadastrado'});
      }

      // VERIFICAÇÃO DE UNICIDADE DO NÚMERO DE IDENTIFICAÇÃO (CORREÇÃO)
      const existenteNumIdentificacao = await knex('orgao').where({ org_num_identificacao_funcional: numIdentificacaoBigInt }).first();
      if (existenteNumIdentificacao) {
        return res.status(400).send({ erro: 'Número de Identificação Funcional já cadastrado'});
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await knex('orgao').insert({
        org_nome: nome,
        org_email: email,
        org_senha: hashedPassword,
        org_telefone: telefone,
        org_tipo: tipo_orgao,
        org_num_identificacao_funcional: numIdentificacaoBigInt,
        org_cidade_atuacao: cidade_atuacao,
        org_estado: estado
      });

      return res.status(201).send({ nome, email, telefone, tipo_orgao, num_identificacao_funcional: cleanedNumIdentificacao, cidade_atuacao, estado });
    } catch (error) {
      console.error('Erro em create Órgão:', error);
      return res.status(400).json({ error: error.message });
    }
  },

  // listar Órgãos
  async searchOrgaosAll(req, res) {
    try {
      console.log('requisição de lista de Órgãos');
      const result = await knex('orgao').select(
        'org_cod', 
        'org_nome', 
        'org_email', 
        'org_telefone', 
        'org_tipo', 
        'org_num_identificacao_funcional', 
        'org_cidade_atuacao', 
        'org_estado'
      );
      return res.status(200).send(result);
    } catch (error) {
      console.error('Erro em searchOrgaosAll:', error);
      return res.status(400).json({ error: error.message });
    }
  },

  // login de Órgão
  async searchOrgaos(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).send({ mensagem: 'Email e senha são obrigatórios para Órgão'});
      }

      const orgao = await knex('orgao').where({ org_email: email }).first();

      if (!orgao) {
        return res.status(401).send({ mensagem: 'Falha na autenticação do Órgão - email incorreto !!!'});
      }

      const respok = await bcrypt.compare(password, orgao.org_senha);
      if (!respok) {
        return res.status(401).send({ mensagem: 'Falha na autenticação do Órgão - senha incorreta !!!'});
      }

      const token = jwt.sign({
          idOrgao: orgao.org_cod,
          nome: orgao.org_nome,
          email: orgao.org_email,
          telefone: orgao.org_telefone,
          tipo_orgao: orgao.org_tipo,
          num_identificacao_funcional: orgao.org_num_identificacao_funcional.toString(),
          cidade_atuacao: orgao.org_cidade_atuacao,
          estado: orgao.org_estado
        },
        'ndskvbjksdvnlkjsdbvljk',
        { expiresIn: '1h' }
      );

      return res.status(200).send({
        token,
        mensagem: 'Autenticação de Órgão realizada com sucesso !!!',
        orgao: {
          id: orgao.org_cod,
          nome: orgao.org_nome,
          email: orgao.org_email,
          telefone: orgao.org_telefone,
          tipo_orgao: orgao.org_tipo,
          num_identificacao_funcional: orgao.org_num_identificacao_funcional.toString(),
          cidade_atuacao: orgao.org_cidade_atuacao,
          estado: orgao.org_estado
        }
      });
    } catch (error) {
      console.error('Erro em searchOrgaos:', error);
      return res.status(400).json({ error: error.message });
    }
  },

  // buscar Órgão pelo email (para o front mostrar nome e imagem)
  async getByEmail(req, res) {
    try {
      const { email } = req.params;

      const orgao = await knex('orgao')
        .select('org_cod', 'org_nome', 'org_email')
        .where({ org_email: email })
        .first();

      if (!orgao) {
        return res.status(404).json({ error: 'Órgão não encontrado' });
      }

      return res.status(200).json({
        nome: orgao.org_nome,
        email: orgao.org_email,
        imagem: null
      });
    } catch (error) {
      console.error('Erro em getByEmail Órgão:', error);
      return res.status(400).json({ error: error.message });
    }
  },

  // Função para listar TODAS as denúncias (Autoridades)
  async listAllDenuncias(req, res) {
    try {
        const denuncias = await knex("denuncia")
            .select("*") 
            .orderBy("denun_data", "desc"); 

        return res.status(200).json(denuncias);

    } catch (error) {
        console.error("Erro ao listar todas as denúncias:", error);
        return res.status(500).json({ erro: "Erro interno do servidor ao listar denúncias." });
    }
  },
};
