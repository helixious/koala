# Koala - Node.js Express JWT Middleware.

User Authorization and Role based Authorization Express Middleware.

## Installation

```
$ npm i koala-express-jwt
```

## Requirements
- Express
- Body-parser

## Example
```js
const JWTExpress = require('koala-express-jwt');
const mainJWT = new JWTExpress('main_portal');
const bodyParser = require('body-parser');

const app = Express();

const users = [{
    user:'john_doe',
    pass: 'test',
    iss: {
        main: {
            user: true,
            broker: true
        },
        car_insurance: {
            admin: true
        }
    }
}];

const mainWebService = {
    iss: 'main', 
    roles: ['admin', 'user', 'broker', 'agent']
};
const carWebService = {
    iss: 'car_insurance',
    roles: ['admin', 'user', 'agent']
};
const estateWebService = {
    iss: 'real_estate',
    roles: ['admin', 'broker']
};
const lifeWebService = {
    iss: 'life_insurance',
    roles: ['admin', 'agent']
}

mainJWT.setWhiteList([
   mainWebService,
   carWebService,
   estateWebService,
   lifeWebService 
]);

app.use(bodyParser.json());

// two ways to verify token
app.get('/api/v1/verify/:token', mainJWT.verify);
app.post('/api/v1/verify', mainJWT.verify);


// login flow
app.post('/api/v1/login/', (req, res) => {
    let { user, pass } = req.body;
    if(!user || !pass) return res.status(400).send('missing user or pass');

    // use appropriate method to authenticate user.
    let authUser = user && pass ? users.filter((u) => u.user === user && u.pass === pass).pop() : false;
    
    if(authUser) {
        // requires user and role to generate token
        let token = mainJWT.signUser(authUser.user, authUser.role);
        res.set('authorization', `Bearer: ${token}`);
        res.json({token});
    } else {
        res.sendStatus(403);
    }
});


/*
1) request header authorization: "Bearer <token>" required
2) make sure the webservice {iss, roles} is included with .setWhiteList()
*/

app.get('/api/v1/main', mainJWT.authentication, mainJWT.authorization, (req, res) => {
    res.send('OK');
});

app.listen(3000);

```
