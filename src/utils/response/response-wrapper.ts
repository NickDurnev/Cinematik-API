import { ResponseCode, ResponseStatus, ResponseWrapper } from "@/types";

export function buildResponse<T>(
  data: T,
  code: ResponseCode = ResponseCode.OK,
  message = "Request successful",
  status: ResponseStatus = "success",
): ResponseWrapper<T> {
  return { data, code, message, status };
}
