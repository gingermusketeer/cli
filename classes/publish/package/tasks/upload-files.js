/* eslint-disable no-param-reassign */

'use strict';

const { join } = require('path');
const { request } = require('../../../../utils/http');
const Task = require('./task');

module.exports = class UploadFiles extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { log } = this;
        const { server, token, name, zipFile, version } = incoming;
        log.debug('Uploading zip file to server');
        try {
            const { message } = await request({
                method: 'PUT',
                host: server,
                pathname: join(
                    'pkg',
                    encodeURIComponent(name),
                    version,
                ),
                file: zipFile,
                token,
            });

            outgoing.created = message.created;
            outgoing.author = message.author;
            outgoing.integrity = message.integrity;
            outgoing.org = message.org;
            outgoing.files = message.files;
            outgoing.version = version;

        } catch (err) {
            log.error('Unable to upload zip file to server');
            switch (err.statusCode) {
                case 400:
                    throw new Error(
                        'Client attempted to send an invalid URL parameter',
                    );
                case 401:
                    throw new Error('Client unauthorized with server');
                case 409:
                    throw new Error(
                        `Package with name "${name}" and version "${version}" already exists on server`,
                    );
                case 415:
                    throw new Error(
                        'Client attempted to send an unsupported file format to server',
                    );
                case 502:
                    throw new Error(
                        'Server was unable to write file to storage',
                    );
                default:
                    throw new Error('Server failed');
            }
        }
        return outgoing;
    }
};
