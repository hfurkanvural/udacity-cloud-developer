import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deleteTodo } from '../../businessLogic/todos';
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  if (!(await deleteTodo(event))) {
    return {
      statusCode: 404, //Not Found
      body: JSON.stringify({
        error: 'Todo not found'
      })
    };
  }

  handler.use(
    cors({
      credentials: true
    })
  )

  return {
    statusCode: 202, //Accepted
    body: JSON.stringify({})
  };
})