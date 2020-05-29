import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CreateTodoRequest } from '../../requests/CreateTodoRequest';
import { createTodo } from '../../businessLogic/todos';
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body);

  if (!newTodo.name) {
    return {
      statusCode: 400, //Bad Request
      body: JSON.stringify({
        error: 'Todo input criteria faulty'
      })
    };
  }

  handler.use(
    cors({
      credentials: true
    })
  )

  const todoItem = await createTodo(event, newTodo);

  return {
    statusCode: 201, //Created
    body: JSON.stringify({
      item: todoItem
    })
  };
})