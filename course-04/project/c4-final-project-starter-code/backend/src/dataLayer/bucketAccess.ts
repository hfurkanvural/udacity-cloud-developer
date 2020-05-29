import { CreateSignedURLRequest } from "../requests/CreateSignedUrlRequest";
import * as AWSXRay from 'aws-xray-sdk'
import * as AWS from 'aws-sdk';

const XAWS = AWSXRay.captureAWS(AWS);

export default class BucketAccess {
    constructor(
        private readonly todosStorage = process.env.IMAGES_S3_BUCKET,
        private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' })) {
    }
    getBucketName() {
        return this.todosStorage;
    }

    getPresignedUploadURL(createSignedUrlRequest: CreateSignedURLRequest) {
        return this.s3.getSignedUrl('putObject', createSignedUrlRequest);
    }
}