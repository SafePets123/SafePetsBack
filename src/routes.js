const express = require('express');
const denuncianteController = require('./controllers/denuncianteController'); // Use o arquivo final
const ongController = require('./controllers/ongControllers');
const orgaoController = require('./controllers/orgaoControllers'); // Use o arquivo final
const denunciasController = require('./controllers/denuncias'); // Seu controlador de denúncias (para createDenuncia e updateProfile)

const authorization = require('./middleware/authorization'); // Seu middleware

const routes = express.Router();

// Rotas para Denunciante
routes.get('/user', authorization, denuncianteController.searchUsersAll)
routes.post('/user', denuncianteController.create);
routes.post('/userauth', denuncianteController.searchUsers);
routes.get('/userauth/:email', denuncianteController.getByEmail);

routes.put('/user/profile', denunciasController.updateProfile);

// ROTA CORRIGIDA PARA DENUNCIANTE (HISTÓRICO)
// O middleware 'authorization' é necessário para injetar o req.userId
// A função listDenuncias está agora no denuncianteController
routes.get('/denuncias/minhas', authorization, denuncianteController.listDenuncias); 

routes.post('/denuncias', authorization, denunciasController.createDenuncia);


// Rotas para ONG
routes.post('/ong/cadastro', ongController.create);
routes.post('/ong/login', ongController.searchOngs);
routes.get('/ong/all', authorization, ongController.searchOngsAll);
routes.get('/ong/:email', ongController.getByEmail);


// Rotas para Órgão
routes.post('/orgao/cadastro', orgaoController.create);
routes.post('/orgao/login', orgaoController.searchOrgaos);
routes.get('/orgao/all', authorization, orgaoController.searchOrgaosAll);
routes.get('/orgao/:email', orgaoController.getByEmail);

// NOVA ROTA PARA AUTORIDADES (TODAS AS DENÚNCIAS)
// A função listAllDenuncias está agora no orgaoController
routes.get('/denuncias/todas', authorization, orgaoController.listAllDenuncias);

module.exports = routes;