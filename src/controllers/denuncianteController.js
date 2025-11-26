const knex = require("./../database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET_KEY = 'ndskvbjksdvnlkjsdbvljk'; 

module.exports = {
    // Função de Cadastro
    async create(req, res) {
        try {
            const { nome, email, password } = req.body;

            if (!nome || !email || !password) {
                return res.status(400).json({ erro: "Preencha todos os campos obrigatórios." });
            }

            // 1. Hash da senha
            const hashedPassword = await bcrypt.hash(password, 10);

            // 2. Inserção no banco e obtenção do ID
            const [den_cod_result] = await knex("denunciante").insert({
                den_nome: nome,
                den_email: email,
                den_senha: hashedPassword,
            }).returning('den_cod');

            // Garante que den_cod seja o valor numérico
            let den_cod;
            if (typeof den_cod_result === 'object' && den_cod_result !== null && den_cod_result.den_cod) {
                den_cod = den_cod_result.den_cod;
            } else {
                den_cod = den_cod_result;
            }

            // 3. Geração do Token JWT
            const token = jwt.sign(
                {
                    idUser: den_cod,
                    nome: nome,
                    email: email,
                },
                SECRET_KEY,
                { expiresIn: '1h' }
            );

            // 4. Retorno com o token e os dados do usuário
            return res.status(201).json({
                mensagem: "Cadastro realizado com sucesso!",
                token: token,
                denunciante: {
                    id: den_cod,
                    nome: nome,
                    email: email,
                },
            });

        } catch (error) {
            console.error("Erro ao cadastrar denunciante:", error);
            if (error.message.includes("den_email_unique") || error.code === '23505') { 
                return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
            }
            return res.status(500).json({ erro: "Erro interno do servidor ao cadastrar." });
        }
    },

    // Função de Login (authenticate) - searchUsers
    async searchUsers(req, res) {
        try {
            const { email, password } = req.body;

            const usuario = await knex("denunciante")
                .where("den_email", email)
                .first();

            if (!usuario) {
                return res.status(400).json({ mensagem: "Usuário não encontrado." });
            }

            const passwordMatch = await bcrypt.compare(password, usuario.den_senha);

            if (!passwordMatch) {
                return res.status(400).json({ mensagem: "Senha incorreta." });
            }

            // Geração do Token JWT
            const token = jwt.sign(
                {
                    idUser: usuario.den_cod, // AQUI DEVE SER O NÚMERO INTEIRO
                    nome: usuario.den_nome,
                    email: usuario.den_email,
                },
                SECRET_KEY,
                { expiresIn: '1h' }
            );

            return res.status(200).json({
                mensagem: "Autenticação realizada com sucesso !!!",
                token: token,
                denunciante: {
                    id: usuario.den_cod,
                    nome: usuario.den_nome,
                    email: usuario.den_email,
                },
            });
        } catch (error) {
            console.error("Erro na autenticação:", error);
            return res.status(500).json({ erro: "Erro interno do servidor." });
        }
    },

    // Listar todos os denunciantes (searchUsersAll)
    async searchUsersAll(req, res) {
        try {
            const denunciantes = await knex("denunciante").select("*");
            return res.status(200).json(denunciantes);
        } catch (error) {
            console.error("Erro ao listar denunciantes:", error);
            return res.status(500).json({ erro: "Erro interno do servidor." });
        }
    },

    // Buscar por email (getByEmail)
    async getByEmail(req, res) {
        try {
            const { email } = req.params;
            const denunciante = await knex("denunciante")
                .where("den_email", email)
                .first();

            if (!denunciante) {
                return res.status(404).json({ erro: "Denunciante não encontrado." });
            }

            return res.status(200).json(denunciante);
        } catch (error) {
            console.error("Erro ao buscar denunciante por email:", error);
            return res.status(500).json({ erro: "Erro interno do servidor." });
        }
    },

    // Função para listar denúncias realizadas pelo denunciante
    async listDenuncias(req, res) {
        try {
            const userId = req.userId; 

            if (!userId) {
                return res.status(401).json({ erro: "ID do usuário não encontrado na requisição. Autenticação falhou." });
            }

            const denuncias = await knex("denuncia")
                .where("den_cod", userId)
                .select("*") 
                .orderBy("denun_data", "desc"); 

            return res.status(200).json(denuncias);

        } catch (error) {
            console.error("Erro ao buscar denúncias do usuário:", error);
            return res.status(500).json({ erro: "Erro interno do servidor ao buscar denúncias." });
        }
    },


    async updateProfile(req, res) {
        try {
            const userId = req.userId;
            const { nome, email, password } = req.body;

            if (!userId) {
                return res.status(401).json({ erro: "Usuário não autenticado." });
            }

            const updateData = {};
            if (nome) updateData.den_nome = nome;
            if (email) updateData.den_email = email;
            
            if (password) {
                updateData.den_senha = await bcrypt.hash(password, 10);
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ erro: "Nenhum dado para atualizar foi fornecido." });
            }

            const updatedRows = await knex("denunciante")
                .where("den_cod", userId)
                .update(updateData);

            if (updatedRows === 0) {
                return res.status(404).json({ erro: "Denunciante não encontrado para atualização." });
            }

            return res.status(200).json({ mensagem: "Perfil atualizado com sucesso!" });

        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            if (error.message.includes("den_email_unique") || error.code === '23505') { 
                return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
            }
            return res.status(500).json({ erro: "Erro interno do servidor ao atualizar perfil." });
        }
    },

    // Função de deletar a conta do denunciante
    async deleteAccount(req, res) {
        try {
            const userId = req.userId;

            if (!userId) {
                return res.status(401).json({ erro: "Usuário não autenticado." });
            }

            await knex("denuncia").where("den_cod", userId).del();

            const deletedRows = await knex("denunciante")
                .where("den_cod", userId)
                .del();

            if (deletedRows === 0) {
                return res.status(404).json({ erro: "Denunciante não encontrado para exclusão." });
            }

            return res.status(200).json({ mensagem: "Conta deletada com sucesso." });

        } catch (error) {
            console.error("Erro ao deletar conta:", error);
            if (error.code === '23503') {
                return res.status(400).json({ erro: "Não foi possível deletar a conta. Existem denúncias associadas que precisam ser removidas primeiro." });
            }
            return res.status(500).json({ erro: "Erro interno do servidor ao deletar conta." });
        }
    },
};