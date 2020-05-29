import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getTodos } from '../../businessLogic/todos';
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  handler.use(
    cors({
      credentials: true
    })
  )

  return {
    statusCode: 200, //OK
    body: JSON.stringify({
      items: await getTodos(event)
    })
  };
})