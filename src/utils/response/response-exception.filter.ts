import {
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

import { ResponseCode, ResponseStatus } from "@/types";

import { buildResponse } from "./response-wrapper";

function mapStatusToResponseCode(status: number): ResponseCode {
  if (status === ResponseCode.OK) {
    return ResponseCode.OK;
  }
  if (status === ResponseCode.CREATED) {
    return ResponseCode.CREATED;
  }
  if (status === ResponseCode.BAD_REQUEST) {
    return ResponseCode.BAD_REQUEST;
  }
  if (status === ResponseCode.UNAUTHORIZED) {
    return ResponseCode.UNAUTHORIZED;
  }
  // Add more mappings as needed
  return ResponseCode.BAD_REQUEST;
}

@Catch()
class ResponseExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: import("@nestjs/common").ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let code: ResponseCode = ResponseCode.BAD_REQUEST;
    let errorResponse: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
      } else if (typeof res === "object" && res !== null) {
        errorResponse = res as Record<string, unknown>;
        if (
          "message" in errorResponse &&
          typeof errorResponse.message === "string"
        ) {
          message = errorResponse.message;
        }
      }
      code = mapStatusToResponseCode(status);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json(
      buildResponse({
        data: null,
        code,
        message,
        status: "error" as ResponseStatus,
      }),
    );
  }
}

export default ResponseExceptionFilter;
