import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios';
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')
const jwksUrl = 'https://dev-5oe3-5xq.eu.auth0.com/.well-known/jwks.json'


export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader);
  const jwt: Jwt = decode(token, { complete: true }) as Jwt;
  let cert: string | Buffer;

  try {
    const jwks = await Axios.get(jwksUrl);
    if(!jwks) {
      logger.error('jwks retrieval problem');
    }
    const signingKey = jwks.data.keys.filter((k: { kid: string; }) => k.kid === jwt.header.kid)[0];

    if (!signingKey) {
      const error = new Error(`Could not extract matching signing key '${jwt.header.kid}'`);
      logger.error('Sign Key problem', { error: error });
      throw error;
    }

    let pem: string = signingKey.x5c[0];
    cert = pem.match(/.{1,64}/g).join('\n');
    cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;

  } catch (error) {
    logger.error('Certificate extraction failed : ', { error: error });
  }

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload;
}

function getToken(authHeader: string): string {
  if (!authHeader) {
    const error = new Error('No authentication header')
    logger.error('Authentication header missing', { error: error });
    throw error;
  }

  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    const error = new Error('Authentication header not valid')
    logger.error('Authentication header not valid', { error: error });
    throw error;
  }
  const split = authHeader.split(' ')
  const token = split[1]

  return token
}