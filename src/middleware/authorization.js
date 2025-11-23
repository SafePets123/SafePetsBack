const jwt = require('jsonwebtoken');

// A chave secreta usada para gerar o token
const SECRET_KEY = 'ndskvbjksdvnlkjsdbvljk'; 

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).send({ error: 'Requisição sem token' });
        }
        
        const partsToken = authHeader.split(' ');
        
        if (partsToken.length !== 2 || !/^Bearer$/i.test(partsToken[0])) {
            return res.status(401).send({ error: 'Token fora do padrão esperado (deve ser Bearer <token>)' }); 
        }
        
        const token = partsToken[1];
        
        // 1. Verifica e decodifica o token
        const decode = jwt.verify(token, SECRET_KEY);
        
        // 2. CORREÇÃO FINAL: Injeta o ID do usuário na requisição
        req.userId = decode.idUser; 
        
        // 3. Continua para o próximo middleware/controlador
        next();
        
    } catch (error) {
        // Trata qualquer erro na verificação do token (expirado, inválido, etc.)
        return res.status(401)
        .send({ error: 'Falha na autenticação. Token inválido ou expirado.' }); 
    }
};
