const jwt = require('jsonwebtoken')
const {JWT_ACCESS_SECRET} = process.env;

exports.printMsg = () => {
    console.log('Koala JWT Express')
}

module.exports = class JWT {
    constructor(issuer, expire = false, redirect) {
        if(!JWT_ACCESS_SECRET) return new TypeError('missing JWT_ACCESS_SECRET enviroment variable');
        if(typeof issuer !== 'string') return new TypeError('issuer is typeof string');
        if(redirect && typeof redirect !== 'string') return new TypeError('redirect is typeof string');
        if(expire && typeof expire !== 'number') return new TypeError('expire is typeof number');
        
        this._issuer = issuer;
        this._expire = expire;
        this._redirect = redirect;
        if(issuer) this._whitelist = [issuer]; // is whitelist is 
    }

    setWhiteList(whitelist) {
        if(!Array.isArray(whitelist)) {
            return new TypeError('whitelist needs to be an array');
        }

        if(this._whitelist) {
            this._whitelist = [...this._whitelist, ...whitelist].filter((value, index, self) => self.indexOf(value) === index);
        } else {
            this._whitelist = whitelist;
        }
    }

    authentication = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if(authHeader) {
            const token = authHeader.split(' ')[1];

            jwt.verify(token, JWT_ACCESS_SECRET, (err, user) => {
                if(err) return res.sendStatus(403);
                req.user = user;
                next();
            });
        } else {
            res.sendStatus(401);
        }
    }
    authorization = (req, res, next) => {
        let {user, role, iss} = req.user;
        if(this._whitelist[iss] && this._whitelist[iss][role]) {
            res.status(200);
            next();
        } else {
            res.sendStatus(404);
        }
    }
    signUser(user, role) {
        const token = jwt.sign({user, role, iss: this._issuer}, JWT_ACCESS_SECRET);
        return token;
    }

    verify = (req, res, next) => {
        try {
            let {token} = req.method == 'POST' ? req.body : req.params;
            let decoded = jwt.verify(token, JWT_ACCESS_SECRET);
            if(!this._whitelist || (this._whitelist && this._whitelist.indexOf(decoded.iss) !== -1)) {
                res.send(decoded);
                next();
            } else {
                res.send(new TypeError('JWT Issuer not whitelisted'));
            }
        } catch(e) {
            res.send(new TypeError('Unable to verify JWT'));
        }
    }
}