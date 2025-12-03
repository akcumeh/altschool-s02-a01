const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 2011;
const src = path.join(__dirname, 'items.json');

function load() {
    if (!fs.existsSync(src)) {
        fs.writeFileSync(src, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(src, 'utf-8'));
}

function save(items) {
    fs.writeFileSync(src, JSON.stringify(items, null, 2));
}

function respond(res, code, data) {
    res.writeHead(code, { 'content-type': 'application/json' });
    res.end(JSON.stringify(data));
}

function validate(item) {
    const validSizes = ['small', 'medium', 'large'];

    if (!item.name || !item.price || !item.size) {
        return { valid: false, error: 'Missing one or more of the required fields: name, price, size' };
    }

    if (!validSizes.includes(item.size)) {
        return { valid: false, error: 'Size must be small, medium, or large' };
    }

    return { valid: true };
}

function getAll(req, res) {
    const items = load();
    respond(res, 200, items);
}

function getOne(req, res) {
    const items = load();
    const id = req.url.split('/')[2];
    const item = items.find(i => i.id === id);

    if (item) {
        respond(res, 200, item);
    } else {
        respond(res, 404, { error: 'Item not found' });
    }
}

function create(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const items = load();
            const newItem = JSON.parse(body);

            const validation = validate(newItem);
            if (!validation.valid) {
                respond(res, 400, { error: validation.error });
                return;
            }

            newItem.id = Date.now().toString();
            items.push(newItem);
            save(items);
            respond(res, 201, newItem);
        } catch (e) {
            respond(res, 400, { error: 'Invalid JSON' });
        }
    });
}

function update(req, res) {
    const id = req.url.split('/')[2];
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const items = load();
            const index = items.findIndex(i => i.id === id);

            if (index === -1) {
                respond(res, 404, { error: 'Item not found' });
                return;
            }

            const updateData = JSON.parse(body);
            const updatedItem = { ...items[index], ...updateData, id };

            const validation = validate(updatedItem);
            if (!validation.valid) {
                respond(res, 400, { error: validation.error });
                return;
            }

            items[index] = updatedItem;
            save(items);
            respond(res, 200, updatedItem);
        } catch (e) {
            respond(res, 400, { error: 'Invalid JSON' });
        }
    });
}

function remove(req, res) {
    const id = req.url.split('/')[2];
    const items = load();
    const index = items.findIndex(i => i.id === id);

    if (index !== -1) {
        items.splice(index, 1);
        save(items);
        respond(res, 200, { message: 'Item deleted' });
    } else {
        respond(res, 404, { error: 'Item not found' });
    }
}

const handler = async function (req, res) {
    const { method, url } = req;

    if (url === '/items' && method === 'GET') {
        getAll(req, res);
    } else if (url === '/items' && method === 'POST') {
        create(req, res);
    } else if (url.startsWith('/items/') && method === 'GET') {
        getOne(req, res);
    } else if (url.startsWith('/items/') && method === 'PUT') {
        update(req, res);
    } else if (url.startsWith('/items/') && method === 'DELETE') {
        remove(req, res);
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: 'Route not found' }));
    }
};

const server = http.createServer(handler);

server.listen(port, () => {
    console.log(`API now on http://localhost:${port}`);
});