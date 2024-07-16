const fastify = require('fastify')({ logger: true })
const { Password, User } = require('./include/passwords');

fastify.get('/', async (request, reply) => {
    return { hello: 'world' }
});

fastify.post('/testhash' , async (request, reply) => {
    var password = new Password(request.body.password || 'password');
    var hash = await password.hashPassword();
    return { hash: hash };
});

fastify.post('/register', async (request, reply) => {
    var user = new User(request.body.username, request.body.password);
    var hash = await user.hashPassword();
    var exists = await user.exists(user.username); 
    if (!exists) {
        user.register().then(result => {
            console.log(result);
            return { result: result };
        }).catch(err => {
            return { error: err };
        });
    } else {
        return { error: 'User already exists' };
    }
});

fastify.post('/login', async (request, reply) => {
    try {
        var user = new User(request.body.username, request.body.password);
        return await user.login();
    } catch (err) {
        return { error: err };
    }
});
fastify.listen({ port: 3000 }, (err) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    fastify.log.info(`server listening on ${fastify.server.address().port}`);
});