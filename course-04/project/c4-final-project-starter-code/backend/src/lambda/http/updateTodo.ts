import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { updateTodo }  from '../../businessLogic/todos';
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest';
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body);

  const updated = await updateTodo(event, updatedTodo);
  if (!updated) {
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
    statusCode: 200, //OK
    body: JSON.stringify({})
  }
})