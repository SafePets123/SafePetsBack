require('dotenv').config();

const config = {
    development:{
        client:'postgresql',
        connection: process.env.DATABASE_URL,
    }
}   

module.exports = config;