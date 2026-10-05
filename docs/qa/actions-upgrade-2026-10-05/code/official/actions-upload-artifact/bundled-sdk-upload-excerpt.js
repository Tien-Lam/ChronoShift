;// CONCATENATED MODULE: ./node_modules/@actions/artifact/lib/internal/upload/blob-upload.js
var blob_upload_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};






function uploadToBlobStorage(authenticatedUploadURL, uploadStream, contentType) {
    return blob_upload_awaiter(this, void 0, void 0, function* () {
        let uploadByteCount = 0;
        let lastProgressTime = Date.now();
        const abortController = new AbortController();
        const chunkTimer = (interval) => blob_upload_awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const timer = setInterval(() => {
                    if (Date.now() - lastProgressTime > interval) {
                        reject(new Error('Upload progress stalled.'));
                    }
                }, interval);
                abortController.signal.addEventListener('abort', () => {
                    clearInterval(timer);
                    resolve();
                });
            });
        });
        const maxConcurrency = getConcurrency();
        const bufferSize = getUploadChunkSize();
        const blobClient = new BlobClient(authenticatedUploadURL);
        const blockBlobClient = blobClient.getBlockBlobClient();
        core_debug(`Uploading artifact to blob storage with maxConcurrency: ${maxConcurrency}, bufferSize: ${bufferSize}, contentType: ${contentType}`);
        const uploadCallback = (progress) => {
            info(`Uploaded bytes ${progress.loadedBytes}`);
            uploadByteCount = progress.loadedBytes;
            lastProgressTime = Date.now();
        };
        const options = {
            blobHTTPHeaders: { blobContentType: contentType },
            onProgress: uploadCallback,
            abortSignal: abortController.signal
        };
        let sha256Hash = undefined;
        const blobUploadStream = new external_stream_.PassThrough();
        const hashStream = external_crypto_namespaceObject.createHash('sha256');
        uploadStream.pipe(blobUploadStream); // This stream is used for the upload
        uploadStream.pipe(hashStream).setEncoding('hex'); // This stream is used to compute a hash of the content for integrity check
        info('Beginning upload of artifact content to blob storage');
        try {
            yield Promise.race([
                blockBlobClient.uploadStream(blobUploadStream, bufferSize, maxConcurrency, options),
                chunkTimer(getUploadChunkTimeout())
            ]);
        }
        catch (error) {
            if (NetworkError.isNetworkErrorCode(error === null || error === void 0 ? void 0 : error.code)) {
                throw new NetworkError(error === null || error === void 0 ? void 0 : error.code);
            }
            throw error;
        }
        finally {
            abortController.abort();
        }
        info('Finished uploading artifact content to blob storage!');
        hashStream.end();
        sha256Hash = hashStream.read();
        info(`SHA256 digest of uploaded artifact is ${sha256Hash}`);
        if (uploadByteCount === 0) {
            warning(`No data was uploaded to blob storage. Reported upload byte count is 0.`);
        }
        return {
            uploadSize: uploadByteCount,
            sha256Hash
        };
    });
}
//# sourceMappingURL=blob-upload.js.map
;// CONCATENATED MODULE: external "fs/promises"
const promises_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("fs/promises");
// EXTERNAL MODULE: ./node_modules/archiver/index.js
var archiver = __nccwpck_require__(9392);
;// CONCATENATED MODULE: ./node_modules/@actions/artifact/lib/internal/upload/stream.js
var stream_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};





// Custom stream transformer so we can set the highWaterMark property
// See https://github.com/nodejs/node/issues/8855
class WaterMarkedUploadStream extends external_stream_.Transform {
    constructor(bufferSize) {
        super({
            highWaterMark: bufferSize
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _transform(chunk, enc, cb) {
        cb(null, chunk);
    }
}
function createRawFileUploadStream(filePath) {
    return stream_awaiter(this, void 0, void 0, function* () {
        core_debug(`Creating raw file upload stream for: ${filePath}`);
        const bufferSize = getUploadChunkSize();
        const uploadStream = new WaterMarkedUploadStream(bufferSize);
        // Check if symlink and resolve the source path
        let sourcePath = filePath;
        const stats = yield external_fs_.promises.lstat(filePath);
        if (stats.isSymbolicLink()) {
            sourcePath = yield (0,promises_namespaceObject.realpath)(filePath);
        }
        // Create a read stream from the file and pipe it to the upload stream
        const fileStream = external_fs_.createReadStream(sourcePath, {
            highWaterMark: bufferSize
        });
        fileStream.on('error', error => {
            core_error('An error has occurred while reading the file for upload');
            core_error(String(error));
            uploadStream.destroy(new Error('An error has occurred during file read for the artifact'));
        });
        fileStream.pipe(uploadStream);
        return uploadStream;
    });
}
//# sourceMappingURL=stream.js.map
;// CONCATENATED MODULE: ./node_modules/@actions/artifact/lib/internal/upload/zip.js
var zip_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};





const DEFAULT_COMPRESSION_LEVEL = 6;
function createZipUploadStream(uploadSpecification_1) {
    return zip_awaiter(this, arguments, void 0, function* (uploadSpecification, compressionLevel = DEFAULT_COMPRESSION_LEVEL) {
        core_debug(`Creating Artifact archive with compressionLevel: ${compressionLevel}`);
        const zip = archiver.create('zip', {
            highWaterMark: getUploadChunkSize(),
            zlib: { level: compressionLevel }
        });
        // register callbacks for various events during the zip lifecycle
        zip.on('error', zipErrorCallback);
        zip.on('warning', zipWarningCallback);
        zip.on('finish', zipFinishCallback);
        zip.on('end', zipEndCallback);
        for (const file of uploadSpecification) {
            if (file.sourcePath !== null) {
                // Check if symlink and resolve the source path
                let sourcePath = file.sourcePath;
                if (file.stats.isSymbolicLink()) {
                    sourcePath = yield (0,promises_namespaceObject.realpath)(file.sourcePath);
                }
                // Add the file to the zip
                zip.file(sourcePath, {
                    name: file.destinationPath
                });
            }
            else {
                // Add a directory to the zip
                zip.append('', { name: file.destinationPath });
            }
        }
        const bufferSize = getUploadChunkSize();
        const zipUploadStream = new WaterMarkedUploadStream(bufferSize);
        core_debug(`Zip write high watermark value ${zipUploadStream.writableHighWaterMark}`);
        core_debug(`Zip read high watermark value ${zipUploadStream.readableHighWaterMark}`);
        zip.pipe(zipUploadStream);
        zip.finalize();
        return zipUploadStream;
    });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const zipErrorCallback = (error) => {
    core_error('An error has occurred while creating the zip file for upload');
    info(error);
    throw new Error('An error has occurred during zip creation for the artifact');
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const zipWarningCallback = (error) => {
    if (error.code === 'ENOENT') {
        warning('ENOENT warning during artifact zip creation. No such file or directory');
        info(error);
    }
    else {
        warning(`A non-blocking warning has occurred during artifact zip creation: ${error.code}`);
        info(error);
    }
};
const zipFinishCallback = () => {
    core_debug('Zip stream for upload has finished.');
};
const zipEndCallback = () => {
    core_debug('Zip stream for upload has ended.');
};
//# sourceMappingURL=zip.js.map
;// CONCATENATED MODULE: ./node_modules/@actions/artifact/lib/internal/upload/types.js

/**
 * Maps file extensions to MIME types
 */
const types_mimeTypes = {
    // Text
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.csv': 'text/csv',
    '.xml': 'text/xml',
    '.md': 'text/markdown',
    // JavaScript/JSON
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.json': 'application/json',
    // Images
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    // Video
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Archives
    '.zip': 'application/zip',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.rar': 'application/vnd.rar',
    '.7z': 'application/x-7z-compressed',
    // Code/Data
    '.wasm': 'application/wasm',
    '.yaml': 'application/x-yaml',
    '.yml': 'application/x-yaml',
    // Fonts
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.eot': 'application/vnd.ms-fontobject'
};
/**
 * Gets the MIME type for a file based on its extension
 */
function getMimeType(filePath) {
    const ext = external_path_.extname(filePath).toLowerCase();
    return types_mimeTypes[ext] || 'application/octet-stream';
}
//# sourceMappingURL=types.js.map
;// CONCATENATED MODULE: ./node_modules/@actions/artifact/lib/internal/upload/upload-artifact.js
var upload_artifact_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};














function uploadArtifact(name, files, rootDirectory, options) {
    return upload_artifact_awaiter(this, void 0, void 0, function* () {
        let artifactFileName = `${name}.zip`;
        if (options === null || options === void 0 ? void 0 : options.skipArchive) {
            if (files.length === 0) {
                throw new FilesNotFoundError([]);
            }
            if (files.length > 1) {
                throw new Error('skipArchive option is only supported when uploading a single file');
            }
            if (!external_fs_.existsSync(files[0])) {
                throw new FilesNotFoundError(files);
            }
            artifactFileName = external_path_.basename(files[0]);
            name = artifactFileName;
        }
        validateArtifactName(name);
        validateRootDirectory(rootDirectory);
        let zipSpecification = [];
        if (!(options === null || options === void 0 ? void 0 : options.skipArchive)) {
            zipSpecification = getUploadZipSpecification(files, rootDirectory);
            if (zipSpecification.length === 0) {
                throw new FilesNotFoundError(zipSpecification.flatMap(s => (s.sourcePath ? [s.sourcePath] : [])));
            }
        }
        const contentType = getMimeType(artifactFileName);
        // get the IDs needed for the artifact creation
        const backendIds = getBackendIdsFromToken();
        // create the artifact client
        const artifactClient = internalArtifactTwirpClient();
        // create the artifact
        const createArtifactReq = {
            workflowRunBackendId: backendIds.workflowRunBackendId,
            workflowJobRunBackendId: backendIds.workflowJobRunBackendId,
            name,
            mimeType: StringValue.create({ value: contentType }),
            version: 7
        };
        // if there is a retention period, add it to the request
        const expiresAt = getExpiration(options === null || options === void 0 ? void 0 : options.retentionDays);
        if (expiresAt) {
            createArtifactReq.expiresAt = expiresAt;
        }
        const createArtifactResp = yield artifactClient.CreateArtifact(createArtifactReq);
        if (!createArtifactResp.ok) {
            throw new InvalidResponseError('CreateArtifact: response from backend was not ok');
        }
        let stream;
        if (options === null || options === void 0 ? void 0 : options.skipArchive) {
            // Upload raw file without archiving
            stream = yield createRawFileUploadStream(files[0]);
        }
        else {
            // Create and upload zip archive
            stream = yield createZipUploadStream(zipSpecification, options === null || options === void 0 ? void 0 : options.compressionLevel);
        }
        info(`Uploading artifact: ${artifactFileName}`);
        const uploadResult = yield uploadToBlobStorage(createArtifactResp.signedUploadUrl, stream, contentType);
        // finalize the artifact
        const finalizeArtifactReq = {
            workflowRunBackendId: backendIds.workflowRunBackendId,
            workflowJobRunBackendId: backendIds.workflowJobRunBackendId,
            name,
            size: uploadResult.uploadSize ? uploadResult.uploadSize.toString() : '0'
        };
        if (uploadResult.sha256Hash) {
            finalizeArtifactReq.hash = StringValue.create({
                value: `sha256:${uploadResult.sha256Hash}`
            });
        }
        info(`Finalizing artifact upload`);
        const finalizeArtifactResp = yield artifactClient.FinalizeArtifact(finalizeArtifactReq);
        if (!finalizeArtifactResp.ok) {
            throw new InvalidResponseError('FinalizeArtifact: response from backend was not ok');
        }
        const artifactId = BigInt(finalizeArtifactResp.artifactId);
        info(`Artifact ${name} successfully finalized. Artifact ID ${artifactId}`);
        return {
            size: uploadResult.uploadSize,
            digest: uploadResult.sha256Hash,
            id: Number(artifactId)
        };
    });
}
//# sourceMappingURL=upload-artifact.js.map
;// CONCATENATED MODULE: ./node_modules/@actions/github/lib/context.js


class Context {
    /**
     * Hydrate the context from the environment
     */
    constructor() {
        var _a, _b, _c;
        this.payload = {};
        if (process.env.GITHUB_EVENT_PATH) {
            if ((0,external_fs_.existsSync)(process.env.GITHUB_EVENT_PATH)) {
                this.payload = JSON.parse((0,external_fs_.readFileSync)(process.env.GITHUB_EVENT_PATH, { encoding: 'utf8' }));
            }
            else {
                const path = process.env.GITHUB_EVENT_PATH;
                process.stdout.write(`GITHUB_EVENT_PATH ${path} does not exist${external_os_.EOL}`);
            }
        }
        this.eventName = process.env.GITHUB_EVENT_NAME;
        this.sha = process.env.GITHUB_SHA;
        this.ref = process.env.GITHUB_REF;
