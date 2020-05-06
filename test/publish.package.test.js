/* eslint-disable no-param-reassign */

'use strict';

const { test, beforeEach, afterEach } = require('tap');
const fastify = require('fastify');
const EikService = require('@eik/service');
const { sink } = require('@eik/core');
const { mockLogger } = require('./utils');
const cli = require('..');

beforeEach(async (done, t) => {
    const memSink = new sink.MEM();
    const server = fastify({ logger: false });
    const service = new EikService({ customSink: memSink });
    server.register(service.api());
    const address = await server.listen();
    
    const login = new cli.Login({
        server: address,
        key: 'change_me',
    });
    const token = await login.run();
    
    t.context.server = server;
    t.context.address = address;
    t.context.token = token;
    done();
});

afterEach(async (done, t) => {
    await t.context.server.close();
    done();
});

test('Uploading app assets to an asset server', async t => {
    const { address, token } = t.context;
    const l = mockLogger();

    const publishApp = new cli.publish.Package({
        logger: l.logger,
        cwd: __dirname,
        server: address,
        name: 'my-app',
        version: '1.0.0',
        js: './fixtures/client.js',
        css: './fixtures/styles.css',
        debug: true,
        token,
    });

    const result = await publishApp.run();
    t.equals(result, true, 'Command should return true');
    t.match(
        l.logs.debug,
        ':: pkg my-app v1.0.0',
        'Log output should show published name and version',
    );
    t.match(
        l.logs.info,
        'Published app package "my-app" at version "1.0.0"',
        'Log output should command completion',
    );
});

test('Uploading JS app assets only to an asset server', async t => {
    const { address, token } = t.context;
    const l = mockLogger();

    const publishApp = new cli.publish.Package({
        logger: l.logger,
        cwd: __dirname,
        server: address,
        name: 'my-app',
        version: '1.0.0',
        js: './fixtures/client.js',
        debug: true,
        token,
    });

    const result = await publishApp.run();
    t.equals(result, true, 'Command should return true');
    t.match(
        l.logs.debug,
        'CSS entrypoint not defined, skipping CSS bundling',
        'Log output should show that CSS bundling was skipped',
    );
    t.match(
        l.logs.info,
        'Published app package "my-app" at version "1.0.0"',
        'Log output should command completion',
    );
});

test('Uploading CSS app assets only to an asset server', async t => {
    const { address, token } = t.context;
    const l = mockLogger();

    const publishApp = new cli.publish.Package({
        logger: l.logger,
        cwd: __dirname,
        server: address,
        name: 'my-app',
        version: '1.0.0',
        css: './fixtures/styles.css',
        debug: true,
        token,
    });

    const result = await publishApp.run();
    t.equals(result, true, 'Command should return true');
    t.match(
        l.logs.debug,
        'JavaScript entrypoint not defined, skipping JS bundling',
        'Log output should show that JS bundling was skipped',
    );
    t.match(
        l.logs.info,
        'Published app package "my-app" at version "1.0.0"',
        'Log output should command completion',
    );
});