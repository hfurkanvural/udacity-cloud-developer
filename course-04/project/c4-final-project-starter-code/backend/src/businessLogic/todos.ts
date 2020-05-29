import 'source-map-support/register';
import * as uuid from 'uuid';
import { APIGatewayProxyEvent } from 'aws-lambda';

import TodoAccess from '../dataLayer/todoAccess';
import BucketAccess from '../dataLayer/bucketAccess';
import { getUserId } from '../lambda/utils';
import { CreateTodoRequest } from '../requests/CreateTodoRequest';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import { TodoItem } from '../models/TodoItem';
import { createLogger } from '../utils/logger'

const todoAccess = new TodoAccess();
const bucketAccess = new BucketAccess();
const logger = createLogger('businessLogic');

export async function createTodo(event: APIGatewayProxyEvent,
                                 createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
  const todoId = uuid.v4();
  const userId = getUserId(event);
  const createdAt = new Date(Date.now()).toISOString();

  const todoItem = {
    userId,
    todoId,
    createdAt,
    done: false,
    attachmentUrl: `https://${bucketAccess.getBucketName()}.s3.amazonaws.com/${todoId}`,
    ...createTodoRequest
  };

  logger.info('Creating new todo item');
  await todoAccess.addTodo(todoItem);

  return todoItem;
}

export async function getTodo(event: APIGatewayProxyEvent) {
  const todoId = event.pathParameters.todoId;
  const userId = getUserId(event);

  return await todoAccess.getTodo(todoId, userId);
}

export async function getTodos(event: APIGatewayProxyEvent) {
  const userId = getUserId(event);

  return await todoAccess.getAllTodos(userId);
}

export async function updateTodo(event: APIGatewayProxyEvent,
                                 updateTodoRequest: UpdateTodoRequest) {
  const todoId = event.pathParameters.todoId;
  const userId = getUserId(event);

  if (!(await todoAccess.getTodo(todoId, userId))) {
    return false;
  }

  logger.info('Updating todo item');
  await todoAccess.updateTodo(todoId, userId, updateTodoRequest);

  return true;
}

export async function deleteTodo(event: APIGatewayProxyEvent) {
  const todoId = event.pathParameters.todoId;
  const userId = getUserId(event);

  if (!(await todoAccess.getTodo(todoId, userId))) {
    return false;
  }

  logger.info('Deleting todo item');
  await todoAccess.deleteTodo(todoId, userId);

  return true;
}

export async function generateUploadUrl(event: APIGatewayProxyEvent) {
  const bucket = bucketAccess.getBucketName();
  const urlExpiration = process.env.SIGNED_URL_EXPIRATION;
  const todoId = event.pathParameters.todoId;

  const createSignedUrlRequest = {
    Bucket: bucket,
    Key: todoId,
    Expires: urlExpiration
  }

  logger.info('Generated Upload URL');
  return bucketAccess.getPresignedUploadURL(createSignedUrlRequest);
}