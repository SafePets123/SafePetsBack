const knex = require('./../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
  // cadastro de ONG
  async create(req, res) {
    try {
      const { nome, email, password, cnpj, local, cmrv } = req.body;

      if (!nome || !email || !password || !cnpj || !local || !cmrv) {
        return res.status(400).send({ erro: 'Todos os campos (Nome, E-mail, Senha, CNPJ, Local, CMRV) são obrigatórios para ONG'});
      }

      const existente = await knex('ong').where({ ong_email: email }).first();
      if (existente) {
        return res.status(400).send({ erro: 'Email de ONG já cadastrado'});
      }
      
      const cleanedCnpj = cnpj.replace(/\D/g, '');
      if (cleanedCnpj.length === 0 || isNaN(cleanedCnpj)) {
        return res.status(400).send({ erro: 'CNPJ inválido. Deve conter apenas números.'});
      }
      const cnpjBigInt = BigInt(cleanedCnpj);

      const cnpjExistente = await knex('ong').where({ ong_cnpj: cnpjBigInt }).first();
      if (cnpjExistente) {
        return res.status(400).send({ erro: 'CNPJ de ONG já cadastrado'});
      }

      const cleanedCmrv = cmrv.replace(/\D/g, '');
      if (cleanedCmrv.length === 0 || isNaN(cleanedCmrv)) {
        return res.status(400).send({ erro: 'CMRV inválido. Deve conter apenas números.'});
      }
      const cmrvBigInt = BigInt(cleanedCmrv);

      const hashedPassword = await bcrypt.hash(password, 10);

      await knex('ong').insert({
        ong_nome: nome,
        ong_email: email,
        password: hashedPassword,
        ong_cnpj: cnpjBigInt,
        ong_local: local,
        ong_cmrv: cmrvBigInt
      });

      return res.status(201).send({ nome, email, cnpj: cleanedCnpj, local, cmrv: cleanedCmrv });
    } catch (error) {
      console.error('Erro em create ONG:', error);
      return res.status(400).json({ error: error.message });
    }
  },

  // listar ONGs
  async searchOngsAll(req, res) {
    try {
      console.log('requisição de lista de ONGs');
      const result = await knex('ong').select('ong_cod', 'ong_nome', 'ong_email', 'ong_cnpj', 'ong_local', 'ong_cmrv');
      return res.status(200).send(result);
    } catch (error) {
      console.error('Erro em searchOngsAll:', error);
      return res.status(400).json({ error: error.message });
    }
  },

  // login de ONG
 async searchOngs(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({ mensagem: 'Email e senha são obrigatórios' });
    }

    const ong = await knex('ong').where({ ong_email: email }).first();

    if (!ong) {
      return res.status(401).send({ mensagem: 'Falha na autenticação - email incorreto !!!' });
    }

    const senhaCorreta = await bcrypt.compare(password, ong.password);
    if (!senhaCorreta) {
      return res.status(401).send({ mensagem: 'Falha na autenticação - senha incorreta !!!' });
    }

    const token = jwt.sign(
      {
        idOng: ong.ong_cod,
        nome: ong.ong_nome,
        email: ong.ong_email,
      },
      'ndskvbjksdvnlkjsdbvljk',
      { expiresIn: '1h' }
    );

    return res.status(200).send({
      token,
      mensagem: 'Autenticação realizada com sucesso !!!',
      ong: {
        id: ong.ong_cod,
        nome: ong.ong_nome,
        email: ong.ong_email
      }
    });
  } catch (error) {
    console.error('Erro em searchOngs:', error);
    return res.status(400).json({ error: error.message });
  }
  },

  // buscar ONG pelo email (para o front mostrar nome e imagem)
  async getByEmail(req, res) {
    try {
      const { email } = req.params;

      const ong = await knex('ong')
        .select('ong_cod', 'ong_nome', 'ong_email')
        .where({ ong_email: email })
        .first();

      if (!ong) {
        return res.status(404).json({ error: 'ONG não encontrada' });
      }

      return res.status(200).json({
        nome: ong.ong_nome,
        email: ong.ong_email,
        imagem: null
      });
    } catch (error) {
      console.error('Erro em getByEmail ONG:', error);
      return res.status(400).json({ error: error.message });
    }
  }
};